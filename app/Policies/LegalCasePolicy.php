<?php

namespace App\Policies;

use App\Models\LegalCase;
use App\Models\User;

class LegalCasePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, LegalCase $case): bool
    {
        return $case->workspace_id === $user->current_workspace_id;
    }

    public function create(User $user): bool
    {
        $workspace = $user->currentWorkspace;
        if (!$workspace || $workspace->isBlocked()) return false;

        if (!$workspace->canAddCase()) {
            throw new \App\Exceptions\QuotaExceededException(
                "Limite de {$workspace->max_cases} processos atingido. Faça upgrade do seu plano."
            );
        }

        return true;
    }

    public function update(User $user, LegalCase $case): bool
    {
        return $case->workspace_id === $user->current_workspace_id;
    }

    public function delete(User $user, LegalCase $case): bool
    {
        return $case->workspace_id === $user->current_workspace_id
            && in_array($user->currentMember?->role, ['owner', 'admin']);
    }
}
