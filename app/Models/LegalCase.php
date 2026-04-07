<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class LegalCase extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cases';

    protected $fillable = [
        'uuid', 'workspace_id', 'client_id', 'responsible_user_id',
        'cnj_number', 'cnj_number_raw', 'title', 'area', 'action_type',
        'court', 'court_city', 'court_state', 'tribunal', 'district',
        'status', 'phase', 'side',
        'opposing_party', 'opposing_lawyer', 'opposing_oab',
        'fee_type', 'fee_amount', 'fee_success_pct', 'case_value', 'estimated_value',
        'filed_at', 'closed_at', 'next_deadline',
        'datajud_data', 'datajud_synced_at',
        'ai_summary', 'ai_summarized_at', 'ai_risk_score',
        'notes', 'tags',
    ];

    protected $casts = [
        'filed_at'          => 'date',
        'closed_at'         => 'date',
        'next_deadline'     => 'date',
        'datajud_data'      => 'array',
        'datajud_synced_at' => 'datetime',
        'ai_summarized_at'  => 'datetime',
        'tags'              => 'array',
        'fee_amount'        => 'decimal:2',
        'fee_success_pct'   => 'decimal:2',
        'case_value'        => 'decimal:2',
        'estimated_value'   => 'decimal:2',
        'ai_risk_score'     => 'decimal:2',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function responsible()
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function assignments()
    {
        return $this->hasMany(CaseAssignment::class, 'case_id');
    }

    public function lawyers()
    {
        return $this->belongsToMany(User::class, 'case_assignments', 'case_id', 'user_id')
                    ->withPivot('role', 'billing_percentage', 'is_active')
                    ->withTimestamps();
    }

    public function movements()
    {
        return $this->hasMany(CaseMovement::class, 'case_id')->orderByDesc('occurred_at');
    }

    public function documents()
    {
        return $this->hasMany(Document::class, 'case_id');
    }

    public function events()
    {
        return $this->hasMany(Event::class, 'case_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'case_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'case_id');
    }
}
