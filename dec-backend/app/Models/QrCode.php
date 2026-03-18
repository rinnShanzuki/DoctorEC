<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QrCode extends Model
{
    protected $table = 'qr_codes';
    
    protected $fillable = [
        'qr_img',
        'name',
        'type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the active GCash QR code
     */
    public static function getActiveGcashQr()
    {
        return self::where('type', 'gcash')
            ->where('is_active', true)
            ->first();
    }
}
