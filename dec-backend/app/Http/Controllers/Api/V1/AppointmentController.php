<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Traits\ApiResponses;
use App\Events\AppointmentUpdated;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    use ApiResponses;

    /**
     * Get all appointments with relationships
     */
    public function index()
    {
        try {
            $appointments = Appointment::with(['patient', 'clientAccount', 'doctor', 'service', 'prescription'])
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get();

            // Transform for frontend compatibility
            $appointments = $appointments->map(function ($appointment) {
                // Get client name from ClientAccount
                $clientName = 'Unknown';
                $clientEmail = 'N/A';
                
                if ($appointment->clientAccount) {
                    $clientName = trim(($appointment->clientAccount->first_name ?? '') . ' ' . ($appointment->clientAccount->last_name ?? ''));
                    $clientEmail = $appointment->clientAccount->email ?? 'N/A';
                } elseif ($appointment->patient) {
                    $clientName = trim(($appointment->patient->first_name ?? '') . ' ' . ($appointment->patient->last_name ?? ''));
                    $clientEmail = $appointment->patient->email ?? 'N/A';
                }
                
                return [
                    'id' => $appointment->appointment_id,
                    'appointment_id' => $appointment->appointment_id,
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->appointment_time,
                    'appointment_type' => $appointment->appointment_type,
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                    'occupation' => $appointment->occupation,
                    'service_type' => $appointment->service->name ?? 'General Checkup',
                    'user' => [
                        'name' => $clientName,
                        'email' => $clientEmail
                    ],
                    'patient_id' => $appointment->patient_id,
                    'client_id' => $appointment->client_id,
                    'doctor_id' => $appointment->doctor_id,
                    'service_id' => $appointment->service_id,
                    // Include full relationship objects for frontend
                    'patient' => $appointment->patient,
                    'clientAccount' => $appointment->clientAccount,
                    'doctor' => $appointment->doctor,
                    'service' => $appointment->service,
                'prescription' => $appointment->prescription,
                'created_at' => $appointment->created_at,
                'updated_at' => $appointment->updated_at,
                ];
            });

            return $this->success($appointments, 'Appointments retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve appointments: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new appointment
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'patient_id' => 'nullable|exists:patients,patient_id',
                'doctor_id' => 'nullable|exists:doctors,doctor_id',
                'appointment_type' => 'required|in:in-person,online',
                'service_id' => 'nullable|exists:services,service_id',
                'appointment_date' => 'required|date',
                'appointment_time' => 'required',
                'status' => 'nullable|in:pending,approved,ongoing,completed,cancelled',
                'notes' => 'nullable|string',
                'occupation' => 'nullable|string|max:255',
                // Patient detail fields (used to create/update linked Patient record)
                'full_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'birthday' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
            ]);

            // Set default status if not provided
            $validated['status'] = $validated['status'] ?? 'pending';
            
            // Set client_id from authenticated user if available
            $user = $request->user();
            if ($user && isset($user->client_id)) {
                $validated['client_id'] = $user->client_id;

                // Create or update a linked Patient record for the online client
                $nameParts = $this->parseFullName($validated['full_name'] ?? null, $user);
                
                $patient = \App\Models\Patient::where('client_id', $user->client_id)->first();

                if (!$patient) {
                    $maxId = \App\Models\Patient::max('patient_id') ?? 0;
                    $patientCode = 'P' . str_pad($maxId + 1, 6, '0', STR_PAD_LEFT);

                    $patient = clone new \App\Models\Patient();
                    $patient->fill([
                        'client_id' => $user->client_id,
                        'patient_code' => $patientCode,
                        'first_name' => $nameParts['first_name'],
                        'last_name' => $nameParts['last_name'],
                        'email' => $validated['email'] ?? $user->email,
                        'phone' => $validated['phone'] ?? $user->phone,
                        'birthdate' => $validated['birthday'] ?? null,
                        'gender' => $validated['gender'] ?? $user->gender,
                    ]);
                    $patient->save();
                } else {
                    $patient->update([
                        'first_name' => $nameParts['first_name'],
                        'last_name' => $nameParts['last_name'],
                        'email' => $validated['email'] ?? $user->email,
                        'phone' => $validated['phone'] ?? $user->phone,
                        'birthdate' => $validated['birthday'] ?? null,
                        'gender' => $validated['gender'] ?? $user->gender,
                    ]);
                }

                $validated['patient_id'] = $patient->patient_id;
            }

            // Remove extra fields not in the appointments table
            $appointmentData = collect($validated)->only([
                'patient_id', 'client_id', 'doctor_id', 'appointment_type',
                'service_id', 'appointment_date', 'appointment_time',
                'status', 'notes', 'occupation',
            ])->toArray();

            $appointment = Appointment::create($appointmentData);
            $appointment->load(['patient', 'clientAccount', 'doctor', 'service']);

        event(new AppointmentUpdated('created', $appointment->toArray()));

        return $this->created($appointment, 'Appointment created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create appointment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Parse a full name string into first and last name parts.
     * Falls back to the authenticated user's stored names.
     */
    private function parseFullName(?string $fullName, $user): array
    {
        if ($fullName) {
            $parts = explode(' ', trim($fullName), 2);
            return [
                'first_name' => $parts[0],
                'last_name' => $parts[1] ?? '',
            ];
        }

        return [
            'first_name' => $user->first_name ?? 'Unknown',
            'last_name' => $user->last_name ?? '',
        ];
    }

    /**
     * Update an appointment
     */
    public function update(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            $validated = $request->validate([
                'patient_id' => 'nullable|exists:patients,patient_id',
                'client_id' => 'nullable|exists:client_accounts,client_id',
                'doctor_id' => 'nullable|exists:doctors,doctor_id',
                'appointment_type' => 'sometimes|in:in-person,online',
                'service_id' => 'nullable|exists:services,service_id',
                'appointment_date' => 'sometimes|date',
                'appointment_time' => 'sometimes',
                'status' => 'sometimes|in:pending,approved,ongoing,completed,cancelled',
                'notes' => 'nullable|string',
            ]);

            $appointment->update($validated);
            $appointment->load(['patient', 'clientAccount', 'doctor', 'service']);

        event(new AppointmentUpdated('updated', $appointment->toArray()));

        return $this->success($appointment, 'Appointment updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update appointment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get appointments for authenticated client
     */
    public function getClientAppointments(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return $this->error('Unauthenticated', 401);
            }

            // Fetch appointments for this client
            $appointments = Appointment::with(['doctor', 'service'])
                ->where('client_id', $user->client_id)
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get();

            // Transform for frontend
            $appointments = $appointments->map(function ($appointment) {
                return [
                    'id' => $appointment->appointment_id,
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->appointment_time,
                    'service' => $appointment->service->name ?? 'General Checkup',
                    'doctor' => $appointment->doctor 
                        ? ($appointment->doctor->full_name ?? 'Dr. ' . ($appointment->doctor->first_name ?? 'Unknown'))
                        : 'Not Assigned',
                    'status' => $appointment->status,
                    'notes' => $appointment->notes,
                    'appointment_type' => $appointment->appointment_type ?? 'in-person',
                ];
            });

            return $this->success($appointments, 'Client appointments retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve appointments: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete an appointment
     */
    public function destroy($id)
    {
        try {
            $appointment = Appointment::findOrFail($id);
            $appointment->delete();

            return $this->success(null, 'Appointment deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete appointment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Reschedule an appointment (client)
     */
    public function rescheduleAppointment(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'appointment_date' => 'required|date|after_or_equal:today',
                'appointment_time' => 'required'
            ]);

            $appointment = Appointment::findOrFail($id);

            // Verify the appointment belongs to the authenticated client
            $user = $request->user();
            if ($appointment->client_id !== $user->client_id) {
                return $this->error('Unauthorized to modify this appointment', 403);
            }

            // Only allow rescheduling of pending or approved appointments
            if (!in_array(strtolower($appointment->status), ['pending', 'confirmed', 'approved'])) {
                return $this->error('Cannot reschedule this appointment', 400);
            }

            $appointment->appointment_date = $validated['appointment_date'];
            $appointment->appointment_time = $validated['appointment_time'];
            $appointment->status = 'pending'; // Reset to pending after reschedule
        $appointment->save();

        event(new AppointmentUpdated('rescheduled', $appointment->toArray()));

        return $this->success($appointment, 'Appointment rescheduled successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->error('Failed to reschedule appointment: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Cancel an appointment (client)
     */
    public function cancelAppointment(Request $request, $id)
    {
        try {
            $appointment = Appointment::findOrFail($id);

            // Verify the appointment belongs to the authenticated client
            $user = $request->user();
            if ($appointment->client_id !== $user->client_id) {
                return $this->error('Unauthorized to cancel this appointment', 403);
            }

            // Only allow cancelling of pending or approved appointments
            if (!in_array(strtolower($appointment->status), ['pending', 'confirmed', 'approved'])) {
                return $this->error('Cannot cancel this appointment', 400);
            }

            $appointment->status = 'cancelled';
        $appointment->save();

        event(new AppointmentUpdated('cancelled', $appointment->toArray()));

        return $this->success($appointment, 'Appointment cancelled successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to cancel appointment: ' . $e->getMessage(), 500);
        }
    }
}
