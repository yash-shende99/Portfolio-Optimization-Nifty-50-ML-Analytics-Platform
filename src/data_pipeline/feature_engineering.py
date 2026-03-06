import pandas as pd
import numpy as np
import ta
import logging
import os
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def add_technical_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute technical indicators using daily data for each ticker.
    """
    logger.info("Computing technical indicators for each ticker...")
    
    def process_group(group: pd.DataFrame) -> pd.DataFrame:
        group = group.sort_values(by='date')
        
        # Momentum (1, 3, 6, 12 months)
        # Using 21 trading days per month approx
        group['mom_1m'] = group['adjusted_close'].pct_change(21)
        group['mom_3m'] = group['adjusted_close'].pct_change(63)
        group['mom_6m'] = group['adjusted_close'].pct_change(126)
        group['mom_12m'] = group['adjusted_close'].pct_change(252)
        
        # Volatility (3m, 12m from daily returns)
        daily_ret = group['adjusted_close'].pct_change()
        group['vol_3m'] = daily_ret.rolling(63).std() * np.sqrt(252)
        group['vol_12m'] = daily_ret.rolling(252).std() * np.sqrt(252)
        
        # Volume ratio (1m avg volume / 6m avg volume)
        vol_1m = group['volume'].rolling(21).mean()
        vol_6m = group['volume'].rolling(126).mean()
        group['volume_ratio'] = vol_1m / (vol_6m + 1e-8)
        
        # Base indicators from TA library
        try:
            # RSI
            group['rsi'] = ta.momentum.RSIIndicator(close=group['adjusted_close'], window=14).rsi()
            # MACD
            macd_ind = ta.trend.MACD(close=group['adjusted_close'])
            group['macd_diff'] = macd_ind.macd_diff()
            # Bollinger Bands %B
            bb_ind = ta.volatility.BollingerBands(close=group['adjusted_close'], window=20, window_dev=2)
            group['bb_pband'] = bb_ind.bollinger_pband()
            # ATR
            atr_ind = ta.volatility.AverageTrueRange(high=group['high'], low=group['low'], close=group['close'], window=14)
            group['atr'] = atr_ind.average_true_range()
            # CCI
            cci_ind = ta.trend.CCIIndicator(high=group['high'], low=group['low'], close=group['close'], window=20)
            group['cci'] = cci_ind.cci()
        except Exception as e:
            logger.warning(f"Error computing TA for ticker {group['ticker'].iloc[0]}: {e}")
        
        # Distance from 52-week high
        high_52w = group['adjusted_close'].rolling(252).max()
        group['dist_52w_high'] = group['adjusted_close'] / high_52w - 1
        
        return group
    
    # Apply processing per ticker
    df_features = df.groupby('ticker', group_keys=False).apply(process_group).reset_index(drop=True)
    return df_features

def apply_cross_sectional_ranking(df: pd.DataFrame, feature_cols: list) -> pd.DataFrame:
    """
    Apply cross-sectional ranking (percentile rank) to all features each month.
    """
    logger.info("Applying cross-sectional ranking...")
    
    # We rank features on the last day of the month where we actually sample data
    # Create year_month to group by
    df['year_month'] = df['date'].dt.to_period('M')
    
    def rank_group(group: pd.DataFrame) -> pd.DataFrame:
        for col in feature_cols:
            if col in group.columns:
                group[f"{col}_rank"] = group[col].rank(pct=True)
        return group
        
    df_ranked = df.groupby('date', group_keys=False).apply(rank_group)
    return df_ranked

def align_to_monthly(daily_df_features: pd.DataFrame, monthly_returns_df: pd.DataFrame) -> pd.DataFrame:
    """
    Align daily features to monthly samples (typically end of month).
    """
    logger.info("Aligning daily features to monthly frequency...")
    # Get last trading day of the month features
    daily_df_features['year_month'] = daily_df_features['date'].dt.to_period('M')
    monthly_features = daily_df_features.groupby(['ticker', 'year_month']).apply(lambda x: x.iloc[-1]).reset_index(drop=True)
    
    # Target is next month's return
    # So we shift the monthly excess return back by 1 for each ticker
    monthly_returns_df = monthly_returns_df[['ticker', 'year_month', 'monthly_return', 'excess_return']]
    
    # Merge features with current month return
    merged = pd.merge(monthly_features, monthly_returns_df, on=['ticker', 'year_month'], how='left')
    
    # Create target (next month excess return)
    merged = merged.sort_values(by=['ticker', 'year_month'])
    merged['target_return'] = merged.groupby('ticker')['excess_return'].shift(-1)
    
    return merged

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    
    clean_path = "data/processed/clean_prices.csv"
    ret_path = "data/processed/monthly_returns.csv"
    
    if os.path.exists(clean_path) and os.path.exists(ret_path):
        clean_df = pd.read_csv(clean_path)
        clean_df['date'] = pd.to_datetime(clean_df['date'])
        
        returns_df = pd.read_csv(ret_path)
        returns_df['year_month'] = pd.to_datetime(returns_df['date']).dt.to_period('M')
        
        features_df = add_technical_indicators(clean_df)
        
        # List of features to rank
        feature_cols = [
            'mom_1m', 'mom_3m', 'mom_6m', 'mom_12m', 
            'vol_3m', 'vol_12m', 'volume_ratio', 
            'rsi', 'macd_diff', 'bb_pband', 'atr', 'cci', 'dist_52w_high'
        ]
        
        # Align to monthly before cross-sectional ranking to save compute, 
        # or rank daily. We will align monthly first, then rank cross-sectionally.
        aligned_df = align_to_monthly(features_df, returns_df)
        
        # Now rank cross-sectionally per year_month
        ranked_df = apply_cross_sectional_ranking(aligned_df, feature_cols)
        
        out_path = "data/processed/feature_matrix.csv"
        ranked_df.to_csv(out_path, index=False)
        logger.info(f"Feature matrix saved to {out_path}. Shape: {ranked_df.shape}")
    else:
        logger.error("Clean data or monthly returns not found.")
