<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LegalCase;
use App\Models\Client;
use App\Models\WorkspaceMember;
use App\Models\CaseAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CaseWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $user     = $request->user();
        $userRole = $user->roleIn($wsId);

        $query = LegalCase::where('workspace_id', $wsId)
            ->with(['client:id,name,company_name,type', 'responsible:id,name']);

        // Advogado (lawyer/intern) vê apenas processos onde está atribuído
        if (in_array($userRole, ['lawyer', 'intern'])) {
            $query->whereHas('assignments', fn($q) =>
                $q->where('user_id', $user->id)->where('is_active', true)
            );
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('cnj_number', 'like', "%{$search}%");
            });
        }
        if ($area = $request->get('area')) {
            $query->where('area', $area);
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($lawyer = $request->get('lawyer')) {
            $query->where('responsible_user_id', $lawyer);
        }

        $cases = $query->latest()->paginate(15)->withQueryString();

        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Cases/Index', [
            'cases'   => $cases,
            'lawyers' => $lawyers,
            'filters' => $request->only(['search', 'area', 'status', 'lawyer']),
        ]);
    }

    public function create(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $clients = Client::where('workspace_id', $wsId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'company_name', 'type']);

        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name,oab_number')
            ->get()
            ->map(fn($m) => [
                'id'   => $m->user_id,
                'name' => $m->user->name ?? '',
                'oab'  => $m->user->oab_number ?? '',
            ]);

        return Inertia::render('Cases/Create', [
            'clients' => $clients,
            'lawyers' => $lawyers,
        ]);
    }

    public function store(Request $request)
    {
        $wsId      = $this->workspaceId($request);
        $workspace = $request->user()->currentWorkspace;

        if ($workspace->isBlocked()) {
            return redirect()->route('plans.index')
                ->with('error', 'Seu plano está bloqueado. Escolha um plano para continuar.');
        }

        if (!$workspace->canAddCase()) {
            return redirect()->back()
                ->with('error', "Limite de {$workspace->max_cases} processos atingido. Faça upgrade do plano.");
        }

        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'client_id'           => 'required|exists:clients,id',
            'responsible_user_id' => 'required|exists:users,id',
            'area'                => 'required|string|max:50',
            'cnj_number'          => 'nullable|string|max:30',
            'court'               => 'nullable|string|max:255',
            'court_city'          => 'nullable|string|max:100',
            'court_state'         => 'nullable|string|max:2',
            'tribunal'            => 'nullable|string|max:20',
            'status'              => 'nullable|string|max:20',
            'phase'               => 'nullable|string|max:100',
            'side'                => 'nullable|string|max:20',
            'fee_type'            => 'nullable|string|max:30',
            'fee_amount'          => 'nullable|numeric',
            'fee_success_pct'     => 'nullable|numeric',
            'case_value'          => 'nullable|numeric',
            'filed_at'            => 'nullable|date',
            'next_deadline'       => 'nullable|date',
            'notes'               => 'nullable|string',
            'lawyer_ids'          => 'nullable|array',
            'opposing_party'      => 'nullable|string|max:255',
            'opposing_lawyer'     => 'nullable|string|max:255',
            'opposing_oab'        => 'nullable|string|max:30',
        ]);

        $case = LegalCase::create([
            ...$data,
            'uuid'         => Str::uuid(),
            'workspace_id' => $wsId,
            'status'       => $data['status'] ?? 'active',
        ]);

        CaseAssignment::create([
            'case_id'            => $case->id,
            'user_id'            => $data['responsible_user_id'],
            'role'               => 'lead',
            'billing_percentage' => 0,
            'is_active'          => true,
            'assigned_at'        => now(),
        ]);

        return redirect()->route('cases.show', $case->uuid)
            ->with('success', 'Processo criado com sucesso!');
    }

    public function show(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);

        $case = LegalCase::where('workspace_id', $wsId)
            ->where('uuid', $uuid)
            ->with([
                'client',
                'responsible:id,name,oab_number,email',
                'movements.createdBy:id,name',
                'documents.uploadedBy:id,name',
                'invoices.client:id,name',
                'events',
                'tasks',
                'lawyers:id,name,oab_number',
            ])
            ->firstOrFail();

        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Cases/Show', [
            'case'    => $case,
            'lawyers' => $lawyers,
        ]);
    }

    public function edit(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);

        $case = LegalCase::where('workspace_id', $wsId)
            ->where('uuid', $uuid)
            ->firstOrFail();

        $clients = Client::where('workspace_id', $wsId)->orderBy('name')->get(['id', 'name', 'company_name', 'type']);
        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name,oab_number')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '', 'oab' => $m->user->oab_number ?? '']);

        return Inertia::render('Cases/Edit', [
            'legalCase' => $case,
            'clients'   => $clients,
            'lawyers'   => $lawyers,
        ]);
    }

    public function update(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $case = LegalCase::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'client_id'           => 'nullable|exists:clients,id',
            'responsible_user_id' => 'required|exists:users,id',
            'area'                => 'required|string|max:50',
            'cnj_number'          => 'nullable|string|max:30',
            'court'               => 'nullable|string|max:255',
            'court_city'          => 'nullable|string|max:100',
            'court_state'         => 'nullable|string|max:2',
            'tribunal'            => 'nullable|string|max:20',
            'status'              => 'required|string|max:20',
            'phase'               => 'nullable|string|max:100',
            'side'                => 'nullable|string|max:20',
            'fee_type'            => 'nullable|string|max:30',
            'fee_amount'          => 'nullable|numeric',
            'fee_success_pct'     => 'nullable|numeric',
            'case_value'          => 'nullable|numeric',
            'filed_at'            => 'nullable|date',
            'next_deadline'       => 'nullable|date',
            'notes'               => 'nullable|string',
            'opposing_party'      => 'nullable|string|max:255',
            'opposing_lawyer'     => 'nullable|string|max:255',
            'opposing_oab'        => 'nullable|string|max:30',
        ]);

        $case->update($data);

        return redirect()->route('cases.show', $case->uuid)
            ->with('success', 'Processo atualizado com sucesso!');
    }

    public function destroy(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $case = LegalCase::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();
        $this->authorize('delete', $case);
        $case->delete();

        return redirect()->route('cases.index')
            ->with('success', 'Processo removido com sucesso!');
    }
}
