import numpy as np
import pandas as pd

def calculate_metrics(returns_series: pd.Series, risk_free_rate: float = 0.0) -> dict:
    """
    Calculate performance metrics for a portfolio's return series.
    Assumes monthly returns.
    """
    if len(returns_series) == 0:
        return {}
        
    # Annualized return (assuming monthly data -> 12 periods/year)
    cum_return = (1 + returns_series).prod() - 1
    n_years = len(returns_series) / 12.0
    
    if n_years > 0:
        ann_return = (1 + cum_return) ** (1 / n_years) - 1
    else:
        ann_return = 0.0
        
    # Annualized volatility
    ann_volatility = returns_series.std() * np.sqrt(12)
    
    # Sharpe Ratio
    if ann_volatility > 0:
        sharpe_ratio = (ann_return - risk_free_rate) / ann_volatility
    else:
        sharpe_ratio = 0.0
        
    # Max Drawdown
    cumulative = (1 + returns_series).cumprod()
    rolling_max = cumulative.cummax()
    drawdown = (cumulative - rolling_max) / rolling_max
    max_drawdown = drawdown.min()
    
    metrics = {
        'Cumulative Return': cum_return,
        'Annualized Return': ann_return,
        'Annualized Volatility': ann_volatility,
        'Sharpe Ratio': sharpe_ratio,
        'Max Drawdown': max_drawdown
    }
    
    return metrics
