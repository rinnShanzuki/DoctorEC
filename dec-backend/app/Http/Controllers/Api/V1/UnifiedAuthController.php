<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClientAccount;
use App\Models\AdminAccount;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UnifiedAuthController extends Controller
{
    /**
     * Unified login - checks client_accounts, admin_accounts, and doctors tables.
     * Returns a unified response with user type and role for frontend redirection.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // --- Try Client Account first ---
        $client = ClientAccount::where('email', $request->email)->first();

        if ($client && Hash::check($request->password, $client->password)) {
            // Check if account is active
            if (!$client->is_active) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Your account has been deactivated. Please contact support.'
                ], 403);
            }

            // Check if email is verified
            if (!$client->email_verified_at) {
                // Auto-resend OTP
                $verificationController = new EmailVerificationController();
                $otpResponse = $verificationController->generateAndSendOtp(
                    $client->email,
                    $client->first_name
                );
                $otpData = $otpResponse->getData(true);

                return response()->json([
                    'status' => 'error',
                    'message' => 'Please verify your email address first. A new verification code has been sent.',
                    'email_verified' => false,
                    'debug_otp' => $otpData['debug_otp'] ?? null,
                ], 403);
            }

            $token = $client->createToken('client-auth-token')->plainTextToken;
            $client->load('role');

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'user_type' => 'client',
                    'client' => $client,
                    'admin' => null,
                    'doctor' => null,
                    'token' => $token
                ]
            ], 200);
        }

        // --- Try Admin Account ---
        $admin = AdminAccount::with('role')->where('email', $request->email)->first();

        if ($admin && Hash::check($request->password, $admin->password)) {
            // Revoke all previous tokens
            $admin->tokens()->delete();

            $token = $admin->createToken('admin_auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'user_type' => 'admin',
                    'client' => null,
                    'admin' => [
                        'admin_id' => $admin->admin_id,
                        'email' => $admin->email,
                        'first_name' => $admin->first_name,
                        'last_name' => $admin->last_name,
                        'position' => $admin->position,
                        'role_id' => $admin->role_id,
                        'role_name' => $admin->role->name ?? 'Admin',
                    ],
                    'doctor' => null,
                    'token' => $token
                ]
            ], 200);
        }

        // --- Try Doctor Account ---
        $doctor = Doctor::where('email', $request->email)->first();

        if ($doctor && $doctor->password && Hash::check($request->password, $doctor->password)) {
            // Revoke all previous tokens
            $doctor->tokens()->delete();

            $token = $doctor->createToken('doctor_auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful',
                'data' => [
                    'user_type' => 'doctor',
                    'client' => null,
                    'admin' => null,
                    'doctor' => [
                        'doctor_id' => $doctor->doctor_id,
                        'full_name' => $doctor->full_name,
                        'email' => $doctor->email,
                        'specialization' => $doctor->specialization,
                        'position' => $doctor->position,
                        'status' => $doctor->status,
                        'image' => $doctor->image,
                    ],
                    'token' => $token
                ]
            ], 200);
        }

        // --- Neither matched ---
        return response()->json([
            'status' => 'error',
            'message' => 'Invalid credentials. Please check your email and password.',
            'errors' => ['email' => ['The provided credentials are incorrect.']]
        ], 401);
    }
}

