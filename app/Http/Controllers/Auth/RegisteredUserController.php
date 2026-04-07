<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'required|string|lowercase|email|max:255|unique:users',
            'password'       => ['required', 'confirmed', Rules\Password::defaults()],
            'workspace_name' => 'required|string|max:255',
            'oab_number'     => 'nullable|string|max:20',
        ]);

        DB::transaction(function () use ($request) {
            $slug = Str::slug($request->workspace_name) . '-' . Str::random(4);

            $trialConfig = Workspace::PLANS['trial'];

            $workspace = Workspace::create([
                'uuid'              => Str::uuid(),
                'name'              => $request->workspace_name,
                'slug'              => $slug,
                'email'             => $request->email,
                'plan'              => 'trial',
                'plan_status'       => 'trialing',
                'trial_ends_at'     => now()->addDays($trialConfig['trial_days']),
                'max_lawyers'       => $trialConfig['max_lawyers'],
                'max_cases'         => $trialConfig['max_cases'],
                'has_ai'            => $trialConfig['has_ai'],
                'has_client_portal' => $trialConfig['has_client_portal'],
                'has_white_label'   => $trialConfig['has_white_label'],
                'timezone'          => 'America/Sao_Paulo',
                'is_active'         => true,
            ]);

            $user = User::create([
                'uuid'                 => Str::uuid(),
                'name'                 => $request->name,
                'email'                => $request->email,
                'password'             => Hash::make($request->password),
                'oab_number'           => $request->oab_number,
                'current_workspace_id' => $workspace->id,
            ]);

            WorkspaceMember::create([
                'workspace_id'       => $workspace->id,
                'user_id'            => $user->id,
                'role'               => 'owner',
                'is_active'          => true,
                'billing_percentage' => 100,
                'joined_at'          => now(),
            ]);

            event(new Registered($user));
            Auth::login($user);
        });

        return redirect(route('dashboard', absolute: false));
    }
}
