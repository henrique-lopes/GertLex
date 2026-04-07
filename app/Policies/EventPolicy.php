<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    public function viewAny(User $user): bool { return true; }

    public function view(User $user, Event $event): bool
    {
        return $event->workspace_id === $user->current_workspace_id;
    }

    public function create(User $user): bool
    {
        $workspace = $user->currentWorkspace;
        return $workspace && !$workspace->isBlocked();
    }

    public function update(User $user, Event $event): bool
    {
        return $event->workspace_id === $user->current_workspace_id;
    }

    public function delete(User $user, Event $event): bool
    {
        return $event->workspace_id === $user->current_workspace_id;
    }
}
