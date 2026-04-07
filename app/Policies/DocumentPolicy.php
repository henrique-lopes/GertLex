<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool { return true; }

    public function view(User $user, Document $document): bool
    {
        return $document->workspace_id === $user->current_workspace_id;
    }

    public function create(User $user): bool
    {
        $workspace = $user->currentWorkspace;
        return $workspace && !$workspace->isBlocked();
    }

    public function delete(User $user, Document $document): bool
    {
        return $document->workspace_id === $user->current_workspace_id;
    }
}
