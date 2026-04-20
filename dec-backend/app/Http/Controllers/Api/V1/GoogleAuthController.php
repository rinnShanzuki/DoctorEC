<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClientAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use Illuminate\Support\Facades\Auth;


/**
 * Handles Google OAuth authentication with OTP verification.
 *
 * Flow:
 * 1. Frontend sends Google id_token → POST /auth/google
 * 2. Backend verifies token with Google, finds/creates ClientAccount
 * 3. Backend sends OTP to user's email
 * 4. Frontend sends OTP → POST /auth/google/verify-otp
 * 5. Backend verifies OTP, returns Sanctum token
 */
class GoogleAuthController extends Controller
{
    /**
     * Handle Google login — verify token, find/create account, send OTP.
     */
    public function handleGoogleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verify Google ID token
            $googleUser = $this->verifyGoogleToken($request->id_token);

            if (!$googleUser) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid Google token. Please try again.'
                ], 401);
            }

            $email = $googleUser['email'];
            $firstName = $googleUser['given_name'] ?? '';
            $lastName = $googleUser['family_name'] ?? '';
            $fullName = $googleUser['name'] ?? trim("$firstName $lastName");
            $picture = $googleUser['picture'] ?? null;

            // Look up existing client account
            $client = ClientAccount::where('email', $email)->first();

            if ($client) {
                // Existing account — check if active
                if (!$client->is_active) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Your account has been deactivated. Please contact support.'
                    ], 403);
                }

                // Update profile image from Google if not already set
                if (!$client->profile_image && $picture) {
                    $client->profile_image = $picture;
                    $client->save();
                }

                // Ensure email is marked as verified (they logged in via Google)
                if (!$client->email_verified_at) {
                    $client->email_verified_at = Carbon::now();
                    $client->save();
                }
            } else {
                // New user — auto-create client account
                $client = ClientAccount::create([
                    'first_name' => $firstName ?: explode(' ', $fullName)[0],
                    'last_name' => $lastName ?: (count(explode(' ', $fullName)) > 1 ? implode(' ', array_slice(explode(' ', $fullName), 1)) : ''),
                    'email' => $email,
                    'password' => Hash::make(bin2hex(random_bytes(16))), // Random password (they use Google to login)
                    'phone' => null,
                    'gender' => null,
                    'is_active' => true,
                    'role_id' => 2, // Client role
                    'email_verified_at' => Carbon::now(), // Trust Google's email verification
                    'profile_image' => $picture,
                ]);
            }

            // Send OTP for login verification
            $verificationController = new EmailVerificationController();
            $otpResponse = $verificationController->generateAndSendOtp(
                $client->email,
                $client->first_name ?? 'Customer'
            );
            $otpData = $otpResponse->getData(true);

            return response()->json([
                'status' => 'otp_required',
                'message' => 'A verification code has been sent to your email.',
                'email' => $email,
                'name' => $client->first_name . ' ' . $client->last_name,
                'is_new_user' => !$client->wasRecentlyCreated ? false : true,
                'debug_otp' => $otpData['debug_otp'] ?? null,
            ]);

        } catch (\Exception $e) {
            \Log::error('Google auth error: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Google authentication failed. Please try again.'
            ], 500);
        }
    }

    /**
     * Verify OTP after Google login — issue Sanctum token.
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check OTP
            $record = DB::table('email_verifications')
                ->where('email', $request->email)
                ->where('otp', $request->otp)
                ->where('used', false)
                ->where('expires_at', '>', Carbon::now())
                ->first();

            if (!$record) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid or expired verification code.'
                ], 400);
            }

            // Mark OTP as used
            DB::table('email_verifications')
                ->where('id', $record->id)
                ->update(['used' => true, 'updated_at' => Carbon::now()]);

            // Find client
            $client = ClientAccount::where('email', $request->email)->first();

            if (!$client) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Account not found.'
                ], 404);
            }

            // Generate Sanctum token
            $token = $client->createToken('client-auth-token')->plainTextToken;
            $client->load('role');

            return response()->json([
                'status' => 'success',
                'message' => 'Login successful!',
                'data' => [
                    'client' => $client,
                    'token' => $token,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Google OTP verify error: ' . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Verification failed. Please try again.'
            ], 500);
        }
    }

    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $email = $googleUser->getEmail();
            $firstName = $googleUser->user['given_name'] ?? explode(' ', $googleUser->getName())[0];
            $lastName = $googleUser->user['family_name'] ?? (count(explode(' ', $googleUser->getName())) > 1 ? implode(' ', array_slice(explode(' ', $googleUser->getName()), 1)) : '');
            $picture = $googleUser->getAvatar();
            
            // Look up existing client account
            $client = ClientAccount::where('email', $email)->first();

            if ($client) {
                // Existing account — check if active
                if (!$client->is_active) {
                    return redirect()->away('http://localhost:5173/login?error=Your account has been deactivated. Please contact support.');
                }

                // Update profile image from Google if not already set
                if (!$client->profile_image && $picture) {
                    $client->profile_image = $picture;
                    $client->save();
                }

                // Ensure email is marked as verified
                if (!$client->email_verified_at) {
                    $client->email_verified_at = Carbon::now();
                    $client->save();
                }
            } else {
                // New user — auto-create client account
                $client = ClientAccount::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'password' => Hash::make(bin2hex(random_bytes(16))),
                    'phone' => null,
                    'gender' => null,
                    'is_active' => true,
                    'role_id' => 2, // Client role
                    'email_verified_at' => Carbon::now(),
                    'profile_image' => $picture,
                ]);
            }

            // Generate Sanctum token
            $token = $client->createToken('client-auth-token')->plainTextToken;

            // Redirect to the frontend login page with the token
            return redirect()->away('http://localhost:5173/login-success?token=' . $token);
        } catch (\Exception $e) {
            \Log::error('Google Callback Error: ' . $e->getMessage());
            return redirect()->away('http://localhost:5173/login?error=Authentication failed: ' . $e->getMessage());
        }
    }

    /**
     * Verify a Google ID token via Google's tokeninfo endpoint.
     *
     * @return array|null  Decoded user info or null on failure
     */
    private function verifyGoogleToken(string $idToken): ?array
    {
        try {
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

            if (!$response->successful()) {
                \Log::warning('Google token verification failed: ' . $response->body());
                return null;
            }

            $data = $response->json();

            // Verify the token is for our application
            $expectedClientId = config('services.google.client_id');
            if ($expectedClientId && isset($data['aud']) && $data['aud'] !== $expectedClientId) {
                \Log::warning('Google token audience mismatch. Expected: ' . $expectedClientId . ', Got: ' . $data['aud']);
                return null;
            }

            // Token must have a valid email
            if (empty($data['email'])) {
                \Log::warning('Google token missing email');
                return null;
            }

            return $data;

        } catch (\Exception $e) {
            \Log::error('Google token verification exception: ' . $e->getMessage());
            return null;
        }
    }
}
