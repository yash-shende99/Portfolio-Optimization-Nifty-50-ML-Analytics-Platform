# AI-Powered Wealth Manager & Nifty 50 ML System

A production-ready machine learning pipeline and Next.js B2C web platform for forecasting returns, assessing portfolio risk, detecting market regimes, and producing an optimized Nifty 50 portfolio with an "AI Portfolio Doctor".

## 🚀 Key Features
- **AI Portfolio Doctor**: Upload your existing portfolio (via CSV or manual entry) and receive a 0-100 ML Health Score, Expected Return forecasts, Risk/Concentration Alerts, and explicitly targeted rebalancing suggestions.
- **Explainable AI (XAI)**: SHAP-based justifications are generated for every predicted stock, translating complex ML into simple, human-readable insights directly on the dashboard.
- **Regime-Aware Risk Adjustments**: A Dynamic Contextual Bandit agent monitors a Hidden Markov Model (HMM) regime detector. In 'Bear' regimes, risk constraints are instantly tightened.

## 🏗️ Architecture

1. **Frontend (Next.js & React)**
   - **Command Center**: The primary dashboard visualizing pie charts of the target allocation, system KPIs, News Sentiment, XAI justifications, and local custom portfolio warnings.
   - **Portfolio Risk Analyzer**: A dynamic form allowing users to enter Quantity and Buy Price for custom holdings and instantly simulate ML risk algorithms.

2. **Backend (FastAPI)**
   - Serves critical REST endpoints (`/predict`, `/volatility`, `/regime`, `/portfolio`, `/explain`, `/sentiment`, etc.).
   - Includes complex mathematical aggregations for the `/portfolio_analysis` route to compute overall beta, expected return, and the AI Health Score.

3. **ML Pipeline & Orchestration**
   - **RandomForest Return Predictor**: Predicts 1-month forward returns via cross-sectional fundamental and technical features.
   - **GARCH Volatility Forecaster**: Estimates covariance matrices.
   - **HMM Market Regime**: Detects Bull/Bear environments.
   - **Portfolio Optimizer**: Solves Long-Only, max 20% weight convex optimization (CVXPY) constraints based on risk profiles.

## 💻 Setup Instructions

### 1. Python Environment

Create a virtual environment and install the requirements:
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Frontend Environment
```bash
cd frontend
npm install
# or yarn install
```

## 🏃 Running the Application

### Step 1: Execute the ML Pipeline
Instead of running files manually, use the automated batch scripts to safely execute the entire multi-stage data fetching, training, explaining, and optimizing pipeline:
```bash
./run_full_pipeline.bat
```
*(This will generate the required artifacts like `latest_portfolio.csv` and `latest_predictions.csv` in `data/processed/` that the API needs).*

### Step 2: Start the FastAPI Backend
In the root directory, with the python environment activated:
```bash
python src/api/main.py
```
*The API will be available at `http://localhost:8000`*

### Step 3: Start the Next.js Frontend
In a new terminal window:
```bash
cd frontend
npm run dev
```
*The Dashboard is accessible at `http://localhost:3000/dashboard`*

