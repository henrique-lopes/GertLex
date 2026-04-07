<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'name', 'slug', 'cnpj', 'oab_seccional', 'oab_number',
        'email', 'phone', 'logo_url',
        'address_street', 'address_number', 'address_complement',
        'address_neighborhood', 'address_city', 'address_state', 'address_zipcode',
        'plan', 'plan_status', 'trial_ends_at', 'plan_expires_at',
        'asaas_customer_id', 'asaas_subscription_id',
        'max_lawyers', 'max_cases', 'has_ai', 'has_client_portal', 'has_white_label',
        'timezone', 'settings', 'is_active',
    ];

    protected $casts = [
        'settings'          => 'array',
        'has_ai'            => 'boolean',
        'has_client_portal' => 'boolean',
        'has_white_label'   => 'boolean',
        'is_active'         => 'boolean',
        'trial_ends_at'     => 'datetime',
        'plan_expires_at'   => 'datetime',
    ];

    // ── Catálogo de planos ───────────────────────────────
    public const PLANS = [
        'trial' => [
            'label'       => 'Trial',
            'price'       => 0,
            'max_lawyers' => 3,
            'max_cases'   => 20,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
            'trial_days'  => 7,
        ],
        'starter' => [
            'label'       => 'Starter',
            'price'       => 197,
            'max_lawyers' => 3,
            'max_cases'   => 100,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
        ],
        'pro' => [
            'label'       => 'Pro',
            'price'       => 397,
            'max_lawyers' => 10,
            'max_cases'   => 500,
            'has_ai'      => true,
            'has_client_portal' => false,
            'has_white_label'   => false,
        ],
        'premium' => [
            'label'       => 'Premium',
            'price'       => 797,
            'max_lawyers' => -1,
            'max_cases'   => -1,
            'has_ai'      => true,
            'has_client_portal' => true,
            'has_white_label'   => true,
        ],
    ];

    // ── Relacionamentos ──────────────────────────────────
    public function members() {
        return $this->hasMany(WorkspaceMember::class);
    }
    public function users() {
        return $this->belongsToMany(User::class, 'workspace_members')
                    ->withPivot('role', 'is_active', 'billing_percentage')
                    ->withTimestamps();
    }
    public function clients()  { return $this->hasMany(Client::class); }
    public function cases()    { return $this->hasMany(LegalCase::class); }
    public function invoices() { return $this->hasMany(Invoice::class); }
    public function expenses() { return $this->hasMany(Expense::class); }
    public function events()   { return $this->hasMany(Event::class); }

    // ── Status helpers ───────────────────────────────────
    public function isOnTrial(): bool {
        return $this->plan_status === 'trialing'
            && $this->trial_ends_at
            && $this->trial_ends_at->isFuture();
    }

    public function isTrialExpired(): bool {
        return $this->plan_status === 'trialing'
            && $this->trial_ends_at
            && $this->trial_ends_at->isPast();
    }

    public function isBlocked(): bool {
        if (!$this->is_active) return true;
        if ($this->isTrialExpired()) return true;
        if (in_array($this->plan_status, ['canceled', 'blocked'])) return true;
        return false;
    }

    public function daysRemainingInTrial(): int {
        if (!$this->isOnTrial()) return 0;
        return (int) now()->diffInDays($this->trial_ends_at, false);
    }

    public function trialAlertLevel(): ?string {
        $days = $this->daysRemainingInTrial();
        if (!$this->isOnTrial()) return null;
        if ($days <= 3)  return 'critical';
        if ($days <= 7)  return 'warning';
        if ($days <= 14) return 'info';
        return null;
    }

    // ── Feature / quota helpers ──────────────────────────
    public function hasFeature(string $feature): bool {
        return (bool) $this->{"has_{$feature}"};
    }

    public function canAddLawyer(): bool {
        return $this->max_lawyers === -1
            || $this->members()->where('role', '!=', 'owner')->where('is_active', true)->count() < $this->max_lawyers;
    }

    public function canAddCase(): bool {
        return $this->max_cases === -1
            || $this->cases()->whereNotIn('status', ['closed_won', 'closed_lost'])->count() < $this->max_cases;
    }

    public function applyPlanLimits(string $plan): void {
        $config = self::PLANS[$plan] ?? self::PLANS['starter'];
        $this->update([
            'plan'              => $plan,
            'plan_status'       => 'active',
            'max_lawyers'       => $config['max_lawyers'],
            'max_cases'         => $config['max_cases'],
            'has_ai'            => $config['has_ai'],
            'has_client_portal' => $config['has_client_portal'],
            'has_white_label'   => $config['has_white_label'],
        ]);
    }
}
