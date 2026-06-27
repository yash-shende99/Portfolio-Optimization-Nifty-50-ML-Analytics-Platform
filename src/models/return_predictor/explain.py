import pandas as pd
import numpy as np
import joblib
import shap
import os
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def generate_explanations():
    base_path = Path(__file__).parent.parent.parent.parent
    model_path = base_path / "src" / "models" / "return_predictor" / "lgbm_model.joblib"
    features_path = base_path / "data" / "processed" / "feature_matrix.csv"
    
    if not model_path.exists() or not features_path.exists():
        logger.error("Required artifacts not found for SHAP explanation.")
        return
        
    logger.info("Loading model and features for XAI...")
    model = joblib.load(model_path)
    df = pd.read_csv(features_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # Get the latest month only
    latest_month = df['year_month'].max()
    df_latest = df[df['year_month'] == latest_month].copy()
    
    # Exclude non-feature columns
    exclude_cols = ['date', 'ticker', 'adjusted_close', 'daily_return', 'monthly_return', 'year_month']
    feature_cols = [c for c in df_latest.columns if c not in exclude_cols]
    
    X_latest = df_latest[feature_cols].fillna(0)
    
    logger.info("Computing SHAP values...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_latest)
    
    explanations = []
    
    for i, ticker in enumerate(df_latest['ticker']):
        # Combine feature names with their absolute SHAP value impact
        impacts = dict(zip(feature_cols, shap_values[i]))
        # Sort by absolute impact descending
        sorted_impacts = sorted(impacts.items(), key=lambda x: abs(x[1]), reverse=True)
        top_driver = sorted_impacts[0]
        second_driver = sorted_impacts[1]
        
        # Determine natural language
        direction = "bullish" if top_driver[1] > 0 else "bearish"
        
        text = f"Primary driver is {top_driver[0].replace('_', ' ')} contributing a {direction} signal ({top_driver[1]:.4f}). "
        
        direction2 = "bullish" if second_driver[1] > 0 else "bearish"
        text += f"Secondary factor is {second_driver[0].replace('_', ' ')} ({direction2})."
        
        explanations.append({
            "ticker": ticker,
            "top_feature": top_driver[0],
            "top_shap_value": top_driver[1],
            "justification": text
        })
        
    df_exp = pd.DataFrame(explanations)
    out_path = base_path / "data" / "processed" / "latest_explanations.csv"
    df_exp.to_csv(out_path, index=False)
    logger.info(f"Saved SHAP explanations to {out_path}")

if __name__ == "__main__":
    generate_explanations()
