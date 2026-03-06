import os
import pandas as pd
import numpy as np
import logging
import joblib
import yaml
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def predict_regime():
    config = load_config()
    model_path = config["model"]["regime"]["model_path"]
    
    if not os.path.exists(model_path):
        logger.error(f"HMM model not found at {model_path}. Train the model first.")
        return
        
    logger.info("Loading HMM model...")
    artifacts = joblib.load(model_path)
    model = artifacts["model"]
    scaler = artifacts["scaler"]
    state_map = artifacts["state_map"]
    
    n_states = config["model"]["regime"]["n_states"]
    
    clean_path = "data/processed/clean_prices.csv"
    df = pd.read_csv(clean_path)
    df['date'] = pd.to_datetime(df['date'])
    
    index_ticker = "^NSEI"
    if index_ticker not in df['ticker'].unique():
        index_ticker = df['ticker'].iloc[0]
        
    df_idx = df[df['ticker'] == index_ticker].copy()
    df_idx['daily_return'] = df_idx['adjusted_close'].pct_change()
    df_idx['year_month'] = df_idx['date'].dt.to_period('M')
    
    def calc_monthly_features(group):
        ret = group['adjusted_close'].iloc[-1] / group['adjusted_close'].iloc[0] - 1
        vol = group['daily_return'].std() * np.sqrt(252)
        return pd.Series({'monthly_return': ret, 'monthly_volatility': vol})
        
    df_monthly = df_idx.groupby('year_month').apply(calc_monthly_features).dropna()
    
    features = ['monthly_return', 'monthly_volatility']
    X = df_monthly[features].values
    X_scaled = scaler.transform(X)
    
    # Predict probabilities for the latest month
    # HMM predict_proba gives the posterior probabilities of the states
    probs = model.predict_proba(X_scaled)
    latest_probs = probs[-1]
    
    # Re-map probabilities according to our sorted state map (0=bear, 1=normal, 2=bull)
    mapped_probs = np.zeros(n_states)
    for orig, new in state_map.items():
        mapped_probs[new] = latest_probs[orig]
        
    # Assume 3 states for logging
    if n_states == 3:
        logger.info(f"Regime Probabilities: Bear: {mapped_probs[0]:.2%}, Normal: {mapped_probs[1]:.2%}, Bull: {mapped_probs[2]:.2%}")
    
    # Output to dataframe
    # We can create a dummy date for the latest month
    latest_date = df_idx['date'].max()
    res = {
        'date': latest_date,
        'bear_prob': mapped_probs[0],
        'normal_prob': mapped_probs[1] if n_states > 1 else 0,
        'bull_prob': mapped_probs[2] if n_states > 2 else 0
    }
    
    df_res = pd.DataFrame([res])
    out_path = "data/processed/latest_regime.csv"
    df_res.to_csv(out_path, index=False)
    logger.info(f"Regime prediction saved to {out_path}")
    return df_res

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    predict_regime()
