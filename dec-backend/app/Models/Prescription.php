<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = [
        'left_eye',
        'right_eye',
        'lens_grade',
        'recommendation',
        'appointment_id',
        'patient_id',
        'doctor_id',
    ];

    protected $primaryKey = 'pres_id';
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function patient()
    {
        return $this->belongsTo(ClientAccount::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
