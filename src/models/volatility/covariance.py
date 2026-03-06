import os
import pandas as pd
import numpy as np
import logging
from pathlib import Path
from sklearn.covariance import ShrunkCovariance, LedoitWolf

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def estimate_covariance(df_daily: pd.DataFrame, window: int = 252):
    """
    Estimates the covariance matrix for the next month using Ledoit-Wolf shrinkage.
    Uses daily returns from a rolling window (default 1 year).
    Returns an annualized covariance matrix.
    """
    if 'daily_return' not in df_daily.columns:
        df_daily['daily_return'] = df_daily.groupby('ticker')['adjusted_close'].pct_change()
        
    df_daily = df_daily.dropna(subset=['daily_return']).copy()
    
    # Pivot to get a matrix of returns: rows = dates, cols = tickers
    returns_matrix = df_daily.pivot(index='date', columns='ticker', values='daily_return')
    
    # Get last `window` days
    recent_returns = returns_matrix.tail(window).dropna(axis=1, how='any') # Drop tickers with missing data in window
    
    logger.info(f"Estimating Covariance Matrix using Ledoit-Wolf shrinkage on {recent_returns.shape[1]} tickers over {recent_returns.shape[0]} days.")
    
    if recent_returns.empty:
        logger.error("No valid returns data to estimate covariance.")
        return None
        
    lw = LedoitWolf()
    lw.fit(recent_returns.values)
    
    # Annualized covariance matrix
    cov_matrix = lw.covariance_ * 252
    
    cov_df = pd.DataFrame(cov_matrix, index=recent_returns.columns, columns=recent_returns.columns)
    
    out_path = "data/processed/covariance.csv"
    cov_df.to_csv(out_path)
    logger.info(f"Covariance matrix saved to {out_path}. Shape: {cov_df.shape}")
    
    return cov_df

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    
    clean_path = "data/processed/clean_prices.csv"
    if os.path.exists(clean_path):
        df_clean = pd.read_csv(clean_path)
        df_clean['date'] = pd.to_datetime(df_clean['date'])
        estimate_covariance(df_clean, window=252) # 1 year window for covariance
    else:
        logger.error(f"Required clean data not found at {clean_path}")
