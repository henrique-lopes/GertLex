<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
