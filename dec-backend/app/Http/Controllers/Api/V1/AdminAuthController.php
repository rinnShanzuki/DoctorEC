<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginUserRequest;
use App\Http\Requests\RegisterAdminRequest;
use App\Models\AdminAccount;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    use ApiResponses;

    /**
     * Register a new admin account
     * 
     * @param RegisterAdminRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(RegisterAdminRequest $request)
    {
        try {
            // Create new admin account
            $admin = AdminAccount::create([
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'position' => $request->position,
                'role_id' => 1, // Default role
            ]);

            // Generate API token
            $token = $admin->createToken('admin_auth_token')->plainTextToken;

            return $this->created([
                'admin' => [
                    'admin_id' => $admin->admin_id,
                    'email' => $admin->email,
                    'first_name' => $admin->first_name,
                    'last_name' => $admin->last_name,
                    'position' => $admin->position,
                    'role_id' => $admin->role_id,
                ],
                'token' => $token,
                'token_type' => 'Bearer'
            ], 'Admin registered successfully');

        } catch (\Exception $e) {
            return $this->error('Registration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Login admin
     * 
     * @param LoginUserRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(LoginUserRequest $request)
    {
        // Find admin by email
        $admin = AdminAccount::with('role')->where('email', $request->email)->first();

        // Check if admin exists and password is correct
        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return $this->unauthorized('Invalid credentials');
        }

        // Revoke all previous tokens
        $admin->tokens()->delete();

        // Create new token
        $token = $admin->createToken('admin_auth_token')->plainTextToken;

        return $this->success([
            'admin' => [
                'admin_id' => $admin->admin_id,
                'email' => $admin->email,
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'position' => $admin->position,
                'role_id' => $admin->role_id,
                'role_name' => $admin->role->name ?? 'Admin',
            ],
            'token' => $token,
            'token_type' => 'Bearer'
        ], 'Login successful');
    }

    /**
     * Logout admin (revoke current token)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Revoke the current access token
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'Logged out successfully');
    }

    /**
     * Get current authenticated admin profile
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function me(Request $request)
    {
        $admin = $request->user();

        return $this->success([
            'admin' => [
                'admin_id' => $admin->admin_id,
                'email' => $admin->email,
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'position' => $admin->position,
                'role_id' => $admin->role_id,
            ]
        ], 'Profile retrieved successfully');
    }

    /**
     * Update admin profile
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $admin = $request->user();

        // Validate request
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'email' => 'sometimes|email|unique:admin_accounts,email,' . $admin->admin_id . ',admin_id',
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        // Update password if provided
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Update admin
        $admin->update($validated);

        return $this->success([
            'admin' => [
                'admin_id' => $admin->admin_id,
                'email' => $admin->email,
                'first_name' => $admin->first_name,
                'last_name' => $admin->last_name,
                'position' => $admin->position,
                'role_id' => $admin->role_id,
            ]
        ], 'Profile updated successfully');
    }

    /**
     * Get all staff accounts (Cashier and Staff roles)
     */
    public function getStaffAccounts()
    {
        $staffAccounts = AdminAccount::with('role')
            ->whereIn('role_id', [2, 3]) // Cashier and Staff only
            ->get()
            ->map(function ($account) {
                return [
                    'admin_id' => $account->admin_id,
                    'email' => $account->email,
                    'first_name' => $account->first_name,
                    'last_name' => $account->last_name,
                    'position' => $account->position,
                    'role_id' => $account->role_id,
                    'role_name' => $account->role->name ?? 'Unknown',
                    'created_at' => $account->created_at,
                ];
            });

        return $this->success(['staff' => $staffAccounts], 'Staff accounts retrieved successfully');
    }

    /**
     * Create a new staff account (Cashier or Staff role)
     */
    public function createStaffAccount(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:admin_accounts,email',
            'password' => 'required|string|min:6',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'role_id' => 'required|integer|in:2,3', // Only Cashier (2) or Staff (3)
        ]);

        try {
            $staff = AdminAccount::create([
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'position' => $validated['position'] ?? null,
                'role_id' => $validated['role_id'],
            ]);

            $staff->load('role');

            return $this->created([
                'staff' => [
                    'admin_id' => $staff->admin_id,
                    'email' => $staff->email,
                    'first_name' => $staff->first_name,
                    'last_name' => $staff->last_name,
                    'position' => $staff->position,
                    'role_id' => $staff->role_id,
                    'role_name' => $staff->role->name,
                ]
            ], 'Staff account created successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to create staff account: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a staff account
     */
    public function deleteStaffAccount($id)
    {
        $staff = AdminAccount::where('admin_id', $id)
            ->whereIn('role_id', [2, 3]) // Only allow deleting Cashier/Staff
            ->first();

        if (!$staff) {
            return $this->error('Staff account not found', 404);
        }

        $staff->tokens()->delete(); // Revoke all tokens
        $staff->delete();

        return $this->success(null, 'Staff account deleted successfully');
    }

    /**
     * Get available roles for staff creation
     */
    public function getRoles()
    {
        $roles = \App\Models\Role::whereIn('role_id', [2, 3])->get(['role_id', 'name']);
        return $this->success(['roles' => $roles], 'Roles retrieved successfully');
    }
}
