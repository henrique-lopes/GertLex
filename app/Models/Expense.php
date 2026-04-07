<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Expense extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'expenses';

    protected $fillable = [
        'uuid', 'workspace_id', 'case_id', 'created_by',
        'description', 'category', 'amount', 'expense_date',
        'is_reimbursable', 'is_reimbursed', 'receipt_url', 'notes',
    ];

    protected $casts = [
        'expense_date'    => 'date',
        'amount'          => 'decimal:2',
        'is_reimbursable' => 'boolean',
        'is_reimbursed'   => 'boolean',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }
}
