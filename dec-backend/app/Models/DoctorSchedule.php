<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DoctorSchedule extends Model
{
    protected $fillable = [
        'schedule_date',
        'start_time',
        'end_time',
        'status',
        'doctor_id'
    ];

    protected $primaryKey = 'docsched_id';

    public function doctor()
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
