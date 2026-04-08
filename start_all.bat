@echo off
setlocal

rem Resolve project root from this script location
set "ROOT=%~dp0"
set "ML_DIR=%ROOT%ml_service"
set "BACKEND_DIR=%ROOT%dec-backend"
set "FRONTEND_DIR=%ROOT%frontend_docor-master"

echo.
echo ========================================
echo Starting DocEC Services
echo ========================================
echo.

rem Check if directories exist
if not exist "%ML_DIR%\app.py" (
    echo [WARNING] ML service folder not found or invalid: "%ML_DIR%"
)

if not exist "%BACKEND_DIR%\artisan" (
    echo [ERROR] Backend folder is not valid: "%BACKEND_DIR%"
    pause
    exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
    echo [ERROR] Frontend folder is not valid: "%FRONTEND_DIR%"
    pause
    exit /b 1
)

echo Starting Python ML Service in a new terminal...
start "ML Service - DocEC" cmd /k "cd /d ""%ML_DIR%"" && call start.bat"

echo Starting Backend in a new terminal...
start "Backend - Laravel" cmd /k "cd /d ""%BACKEND_DIR%"" && php artisan serve --host=192.168.1.75 --port=8000"

echo Starting Frontend in a new terminal...
start "Frontend - Vite Dev" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run preview -- --host"

echo.
echo ========================================
echo All services started in separate terminals
echo ML Service:  http://localhost:5001
echo Backend:     http://localhost:8000
echo Frontend:    http://localhost:5173
echo ========================================
echo.

endlocal