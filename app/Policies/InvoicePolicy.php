<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    public function viewAny(User $user): bool { return true; }

    public function view(User $user, Invoice $invoice): bool
    {
        return $invoice->workspace_id === $user->current_workspace_id;
    }

    public function create(User $user): bool
    {
        $workspace = $user->currentWorkspace;
        return $workspace && !$workspace->isBlocked();
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $invoice->workspace_id === $user->current_workspace_id;
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $invoice->workspace_id === $user->current_workspace_id
            && in_array($user->currentMember?->role, ['owner', 'admin']);
    }
}
