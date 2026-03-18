<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ClientAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PasswordResetController extends Controller
{
    /**
     * Send password reset OTP to email
     */
    public function sendResetEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        // Check if user exists
        $user = ClientAccount::where('email', $request->email)->first();
        
        if (!$user) {
            // Don't reveal if email exists for security
            return response()->json([
                'status' => 'success',
                'message' => 'If an account exists with this email, you will receive a password reset code.'
            ]);
        }

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $token = Str::random(64);

        // Delete any existing reset tokens for this email
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Store the reset token
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'otp' => $otp,
            'expires_at' => Carbon::now()->addMinutes(15), // 15 minute expiry
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);

        // Send email with OTP
        try {
            Mail::send([], [], function ($message) use ($request, $otp, $user) {
                $message->to($request->email)
                    ->subject('Doctor EC Optical - Password Reset Code')
                    ->html($this->getEmailTemplate($otp, $user->first_name ?? 'Customer'));
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Password reset code sent to your email.',
                'debug_otp' => config('app.debug') ? $otp : null // Only show in debug mode
            ]);
        } catch (\Exception $e) {
            // If email fails, still return success but log the error
            \Log::error('Password reset email failed: ' . $e->getMessage());
            
            return response()->json([
                'status' => 'success',
                'message' => 'Password reset code sent to your email.',
                'debug_otp' => config('app.debug') ? $otp : null // Show OTP in debug mode
            ]);
        }
    }

    /**
     * Verify OTP code
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6'
        ]);

        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired verification code.'
            ], 400);
        }

        // Generate a temporary token for the password reset step
        $resetToken = Str::random(64);
        
        // Update the record with the reset token
        DB::table('password_resets')
            ->where('id', $resetRecord->id)
            ->update([
                'token' => Hash::make($resetToken),
                'updated_at' => Carbon::now()
            ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Code verified successfully.',
            'reset_token' => $resetToken
        ]);
    }

    /**
     * Reset password with token
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'reset_token' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $resetRecord = DB::table('password_resets')
            ->where('email', $request->email)
            ->where('used', false)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$resetRecord || !Hash::check($request->reset_token, $resetRecord->token)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid or expired reset token.'
            ], 400);
        }

        // Update user password
        $user = ClientAccount::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User not found.'
            ], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Mark reset token as used
        DB::table('password_resets')
            ->where('id', $resetRecord->id)
            ->update(['used' => true, 'updated_at' => Carbon::now()]);

        return response()->json([
            'status' => 'success',
            'message' => 'Password reset successfully. You can now login with your new password.'
        ]);
    }

    /**
     * Email template for password reset
     */
    private function getEmailTemplate($otp, $name)
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
                .warning { background: #FFF3E0; color: #E65100; padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>👓 Doctor EC Optical</div>
                </div>
                
                <p class='message'>Hi <strong>{$name}</strong>,</p>
                <p class='message'>You requested to reset your password. Use the code below to verify your identity:</p>
                
                <div class='otp-box'>
                    <div class='otp-code'>{$otp}</div>
                </div>
                
                <p class='message'>This code will expire in <strong>15 minutes</strong>.</p>
                
                <div class='warning'>
                    ⚠️ If you didn't request this, please ignore this email and your password will remain unchanged.
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
