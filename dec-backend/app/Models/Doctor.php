<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Doctor extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'full_name',
        'specialization',
        'position',
        'status',
        'image',
        'birthday',
        'email',
        'bio',
        'password'
    ];

    protected $primaryKey = 'doctor_id';

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
    ];

    protected $appends = ['age'];

    /**
     * Get the doctor's age based on birthday
     */
    protected function age(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->birthday 
                ? \Carbon\Carbon::parse($this->birthday)->age 
                : null,
        );
    }

    public function schedules()
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class, 'doctor_id');
    }
}
