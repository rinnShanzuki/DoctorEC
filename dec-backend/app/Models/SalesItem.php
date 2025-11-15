<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesItem extends Model
{
    protected $fillable = [
        'quantity',
        'unit_price',
        'subtotal',
        'st_id',
        'product_id',
        'prodres_id',
    ];

    protected $primaryKey = 'item_id';
    
    public function transaction()
    {
        return $this->belongsTo(SalesTransaction::class, 'st_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function reservation()
    {
        return $this->belongsTo(ProductReservation::class, 'prodres_id');
    }
}
