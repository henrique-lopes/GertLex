<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
