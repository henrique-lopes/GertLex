<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{Client, User, WorkspaceMember, Invoice, Expense, LegalCase, Event};
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

// ══════════════════════════════════════════════════════════════
// ClientController
// ══════════════════════════════════════════════════════════════
class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::with('responsible')
            ->where('workspace_id', $request->user()->current_workspace_id);

        if ($request->search) {
            $s = $request->search;
            $query->where(fn($q) =>
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('cpf', 'like', "%{$s}%")
                  ->orWhere('cnpj', 'like', "%{$s}%")
            );
        }

        if ($request->type)   $query->where('type', $request->type);
        if ($request->status) $query->where('status', $request->status);

        return response()->json($query->orderBy('name')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'                => 'required|in:individual,company',
            'name'                => 'required|string|max:255',
            'cpf'                 => 'nullable|string|max:14',
            'email'               => 'nullable|email|max:255',
            'phone'               => 'nullable|string|max:20',
            'whatsapp'            => 'nullable|string|max:20',
            'company_name'        => 'nullable|string|max:255',
            'cnpj'                => 'nullable|string|max:18',
            'address_street'      => 'nullable|string|max:255',
            'address_number'      => 'nullable|string|max:20',
            'address_city'        => 'nullable|string|max:100',
            'address_state'       => 'nullable|string|size:2',
            'address_zipcode'     => 'nullable|string|max:9',
            'responsible_user_id' => 'nullable|exists:users,id',
            'notes'               => 'nullable|string',
            'origin'              => 'nullable|string|max:100',
        ]);

        $client = Client::create([
            ...$data,
            'uuid'         => Str::uuid(),
            'workspace_id' => $request->user()->current_workspace_id,
            'portal_token' => Str::random(32),
            'client_since' => now()->toDateString(),
        ]);

        activity()->performedOn($client)->causedBy($request->user())->log('Cliente cadastrado');

        return response()->json($client, 201);
    }

    public function show(Request $request, string $uuid)
    {
        $client = Client::with(['responsible','cases','invoices'])
            ->where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        return response()->json($client);
    }

    public function update(Request $request, string $uuid)
    {
        $client = Client::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $client->update($request->only([
            'name','email','phone','whatsapp','cpf','cnpj',
            'company_name','trade_name','address_street','address_number',
            'address_city','address_state','address_zipcode',
            'responsible_user_id','notes','status',
        ]));

        return response()->json($client);
    }

    public function destroy(Request $request, string $uuid)
    {
        $client = Client::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $client->delete();
        return response()->json(['message' => 'Cliente removido.']);
    }
}

// ══════════════════════════════════════════════════════════════
// TeamController
// ══════════════════════════════════════════════════════════════
class TeamController extends Controller
{
    public function index(Request $request)
    {
        $workspace = $request->user()->currentWorkspace;

        $members = WorkspaceMember::with('user')
            ->where('workspace_id', $workspace->id)
            ->where('is_active', true)
            ->get()
            ->map(function ($member) {
                $user   = $member->user;
                $caseCount = \App\Models\CaseAssignment::where('user_id', $user->id)->where('is_active', true)->count();

                // Faturamento do mês
                $billing = Invoice::where('status', 'paid')
                    ->whereMonth('paid_at', now()->month)
                    ->whereJsonContains('lawyer_split', [$user->id])
                    ->sum('amount_paid');

                return [
                    'id'              => $user->id,
                    'uuid'            => $user->uuid,
                    'name'            => $user->name,
                    'email'           => $user->email,
                    'oab_number'      => $user->oab_number,
                    'oab_state'       => $user->oab_state,
                    'phone'           => $user->phone,
                    'avatar_url'      => $user->avatar_url,
                    'specialties'     => $user->specialties,
                    'role'            => $member->role,
                    'billing_pct'     => $member->billing_percentage,
                    'active_cases'    => $caseCount,
                    'monthly_billing' => $billing,
                ];
            });

        return response()->json($members);
    }

    public function invite(Request $request)
    {
        $workspace = $request->user()->currentWorkspace;

        if (!$workspace->canAddLawyer()) {
            return response()->json(['message' => 'Limite de advogados atingido. Faça upgrade do plano.'], 403);
        }

        $data = $request->validate([
            'name'       => 'required|string|max:255',
            'email'      => 'required|email',
            'role'       => 'required|in:admin,lawyer,intern,staff',
            'oab_number' => 'nullable|string|max:20',
            'oab_state'  => 'nullable|string|size:2',
        ]);

        // Se usuário já existe, vincula direto
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            $tempPassword = Str::random(12);
            $user = User::create([
                'uuid'            => Str::uuid(),
                'name'            => $data['name'],
                'email'           => $data['email'],
                'password'        => Hash::make($tempPassword),
                'oab_number'      => $data['oab_number'] ?? null,
                'oab_state'       => $data['oab_state'] ?? null,
                'current_workspace_id' => $workspace->id,
            ]);
            // TODO: Enviar e-mail com senha temporária
        }

