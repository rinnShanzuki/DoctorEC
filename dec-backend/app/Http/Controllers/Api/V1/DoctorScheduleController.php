<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DoctorSchedule;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DoctorScheduleController extends Controller
{
    use ApiResponses;

    /**
     * List all schedules (optionally filtered by doctor_id)
     */
    public function index(Request $request)
    {
        try {
            $query = DoctorSchedule::with('doctor');

            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }

            $schedules = $query->orderBy('schedule_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            return $this->success($schedules, 'Schedules retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve schedules: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get schedules for a specific doctor
     */
    public function doctorSchedules($doctorId)
    {
        try {
            Doctor::findOrFail($doctorId);

            $schedules = DoctorSchedule::where('doctor_id', $doctorId)
                ->where('schedule_date', '>=', Carbon::today())
                ->where('status', 'available')
                ->orderBy('schedule_date', 'asc')
                ->orderBy('start_time', 'asc')
                ->get();

            return $this->success($schedules, 'Doctor schedules retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve doctor schedules: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get available time slots for a doctor on a specific date.
     * Generates 30-minute sessions with 15-minute breaks between each session,
     * within the doctor's working hours. Already-booked slots are excluded.
     */
    public function getAvailableSlots(Request $request, $doctorId)
    {
        try {
            $request->validate([
                'date' => 'required|date',
            ]);

            $date = $request->query('date');
            Doctor::findOrFail($doctorId);

            // Find the doctor's schedule(s) for this date
            $schedules = DoctorSchedule::where('doctor_id', $doctorId)
                ->where('schedule_date', $date)
                ->where('status', 'available')
                ->get();

            if ($schedules->isEmpty()) {
                return $this->success([
                    'doctor_id' => (int) $doctorId,
                    'date' => $date,
                    'slots' => [],
                    'fully_booked' => false,
                    'message' => 'No schedule set for this date.'
                ], 'No schedule available');
            }

            // Get already-booked appointments for this doctor on this date
            $bookedTimes = Appointment::where('doctor_id', $doctorId)
                ->where('appointment_date', $date)
                ->whereNotIn('status', ['cancelled'])
                ->pluck('appointment_time')
                ->map(function ($time) {
                    // Normalize to HH:MM format
                    return Carbon::parse($time)->format('H:i');
                })
                ->toArray();

            // Generate 30-min sessions with 15-min breaks (45-min between slot starts)
            $allSlots = [];
            foreach ($schedules as $schedule) {
                $start = Carbon::parse($schedule->start_time);
                $end = Carbon::parse($schedule->end_time);

                while ($start->copy()->addMinutes(30) <= $end) {
                    $slotStart = $start->format('H:i');
                    $slotEnd = $start->copy()->addMinutes(30)->format('H:i');
                    $allSlots[] = [
                        'time' => $slotStart,
                        'display' => Carbon::parse($slotStart)->format('g:i A') . ' - ' . Carbon::parse($slotEnd)->format('g:i A'),
                        'available' => !in_array($slotStart, $bookedTimes),
                    ];
                    // Move forward by 45 minutes (30-min session + 15-min break)
                    $start->addMinutes(45);
                }
            }

            // Filter to only available slots
            $availableSlots = array_values(array_filter($allSlots, fn($s) => $s['available']));

            return $this->success([
                'doctor_id' => (int) $doctorId,
                'date' => $date,
                'slots' => $availableSlots,
                'total_slots' => count($allSlots),
                'available_count' => count($availableSlots),
                'booked_count' => count($allSlots) - count($availableSlots),
                'fully_booked' => count($availableSlots) === 0 && count($allSlots) > 0,
            ], 'Available slots retrieved successfully');

        } catch (\Exception $e) {
            return $this->error('Failed to retrieve available slots: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new schedule
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'doctor_id' => 'required|exists:doctors,doctor_id',
                'schedule_date' => 'required|date',
                'start_time' => 'required|date_format:H:i',
                'end_time' => 'required|date_format:H:i|after:start_time',
                'status' => 'nullable|in:available,booked,cancelled',
            ]);

            $validated['status'] = $validated['status'] ?? 'available';

            // Check for overlapping schedules
            $overlap = DoctorSchedule::where('doctor_id', $validated['doctor_id'])
                ->where('schedule_date', $validated['schedule_date'])
                ->where('status', '!=', 'cancelled')
                ->where(function ($query) use ($validated) {
                    $query->where(function ($q) use ($validated) {
                        $q->where('start_time', '<', $validated['end_time'])
                          ->where('end_time', '>', $validated['start_time']);
                    });
                })
                ->exists();

            if ($overlap) {
                return $this->error('This schedule overlaps with an existing schedule for this doctor.', 422);
            }

            $schedule = DoctorSchedule::create($validated);
            $schedule->load('doctor');

            return $this->created($schedule, 'Schedule created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create schedule: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a schedule
     */
    public function update(Request $request, $id)
    {
        try {
            $schedule = DoctorSchedule::findOrFail($id);

            $validated = $request->validate([
                'schedule_date' => 'sometimes|date',
                'start_time' => 'sometimes|date_format:H:i',
                'end_time' => 'sometimes|date_format:H:i',
                'status' => 'sometimes|in:available,booked,cancelled',
            ]);

            $schedule->update($validated);
            $schedule->load('doctor');

            return $this->success($schedule, 'Schedule updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update schedule: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a schedule
     */
    public function destroy($id)
    {
        try {
            $schedule = DoctorSchedule::findOrFail($id);
            $schedule->delete();

            return $this->success(null, 'Schedule deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete schedule: ' . $e->getMessage(), 500);
        }
    }
}
