<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    protected $fillable = [
        'appointment_type',
        'service_id',
        'appointment_date',
        'appointment_time',
        'status',
        'notes',
        'occupation',
        'patient_id',
        'client_id',
        'doctor_id'
    ];

    protected $primaryKey = 'appointment_id';
    
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function clientAccount()
    {
        return $this->belongsTo(ClientAccount::class, 'client_id', 'client_id');
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function prescription()
    {
        return $this->hasOne(Prescription::class, 'appointment_id', 'appointment_id');
    }

}
