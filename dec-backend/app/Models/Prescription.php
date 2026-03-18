<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        // Original fields
        'left_eye',
        'right_eye',
        'lens_grade',
        'recommendation',
        'medical_concern',
        'product_required',
        'appointment_id',
        'patient_id',
        'client_id',
        'birthday',
        'age',
        'doctor_id',

        // Rx (Refraction Results) — sph (blank column), add, va
        'rx_od_sph', 'rx_od_add', 'rx_od_va',
        'rx_os_sph', 'rx_os_add', 'rx_os_va',

        // Prescription (Final Rx) — sph (blank column), add, va
        'px_od_sph', 'px_od_add', 'px_od_va',
        'px_os_sph', 'px_os_add', 'px_os_va',

        // Lens Details
        'pd', 'is_spectacle', 'is_contact_lens',
        'frame', 'brand', 'lens', 'tint',

        // Other
        'remarks', 'released_by', 'released_date', 'claimed_by',
    ];

    protected $primaryKey = 'pres_id';

    protected $casts = [
        'product_required' => 'boolean',
        'is_spectacle' => 'boolean',
        'is_contact_lens' => 'boolean',
        'released_date' => 'date',
    ];

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function client()
    {
        return $this->belongsTo(ClientAccount::class, 'client_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
