@echo off
echo ============================================
echo   DocEC Queue Worker
echo ============================================
echo.
echo Starting queue worker with:
echo   - Max 3 retries per job
echo   - 60 second timeout
echo   - 3 second sleep between polls
echo.

php artisan queue:work --tries=3 --timeout=60 --sleep=3 --max-jobs=1000 --max-time=3600

echo.
echo Queue worker stopped.
pause
