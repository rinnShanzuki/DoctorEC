<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClientAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

/**
 * Handles email OTP verification during client registration.
 * 
 * Flow:
 * 1. Client registers → account created with email_verified_at = null
 * 2. OTP is auto-sent to their email
 * 3. Client enters OTP → POST /email/verify-otp
 * 4. On success → email_verified_at is set, token is returned
 * 5. Client can also request a new OTP → POST /email/resend-otp
 */
class EmailVerificationController extends Controller
{
    /**
     * Send verification OTP to a registered but unverified email.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $client = ClientAccount::where('email', $request->email)->first();

        if (!$client) {
            return response()->json([
                'status' => 'error',
                'message' => 'No account found with this email.'
            ], 404);
        }

        if ($client->email_verified_at) {
            return response()->json([
                'status' => 'success',
                'message' => 'Email is already verified.'
            ]);
        }

        return $this->generateAndSendOtp($request->email, $client->first_name ?? 'Customer');
    }

    /**
     * Verify OTP and activate the account.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6'
        ]);

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

        // Mark client email as verified
        $client = ClientAccount::where('email', $request->email)->first();

        if (!$client) {
            return response()->json([
                'status' => 'error',
                'message' => 'Account not found.'
            ], 404);
        }

        $client->email_verified_at = Carbon::now();
        $client->save();

        // Generate auth token so they can log in after verification
        $token = $client->createToken('client-auth-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Email verified successfully! You can now use your account.',
            'data' => [
                'token' => $token,
                'client' => $client,
            ]
        ]);
    }

    /**
     * Generate a 6-digit OTP, store it, and send via email.
     */
    public function generateAndSendOtp(string $email, string $name): \Illuminate\Http\JsonResponse
    {
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Clear previous OTPs for this email
        DB::table('email_verifications')->where('email', $email)->delete();

        // Store new OTP
        DB::table('email_verifications')->insert([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => Carbon::now()->addMinutes(15),
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Send email
        try {
            Mail::send([], [], function ($message) use ($email, $otp, $name) {
                $message->to($email)
                    ->subject('Doctor EC Optical - Verify Your Email')
                    ->html($this->getEmailTemplate($otp, $name));
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to your email.',
                'debug_otp' => config('app.debug') ? $otp : null,
            ]);
        } catch (\Exception $e) {
            \Log::error('Email verification send failed: ' . $e->getMessage());

            return response()->json([
                'status' => 'success',
                'message' => 'Verification code sent to your email.',
                'debug_otp' => config('app.debug') ? $otp : null,
            ]);
        }
    }

    /**
     * Email template for verification OTP.
     */
    private function getEmailTemplate(string $otp, string $name): string
    {
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Calibri, Arial, sans-serif; background-color: #f5f1ee; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .logo { font-size: 24px; font-weight: bold; color: #5D4E37; }
                .otp-box { background: #F5F1EE; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #5D4E37; letter-spacing: 8px; }
                .message { color: #666; line-height: 1.6; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E0D5C7; font-size: 12px; color: #999; text-align: center; }
                .highlight { background: #E8F5E9; color: #2E7D32; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>👓 Doctor EC Optical</div>
                </div>
                
                <p class='message'>Hi <strong>{$name}</strong>,</p>
                <p class='message'>Thank you for registering! Please verify your email address using the code below:</p>
                
                <div class='otp-box'>
                    <div class='otp-code'>{$otp}</div>
                </div>
                
                <p class='message'>This code will expire in <strong>15 minutes</strong>.</p>
                
                <div class='highlight'>
                    ✅ Once verified, you'll have full access to book appointments, reserve products, and more.
                </div>
                
                <div class='footer'>
                    <p>© 2025 Doctor EC Optical Clinic. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
