"""
Robust Nifty 50 Data Collection Script
Handles partial downloads and missing tickers
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import time

def get_nifty_50_tickers():
    """
    Return list of Nifty 50 tickers with .NS suffix.
    Verified working as of Feb 2025.
    """
    return [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS", "ITC.NS",
        "LT.NS", "AXISBANK.NS", "BAJFINANCE.NS", "MARUTI.NS", "SUNPHARMA.NS",
        "HCLTECH.NS", "TITAN.NS", "ULTRACEMCO.NS", "ASIANPAINT.NS", "NTPC.NS",
        "ONGC.NS", "POWERGRID.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "WIPRO.NS",
        "ADANIPORTS.NS", "GRASIM.NS", "INDUSINDBK.NS", "JSWSTEEL.NS", "TECHM.NS"
    ]

def safe_download(tickers, start, end):
    """
    Download data with error handling.
    Returns a DataFrame and list of failed tickers.
    """
    print(f"\n📥 Downloading {len(tickers)} stocks + Nifty index...")
    
    # Add index ticker
    all_tickers = tickers + ["^NSEI"]
    
    # Try download with increased timeout
    try:
        data = yf.download(
            all_tickers,
            start=start,
            end=end,
            group_by='ticker',
            auto_adjust=True,
            progress=True,
            timeout=20
        )
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None, all_tickers  # treat all as failed
    
    # Identify which tickers are actually present in columns
    if isinstance(data.columns, pd.MultiIndex):
        # Successful multi-ticker download
        downloaded_tickers = data.columns.get_level_values(0).unique().tolist()
        failed = [t for t in all_tickers if t not in downloaded_tickers]
        return data, failed
    else:
        # Single ticker or empty result
        if data.empty:
            return None, all_tickers
        else:
            # Only one ticker (maybe index) – handle separately
            return data, [t for t in all_tickers if t != data.columns[0]]

def collect_nifty_data():
    """Main data collection with robust error handling"""
    
    print("=" * 50)
    print("NIFTY 50 DATA COLLECTION (ROBUST)")
    print("=" * 50)
    
    # Date range
    start_date = "2019-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")
    tickers = get_nifty_50_tickers()
    
    print(f"\n📅 Period: {start_date} to {end_date}")
    print(f"📊 Target stocks: {len(tickers)}")
    
    # Download data
    data, failed = safe_download(tickers, start_date, end_date)
    
    if data is None:
        print("❌ No data downloaded. Exiting.")
        return
    
    # Report failures
    if failed:
        print(f"\n⚠️  Failed to download {len(failed)} tickers:")
        for t in failed:
            print(f"   - {t}")
    
    # Extract successfully downloaded stock tickers (exclude index)
    if isinstance(data.columns, pd.MultiIndex):
        all_dl = data.columns.get_level_values(0).unique().tolist()
        stock_dl = [t for t in all_dl if t != "^NSEI"]
    else:
        # If only one column, it's either a stock or index
        if data.columns[0] == "^NSEI":
            stock_dl = []
        else:
            stock_dl = [data.columns[0]]
    
    print(f"\n✅ Successfully downloaded {len(stock_dl)} stocks + Nifty index")
    
    # Extract 'Close' prices
    try:
        if isinstance(data.columns, pd.MultiIndex):
            # MultiIndex case
            close_prices = data.xs('Close', axis=1, level=1)
        else:
            # Single column case – assume it's Close
            close_prices = data
            close_prices.columns = [data.columns.name]  # rename appropriately
    except Exception as e:
        print(f"❌ Error extracting Close prices: {e}")
        print("Data columns:", data.columns)
        return
    
    # Ensure we have the index separately
    if "^NSEI" in close_prices.columns:
        nifty_prices = close_prices["^NSEI"]
        # Remove index from stock prices
        stock_prices = close_prices.drop(columns=["^NSEI"])
    else:
        print("⚠️  Nifty index data missing. Will attempt separate download.")
        # Fallback: download index separately
        nifty = yf.download("^NSEI", start=start_date, end=end_date, auto_adjust=True)
        nifty_prices = nifty['Close']
        stock_prices = close_prices
    
    # Extract volumes if needed (optional for MVP)
    try:
        if isinstance(data.columns, pd.MultiIndex):
            volumes = data.xs('Volume', axis=1, level=1).drop(columns=["^NSEI"], errors='ignore')
        else:
            volumes = pd.DataFrame()
    except:
        volumes = pd.DataFrame()
        print("⚠️  Volume data not extracted (not critical for MVP).")
    
    # Print summary
    print(f"\n📈 Data summary:")
    print(f"   - Date range: {stock_prices.index[0]} to {stock_prices.index[-1]}")
    print(f"   - Trading days: {len(stock_prices)}")
    print(f"   - Stocks with data: {stock_prices.shape[1]}")
    
    # Quick missing data check
    missing_pct = (stock_prices.isnull().sum() / len(stock_prices)) * 100
    stocks_with_issues = missing_pct[missing_pct > 5]
    if len(stocks_with_issues) > 0:
        print(f"\n⚠️  Stocks with >5% missing data:")
        for stock, pct in stocks_with_issues.items():
            print(f"   - {stock}: {pct:.1f}% missing")
    
    # Save to CSV
    stock_prices.to_csv("nifty50_daily_prices.csv")
    if not volumes.empty:
        volumes.to_csv("nifty50_daily_volumes.csv")
    nifty_prices.to_csv("nifty_index_daily.csv")
    
    print(f"\n💾 Data saved:")
    print(f"   - nifty50_daily_prices.csv ({stock_prices.shape})")
    if not volumes.empty:
        print(f"   - nifty50_daily_volumes.csv ({volumes.shape})")
    print(f"   - nifty_index_daily.csv ({nifty_prices.shape})")
    
    return stock_prices, volumes, nifty_prices

def create_monthly_dataset(daily_prices, daily_volumes, nifty_prices):
    """Convert daily to monthly for feature engineering"""
    
    print("\n" + "=" * 50)
    print("CREATING MONTHLY DATASET")
    print("=" * 50)
    
    # Resample to month-end
    monthly_prices = daily_prices.resample('M').last()
    monthly_nifty = nifty_prices.resample('M').last()
    
    # Calculate monthly returns
    monthly_returns = monthly_prices.pct_change()
    monthly_nifty_returns = monthly_nifty.pct_change()
    
    # Excess returns (target)
    excess_returns = monthly_returns.sub(monthly_nifty_returns, axis=0)
    
    print(f"\n📊 Monthly dataset shape: {monthly_prices.shape}")
    print(f"   - Months: {len(monthly_prices)}")
    print(f"   - Stocks: {monthly_prices.shape[1]}")
    
    # Save
    monthly_prices.to_csv("nifty50_monthly_prices.csv")
    monthly_returns.to_csv("nifty50_monthly_returns.csv")
    excess_returns.to_csv("nifty50_monthly_excess_returns.csv")
    
    print(f"\n💾 Monthly data saved.")
    
    return monthly_prices, monthly_returns, excess_returns

if __name__ == "__main__":
    # Run data collection
    daily_prices, daily_volumes, nifty_prices = collect_nifty_data()
    
    if daily_prices is not None and not daily_prices.empty:
        # Create monthly dataset
        monthly_prices, monthly_returns, excess_returns = create_monthly_dataset(
            daily_prices, daily_volumes, nifty_prices
        )
        
        print("\n" + "=" * 50)
        print("✅ STAGE 1 COMPLETE")
        print("=" * 50)
        print("\nNext: Feature engineering & model training")
    else:
        print("\n❌ Data collection failed. Please check errors above.")