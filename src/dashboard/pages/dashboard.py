import streamlit as st
import pandas as pd
import numpy as np
import requests
import plotly.express as px
import plotly.graph_objects as go
from pathlib import Path
import json
import yfinance as yf

API_URL = "http://localhost:8000"

@st.cache_data(ttl=60)
def fetch_endpoint(endpoint):
    try:
        res = requests.get(f"{API_URL}/{endpoint}", timeout=2)
        if res.status_code == 200:
            return res.json()
    except:
        pass
    
    base_dir = Path(__file__).parent.parent.parent.parent
    path_map = {
        "regime": "latest_regime.csv",
        "sentiment": "latest_sentiment.csv",
        "explain": "latest_explanations.csv"
    }
    
    if endpoint == "graph":
        gpath = base_dir / "data" / "processed" / "mst_graph.json"
        if gpath.exists():
            with open(gpath, 'r') as f:
                return json.load(f)
        return None
        
    if endpoint in path_map:
        fpath = base_dir / "data" / "processed" / path_map[endpoint]
        if fpath.exists():
            df = pd.read_csv(fpath)
            res = df.to_dict(orient="records")
            if endpoint == "regime":
                return res[0] if res else None
            return res
    return None

@st.cache_data(ttl=60)
def fetch_portfolio(risk_tolerance=0.5):
    try:
        res = requests.post(f"{API_URL}/portfolio", json={"risk_tolerance": risk_tolerance}, timeout=2)
        if res.status_code == 200:
            return res.json()
    except:
        pass
    
    base_dir = Path(__file__).parent.parent.parent.parent
    port_path = base_dir / "data" / "processed" / "latest_portfolio.csv"
    if port_path.exists():
        df = pd.read_csv(port_path)
        rt_req = round(risk_tolerance, 1)
        if 'risk_tolerance' in df.columns:
            available_rts = df['risk_tolerance'].unique()
            closest_rt = min(available_rts, key=lambda x: abs(x - rt_req))
            df = df[df['risk_tolerance'] == closest_rt]
            
        allocs = pd.Series(df.weight.values, index=df.ticker).to_dict()
        latest_date = str(df['date'].iloc[0]) if not df.empty else "N/A"
        return {"date": latest_date, "allocations": allocs}
    return None

@st.cache_data(ttl=120)
def fetch_live_pnl(allocations):
    try:
        if not allocations: return None, None
        top_tickers = sorted(allocations, key=allocations.get, reverse=True)[:15]
        data = yf.download(top_tickers, period="2d", progress=False)['Close']
        if data.empty or len(data) < 2: return 0.0, {}
            
        latest = data.iloc[-1]
        prev = data.iloc[-2]
        returns = (latest - prev) / prev
        
        port_return = 0
        weight_sum = 0
        movers = {}
        for t in top_tickers:
            if t in returns and pd.notna(returns[t]):
                port_return += returns[t] * allocations[t]
                weight_sum += allocations[t]
                movers[t] = returns[t]
                
        if weight_sum > 0:
            port_return = port_return / weight_sum
            
        return port_return, movers
    except:
        return 0.0, {}

