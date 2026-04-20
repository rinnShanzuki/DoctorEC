<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Http\Controllers\Controller;
use App\Services\EmailService;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    /**
     * Display a listing of all appointments (admin only)
     */
    public function index()
    {
        try {
            $appointments = Appointment::with(['patient', 'clientAccount', 'service', 'doctor'])
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get();

            // Transform the data for frontend
            $appointments = $appointments->map(function ($appointment) {
                return [
                    'appointment_id' => $appointment->appointment_id,
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->appointment_time,
                    'appointment_type' => $appointment->appointment_type,
                    'status' => $appointment->status ?? 'Pending',
                    'notes' => $appointment->notes,
                    'patient' => $appointment->patient ? [
                        'patient_id' => $appointment->patient->patient_id,
                        'name' => $appointment->patient->name ?? 'N/A'
                    ] : null,
                    'clientAccount' => $appointment->clientAccount ? [
                        'client_id' => $appointment->clientAccount->client_id,
                        'first_name' => $appointment->clientAccount->first_name,
                        'last_name' => $appointment->clientAccount->last_name,
                        'email' => $appointment->clientAccount->email,
                        'phone' => $appointment->clientAccount->phone,
                        'birthday' => $appointment->clientAccount->birthday,
                    ] : null,
                    'service' => $appointment->service ? [
                        'service_id' => $appointment->service->service_id,
                        'name' => $appointment->service->name ?? 'Appointment',
                        'price' => $appointment->service->price ?? 0,
                    ] : null,
                    'doctor' => $appointment->doctor ? [
                        'doctor_id' => $appointment->doctor->doctor_id,
                        'full_name' => $appointment->doctor->full_name ?? 'N/A',
                    ] : null,
                    'created_at' => $appointment->created_at->toISOString(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $appointments
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve appointments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update appointment status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'status' => 'required|in:Pending,Approved,Ongoing,Completed,Cancelled'
            ]);

            $appointment = Appointment::findOrFail($id);
            $appointment->status = $validated['status'];
            $appointment->save();

            // Send email notification to patient
            EmailService::sendAppointmentStatusEmail($appointment);

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment status updated successfully',
                'data' => $appointment
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update appointment status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all appointments for a specific doctor
     */
    public function getDoctorAppointments($doctorId)
    {
        try {
            $appointments = Appointment::where('doctor_id', $doctorId)
                ->whereIn('status', ['approved', 'ongoing', 'completed'])
                ->with(['patient', 'clientAccount', 'service', 'doctor'])
                ->orderBy('appointment_date', 'desc')
                ->orderBy('appointment_time', 'desc')
                ->get();

            // Transform the data for frontend
            $appointments = $appointments->map(function ($appointment) {
                return [
                    'appointment_id' => $appointment->appointment_id,
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->appointment_time,
                    'appointment_type' => $appointment->appointment_type,
                    'status' => $appointment->status ?? 'Pending',
                    'notes' => $appointment->notes,
                    'occupation' => $appointment->occupation,
                    'patient' => $appointment->patient ? [
                        'name' => $appointment->patient->name ?? 'N/A',
                        'email' => $appointment->patient->email ?? null,
                        'phone' => $appointment->patient->phone ?? null,
                        'gender' => $appointment->patient->gender ?? null,
                        'birthdate' => $appointment->patient->birthdate ?? null,
                    ] : null,
                    'clientAccount' => $appointment->clientAccount ? [
                        'first_name' => $appointment->clientAccount->first_name,
                        'last_name' => $appointment->clientAccount->last_name,
                        'email' => $appointment->clientAccount->email ?? null,
                        'phone' => $appointment->clientAccount->phone ?? null,
                        'gender' => $appointment->clientAccount->gender ?? null,
                        'birthdate' => $appointment->clientAccount->birthday ?? null,
                    ] : null,
                    'service' => $appointment->service ? [
                        'name' => $appointment->service->name ?? 'Appointment',
                        'price' => $appointment->service->price ?? 0,
                    ] : null,
                    'doctor' => $appointment->doctor ? [
                        'doctor_id' => $appointment->doctor->doctor_id,
                        'full_name' => $appointment->doctor->full_name ?? 'N/A',
                    ] : null,
                    'created_at' => $appointment->created_at->toISOString(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $appointments
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve appointments: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_type' => 'required|in:in-person,online',
            'service_id' => 'required|exists:services,service_id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'appointment_time' => 'required',
            'doctor_id' => 'nullable|exists:doctors,doctor_id',
            'notes' => 'nullable|string',
            'occupation' => 'nullable|string|max:255',
            'birthday' => 'nullable|date',
        ]);

        // Get the authenticated client
        $client = $request->user();

        // Update client birthday if provided
        if (!empty($validated['birthday']) && $client) {
            $client->birthday = $validated['birthday'];
            $client->save();
        }

        // Get the authenticated client ID from the request
        $clientId = $client ? $client->client_id : null;

        $appointment = Appointment::create([
            'appointment_type' => $validated['appointment_type'],
            'service_id' => $validated['service_id'],
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'doctor_id' => $validated['doctor_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'occupation' => $validated['occupation'] ?? null,
            'client_id' => $clientId,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment created successfully',
            'data' => $appointment
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Appointment $appointment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Appointment $appointment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Appointment $appointment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Appointment $appointment)
    {
        //
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
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to modify this appointment'
                ], 403);
            }

            // Only allow rescheduling of pending or approved appointments
            if (!in_array(strtolower($appointment->status), ['pending', 'confirmed', 'approved'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot reschedule this appointment'
                ], 400);
            }

            $appointment->appointment_date = $validated['appointment_date'];
            $appointment->appointment_time = $validated['appointment_time'];
            $appointment->status = 'pending'; // Reset to pending after reschedule
            $appointment->save();

            // Send email notification to patient
            $appointment->status = 'rescheduled'; // Temporarily pass this status for the email template
            EmailService::sendAppointmentStatusEmail($appointment);
            $appointment->status = 'pending'; // Restoring actual status for JSON response

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment rescheduled successfully',
                'data' => $appointment
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to reschedule appointment: ' . $e->getMessage()
            ], 500);
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
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized to cancel this appointment'
                ], 403);
            }

            // Only allow cancelling of pending or approved appointments
            if (!in_array(strtolower($appointment->status), ['pending', 'confirmed', 'approved'])) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Cannot cancel this appointment'
                ], 400);
            }

            $appointment->status = 'cancelled';
            $appointment->save();

            // Send email notification to patient
            EmailService::sendAppointmentStatusEmail($appointment);

            return response()->json([
                'status' => 'success',
                'message' => 'Appointment cancelled successfully',
                'data' => $appointment
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to cancel appointment: ' . $e->getMessage()
            ], 500);
        }
    }
}
