<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'category',
        'brand',
        'sex',
        'age',
        'material',
        'lens_size',
        'description',
        'price',
        'image',
        'stock',  // Changed from 'stocks' to match database column
        'shape',
        'features',
        'frame_color',
        'tint',
        'grade_info'
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
