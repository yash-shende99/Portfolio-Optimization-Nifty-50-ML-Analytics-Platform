@echo off
echo Running remainder of ML pipeline...

echo [2/7] Preprocessing data...
python src\data_pipeline\preprocess.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo [3/7] Feature engineering...
python src\data_pipeline\feature_engineering.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo [4/7] Predicting returns...
python src\models\return_predictor\predict.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo [5/7] Calculating covariance...
python src\models\volatility\covariance.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo [6/7] Predicting regime...
python src\models\regime\hmm_predict.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo [7/7] Optimizing portfolio...
python src\optimizer\portfolio.py
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo Pipeline finished successfully!
