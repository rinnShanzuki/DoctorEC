<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use App\Services\EmailService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class SendAppointmentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-appointment-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 24-hour and 1-hour email reminders for approved appointments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();

        // Get all approved appointments happening from now up to 25 hours
        // This is a broad filter, we'll narrow it down in code.
        $appointments = Appointment::with(['patient', 'clientAccount', 'service', 'doctor'])
            ->whereIn('status', ['Approved', 'approved'])
            ->where('appointment_date', '>=', $now->toDateString())
            ->where('appointment_date', '<=', $now->copy()->addDays(2)->toDateString())
            ->get();

        $sentCount = 0;

        foreach ($appointments as $apt) {
            $aptDateTimeStr = $apt->appointment_date . ' ' . $apt->appointment_time;
            try {
                $aptDateTime = Carbon::parse($aptDateTimeStr);
            } catch (\Exception $e) {
                continue; // invalid date/time format
            }

            $minutesUntil = $now->diffInMinutes($aptDateTime, false);

            if ($minutesUntil > 0) {
                // Check for 24h reminder (between 23h 45m and 24h 15m to be safe if it runs every 15 mins)
                // Actually, just check if it's within 24 hours, and hasn't been sent.
                if ($minutesUntil <= 1440 && $minutesUntil > 60) {
                    $cacheKey = "reminded_24h_{$apt->appointment_id}";
                    if (!Cache::has($cacheKey)) {
                        EmailService::sendAppointmentReminderEmail($apt, '24h');
                        Cache::put($cacheKey, true, now()->addDays(2)); // Store for 2 days
                        $this->info("Sent 24h reminder for Appointment ID: {$apt->appointment_id}");
                        $sentCount++;
                    }
                }

                // Check for 1h reminder (within 60 mins)
                if ($minutesUntil <= 60 && $minutesUntil > 0) {
                    $cacheKey = "reminded_1h_{$apt->appointment_id}";
                    if (!Cache::has($cacheKey)) {
                        EmailService::sendAppointmentReminderEmail($apt, '1h');
                        Cache::put($cacheKey, true, now()->addDays(1)); // Store for 1 day
                        $this->info("Sent 1h reminder for Appointment ID: {$apt->appointment_id}");
                        $sentCount++;
                    }
                }
            }
        }

        $this->info("Appointment reminders sent: {$sentCount}");
    }
}
