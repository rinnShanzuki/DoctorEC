<?php

namespace App\Services;

use App\Models\ClientAccount;
use App\Models\Product;
use App\Models\Appointment;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailService
{
    /**
     * Send email about a new product to all verified active clients via BCC.
     */
    public static function sendNewProductEmail(Product $product)
    {
        $subject = 'New Arrival at Doctor EC Optical: ' . $product->name;
        $productImageInfo = $product->image ? 'Check it out now at our clinic!' : '';
        
        $body = self::getBaseTemplate(
            'New Product Alert! 🎉',
            "We're excited to announce a new addition to our collection: <strong>{$product->name}</strong>.",
            "
            <p style='margin: 10px 0;'><strong>Category:</strong> {$product->category}</p>
            <p style='margin: 10px 0;'><strong>Details:</strong> " . ($product->description ?? 'Visit our clinic to see more details.') . "</p>
            <p style='margin: 10px 0;'><strong>Price:</strong> ₱" . number_format($product->price, 2) . "</p>
            <p style='margin: 10px 0;'>{$productImageInfo}</p>
            ",
            'View on our Website',
            rtrim(config('app.url', 'http://localhost:8000'), '/') . (str_contains(config('app.url'), '8000') ? ':5173' : '') . '/products' // Quick local hack if running full-stack separate
        );

        self::broadcastToClients($subject, $body);
    }

    /**
     * Send general clinic notification (e.g., when a new Service is added)
     */
    public static function sendClinicNotification(string $title, string $message, string $callToActionLabel = null, string $callToActionUrl = null)
    {
        $subject = 'Doctor EC Optical Update: ' . $title;
        $body = self::getBaseTemplate(
            $title,
            $message,
            "",
            $callToActionLabel,
            $callToActionUrl
        );

        self::broadcastToClients($subject, $body);
    }

    /**
     * Send appointment status update to a specific patient.
     */
    public static function sendAppointmentStatusEmail(Appointment $appointment)
    {
        // Get the email of the person who booked it
        // Depending on schema, it might be tied directly to client_id or through patient.
        $email = null;
        $name = 'Valued Patient';

        $appointment->load(['client', 'service', 'doctor']);

        if ($appointment->client) {
            $email = $appointment->client->email;
            $name = $appointment->client->first_name;
        }

        if (!$email) {
            return; // Nowhere to send
        }

        $statusMessage = self::getStatusDescription($appointment->status);
        $subject = "Appointment Update: {$appointment->status}";
        
        $serviceName = $appointment->service ? $appointment->service->name : 'General Visit';
        $doctorName = $appointment->doctor ? $appointment->doctor->full_name : 'Our Specialists';

        $body = self::getBaseTemplate(
            "Appointment {$appointment->status}",
            "Hi <strong>{$name}</strong>, your appointment status has been updated.",
            "
            <div style='background: #F5F1EE; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                <p style='margin: 5px 0;'><strong>Service:</strong> {$serviceName}</p>
                <p style='margin: 5px 0;'><strong>Date:</strong> {$appointment->appointment_date}</p>
                <p style='margin: 5px 0;'><strong>Time:</strong> {$appointment->appointment_time}</p>
                <p style='margin: 5px 0;'><strong>Doctor:</strong> Dr. {$doctorName}</p>
                <p style='margin: 5px 0;'><strong>Status:</strong> <span style='color: #2E7D32; font-weight: bold;'>{$appointment->status}</span></p>
                <p style='margin: 5px 0;'><strong>Notes:</strong> " . ($appointment->notes ?? 'None') . "</p>
            </div>
            <p>{$statusMessage}</p>
            ",
            'View My Appointments',
            rtrim(config('app.url', 'http://localhost:8000'), '/') . (str_contains(config('app.url'), '8000') ? ':5173' : '') . '/client-my-appointments'
        );

        self::sendSingleEmail($email, $subject, $body);
    }

    /**
     * Helper to get status description.
     */
    private static function getStatusDescription(string $status): string
    {
        switch (strtolower($status)) {
            case 'accepted':
            case 'approved':
                return 'Your appointment has been confirmed. Please arrive 10 minutes early.';
            case 'completed':
                return 'Your session has been completed. Thank you for choosing Doctor EC Optical! Log in to see your medical records and prescriptions.';
            case 'cancelled':
            case 'declined':
                return 'Your appointment has been cancelled. If you believe this is a mistake, please book a new slot or contact our support.';
            case 'rescheduled':
                return 'Your appointment has been rescheduled. Please review the updated time.';
            default:
                return 'We will keep you updated regarding your appointment details.';
        }
    }

    /**
     * Broadcast an email using BCC chunking to all VERIFIED active clients.
     */
    private static function broadcastToClients(string $subject, string $htmlBody)
    {
        try {
            $emails = ClientAccount::whereNotNull('email_verified_at')
                ->where('is_active', true)
                ->pluck('email')
                ->toArray();

            if (empty($emails)) {
                return;
            }

            // Chunk to avoid SMTP too many recipients limit
            foreach (array_chunk($emails, 50) as $chunk) {
                Mail::send([], [], function ($message) use ($chunk, $subject, $htmlBody) {
                    // Always set a default 'To' address when using BCC exclusively
                    $message->to(config('mail.from.address'))
                        ->bcc($chunk)
                        ->subject($subject)
                        ->html($htmlBody);
                });
            }
        } catch (\Exception $e) {
            Log::error('Broadcast email failed: ' . $e->getMessage());
            // Do not throw so the main app doesn't crash on email failure
        }
    }

    /**
     * Send email to a single recipient.
     */
    private static function sendSingleEmail(string $toEmail, string $subject, string $htmlBody)
    {
        try {
            Mail::send([], [], function ($message) use ($toEmail, $subject, $htmlBody) {
                $message->to($toEmail)
                    ->subject($subject)
                    ->html($htmlBody);
            });
        } catch (\Exception $e) {
            Log::error("Single email delivery to {$toEmail} failed: " . $e->getMessage());
        }
    }

    /**
     * Centralized aesthetic template builder.
     */
    private static function getBaseTemplate(string $title, string $greeting, string $content, string $btnLabel = null, string $btnUrl = null): string
    {
        $buttonHtml = '';
        if ($btnLabel && $btnUrl) {
            $buttonHtml = "
            <div style='text-align: center; margin: 30px 0;'>
                <a href='{$btnUrl}' style='background-color: #5D4E37; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;'>{$btnLabel}</a>
            </div>
            ";
        }

        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Calibri, Arial, sans-serif; background-color: #f5f1ee; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #F5F1EE; padding-bottom: 15px;}
                .logo { font-size: 26px; font-weight: bold; color: #5D4E37; }
                .content { color: #444; line-height: 1.6; font-size: 15px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #E0D5C7; font-size: 12px; color: #999; text-align: center; }
                h2 { color: #3B2F2B; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <div class='logo'>👓 Doctor EC Optical</div>
                </div>
                
                <div class='content'>
                    <h2>{$title}</h2>
                    <p>{$greeting}</p>
                    
                    {$content}
                    
                    {$buttonHtml}
                </div>
                
                <div class='footer'>
                    <p>© " . date('Y') . " Doctor EC Optical Clinic. All rights reserved.</p>
                    <p>This is an automated notification, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
