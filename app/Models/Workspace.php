<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Workspace extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'type', 'name', 'slug', 'cnpj', 'oab_seccional', 'oab_number',
        'email', 'phone', 'logo_url',
        'address_street', 'address_number', 'address_complement',
        'address_neighborhood', 'address_city', 'address_state', 'address_zipcode',
        'plan', 'plan_status', 'trial_ends_at', 'plan_expires_at',
        'asaas_customer_id', 'asaas_subscription_id',
        'max_lawyers', 'max_cases', 'storage_gb', 'storage_used_mb',
        'has_ai', 'has_client_portal', 'has_white_label',
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
        // ── Planos Escritório ──────────────────────────────
        'trial' => [
            'label'       => 'Trial',
            'price'       => 0,
            'type'        => 'firm',
            'max_lawyers' => 3,
            'max_cases'   => 20,
            'storage_gb'  => 2,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
            'trial_days'  => 7,
        ],
        'starter' => [
            'label'       => 'Starter',
            'price'       => 197,
            'type'        => 'firm',
            'max_lawyers' => 3,
            'max_cases'   => 100,
            'storage_gb'  => 30,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
        ],
        'pro' => [
            'label'       => 'Pro',
            'price'       => 397,
            'type'        => 'firm',
            'max_lawyers' => 10,
            'max_cases'   => 500,
            'storage_gb'  => 100,
            'has_ai'      => true,
            'has_client_portal' => false,
            'has_white_label'   => false,
        ],
        'premium' => [
            'label'       => 'Premium',
            'price'       => 797,
            'type'        => 'firm',
            'max_lawyers' => -1,
            'max_cases'   => -1,
            'storage_gb'  => -1,
            'has_ai'      => true,
            'has_client_portal' => true,
            'has_white_label'   => true,
        ],
        // ── Planos Solo (Advogado Autônomo) ────────────────
        'solo_trial' => [
            'label'       => 'Trial',
            'price'       => 0,
            'type'        => 'solo',
            'max_lawyers' => 1,
            'max_cases'   => 20,
            'storage_gb'  => 2,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
            'trial_days'  => 7,
        ],
        'solo_starter' => [
            'label'       => 'Solo Starter',
            'price'       => 89,
            'type'        => 'solo',
            'max_lawyers' => 1,
            'max_cases'   => 50,
            'storage_gb'  => 5,
            'has_ai'      => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
        ],
        'solo_pro' => [
            'label'       => 'Solo Pro',
            'price'       => 139,
            'type'        => 'solo',
            'max_lawyers' => 1,
            'max_cases'   => -1,
            'storage_gb'  => 20,
            'has_ai'      => true,
            'has_client_portal' => false,
            'has_white_label'   => false,
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

    // ── Type helpers ─────────────────────────────────────
    public function isSolo(): bool {
        return $this->type === 'solo';
    }

    public function isFirm(): bool {
        return $this->type === 'firm';
    }

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

    public function canUploadFile(int $fileSizeBytes): bool {
        if ($this->storage_gb === -1) return true;
        $limitMb = $this->storage_gb * 1024;
        $fileMb  = $fileSizeBytes / (1024 * 1024);
        return ($this->storage_used_mb + $fileMb) <= $limitMb;
    }

    public function addStorageUsed(int $fileSizeBytes): void {
        $mb = $fileSizeBytes / (1024 * 1024);
        $this->increment('storage_used_mb', (int) ceil($mb));
    }

    public function removeStorageUsed(int $fileSizeBytes): void {
        $mb = $fileSizeBytes / (1024 * 1024);
        $this->decrement('storage_used_mb', (int) ceil($mb));
    }

    public function storageUsedPercent(): int {
        if ($this->storage_gb === -1) return 0;
        $limitMb = $this->storage_gb * 1024;
        return $limitMb > 0 ? (int) min(100, round(($this->storage_used_mb / $limitMb) * 100)) : 0;
    }

    public function applyPlanLimits(string $plan): void {
        $config = self::PLANS[$plan] ?? self::PLANS['starter'];
        $this->update([
            'plan'              => $plan,
            'plan_status'       => 'active',
            'max_lawyers'       => $config['max_lawyers'],
            'max_cases'         => $config['max_cases'],
            'storage_gb'        => $config['storage_gb'],
            'has_ai'            => $config['has_ai'],
            'has_client_portal' => $config['has_client_portal'],
            'has_white_label'   => $config['has_white_label'],
        ]);
    }
}
