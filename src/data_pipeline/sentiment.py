import pandas as pd
import yaml
import logging
import os
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def fetch_and_analyze_sentiment():
    config = load_config()
    tickers = [t for t in config["data"]["tickers"] if not t.startswith("^")]
    
    try:
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parent.parent.parent / ".env")
    except ImportError:
        pass
        
    api_key = os.environ.get("NEWSAPI_KEY")
    if not api_key:
        logger.error("NEWSAPI_KEY environment variable not set. Please set it to use NewsAPI. (e.g. set NEWSAPI_KEY=your_key)")
        return
        
    analyzer = SentimentIntensityAnalyzer()
    sentiment_data = []
    
    logger.info(f"Fetching recent news using NewsAPI and analyzing sentiment for {len(tickers)} stocks...")
    
    for ticker in tickers:
        try:
            # Clean up ticker for better search results
            search_term = ticker.replace(".NS", "")
            
            url = f"https://newsapi.org/v2/everything?q={search_term}&language=en&sortBy=publishedAt&pageSize=10&apiKey={api_key}"
            response = requests.get(url)
            
            if response.status_code != 200:
                logger.warning(f"Failed to fetch news for {ticker}: {response.text}")
                continue
                
            data = response.json()
            articles = data.get("articles", [])
            
            if not articles:
                logger.warning(f"No news found for {ticker}")
                continue
                
            scores = []
            for article in articles:
                title = article.get("title") or ""
                description = article.get("description") or ""
                text_to_analyze = f"{title}. {description}"
                
                vs = analyzer.polarity_scores(text_to_analyze)
                scores.append(vs["compound"])
                
            avg_score = sum(scores) / len(scores) if scores else 0.0
            sentiment_data.append({
                "ticker": ticker,
                "sentiment_score": avg_score,
                "news_count": len(scores)
            })
            
        except Exception as e:
            logger.error(f"Error fetching sentiment for {ticker}: {e}")
            
    df_sentiment = pd.DataFrame(sentiment_data)
    
    if not df_sentiment.empty:
        out_path = "data/processed/latest_sentiment.csv"
        df_sentiment.to_csv(out_path, index=False)
        logger.info(f"Saved sentiment scores to {out_path}")
    else:
        logger.warning("No sentiment data generated.")

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    fetch_and_analyze_sentiment()
