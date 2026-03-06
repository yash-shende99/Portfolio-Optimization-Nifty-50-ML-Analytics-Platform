# Nifty 50 Portfolio ML System

A production-ready machine learning pipeline for forecasting returns, assessing volatility, detecting market regimes, and producing an optimized Nifty 50 portfolio.

## Architecture

1. **Data Pipeline**: Automatically fetches daily prices from `yfinance`, cleans them, computes returns, and generates a monthly feature matrix including technical indicators (Momentum, RSI, MACD, Volatility) and cross-sectional ranks.
2. **Return Predictor**: A Random Forest model wrapped in MLflow that predicts one-month forward excess returns, trained using TimeSeriesSplit on pre-2023 data.
3. **Volatility Forecaster**: Uses `arch` to estimate GARCH(1,1) rolling volatility and `LedoitWolf` shrinkage for covariance.
4. **Regime Detector**: An HMM (`hmmlearn`) model identifying Bull/Normal/Bear regimes from index returns & volatility.
5. **Optimizer**: A mean-variance formulation using `cvxpy` that maximizes return minus risk, long-only, max 5% allocation. Blends model risk aversion based on the detected regime.
6. **API & Dashboard**: FastAPI for serving allocations and Streamlit for an interactive dashboard displaying top holdings and historical metrics.

## Setup Instructions

### Local Development

1. Create a virtual environment & install requirements
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Generate Data and Run Pipeline
```bash
# 1. Fetch, preprocess, featurize
python src/data_pipeline/fetch_data.py
python src/data_pipeline/preprocess.py
python src/data_pipeline/feature_engineering.py
python src/data_pipeline/init_db.py

# 2. Train Models
python src/models/return_predictor/train.py
python src/models/regime/hmm_train.py

# 3. Predict & Optimize
python src/models/return_predictor/predict.py
python src/models/volatility/garch.py
python src/models/volatility/covariance.py
python src/models/regime/hmm_predict.py
python src/optimizer/portfolio.py

# 4. Backtest simulation
python src/backtesting/backtest.py
```

### Dashboard & API
Run the backend API:
```bash
python src/api/main.py
```

Run the Streamlit Dashboard (in another terminal):
```bash
streamlit run src/dashboard/app.py
```

### Docker Deployment
Build and run the entire stack using `docker-compose`:
```bash
docker-compose up --build
```
This spans up a PostgreSQL instance, the FastAPI backend, and the interactive Streamlit Dashboard frontend automatically connected to the API!
