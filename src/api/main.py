from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import json
import os
import sys
from pathlib import Path

def get_base_dir():
    # Assuming run from src/api or root
    return Path(__file__).parent.parent.parent

sys.path.append(str(get_base_dir()))
from src.optimizer.portfolio import optimize_portfolio

from src.api.auth import router as auth_router

app = FastAPI(title="Portfolio ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# Data structures
class PredictResponse(BaseModel):
    date: str
    ticker: str
    predicted_return: float
    model_version: str

class PortfolioRequest(BaseModel):
    risk_tolerance: float = 0.5  # maps to risk aversion lambda

class PortfolioResponse(BaseModel):
    date: str
    allocations: dict

@app.get("/predict", response_model=list[PredictResponse])
def get_predictions():
    """Returns the latest next-month return predictions for all tickers."""
    pred_path = get_base_dir() / "data" / "processed" / "latest_predictions.csv"
    if not pred_path.exists():
        raise HTTPException(status_code=404, detail="Predictions not found. Run pipeline first.")
        
    df = pd.read_csv(pred_path)
    return df.to_dict(orient="records")

@app.get("/volatility")
def get_volatility():
    """Returns the latest forecasted volatilities."""
    vol_path = get_base_dir() / "data" / "processed" / "volatility_forecasts.csv"
    if not vol_path.exists():
        raise HTTPException(status_code=404, detail="Volatility forecasts not found.")
        
    df = pd.read_csv(vol_path)
    return df.to_dict(orient="records")

@app.get("/regime")
def get_regime():
    """Returns current regime probabilities."""
    regime_path = get_base_dir() / "data" / "processed" / "latest_regime.csv"
    if not regime_path.exists():
        raise HTTPException(status_code=404, detail="Regime prediction not found.")
        
    df = pd.read_csv(regime_path)
    return df.to_dict(orient="records")[0]

@app.get("/sentiment")
def get_sentiment():
    """Returns the latest news sentiment scores for tickers."""
    sent_path = get_base_dir() / "data" / "processed" / "latest_sentiment.csv"
    if not sent_path.exists():
        raise HTTPException(status_code=404, detail="Sentiment data not found.")
    df = pd.read_csv(sent_path)
    return df.to_dict(orient="records")

@app.get("/explain")
def get_explanations():
    """Returns the SHAP XAI justifications."""
    exp_path = get_base_dir() / "data" / "processed" / "latest_explanations.csv"
    if not exp_path.exists():
        raise HTTPException(status_code=404, detail="Explanations not found.")
    df = pd.read_csv(exp_path)
    return df.to_dict(orient="records")

@app.get("/graph")
def get_graph():
    """Returns the NetworkX Minimum Spanning Tree graph dictionary."""
    graph_path = get_base_dir() / "data" / "processed" / "mst_graph.json"
    if not graph_path.exists():
        raise HTTPException(status_code=404, detail="Graph not found.")
    with open(graph_path, 'r') as f:
        return json.load(f)

@app.post("/portfolio", response_model=PortfolioResponse)
def get_portfolio(req: PortfolioRequest):
    """
    Returns optimal weights matching user risk_tolerance from the pre-computed static file.
    """
    try:
        port_path = get_base_dir() / "data" / "processed" / "latest_portfolio.csv"
        if not port_path.exists():
            raise HTTPException(status_code=404, detail="Portfolio not found.")
            
        df = pd.read_csv(port_path)
        if df.empty:
            return PortfolioResponse(date="unknown", allocations={})
            
        rt_req = round(req.risk_tolerance, 1)
        
        # Give exact or closest risk tolerance
        if 'risk_tolerance' in df.columns:
            available_rts = df['risk_tolerance'].unique()
            closest_rt = min(available_rts, key=lambda x: abs(x - rt_req))
            df_filtered = df[df['risk_tolerance'] == closest_rt]
        else:
            df_filtered = df # Fallback for old file version
            
        if df_filtered.empty:
            df_filtered = df
            
        latest_date = str(df_filtered['date'].iloc[0])
        allocs = pd.Series(df_filtered.weight.values, index=df_filtered.ticker).to_dict()
        
        return PortfolioResponse(date=latest_date, allocations=allocs)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GoalRequest(BaseModel):
    target_amount: float
    years: int
    expected_return: float = 0.12 # 12% default

class PortfolioAnalysisRequest(BaseModel):
    holdings: dict = {}

@app.post("/portfolio_analysis")
def analyze_portfolio(req: PortfolioAnalysisRequest):
    """Analyzes a user's uploaded portfolio holdings for risk metrics."""
    holdings = req.holdings
    if not holdings:
        return {
            "current_beta": 0.0,
            "current_sharpe": 0.0,
            "concentration_risk": "None",
            "recommendations": ["Upload a portfolio to receive AI insights."]
        }
        
    try:
        # Load predictions
        pred_path = get_base_dir() / "data" / "processed" / "latest_predictions.csv"
        df_preds = pd.read_csv(pred_path) if pred_path.exists() else pd.DataFrame()
        
        recs = []
        high_risk_flag = "Low"
        total_value = 0.0
        portfolio_expected_return = 0.0
        weights = {}
        
        # Calculate total value and weights
        for t, data in holdings.items():
            qty = data.get("quantity", 0)
            bp = data.get("buy_price", 0)
            val = qty * bp
            total_value += val
            weights[t] = val
            
        if total_value > 0:
            for t in weights:
                weights[t] /= total_value
                
        # Check concentration
        for t, w in weights.items():
            if w > 0.3:
                high_risk_flag = f"High ({t} is {(w*100):.1f}% of portfolio)"
                recs.append(f"Concentration Alert: Reduce {t} exposure. AI models recommend max 20% per asset.")
                
        # Check AI conviction
        if not df_preds.empty:
            for t, w in weights.items():
                match = df_preds[df_preds['ticker'] == t]
                if not match.empty:
                    pred_ret = match['predicted_return'].values[0]
                    portfolio_expected_return += w * pred_ret
                    if pred_ret < 0:
                        recs.append(f"AI Warning: {t} has a negative predicted return ({pred_ret*100:.2f}%). Consider selling.")
                    elif pred_ret < 0.005 and w > 0.1:
                        recs.append(f"Trimming Opportunity: {t} has weak momentum. Trim position and reallocate.")
                        
        if len(recs) == 0:
            recs.append("Your portfolio aligns well with current AI market regime predictions.")
            
        # Add a general AI recommendation based on current regime
        regime_path = get_base_dir() / "data" / "processed" / "latest_regime.csv"
        if regime_path.exists():
            df_reg = pd.read_csv(regime_path)
            bull_prob = df_reg['bull_prob'].iloc[0] if 'bull_prob' in df_reg.columns else 0.5
            if bull_prob < 0.4:
                recs.append("Macro Alert: High Bear regime probability detected. Rotate into Defensive sectors.")
                high_risk_flag = "Elevated (Macro)"

        # Calculate Health Score
        health_score = 100
        if "High" in high_risk_flag: health_score -= 20
        if portfolio_expected_return < 0: health_score -= 25
        if bull_prob < 0.4: health_score -= 10
        for rec in recs:
            if "AI Warning" in rec: health_score -= 10
            elif "Concentration" in rec: health_score -= 5
        
        health_score = max(0, min(100, health_score))

        return {
            "total_value": total_value,
            "expected_return": round(portfolio_expected_return * 100, 2),
            "health_score": health_score,
            "current_beta": round(1.0 + (bull_prob * 0.1) if 'bull_prob' in locals() else 1.1, 2),
            "current_sharpe": 1.2, # Hardcoded for now, can be updated via Covariance matrix
            "concentration_risk": high_risk_flag,
            "recommendations": recs
        }
    except Exception as e:
        return {
            "total_value": 0, "expected_return": 0, "health_score": 0,
            "current_beta": 1.0, "current_sharpe": 1.0, "concentration_risk": "Unknown",
            "recommendations": [f"Error processing analysis: {str(e)}"]
        }

@app.get("/funds")
def get_funds():
    """Returns AI-ranked Mutual Funds and ETFs."""
    # In a real system, this would fetch from a DB or ML job predicting Top Funds
    # Here we mock the AI ranking response for the V3 Demo.
    return [
        {"id": 1, "name": "Nifty 50 Index Fund", "category": "Equity - Large Cap", "sharpe": 1.8, "alpha": 1.2, "volatility": 14.5, "score": 92},
        {"id": 2, "name": "Midcap Momentum ETF", "category": "Equity - Mid Cap", "sharpe": 2.1, "alpha": 3.4, "volatility": 18.2, "score": 88},
        {"id": 3, "name": "Liquid Fund", "category": "Debt", "sharpe": 0.9, "alpha": 0.1, "volatility": 1.2, "score": 75},
        {"id": 4, "name": "Flexi Cap Fund", "category": "Equity - Flexi", "sharpe": 1.6, "alpha": 2.1, "volatility": 15.1, "score": 84},
        {"id": 5, "name": "Gold ETF", "category": "Commodity", "sharpe": 1.2, "alpha": -0.5, "volatility": 8.5, "score": 70},
    ]

@app.post("/goals")
def plan_goal(req: GoalRequest):
    """Calculates the required monthly SIP to achieve a target amount."""
    # SIP Formula: M = P * (r / (((1 + r)^n) - 1)) * (1 / (1 + r))
    # Where r is monthly rate, n is total months
    r = req.expected_return / 12
    n = req.years * 12
    
    if r == 0:
        sip = req.target_amount / n
    else:
        sip = (req.target_amount * r) / (((1 + r)**n) - 1)
        sip = sip / (1 + r)
    
    return {
        "target_amount": req.target_amount,
        "years": req.years,
        "expected_return": req.expected_return,
        "required_sip": round(sip, 2),
        "total_investment": round(sip * n, 2),
        "estimated_wealth_gain": round(req.target_amount - (sip * n), 2)
    }

if __name__ == "__main__":
    import uvicorn
    # run with `python src/api/main.py`
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
