@echo off
echo ============================================
echo   DocEC Production Optimization
echo ============================================
echo.

echo [1/5] Caching configuration...
php artisan config:cache
echo.

echo [2/5] Caching routes...
php artisan route:cache
echo.

echo [3/5] Caching views...
php artisan view:cache
echo.

echo [4/5] Running general optimization...
php artisan optimize
echo.

echo [5/5] Clearing old cache data...
php artisan cache:clear
echo.

echo ============================================
echo   Optimization Complete!
echo   The application is now production-ready.
echo ============================================
pause
