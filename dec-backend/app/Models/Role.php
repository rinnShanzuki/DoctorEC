<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $fillable = ['name'];

    protected $primaryKey = 'role_id';

    public function clientaccounts() 
    {
        return $this->hasMany(ClientAccount::class, 'role_id');
    }

    public function adminAccounts()
    {
        return $this->hasMany(AdminAccount::class, 'role_id');
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class, 'role_id');
    }
}
