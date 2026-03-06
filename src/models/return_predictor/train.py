import os
import pandas as pd
import numpy as np
import yaml
import logging
import joblib
import mlflow
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def evaluate_predictions(y_true, y_pred, df_test):
    """
    Evaluate hit rate (directional accuracy) and Information Coefficient (IC).
    """
    df_eval = df_test.copy()
    df_eval['pred'] = y_pred
    df_eval['actual'] = y_true
    
    # Hit rate
    hit_rate = np.mean((df_eval['pred'] > 0) == (df_eval['actual'] > 0))
    logger.info(f"Hit Rate (Directional Accuracy): {hit_rate:.4f}")
    
    # Information Coefficient (Spearman rank correlation per month)
    ic_list = []
    for dt, group in df_eval.groupby('date'):
        if len(group) > 2:
            ic = group['pred'].corr(group['actual'], method='spearman')
            ic_list.append(ic)
            
    mean_ic = np.nanmean(ic_list)
    logger.info(f"Mean Information Coefficient (IC): {mean_ic:.4f}")
    return hit_rate, mean_ic

def train_model():
    config = load_config()
    data_path = "data/processed/feature_matrix.csv"
    if not os.path.exists(data_path):
        logger.error(f"Feature matrix not found at {data_path}")
        return
        
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    df = df.dropna(subset=['target_return']).reset_index(drop=True)
    
    # We must drop rows where features are NaN, or fill them.
    # We forward filled earlier, but some initial windows might be NaN
    df = df.dropna().reset_index(drop=True)
    
    split_year = config["model"]["return_predictor"]["split_year"]
    clip_lower, clip_upper = config["model"]["return_predictor"]["target_clip"]
    
    # Chronological Split
    train_mask = df['date'].dt.year < split_year
    test_mask = df['date'].dt.year >= split_year
    
    df_train = df[train_mask].copy()
    df_test = df[test_mask].copy()
    
    logger.info(f"Train samples: {len(df_train)}, Test samples: {len(df_test)}")
    
    # Define features
    exclude_cols = ['date', 'ticker', 'year_month', 'target_return', 'monthly_return', 'excess_return']
    features = [c for c in df.columns if c not in exclude_cols]
    
    X_train = df_train[features]
    y_train = df_train['target_return']
    
    X_test = df_test[features]
    y_test = df_test['target_return']
    
    # Target clipping (Winsorization) based on train bounds
    lower_bound = y_train.quantile(clip_lower)
    upper_bound = y_train.quantile(clip_upper)
    logger.info(f"Clipping targets between {lower_bound:.4f} and {upper_bound:.4f}")
    
    y_train_clipped = np.clip(y_train, lower_bound, upper_bound)
    
    # RF Setup
    rf_params = config["model"]["return_predictor"]["rf_params"]
    rf = RandomForestRegressor(
        n_estimators=rf_params.get("n_estimators", 100),
        max_depth=rf_params.get("max_depth", 5),
        min_samples_split=rf_params.get("min_samples_split", 10),
        random_state=rf_params.get("random_state", 42),
        n_jobs=-1
    )
    
    # We can do GridSearchCV with TimeSeriesSplit
    # For speed, we will train directly with config params, 
    # but let's set up the param_grid as requested.
    param_grid = {
        'max_depth': [5, 7],
        'min_samples_split': [10, 20]
    }
    tscv = TimeSeriesSplit(n_splits=3)
    grid = GridSearchCV(rf, param_grid, cv=tscv, scoring='neg_mean_squared_error', n_jobs=-1)
    
    logger.info("Training Random Forest...")
    
    # MLflow tracking
    mlflow.set_experiment("Return_Predictor_Nifty50")
    with mlflow.start_run():
        grid.fit(X_train, y_train_clipped)
        best_model = grid.best_estimator_
        
        logger.info(f"Best params: {grid.best_params_}")
        mlflow.log_params(grid.best_params_)
        
        # Test Evaluation
        y_pred = best_model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mlflow.log_metric("test_rmse", rmse)
        
        hit_rate, ic = evaluate_predictions(y_test, y_pred, df_test)
        mlflow.log_metric("hit_rate", hit_rate)
        mlflow.log_metric("ic", ic)
        
        # Save model
        model_path = config["model"]["return_predictor"]["model_path"]
        Path(model_path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(best_model, model_path)
        logger.info(f"Model saved to {model_path}")
        
        # Store bounds for inference
        joblib.dump((lower_bound, upper_bound), str(Path(model_path).parent / "target_bounds.joblib"))

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    train_model()
