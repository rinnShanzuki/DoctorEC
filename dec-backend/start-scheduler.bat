@echo off
echo ============================================
echo   DocEC Backup Scheduler
echo ============================================
echo.
echo This will run the Laravel scheduler continuously.
echo Backups are scheduled daily at 2:00 AM.
echo.
echo Press Ctrl+C to stop.
echo.

php artisan schedule:work

echo.
echo Scheduler stopped.
pause
