<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Backups
|--------------------------------------------------------------------------
| Daily full backup at 2:00 AM (database + files)
| Weekly database-only backup on Sundays at 3:00 AM
|
| To activate, set up a cron job or Windows Task Scheduler:
|   * * * * * php /path/to/artisan schedule:run >> /dev/null 2>&1
|
| Or on Windows, run: php artisan schedule:work
|--------------------------------------------------------------------------
*/
Schedule::command('backup:run')->daily()->at('02:00')
    ->appendOutputTo(storage_path('logs/backup.log'))
    ->withoutOverlapping();

Schedule::command('backup:run --db-only')->weekly()->sundays()->at('03:00')
    ->appendOutputTo(storage_path('logs/backup.log'))
    ->withoutOverlapping();
