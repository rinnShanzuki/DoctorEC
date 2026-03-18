<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SalesTransaction;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    use ApiResponses;

    /**
     * Get all patients with their records (appointments and reservations)
     */
    public function index()
    {
        try {
            $patients = Patient::with(['appointments', 'clientAccount.reservations.product'])
                ->orderBy('created_at', 'desc')
                ->get();

            // Transform for frontend (matching AdminRecords.jsx expected format)
            $patients = $patients->map(function ($patient) {
                // Get reservations through client account if exists
                $reservations = [];
                if ($patient->clientAccount && $patient->clientAccount->reservations) {
                    $reservations = $patient->clientAccount->reservations->map(function ($res) {
                        return [
                            'id' => $res->prodres_id,
                            'product' => $res->product ? [
                                'name' => $res->product->name
                            ] : null,
                            'status' => $res->status,
                            'created_at' => $res->created_at,
                        ];
                    })->toArray();
                }

                // Get appointments
                $appointments = $patient->appointments ? $patient->appointments->map(function ($apt) {
                    return [
                        'id' => $apt->appointment_id ?? $apt->id,
                        'appointment_date' => $apt->appointment_date,
                        'type' => $apt->appointmentType ? $apt->appointmentType->name : 'General',
                        'diagnosis' => $apt->diagnosis ?? null,
                        'prescription' => $apt->prescription ?? null,
                        'status' => $apt->status,
                    ];
                })->toArray() : [];

                return [
                    'id' => $patient->patient_id,
                    'name' => $patient->name,
                    'email' => $patient->email ?? 'N/A',
                    'phone' => $patient->phone ?? 'N/A',
                    'birthdate' => $patient->birthdate,
                    'gender' => $patient->gender,
                    'address' => $patient->address,
                    'patient_code' => $patient->patient_code,
                    'reservations' => $reservations,
                    'appointments' => $appointments,
                    'created_at' => $patient->created_at,
                ];
            });

            return response()->json($patients);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve patients: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single patient with full details
     */
    public function show($id)
    {
        try {
            $patient = Patient::with(['records', 'prescriptions.appointment.service', 'appointments.service', 'appointments.doctor'])
                ->findOrFail($id);

            // Calculate age from birthdate
            $age = null;
            if ($patient->birthdate) {
                $age = \Carbon\Carbon::parse($patient->birthdate)->age;
            }

            // Get medical records
            $medicalRecords = $patient->records->map(function ($record) {
                return [
                    'id' => $record->pr_id,
                    'medical_history' => $record->medical_history,
                    'created_at' => $record->created_at,
                    'updated_at' => $record->updated_at,
                ];
            });

            // Get appointment history with service info
            $appointments = $patient->appointments->map(function ($apt) {
                return [
                    'id' => $apt->appointment_id,
                    'appointment_date' => $apt->appointment_date,
                    'appointment_time' => $apt->appointment_time,
                    'service_name' => $apt->service->name ?? 'General Checkup',
                    'doctor_name' => $apt->doctor->full_name ?? 'N/A',
                    'status' => $apt->status,
                    'notes' => $apt->notes,
                ];
            });

            // Get product purchases via SalesTransaction matched by patient name
            $patientName = trim($patient->first_name . ' ' . $patient->last_name);
            $purchases = SalesTransaction::with(['items.product'])
                ->where('customer_name', 'LIKE', '%' . $patientName . '%')
                ->orderBy('transaction_date', 'desc')
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->st_id,
                        'receipt_number' => $transaction->receipt_number,
                        'total_amount' => $transaction->total_amount,
                        'payment_method' => $transaction->payment_method,
                        'transaction_date' => $transaction->transaction_date,
                        'items' => $transaction->items->map(function ($item) {
                            return [
                                'product_name' => $item->product->name ?? 'Unknown Product',
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'subtotal' => $item->subtotal,
                            ];
                        }),
                    ];
                });

            // Get prescriptions
            $prescriptions = $patient->prescriptions->map(function ($pres) {
                return [
                    'id' => $pres->pres_id,
                    'left_eye' => $pres->left_eye,
                    'right_eye' => $pres->right_eye,
                    'lens_grade' => $pres->lens_grade,
                    'recommendation' => $pres->recommendation,
                    'medical_concern' => $pres->medical_concern,
                    'product_required' => $pres->product_required,

                    // Rx
                    'rx_od_sph' => $pres->rx_od_sph, 'rx_od_cyl' => $pres->rx_od_cyl,
                    'rx_od_axis' => $pres->rx_od_axis, 'rx_od_add' => $pres->rx_od_add, 'rx_od_va' => $pres->rx_od_va,
                    'rx_os_sph' => $pres->rx_os_sph, 'rx_os_cyl' => $pres->rx_os_cyl,
                    'rx_os_axis' => $pres->rx_os_axis, 'rx_os_add' => $pres->rx_os_add, 'rx_os_va' => $pres->rx_os_va,

                    // Prescription
                    'px_od_sph' => $pres->px_od_sph, 'px_od_cyl' => $pres->px_od_cyl,
                    'px_od_axis' => $pres->px_od_axis, 'px_od_add' => $pres->px_od_add, 'px_od_va' => $pres->px_od_va,
                    'px_os_sph' => $pres->px_os_sph, 'px_os_cyl' => $pres->px_os_cyl,
                    'px_os_axis' => $pres->px_os_axis, 'px_os_add' => $pres->px_os_add, 'px_os_va' => $pres->px_os_va,

                    // Lens details
                    'pd' => $pres->pd,
                    'is_spectacle' => $pres->is_spectacle,
                    'is_contact_lens' => $pres->is_contact_lens,
                    'frame' => $pres->frame,
                    'brand' => $pres->brand,
                    'lens' => $pres->lens,
                    'tint' => $pres->tint,

                    // Other
                    'remarks' => $pres->remarks,
                    'released_by' => $pres->released_by,
                    'released_date' => $pres->released_date,
                    'claimed_by' => $pres->claimed_by,

                    'service_name' => $pres->appointment && $pres->appointment->service
                        ? $pres->appointment->service->name : null,
                    'appointment_date' => $pres->appointment
                        ? $pres->appointment->appointment_date : null,
                    'created_at' => $pres->created_at,
                ];
            });

            return $this->success([
                'patient_id' => $patient->patient_id,
                'patient_code' => $patient->patient_code,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'birthdate' => $patient->birthdate,
                'age' => $age,
                'gender' => $patient->gender,
                'address' => $patient->address,
                'medical_records' => $medicalRecords,
                'prescriptions' => $prescriptions,
                'appointments' => $appointments,
                'purchases' => $purchases,
            ], 'Patient details retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve patient: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store a new patient
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'birthdate' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'address' => 'nullable|string',
            ]);

            // Generate unique patient code based on max existing ID
            $maxId = Patient::max('patient_id') ?? 0;
            $validated['patient_code'] = 'P' . str_pad($maxId + 1, 6, '0', STR_PAD_LEFT);

            $patient = Patient::create($validated);

            return $this->created([
                'id' => $patient->patient_id,
                'patient_id' => $patient->patient_id,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'birthdate' => $patient->birthdate,
                'gender' => $patient->gender,
                'address' => $patient->address,
                'patient_code' => $patient->patient_code,
            ], 'Patient created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create patient: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a patient
     */
    public function update(Request $request, $id)
    {
        try {
            $patient = Patient::findOrFail($id);

            $validated = $request->validate([
                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',
                'middle_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'birthdate' => 'nullable|date',
                'gender' => 'nullable|in:male,female,other',
                'address' => 'nullable|string',
            ]);

            $patient->update($validated);

            return $this->success([
                'id' => $patient->patient_id,
                'patient_id' => $patient->patient_id,
                'first_name' => $patient->first_name,
                'middle_name' => $patient->middle_name,
                'last_name' => $patient->last_name,
                'phone' => $patient->phone,
                'email' => $patient->email,
                'birthdate' => $patient->birthdate,
                'gender' => $patient->gender,
                'address' => $patient->address,
                'patient_code' => $patient->patient_code,
            ], 'Patient updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update patient: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a patient
     */
    public function destroy($id)
    {
        try {
            $patient = Patient::findOrFail($id);
            $patient->delete();

            return $this->success(null, 'Patient deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete patient: ' . $e->getMessage(), 500);
        }
    }
}
