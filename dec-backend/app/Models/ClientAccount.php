<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;

class ClientAccount extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = [
        'first_name', 
        'last_name',
        'email', 
        'password', 
        'phone', 
        'gender', 
        'birthday',
        'profile_image', 
        'is_active',
        'role_id',
        'email_verified_at',
    ];

    protected $primaryKey = 'client_id';

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Append computed 'name' to all JSON/array representations
     * so the frontend can always use user.name
     */
    protected $appends = ['name'];

    /**
     * Full name accessor: first_name + last_name
     */
    public function getNameAttribute()
    {
        return trim(($this->first_name ?? '') . ' ' . ($this->last_name ?? ''));
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function reservations()
    {
        return $this->hasMany(ProductReservation::class, 'client_id');
    }
}
