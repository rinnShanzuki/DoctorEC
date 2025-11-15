<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'amount',
        'method',
        'status',
        'reference_number',
        'st_id',
        'appointment_id',
        'client_id'
    ];

    protected $primaryKey = 'payment_id';
    public function transaction()
    {
        return $this->belongsTo(SalesTransaction::class, 'sales_transaction_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }
}
