import pytest
import pandas as pd
import numpy as np
from src.data_pipeline.preprocess import clean_data, compute_returns
from src.backtesting.metrics import calculate_metrics

def test_clean_data():
    df = pd.DataFrame({
        'date': ['2023-01-01', '2023-01-02', '2023-01-03'],
        'ticker': ['AAPL', 'AAPL', 'AAPL'],
        'adjusted_close': [100.0, np.nan, 105.0]
    })
    
    res = clean_data(df)
    assert len(res) == 3
    assert res['adjusted_close'].iloc[1] == 100.0 # Forward fill check

def test_metrics():
    # Simplistic continuous positive return
    returns = pd.Series([0.01, 0.02, 0.01, -0.01, 0.03, 0.01] * 10)
    metrics = calculate_metrics(returns)
    assert metrics['Cumulative Return'] > 0
    assert metrics['Annualized Volatility'] > 0
    assert metrics['Sharpe Ratio'] > 0
    assert metrics['Max Drawdown'] <= 0
