import os
import pandas as pd
import numpy as np
import logging
import yaml
from pathlib import Path
from arch import arch_model

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def forecast_volatility(df_daily: pd.DataFrame, window: int = 756):
    """
    Fits a GARCH(1,1) model on daily returns over a rolling window for each active ticker.
    Forecasts next-month volatility (annualized).
    """
    config = load_config()
    
    # Needs daily returns
    # Compute daily return if not present
    if 'daily_return' not in df_daily.columns:
        df_daily['daily_return'] = df_daily.groupby('ticker')['adjusted_close'].pct_change()
    
    df_daily = df_daily.dropna(subset=['daily_return']).sort_values(by=['ticker', 'date']).reset_index(drop=True)
    
    latest_date = df_daily['date'].max()
    logger.info(f"Forecasting GARCH volatility using data up to {latest_date.date()}")
    
    forecasts = []
    
    for ticker, group in df_daily.groupby('ticker'):
        # Get last `window` days
        recent_data = group.tail(window).copy()
        
        if len(recent_data) < window // 2:
            logger.warning(f"Not enough data for {ticker} to fit GARCH. Skipping.")
            continue
            
        returns = recent_data['daily_return'] * 100.0  # rescaled for optimizer in arch
        
        try:
            # Fit GARCH(1,1)
            am = arch_model(returns, vol='Garch', p=1, q=1, rescale=False)
            res = am.fit(disp='off')
            
            # Forecast 1 step ahead (next day variance)
            # To get next month annualized, we scale by sqrt(252) or sum month variance
            # Here we just use the forecasted next day variance * 252 for annualized variance
            forecast = res.forecast(horizon=1)
            next_day_var = forecast.variance.iloc[-1, 0]
            ann_vol = np.sqrt(next_day_var * 252) / 100.0  # scale back
            
            forecasts.append({
                'date': latest_date,
                'ticker': ticker,
                'forecasted_vol_ann': ann_vol
            })
            
        except Exception as e:
            logger.error(f"GARCH fitting failed for {ticker}: {e}")
            
    forecast_df = pd.DataFrame(forecasts)
    
    out_path = "data/processed/volatility_forecasts.csv"
    forecast_df.to_csv(out_path, index=False)
    logger.info(f"Volatility forecasts saved to {out_path}")
    return forecast_df

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    
    clean_path = "data/processed/clean_prices.csv"
    if os.path.exists(clean_path):
        df_clean = pd.read_csv(clean_path)
        df_clean['date'] = pd.to_datetime(df_clean['date'])
        config = load_config()
        window = config["model"]["volatility"]["garch_window"]
        forecast_volatility(df_clean, window)
    else:
        logger.error(f"Required clean data not found at {clean_path}")
