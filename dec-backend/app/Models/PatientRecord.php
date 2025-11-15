<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientRecord extends Model
{
     protected $fillable = [
        'medical_history',
        'patient_id',
        'admin_id',
    ];

    protected $primaryKey = 'pr_id';
    
    public function patient()
    {
        return $this->belongsTo(Patient::class, 'patient_id');
    }

    public function admin()
    {
        return $this->belongsTo(AdminAccount::class, 'admin_id');
    }
}
