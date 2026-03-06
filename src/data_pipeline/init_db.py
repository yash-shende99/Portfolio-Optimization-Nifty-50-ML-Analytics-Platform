import os
import yaml
from sqlalchemy import create_engine, MetaData
from sqlalchemy import Table, Column, String, Float, Date, BigInteger, Integer
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def load_config(config_path="config/config.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

metadata = MetaData()

# Define one sample table using SQLAlchemy ORM / Core
daily_prices = Table(
    'daily_prices', metadata,
    Column('date', Date, primary_key=True),
    Column('ticker', String(20), primary_key=True),
    Column('open', Float),
    Column('high', Float),
    Column('low', Float),
    Column('close', Float),
    Column('adjusted_close', Float),
    Column('volume', BigInteger),
)

monthly_features = Table(
    'monthly_features', metadata,
    Column('date', Date, primary_key=True),
    Column('ticker', String(20), primary_key=True),
    Column('target_return', Float),
    Column('mom_1m', Float),
    Column('mom_3m', Float),
    Column('mom_6m', Float),
    Column('mom_12m', Float),
    Column('vol_3m', Float),
    Column('vol_12m', Float),
    Column('volume_ratio', Float),
    Column('rsi', Float),
    Column('macd_diff', Float),
    Column('bb_pband', Float),
    Column('atr', Float),
    Column('cci', Float),
    Column('dist_52w_high', Float),
    Column('mom_1m_rank', Float),
    Column('mom_3m_rank', Float),
    Column('mom_6m_rank', Float),
    Column('mom_12m_rank', Float),
    Column('vol_3m_rank', Float),
    Column('vol_12m_rank', Float),
    Column('volume_ratio_rank', Float),
    Column('rsi_rank', Float),
    Column('macd_diff_rank', Float),
    Column('bb_pband_rank', Float),
    Column('atr_rank', Float),
    Column('cci_rank', Float),
    Column('dist_52w_high_rank', Float)
)

predictions = Table(
    'predictions', metadata,
    Column('date', Date, primary_key=True),
    Column('ticker', String(20), primary_key=True),
    Column('predicted_return', Float),
    Column('model_version', String(50), primary_key=True)
)

portfolios = Table(
    'portfolios', metadata,
    Column('date', Date, primary_key=True),
    Column('ticker', String(20), primary_key=True),
    Column('weight', Float)
)

regimes = Table(
    'regimes', metadata,
    Column('date', Date, primary_key=True),
    Column('bear_prob', Float),
    Column('normal_prob', Float),
    Column('bull_prob', Float)
)

def init_db():
    config = load_config()
    db_url = config.get("database", {}).get("url", "sqlite:///data/portfolio.db")
    engine = create_engine(db_url)
    
    # Create all tables in the engine
    metadata.create_all(engine)
    logger.info(f"Database initialized at {db_url}")
    return engine

if __name__ == "__main__":
    os.chdir(Path(__file__).parent.parent.parent)
    init_db()
