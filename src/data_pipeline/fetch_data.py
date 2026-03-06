import yfinance as yf
import pandas as pd
import yaml
import os
import logging
from pathlib import Path

# Setup basic logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    """Load configuration from YAML file."""
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    return config

def fetch_stock_data(tickers, start_date, end_date=None):
    """
    Fetch daily historical data from Yahoo Finance for given tickers.
    Instead of adjusting volume, we take the raw volume and Adjusted Close.
    For high/low/open we will use standard columns as is, or we can use the adjusted
    prices if needed, but for our pipeline, we primarily need Adjusted Close and Volume.
    """
    logger.info(f"Fetching data for {len(tickers)} tickers from {start_date} to {end_date if end_date else 'today'}")
    
    # yfinance bulk download returns a MultiIndex dataframe if multiple tickers
    df = yf.download(tickers, start=start_date, end=end_date, progress=False, auto_adjust=False)
    
    # We want to reshape this so we have columns: date, ticker, open, high, low, close, adj_close, volume
    # yf.download structure (Level 0: Price metrics, Level 1: Tickers)
    df_stacked = df.stack(level=1).reset_index()
    # Now columns might be: Date, Ticker, Adj Close, Close, High, Low, Open, Volume
    
    # In some versions of yfinance, 'Ticker' is named 'level_1', so standardizing names
    df_stacked.rename(columns={
        "level_1": "ticker",
        "Ticker": "ticker",
        "Date": "date",
        "Adj Close": "adjusted_close",
        "Close": "close",
        "High": "high",
        "Low": "low",
        "Open": "open",
        "Volume": "volume"
    }, inplace=True)
    
    # Ensure column names are lowercase
    df_stacked.columns = [col.lower() for col in df_stacked.columns]
    
    return df_stacked

def save_raw_data(df, raw_dir):
    """Save raw data to CSV."""
    Path(raw_dir).mkdir(parents=True, exist_ok=True)
    file_path = os.path.join(raw_dir, "historical_prices.csv")
    df.to_csv(file_path, index=False)
    logger.info(f"Raw data saved to {file_path}. Total shape: {df.shape}")
    return file_path

if __name__ == "__main__":
    # Ensure we run from the root of the project
    os.chdir(Path(__file__).parent.parent.parent)
    
    config = load_config()
    tickers = config["data"]["tickers"]
    start_date = config["data"]["start_date"]
    raw_dir = config["data"]["raw_dir"]
    
    df = fetch_stock_data(tickers, start_date)
    save_raw_data(df, raw_dir)
