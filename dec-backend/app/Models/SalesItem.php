<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesItem extends Model
{
    protected $fillable = [
        'product_id',
        'quantity',
        'unit_price',
        'subtotal',
        'st_id',
    ];

    protected $primaryKey = 'item_id';
    
    /**
     * Get the product for this sales item
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    /**
     * Get the transaction this item belongs to
     */
    public function transaction()
    {
        return $this->belongsTo(SalesTransaction::class, 'st_id', 'st_id');
    }
}
