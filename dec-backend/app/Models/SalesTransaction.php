<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesTransaction extends Model
{
    protected $fillable = [
        'customer_name',
        'total_amount',
        'amount_tendered',
        'change_amount',
        'payment_method',
        'receipt_number',
        'transaction_date',
        'customer_id',
    ];

    protected $primaryKey = 'st_id';
    
    /**
     * Get the customer for this transaction
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    /**
     * Get all sales items (products) for this transaction
     */
    public function items()
    {
        return $this->hasMany(SalesItem::class, 'st_id', 'st_id');
    }

    /**
     * Get all sales services for this transaction
     */
    public function services()
    {
        return $this->hasMany(SalesService::class, 'st_id', 'st_id');
    }
}
