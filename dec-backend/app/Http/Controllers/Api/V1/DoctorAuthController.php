<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class DoctorAuthController extends Controller
{
    /**
     * Doctor login
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

        $doctor = Doctor::where('email', $request->email)->first();

        if (!$doctor || !$doctor->password || !Hash::check($request->password, $doctor->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials.',
                'errors' => ['email' => ['The provided credentials are incorrect.']]
            ], 401);
        }

        // Revoke previous tokens
        $doctor->tokens()->delete();
        $token = $doctor->createToken('doctor_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
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

    /**
     * Doctor logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Get current doctor profile
     */
    public function me(Request $request)
    {
        $doctor = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'doctor' => $doctor
            ]
        ]);
    }
}
