<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Appointment;
use Carbon\Carbon;
use App\Events\AppointmentUpdated;
use App\Services\EmailService;

class AutoCancelPastPendingAppointments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:auto-cancel-past-pending';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically cancel pending appointments that have passed their scheduled date and time.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $currentTime = $now->toTimeString();

        // Find pending appointments where the date is in the past
        // OR the date is today but the time has already passed
        $appointments = Appointment::whereIn('status', ['pending', 'Pending'])
            ->where(function ($query) use ($today, $currentTime) {
                $query->where('appointment_date', '<', $today)
                      ->orWhere(function ($q) use ($today, $currentTime) {
                          $q->where('appointment_date', '=', $today)
                            ->where('appointment_time', '<', $currentTime);
                      });
            })
            ->get();

        $count = 0;

        foreach ($appointments as $appointment) {
            $appointment->status = 'Cancelled';
            $appointment->save();

            // Optionally notify patient via email
            try {
                EmailService::sendAppointmentStatusEmail($appointment);
            } catch (\Exception $emailErr) {
                \Log::warning('Failed to send auto-cancellation email: ' . $emailErr->getMessage());
            }

            event(new AppointmentUpdated('cancelled', $appointment->toArray()));
            
            $this->info("Cancelled past pending appointment ID: {$appointment->appointment_id}");
            $count++;
        }

        $this->info("Total past pending appointments auto-cancelled: {$count}");
    }
}
