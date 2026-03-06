"""
Comparative Analysis of Multiple Models for Nifty 50 Return Prediction
Includes: XGBoost, Linear Regression, Random Forest, LightGBM, Momentum Baseline
Features: 17+ technicals + cross-sectional ranking + target clipping
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit, ParameterGrid
from sklearn.metrics import mean_squared_error, mean_absolute_error
from scipy.stats import spearmanr
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt

# Corrected imports for ta library
from ta.momentum import RSIIndicator
from ta.trend import MACD, CCIIndicator          # MACD is in ta.trend
from ta.volatility import BollingerBands, AverageTrueRange

from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
import lightgbm as lgb

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

# Ensure column names are strings
daily_prices.columns = daily_prices.columns.astype(str)
if not daily_volumes.empty:
    daily_volumes.columns = daily_volumes.columns.astype(str)
nifty_daily.columns = ['^NSEI']

# Align dates across daily datasets
common_dates = daily_prices.index.intersection(daily_volumes.index).intersection(nifty_daily.index)
daily_prices = daily_prices.loc[common_dates]
daily_volumes = daily_volumes.loc[common_dates]
nifty_daily = nifty_daily.loc[common_dates]

print(f"Daily data shape: {daily_prices.shape}")
print(f"Monthly data shape: {monthly_prices.shape}")

# ---------------------------
# 2. Precompute Nifty monthly returns (with fill_method=None to avoid FutureWarning)
# ---------------------------
nifty_monthly = nifty_daily['^NSEI'].resample('ME').last()
nifty_monthly_returns = nifty_monthly.pct_change(fill_method=None).rename('nifty_ret')

# ---------------------------
# 3. Per‑stock feature engineering (vectorized)
# ---------------------------
print("\nEngineering enhanced features per stock...")
stock_features_list = []

for stock in monthly_prices.columns:
    if stock not in daily_prices.columns:
        continue

    prices = daily_prices[stock].dropna()
    volumes = daily_volumes[stock].dropna() if stock in daily_volumes.columns else pd.Series(dtype=float)

    if len(prices) < 252:   # need at least 1 year of daily data
        continue

    # Daily returns (use fill_method=None)
    daily_returns = prices.pct_change(fill_method=None).dropna()

    # Basic volatility
    vol_3m = daily_returns.rolling(window=63).std() * np.sqrt(252)
    vol_12m = daily_returns.rolling(window=252).std() * np.sqrt(252)

    # Volume ratio
    if not volumes.empty and len(volumes) >= 252:
        vol_3m_avg = volumes.rolling(window=63).mean()
        vol_12m_avg = volumes.rolling(window=252).mean()
        volume_ratio = vol_3m_avg / vol_12m_avg
    else:
        volume_ratio = pd.Series(index=prices.index, dtype=float)

    # Technical indicators
    rsi = RSIIndicator(close=prices, window=14).rsi()
    macd = MACD(close=prices, window_slow=26, window_fast=12, window_sign=9).macd()
    bb = BollingerBands(close=prices, window=20, window_dev=2)
    bb_pctb = bb.bollinger_pband()
    atr = AverageTrueRange(high=prices, low=prices, close=prices, window=14).average_true_range()
    cci = CCIIndicator(high=prices, low=prices, close=prices, window=20).cci()

    # Distance from 52‑week high
    high_52w = prices.rolling(window=252).max()
    dist_52w_high = prices / high_52w

    # Rolling correlation with Nifty (60 days) – use fill_method=None for pct_change
    nifty_rets = nifty_daily['^NSEI'].pct_change(fill_method=None)
    combined = pd.concat([daily_returns, nifty_rets], axis=1, keys=['stock', 'nifty']).dropna()
    corr_nifty = combined['stock'].rolling(window=60).corr(combined['nifty'])

    # Assemble daily features
    features_daily = pd.DataFrame({
        'vol_3m': vol_3m,
        'vol_12m': vol_12m,
        'volume_ratio': volume_ratio,
        'rsi': rsi,
        'macd': macd,
        'bb_pctb': bb_pctb,
        'atr': atr,
        'cci': cci,
        'dist_52w_high': dist_52w_high,
        'corr_nifty': corr_nifty,
    })

    # Resample to month-end (last observation of the month)
    features_monthly = features_daily.resample('ME').last()

    # Add monthly returns (from daily prices) – we'll need them for momentum features later
    monthly_prices_stock = prices.resample('ME').last()
    monthly_returns_stock = monthly_prices_stock.pct_change(fill_method=None).rename('monthly_return')
    features_monthly = features_monthly.join(monthly_returns_stock)

    # Keep only dates present in global monthly_prices index
    features_monthly = features_monthly.loc[features_monthly.index.intersection(monthly_prices.index)]
    if features_monthly.empty:
        continue

    features_monthly['stock'] = stock

    # --- Robust reset_index to create a 'date' column ---
    features_monthly = features_monthly.reset_index()                     # index becomes a column named 'index' (or whatever the index was called)
    features_monthly = features_monthly.rename(columns={features_monthly.columns[0]: 'date'})

    stock_features_list.append(features_monthly)

all_features = pd.concat(stock_features_list, ignore_index=True)
print(f"Total feature rows after per-stock engineering: {len(all_features)}")

# ---------------------------
# ---------------------------
# 4. Merge with global monthly data (returns, excess returns)
# ---------------------------
monthly_returns_all = monthly_prices.pct_change(fill_method=None).stack().reset_index()
monthly_returns_all.columns = ['date', 'stock', 'monthly_return']

excess_long = excess_returns.stack().reset_index()
excess_long.columns = ['date', 'stock', 'excess_return']

monthly_data = monthly_returns_all.merge(excess_long, on=['date', 'stock'], how='left')

# Drop monthly_return from monthly_data because all_features already has it
monthly_data = monthly_data.drop(columns=['monthly_return'])

print("all_features columns:", all_features.columns.tolist())
print("monthly_data columns:", monthly_data.columns.tolist())

features_df = all_features.merge(monthly_data, on=['date', 'stock'], how='inner')
# Sort for lag calculations
features_df = features_df.sort_values(['stock', 'date']).reset_index(drop=True)

# ---------------------------
# 5. Create lagged momentum features
# ---------------------------
features_df['ret_1m'] = features_df.groupby('stock')['monthly_return'].shift(1)
features_df['ret_3m'] = features_df.groupby('stock')['monthly_return'].rolling(3).sum().shift(1).reset_index(0, drop=True)
features_df['ret_6m'] = features_df.groupby('stock')['monthly_return'].rolling(6).sum().shift(1).reset_index(0, drop=True)
features_df['ret_12m'] = features_df.groupby('stock')['monthly_return'].rolling(12).sum().shift(1).reset_index(0, drop=True)

# Risk‑adjusted momentum
features_df['mom_3m_adj'] = features_df['ret_3m'] / features_df['vol_3m'].clip(lower=0.01)
features_df['mom_6m_adj'] = features_df['ret_6m'] / features_df['vol_12m'].clip(lower=0.01)

# Market‑relative return
features_df = features_df.merge(nifty_monthly_returns.to_frame(), left_on='date', right_index=True, how='left')
features_df['market_rel_ret'] = features_df['monthly_return'] - features_df['nifty_ret']

# Target: next month's excess return
features_df['target'] = features_df.groupby('stock')['excess_return'].shift(-1)
features_df = features_df.dropna(subset=['target'])

print(f"Rows after merging: {len(features_df)}")

# ---------------------------
# 6. Feature list and cross-sectional ranking
# ---------------------------
base_features = [
    'ret_1m', 'ret_3m', 'ret_6m', 'ret_12m',
    'vol_3m', 'vol_12m', 'volume_ratio',
    'rsi', 'macd', 'bb_pctb', 'atr', 'cci',
    'dist_52w_high', 'corr_nifty',
    'market_rel_ret',
    'mom_3m_adj', 'mom_6m_adj'
]

# Keep rows with at least 14 non‑NaN features
features_df = features_df.dropna(subset=base_features, thresh=14)

print("\nApplying cross-sectional ranking...")
for col in base_features:
    rank_col = f"{col}_rank"
    features_df[rank_col] = features_df.groupby('date')[col].rank(pct=True)

ranked_cols = [f"{col}_rank" for col in base_features]
X = features_df[ranked_cols]
y = features_df['target']
dates = features_df['date']

from sklearn.impute import SimpleImputer
print("\nImputing remaining NaNs...")
imputer = SimpleImputer(strategy='median')
X = pd.DataFrame(imputer.fit_transform(X), columns=X.columns, index=X.index)

# ---------------------------
# 7. Chronological split
# ---------------------------
train_mask = dates < '2023-01-01'
test_mask = dates >= '2023-01-01'

X_train, X_test = X[train_mask], X[test_mask]
y_train, y_test = y[train_mask], y[test_mask]
train_dates, test_dates = dates[train_mask], dates[test_mask]

print(f"\nTrain size: {len(X_train)}, Test size: {len(X_test)}")
print(f"Train date range: {train_dates.min()} to {train_dates.max()}")
print(f"Test date range: {test_dates.min()} to {test_dates.max()}")

# Clip extreme targets (winsorize using training quantiles)
lower_qt = y_train.quantile(0.01)
upper_qt = y_train.quantile(0.99)
y_train_clipped = y_train.clip(lower_qt, upper_qt)
y_test_original = y_test.copy()   # keep original for evaluation

print(f"Clipping target to [{lower_qt:.4f}, {upper_qt:.4f}]")

# ---------------------------
# 8. Evaluation function
# ---------------------------
def evaluate_predictions(y_true, y_pred, dates, model_name):
    results = {'model': model_name}
    # Global IC
    ic_g, p_g = spearmanr(y_pred, y_true)
    results['Global IC'] = ic_g
    results['p-value'] = p_g

    # Monthly IC
    df = pd.DataFrame({'date': dates, 'pred': y_pred, 'actual': y_true})
    monthly_ics = []
    for d in sorted(df['date'].unique()):
        mdata = df[df['date'] == d]
        if len(mdata) >= 10:
            ic_m, _ = spearmanr(mdata['pred'], mdata['actual'])
            monthly_ics.append(ic_m)
    results['Mean Monthly IC'] = np.mean(monthly_ics) if monthly_ics else np.nan
    results['IC Std Dev'] = np.std(monthly_ics) if monthly_ics else np.nan

    # Hit rate
    results['Hit Rate'] = np.mean((y_pred > 0) == (y_true > 0))

    # Decile spread
    df['decile'] = pd.qcut(df['pred'], 10, labels=False, duplicates='drop')
    dec_ret = df.groupby('decile')['actual'].mean()
    if len(dec_ret) >= 10:
        results['Top Decile'] = dec_ret.iloc[-1]
        results['Bottom Decile'] = dec_ret.iloc[0]
        results['Decile Spread'] = results['Top Decile'] - results['Bottom Decile']
    else:
        results['Decile Spread'] = np.nan
    return results

# ---------------------------
# 9. Hyperparameter tuning for XGBoost (expanded grid)
# ---------------------------
print("\nTuning XGBoost hyperparameters...")
tscv = TimeSeriesSplit(n_splits=3)
param_grid = {
    'n_estimators': [200, 300],
    'max_depth': [3, 4, 5],
    'learning_rate': [0.01, 0.03, 0.05],
    'subsample': [0.6, 0.8],
    'colsample_bytree': [0.6, 0.8],
    'reg_alpha': [0.1, 0.5, 1.0],
    'reg_lambda': [1.0, 2.0, 5.0],
    'min_child_weight': [3, 5, 7],
    'gamma': [0, 0.1, 0.2]
}
best_score = -np.inf
best_params = None
for params in ParameterGrid(param_grid):
    cv_scores = []
    for train_idx, val_idx in tscv.split(X_train):
        X_tr, X_val = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_tr, y_val = y_train_clipped.iloc[train_idx], y_train_clipped.iloc[val_idx]
        model = xgb.XGBRegressor(**params, random_state=42, verbosity=0)
        model.fit(X_tr, y_tr) 
        preds = model.predict(X_val)
        rmse = np.sqrt(mean_squared_error(y_val, preds))
        cv_scores.append(-rmse)
    if np.mean(cv_scores) > best_score:
        best_score = np.mean(cv_scores)
        best_params = params

print(f"Best XGBoost params: {best_params}")
print(f"Best CV score (neg RMSE): {best_score:.4f}")

# ---------------------------
# 10. Train final XGBoost
# ---------------------------
print("\nTraining final XGBoost model...")
xgb_model = xgb.XGBRegressor(**best_params, random_state=42, verbosity=1)
xgb_model.fit(X_train, y_train_clipped)
y_pred_xgb = xgb_model.predict(X_test)

# ---------------------------
# 11. Train alternative models
# ---------------------------
print("\n" + "="*50)
print("Training alternative models for comparison")
print("="*50)

# Linear Regression
print("\nLinear Regression...")
lr = LinearRegression()
lr.fit(X_train, y_train_clipped)
y_pred_lr = lr.predict(X_test)

# Random Forest
print("Random Forest...")
rf = RandomForestRegressor(n_estimators=200, max_depth=5, random_state=42, n_jobs=-1)
rf.fit(X_train, y_train_clipped)
y_pred_rf = rf.predict(X_test)

# LightGBM
print("LightGBM...")
lgb_model = lgb.LGBMRegressor(
    n_estimators=200, max_depth=5, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    reg_alpha=0.1, reg_lambda=1.0,
    random_state=42, verbose=-1
)
lgb_model.fit(X_train, y_train_clipped)
y_pred_lgb = lgb_model.predict(X_test)

# Momentum baseline (use ret_1m as prediction)
momentum_test = features_df.loc[test_mask, ['date', 'stock', 'ret_1m', 'target']].copy()
y_pred_mom = momentum_test['ret_1m'].values
y_true_mom = momentum_test['target'].values
mom_dates = momentum_test['date'].values

# ---------------------------
# 12. Evaluate all models
# ---------------------------
predictions = [
    ('XGBoost', y_pred_xgb, test_dates, y_test),
    ('Linear Regression', y_pred_lr, test_dates, y_test),
    ('Random Forest', y_pred_rf, test_dates, y_test),
    ('LightGBM', y_pred_lgb, test_dates, y_test),
    ('Momentum', y_pred_mom, mom_dates, y_true_mom)
]

results_list = []
for name, pred, dts, y_true in predictions:
    res = evaluate_predictions(y_true, pred, dts, name)
    results_list.append(res)

comparison_df = pd.DataFrame(results_list)
cols = ['model', 'Mean Monthly IC', 'IC Std Dev', 'Hit Rate', 'Decile Spread', 'Global IC', 'p-value']
comparison_df = comparison_df[cols]

print("\n" + "="*70)
print("COMPARATIVE ANALYSIS RESULTS")
print("="*70)
print(comparison_df.to_string(index=False))

# ---------------------------
# 13. Optional: Sharpe ratio of top‑decile long‑only portfolio
# ---------------------------
def backtest_top_decile(pred, actual, dts, name):
    df = pd.DataFrame({'date': dts, 'pred': pred, 'actual': actual})
    monthly_rets = []
    for d in df['date'].unique():
        mdata = df[df['date'] == d]
        if len(mdata) >= 10:
            top = mdata.nlargest(int(len(mdata)*0.1), 'pred')['actual'].mean()
            monthly_rets.append(top)
    if len(monthly_rets) < 6:
        return np.nan
    sharpe = np.mean(monthly_rets) / np.std(monthly_rets) * np.sqrt(12)
    return sharpe

print("\nSharpe Ratios (long-only top decile):")
for name, pred, dts, y_true in predictions:
    sr = backtest_top_decile(pred, y_true, dts, name)
    print(f"{name:20s} {sr:.2f}")

# ---------------------------
# 14. Save model and comparison
# ---------------------------
joblib.dump(xgb_model, "xgb_model_best.pkl")
comparison_df.to_csv("model_comparison.csv", index=False)
print("\n✅ Best XGBoost model saved as 'xgb_model_best.pkl'")
print("✅ Comparison saved to 'model_comparison.csv'")