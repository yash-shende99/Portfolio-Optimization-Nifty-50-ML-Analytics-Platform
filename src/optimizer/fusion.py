import os
import pandas as pd
import numpy as np
import logging
import yaml
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def rl_contextual_bandit(regime_probs, cov_df, latest_prices=None):
    """
    Lightweight Thompson Sampling / Contextual Bandit approximation.
    Observes state (regime, portfolio volatility) and adjusts the risk tolerance penalty.
    """
    bear_prob = regime_probs.get('bear_prob', 0)
    bull_prob = regime_probs.get('bull_prob', 0)
    
    # State 1: Market Regime severity
    regime_penalty = bear_prob * 1.5 - bull_prob * 0.5
    
    # State 2: Recent Volatility Shock (Trace of covariance)
    market_vol = np.sqrt(np.trace(cov_df.values) / len(cov_df))
    vol_penalty = 0.0
    if market_vol > 0.25: # High vol regime (25%+)
        vol_penalty = 1.0
        
    # Reward approximation: Reduce risk if bear is high or vol is spiking
    # Base lambda is 1.0
    dynamic_lambda = 1.0 + regime_penalty + vol_penalty
    
    # Clip between 0.1 (very aggressive) and 5.0 (very defensive)
    return np.clip(dynamic_lambda, 0.1, 5.0)

def fuse_predictions():
    """
    Fuses predictions from Return Predictor, Volatility Forecaster, and Regime Detector.
    Returns:
        - mu (pd.Series): Expected returns
        - cov (pd.DataFrame): Covariance matrix
        - risk_aversion (float): Dynamic risk aversion lambda based on RL
    """
    logger.info("Fusing predictions from all models...")
    
    config = load_config()
    data_dir = Path("data/processed")
    
    try:
        # Load returns
        logger.info("Loading return predictions...")
        df_returns = pd.read_csv(data_dir / "latest_predictions.csv")
        latest_date = df_returns['date'].max()
        df_latest_returns = df_returns[df_returns['date'] == latest_date]
        mu = df_latest_returns.set_index('ticker')['predicted_return']
        
        # Load covariance
        logger.info("Loading covariance matrix...")
        cov = pd.read_csv(data_dir / "covariance.csv", index_col=0)
        
        # Load regime
        logger.info("Loading regime probabilities...")
        df_regime = pd.read_csv(data_dir / "latest_regime.csv")
        regime_probs = df_regime.iloc[0].to_dict()
        
        # RL Dynamic Risk Governor
        risk_aversion = rl_contextual_bandit(regime_probs, cov)
        logger.info(f"RL Bandit dynamically set Risk Aversion to: {risk_aversion:.2f}")
        
        # Align tickers
        common_tickers = list(set(mu.index) & set(cov.index))
        mu = mu.loc[common_tickers]
        cov = cov.loc[common_tickers, common_tickers]
        
        logger.info(f"Fusion complete for {len(common_tickers)} assets.")
        return mu, cov, risk_aversion
        
    except Exception as e:
        logger.error(f"Error during fusion: {e}")
        return None, None, 1.0

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    mu, cov, lam = fuse_predictions()
    if mu is not None:
        logger.info(f"Expected returns shape: {mu.shape}")
        logger.info(f"Covariance matrix shape: {cov.shape}")
        logger.info(f"Risk Aversion Lambda: {lam}")