def show():
    # Fetch User Profile
    token = st.session_state.get("token")
    headers = {"Authorization": f"Bearer {token}"}
    prof_res = requests.get(f"{API_URL}/auth/profile", headers=headers)
    
    risk_tol = 0.5
    if prof_res.status_code == 200:
        profile = prof_res.json()
        risk_tol = profile.get("risk_tolerance", 0.5)
        st.sidebar.markdown("---")
        st.sidebar.success(f"Logged in as: **{st.session_state.get('username', 'User')}**")
        st.sidebar.caption(f"Risk Personality: Λ = {risk_tol}")
    
    # --- PLOTLY TEMPLATE ---
    plotly_bg = "rgba(0,0,0,0)"
    plotly_font = dict(family="Inter", size=12, color="#94a3b8")
    template = go.layout.Template()
    template.layout.plot_bgcolor = plotly_bg
    template.layout.paper_bgcolor = plotly_bg
    template.layout.font = plotly_font
    template.layout.xaxis.showgrid = False
    template.layout.yaxis.showgrid = True
    template.layout.yaxis.gridcolor = "rgba(255,255,255,0.05)"
    template.layout.margin = dict(l=10, r=10, t=40, b=10)

    # --- DATA FETCHING ---
    port_data = fetch_portfolio(risk_tol)
    regime_data = fetch_endpoint("regime")
    sentiment_data = fetch_endpoint("sentiment")
    xai_data = fetch_endpoint("explain")
    graph_data = fetch_endpoint("graph")
    
    allocations = port_data['allocations'] if port_data else {}
    live_pnl, live_movers = fetch_live_pnl(allocations)
    
    # --- TOP ROW: KPI METRICS ---
    st.markdown("### Executive Summary")
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    
    with kpi1:
        if live_pnl is not None:
            pnl_color = "normal" if live_pnl > 0 else "inverse"
            st.metric("Est. Intraday PnL", f"{live_pnl:.2%}", f"{live_pnl:.2%}", delta_color=pnl_color)
        else:
            st.metric("Est. Intraday PnL", "--", "--")
            
    with kpi2:
        if regime_data:
            dominant_regime = max([("Bear", regime_data.get('bear_prob',0)), 
                                   ("Normal", regime_data.get('normal_prob',0)), 
                                   ("Bull", regime_data.get('bull_prob',0))], key=lambda x: x[1])
            st.metric("Market Regime", dominant_regime[0], f"{dominant_regime[1]:.1%} Probability", delta_color="off")
        else:
            st.metric("Market Regime", "--", "--")
            
    with kpi3:
        if sentiment_data:
            avg_sent = np.mean([x['sentiment_score'] for x in sentiment_data])
            sent_label = "Bullish" if avg_sent > 0.05 else "Bearish" if avg_sent < -0.05 else "Neutral"
            st.metric("Aggregated News Sentiment", sent_label, f"{avg_sent:.2f} Score")
        else:
            st.metric("Aggregated News Sentiment", "--", "--")
            
    with kpi4:
        active_positions = sum(1 for w in allocations.values() if w > 0.001) if allocations else 0
        st.metric("Active Assets", f"{active_positions} / 50", f"Max 25% Concentration", delta_color="off")
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # --- MAIN BODY: SPLIT VIEW ---
    col_left, col_right = st.columns([1.5, 1])
    
    with col_left:
        st.markdown("#### 1. Optimal Allocation Matrix")
        df_alloc = pd.DataFrame()
        if allocations:
            df_alloc = pd.DataFrame(list(allocations.items()), columns=['Ticker', 'Weight']).sort_values(by='Weight', ascending=False)
            df_alloc_viz = df_alloc[df_alloc['Weight'] >= 0.001]
            
            fig_tree = px.treemap(df_alloc_viz, path=[px.Constant("Portfolio"), 'Ticker'], values='Weight',
                                  color='Weight', color_continuous_scale='Mint',
                                  custom_data=['Weight'])
            fig_tree.update_traces(hovertemplate='<b>%{label}</b><br>Allocation: %{customdata[0]:.2%}<extra></extra>',
                                   textinfo="label+percent entry")
            fig_tree.update_layout(template=template, margin=dict(t=20, l=0, r=0, b=0), height=400)
            st.plotly_chart(fig_tree, use_container_width=True)
        else:
            st.warning("Awaiting Portfolio Generation...")
            
        st.markdown("#### 2. Monte Carlo Stress Tester (12-Mo Projection)")
        simulations = st.slider("Simulated Brownian Paths", 100, 1000, 250, 50, label_visibility="collapsed")
        
        mu = 0.12 ; sigma = 0.18
        if risk_tol < 0.4: mu += 0.05; sigma += 0.05
        elif risk_tol > 0.6: sigma -= 0.05; mu -= 0.02
            
        days = 252; dt = 1/days
        paths = np.zeros((days, simulations)); paths[0] = 1.0
        for t in range(1, days):
            rand = np.random.standard_normal(simulations)
            paths[t] = paths[t-1] * np.exp((mu - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * rand)
            
        fig_mc = go.Figure()
        for i in range(min(simulations, 100)):
            fig_mc.add_trace(go.Scatter(y=paths[:, i], mode='lines', line=dict(width=0.5, color='rgba(56, 189, 248, 0.05)')))
        
        mean_path = np.mean(paths, axis=1)
        fig_mc.add_trace(go.Scatter(y=mean_path, mode='lines', name='Expected Average', 
                                    line=dict(width=3, color='#10b981'), fill='tozeroy', fillcolor='rgba(16, 185, 129, 0.1)'))
        
        pct_5 = np.percentile(paths, 5, axis=1)
        pct_95 = np.percentile(paths, 95, axis=1)
        fig_mc.add_trace(go.Scatter(y=pct_95, mode='lines', line=dict(width=1, color='rgba(255,255,255,0.2)', dash='dash'), name='95th Percentile'))
        fig_mc.add_trace(go.Scatter(y=pct_5, mode='lines', line=dict(width=1, color='rgba(255,0,0,0.3)', dash='dash'), name='5th Percentile'))
    
        fig_mc.update_layout(template=template, showlegend=True, hovermode="x unified", legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01), height=400)
        st.plotly_chart(fig_mc, use_container_width=True)
        
    with col_right:
        st.markdown("#### Quantitative Intelligence")
        
        tab_xai, tab_graph = st.tabs(["Explainable AI", "Network Topology"])
        
        with tab_xai:
            if df_alloc.empty or not xai_data:
                st.info("No active models or positions to explain.")
            else:
                df_xai = pd.DataFrame(xai_data)
                df_sent = pd.DataFrame(sentiment_data) if sentiment_data else pd.DataFrame(columns=['ticker', 'sentiment_score'])
                
                df_join = df_alloc.head(6).merge(df_xai, left_on='Ticker', right_on='ticker', how='left')
                if not df_sent.empty: df_join = df_join.merge(df_sent, left_on='Ticker', right_on='ticker', how='left')
                else: df_join['sentiment_score'] = 0.0
                    
                for _, row in df_join.iterrows():
                    with st.expander(f"{row['Ticker']} ({row['Weight']:.1%})"):
                        st.markdown(f"**Random Forest SHAP:**\n`{row['justification']}`")
                        sent_val = row['sentiment_score']
                        color = "#10b981" if sent_val > 0.05 else "#ef4444" if sent_val < -0.05 else "#94a3b8"
                        st.markdown(f"**NewsAPI Vector:** <span style='color:{color};font-weight:bold'>{sent_val:.3f}</span>", unsafe_allow_html=True)
                        
        with tab_graph:
            st.caption("Minimum Spanning Tree (MST) clustering identifies disconnected defensive sectors algorithmically.")
            if graph_data:
                edge_x, edge_y = [], []
                for edge in graph_data['edges']:
                    n1 = next(n for n in graph_data['nodes'] if n['id'] == edge['source'])
                    n2 = next(n for n in graph_data['nodes'] if n['id'] == edge['target'])
                    edge_x.extend([n1['x'], n2['x'], None]); edge_y.extend([n1['y'], n2['y'], None])
                    
                edge_trace = go.Scatter(x=edge_x, y=edge_y, line=dict(width=1, color='rgba(255,255,255,0.1)'), hoverinfo='none', mode='lines')
                
                node_x, node_y, texts = [], [], []
                for n in graph_data['nodes']:
                    node_x.append(n['x']); node_y.append(n['y']); texts.append(n['id'].replace('.NS',''))
                    
                node_trace = go.Scatter(x=node_x, y=node_y, mode='markers+text',
                                        text=texts, textfont=dict(size=9, color="#94a3b8"), textposition="top center",
                                        hoverinfo='text', marker=dict(size=8, color='#38bdf8', line_width=1, line_color='#0b0e14'))
                                        
                fig_net = go.Figure(data=[edge_trace, node_trace], layout=go.Layout(template=template, showlegend=False, margin=dict(l=0,r=0,t=0,b=0), height=400))
                fig_net.update_xaxes(showline=False, showticklabels=False); fig_net.update_yaxes(showline=False, showticklabels=False)
                st.plotly_chart(fig_net, use_container_width=True)
                
        st.markdown("#### Real-Time Intraday Movers")
        if live_movers:
            df_movers = pd.DataFrame(list(live_movers.items()), columns=['Ticker', 'Change'])
            df_movers = df_movers.sort_values(by='Change', ascending=False)
            
            def color_returns(val):
                color = 'green' if val > 0 else 'red'
                return f'color: {color}'
            
            st.dataframe(df_movers.style.applymap(color_returns, subset=['Change']).format({'Change': '{:+.2%}'}), height=200, use_container_width=True)
        else:
            st.info("Market Closed / No Intraday Data.")
