<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseAssignment extends Model
{
    protected $table = 'case_assignments';

    protected $fillable = [
        'case_id', 'user_id', 'role', 'billing_percentage',
        'assigned_at', 'removed_at', 'is_active',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'removed_at'  => 'datetime',
        'is_active'   => 'boolean',
    ];

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
