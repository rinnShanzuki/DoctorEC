<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesTransaction extends Model
{
    protected $fillable = [
        'total_amount',
        'status',
        'notes',
        'client_id',
        'admin_id',
    ];

    protected $primaryKey = 'st_id';
    
    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function admin()
    {
        return $this->belongsTo(AdminAccount::class, 'admin_id');
    }

    public function items()
    {
        return $this->hasMany(SalesItem::class, 'sales_transaction_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'sales_transaction_id');
    }
}
