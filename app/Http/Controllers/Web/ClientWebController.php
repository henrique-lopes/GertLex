<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClientWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $query = Client::where('workspace_id', $wsId)
            ->with('responsible:id,name');

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('cpf', 'like', "%{$search}%")
                  ->orWhere('cnpj', 'like', "%{$search}%");
            });
        }
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        $clients = $query->withCount('cases')->latest()->paginate(15)->withQueryString();

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'filters' => $request->only(['search', 'type', 'status']),
        ]);
    }

    public function create(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Clients/Create', [
            'lawyers' => $lawyers,
        ]);
    }

    public function store(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $data = $request->validate([
            'type'                => 'required|in:individual,company',
            'name'                => 'required|string|max:255',
            'email'               => 'nullable|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'cpf'                 => 'nullable|string|max:14',
            'cnpj'                => 'nullable|string|max:18',
            'company_name'        => 'nullable|string|max:255',
            'trade_name'          => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'address_street'      => 'nullable|string|max:255',
            'address_number'      => 'nullable|string|max:20',
            'address_complement'  => 'nullable|string|max:100',
            'address_neighborhood'=> 'nullable|string|max:100',
            'address_city'        => 'nullable|string|max:100',
            'address_state'       => 'nullable|string|max:2',
            'address_zipcode'     => 'nullable|string|max:10',
            'notes'               => 'nullable|string',
            'origin'              => 'nullable|string|max:50',
        ]);

        $client = Client::create([
            ...$data,
            'uuid'                => Str::uuid(),
            'workspace_id'        => $wsId,
            'responsible_user_id' => $data['responsible_user_id'] ?? $request->user()->id,
            'status'              => 'active',
            'portal_token'        => Str::random(32),
            'client_since'        => now()->toDateString(),
        ]);

        return redirect()->route('clients.show', $client->uuid)
            ->with('success', 'Cliente cadastrado com sucesso!');
    }

    public function show(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);

        $client = Client::where('workspace_id', $wsId)
            ->where('uuid', $uuid)
            ->with([
                'responsible:id,name',
                'cases:id,uuid,title,area,status,phase,case_value,responsible_user_id',
                'invoices' => fn($q) => $q->latest()->take(10),
            ])
            ->firstOrFail();

        return Inertia::render('Clients/Show', [
            'client' => $client,
        ]);
    }

    public function edit(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();
        $lawyers = WorkspaceMember::where('workspace_id', $wsId)
            ->where('is_active', true)
            ->with('user:id,name')
            ->get()
            ->map(fn($m) => ['id' => $m->user_id, 'name' => $m->user->name ?? '']);

        return Inertia::render('Clients/Edit', [
            'client'  => $client,
            'lawyers' => $lawyers,
        ]);
    }

    public function update(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'nullable|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'cpf'                 => 'nullable|string|max:14',
            'cnpj'                => 'nullable|string|max:18',
            'company_name'        => 'nullable|string|max:255',
            'trade_name'          => 'nullable|string|max:255',
            'responsible_user_id' => 'nullable|exists:users,id',
            'address_street'      => 'nullable|string|max:255',
            'address_number'      => 'nullable|string|max:20',
            'address_complement'  => 'nullable|string|max:100',
            'address_neighborhood'=> 'nullable|string|max:100',
            'address_city'        => 'nullable|string|max:100',
            'address_state'       => 'nullable|string|max:2',
            'address_zipcode'     => 'nullable|string|max:10',
            'status'              => 'nullable|in:active,inactive,suspended',
            'notes'               => 'nullable|string',
        ]);

        $client->update($data);

        return redirect()->route('clients.show', $client->uuid)
            ->with('success', 'Cliente atualizado com sucesso!');
    }

    public function destroy(Request $request, string $uuid)
    {
        $wsId = $this->workspaceId($request);
        $client = Client::where('workspace_id', $wsId)->where('uuid', $uuid)->firstOrFail();
        $client->delete();

        return redirect()->route('clients.index')
            ->with('success', 'Cliente removido com sucesso!');
    }
}
