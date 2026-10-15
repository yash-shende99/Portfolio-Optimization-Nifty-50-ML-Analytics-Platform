# Nifty 50 AI Portfolio Optimization & Quantitative Wealth Platform

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](#prerequisites)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](#technology-stack)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black.svg?logo=next.js&logoColor=white)](#technology-stack)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?logo=react&logoColor=black)](#technology-stack)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)](#technology-stack)
[![CVXPY](https://img.shields.io/badge/Optimizer-CVXPY-orange.svg)](#technology-stack)
[![Tests](https://img.shields.io/badge/Tests-Passing%20(pytest)-brightgreen.svg)](#testing-and-code-quality)

An end-to-end quantitative portfolio engineering and robo-advisory platform designed for Indian equity markets (**Nifty 50 constituents**). The platform combines automated data ingestion, multi-factor feature engineering, supervised return forecasting, econometric volatility modeling, hidden Markov regime detection, explainable AI (SHAP), and convex portfolio optimization (Markowitz mean-variance with dynamic risk aversion).

The system serves both retail and quantitative workflows through a high-performance **FastAPI backend** and an interactive **Next.js 16 + React 19 web dashboard**, supplemented by an analytical **Streamlit interface**.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Visual Artifacts & Model Explainability](#visual-artifacts--model-explainability)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Environment Variables and Configuration](#environment-variables-and-configuration)
- [Running the Application](#running-the-application)
- [How to Use the Application](#how-to-use-the-application)
- [API Documentation](#api-documentation)
- [Database and Data Management](#database-and-data-management)
- [Testing and Code Quality](#testing-and-code-quality)
- [Deployment & Containerization](#deployment--containerization)
- [Security and Hardening Considerations](#security-and-hardening-considerations)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Licence](#licence)
- [Acknowledgements & References](#acknowledgements--references)
- [Project Links & In-Depth Documentation](#project-links--in-depth-documentation)

---

## Overview

### The Problem
Traditional retail portfolio management and robo-advisors often rely on static asset allocations (e.g., standard 60/40 equity-debt rules) or naive historical return extrapolation. These approaches fail during macro regime shifts, suffer from severe single-stock concentration, and ignore forward-looking volatility clustering and structural correlation breakdown. Furthermore, machine learning models in finance are frequently treated as "black boxes," leaving investors without clear rationale behind rebalancing signals.

### The Solution
This platform introduces an institutional-grade, multi-stage quantitative pipeline for the **Nifty 50 universe**:
1. **Systematic Ingestion & Engineering**: Captures price, volume, and sentiment data across all 50 constituent equities, generating momentum, volatility, volume, and technical oscillator indicators.
2. **Supervised Return Forecasting**: Employs gradient boosted trees (LightGBM) and ensemble regressors (Random Forest) to forecast 1-month forward returns with target outlier clipping.
3. **Volatility & Correlation Modeling**: Fits GARCH(1,1) processes to capture conditional heteroskedasticity and computes Ledoit-Wolf shrinkage covariance matrices, filtered via NetworkX Minimum Spanning Trees (MST).
4. **Macro Regime Awareness**: Applies a 3-state Gaussian Hidden Markov Model (HMM) to classify market conditions into **Bull**, **Normal**, and **Bear** regimes.
5. **Dynamic Risk-Penalized Convex Optimization**: Solves a Markowitz mean-variance quadratic program via CVXPY with long-only constraints ($w_i \ge 0$), a 20% single-asset cap ($w_i \le 0.20$), and full investment ($\sum w_i = 1$). Risk aversion ($\lambda$) dynamically adapts based on macro regime probabilities and contextual bandit volatility penalties.
6. **Transparent Explainability (XAI)**: Uses Tree SHAP to quantify the exact feature attributions driving return predictions for every stock.

---

## Key Features

### 1. Quantitative ML Pipeline & Optimization
- **Return Predictor**: Trained on rolling multi-year cross-sectional technical features (RSI, MACD diff, Bollinger %B, ATR, CCI, 12-month momentum, 52-week high distance, volume ratios). Target returns are winsorized between the 1st and 99th percentiles to mitigate outlier distortion.
- **GARCH(1,1) Volatility Forecasting**: Models conditional variance over rolling windows (~756 trading days / 3 years), capturing volatility clustering.
- **Ledoit-Wolf Shrinkage Covariance**: Replaces sample covariance matrices with shrinkage estimators to prevent optimization instability and ill-conditioned matrix inversion.
- **Network Minimum Spanning Tree (MST)**: Constructs asset correlation topologies to identify high-centrality equity clusters and prevent overexposure to correlated market sectors.
- **3-State Gaussian HMM**: Unsupervised detection of market latent states (`Bull`, `Normal`, `Bear`) using index returns and realized volatility.
- **Convex Portfolio Construction**: CVXPY optimization sweeps user risk tolerances ($0.0 \le \text{RT} \le 1.0$), pre-calculating frontier weights.

### 2. Explainable AI (XAI)
- **SHAP TreeExplainer Attributions**: Calculates exact Shapley values for top signals (e.g., 6-month momentum rank, distance to 52-week high, volume ratio).
- **Human-Readable "Why" Justifications**: Converts mathematical attributions into actionable text summaries displayed directly in the user interface.

### 3. Full-Stack User Interfaces
- **Next.js 16 Web Dashboard (`frontend/`)**: Modern UI built with React 19, TypeScript, and TailwindCSS v4:
  - **Executive Overview**: Real-time market regime pill banner, dynamic asset allocation donut charts, top predicted alpha picks, and SHAP insight cards.
  - **Portfolio Health Analyzer**: Allows users to input existing holdings, displaying concentration alerts (e.g., single positions $> 20\%$), portfolio beta, expected forward return, and rebalancing recommendations.
  - **Goal Planner & SIP Calculator**: Calculates compound growth trajectories and monthly SIP requirements to achieve financial targets.
  - **Fund Screener**: AI-ranked mutual fund and ETF scoring.
- **Streamlit Analytical Dashboard (`src/dashboard/`)**: Rapid quantitative inspection dashboard for exploratory data analysis, covariance inspection, and regime transitions.

### 4. Enterprise API & Security
- **FastAPI Backend**: Asynchronous REST API serving predictions, volatilities, regime probabilities, SHAP explanations, correlation graph JSON, and portfolio optimization endpoints.
- **Authentication**: JWT authentication with OAuth2 password bearer tokens and bcrypt password hashing via PassLib.
- **Pluggable Persistence**: Automatic SQLite database support for zero-config local development, with direct migration support for production PostgreSQL / TimescaleDB via SQLAlchemy.

---

## Visual Artifacts & Model Explainability

The pipeline exports visual diagnostic artifacts to inspect feature gain and weight distributions:

| Enhanced Feature Importance | Feature Gain Distribution |
| :---: | :---: |
| ![Enhanced Feature Importance](feature_importance_enhanced.png) | ![Feature Gain](feature_importance_gain.png) |

| Raw Feature Importance | Feature Weight Distribution |
| :---: | :---: |
| ![Feature Importance](feature_importance.png) | ![Feature Weight](feature_importance_weight.png) |

---

## Architecture Overview

```mermaid
flowchart TD
    subgraph Data_Pipeline["1. Ingestion & Preprocessing"]
        A[Nifty 50 Historical Data\nyfinance / NSE API] --> B[preprocess.py\nForward-fill, Returns, Cleaning]
        B --> C[feature_engineering.py\nMomentum, Volatility, RSI, MACD, Volume]
    end

    subgraph Quantitative_Engines["2. Quantitative Inference Engines"]
        C --> D["Return Predictor\nLightGBM / RF Regressor"]
        C --> E["Volatility Engine\nGARCH(1,1) + Ledoit-Wolf Covariance"]
        C --> F["Regime Detector\n3-State Gaussian HMM"]
        D --> G["SHAP XAI Engine\nTreeExplainer Justifications"]
    end

    subgraph Optimization_Layer["3. Fusion & Optimization"]
        D & E & F --> H["fusion.py\nDynamic Contextual Bandit Penalty"]
        H --> I["CVXPY Optimizer\nMarkowitz Quadratic Program\nLong-Only, Max 20% Cap"]
        I --> J[("Processed Artifacts\ndata/processed/*.csv")]
    end

    subgraph Application_Layer["4. API & Presentation"]
        J --> K["FastAPI Backend\nsrc/api/main.py :8000"]
        L[("Database\nSQLite / PostgreSQL")] <--> K
        K <--> M["Next.js Web Dashboard\nfrontend/ :3000"]
        K <--> N["Streamlit Dashboard\nsrc/dashboard/ :8501"]
    end
```

For the comprehensive high-level and low-level architecture breakdown, sequence diagrams, and mathematical formulation, see the [System Architecture & Interview Guide](docs/SYSTEM_ARCHITECTURE_AND_INTERVIEW_GUIDE.md).

---

## Technology Stack

| Domain | Technology | Purpose & Verification |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 16.1.6 (App Router) | Server and client rendering for the modern web dashboard (`frontend/package.json`) |
| **UI Library** | React 19.2.4 | Component-driven UI architecture |
| **Styling** | TailwindCSS 4.2.1 | Utility-first styling with modern PostCSS pipeline |
| **Icons & Charts** | Lucide React, Recharts 3.7.0 | Financial charts, allocation donuts, and metrics visualizers |
| **Analytical UI** | Streamlit 1.25+ | Quantitative workbench (`src/dashboard/main.py`) |
| **Backend API** | FastAPI 0.100+, Uvicorn 0.23+ | Asynchronous REST API serving inference and optimization endpoints |
| **Optimization** | CVXPY 1.3.1+ | Quadratic programming solver for constrained Markowitz mean-variance optimization |
| **Machine Learning** | LightGBM 4.0+, Scikit-Learn 1.2+ | Cross-sectional return prediction models and feature transformers |
| **Time Series & Volatility** | `arch` 6.0+, `hmmlearn` 0.3+ | GARCH(1,1) conditional volatility and 3-state Gaussian Hidden Markov Models |
| **Explainable AI** | SHAP 0.42+ | TreeExplainer attribution scoring for multi-factor models |
| **Data & Financial Math** | Pandas 2.0+, NumPy 1.24+, `ta` 0.10+ | DataFrames, matrix operations, and technical indicators |
| **Market Data** | `yfinance` 0.2.18+ | Real-time and historical equity prices from Yahoo Finance |
| **Database & ORM** | SQLAlchemy 2.0+, SQLite, PostgreSQL | Relational storage for user profiles, goals, and credentials |
| **Authentication** | PassLib (bcrypt), Python-Jose | Password hashing and signed HS256 JWT tokens |
| **Orchestration** | Apache Airflow DAG | Automated batch workflow specification (`dags/portfolio_pipeline.py`) |
| **Testing** | Pytest 7.4+ | Automated unit tests for data preprocessing and financial metrics |

---

## Repository Structure

```text
portfolio-ml/
├── config/
│   ├── config.yaml                    # Master project configuration (tickers, hyperparameters, constraints)
│   └── schema.sql                     # PostgreSQL / TimescaleDB production schema
├── dags/
│   └── portfolio_pipeline.py          # Apache Airflow DAG for scheduled weekday execution
├── data/
│   ├── portfolio.db                   # Local SQLite database (users, profiles, financial goals)
│   ├── processed/                     # Artifacts generated by the quantitative pipeline
│   │   ├── clean_prices.csv           # Cleaned historical prices
│   │   ├── covariance.csv             # Ledoit-Wolf shrinkage covariance matrix
│   │   ├── latest_explanations.csv    # Per-asset SHAP attribution values
│   │   ├── latest_portfolio.csv       # Pre-computed optimal allocations across risk tolerances
│   │   ├── latest_predictions.csv     # 1-month return forecasts
│   │   ├── latest_regime.csv          # HMM state probabilities (Bull, Normal, Bear)
│   │   ├── latest_sentiment.csv       # Sentiment polarity scores
│   │   └── volatility_forecasts.csv   # GARCH annualised volatility estimates
│   └── raw/                           # Raw ingested market data cache
├── docker/
│   ├── docker-compose.yml             # Multi-service compose (TimescaleDB, API, Streamlit)
│   ├── Dockerfile.api                 # Container recipe for FastAPI backend
│   └── Dockerfile.dashboard           # Container recipe for Streamlit service
├── docs/
│   └── SYSTEM_ARCHITECTURE_AND_INTERVIEW_GUIDE.md  # Comprehensive HLD/LLD & interview defense
├── frontend/                          # Next.js 16 Web Application
│   ├── package.json                   # Frontend dependencies and npm scripts
│   ├── src/
│   │   └── app/
│   │       ├── dashboard/             # Main dashboard, portfolio analyzer, goals, fund screener
│   │       ├── login/                 # User registration and authentication pages
│   │       ├── layout.tsx             # Root layout and metadata
│   │       └── page.tsx               # Landing redirect page
│   └── tailwind.config.ts / postcss   # TailwindCSS build configuration
├── notebooks/                         # Exploratory research and model prototyping notebooks
├── src/
│   ├── api/                           # FastAPI Application
│   │   ├── auth.py                    # JWT authentication router, bcrypt hashing, profile endpoints
│   │   ├── database.py                # SQLAlchemy engine and ORM models (User, UserProfile)
│   │   └── main.py                    # API entry point, CORS configuration, data endpoints
│   ├── backtesting/                   # Backtesting harness and financial evaluation metrics
│   │   ├── backtest.py                # Historical rebalancing simulator
│   │   └── metrics.py                 # Sharpe, Sortino, Max Drawdown, Calmar calculations
│   ├── dashboard/                     # Streamlit Application
│   │   ├── main.py                    # Streamlit entry point
│   │   └── pages/                     # Dedicated Streamlit analytic pages
│   ├── data_pipeline/                 # Data Ingestion & Transformation
│   │   ├── fetch_data.py              # Ingests Nifty 50 OHLCV data
│   │   ├── preprocess.py              # Forward-filling, returns computation, corporate action alignment
│   │   ├── feature_engineering.py     # Technical indicator generator (momentum, RSI, MACD, etc.)
│   │   └── sentiment.py               # News sentiment scorer (NewsAPI + VADER)
│   ├── models/                        # Quantitative Models
│   │   ├── regime/                    # Gaussian HMM 3-state regime detection
│   │   ├── return_predictor/          # LightGBM / Random Forest training, inference, and SHAP explainability
│   │   └── volatility/                # GARCH(1,1), Ledoit-Wolf covariance, and Network MST
│   └── optimizer/                     # Portfolio Optimization
│       ├── fusion.py                  # Contextual bandit dynamic risk penalty calculator
│       └── portfolio.py               # CVXPY Markowitz quadratic program solver
├── tests/
│   └── test_pipeline.py               # Pytest suite for data hygiene and financial metric formulas
├── .env                               # Local environment configuration file (git-ignored)
├── build_features_and_train.py        # Standalone script for feature creation and model training
├── comparative_analysis.py            # Comparative evaluation script for ML models
├── feature_importance_*.png           # Visual model feature importance diagnostic plots
├── INTERVIEW_QA_REFERENCE.md          # 330 institutional interview questions & deep architectural answers
├── PROJECT_ANALYSIS_AND_COMPLETE_399_QA.md # 399-question technical reference manual
├── project_evaluation.md              # Model benchmarking and quantitative performance report
├── project_explanation.md             # Executive project breakdown
├── requirements.txt                   # Verified Python dependencies
├── run_full_pipeline.bat              # Batch script to execute the 7-stage ML pipeline
└── run_remaining.bat                  # Batch script to execute stages 2-7 (skips data download)
```

---

## Prerequisites

- **Python**: Version `3.10` or higher (verified on Python `3.13`).
- **Node.js**: Version `18.18+` or `20+` (verified with Next.js 16).
- **Package Managers**: `pip` (Python) and `npm` (Node.js).
- **Operating System**: Cross-platform (Windows PowerShell / CMD, macOS, Linux).
- **Database (Optional for dev, recommended for prod)**: PostgreSQL 14+ / TimescaleDB (defaults to built-in SQLite).

---

## Installation and Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yash-shende99/portfolio-ml.git
cd portfolio-ml
```

### 2. Set Up Python Environment
Create and activate an isolated virtual environment:

**On Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**On Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Set Up Frontend Environment
Navigate to the `frontend/` directory and install JavaScript dependencies:
```bash
cd frontend
npm install
cd ..
```

### 4. Configure Environment Variables
Create a `.env` file in the repository root (see [Environment Variables and Configuration](#environment-variables-and-configuration)).

---

## Environment Variables and Configuration

The application reads configuration values through environment variables and `config/config.yaml`.

### Environment Variables (`.env`)

| Variable | Description | Required? | Default / Safe Fallback | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string | Optional (Dev) | `sqlite:///./data/portfolio.db` | `postgresql://user:pass@localhost:5432/portfolio_db` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | **Mandatory in Prod** | `"super-secret-wealth-key-12345"` (Dev fallback) | `a3b89f214d5e67...` (64+ char random hex) |
| `NEWSAPI_KEY` | API key for fetching market headlines | Optional | `None` (Sentiment module returns neutral 0.0) | `5317afd8e114...` |
| `API_URL` | Base URL used by Streamlit / Docker | Optional | `http://localhost:8000` | `http://api:8000` |

> [!WARNING]
> Never deploy to production with the default hardcoded `JWT_SECRET`. Always generate a cryptographically strong secret (`openssl rand -hex 32`) and supply it via the environment.

### Application Configuration (`config/config.yaml`)
Key parameters configured in `config/config.yaml`:
- **`data.tickers`**: List of 50 Nifty constituent symbols (`ADANIENT.NS`, `RELIANCE.NS`, `TCS.NS`, etc.) plus `^NSEI`.
- **`model.return_predictor`**: LightGBM parameters (`n_estimators: 100`, `max_depth: 5`, `learning_rate: 0.05`, `split_year: 2023`).
- **`model.volatility.garch_window`**: Rolling observation window (default `756` days).
- **`model.regime.n_states`**: Number of hidden states (default `3`).
- **`optimizer.max_weight`**: Single-asset concentration cap (default `0.20` or 20%).
- **`optimizer.base_risk_aversion`**: Base risk penalty ($\lambda = 0.5$).

---

## Running the Application

### Option A: Complete Development Workflow (Recommended)

#### Step 1: Execute the Quantitative Pipeline
To generate fresh market predictions, covariance matrices, and optimal portfolios, run the 7-stage pipeline:

**On Windows:**
```cmd
run_full_pipeline.bat
```

**On Linux / macOS (execute sequentially):**
```bash
python src/data_pipeline/fetch_data.py
python src/data_pipeline/preprocess.py
python src/data_pipeline/feature_engineering.py
python src/models/return_predictor/predict.py
python src/models/volatility/covariance.py
python src/models/regime/hmm_predict.py
python src/optimizer/portfolio.py
```
*Note: If you have already ingested raw data and only wish to re-run modeling and optimization, run `run_remaining.bat`.*

#### Step 2: Start the FastAPI Backend
From the repository root (with virtual environment active):
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```
The REST API will be available at:
- **API Root**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI JSON Schema**: `http://localhost:8000/openapi.json`

#### Step 3: Start the Next.js Frontend Dashboard
Open a second terminal:
```bash
cd frontend
npm run dev
```
The web dashboard will be available at:
- **Web App**: `http://localhost:3000` (Redirects to `/dashboard` or `/login`)

#### Step 4 (Optional): Start the Analytical Streamlit Dashboard
Open a third terminal:
```bash
streamlit run src/dashboard/main.py --server.port 8501
```
Available at: `http://localhost:8501`

---

## How to Use the Application

### End-to-End User Journey

1. **User Authentication & Profile Setup**:
   - Navigate to `http://localhost:3000/login`.
   - Register a new username and password. An empty profile is provisioned automatically with default risk parameters.
   - Upon sign-in, an encrypted JWT token is issued and stored in browser session storage.

2. **Market Regime & Macro Assessment**:
   - The top banner on `/dashboard` displays the current market regime detected by the HMM (`Bull`, `Normal`, or `Bear`).
   - If the system detects a Bear regime probability $> 0.60$, the dynamic contextual bandit increases risk penalty ($\lambda$), shifting recommended portfolio weights toward defensive assets.

3. **Exploring Target Allocations & SHAP Rationale**:
   - The **Asset Allocation** card displays the CVXPY optimal weights matching the user's risk tolerance slider ($0.0$ to $1.0$).
   - The **Return Predictions** table highlights the top Nifty 50 picks by forecasted 1-month return.
   - The **Explainable AI (XAI)** panel presents SHAP attributions, explaining why specific equities (e.g., strong 6-month momentum vs low volatility) were selected.

4. **Analyzing an Existing Portfolio**:
   - Navigate to `/dashboard/portfolio`.
   - Enter your current holdings (ticker symbol, quantity, buy price).
   - The system evaluates your portfolio against latest model forecasts and generates:
     - **Portfolio Health Score** ($0 - 100$).
     - **Beta and Expected Return**.
     - **Concentration Risk Alerts** (e.g., flags any stock exceeding 20% allocation).
     - **AI Rebalancing Recommendations** (e.g., trimming assets with negative expected return).

5. **Financial Goal Planning (SIP Calculator)**:
   - Navigate to `/dashboard/goals`.
   - Define a financial target (e.g., Retirement: ₹2,00,00,000 in 20 years).
   - The tool calculates the required monthly SIP investment using annuity math based on expected portfolio return.

---

## API Documentation

All API endpoints are documented interactively at `http://localhost:8000/docs`. Below is a reference of key endpoints:

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required? | Request Payload | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `POST` | `/auth/register` | Register a new user account | No | JSON: `{"username": "...", "password": "..."}` | `{"access_token": "...", "token_type": "bearer"}` |
| `POST` | `/auth/token` | Authenticate and obtain JWT token | No | Form Data: `username`, `password` | `{"access_token": "...", "token_type": "bearer"}` |
| `GET` | `/auth/profile` | Retrieve authenticated user profile | Bearer Token | None | Profile object (age, income, goals, risk tolerance) |
| `POST` | `/auth/profile` | Update profile settings | Bearer Token | JSON: `ProfileUpdate` object | `{"status": "success"}` |

### Quantitative & Market Data Endpoints

| Method | Endpoint | Description | Auth Required? | Parameters / Body | Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `GET` | `/predict` | Latest 1-month return forecasts for all tickers | No | None | List of objects: `ticker`, `predicted_return`, `date` |
| `GET` | `/volatility` | Latest GARCH annualised volatility forecasts | No | None | List of objects: `ticker`, `volatility_forecast` |
| `GET` | `/regime` | Current HMM regime probabilities | No | None | `{"date": "...", "bear_prob": 0.1, "normal_prob": 0.3, "bull_prob": 0.6}` |
| `GET` | `/sentiment` | News sentiment polarity scores | No | None | List of sentiment records by ticker |
| `GET` | `/explain` | SHAP feature attribution values | No | None | List of feature contributions per ticker |
| `GET` | `/graph` | Asset Minimum Spanning Tree (MST) graph | No | None | JSON node/edge structure |
| `POST` | `/portfolio` | Optimal asset allocation weights for risk tolerance | No | `{"risk_tolerance": 0.5}` | `{"date": "...", "allocations": {"TCS.NS": 0.15, ...}}` |
| `POST` | `/portfolio_analysis` | Evaluates user holdings for risk & concentration | No | `{"holdings": {"INFY.NS": {"quantity": 10, "buy_price": 1400}}}` | Health score, beta, concentration warning, recommendations |
| `GET` | `/funds` | AI-ranked mutual funds and ETFs | No | None | Ranked fund list with Sharpe and Alpha metrics |
| `POST` | `/goals` | Calculates required monthly SIP for a wealth goal | No | `{"target_amount": 10000000, "years": 15, "expected_return": 0.12}` | Monthly SIP, total investment, wealth gain |

---

## Database and Data Management

The application uses SQLAlchemy with dual-mode persistence:

```mermaid
erDiagram
    User ||--|| UserProfile : "owns"
    User {
        int id PK
        string username UK
        string hashed_password
    }
    UserProfile {
        int id PK
        int user_id FK
        int age
        float income
        float monthly_savings
        float risk_tolerance
        json goals
    }
```

### Persistence Modes
1. **Development (Default)**: SQLite database stored at `data/portfolio.db`. Zero setup required; tables are automatically created on backend startup via `Base.metadata.create_all(bind=engine)`.
2. **Production**: PostgreSQL or TimescaleDB configured via the `DATABASE_URL` environment variable. A complete relational schema definition with hypertable setup is provided in [config/schema.sql](config/schema.sql).

---

## Testing and Code Quality

### Running Unit Tests
The test suite validates data preprocessing functions (such as forward-filling and return calculations) and financial metrics (such as Sharpe ratio, annualized volatility, and maximum drawdown calculations):

```bash
python -m pytest tests/
```

**Verified Output:**
```text
============================= test session starts =============================
platform win32 -- Python 3.13.x, pytest-9.x, pluggy-1.x
rootdir: C:\Users\Yash\99\99PRO\portfolio-ml
collected 2 items

tests\test_pipeline.py ..                                                [100%]

============================== 2 passed in 5.75s ==============================
```

### Frontend Linting
To check code quality and TypeScript types in the Next.js application:
```bash
cd frontend
npm run lint
```

---

## Deployment & Containerization

A complete multi-container setup is defined in [docker/docker-compose.yml](docker/docker-compose.yml):

```yaml
version: '3.8'

services:
  db:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_USER: portfolio_user
      POSTGRES_PASSWORD: portfolio_password
      POSTGRES_DB: portfolio_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ../config/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  api:
    build:
      context: ../
      dockerfile: docker/Dockerfile.api
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      DATABASE_URL: "postgresql://portfolio_user:portfolio_password@db:5432/portfolio_db"

  dashboard:
    build:
      context: ../
      dockerfile: docker/Dockerfile.dashboard
    ports:
      - "8501:8501"
    depends_on:
      - api
    environment:
      API_URL: "http://api:8000"

volumes:
  pgdata:
```

### Starting Containers
```bash
cd docker
docker-compose up --build
```

> [!NOTE]
> `docker/Dockerfile.dashboard` currently references `src/dashboard/app.py`. If building the Streamlit container, ensure the command targets `src/dashboard/main.py`.

---

## Security and Hardening Considerations

1. **Authentication Secret**:
   - The JWT signing key in `src/api/auth.py` defaults to `"super-secret-wealth-key-12345"` if `JWT_SECRET` is unset. For staging and production, you must set `JWT_SECRET` as an environment variable to prevent unauthorized token forgery.
2. **Password Security**:
   - Passwords are salted and hashed using **bcrypt** via PassLib before database storage. Plaintext passwords are never logged or stored.
3. **CORS Restrictions**:
   - In `src/api/main.py`, allowed CORS origins are configured for local development (`http://localhost:3000`, `http://127.0.0.1:3000`). When deploying the frontend to a production domain, configure allowed origins via environment variables.
4. **Third-Party API Secrets**:
   - `NEWSAPI_KEY` is loaded strictly from environment variables or `.env` and must not be checked into public version control.

---

## Troubleshooting & FAQ

### 1. `ModuleNotFoundError: No module named 'src'`
**Cause**: The current working directory is not in your Python module search path.  
**Resolution**: Run scripts from the repository root:
```bash
python -m src.api.main
```
Or set the `PYTHONPATH` environment variable:
```powershell
# Windows PowerShell
$env:PYTHONPATH="."
# Linux / macOS
export PYTHONPATH="."
```

### 2. `HTTPException 404: Predictions not found. Run pipeline first.`
**Cause**: The FastAPI application reads precomputed artifacts from `data/processed/latest_*.csv`. If these files do not exist, the endpoints will return a 404 error.  
**Resolution**: Execute `run_full_pipeline.bat` (Windows) or run `python src/optimizer/portfolio.py` to generate the required artifacts.

### 3. Frontend Cannot Connect to Backend
**Cause**: Next.js client pages fetch data from `http://localhost:8000`. If FastAPI is running on a different port or machine, calls will fail.  
**Resolution**: Ensure `uvicorn src.api.main:app --port 8000` is running and accessible on localhost.

### 4. `pytest: The term 'pytest' is not recognized`
**Cause**: The virtual environment is either inactive or `pytest` was installed only inside the virtual environment without being on the global system PATH.  
**Resolution**: Run pytest through your Python executable:
```bash
python -m pytest tests/
```

---

## Known Limitations

- **Daily / Monthly Granularity**: The quantitative models operate on daily closing prices and monthly rebalancing periods. High-frequency tick data or intraday order flow execution is not supported.
- **Long-Only Markowitz**: The current optimizer solves long-only formulations ($w_i \ge 0$). Short-selling, leverage, and derivatives hedging strategies are not currently enabled in the objective function.
- **Static Artifact Caching**: The FastAPI backend currently reads static CSV files generated by batch runs rather than running on-demand CVXPY solves per user request.

---

## Roadmap

- [ ] **Dynamic Live Solver**: Add an endpoint for on-the-fly custom CVXPY solves supporting user-specified ticker whitelists and sector constraints.
- [ ] **Alpaca / Zerodha Broker Integration**: Direct execution API integration for automated paper trading and rebalancing.
- [ ] **Multi-Asset Allocation**: Extend coverage beyond Nifty 50 equities to Indian Government Bonds, Sovereign Gold Bonds (SGBs), and liquid funds.
- [ ] **Factor Attribution Backtester**: Full historical performance attribution against Nifty 50 benchmark using Fama-French 3-factor models.

---

## Contributing

Contributions, bug reports, and suggestions are welcome.

1. **Fork the Repository**:
   Click the "Fork" button at the top right of GitHub.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/dynamic-sector-constraints
   ```
3. **Commit Your Changes**:
   Follow conventional commits format (`feat:`, `fix:`, `docs:`, `chore:`):
   ```bash
   git commit -m "feat(optimizer): add maximum sector exposure constraint"
   ```
4. **Run Verification**:
   ```bash
   python -m pytest tests/
   cd frontend && npm run lint
   ```
5. **Open a Pull Request**:
   Submit your pull request against the `main` branch with a clear description of the modifications.

---

## Licence

No root open-source licence has been explicitly specified for this repository. The `frontend/package.json` file declares an `"ISC"` licence for frontend components. All other rights remain reserved by the repository owner unless otherwise noted.

---

## Acknowledgements & References

- **National Stock Exchange of India (NSE)**: Benchmark index and constituent data.
- **CVXPY**: Diamond, S., & Boyd, S. (2016). *CVXPY: A Python-embedded modeling language for convex optimization*.
- **SHAP (SHapley Additive exPlanations)**: Lundberg, S. M., & Lee, S.-I. (2017). *A Unified Approach to Interpreting Model Predictions*.
- **hmmlearn**: Hidden Markov Models in Python.
- **arch**: Autoregressive Conditional Heteroskedasticity (ARCH/GARCH) models in Python.

---

## Project Links & In-Depth Documentation

- **Repository**: [https://github.com/yash-shende99/portfolio-ml](https://github.com/yash-shende99/portfolio-ml)
- **Detailed System Architecture & Interview Guide**: [docs/SYSTEM_ARCHITECTURE_AND_INTERVIEW_GUIDE.md](docs/SYSTEM_ARCHITECTURE_AND_INTERVIEW_GUIDE.md)
- **Complete Institutional Interview Q&A (330 Questions)**: [INTERVIEW_QA_REFERENCE.md](INTERVIEW_QA_REFERENCE.md)
- **Master Technical & Quantitative Q&A (399 Questions)**: [PROJECT_ANALYSIS_AND_COMPLETE_399_QA.md](PROJECT_ANALYSIS_AND_COMPLETE_399_QA.md)
- **Model Evaluation & Quantitative Benchmarks**: [project_evaluation.md](project_evaluation.md)
- **Executive Project Overview**: [project_explanation.md](project_explanation.md)
