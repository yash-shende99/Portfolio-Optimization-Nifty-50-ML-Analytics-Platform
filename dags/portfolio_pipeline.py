from airflow import DAG
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'quant',
    'depends_on_past': False,
    'start_date': datetime(2023, 1, 1),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'portfolio_pipeline',
    default_args=default_args,
    description='Daily ML Portfolio Generation DAG',
    schedule_interval='0 18 * * 1-5', # Run weekdays at 6 PM
    catchup=False
) as dag:

    # 1. Data Pipeline
    fetch_data = BashOperator(
        task_id='fetch_data',
        bash_command='python /app/src/data_pipeline/fetch_data.py'
    )
    
    preprocess = BashOperator(
        task_id='preprocess',
        bash_command='python /app/src/data_pipeline/preprocess.py'
    )
    
    features = BashOperator(
        task_id='feature_engineering',
        bash_command='python /app/src/data_pipeline/feature_engineering.py'
    )
    
    # 2. Daily Fast-Path Inferences (Assuming models already trained)
    predict_returns = BashOperator(
        task_id='predict_returns',
        bash_command='python /app/src/models/return_predictor/predict.py'
    )
    
    forecast_volatility = BashOperator(
        task_id='forecast_volatility',
        bash_command='python /app/src/models/volatility/garch.py && python /app/src/models/volatility/covariance.py'
    )
    
    predict_regime = BashOperator(
        task_id='predict_regime',
        bash_command='python /app/src/models/regime/hmm_predict.py'
    )
    
    # 3. Portfolio Generation
    fusion = BashOperator(
        task_id='fuse_predictions',
        bash_command='python /app/src/optimizer/fusion.py'
    )
    
    optimize = BashOperator(
        task_id='optimize_portfolio',
        bash_command='python /app/src/optimizer/portfolio.py'
    )

    fetch_data >> preprocess >> features
    features >> [predict_returns, forecast_volatility, predict_regime]
    [predict_returns, forecast_volatility, predict_regime] >> fusion
    fusion >> optimize
