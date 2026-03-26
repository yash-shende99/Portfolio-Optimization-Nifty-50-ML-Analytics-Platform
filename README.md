# AI-Powered Wealth Manager & Nifty 50 ML System

A full-stack portfolio analytics and optimization platform built around Indian equity data (Nifty 50). This project combines a data pipeline, machine learning models, and a user-facing dashboard to:

- Forecast future stock returns using supervised learning
- Estimate risk and covariance using volatility models
- Detect market regimes (bull/bear) using Hidden Markov Models
- Construct an optimized, long-only Nifty 50 portfolio with risk constraints
- Provide explainable AI (XAI) insights and actionable portfolio health signals

---

## 🚀 What This Project Does

### 📈 Data & Feature Pipeline
- Ingests **historical prices**, **volumes**, and **sentiment signals**.
- Builds a feature matrix with technical and fundamental signals for each stock.
- Stores intermediate/processed artifacts under `data/processed/`.

### 🤖 Machine Learning Components
- **Return Predictor (Random Forest)**: Forecasts 1-month forward returns for each stock.
- **Volatility Model (GARCH / Covariance Estimation)**: Produces covariance matrices used in portfolio optimization.
- **Market Regime Detector (HMM)**: Labels periods as Bull/Bear to adjust risk targets dynamically.
- **Portfolio Optimizer (Convex Optimization)**: Solves a constrained optimization problem to generate weights under:
  - Long-only constraints
  - Max weight per asset (e.g., 20%)
  - Regime-aware risk adjustments

### 🧠 Explainable AI (XAI)
- Uses SHAP to produce feature importance explanations for each stock’s predicted return.
- Provides readable “why” explanations to help users understand model decisions.

### 📊 Frontend Dashboard (Next.js)
- Visualizes target allocations, return/risk forecasts, regime signals, and portfolio health scores.
- Supports uploading portfolios via CSV or manual entry.
- Displays risk alerts, concentration warnings, and suggested rebalancing actions.

---

## 🗂️ Repository Structure (High Level)

- `src/` – Python backend and ML pipeline code
  - `api/` – FastAPI app for serving predictions and dashboard data
  - `data_pipeline/` – Data fetching, feature engineering, preprocessing
  - `models/` – Training & inference code for returns, volatility, regime, optimizer
  - `optimizer/` – Portfolio construction logic
- `frontend/` – Next.js dashboard UI
- `data/` – Raw and processed datasets used by the pipeline
- `dags/` – Airflow DAGs for orchestrating the full pipeline (if used)
- `notebooks/` – Analysis, experiments, and exploratory notebooks
- `run_full_pipeline.bat` – Convenience script to run the full ETL+training+export pipeline

---

## ✅ Quick Start (Local Development)

### 1) Setup Python Environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2) Prepare Frontend

```bash
cd frontend
npm install
```

### 3) Run the Full Pipeline

From the repository root:

```bash
./run_full_pipeline.bat
```

This will:
- Fetch and preprocess raw data
- Train models (return predictor, regime detector, volatility)
- Generate `data/processed/latest_*.csv` artifacts for the API

### 4) Start the Backend

From the repo root (with the venv active):

```bash
python src/api/main.py
```

Visit: `http://localhost:8000`

### 5) Start the Frontend

In a new terminal:

```bash
cd frontend
npm run dev
```

Visit: `http://localhost:3000/dashboard`

---

## 🔧 Configuration

- `config/config.yaml` holds runtime settings for the pipeline and models.
- `config/schema.sql` defines the structure for any persistent database schema.

---

## 🧪 Testing

Run the unit tests:

```bash
python -m pytest
```

---

## 📌 Notes / Tips

- Make sure the pipeline has run successfully before starting the backend; the API depends on `data/processed/latest_*.csv` artifacts.
- If you change model code, re-run `run_full_pipeline.bat` to refresh model artifacts.

---

## 📚 Additional Resources
- `notebooks/` contains exploratory analysis and model evaluation notebooks.
- `dags/portfolio_pipeline.py` is a starting point for integrating with an Airflow scheduler.
