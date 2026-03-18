<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PosNotification extends Model
{
    protected $fillable = [
        'appointment_id',
        'message',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }
}