        WorkspaceMember::firstOrCreate(
            ['workspace_id' => $workspace->id, 'user_id' => $user->id],
            ['role' => $data['role'], 'is_active' => true, 'joined_at' => now()]
        );

        activity()->causedBy($request->user())->log("Membro {$user->name} adicionado à equipe");

        return response()->json(['message' => "Membro {$user->name} adicionado com sucesso.", 'user' => $user], 201);
    }

    public function updateMember(Request $request, int $userId)
    {
        $member = WorkspaceMember::where('workspace_id', $request->user()->current_workspace_id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $data = $request->validate([
            'role'               => 'sometimes|in:admin,lawyer,intern,staff',
            'billing_percentage' => 'sometimes|numeric|min:0|max:100',
            'hourly_rate'        => 'sometimes|nullable|numeric|min:0',
            'is_active'          => 'sometimes|boolean',
        ]);

        $member->update($data);

        return response()->json(['message' => 'Membro atualizado.', 'member' => $member]);
    }

    public function lawyerStats(Request $request, int $userId)
    {
        $workspaceId = $request->user()->current_workspace_id;

        $cases = LegalCase::where('workspace_id', $workspaceId)
            ->where('responsible_user_id', $userId)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $monthlyBilling = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->whereYear('paid_at', now()->year)
            ->whereMonth('paid_at', now()->month)
            ->sum('amount');

        $recentCases = LegalCase::with('client')
            ->where('workspace_id', $workspaceId)
            ->where('responsible_user_id', $userId)
            ->where('status', 'active')
            ->latest()
            ->take(5)
            ->get();

        return response()->json([
            'case_stats'      => $cases,
            'monthly_billing' => $monthlyBilling,
            'recent_cases'    => $recentCases,
        ]);
    }
}

// ══════════════════════════════════════════════════════════════
// FinanceController
// ══════════════════════════════════════════════════════════════
class FinanceController extends Controller
{
    public function overview(Request $request)
    {
        $workspaceId = $request->user()->current_workspace_id;
        $month = $request->get('month', now()->month);
        $year  = $request->get('year', now()->year);

        $received = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->whereYear('paid_at', $year)
            ->whereMonth('paid_at', $month)
            ->sum('amount_paid');

        $pending = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'pending')
            ->sum('amount');

