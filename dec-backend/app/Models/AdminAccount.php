<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminAccount extends Model
{
    protected $fillable = [
        'email',
        'password',
        'first_name',
        'last_name',
        'position',
        'role_id'
    ];

    protected $primaryKey = 'admin_id';
    
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }
}
