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
                'workspace'    => $workspace ? [
                    'id'              => $workspace->id,
                    'name'            => $workspace->name,
                    'type'            => $workspace->type,
                    'plan'            => $workspace->plan,
                    'plan_status'     => $workspace->plan_status,
                    'has_ai'          => $workspace->has_ai,
                    'max_lawyers'     => $workspace->max_lawyers,
                    'max_cases'       => $workspace->max_cases,
                    'storage_gb'      => $workspace->storage_gb,
                    'storage_used_mb' => $workspace->storage_used_mb,
                ] : null,
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
