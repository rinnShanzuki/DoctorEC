<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientAccount extends Model
{
    protected $fillable = [
        'first_name', 
        'last_name',
        'email', 
        'password', 
        'phone', 
        'gender', 
        'profile_image', 
        'is_active',
        'role_id', 
    ];

    protected $primaryKey = 'client_id';

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
