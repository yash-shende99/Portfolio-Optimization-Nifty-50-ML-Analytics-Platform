import os
import pandas as pd
import numpy as np
import logging
import joblib
import yaml
from pathlib import Path
from hmmlearn import hmm
from sklearn.preprocessing import StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def train_hmm():
    config = load_config()
    n_states = config["model"]["regime"]["n_states"]
    model_path = config["model"]["regime"]["model_path"]
    
    clean_path = "data/processed/clean_prices.csv"
    if not os.path.exists(clean_path):
        logger.error(f"Clean prices not found at {clean_path}")
        return
        
    df = pd.read_csv(clean_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # We use ^NSEI (Nifty 50) as our market proxy for regimes
    index_ticker = "^NSEI"
    if index_ticker not in df['ticker'].unique():
        # Fallback to the first ticker if Nifty isn't there (for testing)
        index_ticker = df['ticker'].iloc[0]
        
    logger.info(f"Extracting market features using {index_ticker} for Regime Detection")
    df_idx = df[df['ticker'] == index_ticker].copy()
    
    # Compute daily returns
    df_idx['daily_return'] = df_idx['adjusted_close'].pct_change()
    
    # Compute monthly features: monthly return and monthly realized volatility
    df_idx['year_month'] = df_idx['date'].dt.to_period('M')
    
    def calc_monthly_features(group):
        ret = group['adjusted_close'].iloc[-1] / group['adjusted_close'].iloc[0] - 1
        vol = group['daily_return'].std() * np.sqrt(252)
        return pd.Series({'monthly_return': ret, 'monthly_volatility': vol})
        
    df_monthly = df_idx.groupby('year_month').apply(calc_monthly_features).dropna()
    
    # Prepare features for HMM
    features = ['monthly_return', 'monthly_volatility']
    X = df_monthly[features].values
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    logger.info(f"Training HMM with {n_states} states on {len(X_scaled)} monthly observations...")
    # Train HMM
    model = hmm.GaussianHMM(n_components=n_states, covariance_type="full", n_iter=1000, random_state=42)
    model.fit(X_scaled)
    
    # Sort states by mean return to identify bear, normal, bull
    # Lower mean return -> bear regime
    means_ret = model.means_[:, 0]
    sorted_idx = np.argsort(means_ret)
    
    # re-map states: 0: bear, 1: normal, 2: bull
    # In hmmlearn, we can't easily swap internal params cleanly without manual assignment,
    # so we will just save the mapping.
    state_map = {original: new for new, original in enumerate(sorted_idx)}
    
    Path(model_path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "scaler": scaler, "state_map": state_map}, model_path)
    logger.info(f"HMM model and scaler saved to {model_path}")
    logger.info(f"State map (original -> sorted [0=bear, higher=bull]): {state_map}")

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    train_hmm()
