<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppType extends Model
{
    protected $fillable = [
        'name',
        'description'
    ];

    protected $primaryKey = 'apptype_id';

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'apptype_id');
    }
}
