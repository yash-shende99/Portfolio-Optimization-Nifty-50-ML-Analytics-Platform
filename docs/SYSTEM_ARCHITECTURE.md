# AI-Powered Wealth Manager & Quantitative Nifty 50 ML System
# Complete System Architecture 

> **Document Type:** System Architecture & Design Document (HLD/LLD)   
> **System Name:** AI Personal Wealth Manager (NexGen Wealth)  
> **Target Asset Universe:** National Stock Exchange of India (NSE) NIFTY 50 Constituents + `^NSEI` Benchmark  
> **Repository Root:** `c:\Users\Yash\99\99PRO\portfolio-ml`  
> **Target Path:** `docs/SYSTEM_ARCHITECTURE.md`  
> **Status:** Reverse-Engineered from Active Codebase  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Requirements](#2-requirements)
3. [Repository and Codebase Map](#3-repository-and-codebase-map)
4. [System Context Diagram](#4-system-context-diagram)
5. [High-Level Design (HLD)](#5-high-level-design-hld)
6. [Technology Stack and Design Rationale](#6-technology-stack-and-design-rationale)
7. [Component-by-Component Architecture](#7-component-by-component-architecture)
8. [End-to-End Workflows and Sequence Diagrams](#8-end-to-end-workflows-and-sequence-diagrams)
9. [API Design](#9-api-design)
10. [Data Architecture and Database Design](#10-data-architecture-and-database-design)
11. [Low-Level Design (LLD)](#11-low-level-design-lld)
12. [Security Architecture](#12-security-architecture)
13. [Performance and Scalability](#13-performance-and-scalability)
14. [Reliability and Failure Handling](#14-reliability-and-failure-handling)
15. [Deployment and Runtime Architecture](#15-deployment-and-runtime-architecture)
16. [Important Architectural Decisions and Trade-offs](#16-important-architectural-decisions-and-trade-offs)
17. [Limitations, Technical Debt, and Future Improvements](#17-limitations-technical-debt-and-future-improvements)

---

## 1. Executive Summary

### 1.1 What the Project Does
The **AI-Powered Wealth Manager & Quantitative Nifty 50 ML System** is an institutional-grade, full-stack quantitative investment engineering platform. It ingests historical price and volume time-series data for all NSE NIFTY 50 constituents, engineers cross-sectionally ranked technical momentum and volatility features, forecasts 1-month forward cross-sectional excess stock returns using gradient-boosted decision trees (`LightGBM`), detects underlying macroeconomic states using a Gaussian Hidden Markov Model (`HMM`), models volatility clustering via `GARCH(1,1)`, conditions covariance estimation through Ledoit-Wolf shrinkage, adjusts risk penalties dynamically via an RL-inspired Contextual Bandit governor, and solves a quadratic constrained convex optimization problem (`CVXPY`) to generate optimal long-only portfolio allocations mapped to user risk profiles. 

All algorithmic outputs are made transparent through TreeSHAP Explainable AI (XAI) and surfaced to retail users via a Next.js 14 React dashboard and a FastAPI asynchronous backend.

### 1.2 Problem It Solves and Target Users
1. **Behavioral Investing Biases:** Retail equity investors routinely underperform benchmarks due to emotional decision-making (chasing performance at market peaks and panic-selling during corrections). The platform replaces emotional decisions with mathematical optimization and systematic risk budgeting.
2. **"Black-Box" Algorithmic Skepticism:** Traditional algorithmic trading systems output recommendations without justification, destroying user trust during inevitable drawdowns. This system integrates TreeSHAP feature attributions, translating mathematical feature weights into human-readable causal justifications (e.g., *"Primary driver is mom 12m contributing a bullish signal (+0.0241)"*).
3. **Naive Risk Management:** Most retail investors either hold arbitrary equal-weighted portfolios or concentrate capital into high-beta names without accounting for asset co-movements. The platform enforces institutional-grade mean-variance optimization with hard position bounds (maximum 20% per single stock) and market regime downshifting.
4. **Target Users:** Retail stock investors, self-directed wealth accumulators, registered investment advisors (RIAs), and algorithmic trading researchers.

### 1.3 Main Capabilities
- **Automated Data ETL Pipeline:** Historical daily OHLCV acquisition from Yahoo Finance (`yfinance`), forward-filling corporate actions and holidays, and monthly sampling.
- **Factor Engineering Matrix:** 13+ technical indicators (RSI, MACD, Bollinger Bands %B, ATR, CCI, 1/3/6/12-month momentum, 3/12-month volatility, volume ratio, distance from 52-week high) normalized via monthly cross-sectional percentile ranking.
- **Return Prediction Engine:** Leaf-wise gradient-boosted decision trees (`LightGBM`) trained using walk-forward chronological splits (`TimeSeriesSplit`) and Winsorized targets.
- **Regime Detection:** 3-state Gaussian HMM classifying the macro market regime into **Bull**, **Normal**, and **Bear** based on Nifty 50 index return and realized volatility.
- **Volatility & Covariance Modeling:** GARCH(1,1) univariate volatility forecasting and Ledoit-Wolf shrinkage covariance estimation.
- **Dynamic Risk Governance:** Contextual Bandit heuristic modulating the risk aversion parameter ($\lambda$) based on HMM regime probabilities and covariance matrix trace.
- **Convex Portfolio Optimization:** CVXPY quadratic programming solver executing Pareto frontier pre-computations across risk tolerances ($rt \in [0.0, 1.0]$) subject to budget ($\sum w_i = 1$) and diversification ($0 \le w_i \le 0.20$) constraints.
- **Explainable AI (TreeSHAP):** TreeExplainer generating local feature contributions per stock.
- **Portfolio Health Diagnostic:** Scoring existing user portfolios against AI regime forecasts, detecting concentration risks ($>30\%$), and generating rebalancing alerts.
- **Goal SIP Planning:** Compounding annuities calculation for wealth generation goals.
- **Enterprise Web Interface:** Cyberpunk/institutional Next.js 14 frontend with Canvas particle networks, Recharts interactive donut charts, and JWT authentication.

### 1.4 Current Implementation Status
| Subsystem / Capability | Implementation Status | Evidence / Code Location |
| :--- | :--- | :--- |
| Data Extraction (`yfinance`) | **Fully Implemented** | [`src/data_pipeline/fetch_data.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/fetch_data.py) |
| Data Cleaning & Returns | **Fully Implemented** | [`src/data_pipeline/preprocess.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/preprocess.py) |
| Feature Matrix & Ranking | **Fully Implemented** | [`src/data_pipeline/feature_engineering.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/feature_engineering.py) |
| News Sentiment Ingestion | **Implemented with API Dependency** | [`src/data_pipeline/sentiment.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/sentiment.py) (requires `NEWSAPI_KEY`) |
| LightGBM Return Predictor | **Fully Implemented** | [`src/models/return_predictor/train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py), [`predict.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/predict.py) |
| Gaussian HMM Regime Model | **Fully Implemented** | [`src/models/regime/hmm_train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_train.py), [`hmm_predict.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_predict.py) |
| GARCH(1,1) Volatility Model | **Fully Implemented** | [`src/models/volatility/garch.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py) |
| Ledoit-Wolf Covariance | **Fully Implemented** | [`src/models/volatility/covariance.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/covariance.py) |
| Market Minimum Spanning Tree | **Fully Implemented** | [`src/models/volatility/network.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/network.py) |
| TreeSHAP Explanations | **Fully Implemented** | [`src/models/return_predictor/explain.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py) |
| Contextual Bandit Risk Governor | **Fully Implemented** | [`src/optimizer/fusion.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/fusion.py#L15-L38) |
| CVXPY Convex Optimization | **Fully Implemented** | [`src/optimizer/portfolio.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py) |
| Walk-Forward Backtester | **Partially Implemented (MVP)** | [`src/backtesting/backtest.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/backtesting/backtest.py) (evaluates latest month return snapshot) |
| Airflow DAG Orchestration | **Implemented (Configuration)** | [`dags/portfolio_pipeline.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/dags/portfolio_pipeline.py) |
| FastAPI REST API | **Fully Implemented** | [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py) |
| User Auth (JWT/Bcrypt) | **Fully Implemented** | [`src/api/auth.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py), [`database.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/database.py) |
| Portfolio Diagnostics API | **Fully Implemented** | [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L145-L236) (contains hardcoded Sharpe=1.2 fallback) |
| Mutual Fund Ranking API | **Mock / Stub Implementation** | [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L237-L248) (returns hardcoded static fund list) |
| Goal SIP Calculator API | **Fully Implemented** | [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L250-L272) |
| Next.js 14 Frontend UI | **Fully Implemented** | [`frontend/src/app/`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app) (Pages: login, dashboard, portfolio, funds, goals) |
| Streamlit Prototype UI | **Partially Implemented / Deprecated** | [`src/dashboard/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/dashboard/main.py) (pages `portfolio.py`, `funds.py`, `goals.py` are 7-line stubs) |
| Database Persistence (Relational) | **Partially Utilized** | SQLite `users` & `user_profiles` active; `daily_prices`, `monthly_features` defined in [`schema.sql`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/config/schema.sql) but runtime pipeline operates on CSV files. |

### 1.5 Key Architectural Characteristics
- **Hybrid Data Persistence:** Uses an RDBMS (SQLite in local dev, PostgreSQL in Docker) for user profiles and credentials, coupled with an ultra-low latency, flat-file tabular datastore (`data/processed/*.csv`) for model predictions and covariance matrices.
- **Decoupled Heavy Computation:** Mathematical convex optimization and model training are completely extracted from the live user request path. The optimization solver pre-computes the entire Pareto frontier across risk tolerances offline into `latest_portfolio.csv`, providing instantaneous $O(1)$ response times for incoming API calls.
- **Multi-Model Quantitative Ensemble:** Deconstructs the asset allocation pipeline into modular specialized models (LightGBM for returns, HMM for market states, GARCH/Ledoit-Wolf for covariance) united by an RL-inspired Contextual Bandit governor.

---

## 2. Requirements

### 2.1 Functional Requirements Mapped to Implemented Features
| ID | Functional Requirement | Implemented Feature & Verification |
| :--- | :--- | :--- |
| **FR-01** | User Registration & Authentication | Users can register and login via JSON/Form requests; passwords hashed with bcrypt, sessions authenticated via Bearer JWT (`/auth/register`, `/auth/token`). Verified in [`src/api/auth.py:59-89`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L59-L89). |
| **FR-02** | User Risk & Goal Profiling | Store and retrieve age, income, monthly savings, risk tolerance, and investment goals (`/auth/profile`). Verified in [`src/api/auth.py:98-117`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L98-L117). |
| **FR-03** | Automated Stock Return Forecasting | Ingest 50 constituent stocks and generate 1-month forward cross-sectional excess return predictions (`/predict`). Verified in [`src/models/return_predictor/predict.py:16-58`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/predict.py#L16-L58). |
| **FR-04** | Market Regime Classification | Compute current posterior probabilities of Bull, Normal, and Bear regimes using 3-state Gaussian HMM on Nifty 50 index (`/regime`). Verified in [`src/models/regime/hmm_predict.py:16-83`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_predict.py#L16-L83). |
| **FR-05** | Explainable AI Attribution | Generate stock-specific plain-English justifications based on top SHAP feature impact (`/explain`). Verified in [`src/models/return_predictor/explain.py:12-68`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py#L12-L68). |
| **FR-06** | Volatility & Covariance Forecasting | Forecast univariate volatility via GARCH(1,1) (`/volatility`) and annualized covariance via Ledoit-Wolf shrinkage. Verified in [`src/models/volatility/garch.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py) and [`covariance.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/covariance.py). |
| **FR-07** | Risk-Constrained Portfolio Allocation | Serve optimal asset weights mapped to the user's specific risk tolerance (`/portfolio`), enforcing $0 \le w_i \le 0.20$ and $\sum w_i = 1$. Verified in [`src/api/main.py:102-135`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L102-L135). |
| **FR-08** | Client Portfolio Health Diagnostic | Ingest existing user equity holdings, calculate total valuation, check single-asset concentration ($>30\%$), and match against AI predicted returns to generate warning alerts (`/portfolio_analysis`). Verified in [`src/api/main.py:145-235`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L145-L235). |
| **FR-09** | Financial Goal SIP Calculation | Compute required monthly Systematic Investment Plan (SIP) installments using compounded annuity formula based on target amount, horizon, and expected return (`/goals`). Verified in [`src/api/main.py:250-271`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L250-L271). |
| **FR-10** | Mutual Fund / ETF Ranking | Provide ranked investment baskets by Sharpe, Alpha, and Volatility (`/funds`). **Verified Mock Feature** in [`src/api/main.py:237-248`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L237-L248). |
| **FR-11** | News Sentiment Scoring | Extract recent stock news headlines and calculate compound polarity via VADER (`/sentiment`). Verified in [`src/data_pipeline/sentiment.py:16-82`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/sentiment.py#L16-L82). |
| **FR-12** | Market Network Graph | Compute Minimum Spanning Tree (MST) based on stock return correlations (`/graph`). Verified in [`src/models/volatility/network.py:12-64`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/network.py#L12-L64). |

### 2.2 Non-Functional Requirements (Verified vs. Inferred)
- **Security:**
  - *Verified:* Passwords securely hashed with `passlib[bcrypt]`. Stateless user authentication using HMAC-SHA256 (`HS256`) JSON Web Tokens with 7-day expiration (`ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7`).
  - *Inferred / Missing:* Rate limiting on `/auth/token` and `/auth/register` is absent; default fallback JWT secret `"super-secret-wealth-key-12345"` exists if `JWT_SECRET` environment variable is unset.
- **Performance:**
  - *Verified:* Offline optimization design ensures live HTTP request latency is $<15\text{ ms}$ for `/portfolio` because it performs simple memory/disk lookups rather than solving convex quadratic programs on the fly.
  - *Inferred / Bottleneck:* Live CSV re-reading on every request (`pd.read_csv()` called inside `/predict`, `/portfolio`, `/explain`, `/regime`) will saturate I/O under concurrent load.
- **Reliability:**
  - *Verified:* Convex optimization fallbacks: if the primary solver `OSQP` fails to find an optimal solution, it falls back to `SCS`. If `SCS` fails, it falls back to an equal-weighted allocation (`np.ones(n_assets) / n_assets`).
  - *Inferred / Missing:* Airflow DAG lacks automated retry alerts; `yfinance` rate limits can cause empty price fetches during market hours.
- **Maintainability:**
  - *Verified:* Configuration is centralized in [`config/config.yaml`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/config/config.yaml), decoupling tickers, hyperparameter bounds, and transaction costs from business logic.
- **Scalability:**
  - *Verified:* Stateless FastAPI backend enables horizontal scaling behind a reverse proxy (e.g., NGINX).
  - *Inferred:* Shared file system (`data/processed/*.csv`) prevents multi-node deployment unless transitioned to an object store (S3) or central cache (Redis).

---

## 3. Repository and Codebase Map

### 3.1 Directory Tree Structure
```text
portfolio-ml/
├── config/
│   ├── config.yaml                    # Master system configuration (tickers, models, optimizer)
│   └── schema.sql                     # PostgreSQL / TimescaleDB DDL schema definition
├── dags/
│   └── portfolio_pipeline.py          # Apache Airflow daily batch DAG orchestration
├── data/
│   ├── portfolio.db                   # SQLite database (users, profiles, fallback storage)
│   ├── raw/                           # Raw ingested historical price data
│   └── processed/                     # Tabular pipeline artifacts (*.csv, *.json)
├── docker/
│   ├── docker-compose.yml             # Container orchestration (TimescaleDB, API, Dashboard)
│   ├── Dockerfile.api                 # FastAPI backend container definition
│   └── Dockerfile.dashboard           # Streamlit dashboard container definition
├── frontend/                          # Next.js 14 TypeScript web application
│   ├── package.json                   # Next.js 16.1.6, React 19, Recharts, Lucide-React
│   ├── tailwind.config.ts             # Tailwind CSS styling configuration
│   └── src/app/
│       ├── globals.css                # Global cyber-institutional design tokens & animations
│       ├── layout.tsx                 # Root layout wrapper
│       ├── page.tsx                   # Index redirect router -> /dashboard
│       ├── login/page.tsx             # Auth page (JWT login, register, profile onboarding)
│       └── dashboard/
│           ├── layout.tsx             # Protected layout (token validation, sidebar, clock)
│           ├── page.tsx               # Main wealth management dashboard (allocations, XAI)
│           ├── portfolio/page.tsx     # Portfolio diagnostic & holdings risk analysis
│           ├── funds/page.tsx         # AI-ranked Mutual Funds & ETFs interface
│           └── goals/page.tsx         # Interactive Goal-based SIP Wealth Compounder
├── notebooks/                         # Exploratory data analysis & model research
├── src/
│   ├── api/
│   │   ├── auth.py                    # JWT authentication router, bcrypt, profile endpoints
│   │   ├── database.py                # SQLAlchemy ORM models (User, UserProfile)
│   │   └── main.py                    # FastAPI application, route handlers, CORS middleware
│   ├── backtesting/
│   │   ├── backtest.py                # Backtesting execution harness
│   │   └── metrics.py                 # Financial metrics (Sharpe, Max Drawdown, Ann Return)
│   ├── dashboard/                     # Legacy Streamlit prototype application
│   │   ├── main.py                    # Streamlit entry point & multi-page navigation
│   │   └── pages/                     # Streamlit views (dashboard.py, login.py, stubs)
│   ├── data_pipeline/
│   │   ├── fetch_data.py              # Yahoo Finance OHLCV extraction engine
│   │   ├── preprocess.py              # Missing price imputation, forward fill, return math
│   │   ├── feature_engineering.py     # 13+ technical indicators & cross-sectional ranking
│   │   ├── sentiment.py               # NewsAPI headline ingestion & VADER sentiment scoring
│   │   └── init_db.py                 # SQLAlchemy Core table creation script
│   ├── models/
│   │   ├── regime/
│   │   │   ├── hmm_train.py           # 3-state Gaussian HMM training on NIFTY index
│   │   │   ├── hmm_predict.py         # Regime probability inference & state mapping
│   │   │   └── hmm_model.joblib       # Serialized HMM model artifact
│   │   ├── return_predictor/
│   │   │   ├── train.py               # LightGBM Walk-Forward training with TimeSeriesSplit
│   │   │   ├── predict.py             # Monthly return inference generator
│   │   │   ├── explain.py             # TreeSHAP feature attribution & XAI text generator
│   │   │   └── lgbm_model.joblib      # Serialized LightGBM model artifact
│   │   └── volatility/
│   │       ├── garch.py               # Univariate GARCH(1,1) volatility forecasting
│   │       ├── covariance.py          # Ledoit-Wolf regularized covariance shrinkage
│   │       └── network.py             # Correlation Minimum Spanning Tree (MST) builder
│   └── optimizer/
│       ├── fusion.py                  # Prediction fusion & Contextual Bandit risk governor
│       └── portfolio.py               # CVXPY Pareto frontier convex quadratic optimizer
├── tests/
│   └── test_pipeline.py               # Pytest unit tests (data cleaning, financial metrics)
├── build_features_and_train.py        # Standalone XGBoost feature engineering & training script
├── comparative_analysis.py            # Comprehensive 5-model benchmarking harness
├── model_comparison.csv               # Empirical benchmark outputs (IC, Hit Rate, p-values)
├── run_full_pipeline.bat              # Windows batch script orchestrating steps 1 to 7
├── requirements.txt                   # Pinned Python package dependencies
└── README.md                          # Repository overview documentation
```

### 3.2 Application Entry Points
- **Next.js Web Application:** Entry point at [`frontend/src/app/page.tsx`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/page.tsx), which redirects to `/dashboard` (or `/login` via protected layout [`frontend/src/app/dashboard/layout.tsx`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/layout.tsx)). Launched via `npm run dev`.
- **FastAPI HTTP Service:** Entry point at [`src/api/main.py:app`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L19). Launched via `uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload`.
- **Batch Processing Batch Scripts:** Entry point at [`run_full_pipeline.bat`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/run_full_pipeline.bat) (runs full pipeline from data download to portfolio generation).
- **Airflow Scheduled DAG:** Entry point at [`dags/portfolio_pipeline.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/dags/portfolio_pipeline.py), scheduled at `0 18 * * 1-5` (weekdays at 6:00 PM IST post market close).
- **Streamlit Prototype UI:** Entry point at [`src/dashboard/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/dashboard/main.py). Launched via `streamlit run src/dashboard/main.py --server.port 8501`.

---

## 4. System Context Diagram

```mermaid
flowchart TD
    subgraph External_Actors ["Users & External Actors"]
        User["Retail Investor / Advisor<br/>(Web Browser)"]
    end

    subgraph System_Boundary ["AI Personal Wealth Manager System"]
        Frontend["Next.js 14 Frontend<br/>(React 19 / TypeScript / Recharts)<br/>Port 3000"]
        Backend["FastAPI REST API<br/>(Python 3.10+ / Pydantic / SQLAlchemy)<br/>Port 8000"]
        Orchestration["Airflow DAG / Batch Scripts<br/>(Daily 6:00 PM Batch Pipeline)"]
        DataStore["Hybrid Storage Layer<br/>SQLite/Postgres (Auth/Profiles)<br/>Flat-file CSV/JSON (Model Data)"]
    end

    subgraph External_Services ["External Dependencies"]
        YF["Yahoo Finance API<br/>(yfinance library)<br/>Historical OHLCV"]
        NewsAPI["NewsAPI.org HTTP Service<br/>(English Market News)"]
    end

    User -->|"HTTPS / Web GUI<br/>(View Dashboard, Analyze Holdings, Plan Goals)"| Frontend
    Frontend -->|"JSON over HTTP REST<br/>Bearer JWT Auth (Port 8000)"| Backend
    Backend -->|"SQLAlchemy ORM Queries<br/>(users, user_profiles)"| DataStore
    Backend -->|"File Reads<br/>(latest_portfolio, regime, explain)"| DataStore
    Orchestration -->|"Execute ML Pipelines<br/>(fetch, preprocess, predict, optimize)"| Backend
    Orchestration -->|"Pull Historical Prices<br/>(Nifty 50 + ^NSEI)"| YF
    Orchestration -->|"Pull Market News<br/>(VADER Polarity)"| NewsAPI
    Orchestration -->|"Write Batch Artifacts<br/>(*.csv, *.joblib, *.json)"| DataStore
```

---

## 5. High-Level Design (HLD)

```mermaid
flowchart LR
    subgraph Layer_Presentation ["1. Presentation Layer"]
        UI_Dash["Dashboard View<br/>(Allocation Donut, Regime Card)"]
        UI_Port["Portfolio Health View<br/>(Concentration Alerts, Diagnostics)"]
        UI_Goal["Goal SIP View<br/>(Annuity Compounder Chart)"]
        UI_Fund["Fund Rankings View<br/>(Sharpe / Alpha Table)"]
    end

    subgraph Layer_API ["2. Gateway & API Service Layer (FastAPI)"]
        Router_Auth["Auth Router (/auth/*)<br/>JWT Issuance & Verification"]
        Router_Core["Core Financial Router<br/>/predict, /portfolio, /regime<br/>/explain, /portfolio_analysis, /goals"]
    end

    subgraph Layer_Optimization ["3. Quantitative Fusion & Optimization"]
        Bandit["RL Contextual Bandit<br/>Dynamic Lambda Governor"]
        Optimizer["CVXPY Quadratic Program<br/>OSQP Solver (Long-Only, 20% Cap)"]
    end

    subgraph Layer_ML ["4. Machine Learning & Statistical Engines"]
        Model_LGBM["LightGBM Regressor<br/>(1-Month Return Predictor)"]
        Model_HMM["Gaussian HMM (3-State)<br/>(Bull/Normal/Bear Classifier)"]
        Model_GARCH["GARCH(1,1) + Ledoit-Wolf<br/>(Volatility & Covariance Engine)"]
        Model_SHAP["TreeSHAP XAI Engine<br/>(Attribution Justifications)"]
    end

    subgraph Layer_Data ["5. Data Pipeline & Storage"]
        ETL["ETL Engine<br/>fetch_data -> preprocess -> features"]
        Store_DB["Relational Database<br/>SQLite (Local) / Postgres (Docker)"]
        Store_CSV["Processed Cache Files<br/>data/processed/*.csv"]
    end

    UI_Dash & UI_Port & UI_Goal & UI_Fund -->|"HTTP REST JSON"| Router_Auth & Router_Core
    Router_Auth --> Store_DB
    Router_Core -->|"Read Cached Results"| Store_CSV
    
    ETL --> Model_LGBM & Model_HMM & Model_GARCH & Model_SHAP
    Model_LGBM -->|"Expected Returns (mu)"| Bandit
    Model_HMM -->|"Regime Probabilities"| Bandit
    Model_GARCH -->|"Covariance Matrix (Sigma)"| Bandit
    Bandit -->|"Adjusted Risk Penalty (lambda)"| Optimizer
    Optimizer -->|"Optimal Weights (w)"| Store_CSV
    Model_SHAP -->|"Plain-English Drivers"| Store_CSV
```

### 5.1 Communication Protocols and Interactions
- **Frontend $\leftrightarrow$ Backend:** Synchronous HTTP/1.1 REST exchanging `application/json`. Authenticated routes require an `Authorization: Bearer <JWT>` header.
- **Backend $\leftrightarrow$ Database:** Synchronous connection pool via SQLAlchemy 2.0 ORM over SQLite / PostgreSQL native dialect.
- **Backend $\leftrightarrow$ Model Artifacts:** Synchronous local filesystem disk reads (`pandas.read_csv`, `joblib.load`).
- **Batch Pipeline $\leftrightarrow$ External APIs:** Synchronous HTTPS calls to `query1.finance.yahoo.com` via `yfinance` and `newsapi.org/v2/everything` via `requests`.

### 5.2 Layer Separation Rationale
1. **Presentation vs. API:** Decoupling Next.js from FastAPI enables independent frontend deployments (e.g., Vercel / Cloudflare Pages) while keeping compute-heavy Python ML libraries isolated in an optimized Python runtime environment.
2. **API vs. Optimization Engine:** Live optimization under high concurrency risks CPU starvation and thread starvation. Decoupling the solver into a pre-computed batch process ensures the API never executes quadratic programming during an HTTP request.
3. **ML Models vs. Optimizer:** Keeping return forecasting, regime detection, and volatility modeling isolated enables each model to be retrained or swapped independently (e.g., swapping LightGBM for XGBoost or adding macro variables to HMM) without altering the optimization formulation.

---

## 6. Technology Stack and Design Rationale

| Layer / Technology | Verified In Code | Suitability & Design Rationale | Verified Advantages | Verified Limitations & Trade-offs |
| :--- | :--- | :--- | :--- | :--- |
| **Python 3.10+** | [`src/`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src) | De-facto lingua franca for quantitative finance, ML, and numerical optimization. | Unmatched ecosystem (`scikit-learn`, `cvxpy`, `arch`). | Single-threaded GIL limits multi-core CPU parallelism. |
| **FastAPI 0.100+** | [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py) | Modern asynchronous Python web framework built on Starlette and Pydantic. | Native OpenAPI auto-documentation, high I/O concurrency, strict schema validation. | Handlers in this codebase are synchronous (`def` instead of `async def`), blocking the event loop on CSV file reads. |
| **LightGBM 4.0+** | [`src/models/return_predictor/train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py) | Gradient boosting framework using histogram-based algorithms and leaf-wise tree growth. | **Empirical winner:** Achieved highest Mean Monthly IC (0.0292) and Hit Rate (52.28%) over XGBoost, RF, and Linear Regression. | Sensitive to hyperparameter choices; non-linear trees cannot extrapolate outside historical price bounds. |
| **hmmlearn 0.3+** | [`src/models/regime/hmm_train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_train.py) | Unsupervised statistical modeling of hidden states via Expectation-Maximization. | Automatically partitions market volatility into regimes without hardcoded arbitrary thresholds. | Baum-Welch training can get trapped in local likelihood optima; state mapping must be sorted manually. |
| **arch 6.0+** | [`src/models/volatility/garch.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py) | Specialized econometric package for Autoregressive Conditional Heteroskedasticity. | Captures financial volatility clustering (large changes follow large changes). | Fitting GARCH on all 50 stocks sequentially is slow ($>30\text{ seconds}$). |
| **CVXPY 1.3+** | [`src/optimizer/portfolio.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py) | Domain-specific language for convex optimization problems in Python. | Mathematically guarantees convergence to the global optimum using OSQP/SCS solvers. | Solver runtime can spike with non-convex constraints; require fallback logic. |
| **TreeSHAP 0.42+** | [`src/models/return_predictor/explain.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py) | Game-theoretic approach (Shapley values) optimized for decision tree ensembles. | Computes exact, consistent, local feature attributions for individual stock picks. | Computationally intensive if run across thousands of historical dates. |
| **Next.js 14 / React 19** | [`frontend/package.json`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/package.json) | React production framework with App Router, TypeScript, and server/client components. | Fast page loads, modular component architecture, smooth client-side animations. | Requires Node.js build pipeline separate from Python runtime. |
| **Recharts 3.7+** | [`frontend/src/app/dashboard/page.tsx`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/page.tsx) | Composable charting library built on React components and SVG. | Highly responsive interactive donut charts and SIP projection curves. | Canvas animations had to be custom-implemented for particle network backgrounds. |
| **SQLAlchemy 2.0+** | [`src/api/database.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/database.py) | Python SQL toolkit and Object Relational Mapper (ORM). | Database engine agnostic (seamless switch between SQLite and PostgreSQL). | Overhead compared to raw SQL queries (acceptable for user profile CRUD). |
| **Apache Airflow** | [`dags/portfolio_pipeline.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/dags/portfolio_pipeline.py) | Programmatic workflow orchestration platform. | Dependency graphs, automated retries, and scheduled cron triggers. | Heavyweight infrastructure footprint for a single 7-step batch pipeline. |

---

## 7. Component-by-Component Architecture

### 7.1 Data Pipeline Subsystem
- **Files:** [`src/data_pipeline/fetch_data.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/fetch_data.py), [`preprocess.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/preprocess.py), [`feature_engineering.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/feature_engineering.py), [`sentiment.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/sentiment.py)
- **Responsibilities:**
  - `fetch_data.py`: Bulk downloads daily OHLCV bars from Yahoo Finance for 50 tickers + `^NSEI` from 2015-01-01 to present, stacks multi-index levels, and saves raw CSV.
  - `preprocess.py`: Imputes missing price records via grouped forward-fill (`ffill`), drops non-trading days, calculates daily returns, resamples to month-end, and computes excess returns above the risk-free rate.
  - `feature_engineering.py`: Computes 13 technical features per ticker, aligns daily features to monthly sampling dates, and executes **cross-sectional percentile ranking** across tickers for every month:
    $$\text{Rank}(X_{i,t}) = \frac{\text{Rank}(X_{i,t}) - 1}{N - 1} \in [0, 1]$$
  - `sentiment.py`: Queries NewsAPI for recent articles by ticker name, computes compound polarity via VADER sentiment analyzer, and stores mean ticker sentiment.
- **Inputs & Outputs:** Ingests external Yahoo Finance data; produces `data/processed/clean_prices.csv`, `monthly_returns.csv`, `feature_matrix.csv`, and `latest_sentiment.csv`.

### 7.2 Return Prediction Engine
- **Files:** [`src/models/return_predictor/train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py), [`predict.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/predict.py), [`explain.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py)
- **Responsibilities:**
  - `train.py`: Partitions `feature_matrix.csv` chronologically at `split_year: 2023`. Winsorizes train targets to 1st and 99th percentiles to clip market shock anomalies. Fits `LGBMRegressor` using 5-split `TimeSeriesSplit` cross-validation with grid search over `max_depth: [3, 5, 7]`, `learning_rate: [0.01, 0.05, 0.1]`, and `n_estimators: [100, 200]`. Logs parameters and metrics (RMSE, IC, Hit Rate) to MLflow.
  - `predict.py`: Loads `lgbm_model.joblib` and the latest available monthly feature row to forecast the next 1-month cross-sectional excess returns vector ($\mu \in \mathbb{R}^N$).
  - `explain.py`: Runs `shap.TreeExplainer(model)` on the latest feature set to extract exact marginal contributions for every feature per stock, generating natural-language justifications.
- **Inputs & Outputs:** Reads `feature_matrix.csv`; outputs `latest_predictions.csv` and `latest_explanations.csv`.

### 7.3 Volatility, Covariance, and Network Subsystem
- **Files:** [`src/models/volatility/garch.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py), [`covariance.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/covariance.py), [`network.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/network.py)
- **Responsibilities:**
  - `garch.py`: Fits a univariate $GARCH(1,1)$ process with constant mean on the trailing 756 daily return bars (~3 years) per ticker:
    $$\sigma_t^2 = \omega + \alpha \epsilon_{t-1}^2 + \beta \sigma_{t-1}^2$$
    Forecasts 1-day ahead variance and scales to annualized volatility ($\sigma_{\text{ann}} = \sqrt{\sigma_{\text{next}}^2 \times 252}$).
  - `covariance.py`: Fits `LedoitWolf()` shrinkage covariance on trailing 252 daily return bars to regularize pairwise sample covariances towards an identity/diagonal target, preventing ill-conditioned matrices:
    $$\Sigma_{\text{shrunk}} = (1 - \delta)\Sigma_{\text{sample}} + \delta F$$
  - `network.py`: Computes 1-year trailing correlation matrix between all stocks, converts correlations to metric distances $d_{i,j} = \sqrt{2(1 - \rho_{i,j})}$, and solves a Minimum Spanning Tree (MST) with `networkx` to map the market topology.
- **Inputs & Outputs:** Reads `clean_prices.csv`; outputs `volatility_forecasts.csv`, `covariance.csv`, and `mst_graph.json`.

### 7.4 Market Regime Classification Subsystem
- **Files:** [`src/models/regime/hmm_train.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_train.py), [`hmm_predict.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/regime/hmm_predict.py)
- **Responsibilities:**
  - `hmm_train.py`: Extracts monthly return and realized volatility for the `^NSEI` index benchmark. Scales features via `StandardScaler` and trains a 3-component `GaussianHMM(covariance_type="full")`. Sorts latent states monotonically by mean return: State 0 = **Bear**, State 1 = **Normal**, State 2 = **Bull**.
  - `hmm_predict.py`: Ingests latest monthly observations, calls `model.predict_proba()`, maps latent state posteriors to sorted states, and outputs probability distribution vector $[P(\text{Bear}), P(\text{Normal}), P(\text{Bull})]$.
- **Inputs & Outputs:** Reads `clean_prices.csv`; outputs `latest_regime.csv`.

### 7.5 Prediction Fusion and Convex Optimization Subsystem
- **Files:** [`src/optimizer/fusion.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/fusion.py), [`portfolio.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py)
- **Responsibilities:**
  - `fusion.py`: Merges $\mu$ (returns), $\Sigma$ (covariance), and regime probabilities. Applies a Contextual Bandit risk governor:
    $$\lambda_{\text{effective}} = \text{clip}\left(1.0 + 1.5 \cdot P(\text{Bear}) - 0.5 \cdot P(\text{Bull}) + \mathbb{I}(\text{Vol} > 0.25), 0.1, 5.0\right)$$
  - `portfolio.py`: Solves the convex Markowitz Mean-Variance quadratic program using `CVXPY` across 11 discrete risk tolerances ($rt \in [0.0, 1.0]$ in increments of $0.1$):
    $$\max_{w} \quad \left( \mu^T w - (rt \cdot \lambda_{\text{effective}}) \cdot w^T \Sigma w \right)$$
    $$\text{subject to} \quad \sum_{i=1}^N w_i = 1.0, \quad 0 \le w_i \le 0.20 \quad \forall i$$
    Solves via `OSQP` with fallback to `SCS`, zeroes negligible allocations ($<10^{-4}$), normalizes weights, and writes pre-computed allocations to disk.
- **Inputs & Outputs:** Ingests `latest_predictions.csv`, `covariance.csv`, and `latest_regime.csv`; outputs `latest_portfolio.csv`.

---

## 8. End-to-End Workflows and Sequence Diagrams

### 8.1 Workflow 1: User Registration, Onboarding, and JWT Authentication
1. **User Action:** The user visits `/login`, switches to the Register tab, inputs username, password, age, income, monthly savings, and risk preference, and clicks "Create Account".
2. **Frontend Dispatch:** In [`frontend/src/app/login/page.tsx:151`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/login/page.tsx#L151), a `POST` request is sent to `http://localhost:8000/auth/register` with JSON body `{ username, password }`.
3. **Backend Processing:** In [`src/api/auth.py:59-78`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L59-L78), the handler checks database uniqueness, hashes the password via bcrypt, inserts a new `User` record, creates an initial `UserProfile` row, and returns a signed HS256 JWT access token.
4. **Profile Persistence:** The frontend stores `access_token` in `localStorage` and immediately issues a second `POST` to `http://localhost:8000/auth/profile` with `Authorization: Bearer <token>` containing age, income, savings, and risk tolerance.
5. **Success Route:** The user is redirected to `/dashboard`.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js (/login)
    participant AuthAPI as FastAPI (/auth/register, /auth/profile)
    participant DB as SQLite / PostgreSQL (users, user_profiles)

    User->>FE: Fill Registration & Profile Form
    FE->>AuthAPI: POST /auth/register {username, password}
    AuthAPI->>DB: Query User by username
    alt Username Already Exists
        DB-->>AuthAPI: User record found
        AuthAPI-->>FE: HTTP 400 Bad Request ("Username already registered")
        FE-->>User: Display error notification
    else Username Unique
        AuthAPI->>AuthAPI: Hash password with passlib[bcrypt]
        AuthAPI->>DB: INSERT INTO users, INSERT INTO user_profiles
        DB-->>AuthAPI: User created (ID: 1)
        AuthAPI->>AuthAPI: Generate JWT with sub=username, exp=7 days
        AuthAPI-->>FE: HTTP 200 OK {access_token, token_type: "bearer"}
        FE->>FE: localStorage.setItem("token", access_token)
        FE->>AuthAPI: POST /auth/profile {age, income, savings, risk_tolerance} [Bearer Token]
        AuthAPI->>AuthAPI: Validate JWT signature (HS256)
        AuthAPI->>DB: UPDATE user_profiles SET age=..., income=...
        DB-->>AuthAPI: Profile updated
        AuthAPI-->>FE: HTTP 200 OK {"status": "success"}
        FE->>FE: triggerWarpSequence() -> router.push("/dashboard")
        FE-->>User: Render Dashboard View
    end
```

### 8.2 Workflow 2: Dashboard Real-Time View (Auth Check, Regime, Allocations, XAI)
1. **User Action:** The user navigates to `/dashboard`.
2. **Auth Verification:** [`frontend/src/app/dashboard/layout.tsx:51-74`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/layout.tsx#L51-L74) reads `localStorage.getItem("token")`. If missing, it immediately redirects to `/login`. If present, it verifies the token by querying `GET /auth/profile`.
3. **Concurrent Data Ingestion:** [`frontend/src/app/dashboard/page.tsx:55-125`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/page.tsx#L55-L125) initiates parallel fetch requests:
   - `GET /auth/profile` $\rightarrow$ retrieves user's configured `risk_tolerance` ($0.0 - 1.0$).
   - `GET /regime` $\rightarrow$ fetches current macro Bull/Normal/Bear probabilities.
   - `POST /portfolio` $\rightarrow$ requests optimal weights matching the user's `risk_tolerance`.
   - `GET /explain` $\rightarrow$ fetches SHAP XAI justifications.
   - `GET /sentiment` $\rightarrow$ fetches market sentiment polarity.
4. **Rendering:** Recharts builds the allocation donut chart, the regime risk indicator renders the probability bar, and XAI cards display plain-English justifications.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js (/dashboard)
    participant API as FastAPI Backend
    participant Cache as Processed Artifacts (*.csv)
    participant DB as SQLite Database

    User->>FE: Navigate to /dashboard
    FE->>API: GET /auth/profile (Bearer Token)
    API->>DB: Verify JWT & Fetch UserProfile
    DB-->>API: UserProfile (risk_tolerance=0.5)
    API-->>FE: JSON Profile Data

    par Fetch Dashboard Subsystems
        FE->>API: GET /regime
        API->>Cache: Read latest_regime.csv
        Cache-->>API: {date, bear_prob, normal_prob, bull_prob}
        API-->>FE: HTTP 200 OK
    and
        FE->>API: POST /portfolio {risk_tolerance: 0.5}
        API->>Cache: Read latest_portfolio.csv
        API->>API: Filter portfolio by risk_tolerance == 0.5
        Cache-->>API: Filtered ticker allocations
        API-->>FE: HTTP 200 OK {date, allocations: {TCS: 0.15, ...}}
    and
        FE->>API: GET /explain
        API->>Cache: Read latest_explanations.csv
        Cache-->>API: SHAP attributions & justifications
        API-->>FE: HTTP 200 OK
    and
        FE->>API: GET /sentiment
        API->>Cache: Read latest_sentiment.csv
        Cache-->>API: Average sentiment score
        API-->>FE: HTTP 200 OK
    end

    FE-->>User: Render Donut Chart, Regime Indicator & XAI Cards
```

### 8.3 Workflow 3: Portfolio Holdings Upload & Risk Diagnostic Analysis
1. **User Action:** The user navigates to `/dashboard/portfolio`, enters manual holdings or uploads a CSV of their current stock positions, and clicks "Analyze Portfolio".
2. **Frontend Dispatch:** [`frontend/src/app/dashboard/portfolio/page.tsx:74-100`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/portfolio/page.tsx#L74-L100) formats the holdings into `{ "TICKER.NS": { quantity, buy_price } }` and executes a `POST` request to `http://localhost:8000/portfolio_analysis`.
3. **Backend Risk Computation:** In [`src/api/main.py:145-235`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L145-L235):
   - Computes total position valuation: $V = \sum Q_i \cdot P_i$, and weights $w_i = (Q_i \cdot P_i) / V$.
   - **Concentration Check:** Flags any asset where $w_i > 0.30$ as a severe concentration risk.
   - **AI Conviction Alignment:** Matches holdings against `latest_predictions.csv`. If an asset has negative predicted returns ($\hat{y}_i < 0$), it appends a Sell Warning. If return is weak ($<0.005$) and $w_i > 0.10$, it appends a Trimming Opportunity.
   - **Macro Regime Check:** Ingests `latest_regime.csv`. If $P(\text{Bull}) < 0.40$, adds a Defensive Rotation Alert.
   - **Health Score Math:** Starts at 100, penalizes -20 for concentration, -25 for negative expected returns, -10 for bear regimes, and -10 for AI sell warnings.
4. **Response & Display:** The API returns the calculated Health Score ($0-100$), beta, and recommendation alerts to the user.

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant FE as Next.js (/dashboard/portfolio)
    participant API as FastAPI (/portfolio_analysis)
    participant Cache as Processed Artifacts (predictions, regime)

    User->>FE: Input Holdings (e.g., RELIANCE: 100 @ Rs 2500)
    FE->>API: POST /portfolio_analysis {holdings: {RELIANCE.NS: {quantity: 100, buy_price: 2500}}}
    API->>Cache: Read latest_predictions.csv & latest_regime.csv
    Cache-->>API: Predictions & Regime data
    API->>API: Calculate total valuation & weights (w_i)
    API->>API: Evaluate concentration risk (w_i > 30%)
    API->>API: Evaluate AI return conviction (y_pred < 0)
    API->>API: Calculate Portfolio Health Score (Base: 100 - penalties)
    API-->>FE: HTTP 200 OK {total_value, health_score, current_beta, recommendations}
    FE-->>User: Render Health Gauge, Risk Cards & AI Action Items
```

### 8.4 Workflow 4: Daily Offline ML Orchestration Pipeline
1. **Trigger:** Apache Airflow DAG at 6:00 PM IST or Windows execution of `run_full_pipeline.bat`.
2. **Execution Steps:**
   - Step 1: `fetch_data.py` calls Yahoo Finance API and saves raw OHLCV prices.
   - Step 2: `preprocess.py` cleans missing values, forward fills data, and calculates returns.
   - Step 3: `feature_engineering.py` constructs 13 technical features and generates cross-sectional monthly percentile ranks.
   - Step 4 (Parallel): `predict.py` executes LightGBM inference; `garch.py` and `covariance.py` estimate volatility and shrunk covariance; `hmm_predict.py` generates regime posteriors.
   - Step 5: `fusion.py` evaluates Contextual Bandit risk governor.
   - Step 6: `portfolio.py` runs CVXPY quadratic optimization across all risk tolerances and persists `latest_portfolio.csv`.

```mermaid
sequenceDiagram
    autonumber
    participant Orch as Airflow DAG / Batch Script
    participant DataP as src/data_pipeline (fetch, preprocess, features)
    participant ML as src/models (LightGBM, HMM, GARCH, Covariance)
    participant Opt as src/optimizer (fusion, portfolio)
    participant Disk as Local Data Storage (data/processed/)

    Orch->>DataP: Run fetch_data.py
    DataP->>Disk: Write raw historical_prices.csv
    Orch->>DataP: Run preprocess.py
    DataP->>Disk: Write clean_prices.csv & monthly_returns.csv
    Orch->>DataP: Run feature_engineering.py
    DataP->>Disk: Write feature_matrix.csv
    
    par Daily Inferences
        Orch->>ML: Run return_predictor/predict.py
        ML->>Disk: Write latest_predictions.csv
    and
        Orch->>ML: Run volatility/garch.py & covariance.py
        ML->>Disk: Write volatility_forecasts.csv & covariance.csv
    and
        Orch->>ML: Run regime/hmm_predict.py
        ML->>Disk: Write latest_regime.csv
    end

    Orch->>Opt: Run optimizer/fusion.py
    Opt->>Opt: Contextual Bandit evaluates dynamic lambda
    Orch->>Opt: Run optimizer/portfolio.py
    Opt->>Opt: CVXPY solves Pareto frontier (OSQP/SCS) for rt in [0.0, 1.0]
    Opt->>Disk: Write latest_portfolio.csv
```

---

## 9. API Design

All endpoints are hosted on FastAPI and verified directly against [`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py) and [`src/api/auth.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py).

### 9.1 Endpoint Specifications Table

| Method & Path | Auth Required | Purpose | Request Body / Parameters | Response Structure | Verified Error Codes | Source Handler |
| :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| `POST /auth/register` | No | Register new user account | JSON: `{ "username": str, "password": str }` | `{ "access_token": str, "token_type": "bearer" }` | 400 (User exists) | [`src/api/auth.py:59`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L59) |
| `POST /auth/token` | No | Login and obtain JWT | Form: `username=str&password=str` | `{ "access_token": str, "token_type": "bearer" }` | 401 (Bad credentials) | [`src/api/auth.py:79`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L79) |
| `GET /auth/profile` | **Yes (Bearer)** | Fetch user wealth profile | None (reads JWT `sub`) | `{ "id": int, "user_id": int, "age": int, "income": float, "monthly_savings": float, "risk_tolerance": float, "goals": list }` | 401 (Invalid/expired token) | [`src/api/auth.py:98`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L98) |
| `POST /auth/profile` | **Yes (Bearer)** | Update wealth profile | JSON: `{ "age": int, "income": float, "monthly_savings": float, "risk_tolerance": float, "goals": list }` | `{ "status": "success" }` | 401 (Invalid token) | [`src/api/auth.py:103`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L103) |
| `GET /predict` | No | Next-month return forecasts | None | List of `{ "date": str, "ticker": str, "predicted_return": float, "model_version": str }` | 404 (File not found) | [`src/api/main.py:45`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L45) |
| `GET /volatility` | No | Forecasted annualized volatility | None | List of `{ "date": str, "ticker": str, "forecasted_vol_ann": float }` | 404 (File not found) | [`src/api/main.py:55`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L55) |
| `GET /regime` | No | Current macro regime probabilities | None | `{ "date": str, "bear_prob": float, "normal_prob": float, "bull_prob": float }` | 404 (File not found) | [`src/api/main.py:65`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L65) |
| `GET /sentiment` | No | Market news sentiment scores | None | List of `{ "ticker": str, "sentiment_score": float, "news_count": int }` | 404 (File not found) | [`src/api/main.py:75`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L75) |
| `GET /explain` | No | SHAP XAI feature justifications | None | List of `{ "ticker": str, "top_feature": str, "top_shap_value": float, "justification": str }` | 404 (File not found) | [`src/api/main.py:84`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L84) |
| `GET /graph` | No | Minimum Spanning Tree topology | None | `{ "nodes": [{"id": str, "x": float, "y": float}], "edges": [{"source": str, "target": str, "corr": float}] }` | 404 (File not found) | [`src/api/main.py:93`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L93) |
| `POST /portfolio` | No | Optimal asset allocations | JSON: `{ "risk_tolerance": float }` | `{ "date": str, "allocations": { "TICKER": float } }` | 404, 500 | [`src/api/main.py:102`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L102) |
| `POST /portfolio_analysis` | No | Portfolio health & risk diagnostic | JSON: `{ "holdings": { "TICKER": { "quantity": float, "buy_price": float } } }` | `{ "total_value": float, "expected_return": float, "health_score": int, "current_beta": float, "current_sharpe": float, "concentration_risk": str, "recommendations": list[str] }` | None (Returns fallback dict on error) | [`src/api/main.py:145`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L145) |
| `GET /funds` | No | AI-ranked Mutual Funds & ETFs | None | List of `{ "id": int, "name": str, "category": str, "sharpe": float, "alpha": float, "volatility": float, "score": int }` | None (Mock feature) | [`src/api/main.py:237`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L237) |
| `POST /goals` | No | SIP installment calculator | JSON: `{ "target_amount": float, "years": int, "expected_return": float }` | `{ "target_amount": float, "years": int, "expected_return": float, "required_sip": float, "total_investment": float, "estimated_wealth_gain": float }` | None (Mathematical evaluation) | [`src/api/main.py:250`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L250) |

---

## 10. Data Architecture and Database Design

### 10.1 Active Storage Engines
1. **Relational Database (`portfolio.db` / PostgreSQL):** Managed via SQLAlchemy ORM in [`src/api/database.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/database.py). Operates as SQLite in local development (`sqlite:///./data/portfolio.db`) and PostgreSQL in Docker. Stores user credentials and wealth profiles.
2. **Relational Schema Definition (`config/schema.sql`):** Defines production DDL tables (`daily_prices`, `monthly_features`, `predictions`, `portfolios`, `regimes`) designed for TimescaleDB hypertables.
3. **Tabular File-Cache Datastore (`data/processed/`):** High-throughput, comma-separated files storing the daily batch execution state. Serving endpoints read directly from these artifacts to bypass database query latency.
4. **Machine Learning Model Artifacts:** Serialized binary models stored as `.joblib` files (`lgbm_model.joblib`, `hmm_model.joblib`, `target_bounds.joblib`).
5. **Experiment Tracking Store (`mlflow.db`):** SQLite database recording MLflow experiment runs, parameters, metrics, and tags.

### 10.2 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--|| USER_PROFILES : "owns"
    
    USERS {
        int id PK "Auto-increment primary key"
        string username UK "Unique username, indexed"
        string hashed_password "Bcrypt password hash"
    }

    USER_PROFILES {
        int id PK "Auto-increment primary key"
        int user_id FK "Unique foreign key -> users.id"
        int age "User age (default: 30)"
        float income "Annual income (INR)"
        float monthly_savings "Monthly savings capacity (INR)"
        float risk_tolerance "Risk parameter in [0.0, 1.0]"
        json goals "JSON array of investment goal objects"
    }

    DAILY_PRICES {
        date date PK "Market trading date"
        varchar ticker PK "NSE stock symbol (e.g., TCS.NS)"
        numeric open "Opening price"
        numeric high "Intraday high"
        numeric low "Intraday low"
        numeric close "Unadjusted close"
        numeric adjusted_close "Split & dividend adjusted close"
        bigint volume "Trading volume"
    }

    MONTHLY_FEATURES {
        date date PK "Month-end sample date"
        varchar ticker PK "NSE stock symbol"
        numeric target_return "1-month forward excess return"
        numeric mom_1m "1-month price momentum"
        numeric mom_12m "12-month price momentum"
        numeric vol_3m "3-month realized volatility"
        numeric rsi "14-day Relative Strength Index"
        numeric macd_diff "MACD histogram"
        numeric mom_1m_rank "Cross-sectional percentile rank"
        numeric mom_12m_rank "Cross-sectional percentile rank"
    }

    PREDICTIONS {
        date date PK "Forecast effective date"
        varchar ticker PK "NSE stock symbol"
        varchar model_version PK "Model identifier (e.g. lightgbm)"
        numeric predicted_return "Expected excess return"
    }

    PORTFOLIOS {
        date date PK "Rebalance date"
        varchar ticker PK "NSE stock symbol"
        numeric weight "Optimal fraction [0.0, 0.20]"
    }

    REGIMES {
        date date PK "Forecast effective date"
        numeric bear_prob "Posterior probability of Bear market"
        numeric normal_prob "Posterior probability of Normal market"
        numeric bull_prob "Posterior probability of Bull market"
    }
```

---

## 11. Low-Level Design (LLD)

### 11.1 Module and Class Structure

```mermaid
classDiagram
    class User {
        +int id
        +str username
        +str hashed_password
    }

    class UserProfile {
        +int id
        +int user_id
        +int age
        +float income
        +float monthly_savings
        +float risk_tolerance
        +list goals
    }

    class FeatureEngineering {
        +add_technical_indicators(df: DataFrame) DataFrame
        +apply_cross_sectional_ranking(df: DataFrame, cols: list) DataFrame
        +align_to_monthly(daily_df: DataFrame, monthly_df: DataFrame) DataFrame
    }

    class ModelTrainer {
        +evaluate_predictions(y_true, y_pred, df_test) tuple
        +train_model() void
    }

    class RegimeClassifier {
        +train_hmm() void
        +predict_regime() DataFrame
    }

    class VolatilityEstimator {
        +forecast_volatility(df: DataFrame, window: int) DataFrame
        +estimate_covariance(df: DataFrame, window: int) DataFrame
        +build_market_graph() void
    }

    class PortfolioOptimizer {
        +rl_contextual_bandit(regime_probs: dict, cov: DataFrame) float
        +fuse_predictions() tuple
        +optimize_portfolio() DataFrame
    }

    User "1" -- "1" UserProfile : owns
    FeatureEngineering --> ModelTrainer : supplies features
    ModelTrainer --> PortfolioOptimizer : expected returns (mu)
    RegimeClassifier --> PortfolioOptimizer : regime posteriors
    VolatilityEstimator --> PortfolioOptimizer : covariance (Sigma)
```

### 11.2 Mathematical Formulation of Core Algorithms

#### 1. Cross-Sectional Ranking Algorithm
To eliminate non-stationarity and make features scale-invariant across bull and bear eras, features are transformed into uniform percentile ranks cross-sectionally across all $N$ constituents at each time slice $t$:
$$\text{Rank}(f_{i,t}) = \frac{\text{argsort}(f_{i,t}) - 1}{N_t - 1} \in [0, 1]$$
Implemented in [`src/data_pipeline/feature_engineering.py:67-84`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/feature_engineering.py#L67-L84).

#### 2. Walk-Forward Chronological Validation & Winsorization
Random K-Fold cross-validation leaks future regimes into the training set, causing look-ahead bias. The model utilizes `TimeSeriesSplit(n_splits=5)`:
$$\mathcal{D}_{\text{train}}^{(k)} = \{ (X_t, y_t) \}_{t=1}^{T_k}, \quad \mathcal{D}_{\text{val}}^{(k)} = \{ (X_t, y_t) \}_{t=T_k+1}^{T_k + \Delta t}$$
Outliers are clipped using train set quantiles:
$$\tilde{y}_{i,t} = \max\left(Q_{0.01}(y_{\text{train}}), \min\left(y_{i,t}, Q_{0.99}(y_{\text{train}})\right)\right)$$
Implemented in [`src/models/return_predictor/train.py:79-106`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py#L79-L106).

#### 3. Information Coefficient (IC) & Hit Rate Evaluation
Prediction efficacy is measured via directional accuracy and Spearman rank correlation per cross-section:
$$\text{Hit Rate} = \frac{1}{T \cdot N} \sum_{t=1}^T \sum_{i=1}^N \mathbb{I}\left( \text{sgn}(\hat{y}_{i,t}) == \text{sgn}(y_{i,t}) \right)$$
$$\text{IC}_t = \text{corr}_{\text{Spearman}}\left( \text{rank}(\hat{y}_{\cdot, t}), \text{rank}(y_{\cdot, t}) \right), \quad \text{Mean IC} = \frac{1}{T} \sum_{t=1}^T \text{IC}_t$$
Implemented in [`src/models/return_predictor/train.py:20-41`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py#L20-L41).

#### 4. Ledoit-Wolf Shrinkage Covariance Matrix
Sample covariance $S$ on short time windows ($T=252, N=50$) is notoriously noisy and prone to inversion error. Ledoit-Wolf finds the optimal shrinkage intensity $\delta^* \in [0, 1]$ minimizing the expected quadratic loss:
$$\Sigma^* = (1 - \delta^*) S + \delta^* F$$
where $F = \frac{\text{Tr}(S)}{N} I$ is the constant correlation / identity target. Implemented in [`src/models/volatility/covariance.py:11-46`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/covariance.py#L11-L46).

#### 5. Contextual Bandit Risk Governor
Dynamically modulates the risk penalty $\lambda$ based on observed state:
$$\lambda_{\text{effective}} = \text{clip}\left(1.0 + \left[1.5 \cdot P(\text{Bear}) - 0.5 \cdot P(\text{Bull})\right] + \mathbb{I}\left(\sqrt{\frac{\text{Tr}(\Sigma)}{N}} > 0.25\right), 0.1, 5.0\right)$$
Implemented in [`src/optimizer/fusion.py:15-37`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/fusion.py#L15-L37).

#### 6. Constrained Convex Portfolio Optimization
Solves a quadratic program (QP) using the operator-splitting solver OSQP:
$$\max_{w \in \mathbb{R}^N} \quad \left( \mu^T w - (rt \cdot \lambda_{\text{effective}}) \cdot w^T \Sigma w \right)$$
$$\text{subject to} \quad \mathbf{1}^T w = 1.0, \quad w_i \ge 0 \quad \forall i, \quad w_i \le 0.20 \quad \forall i$$
Implemented in [`src/optimizer/portfolio.py:50-86`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py#L50-L86).

#### 7. TreeSHAP Feature Attributions
Calculates Shapley values via polynomial-time tree traversal across all subsets of features $S \subseteq F \setminus \{i\}$:
$$\phi_i = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \left[ f(S \cup \{i\}) - f(S) \right]$$
Implemented in [`src/models/return_predictor/explain.py:37-64`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py#L37-L64).

#### 8. Minimum Spanning Tree Market Topology
Computes distance $d_{i,j} = \sqrt{2(1 - \rho_{i,j})}$. Evaluates Kruskal's / Prim's algorithm on graph $G=(V, E, W)$ to produce tree $T$ minimizing $\sum_{(u,v) \in T} W(u,v)$ without cycles. Implemented in [`src/models/volatility/network.py:35-58`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/network.py#L35-L58).

#### 9. Goal SIP Annuity Compounder Formula
Calculates required monthly contribution $M$ to reach future target $F$ given monthly rate $r = R_{\text{ann}} / 12$ and months $n = \text{years} \times 12$:
$$F = M \times \left[ \frac{(1 + r)^n - 1}{r} \right] \times (1 + r) \implies M = \frac{F \cdot r}{\left[(1 + r)^n - 1\right] \cdot (1 + r)}$$
Implemented in [`src/api/main.py:253-263`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L253-L263).

---

## 12. Security Architecture

| Security Dimension | Classification | Detailed Technical Audit from Codebase |
| :--- | :---: | :--- |
| **Authentication** | **Verified** | Implemented using OAuth2 Password Bearer flow in [`src/api/auth.py:18`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L18). Generates signed HMAC-SHA256 (`HS256`) JSON Web Tokens with 7-day expiration. Authenticated routes inject `Depends(get_current_user)`. |
| **Password Storage** | **Verified** | Plaintext passwords are never saved. Salted hashes are generated and verified using `passlib.context.CryptContext(schemes=["bcrypt"], deprecated="auto")` in [`src/api/auth.py:17`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L17). |
| **Authorization** | **Verified** | Profile access is strictly scoped to the authenticated user's ID via `current_user.id` in [`src/api/auth.py:100`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L100). Horizontal privilege escalation is prevented because users cannot query or update other user IDs. |
| **Input Validation** | **Verified** | Strict Pydantic models (`UserCreate`, `ProfileUpdate`, `PortfolioRequest`, `GoalRequest`, `PortfolioAnalysisRequest`) validate incoming payloads and enforce types. |
| **SQL Injection Defense** | **Verified** | Handled exclusively via SQLAlchemy 2.0 ORM query filtering (`db.query(User).filter(User.username == ...)`), which uses parameterized queries. No raw string formatting into SQL statements exists. |
| **Secret Management** | **Uncertain / Vulnerable** | `SECRET_KEY` falls back to a hardcoded string `"super-secret-wealth-key-12345"` in [`src/api/auth.py:13`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L13) if `JWT_SECRET` environment variable is not explicitly injected. In production, this fallback must be eliminated. |
| **Cross-Origin (CORS)** | **Verified** | Configured via `CORSMiddleware` in [`src/api/main.py:21-27`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L21-L27) restricting origins to `http://localhost:3000`, `http://127.0.0.1:3000`, and `http://localhost:3001`. |
| **CSRF Protection** | **Not Applicable** | The application utilizes stateless Bearer tokens stored in browser memory/`localStorage` rather than automated ambient credentials (cookies), making standard CSRF attacks inapplicable. |
| **Rate Limiting** | **Absent** | No rate-limiting middleware (e.g., `slowapi`) is attached to `/auth/token` or `/auth/register`. The authentication endpoints are vulnerable to credential brute-forcing. |
| **Sensitive Data Logging** | **Verified Safe** | Logging outputs (`logging.INFO`) log shapes, file paths, and mathematical loss metrics, but never print plaintext passwords or JWT tokens to stdout. |

---

## 13. Performance and Scalability

### 13.1 Bottlenecks Identified in Code
1. **Synchronous Disk I/O in API Handlers:**  
   In [`src/api/main.py:52, 62, 72, 90, 112`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L52), endpoints execute `pd.read_csv()` synchronously inside route functions. When multiple users hit `/portfolio` or `/predict`, the Python runtime performs blocking disk reads.  
   *Remediation:* Cache parsed CSV dataframes in memory upon application startup (or in Redis) with an invalidation trigger when the batch job finishes.
2. **Sequential GARCH Model Fitting:**  
   In [`src/models/volatility/garch.py:35-65`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py#L35-L65), GARCH(1,1) is fitted inside a sequential `for ticker, group in df_daily.groupby('ticker'):` loop. Fitting 50 nonlinear optimizations takes 30–45 seconds.  
   *Remediation:* Parallelize fitting across CPU cores using `joblib.Parallel(n_jobs=-1)`.
3. **NewsAPI Sequential Request Loop:**  
   In [`src/data_pipeline/sentiment.py:36-73`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/sentiment.py#L36-L73), the pipeline issues 50 separate HTTP requests sequentially to NewsAPI. Network roundtrips take 15–20 seconds.  
   *Remediation:* Use `httpx.AsyncClient` with `asyncio.gather()` to fetch news concurrently.
4. **SQLite Concurrency Contention:**  
   In local development, SQLite locks the entire database file during writes (`db.commit()` in `/auth/register` and `/auth/profile`), limiting write throughput to tens of requests per second.  
   *Remediation:* Use PostgreSQL with connection pooling in all concurrent environments.

### 13.2 Scaling Limits & Capacity Projections
- **Current Single-Node Throughput (Local Uvicorn):** Estimated $\approx 250 - 400\text{ req/sec}$ for pre-computed read endpoints (`/portfolio`, `/regime`) before I/O disk thrashing occurs.
- **Optimization Architecture Scalability:** Because the optimization problem is pre-calculated across all risk tolerance buckets, computational complexity for incoming `/portfolio` user requests is $O(1)$ rather than $O(N^3)$ (matrix inversion).

---

## 14. Reliability and Failure Handling

### 14.1 Protection Mechanisms Verified in Code
1. **Convex Solver Fallbacks:**  
   In [`src/optimizer/portfolio.py:70-85`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py#L70-L85), if the primary convex solver `OSQP` fails or produces an `OPTIMAL_INACCURATE` status, the system catches the exception and attempts to solve with `SCS`. If `SCS` fails or yields `None`, it safely falls back to a guaranteed baseline: an equal-weighted allocation ($w_i = 1/N$).
2. **Missing Feature Imputation:**  
   In [`src/data_pipeline/preprocess.py:24`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/preprocess.py#L24), missing market prices caused by holidays or liquidity suspensions are imputed using forward-filling (`ffill`) per ticker.
3. **GARCH Insufficient Data Handling:**  
   In [`src/models/volatility/garch.py:39-41`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/garch.py#L39-L41), tickers with fewer than `window // 2` trading days are skipped rather than causing the optimizer to crash.
4. **Client-Side Auth Error Interception:**  
   In [`frontend/src/app/dashboard/layout.tsx:66-69`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app/dashboard/layout.tsx#L66-L69), 401 Unauthorized API responses immediately clear expired tokens from `localStorage` and redirect to `/login`, preventing corrupt UI render states.

### 14.2 Reliability Gaps & Missing Defenses
- **No Circuit Breakers on Yahoo Finance:** If Yahoo Finance returns HTTP 429 Too Many Requests, `fetch_data.py` fails and aborts the pipeline.
- **Silent Failures in Portfolio Analysis:** In [`src/api/main.py:230-235`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L230-L235), `except Exception as e:` catches all errors and returns zeroed metrics, masking internal traceback errors.

---

## 15. Deployment and Runtime Architecture

### 15.1 Verified Local Development Setup
- **Frontend Runtime:** Node.js (v18+) running Next.js 14 dev server at `http://localhost:3000`.
- **Backend Runtime:** Python 3.10+ running Uvicorn server at `http://127.0.0.1:8000`.
- **Database Engine:** Embedded SQLite at `data/portfolio.db`.
- **Batch Automation:** Windows Command Script [`run_full_pipeline.bat`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/run_full_pipeline.bat).

### 15.2 Verified Docker Infrastructure ([`docker/docker-compose.yml`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/docker-compose.yml))
The repository defines a multi-container Docker Compose architecture:
1. `db`: `timescale/timescaledb:latest-pg14` on port `5432:5432`, auto-mounting [`config/schema.sql`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/config/schema.sql) into `/docker-entrypoint-initdb.d/`.
2. `api`: Builds [`docker/Dockerfile.api`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.api), exposes port `8000:8000`, links to `db`, injects `DATABASE_URL`.
3. `dashboard`: Builds [`docker/Dockerfile.dashboard`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.dashboard), exposes port `8501:8501`, links to `api`, injects `API_URL`.

### 15.3 Deployment Diagram (Verified vs. Production Target)

```mermaid
flowchart TD
    subgraph Verified_Local_Docker ["Verified Container Setup (docker-compose.yml)"]
        Docker_DB["TimescaleDB Container<br/>(timescaledb:latest-pg14)<br/>Port 5432"]
        Docker_API["FastAPI Container<br/>(Dockerfile.api)<br/>Port 8000"]
        Docker_Streamlit["Streamlit Dashboard Container<br/>(Dockerfile.dashboard)<br/>Port 8501"]
        
        Docker_Streamlit -->|"HTTP (API_URL)"| Docker_API
        Docker_API -->|"Postgres Native Dialect"| Docker_DB
    end

    subgraph Proposed_Production_Target ["Proposed Production Target Architecture"]
        CDN["Vercel Edge CDN<br/>(Next.js 14 Frontend)"]
        ALB["Application Load Balancer<br/>(HTTPS / SSL Termination)"]
        ECS_API["AWS ECS / EKS Cluster<br/>(FastAPI Replicas + Gunicorn)"]
        Redis_Cluster["ElastiCache Redis<br/>(O(1) Data Cache & Rate Limits)"]
        RDS_PG["AWS RDS PostgreSQL / Timescale<br/>(Multi-AZ User & Market Data)"]
        Airflow_MWAA["Amazon MWAA<br/>(Managed Apache Airflow DAGs)"]
        
        CDN -->|"REST API over HTTPS"| ALB
        ALB --> ECS_API
        ECS_API --> Redis_Cluster
        ECS_API --> RDS_PG
        Airflow_MWAA -->|"Daily Batch Trigger"| ECS_API
        Airflow_MWAA --> RDS_PG
    end
```

### 15.4 Verified Bugs in Container Configuration
> [!WARNING]
> 1. **Entry Point Mismatch in [`docker/Dockerfile.dashboard:17`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.dashboard#L17):**  
>    The Dockerfile executes `CMD ["streamlit", "run", "src/dashboard/app.py"]`, but the actual repository file is named `src/dashboard/main.py`. This container will crash on launch with `FileNotFoundError`.  
> 2. **Incomplete Context in [`docker/Dockerfile.api:10-12`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.api#L10-L12):**  
>    The Dockerfile copies only `config/`, `src/api/`, and `data/processed/`. However, [`src/api/main.py:15`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L15) explicitly imports `from src.optimizer.portfolio import optimize_portfolio`. In this container, FastAPI will crash with `ModuleNotFoundError: No module named 'src.optimizer'`.

---

## 16. Important Architectural Decisions and Trade-offs

| # | Architectural Decision | Evidence in Codebase | Problem Addressed | Advantages | Costs, Limitations & Trade-offs | Status |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Pre-Computed Optimization Frontier** | [`src/optimizer/portfolio.py:50-95`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/portfolio.py#L50-L95) | Convex quadratic programming (`cvxpy.solve`) takes 2–5 seconds per solve, causing unacceptable HTTP request latency and CPU spikes under multi-user concurrency. | Live `/portfolio` API responses are instantaneous ($<15\text{ ms}$) via simple disk/memory lookup. | Users must choose from discrete risk tolerance levels ($0.0, 0.1, \dots, 1.0$) rather than fully continuous parameters. | **Verified Implemented** |
| **2** | **LightGBM over Deep Learning (LSTMs)** | [`comparative_analysis.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/comparative_analysis.py), [`model_comparison.csv`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/model_comparison.csv) | Daily/monthly stock returns have very low signal-to-noise ratios. Complex recurrent or attention neural networks severely overfit market noise on small sample sizes. | LightGBM achieved the top Information Coefficient (0.0292) and Hit Rate (52.28%) with fast training and low inference memory. | Cannot learn complex multi-sequence temporal dependencies as effectively as transformer architectures on tick-level data. | **Verified Implemented** |
| **3** | **Walk-Forward Splitting over Random K-Fold** | [`src/models/return_predictor/train.py:105`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/train.py#L105) | Standard randomized train/test splits cause severe look-ahead bias and temporal data leakage in time-series data. | Preserves the strict temporal arrow of time. Models are validated strictly on unseen future market cycles. | Training data in early walk-forward splits is smaller; cannot shuffle cross-sectional rows across time. | **Verified Implemented** |
| **4** | **Ledoit-Wolf Shrinkage for Covariance** | [`src/models/volatility/covariance.py:34-38`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/volatility/covariance.py#L34-L38) | The sample covariance matrix $S$ with $N=50$ stocks across $T=252$ days is ill-conditioned and susceptible to extreme estimation errors during matrix inversion. | Regularizes the matrix towards a diagonal target, guaranteeing positive semi-definiteness ($w^T \Sigma w \ge 0$) and stable optimizer convergence. | Shrinkage slightly attenuates genuine extreme empirical cross-asset correlations. | **Verified Implemented** |
| **5** | **Decoupled Next.js Web App over Streamlit** | [`frontend/src/app`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/frontend/src/app) vs [`src/dashboard/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/dashboard/main.py) | Streamlit reruns the entire Python script on every user interaction, making complex animations, responsive mobile design, and fine-grained UI state impossible. | Delivers a state-of-the-art institutional cyber dashboard with 60 FPS HTML5 canvas particles, reactive Recharts charts, and client-side caching. | Adds Node.js, TypeScript, and TailwindCSS build maintenance overhead to an otherwise pure Python repository. | **Verified Implemented** |
| **6** | **TreeSHAP Explainability for User Trust** | [`src/models/return_predictor/explain.py:37`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/models/return_predictor/explain.py#L37) | Algorithmic trading recommendations suffer from "black-box" skepticism, causing retail investors to abandon models during normal drawdowns. | Translates complex multidimensional tree splits into human-readable sentences explaining exactly which features drove the stock recommendation. | Adds an additional compute step to the daily batch pipeline. | **Verified Implemented** |
| **7** | **Contextual Bandit Dynamic Risk Penalty** | [`src/optimizer/fusion.py:15-38`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/optimizer/fusion.py#L15-L38) | Static mean-variance optimization fails to de-risk portfolios before or during severe structural macroeconomic market crashes. | Dynamically raises the effective risk penalty up to $5.0\times$ when HMM identifies high Bear probability or covariance trace spikes. | The reward and penalty formula is an empirical heuristic rather than an online policy gradient RL network. | **Verified Implemented** |
| **8** | **Cross-Sectional Percentile Rank Transform** | [`src/data_pipeline/feature_engineering.py:67`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/data_pipeline/feature_engineering.py#L67) | Raw technical indicators (e.g., Volume, RSI, Volatility) undergo non-stationary regime shifts across multi-year macroeconomic cycles. | Produces stationary, uniformly distributed inputs across all dates, preventing any single high-magnitude feature from dominating tree split calculations. | Discards absolute cross-sectional magnitude information (only relative ordering between the 50 stocks is preserved). | **Verified Implemented** |

---

## 17. Limitations, Technical Debt, and Future Improvements

### 17.1 High Severity Issues
1. **Container Configuration Bugs ([`docker/Dockerfile.dashboard`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.dashboard), [`docker/Dockerfile.api`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/docker/Dockerfile.api)):**  
   - `Dockerfile.dashboard` executes non-existent `app.py` instead of `main.py`.  
   - `Dockerfile.api` omits `src/optimizer`, causing runtime import failure in `src/api/main.py`.  
   - *Fix:* Fix CMD in `Dockerfile.dashboard` to `CMD ["streamlit", "run", "src/dashboard/main.py", "--server.port=8501", "--server.address=0.0.0.0"]`, and update `Dockerfile.api` to copy all of `src/`: `COPY src/ ./src/`.
2. **Hardcoded Fallback JWT Secret ([`src/api/auth.py:13`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/auth.py#L13)):**  
   - If `JWT_SECRET` is unset, the system defaults to `"super-secret-wealth-key-12345"`. Anyone with knowledge of this open-source default can forge authentication tokens for any user.  
   - *Fix:* Enforce `SECRET_KEY = os.environ["JWT_SECRET"]` and raise an explicit `RuntimeError` on startup if missing.
3. **Absence of Rate Limiting on Authentication Routes:**  
   - `/auth/token` and `/auth/register` have no throttling, exposing user accounts to dictionary attacks.  
   - *Fix:* Integrate `slowapi` with Redis to restrict login attempts to 5 per minute per IP.

### 17.2 Medium Severity Issues
1. **Synchronous File Reading inside Async Endpoints ([`src/api/main.py`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py)):**  
   - `pd.read_csv()` blocks the event loop on every request.  
   - *Fix:* Load all CSV artifacts into an in-memory dictionary or Redis key-value cache on startup.
2. **Mock Mutual Fund Implementation ([`src/api/main.py:237-248`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L237-L248)):**  
   - `/funds` returns a static mock array.  
   - *Fix:* Implement an actual mutual fund data ETL pipeline ingesting NAV data from AMFI (Association of Mutual Funds in India) and ranking funds by rolling 3-year Sortino and Alpha metrics.
3. **Hardcoded Sharpe Ratio in Portfolio Analysis ([`src/api/main.py:226`](file:///c:/Users/Yash/99/99PRO/portfolio-ml/src/api/main.py#L226)):**  
   - `current_sharpe: 1.2` is hardcoded with a comment `# Hardcoded for now`.  
   - *Fix:* Compute actual annualized portfolio variance: $\sigma_p^2 = w^T \Sigma w$, and compute true historical Sharpe ratio: $\text{Sharpe} = (R_p - R_f) / \sigma_p$.

### 17.3 Low Severity / Future Enhancements
1. **Brokerage API Execution Integration:**  
   - The platform calculates ideal rebalancing weights but does not place trades.  
   - *Improvement:* Integrate Zerodha Kite Connect or Upstox REST APIs to allow one-click automated trade execution.
2. **Fractional Share Execution & Slippage Modeling:**  
   - The optimization model assumes continuous weights. Indian exchanges do not allow fractional shares.  
   - *Improvement:* Add an integer quadratic programming (knapsack) layer that rounds ideal continuous weights into discrete lots based on user capital.

---
