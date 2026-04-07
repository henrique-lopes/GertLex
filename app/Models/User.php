<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'uuid', 'name', 'email', 'password',
        'oab_number', 'oab_state', 'cpf', 'phone', 'avatar_url',
        'birth_date', 'specialties', 'current_workspace_id',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'birth_date'        => 'date',
        'specialties'       => 'array',
        'password'          => 'hashed',
    ];

    public function currentWorkspace() {
        return $this->belongsTo(Workspace::class, 'current_workspace_id');
    }

    public function workspaces() {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
                    ->withPivot('role', 'is_active', 'billing_percentage', 'hourly_rate')
                    ->withTimestamps();
    }

    public function workspaceMember() {
        return $this->hasMany(WorkspaceMember::class);
    }

    public function assignedCases() {
        return $this->belongsToMany(LegalCase::class, 'case_assignments', 'user_id', 'case_id')
                    ->withPivot('role', 'billing_percentage', 'is_active')
                    ->withTimestamps();
    }

    // Role no workspace atual
    public function roleIn(int $workspaceId): ?string {
        return WorkspaceMember::where('workspace_id', $workspaceId)
            ->where('user_id', $this->id)
            ->value('role');
    }

    public function isOwnerOf(int $workspaceId): bool {
        return $this->roleIn($workspaceId) === 'owner';
    }

    public function isAdminOf(int $workspaceId): bool {
        return in_array($this->roleIn($workspaceId), ['owner', 'admin']);
    }

    // Membro atual no workspace corrente (cached)
    public function getCurrentMemberAttribute(): ?WorkspaceMember {
        return WorkspaceMember::where('workspace_id', $this->current_workspace_id)
            ->where('user_id', $this->id)
            ->first();
    }
}
