@echo off
title DocEC TensorFlow ML Service
echo ============================================
echo   DocEC Clinic - TensorFlow ML Microservice
echo   Running on http://localhost:5001
echo ============================================
echo.
echo [INFO] Starting Python TensorFlow service...
echo [INFO] First run will train models (1-3 min)
echo [INFO] Subsequent starts load saved models instantly
echo.
cd /d "%~dp0"
if not exist saved_models mkdir saved_models

:: Try Python in PATH first, then fallback to default install location
where python >nul 2>&1
if %errorlevel%==0 (
    python app.py
) else (
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" app.py
)
pause

