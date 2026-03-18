<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\AdminAccount;
use App\Models\ClientAccount;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Try admin account
        $admin = AdminAccount::where('email', $request->email)->first();
        if ($admin && Hash::check($request->password, $admin->password)) {
            // Find or create a User for Sanctum token
            $user = User::firstOrCreate(
                ['email' => $admin->email],
                ['name' => $admin->first_name . ' ' . $admin->last_name, 'password' => $admin->password]
            );
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $admin->admin_id,
                    'name' => $admin->first_name . ' ' . $admin->last_name,
                    'email' => $admin->email,
                    'role' => 'admin',
                    'position' => $admin->position ?? 'admin',
                ],
            ]);
        }

        // Try doctor account
        $doctor = Doctor::where('email', $request->email)->first();
        if ($doctor && Hash::check($request->password, $doctor->password ?? '')) {
            $user = User::firstOrCreate(
                ['email' => $doctor->email],
                ['name' => $doctor->name ?? $doctor->email, 'password' => $doctor->password ?? '']
            );
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $doctor->doctor_id ?? $doctor->id,
                    'name' => $doctor->name ?? $doctor->email,
                    'email' => $doctor->email,
                    'role' => 'doctor',
                ],
            ]);
        }

        // Try client account
        $client = ClientAccount::where('email', $request->email)->first();
        if ($client && Hash::check($request->password, $client->password)) {
            $user = User::firstOrCreate(
                ['email' => $client->email],
                ['name' => $client->first_name . ' ' . $client->last_name, 'password' => $client->password]
            );
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $client->client_id,
                    'name' => $client->first_name . ' ' . $client->last_name,
                    'email' => $client->email,
                    'role' => 'client',
                    'phone' => $client->phone ?? null,
                    'gender' => $client->gender ?? null,
                    'profile_image' => $client->profile_image ?? null,
                ],
            ]);
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:client_accounts,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $client = ClientAccount::create([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone ?? null,
            'gender' => $request->gender ?? null,
            'is_active' => 1,
            'role_id' => $request->role_id ?? 3, // Default client role
        ]);

        $user = User::create([
            'name' => $request->first_name . ' ' . $request->last_name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $client->client_id,
                'name' => $client->first_name . ' ' . $client->last_name,
                'email' => $client->email,
                'role' => 'client',
            ],
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        // Try to find matching account
        $admin = AdminAccount::where('email', $user->email)->first();
        if ($admin) {
            return response()->json([
                'id' => $admin->admin_id, 'name' => $admin->first_name . ' ' . $admin->last_name,
                'email' => $admin->email, 'role' => 'admin', 'position' => $admin->position ?? 'admin',
            ]);
        }
        $doctor = Doctor::where('email', $user->email)->first();
        if ($doctor) {
            return response()->json([
                'id' => $doctor->doctor_id ?? $doctor->id, 'name' => $doctor->name ?? $doctor->email,
                'email' => $doctor->email, 'role' => 'doctor',
            ]);
        }
        $client = ClientAccount::where('email', $user->email)->first();
        if ($client) {
            return response()->json([
                'id' => $client->client_id, 'name' => $client->first_name . ' ' . $client->last_name,
                'email' => $client->email, 'role' => 'client', 'phone' => $client->phone,
                'gender' => $client->gender, 'profile_image' => $client->profile_image,
            ]);
        }
        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $client = ClientAccount::where('email', $user->email)->first();
        if ($client) {
            $client->update($request->only(['first_name', 'last_name', 'phone', 'gender']));
            return response()->json(['message' => 'Profile updated', 'user' => $client]);
        }
        return response()->json(['message' => 'User not found'], 404);
    }
}
