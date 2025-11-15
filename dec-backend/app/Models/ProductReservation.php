<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductReservation extends Model
{
    protected $fillable = [
        'message',
        'status',
        'client_id',
        'product_id'
    ];

    protected $primaryKey = 'prodres_id';

    public function client()
    {
        return $this->belongsTo(ClientAccount::class, 'client_id');
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
