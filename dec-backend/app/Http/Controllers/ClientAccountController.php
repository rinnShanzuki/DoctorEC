<?php

namespace App\Http\Controllers;

use App\Models\ClientAccount;
use App\Models\Patient;
use App\Models\SalesTransaction;
use App\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\V1\EmailVerificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ClientAccountController extends Controller
{
    /**
     * Register a new client
     */
    public function register(Request $request)
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:client_accounts,email',
                'password' => 'required|string|min:8|confirmed',
                'phone' => 'nullable|string|max:20',
                'gender' => 'nullable|in:male,female,other',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Create the client account (unverified)
            $client = ClientAccount::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'gender' => $request->gender,
                'is_active' => true,
                'role_id' => 2,
                'email_verified_at' => null,
            ]);

            // Send verification OTP
            $verificationController = new EmailVerificationController();
            $otpResponse = $verificationController->generateAndSendOtp(
                $client->email,
                $client->first_name
            );
            $otpData = $otpResponse->getData(true);

            // If email fails to send (e.g. invalid email domain)
            if (($otpData['status'] ?? 'error') === 'error') {
                // Rollback client creation
                $client->delete();
                
                return response()->json([
                    'status' => 'error',
                    'message' => $otpData['message'] ?? 'Failed to send verification email. Ensure your email is correct.',
                ], 400);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Registration successful! Please check your email for the verification code.',
                'email_verified' => false,
                'debug_otp' => $otpData['debug_otp'] ?? null,
                'data' => [
                    'client' => [
                        'id' => $client->client_id,
                        'name' => $client->first_name . ' ' . $client->last_name,
                        'email' => $client->email,
                    ],
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login a client
     */
    public function login(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find the client by email
            $client = ClientAccount::where('email', $request->email)->first();

            // Check if client exists and password is correct
            if (!$client || !Hash::check($request->password, $client->password)) {
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            // Check if account is active
            if (!$client->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Your account has been deactivated. Please contact support.'
                ], 403);
            }

            // Check if email is verified
            if (!$client->email_verified_at) {
                // Auto-resend OTP so user can verify
                $verificationController = new EmailVerificationController();
                $otpResponse = $verificationController->generateAndSendOtp(
                    $client->email,
                    $client->first_name
                );
                $otpData = $otpResponse->getData(true);

                if (($otpData['status'] ?? 'error') === 'error') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Your account requires verification, but we failed to send the email. Please ensure your email is correct and contact support.',
                    ], 400);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'Please verify your email address first. A new verification code has been sent.',
                    'email_verified' => false,
                    'debug_otp' => $otpData['debug_otp'] ?? null,
                ], 403);
            }

            // Create a new token
            $token = $client->createToken('client-auth-token')->plainTextToken;

            // Load the role relationship
            $client->load('role');

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'client' => $client,
                    'token' => $token
                ]
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials',
                'errors' => $e->errors()
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout the authenticated client
     */
    public function logout(Request $request)
    {
        try {
            // Revoke the token that was used to authenticate the current request
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Logged out successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated client's data
     */
    public function me(Request $request)
    {
        try {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'client' => $request->user()
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve user data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            $clients = ClientAccount::orderBy('created_at', 'desc')->get();
            
            // Transform data for frontend
            $clients = $clients->map(function ($client) {
                return [
                    'id' => $client->client_id,
                    'client_id' => $client->client_id,
                    'name' => trim(($client->first_name ?? '') . ' ' . ($client->last_name ?? '')),
                    'first_name' => $client->first_name,
                    'last_name' => $client->last_name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'gender' => $client->gender,
                    'birthday' => $client->birthday,
                    'is_active' => $client->is_active,
                    'created_at' => $client->created_at->toISOString(),
                    'joinedDate' => $client->created_at->format('Y-m-d'),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $clients
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve clients: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified client with full details
     */
    public function show($id)
    {
        try {
            $client = ClientAccount::findOrFail($id);

            $clientName = trim($client->first_name . ' ' . $client->last_name);

            // Find linked patient record via client_id FK
            $patient = Patient::where('client_id', $client->client_id)->first();

            // Get birthday and age from linked patient
            $birthdate = null;
            $age = null;
            if ($patient && $patient->birthdate) {
                $birthdate = $patient->birthdate;
                $age = \Carbon\Carbon::parse($patient->birthdate)->age;
            }

            // Get medical records if patient exists (only after consultation is completed)
            $medicalRecords = [];
            if ($patient) {
                $patient->load('records');
                $medicalRecords = $patient->records->map(function ($record) {
                    return [
                        'id' => $record->pr_id,
                        'medical_history' => $record->medical_history,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                    ];
                })->toArray();
            }

            // Get appointment history (via client_id or patient_id)
            $appointmentQuery = \App\Models\Appointment::with(['service', 'doctor'])
                ->where('client_id', $client->client_id);
            if ($patient) {
                $appointmentQuery->orWhere('patient_id', $patient->patient_id);
            }
            $appointments = $appointmentQuery->orderBy('appointment_date', 'desc')
                ->get()
                ->map(function ($apt) {
                    return [
                        'id' => $apt->appointment_id,
                        'appointment_date' => $apt->appointment_date,
                        'appointment_time' => $apt->appointment_time,
                        'service_name' => $apt->service->name ?? 'General Checkup',
                        'doctor_name' => $apt->doctor->full_name ?? 'N/A',
                        'status' => $apt->status,
                        'notes' => $apt->notes,
                    ];
                })->toArray();

            // Get product purchases via SalesTransaction matched by client name
            $purchases = SalesTransaction::with(['items.product'])
                ->where('customer_name', 'LIKE', '%' . $clientName . '%')
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
                })->toArray();

            // Get prescriptions via appointments linked to this client
            $appointmentIds = collect($appointments)->pluck('id')->toArray();
            $prescriptions = [];
            if (!empty($appointmentIds)) {
                $prescriptions = \App\Models\Prescription::with(['appointment.service'])
                    ->whereIn('appointment_id', $appointmentIds)
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->map(function ($pres) {
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
                    })->toArray();
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'client_id' => $client->client_id,
                    'name' => $clientName,
                    'first_name' => $client->first_name,
                    'last_name' => $client->last_name,
                    'email' => $client->email,
                    'phone' => $client->phone,
                    'gender' => $client->gender,
                    'birthdate' => $birthdate,
                    'age' => $age,
                    'is_active' => $client->is_active,
                    'registration_date' => $client->created_at->toISOString(),
                    'medical_records' => $medicalRecords,
                    'prescriptions' => $prescriptions,
                    'appointments' => $appointments,
                    'purchases' => $purchases,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve client: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Block or unblock a client user
     */
    public function blockUser($id)
    {
        try {
            $client = ClientAccount::findOrFail($id);
            $client->is_active = !$client->is_active;
            $client->save();

            $action = $client->is_active ? 'unblocked' : 'blocked';

            return response()->json([
                'status' => 'success',
                'message' => "User has been {$action} successfully.",
                'data' => [
                    'client_id' => $client->client_id,
                    'is_active' => $client->is_active,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update user status: ' . $e->getMessage()
            ], 500);
        }
    }
}
