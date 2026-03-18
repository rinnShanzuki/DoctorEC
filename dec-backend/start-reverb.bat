@echo off
echo ============================================
echo   DocEC Reverb WebSocket Server
echo ============================================
echo.
echo Starting Reverb on port 8080...
echo Clients can connect at ws://localhost:8080
echo.

php artisan reverb:start --host=0.0.0.0 --port=8080

echo.
echo Reverb server stopped.
pause
