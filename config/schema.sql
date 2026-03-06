-- PostgreSQL Schema for Portfolio Management System

-- Enable TimescaleDB extension if available (optional for MVP but good for production)
-- CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS daily_prices (
    date DATE NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    adjusted_close NUMERIC,
    volume BIGINT,
    PRIMARY KEY (date, ticker)
);

CREATE TABLE IF NOT EXISTS monthly_features (
    date DATE NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    target_return NUMERIC,
    mom_1m NUMERIC,
    mom_3m NUMERIC,
    mom_6m NUMERIC,
    mom_12m NUMERIC,
    vol_3m NUMERIC,
    vol_12m NUMERIC,
    volume_ratio NUMERIC,
    rsi NUMERIC,
    macd_diff NUMERIC,
    bb_pband NUMERIC,
    atr NUMERIC,
    cci NUMERIC,
    dist_52w_high NUMERIC,
    -- ranked features appended dynamically or defined here
    mom_1m_rank NUMERIC,
    mom_3m_rank NUMERIC,
    mom_6m_rank NUMERIC,
    mom_12m_rank NUMERIC,
    vol_3m_rank NUMERIC,
    vol_12m_rank NUMERIC,
    volume_ratio_rank NUMERIC,
    rsi_rank NUMERIC,
    macd_diff_rank NUMERIC,
    bb_pband_rank NUMERIC,
    atr_rank NUMERIC,
    cci_rank NUMERIC,
    dist_52w_high_rank NUMERIC,
    PRIMARY KEY (date, ticker)
);

CREATE TABLE IF NOT EXISTS predictions (
    date DATE NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    predicted_return NUMERIC,
    model_version VARCHAR(50),
    PRIMARY KEY (date, ticker, model_version)
);

CREATE TABLE IF NOT EXISTS portfolios (
    date DATE NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    weight NUMERIC,
    PRIMARY KEY (date, ticker)
);

CREATE TABLE IF NOT EXISTS regimes (
    date DATE NOT NULL,
    bear_prob NUMERIC,
    normal_prob NUMERIC,
    bull_prob NUMERIC,
    PRIMARY KEY (date)
);

-- Select commands to create hypertables if using TimescaleDB
-- SELECT create_hypertable('daily_prices', 'date', if_not_exists => TRUE);
-- SELECT create_hypertable('monthly_features', 'date', if_not_exists => TRUE);