        $overdue = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'overdue')
            ->sum('amount');

        $expenses = Expense::where('workspace_id', $workspaceId)
            ->whereYear('expense_date', $year)
            ->whereMonth('expense_date', $month)
            ->sum('amount');

        // Histórico 6 meses
        $history = collect(range(5, 0))->map(function ($monthsAgo) use ($workspaceId) {
            $date = now()->subMonths($monthsAgo);
            return [
                'month'     => $date->format('M/y'),
                'received'  => Invoice::where('workspace_id', $workspaceId)
                    ->where('status', 'paid')
                    ->whereYear('paid_at', $date->year)
                    ->whereMonth('paid_at', $date->month)
                    ->sum('amount_paid'),
                'expenses'  => Expense::where('workspace_id', $workspaceId)
                    ->whereYear('expense_date', $date->year)
                    ->whereMonth('expense_date', $date->month)
                    ->sum('amount'),
            ];
        });

        return response()->json([
            'received'  => $received,
            'pending'   => $pending,
            'overdue'   => $overdue,
            'expenses'  => $expenses,
            'profit'    => $received - $expenses,
            'history'   => $history,
        ]);
    }

    public function invoices(Request $request)
    {
        $query = Invoice::with(['client', 'case'])
            ->where('workspace_id', $request->user()->current_workspace_id);

        if ($request->status) $query->where('status', $request->status);
        if ($request->client_id) $query->where('client_id', $request->client_id);

        return response()->json($query->orderBy('due_date')->paginate(20));
    }

    public function storeInvoice(Request $request)
    {
        $data = $request->validate([
            'client_id'          => 'required|exists:clients,id',
            'case_id'            => 'nullable|exists:cases,id',
            'description'        => 'required|string|max:255',
            'amount'             => 'required|numeric|min:0.01',
            'due_date'           => 'required|date',
            'installments'       => 'nullable|integer|min:1|max:60',
            'payment_method'     => 'nullable|in:pix,boleto,credit_card,transfer,cash,check,other',
            'notes'              => 'nullable|string',
        ]);

        $installments = $data['installments'] ?? 1;
        $created = [];

        for ($i = 1; $i <= $installments; $i++) {
            $created[] = Invoice::create([
                'uuid'               => Str::uuid(),
                'workspace_id'       => $request->user()->current_workspace_id,
                'client_id'          => $data['client_id'],
                'case_id'            => $data['case_id'] ?? null,
                'description'        => $installments > 1 ? "{$data['description']} ({$i}/{$installments})" : $data['description'],
                'amount'             => round($data['amount'] / $installments, 2),
                'installment_number' => $i,
                'installment_total'  => $installments,
                'due_date'           => now()->parse($data['due_date'])->addMonths($i - 1)->toDateString(),
                'status'             => 'pending',
                'payment_method'     => $data['payment_method'] ?? null,
                'created_by'         => $request->user()->id,
                'notes'              => $data['notes'] ?? null,
            ]);
        }

        return response()->json(['invoices' => $created, 'message' => "{$installments} parcela(s) criada(s)."], 201);
    }

    public function markPaid(Request $request, string $uuid)
    {
        $invoice = Invoice::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $invoice->update([
            'status'         => 'paid',
            'amount_paid'    => $invoice->amount,
            'paid_at'        => now()->toDateString(),
            'payment_method' => $request->get('payment_method', $invoice->payment_method),
        ]);

        return response()->json(['message' => 'Pagamento registrado.', 'invoice' => $invoice]);
    }

    public function expenses(Request $request)
    {
        $query = Expense::where('workspace_id', $request->user()->current_workspace_id);
        if ($request->category) $query->where('category', $request->category);
        return response()->json($query->orderByDesc('expense_date')->paginate(20));
    }

    public function storeExpense(Request $request)
    {
        $data = $request->validate([
            'description'     => 'required|string|max:255',
            'category'        => 'required|in:office,staff,legal_costs,travel,technology,marketing,taxes,other',
            'amount'          => 'required|numeric|min:0.01',
            'expense_date'    => 'required|date',
            'case_id'         => 'nullable|exists:cases,id',
            'is_reimbursable' => 'nullable|boolean',
            'notes'           => 'nullable|string',
        ]);

        $expense = Expense::create([
            ...$data,
            'uuid'         => Str::uuid(),
            'workspace_id' => $request->user()->current_workspace_id,
            'created_by'   => $request->user()->id,
        ]);

        return response()->json($expense, 201);
    }
}

// ══════════════════════════════════════════════════════════════
// DashboardController
// ══════════════════════════════════════════════════════════════
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $workspaceId = $request->user()->current_workspace_id;
        $now = now();

        $activeCases  = LegalCase::where('workspace_id', $workspaceId)->where('status', 'active')->count();
        $urgentCases  = LegalCase::where('workspace_id', $workspaceId)->where('status', 'urgent')->count();

        $mrr = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->whereYear('paid_at', $now->year)
            ->whereMonth('paid_at', $now->month)
            ->sum('amount_paid');

        $activeTeam = WorkspaceMember::where('workspace_id', $workspaceId)->where('is_active', true)->count();

        $upcomingEvents = Event::with('case')
            ->where('workspace_id', $workspaceId)
            ->where('status', 'pending')
            ->where('starts_at', '>=', $now)
            ->where('starts_at', '<=', $now->copy()->addDays(7))
            ->orderBy('starts_at')
            ->take(10)
            ->get();

        $recentCases = LegalCase::with(['client','responsible'])
            ->where('workspace_id', $workspaceId)
            ->latest()
            ->take(5)
            ->get();

        $deadlines = LegalCase::where('workspace_id', $workspaceId)
            ->whereNotNull('next_deadline')
            ->where('next_deadline', '>=', $now->toDateString())
            ->where('next_deadline', '<=', $now->copy()->addDays(7)->toDateString())
            ->orderBy('next_deadline')
            ->with('client')
            ->take(5)
            ->get();

        return response()->json([
            'stats' => [
                'active_cases'  => $activeCases,
                'urgent_cases'  => $urgentCases,
                'mrr'           => $mrr,
                'active_team'   => $activeTeam,
            ],
            'upcoming_events' => $upcomingEvents,
            'recent_cases'    => $recentCases,
            'upcoming_deadlines' => $deadlines,
        ]);
    }
}
