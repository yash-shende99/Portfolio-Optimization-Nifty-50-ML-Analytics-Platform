import os
import pandas as pd
import numpy as np
import joblib
import yaml
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def predict_returns():
    config = load_config()
    model_path = config["model"]["return_predictor"]["model_path"]
    data_path = "data/processed/feature_matrix.csv"
    
    if not os.path.exists(model_path):
        logger.error(f"Model not found at {model_path}. Train the model first.")
        return
        
    logger.info("Loading Random Forest model...")
    model = joblib.load(model_path)
    # We can also load bounds if we want to clip outputs, but tree predictions are naturally bounded.
    
    # Load latest data to predict next month returns
    df = pd.read_csv(data_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort by date and get the latest available date's features
    latest_date = df['date'].max()
    logger.info(f"Generating predictions for next month based on features from {latest_date.date()}")
    
    df_latest = df[df['date'] == latest_date].copy()
    
    exclude_cols = ['date', 'ticker', 'year_month', 'target_return', 'monthly_return', 'excess_return']
    features = [c for c in df_latest.columns if c not in exclude_cols]
    
    X_latest = df_latest[features]
    
    # Predict
    preds = model.predict(X_latest)
    df_latest['predicted_return'] = preds
    df_latest['model_version'] = config["model"]["return_predictor"]["type"]
    
    # Format output
    output_cols = ['date', 'ticker', 'predicted_return', 'model_version']
    predictions_df = df_latest[output_cols]
    
    out_path = "data/processed/latest_predictions.csv"
    predictions_df.to_csv(out_path, index=False)
    logger.info(f"Predictions saved to {out_path}")
    logger.info("\n" + str(predictions_df[['ticker', 'predicted_return']].head(10)))
    
    return predictions_df

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent.parent)
    predict_returns()
