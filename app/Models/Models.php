<?php
/**
 * ═══════════════════════════════════════════════════════════════
 * INSTRUÇÃO: Salve este arquivo em:
 *   app/Models/Models.php
 *
 * Cada class está aqui separada por comentário.
 * OU crie um arquivo separado por classe em app/Models/
 * ═══════════════════════════════════════════════════════════════
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// ══════════════════════════════════════════════════════
// WorkspaceMember
// ══════════════════════════════════════════════════════
class WorkspaceMember extends Model
{
    use HasFactory;

    protected $table = 'workspace_members';

    protected $fillable = [
        'workspace_id', 'user_id', 'role', 'billing_percentage',
        'hourly_rate', 'is_active', 'joined_at', 'left_at', 'permissions',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'permissions' => 'array',
        'joined_at'   => 'datetime',
        'left_at'     => 'datetime',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

// ══════════════════════════════════════════════════════
// Client
// ══════════════════════════════════════════════════════
class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clients';

    protected $fillable = [
        'uuid', 'workspace_id', 'responsible_user_id', 'type',
        'name', 'cpf', 'birth_date', 'gender', 'rg', 'nationality',
        'marital_status', 'profession',
        'company_name', 'trade_name', 'cnpj', 'state_registration',
        'email', 'phone', 'phone_secondary', 'whatsapp',
        'address_street', 'address_number', 'address_complement',
        'address_neighborhood', 'address_city', 'address_state', 'address_zipcode',
        'portal_token', 'portal_active', 'portal_last_access',
        'status', 'notes', 'origin', 'client_since',
    ];

    protected $casts = [
        'birth_date'         => 'date',
        'client_since'       => 'date',
        'portal_active'      => 'boolean',
        'portal_last_access' => 'datetime',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function responsible()
    {
        return $this->belongsTo(User::class, 'responsible_user_id');
    }

    public function cases()
    {
        return $this->hasMany(LegalCase::class, 'client_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'client_id');
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->type === 'company'
            ? ($this->trade_name ?: $this->company_name ?? $this->name)
            : $this->name;
    }
}

// ══════════════════════════════════════════════════════
// LegalCase  ← $table = 'cases' (IMPORTANTE)
// ══════════════════════════════════════════════════════
class LegalCase extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * O Laravel geraria 'legal_cases' automaticamente.
     * Definimos explicitamente 'cases' para bater com a migration.
     */
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

    // ── Relacionamentos ──────────────────────────────
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

// ══════════════════════════════════════════════════════
// CaseAssignment
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
// CaseMovement
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
// Invoice
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
// Expense
// ══════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════
// Event
// ══════════════════════════════════════════════════════
class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'events';

    protected $fillable = [
        'uuid', 'workspace_id', 'case_id', 'created_by',
        'title', 'description', 'type', 'starts_at', 'ends_at', 'all_day',
        'location', 'meeting_url', 'status',
        'alert_1d', 'alert_5d', 'alert_sent', 'google_event_id',
    ];

    protected $casts = [
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
        'all_day'    => 'boolean',
        'alert_1d'   => 'boolean',
        'alert_5d'   => 'boolean',
        'alert_sent' => 'boolean',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function participants()
    {
        return $this->belongsToMany(User::class, 'event_participants')
                    ->withPivot('status')
                    ->withTimestamps();
    }
}

// ══════════════════════════════════════════════════════
// Document
// ══════════════════════════════════════════════════════
class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'documents';

    protected $fillable = [
        'uuid', 'workspace_id', 'case_id', 'client_id', 'uploaded_by',
        'name', 'original_name', 'mime_type', 'size_bytes',
        'storage_path', 'storage_disk',
        'category', 'description', 'is_confidential', 'visible_to_client',
    ];

    protected $casts = [
        'is_confidential'   => 'boolean',
        'visible_to_client' => 'boolean',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}

// ══════════════════════════════════════════════════════
// Task
// ══════════════════════════════════════════════════════
class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tasks';

    protected $fillable = [
        'uuid', 'workspace_id', 'case_id', 'assigned_to', 'created_by',
        'title', 'description', 'priority', 'status', 'due_date', 'completed_at',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function legalCase()
    {
        return $this->belongsTo(LegalCase::class, 'case_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}
