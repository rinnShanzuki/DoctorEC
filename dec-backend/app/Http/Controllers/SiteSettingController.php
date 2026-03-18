<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SiteSetting;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Appointment;
use App\Events\SiteSettingsUpdated;
use Carbon\Carbon;

class SiteSettingController extends Controller
{
    public function index()
    {
        try {
            $settings = SiteSetting::all()->pluck('value', 'key');
            return response()->json($settings);
        } catch (\Exception $e) {
            return response()->json([]);
        }
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $clinicHoursUpdated = false;

        if ($request->has('key') && $request->has('value')) {
            $value = $request->value;
            if (is_array($value)) {
                $value = json_encode($value);
            }

            SiteSetting::updateOrCreate(
                ['key' => $request->key],
                [
                    'value' => $value,
                    'type' => $request->type ?? 'text'
                ]
            );

            if ($request->key === 'clinic_hours') {
                $clinicHoursUpdated = true;
            }
        } else {
            foreach ($data as $key => $value) {
                if ($key === 'clinic_hours') {
                    SiteSetting::updateOrCreate(
                        ['key' => $key],
                        ['value' => json_encode($value), 'type' => 'json']
                    );
                    $clinicHoursUpdated = true;
                } elseif (is_string($value) || is_null($value) || is_numeric($value)) {
                    SiteSetting::updateOrCreate(
                        ['key' => $key],
                        ['value' => $value]
                    );
                }
            }
        }

        // Auto-sync doctor schedules when clinic_hours is updated
        if ($clinicHoursUpdated) {
            $this->syncDoctorSchedulesWithClinicHours();
        }

        event(new SiteSettingsUpdated($data));

        return response()->json(['message' => 'Settings saved successfully']);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
            'key' => 'required|string'
        ]);

        if ($request->file('image')) {
            $path = $request->file('image')->store('site-settings', 'public');
            $url = '/storage/' . $path;

            SiteSetting::updateOrCreate(
                ['key' => $request->key],
                [
                    'value' => $url,
                    'type' => 'image'
                ]
            );

            event(new SiteSettingsUpdated(['key' => $request->key, 'url' => $url]));

            return response()->json(['url' => $url]);
        }

        return response()->json(['message' => 'Upload failed'], 400);
    }

    /**
     * Sync all doctor schedules with the latest clinic hours.
     * - Updates existing non-custom future schedules to new hours
     * - Creates missing schedule entries for open days
     * - Removes non-custom entries for now-closed days (if no appointments linked)
     */
    private function syncDoctorSchedulesWithClinicHours()
    {
        $setting = SiteSetting::where('key', 'clinic_hours')->first();
        if (!$setting) return;

        $clinicHours = json_decode($setting->value, true);
        if (!$clinicHours) return;

        $doctors = Doctor::all();
        $dayMap = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $today = Carbon::today();

        foreach ($doctors as $doctor) {
            for ($dayOffset = 0; $dayOffset < 28; $dayOffset++) {
                $date = $today->copy()->addDays($dayOffset);
                $dayName = $dayMap[$date->dayOfWeekIso - 1];
                $dayConfig = $clinicHours[$dayName] ?? null;
                // 'enabled' (from frontend) takes priority over legacy 'open' field
                $isOpen = $dayConfig && (
                    array_key_exists('enabled', $dayConfig) ? !empty($dayConfig['enabled']) : !empty($dayConfig['open'])
                );

                // Find existing schedule for this doctor on this date
                $existing = DoctorSchedule::where('doctor_id', $doctor->doctor_id)
                    ->where('schedule_date', $date->toDateString())
                    ->first();

                if ($isOpen) {
                    $newStart = $dayConfig['start'];
                    $newEnd = $dayConfig['end'];

                    if ($existing) {
                        // Only update if NOT manually customized
                        if (!$existing->is_custom) {
                            $existing->update([
                                'start_time' => $newStart,
                                'end_time' => $newEnd,
                                'status' => 'available',
                            ]);
                        }
                    } else {
                        // Create new schedule entry
                        DoctorSchedule::create([
                            'doctor_id' => $doctor->doctor_id,
                            'schedule_date' => $date->toDateString(),
                            'start_time' => $newStart,
                            'end_time' => $newEnd,
                            'status' => 'available',
                            'is_custom' => false,
                        ]);
                    }
                } else {
                    // Day is now closed — remove non-custom schedules without appointments
                    if ($existing && !$existing->is_custom) {
                        $hasAppointments = Appointment::where('doctor_id', $doctor->doctor_id)
                            ->where('appointment_date', $date->toDateString())
                            ->whereNotIn('status', ['cancelled', 'Cancelled'])
                            ->exists();

                        if (!$hasAppointments) {
                            $existing->delete();
                        }
                    }
                }
            }
        }
    }
}
