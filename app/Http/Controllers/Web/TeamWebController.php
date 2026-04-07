<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\WorkspaceMember;
use App\Models\User;
use App\Models\Invoice;
use App\Models\LegalCase;
use App\Mail\MemberInviteMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class TeamWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId = $this->workspaceId($request);
        $now  = Carbon::now();

        $members = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name,email,oab_number,oab_state,specialties,avatar_url')
            ->get()
            ->map(function ($member) use ($wsId, $now) {
                $activeCases = LegalCase::where('workspace_id', $wsId)
                    ->where('responsible_user_id', $member->user_id)
                    ->whereIn('status', ['active', 'urgent', 'waiting'])
                    ->count();

                $monthRevenue = Invoice::where('workspace_id', $wsId)
                    ->where('status', 'paid')
                    ->whereYear('paid_at', $now->year)
                    ->whereMonth('paid_at', $now->month)
                    ->whereHas('legalCase', fn($q) => $q->where('responsible_user_id', $member->user_id))
                    ->sum('amount_paid');

                return [
                    'id'                 => $member->id,
                    'user_id'            => $member->user_id,
                    'role'               => $member->role,
                    'billing_percentage' => $member->billing_percentage,
                    'joined_at'          => $member->joined_at,
                    'user'               => $member->user,
                    'active_cases'       => $activeCases,
                    'month_revenue'      => (float)$monthRevenue,
                ];
            });

        return Inertia::render('Team/Index', [
            'members' => $members,
        ]);
    }

    public function invite(Request $request)
    {
        $wsId      = $this->workspaceId($request);
        $workspace = $request->user()->currentWorkspace;

        // Quota check
        if (!$workspace->canAddLawyer()) {
            return back()->with('error',
                "Limite de {$workspace->max_lawyers} advogado(s) atingido no plano atual. Faça upgrade para adicionar mais membros."
            );
        }

        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|unique:users,email',
            'role'               => 'required|in:admin,lawyer,intern,staff',
            'oab_number'         => 'nullable|string|max:20',
            'billing_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $user = User::create([
            'uuid'                 => Str::uuid(),
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'password'             => Hash::make(Str::random(32)),
            'oab_number'           => $data['oab_number'] ?? null,
            'current_workspace_id' => $wsId,
        ]);

        WorkspaceMember::create([
            'workspace_id'       => $wsId,
            'user_id'            => $user->id,
            'role'               => $data['role'],
            'is_active'          => true,
            'billing_percentage' => $data['billing_percentage'] ?? 0,
            'joined_at'          => now(),
        ]);

        // Gera token de redefinição de senha para o convite
        $token = Password::createToken($user);

        // Envia e-mail de convite
        try {
            Mail::to($user->email)->send(new MemberInviteMail($user, $workspace, $token));
        } catch (\Exception $e) {
            // Não falha o processo se o e-mail não for entregue
            \Log::warning("Falha ao enviar convite para {$user->email}: {$e->getMessage()}");
        }

        return redirect()->route('team.index')
            ->with('success', "Convite enviado para {$user->email}!");
    }

    public function update(Request $request, int $id)
    {
        $wsId   = $this->workspaceId($request);
        $member = WorkspaceMember::where('workspace_id', $wsId)->findOrFail($id);

        $data = $request->validate([
            'role'               => 'required|in:admin,lawyer,intern,staff',
            'billing_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $member->update($data);

        return redirect()->route('team.index')
            ->with('success', 'Membro atualizado com sucesso!');
    }

    public function remove(Request $request, int $id)
    {
        $wsId   = $this->workspaceId($request);
        $member = WorkspaceMember::where('workspace_id', $wsId)->findOrFail($id);

        if ($member->role === 'owner') {
            return back()->with('error', 'Não é possível remover o proprietário do escritório.');
        }

        $member->update(['is_active' => false, 'left_at' => now()]);

        return redirect()->route('team.index')
            ->with('success', 'Membro removido da equipe.');
    }
}
