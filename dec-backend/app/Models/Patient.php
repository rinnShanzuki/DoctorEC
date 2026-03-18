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

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['name'];

    public function clientAccount()
    {
        return $this->belongsTo(ClientAccount::class, 'client_id');
    }

    public function records()
    {
        return $this->hasMany(PatientRecord::class, 'patient_id');
    }

    /**
     * Get the patient's full name.
     *
     * @return string
     */
    public function getNameAttribute()
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'patient_id');
    }
}
