<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'middle_name',
        'phone',
        'email',
        'birthdate',
        'gender',
        'address',
        'patient_code',
        'client_id'
    ];

    protected $primaryKey = 'patient_id';
    public function clientAccount()
    {
        return $this->belongsTo(ClientAccount::class, 'client_id');
    }

    public function records()
    {
        return $this->hasMany(PatientRecord::class, 'patient_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

}
