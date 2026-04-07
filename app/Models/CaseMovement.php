<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CaseMovement extends Model
{
    protected $table = 'case_movements';

    protected $fillable = [
        'case_id', 'title', 'description', 'source',
        'external_id', 'occurred_at', 'created_by',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
