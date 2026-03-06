import os
import sys
import pandas as pd
import numpy as np
import logging
import yaml
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))
from src.backtesting.metrics import calculate_metrics

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def run_backtest():
    """
    Simulates a walk-forward backtest by reading the actual monthly returns
    and applying the latest portfolio weights.
    For this MVP, we will simulate the loop by reading historical features,
    applying predictions statically, but since our model predicts next month
    we can approximate performance by merging predictions with next month returns.
    """
    config = load_config()
    start_year = config["backtest"]["start_year"]
    
    returns_path = "data/processed/monthly_returns.csv"
    preds_path = "data/processed/latest_predictions.csv"
    port_path = "data/processed/latest_portfolio.csv"
    
    if not (os.path.exists(returns_path) and os.path.exists(port_path)):
        logger.error("Required data for backtesting not found. Run previous steps.")
        return
        
    df_returns = pd.read_csv(returns_path)
    df_returns['date'] = pd.to_datetime(df_returns['date'])
    df_returns['year_month'] = df_returns['date'].dt.to_period('M')
    
    # We will compute the performance of the latest portfolio on the MOST RECENT month's actual return
    # A true walk-forward would retrain/predict in a loop.
    # We will simulate a simplistic dummy evaluation.
    
    df_port = pd.read_csv(port_path)
    
    # Let's assess performance over the latest available month
    latest_month = df_returns['year_month'].max()
    df_actual = df_returns[df_returns['year_month'] == latest_month].copy()
    
    # Merge weights
    df_eval = pd.merge(df_actual, df_port, on='ticker', how='inner')
    
    transaction_cost = config["optimizer"]["transaction_cost"]
    
    # Portfolio return for this month
    # Return = Sum(weight * actual_return) - transaction_cost * sum(abs(weight changes))
    # Assuming initial cash, trade delta = weight
    trade_costs = df_eval['weight'].abs().sum() * transaction_cost
    port_return = (df_eval['weight'] * df_eval['monthly_return']).sum() - trade_costs
    
    logger.info(f"--- Backtest Snapshot for {latest_month} ---")
    logger.info(f"Portfolio Return: {port_return:.2%}")
    logger.info(f"Transaction Costs: {trade_costs:.2%}")
    
    # Compute equity curve over the whole test set (dummy using equal weight benchmark)
    df_test = df_returns[df_returns['date'].dt.year >= start_year].copy()
    eq_returns = df_test.groupby('year_month')['monthly_return'].mean()
    
    metrics = calculate_metrics(eq_returns)
    logger.info(f"--- Equal Weight Benchmark ({start_year}-Present) ---")
    for k, v in metrics.items():
        if 'Ratio' in k or 'Drawdown' in k:
            logger.info(f"{k}: {v:.4f}")
        else:
            logger.info(f"{k}: {v:.2%}")

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    run_backtest()
