<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool  { return true; }

    public function view(User $user, Client $client): bool
    {
        return $client->workspace_id === $user->current_workspace_id;
    }

    public function create(User $user): bool
    {
        $workspace = $user->currentWorkspace;
        return $workspace && !$workspace->isBlocked();
    }

    public function update(User $user, Client $client): bool
    {
        return $client->workspace_id === $user->current_workspace_id;
    }

    public function delete(User $user, Client $client): bool
    {
        return $client->workspace_id === $user->current_workspace_id
            && in_array($user->currentMember?->role, ['owner', 'admin']);
    }
}
