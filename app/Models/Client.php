<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
