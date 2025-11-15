<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'category',
        'brand',
        'material',
        'lens_size',
        'description',
        'price',
        'image',
        'stocks'
    ];

    protected $primaryKey = 'product_id';
    public function reservations()
    {
        return $this->hasMany(ProductReservation::class, 'product_id');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class, 'product_id');
    }
}
