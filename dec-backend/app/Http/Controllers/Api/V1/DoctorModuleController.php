<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\Prescription;
use App\Models\PatientRecord;
use App\Models\Doctor;
use App\Models\SiteSetting;
use App\Services\EmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class DoctorModuleController extends Controller
{
    /**
     * Get all appointments for the logged-in doctor
     */
    public function getMyAppointments(Request $request)
    {
        $doctor = $request->user();
        
        $appointments = Appointment::with(['patient', 'clientAccount', 'service', 'prescription'])
            ->where('doctor_id', $doctor->doctor_id)
            ->orderBy('appointment_date', 'desc')
            ->orderBy('appointment_time', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $appointments
        ]);
    }

    /**
     * Accept an appointment (even if already admin-approved)
     */
    public function acceptAppointment(Request $request, $id)
    {
        $doctor = $request->user();
        $appointment = Appointment::where('appointment_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $appointment->status = 'Approved';
        $appointment->save();

        EmailService::sendAppointmentStatusEmail($appointment);

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment accepted',
            'data' => $appointment->load(['patient', 'clientAccount', 'service'])
        ]);
    }

    /**
     * Cancel an appointment
     */
    public function cancelAppointment(Request $request, $id)
    {
        $doctor = $request->user();
        $appointment = Appointment::where('appointment_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $appointment->status = 'Cancelled';
        $appointment->save();

        EmailService::sendAppointmentStatusEmail($appointment);

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment cancelled',
            'data' => $appointment
        ]);
    }

    /**
     * Start a session (mark as In Session)
     */
    public function startSession(Request $request, $id)
    {
        $doctor = $request->user();
        $appointment = Appointment::where('appointment_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $appointment->status = 'ongoing';
        $appointment->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Session started',
            'data' => $appointment->load(['patient', 'clientAccount', 'service'])
        ]);
    }

    /**
     * Complete a session — save prescription, update patient record, mark as Completed
     */
    public function completeSession(Request $request, $id)
    {
        $doctor = $request->user();
        $appointment = Appointment::with(['patient', 'clientAccount', 'service'])
            ->where('appointment_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'medical_concern' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'notes' => 'nullable|string',
            'recommendation' => 'nullable|string',
            'product_required' => 'boolean',

            // Rx (Refraction Results) — sph (blank column), add, va
            'rx_od_sph' => 'nullable|string', 'rx_od_add' => 'nullable|string', 'rx_od_va' => 'nullable|string',
            'rx_os_sph' => 'nullable|string', 'rx_os_add' => 'nullable|string', 'rx_os_va' => 'nullable|string',

            // Prescription (Final Rx) — sph (blank column), add, va
            'px_od_sph' => 'nullable|string', 'px_od_add' => 'nullable|string', 'px_od_va' => 'nullable|string',
            'px_os_sph' => 'nullable|string', 'px_os_add' => 'nullable|string', 'px_os_va' => 'nullable|string',

            // Lens Details
            'pd' => 'nullable|string',
            'is_spectacle' => 'boolean',
            'is_contact_lens' => 'boolean',
            'frame' => 'nullable|string',
            'brand' => 'nullable|string',
            'lens' => 'nullable|string',
            'tint' => 'nullable|string',

            // Other
            'remarks' => 'nullable|string',
            'released_by' => 'nullable|string',
            'released_date' => 'nullable|date',
            'claimed_by' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Determine the patient_id (from walk-in patient or client)
        $patientId = $appointment->patient_id;
        $clientId = $appointment->client_id;

        // Get birthday and calculate age from patient record
        $birthday = null;
        $age = null;
        if ($patientId) {
            $patient = \App\Models\Patient::find($patientId);
            if ($patient && $patient->birthdate) {
                $birthday = $patient->birthdate;
                $age = \Carbon\Carbon::parse($birthday)->age;
            }
        }

        // Save or update prescription
            $prescription = Prescription::create([
                'appointment_id' => $appointment->appointment_id,
                'patient_id' => $appointment->patient_id,
                'client_id' => $appointment->client_id,
                'doctor_id' => $appointment->doctor_id,
                'birthday' => $appointment->patient ? $appointment->patient->birthdate : null,
                'age' => $appointment->patient && $appointment->patient->birthdate 
                    ? \Carbon\Carbon::parse($appointment->patient->birthdate)->age : null,
                
                'recommendation' => $request->recommendation ?: null,
                'medical_concern' => $request->medical_concern ?: null,
                'notes' => $request->notes ?: null,
                'product_required' => $request->product_required ?? false,

                // Rx (sph = blank column, add, va)
                'rx_od_sph' => $request->rx_od_sph ?: null, 'rx_od_add' => $request->rx_od_add ?: null, 'rx_od_va' => $request->rx_od_va ?: null,
                'rx_os_sph' => $request->rx_os_sph ?: null, 'rx_os_add' => $request->rx_os_add ?: null, 'rx_os_va' => $request->rx_os_va ?: null,

                // Prescription (sph = blank column, add, va)
                'px_od_sph' => $request->px_od_sph ?: null, 'px_od_add' => $request->px_od_add ?: null, 'px_od_va' => $request->px_od_va ?: null,
                'px_os_sph' => $request->px_os_sph ?: null, 'px_os_add' => $request->px_os_add ?: null, 'px_os_va' => $request->px_os_va ?: null,

                // Lens details
                'pd' => $request->pd ?: null,
                'is_spectacle' => $request->is_spectacle ?? false,
                'is_contact_lens' => $request->is_contact_lens ?? false,
                'frame' => $request->frame ?: null,
                'brand' => $request->brand ?: null,
                'lens' => $request->lens ?: null,
                'tint' => $request->tint ?: null,

                // Other
                'remarks' => $request->remarks ?: null,
                'released_by' => $request->released_by ?: null,
                'released_date' => $request->released_date ?: null,
                'claimed_by' => $request->claimed_by ?: null,
            ]
        );

        // Update patient medical history if patient_id exists
        if ($patientId && $request->medical_history) {
            PatientRecord::updateOrCreate(
                ['patient_id' => $patientId],
                ['medical_history' => $request->medical_history, 'admin_id' => null]
            );
        }

        // Mark appointment as Completed
        $appointment->status = 'completed';
        $appointment->save();

        EmailService::sendAppointmentStatusEmail($appointment);

        // Create POS Notification
        $customerName = '';
        if ($appointment->patient) {
            $customerName = $appointment->patient->first_name . ' ' . $appointment->patient->last_name;
        } elseif ($appointment->clientAccount) {
            $customerName = $appointment->clientAccount->first_name . ' ' . $appointment->clientAccount->last_name;
        }

        $serviceName = $appointment->service ? $appointment->service->name : 'Consultation';

        \App\Models\PosNotification::create([
            'appointment_id' => $appointment->appointment_id,
            'message' => "Payment pending for $customerName ($serviceName)",
            'is_read' => 0
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Session completed successfully',
            'data' => [
                'appointment' => $appointment->load(['patient', 'clientAccount', 'service', 'prescription']),
                'prescription' => $prescription,
            ]
        ]);
    }

    /**
     * Get doctor's own schedules
     */
    public function getMySchedules(Request $request)
    {
        $doctor = $request->user();
        $schedules = DoctorSchedule::where('doctor_id', $doctor->doctor_id)
            ->orderBy('schedule_date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    /**
     * Create a new schedule slot
     */
    public function createSchedule(Request $request)
    {
        $doctor = $request->user();

        $validator = Validator::make($request->all(), [
            'schedule_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'status' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule = DoctorSchedule::create([
            'doctor_id' => $doctor->doctor_id,
            'schedule_date' => $request->schedule_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => $request->status ?? 'available',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule created',
            'data' => $schedule
        ], 201);
    }

    /**
     * Update a schedule slot
     */
    public function updateSchedule(Request $request, $id)
    {
        $doctor = $request->user();
        $schedule = DoctorSchedule::where('docsched_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $schedule->update(array_merge(
            $request->only(['schedule_date', 'start_time', 'end_time', 'status']),
            ['is_custom' => true]
        ));

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule updated',
            'data' => $schedule
        ]);
    }

    /**
     * Delete a schedule slot
     */
    public function deleteSchedule(Request $request, $id)
    {
        $doctor = $request->user();
        $schedule = DoctorSchedule::where('docsched_id', $id)
            ->where('doctor_id', $doctor->doctor_id)
            ->firstOrFail();

        $schedule->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule deleted'
        ]);
    }

    /**
     * Update doctor duty status (On Duty / On Leave)
     */
    public function updateDutyStatus(Request $request)
    {
        $doctor = $request->user();

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:on-duty,on-leave',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $doctor->status = $request->status;
        $doctor->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Status updated to ' . $request->status,
            'data' => ['status' => $doctor->status]
        ]);
    }

    /**
     * Get upcoming reminders (appointments within 24h and 15min)
     */
    public function getReminders(Request $request)
    {
        $doctor = $request->user();
        $now = Carbon::now();

        $upcoming = Appointment::with(['patient', 'clientAccount', 'service'])
            ->where('doctor_id', $doctor->doctor_id)
            ->where('status', 'Approved')
            ->where('appointment_date', '>=', $now->toDateString())
            ->orderBy('appointment_date', 'asc')
            ->orderBy('appointment_time', 'asc')
            ->get()
            ->map(function ($apt) use ($now) {
                $aptDateTime = Carbon::parse($apt->appointment_date . ' ' . $apt->appointment_time);
                $minutesUntil = $now->diffInMinutes($aptDateTime, false);
                
                $apt->minutes_until = $minutesUntil;
                $apt->reminder_type = null;
                
                if ($minutesUntil <= 15 && $minutesUntil > 0) {
                    $apt->reminder_type = '15min';
                } elseif ($minutesUntil <= 1440 && $minutesUntil > 15) {
                    $apt->reminder_type = '24h';
                }
                
                return $apt;
            })
            ->filter(fn($apt) => $apt->minutes_until > -60); // Include up to 1 hour past

        return response()->json([
            'status' => 'success',
            'data' => $upcoming->values()
        ]);
    }

    /**
     * Get completed appointments with prescription details (for admin to proceed to payment)
     */
    public function getCompletedAppointments()
    {
        $appointments = Appointment::with(['patient', 'clientAccount', 'service', 'prescription', 'doctor'])
            ->where('status', 'Completed')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $appointments
        ]);
    }

    /**
     * Get clinic default working hours from site_settings
     */
    public function getClinicHours()
    {
        $setting = SiteSetting::where('key', 'clinic_hours')->first();

        if (!$setting) {
            return response()->json([
                'status' => 'success',
                'data' => null,
                'message' => 'No clinic hours configured'
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => json_decode($setting->value, true)
        ]);
    }

    /**
     * Apply clinic default schedule for a given week.
     * Creates doctor_schedules entries from clinic defaults for Mon-Sun of the specified week.
     * Skips closed days and days that already have schedule entries.
     */
    public function applyWeekSchedule(Request $request)
    {
        $doctor = $request->user();

        $validator = Validator::make($request->all(), [
            'week_start' => 'required|date', // Should be a Monday date
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $setting = SiteSetting::where('key', 'clinic_hours')->first();
        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Clinic hours not configured'
            ], 400);
        }

        $clinicHours = json_decode($setting->value, true);
        $weekStart = Carbon::parse($request->week_start)->startOfWeek(Carbon::MONDAY);

        $dayMap = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $created = 0;
        $updated = 0;
        $skipped = 0;

        for ($i = 0; $i < 7; $i++) {
            $date = $weekStart->copy()->addDays($i);
            $dayName = $dayMap[$i];
            $dayConfig = $clinicHours[$dayName] ?? null;

            $isOpen = $dayConfig && (
                array_key_exists('enabled', $dayConfig) ? !empty($dayConfig['enabled']) : !empty($dayConfig['open'])
            );

            $existing = DoctorSchedule::where('doctor_id', $doctor->doctor_id)
                ->where('schedule_date', $date->toDateString())
                ->first();

            if (!$isOpen) {
                // Day is closed — remove non-custom schedule if no appointments
                if ($existing && !$existing->is_custom) {
                    $hasAppointments = \App\Models\Appointment::where('doctor_id', $doctor->doctor_id)
                        ->where('appointment_date', $date->toDateString())
                        ->whereNotIn('status', ['cancelled', 'Cancelled'])
                        ->exists();
                    if (!$hasAppointments) {
                        $existing->delete();
                    }
                }
                $skipped++;
                continue;
            }

            if ($existing) {
                // Update existing non-custom entry to match clinic hours
                if (!$existing->is_custom) {
                    $existing->update([
                        'start_time' => $dayConfig['start'],
                        'end_time' => $dayConfig['end'],
                        'status' => 'available',
                    ]);
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                // Create new entry
                DoctorSchedule::create([
                    'doctor_id' => $doctor->doctor_id,
                    'schedule_date' => $date->toDateString(),
                    'start_time' => $dayConfig['start'],
                    'end_time' => $dayConfig['end'],
                    'status' => 'available',
                    'is_custom' => false,
                ]);
                $created++;
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "Applied weekly schedule: {$created} created, {$updated} updated, {$skipped} skipped",
            'data' => [
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'week_start' => $weekStart->toDateString(),
            ]
        ]);
    }

    /**
     * Toggle a specific timeslot on/off for a schedule entry.
     * Stores disabled slot start times as JSON array in disabled_slots column.
     */
    public function toggleSlot(Request $request, $scheduleId)
    {
        $doctor = $request->user();

        $validator = Validator::make($request->all(), [
            'slot_time' => 'required|string', // e.g. "09:00"
            'enabled' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $schedule = DoctorSchedule::where('docsched_id', $scheduleId)
            ->where('doctor_id', $doctor->doctor_id)
            ->first();

        if (!$schedule) {
            return response()->json([
                'status' => 'error',
                'message' => 'Schedule not found'
            ], 404);
        }

        $disabledSlots = $schedule->disabled_slots ?? [];
        $slotTime = $request->slot_time;

        if ($request->enabled) {
            // Remove from disabled list
            $disabledSlots = array_values(array_filter($disabledSlots, fn($s) => $s !== $slotTime));
        } else {
            // Add to disabled list
            if (!in_array($slotTime, $disabledSlots)) {
                $disabledSlots[] = $slotTime;
            }
        }

        $schedule->disabled_slots = $disabledSlots;
        $schedule->save();

        return response()->json([
            'status' => 'success',
            'message' => $request->enabled ? 'Slot enabled' : 'Slot disabled',
            'data' => $schedule
        ]);
    }
}
