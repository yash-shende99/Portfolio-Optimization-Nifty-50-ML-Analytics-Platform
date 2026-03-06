"""
Enhanced Feature Engineering and XGBoost Training for Nifty 50
Uses daily data for better features and includes hyperparameter tuning.
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, ParameterGrid
from sklearn.metrics import mean_squared_error, mean_absolute_error
from scipy.stats import spearmanr
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt
from ta.momentum import RSIIndicator  # requires `ta` library

# ---------------------------
# 1. Load data
# ---------------------------
print("Loading monthly data...")
monthly_prices = pd.read_csv("nifty50_monthly_prices.csv", index_col=0, parse_dates=True)
excess_returns = pd.read_csv("nifty50_monthly_excess_returns.csv", index_col=0, parse_dates=True)

print("Loading daily data...")
daily_prices = pd.read_csv("nifty50_daily_prices.csv", index_col=0, parse_dates=True)
daily_volumes = pd.read_csv("nifty50_daily_volumes.csv", index_col=0, parse_dates=True)
nifty_daily = pd.read_csv("nifty_index_daily.csv", index_col=0, parse_dates=True)

# Ensure column names are strings (sometimes they become numbers)
daily_prices.columns = daily_prices.columns.astype(str)
if not daily_volumes.empty:
    daily_volumes.columns = daily_volumes.columns.astype(str)
nifty_daily.columns = ['^NSEI']

# Align dates: keep only common dates across all datasets
common_dates = daily_prices.index.intersection(daily_volumes.index).intersection(nifty_daily.index)
daily_prices = daily_prices.loc[common_dates]
daily_volumes = daily_volumes.loc[common_dates]
nifty_daily = nifty_daily.loc[common_dates]

print(f"Daily data shape: {daily_prices.shape}")
print(f"Monthly data shape: {monthly_prices.shape}")

# ---------------------------
# 2. Feature engineering (using daily data)
# ---------------------------
print("\nEngineering enhanced features...")

feature_rows = []

# Loop over each month in monthly_prices (starting from month 13 to have enough history)
for i, date in enumerate(monthly_prices.index[12:], start=12):  # skip first 12 months
    current_date = date
    
    # Get end of this month (monthly index is already month-end)
    month_end = current_date
    
    # Define the period for daily data: up to this month-end
    daily_up_to_month = daily_prices.loc[:month_end]
    
    # For each stock
    for stock in monthly_prices.columns:
        # Skip if stock not in daily data
        if stock not in daily_prices.columns:
            continue
            
        # Get stock's daily prices and volumes up to this month
        stock_daily = daily_up_to_month[stock].dropna()
        stock_vol = daily_volumes.loc[:month_end, stock].dropna() if stock in daily_volumes.columns else pd.Series(dtype=float)
        
        # Need at least 12 months of daily data? For simplicity, require at least 250 trading days (~1 year)
        if len(stock_daily) < 250:
            continue
        
        # --- 1. Momentum from monthly prices (as before) ---
        stock_monthly = monthly_prices[stock].loc[:month_end].dropna()
        if len(stock_monthly) < 13:
            continue
            
        ret_1m = (stock_monthly.iloc[-1] / stock_monthly.iloc[-2] - 1) if len(stock_monthly) >= 2 else np.nan
        ret_3m = (stock_monthly.iloc[-1] / stock_monthly.iloc[-4] - 1) if len(stock_monthly) >= 4 else np.nan
        ret_6m = (stock_monthly.iloc[-1] / stock_monthly.iloc[-7] - 1) if len(stock_monthly) >= 7 else np.nan
        ret_12m = (stock_monthly.iloc[-1] / stock_monthly.iloc[-13] - 1) if len(stock_monthly) >= 13 else np.nan
        
        # --- 2. Volatility from daily returns (past 3 months = ~63 trading days) ---
        daily_returns = stock_daily.pct_change().dropna()
        vol_3m = daily_returns.iloc[-63:].std() * np.sqrt(252) if len(daily_returns) >= 63 else np.nan  # annualized
        vol_12m = daily_returns.iloc[-252:].std() * np.sqrt(252) if len(daily_returns) >= 252 else np.nan
        
        # --- 3. Volume ratio ---
        if len(stock_vol) >= 252:
            avg_vol_3m = stock_vol.iloc[-63:].mean()
            avg_vol_12m = stock_vol.iloc[-252:].mean()
            volume_ratio = avg_vol_3m / avg_vol_12m if avg_vol_12m != 0 else np.nan
        else:
            volume_ratio = np.nan
        
        # --- 4. RSI (14-day) at month-end ---
        if len(stock_daily) >= 14:
            rsi = RSIIndicator(close=stock_daily, window=14).rsi().iloc[-1]
        else:
            rsi = np.nan
        
        # --- 5. Distance from 52-week high (using daily highs? we only have closes, use rolling max of closes) ---
        high_52w = stock_daily.iloc[-252:].max() if len(stock_daily) >= 252 else np.nan
        dist_52w_high = stock_daily.iloc[-1] / high_52w if not pd.isna(high_52w) else np.nan
        
        # --- 6. Market-relative return (stock monthly return minus Nifty monthly return) ---
        # Need Nifty monthly return for same period
        nifty_monthly = nifty_daily['^NSEI'].loc[:month_end].resample('M').last()
        nifty_ret_1m = (nifty_monthly.iloc[-1] / nifty_monthly.iloc[-2] - 1) if len(nifty_monthly) >= 2 else np.nan
        market_rel_ret = ret_1m - nifty_ret_1m if not pd.isna(ret_1m) and not pd.isna(nifty_ret_1m) else np.nan
        
        # --- Target: next month's excess return ---
        if i+1 < len(monthly_prices):
            target = excess_returns[stock].iloc[i+1]
        else:
            target = np.nan
        
        # Store feature vector
        feature_rows.append({
            'date': current_date,
            'stock': stock,
            'ret_1m': ret_1m,
            'ret_3m': ret_3m,
            'ret_6m': ret_6m,
            'ret_12m': ret_12m,
            'vol_3m': vol_3m,
            'vol_12m': vol_12m,
            'volume_ratio': volume_ratio,
            'rsi': rsi,
            'dist_52w_high': dist_52w_high,
            'market_rel_ret': market_rel_ret,
            'target': target
        })

# Convert to DataFrame
features_df = pd.DataFrame(feature_rows)
print(f"Total feature rows: {len(features_df)}")

# Drop rows with missing target (last month)
features_df = features_df.dropna(subset=['target'])

# Drop rows with too many missing features (keep if at least 8 non-nan features)
features_df = features_df.dropna(thresh=8)

# Fill remaining NaNs with median per feature (except date, stock, target)
for col in features_df.columns:
    if col not in ['date', 'stock', 'target']:
        features_df[col] = features_df[col].fillna(features_df[col].median())

print(f"Rows after cleaning: {len(features_df)}")

# ---------------------------
# 3. Prepare X and y
# ---------------------------
feature_cols = ['ret_1m', 'ret_3m', 'ret_6m', 'ret_12m', 'vol_3m', 'vol_12m',
                'volume_ratio', 'rsi', 'dist_52w_high', 'market_rel_ret']
X = features_df[feature_cols]
y = features_df['target']
dates = features_df['date']

# ---------------------------
# 4. Chronological split
# ---------------------------
train_mask = dates < '2023-01-01'
test_mask = dates >= '2023-01-01'

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]

print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")
print(f"Train date range: {dates[train_mask].min()} to {dates[train_mask].max()}")
print(f"Test date range: {dates[test_mask].min()} to {dates[test_mask].max()}")

# ---------------------------
# 5. Hyperparameter tuning with TimeSeriesSplit
# ---------------------------
print("\nTuning hyperparameters with time-series CV...")
tscv = TimeSeriesSplit(n_splits=3)

param_grid = {
    'n_estimators': [100, 200],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0]
}

best_score = -np.inf
best_params = None

# We'll use negative RMSE as scoring (higher is better)
for params in ParameterGrid(param_grid):
    cv_scores = []
    for train_idx, val_idx in tscv.split(X_train):
        X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_tr, y_val = y_train.iloc[train_idx], y_train.iloc[val_idx]
        
        model = xgb.XGBRegressor(**params, random_state=42, verbosity=0)
        model.fit(X_tr, y_tr)
        preds = model.predict(X_val)
        rmse = np.sqrt(mean_squared_error(y_val, preds))
        cv_scores.append(-rmse)  # negative so higher is better
    
    mean_score = np.mean(cv_scores)
    if mean_score > best_score:
        best_score = mean_score
        best_params = params

print(f"Best params: {best_params}")
print(f"Best CV score (neg RMSE): {best_score:.4f}")

# ---------------------------
# 6. Train final model with best params
# ---------------------------
print("\nTraining final XGBoost model...")
model = xgb.XGBRegressor(**best_params, random_state=42, verbosity=1)
model.fit(X_train, y_train)

# ---------------------------
# 7. Evaluate on test set
# ---------------------------
y_pred = model.predict(X_test)

# Metrics
ic, p_value = spearmanr(y_pred, y_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
mae = mean_absolute_error(y_test, y_pred)
hit_rate = np.mean((y_pred > 0) == (y_test > 0))

# Decile analysis
test_df = pd.DataFrame({'pred': y_pred, 'actual': y_test})
test_df['decile'] = pd.qcut(test_df['pred'], 10, labels=False, duplicates='drop')
decile_returns = test_df.groupby('decile')['actual'].mean()
top_decile_return = decile_returns.iloc[-1] if len(decile_returns) >= 10 else np.nan
bottom_decile_return = decile_returns.iloc[0] if len(decile_returns) >= 10 else np.nan
decile_spread = top_decile_return - bottom_decile_return

print("\n" + "="*50)
print("TEST SET PERFORMANCE")
print("="*50)
print(f"Information Coefficient (IC): {ic:.4f} (p={p_value:.4f})")
print(f"Hit Rate: {hit_rate:.2%}")
print(f"RMSE: {rmse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"Top Decile Avg Return: {top_decile_return:.4f}")
print(f"Bottom Decile Avg Return: {bottom_decile_return:.4f}")
print(f"Decile Spread: {decile_spread:.4f}")

# ---------------------------
# 8. Feature importance
# ---------------------------
xgb.plot_importance(model, importance_type='weight')
plt.title("Feature Importance (F Score)")
plt.tight_layout()
plt.savefig("feature_importance_enhanced.png")
plt.show()

# Gain importance (another measure)
xgb.plot_importance(model, importance_type='gain')
plt.title("Feature Importance (Gain)")
plt.tight_layout()
plt.savefig("feature_importance_gain.png")
plt.show()

# ---------------------------
# 9. Save model
# ---------------------------
joblib.dump(model, "xgb_model_enhanced.pkl")
print("\nEnhanced model saved as 'xgb_model_enhanced.pkl'")

# Optional: save predictions for later analysis
test_df.to_csv("test_predictions.csv")