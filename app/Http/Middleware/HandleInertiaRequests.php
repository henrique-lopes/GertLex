<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $workspace = $request->user()?->currentWorkspace;

        return [
            ...parent::share($request),
            'auth' => [
                'user'         => $request->user(),
                'workspace'    => $workspace,
                'isSuperAdmin' => (bool) $request->user()?->is_super_admin,
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
            'trial' => $workspace ? [
                'isOnTrial'    => $workspace->isOnTrial(),
                'isExpired'    => $workspace->isTrialExpired(),
                'isBlocked'    => $workspace->isBlocked(),
                'daysRemaining'=> $workspace->daysRemainingInTrial(),
                'alertLevel'   => $workspace->trialAlertLevel(),
                'endsAt'       => $workspace->trial_ends_at?->toIso8601String(),
            ] : null,
        ];
    }
}
