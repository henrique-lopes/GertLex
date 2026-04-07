<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'invoices';

    protected $fillable = [
        'uuid', 'workspace_id', 'fee_agreement_id', 'case_id', 'client_id',
        'description', 'installment_number', 'installment_total',
        'amount', 'discount', 'late_fee', 'amount_paid',
        'due_date', 'paid_at', 'status', 'payment_method',
        'asaas_payment_id', 'asaas_invoice_url', 'asaas_pix_key', 'asaas_barcode',
        'lawyer_split', 'created_by', 'notes',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'paid_at'      => 'date',
        'lawyer_split' => 'array',
        'amount'       => 'decimal:2',
        'discount'     => 'decimal:2',
        'late_fee'     => 'decimal:2',
        'amount_paid'  => 'decimal:2',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function getNetAmountAttribute(): float
    {
        return (float)$this->amount - (float)$this->discount + (float)$this->late_fee;
    }

    public function getRemainingAttribute(): float
    {
        return max(0, $this->net_amount - (float)$this->amount_paid);
    }
}
