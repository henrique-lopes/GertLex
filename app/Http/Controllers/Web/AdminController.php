<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index()
    {
        $workspaces = Workspace::withCount('members')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($ws) => [
                'id'            => $ws->id,
                'uuid'          => $ws->uuid,
                'name'          => $ws->name,
                'email'         => $ws->email,
                'plan'          => $ws->plan,
                'plan_status'   => $ws->plan_status,
                'is_active'     => $ws->is_active,
                'members_count' => $ws->members_count,
                'trial_ends_at' => $ws->trial_ends_at?->toDateString(),
                'created_at'    => $ws->created_at->toDateString(),
            ]);

        $stats = [
            'total_workspaces' => Workspace::count(),
            'active'           => Workspace::where('is_active', true)->count(),
            'trialing'         => Workspace::where('plan_status', 'trialing')->count(),
            'paid'             => Workspace::whereIn('plan', ['starter', 'pro', 'premium'])->where('plan_status', 'active')->count(),
            'total_users'      => User::count(),
        ];

        return Inertia::render('Admin/Index', compact('workspaces', 'stats'));
    }

    public function show(int $id)
    {
        $workspace = Workspace::with([
            'members.user:id,name,email,oab_number,created_at',
        ])->findOrFail($id);

        return Inertia::render('Admin/Show', ['workspace' => $workspace]);
    }

    public function updatePlan(Request $request, int $id)
    {
        $data = $request->validate([
            'plan'        => 'required|in:trial,starter,pro,premium',
            'plan_status' => 'required|in:trialing,active,suspended,canceled',
        ]);

        $workspace = Workspace::findOrFail($id);
        $limits = Workspace::PLANS[$data['plan']];

        $workspace->update([
            'plan'        => $data['plan'],
            'plan_status' => $data['plan_status'],
            'max_lawyers' => $limits['max_lawyers'],
            'max_cases'   => $limits['max_cases'],
            'has_ai'      => $limits['has_ai'],
            'is_active'   => $data['plan_status'] !== 'suspended',
        ]);

        return back()->with('success', "Plano do workspace {$workspace->name} atualizado para {$data['plan']}.");
    }

    public function toggleActive(int $id)
    {
        $workspace = Workspace::findOrFail($id);
        $workspace->update(['is_active' => !$workspace->is_active]);

        $status = $workspace->is_active ? 'ativado' : 'suspenso';
        return back()->with('success', "Workspace {$workspace->name} {$status}.");
    }
}
