import pandas as pd
import numpy as np
import logging
import os
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean raw historical data.
    - Convert date to datetime.
    - Sort values.
    - Forward fill missing prices.
    """
    logger.info("Cleaning raw price data...")
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(by=['ticker', 'date']).reset_index(drop=True)
    
    # Forward fill missing values grouped by ticker
    cols_to_fill = [c for c in df.columns if c not in ['ticker', 'date']]
    df[cols_to_fill] = df.groupby('ticker')[cols_to_fill].ffill()
    
    # Drop where adjusted close is still null
    df = df.dropna(subset=['adjusted_close']).reset_index(drop=True)
    
    return df

def compute_returns(df: pd.DataFrame, risk_free_rate: float = 0.0) -> pd.DataFrame:
    """
    Compute daily and monthly returns based on adjusted_close.
    """
    logger.info("Computing returns...")
    
    # Daily returns
    df['daily_return'] = df.groupby('ticker')['adjusted_close'].pct_change()
    
    # Extract year-month to compute monthly returns
    df['year_month'] = df['date'].dt.to_period('M')
    
    # Get last trading day of the month for each ticker to compute monthly returns
    monthly_df = df.groupby(['ticker', 'year_month']).apply(lambda x: x.iloc[-1]).reset_index(drop=True)
    
    # Compute monthly return
    monthly_df = monthly_df.sort_values(by=['ticker', 'date'])
    monthly_df['monthly_return'] = monthly_df.groupby('ticker')['adjusted_close'].pct_change()
    
    # Compute excess monthly return
    monthly_df['excess_return'] = monthly_df['monthly_return'] - (risk_free_rate / 12.0)
    
    return monthly_df

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    
    raw_path = "data/raw/historical_prices.csv"
    if os.path.exists(raw_path):
        raw_df = pd.read_csv(raw_path)
        clean_df = clean_data(raw_df)
        
        # We can save clean data or just pass directly to features
        clean_path = "data/processed/clean_prices.csv"
        Path("data/processed").mkdir(parents=True, exist_ok=True)
        clean_df.to_csv(clean_path, index=False)
        logger.info(f"Clean daily prices saved. Shape: {clean_df.shape}")
        
        monthly_df = compute_returns(clean_df)
        monthly_path = "data/processed/monthly_returns.csv"
        monthly_df.to_csv(monthly_path, index=False)
        logger.info(f"Monthly returns saved. Shape: {monthly_df.shape}")
    else:
        logger.error(f"Raw data file not found at {raw_path}")
