import pandas as pd
import numpy as np
import networkx as nx
import os
import json
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def build_market_graph():
    base_path = Path(__file__).parent.parent.parent.parent
    ret_path = base_path / "data" / "processed" / "clean_prices.csv"
    
    if not ret_path.exists():
        logger.error("Clean prices not found for correlation analysis.")
        return
        
    logger.info("Computing correlation matrix for Graph Neural Network / MST mapping...")
    df = pd.read_csv(ret_path)
    df['date'] = pd.to_datetime(df['date'])
    
    # We want a 1-year trailing correlation window to build the graph
    cutoff = df['date'].max() - pd.DateOffset(years=1)
    df_recent = df[df['date'] >= cutoff].copy()
    df_recent['daily_return'] = df_recent.groupby('ticker')['adjusted_close'].pct_change()
    
    # Pivot returns to format index=date, columns=ticker, values=daily_return
    df_pivot = df_recent.pivot(index='date', columns='ticker', values='daily_return').dropna(axis=1)
    
    corr_matrix = df_pivot.corr()
    tickers = corr_matrix.columns.tolist()
    
    # Distances for Minimum Spanning Tree (MST): distance = sqrt(2 * (1 - correlation))
    # This transforms high correlation to low distance.
    G = nx.Graph()
    
    for i in range(len(tickers)):
        for j in range(i + 1, len(tickers)):
            t1, t2 = tickers[i], tickers[j]
            corr = corr_matrix.loc[t1, t2]
            dist = np.sqrt(2 * (1 - corr))
            G.add_edge(t1, t2, weight=dist, corr=corr)
            
    # Compute the MST
    mst = nx.minimum_spanning_tree(G)
    
    logger.info(f"MST computed with {mst.number_of_nodes()} nodes and {mst.number_of_edges()} edges.")
    
    # Export edges and layout for Plotly
    # Spring layout gives a nice 2D topology
    pos = nx.spring_layout(mst, seed=42)
    
    graph_data = {
        "nodes": [{"id": n, "x": pos[n][0], "y": pos[n][1]} for n in mst.nodes()],
        "edges": [{"source": u, "target": v, "corr": mst[u][v]['corr']} for u, v in mst.edges()]
    }
    
    out_path = base_path / "data" / "processed" / "mst_graph.json"
    with open(out_path, 'w') as f:
        json.dump(graph_data, f, indent=2)
        
    logger.info(f"Saved Graph topology to {out_path}")

if __name__ == "__main__":
    build_market_graph()
