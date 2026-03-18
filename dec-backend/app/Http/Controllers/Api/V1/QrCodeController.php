<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\QrCode;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class QrCodeController extends Controller
{
    use ApiResponses;

    /**
     * Get all QR codes
     */
    public function index()
    {
        try {
            $qrCodes = QrCode::orderBy('created_at', 'desc')->get();
            return $this->success($qrCodes, 'QR codes retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve QR codes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get active GCash QR code
     */
    public function getGcashQr()
    {
        try {
            $qrCode = QrCode::getActiveGcashQr();
            
            if (!$qrCode) {
                return $this->success(null, 'No active GCash QR code found');
            }

            return $this->success([
                'id' => $qrCode->id,
                'qr_img' => $qrCode->qr_img,
                'name' => $qrCode->name,
            ], 'GCash QR code retrieved successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to retrieve GCash QR code: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Store/Update GCash QR code
     */
    public function storeGcashQr(Request $request)
    {
        try {
            $validated = $request->validate([
                'qr_img' => 'required|string', // Base64 encoded image
                'name' => 'nullable|string|max:255',
            ]);

            // Deactivate all existing GCash QR codes
            QrCode::where('type', 'gcash')->update(['is_active' => false]);

            // Create new active QR code
            $qrCode = QrCode::create([
                'qr_img' => $validated['qr_img'],
                'name' => $validated['name'] ?? 'GCash QR',
                'type' => 'gcash',
                'is_active' => true,
            ]);

            return $this->success([
                'id' => $qrCode->id,
                'qr_img' => $qrCode->qr_img,
                'name' => $qrCode->name,
            ], 'GCash QR code saved successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->error('Failed to save GCash QR code: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a QR code
     */
    public function destroy($id)
    {
        try {
            $qrCode = QrCode::findOrFail($id);
            $qrCode->delete();
            return $this->success(null, 'QR code deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete QR code: ' . $e->getMessage(), 500);
        }
    }
}
