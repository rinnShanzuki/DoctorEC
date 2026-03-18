<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\PosNotification;

class PosNotificationController extends Controller
{
    /**
     * Get unread POS notifications
     */
    public function index()
    {
        $notifications = PosNotification::with(['appointment.patient', 'appointment.clientAccount', 'appointment.service'])
            ->where('is_read', 0)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($id)
    {
        $notification = PosNotification::find($id);
        
        if (!$notification) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'status' => 'success',
            'message' => 'Notification marked as read'
        ]);
    }
}
