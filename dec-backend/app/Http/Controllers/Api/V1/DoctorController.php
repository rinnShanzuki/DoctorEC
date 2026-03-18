<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DoctorController extends Controller
{
    use ApiResponses;

    /**
     * Get all doctors
     */
    public function index()
    {
        try {
            $doctors = Doctor::orderBy('created_at', 'desc')->get();

            // Transform for frontend
            $doctors = $doctors->map(function ($doctor) {
                return [
                    'id' => $doctor->doctor_id,
                    'doctor_id' => $doctor->doctor_id,
                    'full_name' => $doctor->full_name,
                    'specialization' => $doctor->specialization,
                    'position' => $doctor->position,
                    'status' => $doctor->status,
                    'email' => $doctor->email,
                    'birthday' => $doctor->birthday,
                    'age' => $doctor->age,
                    'bio' => $doctor->bio,
                    'image' => $doctor->image ? url('storage/' . $doctor->image) : null,
                    'has_password' => !empty($doctor->password),
                    'created_at' => $doctor->created_at,
                    'updated_at' => $doctor->updated_at,
                ];
            });

            return $this->success($doctors, 'Doctors retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve doctors: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new doctor
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'specialization' => 'required|string|max:255',
                'position' => 'nullable|string|max:255',
                'status' => 'nullable|in:on-duty,on-leave,inactive',
                'email' => 'nullable|email|max:255',
                'birthday' => 'nullable|date',
                'bio' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'password' => 'nullable|string|min:6',
            ]);

            // Set default status
            $validated['status'] = $validated['status'] ?? 'on-duty';

            // Hash password if provided
            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imagePath = $image->store('doctors', 'public');
                $validated['image'] = $imagePath;
            }

            $doctor = Doctor::create($validated);

            return $this->created([
                'id' => $doctor->doctor_id,
                'doctor_id' => $doctor->doctor_id,
                'full_name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
                'position' => $doctor->position,
                'status' => $doctor->status,
                'email' => $doctor->email,
                'birthday' => $doctor->birthday,
                'age' => $doctor->age,
                'bio' => $doctor->bio,
                'image' => $doctor->image ? url('storage/' . $doctor->image) : null,
            ], 'Doctor created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create doctor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a doctor
     */
    public function update(Request $request, $id)
    {
        try {
            $doctor = Doctor::findOrFail($id);

            $validated = $request->validate([
                'full_name' => 'sometimes|string|max:255',
                'specialization' => 'sometimes|string|max:255',
                'position' => 'nullable|string|max:255',
                'status' => 'sometimes|in:on-duty,on-leave,inactive',
                'email' => 'nullable|email|max:255',
                'birthday' => 'nullable|date',
                'bio' => 'nullable|string',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);

            // Handle image upload
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($doctor->image) {
                    Storage::disk('public')->delete($doctor->image);
                }

                $image = $request->file('image');
                $imagePath = $image->store('doctors', 'public');
                $validated['image'] = $imagePath;
            }

            $doctor->update($validated);

            return $this->success([
                'id' => $doctor->doctor_id,
                'doctor_id' => $doctor->doctor_id,
                'full_name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
                'position' => $doctor->position,
                'status' => $doctor->status,
                'email' => $doctor->email,
                'birthday' => $doctor->birthday,
                'age' => $doctor->age,
                'bio' => $doctor->bio,
                'image' => $doctor->image ? url('storage/' . $doctor->image) : null,
            ], 'Doctor updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update doctor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a doctor
     */
    public function destroy($id)
    {
        try {
            $doctor = Doctor::findOrFail($id);

            // Delete image if exists
            if ($doctor->image) {
                Storage::disk('public')->delete($doctor->image);
            }

            $doctor->delete();

            return $this->success(null, 'Doctor deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete doctor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get appointments for a specific doctor
     */
    public function getAppointments($id)
    {
        try {
            // Check if doctor exists
            Doctor::findOrFail($id);
            
            // Get confirmed appointments for this doctor
            $appointments = \App\Models\Appointment::with(['patient', 'clientAccount', 'service', 'type'])
                ->where('doctor_id', $id)
                ->whereIn('status', ['confirmed', 'completed'])
                ->orderBy('appointment_date', 'asc')
                ->orderBy('appointment_time', 'asc')
                ->get();

            // Transform for frontend
            $appointments = $appointments->map(function ($appointment) {
                return [
                    'id' => $appointment->appointment_id,
                    'appointment_id' => $appointment->appointment_id,
                    'patient' => $appointment->patient 
                        ? trim(($appointment->patient->first_name ?? '') . ' ' . ($appointment->patient->last_name ?? ''))
                        : ($appointment->clientAccount->name ?? 'Unknown'),
                    'time' => substr($appointment->appointment_time, 0, 5), // Format HH:MM
                    'type' => $appointment->service->name ?? ($appointment->type->name ?? 'General'),
                    'date' => date('D M d Y', strtotime($appointment->appointment_date)), // Format "Fri Dec 09 2025"
                    'raw_date' => $appointment->appointment_date,
                    'status' => ucfirst($appointment->status),
                    'notes' => $appointment->notes
                ];
            });

            return $this->success($appointments, 'Doctor appointments retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve appointments: ' . $e->getMessage(), 500);
        }
    }
}
