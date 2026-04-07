<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
