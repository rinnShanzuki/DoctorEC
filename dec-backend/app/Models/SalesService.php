<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesService extends Model
{
    protected $fillable = [
        'service_id',
        'number_of_sessions',
        'unit_price',
        'subtotal',
        'st_id',
    ];

    protected $primaryKey = 'sservice_id';
    
    /**
     * Get the service for this sales service
     */
    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id', 'service_id');
    }

    /**
     * Get the transaction this service belongs to
     */
    public function transaction()
    {
        return $this->belongsTo(SalesTransaction::class, 'st_id', 'st_id');
    }
}
