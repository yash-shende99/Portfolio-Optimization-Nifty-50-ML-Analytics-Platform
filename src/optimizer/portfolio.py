import os
import pandas as pd
import numpy as np
import logging
import yaml
import cvxpy as cp
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))
from src.optimizer.fusion import fuse_predictions

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def optimize_portfolio():
    """
    Solves Mean-Variance Optimization using CVXPY for a range of risk tolerances.
    Saves all results to a single static CSV file for the dashboard to read.
    """
    config = load_config()
    max_weight = config["optimizer"]["max_weight"]
    
    mu_series, cov_df, _ = fuse_predictions()
    
    if mu_series is None or cov_df is None:
        logger.error("Failed to retrieve fused predictions. Aborting optimization.")
        return None
        
    n_assets = len(mu_series)
    tickers = mu_series.index.tolist()
    
    mu = mu_series.values
    Sigma = cov_df.values
    
    returns_path = "data/processed/latest_predictions.csv"
    if os.path.exists(returns_path):
        df_returns = pd.read_csv(returns_path)
        latest_date = df_returns['date'].max()
    else:
        latest_date = pd.Timestamp.now().strftime("%Y-%m-%d")
        
    all_portfolios = []
    
    logger.info(f"Solving Portfolio Optimization across risk tolerances for {n_assets} assets...")
    
    for rt in np.arange(0.0, 1.1, 0.1):
        rt_round = round(rt, 1)
        
        w = cp.Variable(n_assets)
        expected_return = mu.T @ w
        risk = cp.quad_form(w, Sigma)
        objective = cp.Maximize(expected_return - rt_round * risk)
        
        constraints = [
            cp.sum(w) == 1,
            w >= 0,
            w <= max_weight
        ]
        
        prob = cp.Problem(objective, constraints)
        
        try:
            prob.solve(solver=cp.OSQP)
        except Exception:
            pass
            
        if prob.status != cp.OPTIMAL:
            try:
                prob.solve(solver=cp.SCS)
            except Exception:
                pass
                
        weights = w.value
        if weights is None:
            weights = np.ones(n_assets) / n_assets
            
        weights[weights < 1e-4] = 0.0
        weights = weights / weights.sum()
        
        for t, weight in zip(tickers, weights):
            if weight > 0:
                all_portfolios.append({
                    'date': latest_date,
                    'ticker': t,
                    'weight': weight,
                    'risk_tolerance': rt_round
                })
                
    df_port = pd.DataFrame(all_portfolios)
    out_path = "data/processed/latest_portfolio.csv"
    df_port.to_csv(out_path, index=False)
    logger.info(f"Portfolios for all risk tolerances saved to {out_path}")
    
    return df_port

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    optimize_portfolio()
