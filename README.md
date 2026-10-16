# 🚀 Nifty 50 AI Portfolio Optimization & Quantitative Wealth Platform

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16.1-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)

![CVXPY](https://img.shields.io/badge/Optimizer-CVXPY-FF6B35?style=for-the-badge)
![LightGBM](https://img.shields.io/badge/ML-LightGBM-2C8EBB?style=for-the-badge)
![SHAP](https://img.shields.io/badge/XAI-SHAP-8A2BE2?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-Passing%20(pytest)-00C853?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-yellow?style=for-the-badge)

<br>

> ### ⚡ An end-to-end quantitative portfolio engineering & robo-advisory platform for Indian equity markets
>
> **Nifty 50 constituents** · Automated ingestion · Multi-factor ML · GARCH volatility · HMM regimes · SHAP explainability · CVXPY convex optimization

<br>

<table align="center">
<tr><td>

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ┌──────────────────────────────────────────────────────────────────┐      ║
║    │ ███╗   ██╗██╗███████╗████████╗██╗   ██╗    ███████╗ ██████╗      │      ║
║    │ ████╗  ██║██║██╔════╝╚══██╔══╝╚██╗ ██╔╝    ██╔════╝██╔═████╗     │      ║
║    │ ██╔██╗ ██║██║█████╗     ██║    ╚████╔╝     ███████╗██║██╔██║     │      ║
║    │ ██║╚██╗██║██║██╔══╝     ██║     ╚██╔╝      ╚════██║████╔╝██║     │      ║
║    │ ██║ ╚████║██║██║        ██║      ██║       ███████║╚██████╔╝     │      ║
║    │ ╚═╝  ╚═══╝╚═╝╚═╝        ╚═╝      ╚═╝       ╚══════╝ ╚═════╝      │      ║
║    │                                                                  │      ║
║    │          A I   P O R T F O L I O   O P T I M I Z A T I O N       │      ║
║    └──────────────────────────────────────────────────────────────────┘      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

</td></tr>
</table>

</div>

---

## 📑 Table of Contents

<table>
  <tr>
    <td align="left" width="220"><b>🎯 CORE</b></td>
    <td align="left" width="220"><b>🧠 INTELLIGENCE</b></td>
    <td align="left" width="220"><b>🏗️ INFRASTRUCTURE</b></td>
    <td align="left" width="220"><b>🔐 OPS</b></td>
  </tr>
  <tr>
    <td align="left"><a href="#-overview">Overview</a></td>
    <td align="left"><a href="#-quantitative-ml-pipeline--optimization">AI/ML Pipeline</a></td>
    <td align="left"><a href="#-technology-stack">Technology Stack</a></td>
    <td align="left"><a href="#-security-and-hardening-considerations">Security</a></td>
  </tr>
  <tr>
    <td align="left"><a href="#-key-features">Key Features</a></td>
    <td align="left"><a href="#-explainable-ai-xai">Explainable AI</a></td>
    <td align="left"><a href="#-repository-structure">Repo Structure</a></td>
    <td align="left"><a href="#-testing-and-code-quality">Testing</a></td>
  </tr>
  <tr>
    <td align="left"><a href="#-visual-artifacts--model-explainability">Visual Artifacts</a></td>
    <td align="left"><a href="#-architecture-overview">Architecture</a></td>
    <td align="left"><a href="#-installation-and-setup">Setup</a></td>
    <td align="left"><a href="#-roadmap">Roadmap</a></td>
  </tr>
  <tr>
    <td align="left"><a href="#-api-documentation">API Docs</a></td>
    <td align="left"><a href="#-database-and-data-management">Database</a></td>
    <td align="left"><a href="#-deployment--containerization">Deployment</a></td>
    <td align="left"><a href="#-troubleshooting--faq">FAQ</a></td>
  </tr>
  <tr>
    <td align="left"></td>
    <td align="left"></td>
    <td align="left"></td>
    <td align="left"><a href="#-known-limitations">Known Limitations</a></td>
  </tr>
  <tr>
    <td align="left"></td>
    <td align="left"></td>
    <td align="left"></td>
    <td align="left"><a href="#-contributing">Contributing</a></td>
  </tr>
</table>

## 🎯 Overview

```diff
- ❌ Traditional robo-advisors: static 60/40 splits, naive extrapolation
- ❌ Fail during macro regime shifts, severe concentration, ignore volatility clustering
- ❌ ML models treated as black boxes → no investor trust

+ ✅ Institutional-grade multi-stage quant pipeline for Nifty 50 universe
+ ✅ Forward-looking volatility + regime-aware dynamic optimization
+ ✅ Full SHAP-based explainability on every prediction
```



### 🧩 The Problem

> Traditional retail portfolio management relies on **static asset allocations** or **naive historical return extrapolation**. These approaches fail during macro regime shifts, suffer from **severe single-stock concentration**, and ignore forward-looking **volatility clustering** and **structural correlation breakdown**. Furthermore, ML models in finance are frequently **black boxes** — leaving investors without rationale behind rebalancing signals.

### 💡 The Solution

<table>
<tr>
<td width="50%" valign="top">

#### 🔬 Six-Stage Quant Pipeline

```
┌─────────────────────────────┐
│ 1. INGESTION & ENGINEERING  │
│    Nifty 50 OHLCV + sentiment│
├─────────────────────────────┤
│ 2. RETURN FORECASTING       │
│    LightGBM + Random Forest │
├─────────────────────────────┤
│ 3. VOLATILITY MODELING      │
│    GARCH(1,1) + Ledoit-Wolf │
├─────────────────────────────┤
│ 4. REGIME DETECTION         │
│    3-State Gaussian HMM     │
├─────────────────────────────┤
│ 5. CONVEX OPTIMIZATION      │
│    CVXPY Markowitz QP       │
├─────────────────────────────┤
│ 6. EXPLAINABILITY           │
│    Tree SHAP attributions   │
└─────────────────────────────┘
```

</td>
<td width="50%" valign="top">

#### 🎛️ Optimization Constraints

| Constraint | Formulation |
|:---|:---|
| Long-only | $w_i \ge 0$ |
| Single-asset cap | $w_i \le 0.20$ |
| Full investment | $\sum w_i = 1$ |
| Risk aversion | $\lambda = f(\text{regime}, \sigma)$ |

**Objective:**

$$\max_w \; w^T\mu - \lambda \cdot w^T\Sigma w$$

Where $\lambda$ dynamically adapts to macro regime probabilities and contextual bandit volatility penalties.

</td>
</tr>
</table>

---

## ⚡ Key Features

<div align="center">

### 🧠 Quantitative ML Pipeline & Optimization

</div>

<table>
<tr>
<td width="33%" valign="top" align="center">

#### 📈 Return Predictor

![LightGBM](https://img.shields.io/badge/LightGBM-4.0+-2C8EBB?style=flat-square)

Gradient boosted trees trained on rolling cross-sectional technical features

`RSI` `MACD` `%B` `ATR` `CCI` `Momentum` `52W High` `Volume`

Target winsorized at **1st / 99th percentiles**

</td>
<td width="33%" valign="top" align="center">

#### 🌊 GARCH Volatility

![GARCH](https://img.shields.io/badge/GARCH-1%2C1-FF6B35?style=flat-square)

Conditional variance over rolling **756-day** windows

Captures **volatility clustering** across market regimes

Paired with **Ledoit-Wolf shrinkage** covariance for numerical stability

</td>
<td width="33%" valign="top" align="center">

#### 🕸️ Network MST

![NetworkX](https://img.shields.io/badge/NetworkX-MST-8A2BE2?style=flat-square)

Minimum Spanning Tree on asset correlations

Identifies **high-centrality clusters**

Prevents overexposure to correlated sectors

</td>
</tr>
<tr>
<td width="33%" valign="top" align="center">

#### 🔮 HMM Regimes

![HMM](https://img.shields.io/badge/HMM-3--State-00C853?style=flat-square)

Gaussian Hidden Markov Model on index returns + realized vol

Classifies: 🐂 **Bull** · ⚖️ **Normal** · 🐻 **Bear**

Probabilities feed into dynamic risk aversion

</td>
<td width="33%" valign="top" align="center">

#### 🎯 CVXPY Optimizer

![CVXPY](https://img.shields.io/badge/CVXPY-1.3.1+-FF6B35?style=flat-square)

Markowitz mean-variance QP sweep across risk tolerances `[0.0 → 1.0]`

Pre-computes the full efficient frontier

Convex, deterministic, production-safe

</td>
<td width="33%" valign="top" align="center">

#### 🔍 SHAP XAI

![SHAP](https://img.shields.io/badge/SHAP-0.42+-8A2BE2?style=flat-square)

Exact Shapley values per feature per stock

Converts math → **human-readable "why" justifications**

Displayed natively in the dashboard

</td>
</tr>
</table>

---

<div align="center">

### 🖥️ Full-Stack Interfaces

</div>

<table>
<tr>
<td width="50%" valign="top">

#### 🌐 Next.js 16 Web Dashboard

![Next.js](https://img.shields.io/badge/Next.js-16.1-000000?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwind-css)

- 📊 **Executive Overview** — regime pill, allocation donuts, top alpha picks, SHAP cards
- 🩺 **Portfolio Health Analyzer** — concentration alerts, beta, rebalancing recs
- 🎯 **Goal Planner & SIP Calculator** — compound growth + monthly SIP solver
- 🔎 **Fund Screener** — AI-ranked mutual funds & ETFs

</td>
<td width="50%" valign="top">

#### 📓 Streamlit Analytical Workbench

![Streamlit](https://img.shields.io/badge/Streamlit-1.25+-FF4B4B?style=flat-square&logo=streamlit)

- 🔬 Exploratory data analysis
- 📐 Covariance matrix inspection
- 🌀 Regime transition visualizations
- ⚡ Rapid quant prototyping interface

*Runs parallel to the web dashboard on port `8501`*

</td>
</tr>
</table>

---

<div align="center">

### 🔐 Enterprise API & Security

</div>

| Layer | Implementation |
|:---|:---|
| ⚡ **Async Backend** | FastAPI + Uvicorn serving predictions, volatilities, regimes, SHAP, MST graphs |
| 🔑 **Auth** | JWT (HS256) + OAuth2 password bearer + bcrypt hashing via PassLib |
| 🗄️ **Persistence** | SQLite (zero-config dev) → PostgreSQL / TimescaleDB (production) via SQLAlchemy |

---

## 🎨 Visual Artifacts & Model Explainability

<div align="center">

<table>
<tr>
<td align="center" width="50%">

### 📊 Enhanced Feature Importance

![Enhanced Feature Importance](feature_importance_enhanced.png)

</td>
<td align="center" width="50%">

### ⚖️ Feature Gain Distribution

![Feature Gain](feature_importance_gain.png)

</td>
</tr>
<tr>
<td align="center" width="50%">

### 🎯 Raw Feature Importance

![Feature Importance](feature_importance.png)

</td>
<td align="center" width="50%">

### 📐 Feature Weight Distribution

![Feature Weight](feature_importance_weight.png)

</td>
</tr>
</table>

</div>

---

## 🏗️ Architecture Overview

<div align="center">

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

📖 **Deep-dive:** [System Architecture Guide](docs/SYSTEM_ARCHITECTURE.md) — HLD, LLD, sequence diagrams & mathematical formulation

</div>

---

## 🛠️ Technology Stack

<div align="center">

| 🔷 Domain | ⚙️ Technology | 🎯 Purpose |
|:---|:---|:---|
| **Frontend** | `Next.js 16.1.6` (App Router) | SSR + CSR modern web dashboard |
| **UI Library** | `React 19.2.4` | Component-driven architecture |
| **Styling** | `TailwindCSS 4.2.1` | Utility-first + PostCSS pipeline |
| **Icons & Charts** | `Lucide React`, `Recharts 3.7.0` | Financial charts, donuts, metrics |
| **Analytical UI** | `Streamlit 1.25+` | Quant workbench |
| **Backend API** | `FastAPI 0.100+`, `Uvicorn 0.23+` | Async REST API |
| **Optimization** | `CVXPY 1.3.1+` | Markowitz QP solver |
| **ML** | `LightGBM 4.0+`, `Scikit-Learn 1.2+` | Return prediction |
| **Time Series** | `arch 6.0+`, `hmmlearn 0.3+` | GARCH + HMM |
| **XAI** | `SHAP 0.42+` | TreeExplainer attributions |
| **Data & Math** | `Pandas 2.0+`, `NumPy 1.24+`, `ta 0.10+` | DataFrames + technical indicators |
| **Market Data** | `yfinance 0.2.18+` | Yahoo Finance ingestion |
| **DB & ORM** | `SQLAlchemy 2.0+`, SQLite, PostgreSQL | Relational persistence |
| **Auth** | `PassLib (bcrypt)`, `Python-Jose` | Hashing + HS256 JWT |
| **Orchestration** | `Apache Airflow` | Batch workflow DAG |
| **Testing** | `Pytest 7.4+` | Automated unit tests |

</div>

---

## 📁 Repository Structure

```text
portfolio-ml/
│
├── 📂 config/
│   ├── config.yaml                    # Master config (tickers, hyperparams, constraints)
│   └── schema.sql                     # PostgreSQL / TimescaleDB production schema
│
├── 📂 dags/
│   └── portfolio_pipeline.py          # Airflow DAG — scheduled weekday execution
│
├── 📂 data/
│   ├── portfolio.db                   # SQLite (users, profiles, goals)
│   ├── 📂 processed/                  # Quantitative pipeline outputs
│   │   ├── clean_prices.csv
│   │   ├── covariance.csv             # Ledoit-Wolf shrinkage matrix
│   │   ├── latest_explanations.csv    # SHAP attributions
│   │   ├── latest_portfolio.csv       # Optimal allocations
│   │   ├── latest_predictions.csv     # 1-month return forecasts
│   │   ├── latest_regime.csv          # HMM state probabilities
│   │   ├── latest_sentiment.csv       # Sentiment polarity
│   │   └── volatility_forecasts.csv   # GARCH annualized vol
│   └── 📂 raw/                        # Raw market data cache
│
├── 📂 docker/
│   ├── docker-compose.yml             # TimescaleDB + API + Streamlit
│   ├── Dockerfile.api
│   └── Dockerfile.dashboard
│
├── 📂 docs/
│   └── SYSTEM_ARCHITECTURE.md
│
├── 📂 frontend/                       # ⚛️  Next.js 16 Web App
│   ├── package.json
│   └── src/app/
│       ├── dashboard/                 # Main + portfolio + goals + screener
│       ├── login/                     # Auth pages
│       ├── layout.tsx
│       └── page.tsx
│
├── 📂 notebooks/                      # Research & prototyping
│
├── 📂 src/
│   ├── 📂 api/                        # ⚡  FastAPI Application
│   │   ├── auth.py                    # JWT router, bcrypt, profiles
│   │   ├── database.py                # SQLAlchemy engine + ORM
│   │   └── main.py                    # Entry point, CORS, data endpoints
│   │
│   ├── 📂 backtesting/
│   │   ├── backtest.py                # Rebalancing simulator
│   │   └── metrics.py                 # Sharpe · Sortino · MaxDD · Calmar
│   │
│   ├── 📂 dashboard/                  # 📓  Streamlit
│   │   ├── main.py
│   │   └── pages/
│   │
│   ├── 📂 data_pipeline/
│   │   ├── fetch_data.py              # Nifty 50 OHLCV ingestion
│   │   ├── preprocess.py              # Ffill, returns, corp-action alignment
│   │   ├── feature_engineering.py     # Momentum, RSI, MACD, etc.
│   │   └── sentiment.py               # NewsAPI + VADER
│   │
│   ├── 📂 models/
│   │   ├── regime/                    # 3-state Gaussian HMM
│   │   ├── return_predictor/          # LightGBM / RF + SHAP
│   │   └── volatility/                # GARCH + Ledoit-Wolf + MST
│   │
│   └── 📂 optimizer/
│       ├── fusion.py                  # Contextual bandit risk penalty
│       └── portfolio.py               # CVXPY Markowitz solver
│
├── 📂 tests/
│   └── test_pipeline.py               # Pytest — data hygiene + metrics
│
├── 🔧 build_features_and_train.py
├── 🔧 comparative_analysis.py
├── 🖼️ feature_importance_*.png
├──  requirements.txt
├── ⚙️ run_full_pipeline.bat            # 7-stage ML pipeline
└── ⚙️ run_remaining.bat                # Stages 2–7 (skip download)
```

---

## ✅ Prerequisites

<div align="center">

| Requirement | Version | Verified |
|:---|:---|:---:|
| 🐍 **Python** | `3.10+` | ✅ 3.13 |
| 🟩 **Node.js** | `18.18+` or `20+` | ✅ Next.js 16 |
| 📦 **Package Managers** | `pip` + `npm` | ✅ |
| 💻 **OS** | Windows / macOS / Linux | ✅ Cross-platform |
| 🗄️ **Database** *(optional dev)* | PostgreSQL 14+ / TimescaleDB | SQLite default |

</div>

---

## 🚀 Installation and Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yash-shende99/portfolio-ml.git
cd portfolio-ml
```

### 2️⃣ Set Up Python Environment

<table>
<tr>
<td width="50%">

**🪟 Windows (PowerShell)**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

</td>
<td width="50%">

**🐧 Linux / macOS**

```bash
python3 -m venv venv
source venv/bin/activate
```

</td>
</tr>
</table>

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3️⃣ Set Up Frontend Environment

```bash
cd frontend
npm install
cd ..
```

### 4️⃣ Configure Environment Variables

Create `.env` in the repository root — see [Environment Variables](#-environment-variables-and-configuration).

---

## 🔐 Environment Variables and Configuration

### 📄 Environment Variables (`.env`)

| 🔑 Variable | 📝 Description | Required | Default | Example |
|:---|:---|:---:|:---|:---|
| `DATABASE_URL` | SQLAlchemy connection string | Optional (Dev) | `sqlite:///./data/portfolio.db` | `postgresql://user:pass@localhost:5432/portfolio_db` |
| `JWT_SECRET` | JWT signing key | ⚠️ **Prod** | `"super-secret-wealth-key-12345"` | 64+ char hex |
| `NEWSAPI_KEY` | News headlines API | Optional | `None` (neutral 0.0) | `5317afd8e114...` |
| `API_URL` | Base URL for Streamlit / Docker | Optional | `http://localhost:8000` | `http://api:8000` |

> [!WARNING]
> 🚨 **Never deploy with the default `JWT_SECRET`.** Generate a cryptographically strong secret:
>
> ```bash
> openssl rand -hex 32
> ```

### ⚙️ Application Configuration (`config/config.yaml`)

<table>
<tr>
<td width="50%" valign="top">

**📊 Data**

- `data.tickers` — 50 Nifty symbols + `^NSEI`

**🎯 Model**

- `n_estimators: 100`
- `max_depth: 5`
- `learning_rate: 0.05`
- `split_year: 2023`

</td>
<td width="50%" valign="top">

**🌊 Volatility**

- `garch_window: 756` days

**🔮 Regime**

- `n_states: 3`

**📐 Optimizer**

- `max_weight: 0.20`
- `base_risk_aversion: 0.5`

</td>
</tr>
</table>

---

## 🏃 Running the Application

### 🅰️ Complete Development Workflow *(Recommended)*

#### 🔹 Step 1 — Execute the Quantitative Pipeline

<table>
<tr>
<td width="50%">

**🪟 Windows**

```cmd
run_full_pipeline.bat
```

</td>
<td width="50%">

**🐧 Linux / macOS**

```bash
python src/data_pipeline/fetch_data.py
python src/data_pipeline/preprocess.py
python src/data_pipeline/feature_engineering.py
python src/models/return_predictor/predict.py
python src/models/volatility/covariance.py
python src/models/regime/hmm_predict.py
python src/optimizer/portfolio.py
```

</td>
</tr>
</table>

> 💡 *Already have raw data? Run `run_remaining.bat` to skip ingestion.*

#### 🔹 Step 2 — Start the FastAPI Backend

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

| 🌐 Endpoint | 🔗 URL |
|:---|:---|
| API Root | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| OpenAPI Schema | `http://localhost:8000/openapi.json` |

#### 🔹 Step 3 — Start the Next.js Frontend

```bash
cd frontend
npm run dev
```

🌐 **Web App:** `http://localhost:3000` *(redirects to `/dashboard` or `/login`)*

#### 🔹 Step 4 — *(Optional)* Streamlit Dashboard

```bash
streamlit run src/dashboard/main.py --server.port 8501
```

🌐 **Available at:** `http://localhost:8501`

---

## 🎮 How to Use the Application

<div align="center">

### 🛤️ End-to-End User Journey

```mermaid
journey
    title Investor Workflow
    section Authenticate
      Register / Login: 5: User
      JWT Issued: 5: System
    section Assess
      View Regime Banner: 4: User
      Check Risk Penalty: 3: System
    section Explore
      Target Allocations: 5: User
      SHAP Rationale: 5: User
    section Analyze
      Enter Holdings: 4: User
      Health Score: 5: System
      Rebalance Recs: 5: System
    section Plan
      Set Goal: 4: User
      SIP Calculator: 5: User
```

</div>

<table>
<tr>
<td width="50%">

#### 1️⃣ 🔑 Authentication & Profile

Navigate to `/login`, register → empty profile auto-provisioned → JWT stored in session.

#### 2️⃣ 🌡️ Market Regime Assessment

Top banner shows HMM regime: 🐂 Bull · ⚖️ Normal · 🐻 Bear.
If **Bear prob > 0.60**, risk penalty λ increases → defensive tilt.

#### 3️⃣ 🎯 Target Allocations & SHAP

- **Asset Allocation** card — CVXPY optimal weights vs risk slider `[0.0 → 1.0]`
- **Return Predictions** — top Nifty 50 alpha picks
- **XAI Panel** — SHAP attributions explain *why*

</td>
<td width="50%" valign="top">

#### 4️⃣ 🩺 Analyze Existing Portfolio

Go to `/dashboard/portfolio`, enter holdings → outputs:

- **Health Score** (0–100)
- **Beta + Expected Return**
- **Concentration Alerts** (>20% flags)
- **AI Rebalancing Recs** (trim negative-EV positions)

#### 5️⃣ 🎯 SIP Goal Planner

Go to `/dashboard/goals`, define target → annuity math computes required monthly SIP.

</td>
</tr>
</table>

---

## 📡 API Documentation

<div align="center">

📖 **Interactive docs:** `http://localhost:8000/docs`

</div>

### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth | Payload | Response |
|:---:|:---|:---|:---:|:---|:---|
| `POST` | `/auth/register` | Register new user | ❌ | `{"username","password"}` | `{"access_token","token_type"}` |
| `POST` | `/auth/token` | Obtain JWT | ❌ | Form: `username`, `password` | `{"access_token","token_type"}` |
| `GET` | `/auth/profile` | Get profile | ✅ | — | Profile object |
| `POST` | `/auth/profile` | Update profile | ✅ | `ProfileUpdate` | `{"status":"success"}` |

### 📊 Quantitative & Market Data Endpoints

| Method | Endpoint | Description | Auth | Params / Body |
|:---:|:---|:---|:---:|:---|
| `GET` | `/predict` | 1-month return forecasts | ❌ | — |
| `GET` | `/volatility` | GARCH annualized vol | ❌ | — |
| `GET` | `/regime` | HMM regime probabilities | ❌ | — |
| `GET` | `/sentiment` | News sentiment polarity | ❌ | — |
| `GET` | `/explain` | SHAP feature attributions | ❌ | — |
| `GET` | `/graph` | Asset MST graph | ❌ | — |
| `POST` | `/portfolio` | Optimal weights for risk tolerance | ❌ | `{"risk_tolerance": 0.5}` |
| `POST` | `/portfolio_analysis` | Evaluate holdings | ❌ | `{"holdings": {...}}` |
| `GET` | `/funds` | AI-ranked funds & ETFs | ❌ | — |
| `POST` | `/goals` | SIP calculator | ❌ | `{"target_amount","years","expected_return"}` |

---

## 🗄️ Database and Data Management

<div align="center">

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

</div>

<table>
<tr>
<td width="50%" valign="top">

#### 🧪 Development (Default)

- **SQLite** at `data/portfolio.db`
- ✅ Zero setup
- ✅ Tables auto-created on startup
- `Base.metadata.create_all(bind=engine)`

</td>
<td width="50%" valign="top">

#### 🚀 Production

- **PostgreSQL / TimescaleDB**
- Configured via `DATABASE_URL`
- Full schema in [`config/schema.sql`](config/schema.sql)
- Hypertable setup included

</td>
</tr>
</table>

---

## 🧪 Testing and Code Quality

### 🐍 Backend Unit Tests

```bash
python -m pytest tests/
```

<div align="center">

**Verified Output**

```text
============================= test session starts =============================
platform win32 -- Python 3.13.x, pytest-9.x, pluggy-1.x
rootdir: C:\Users\Yash\99\99PRO\portfolio-ml
collected 2 items

tests\test_pipeline.py ..                                                [100%]

============================== 2 passed in 5.75s ==============================
```

</div>

Validates: forward-filling · return calcs · **Sharpe** · **annualized vol** · **max drawdown**

### 🟩 Frontend Linting

```bash
cd frontend
npm run lint
```

---

## 🐳 Deployment & Containerization

<div align="center">

Complete multi-container setup in [`docker/docker-compose.yml`](docker/docker-compose.yml)

</div>

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

### 🚀 Starting Containers

```bash
cd docker
docker-compose up --build
```

> [!NOTE]
> `docker/Dockerfile.dashboard` currently references `src/dashboard/app.py`. When building the Streamlit container, ensure the command targets `src/dashboard/main.py`.

---

## 🔒 Security and Hardening Considerations

<div align="center">

| # | 🛡️ Area | ✅ Action |
|:---:|:---|:---|
| 1 | **JWT Secret** | ⚠️ Defaults to `"super-secret-wealth-key-12345"` — **override in prod** |
| 2 | **Password Storage** | bcrypt salted hash via PassLib — plaintext never logged |
| 3 | **CORS** | Restricted to `localhost:3000` dev — configure env-driven origins for prod |
| 4 | **API Keys** | `NEWSAPI_KEY` loaded from `.env` — never commit to VCS |

</div>

---

## 🔧 Troubleshooting & FAQ

<details>
<summary><b>❌ <code>ModuleNotFoundError: No module named 'src'</code></b></summary>

**Cause:** CWD not in Python module search path.

**Fix:** Run from repo root, or set `PYTHONPATH`:

```powershell
$env:PYTHONPATH="."           # Windows
export PYTHONPATH="."         # Linux / macOS
```

</details>

<details>
<summary><b>❌ <code>HTTPException 404: Predictions not found. Run pipeline first.</code></b></summary>

**Cause:** FastAPI reads precomputed artifacts from `data/processed/latest_*.csv` — missing files → 404.

**Fix:** Run `run_full_pipeline.bat` or `python src/optimizer/portfolio.py` to generate artifacts.

</details>

<details>
<summary><b>❌ Frontend cannot connect to backend</b></summary>

**Cause:** Next.js client fetches from `http://localhost:8000` — if FastAPI is elsewhere, calls fail.

**Fix:** Ensure `uvicorn src.api.main:app --port 8000` is running and accessible.

</details>

<details>
<summary><b>❌ <code>pytest: The term 'pytest' is not recognized</code></b></summary>

**Cause:** Virtualenv inactive or pytest not on PATH.

**Fix:**

```bash
python -m pytest tests/
```

</details>

---

## ⚠️ Known Limitations

<div align="center">

| 🚧 Limitation | 📝 Details |
|:---|:---|
| **Daily / Monthly Granularity** | Operates on daily closes + monthly rebalances — no intraday tick / order flow |
| **Long-Only Markowitz** | $w_i \ge 0$ only — no short-selling, leverage, or derivatives hedging |
| **Static Artifact Caching** | Reads precomputed CSVs — not on-demand CVXPY solves per request |

</div>

---

## 🗺️ Roadmap

<div align="center">

| Status | Feature |
|:---:|:---|
| ⬜ | **Dynamic Live Solver** — on-the-fly CVXPY with user ticker whitelists + sector constraints |
| ⬜ | **Alpaca / Zerodha Integration** — automated paper trading & rebalancing |
| ⬜ | **Multi-Asset Allocation** — G-Secs, SGBs, liquid funds beyond Nifty 50 |
| ⬜ | **Factor Attribution Backtester** — Fama-French 3-factor vs Nifty benchmark |

</div>

---

## 🤝 Contributing

<div align="center">

```text
1️⃣  Fork  →  2️⃣  Branch  →  3️⃣  Commit  →  4️⃣  Verify  →  5️⃣  PR
```

</div>

```bash
# 1. Fork on GitHub

# 2. Create feature branch
git checkout -b feature/dynamic-sector-constraints

# 3. Commit (conventional commits)
git commit -m "feat(optimizer): add maximum sector exposure constraint"

# 4. Run verification
python -m pytest tests/
cd frontend && npm run lint

# 5. Open Pull Request against main
```

---

## 📜 Licence

> No root open-source licence has been explicitly specified for this repository. The `frontend/package.json` declares an `"ISC"` licence for frontend components. All other rights remain reserved by the repository owner unless otherwise noted.

---

## 🙏 Acknowledgements & References

<div align="center">

| Resource | Citation |
|:---|:---|
| 🇮🇳 **NSE India** | Benchmark index & constituent data |
| 🎯 **CVXPY** | Diamond, S., & Boyd, S. (2016). *CVXPY: A Python-embedded modeling language for convex optimization* |
| 🔍 **SHAP** | Lundberg, S. M., & Lee, S.-I. (2017). *A Unified Approach to Interpreting Model Predictions* |
| 🔮 **hmmlearn** | Hidden Markov Models in Python |
| 🌊 **arch** | Autoregressive Conditional Heteroskedasticity (ARCH/GARCH) models in Python |

</div>

---

## 🔗 Project Links & In-Depth Documentation

<div align="center">

| 📚 Document | 🔗 Link |
|:---|:---|
| 🌐 **Repository** | [github.com/yash-shende99/portfolio-ml](https://github.com/yash-shende99/portfolio-ml) |
| 🏗️ **System Architecture Guide** | [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) |

</div>

---

<div align="center">

### ⭐ If this project helped you, consider giving it a star!

```
────────────────────────────────────────────────────────────────
   Built with 🧠 for quantitative finance · Powered by ⚡ FastAPI
────────────────────────────────────────────────────────────────
```

![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red?style=for-the-badge)
![India](https://img.shields.io/badge/Made%20in-India%20%F0%9F%87%AE%F0%9F%87%B3-FF9933?style=for-the-badge)

</div>