<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'birthdate',
        'gender',
        'address',
        'customer_code',
    ];

    protected $primaryKey = 'customer_id';

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['name'];

    /**
     * Get the customer's full name.
     */
    public function getNameAttribute()
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    /**
     * Get all sales transactions for this customer.
     */
    public function salesTransactions()
    {
        return $this->hasMany(SalesTransaction::class, 'customer_id', 'customer_id');
    }
}
