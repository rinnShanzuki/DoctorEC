<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReservation extends Model
{
    protected $fillable = [
        'client_id',
        'product_id',
        'quantity',
        'pickup_date',
        'payment_mode',
        'status',
        'message'
    ];

    protected $primaryKey = 'prodres_id';

    public function client()
    {
        return $this->belongsTo(\App\Models\ClientAccount::class, 'client_id', 'client_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class, 'prodres_id');
    }
}
