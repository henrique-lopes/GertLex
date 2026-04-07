<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LegalCase;
use App\Models\CaseMovement;
use App\Services\DataJudService;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CaseController extends Controller
{
    public function __construct(
        private DataJudService $datajud,
        private AIService $ai
    ) {}

    // GET /api/cases
    public function index(Request $request)
    {
        $workspace = $request->user()->currentWorkspace;

        $query = LegalCase::with(['client', 'responsible', 'lawyers'])
            ->where('workspace_id', $workspace->id);

        // Filtros
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('cnj_number', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->status)      $query->where('status', $request->status);
        if ($request->area)        $query->where('area', $request->area);
        if ($request->lawyer_id)   $query->whereHas('lawyers', fn($q) => $q->where('users.id', $request->lawyer_id));
        if ($request->client_id)   $query->where('client_id', $request->client_id);

        // Ordenação
        $sortBy  = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        return response()->json(
            $query->paginate($request->get('per_page', 20))
        );
    }

    // POST /api/cases
    public function store(Request $request)
    {
        $workspace = $request->user()->currentWorkspace;

        // Verifica limite do plano
        if (!$workspace->canAddCase()) {
            return response()->json([
                'message' => 'Limite de processos do plano atingido. Faça upgrade para continuar.',
            ], 403);
        }

        $data = $request->validate([
            'client_id'           => 'required|exists:clients,id',
            'title'               => 'required|string|max:255',
            'cnj_number'          => 'nullable|string|max:30',
            'area'                => 'required|in:civil,trabalhista,criminal,empresarial,tributario,familia,previdenciario,administrativo,ambiental,consumidor,outro',
            'action_type'         => 'nullable|string',
            'court'               => 'nullable|string|max:255',
            'court_city'          => 'nullable|string|max:100',
            'court_state'         => 'nullable|string|size:2',
            'tribunal'            => 'nullable|string|max:20',
            'status'              => 'nullable|in:active,waiting,urgent,suspended,archived,closed_won,closed_lost',
            'phase'               => 'nullable|string|max:100',
            'side'                => 'nullable|in:author,defendant,third_party',
            'opposing_party'      => 'nullable|string|max:255',
            'opposing_lawyer'     => 'nullable|string|max:255',
            'opposing_oab'        => 'nullable|string|max:30',
            'fee_type'            => 'nullable|in:fixed,success,fixed_success,hourly,pro_bono',
            'fee_amount'          => 'nullable|numeric|min:0',
            'fee_success_pct'     => 'nullable|numeric|min:0|max:100',
            'case_value'          => 'nullable|numeric|min:0',
            'filed_at'            => 'nullable|date',
            'next_deadline'       => 'nullable|date',
            'responsible_user_id' => 'nullable|exists:users,id',
            'notes'               => 'nullable|string',
            'tags'                => 'nullable|array',
            'lawyer_ids'          => 'nullable|array',
        ]);

        $case = LegalCase::create([
            ...$data,
            'uuid'         => Str::uuid(),
            'workspace_id' => $workspace->id,
            'status'       => $data['status'] ?? 'active',
            'cnj_number_raw' => $data['cnj_number'] ? preg_replace('/\D/', '', $data['cnj_number']) : null,
        ]);

        // Atribuir advogados
        if (!empty($data['lawyer_ids'])) {
            foreach ($data['lawyer_ids'] as $lawyerId) {
                $case->assignments()->create([
                    'user_id'    => $lawyerId,
                    'role'       => 'support',
                    'is_active'  => true,
                    'assigned_at'=> now(),
                ]);
            }
        }

        // Busca dados no DataJud automaticamente
        if ($case->cnj_number) {
            dispatch(fn() => $this->datajud->syncCase($case))->afterResponse();
        }

        activity()
            ->performedOn($case)
            ->causedBy($request->user())
            ->log('Processo cadastrado');

        return response()->json($case->load(['client','responsible','lawyers','movements']), 201);
    }

    // GET /api/cases/{uuid}
    public function show(Request $request, string $uuid)
    {
        $case = LegalCase::with([
            'client', 'responsible', 'lawyers', 'movements',
            'documents', 'events', 'invoices', 'tasks',
        ])
        ->where('uuid', $uuid)
        ->where('workspace_id', $request->user()->current_workspace_id)
        ->firstOrFail();

        return response()->json($case);
    }

    // PUT /api/cases/{uuid}
    public function update(Request $request, string $uuid)
    {
        $case = LegalCase::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $data = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'status'              => 'sometimes|in:active,waiting,urgent,suspended,archived,closed_won,closed_lost',
            'phase'               => 'sometimes|nullable|string|max:100',
            'court'               => 'sometimes|nullable|string|max:255',
            'court_city'          => 'sometimes|nullable|string|max:100',
            'court_state'         => 'sometimes|nullable|string|size:2',
            'responsible_user_id' => 'sometimes|nullable|exists:users,id',
            'fee_type'            => 'sometimes|in:fixed,success,fixed_success,hourly,pro_bono',
            'fee_amount'          => 'sometimes|nullable|numeric',
            'fee_success_pct'     => 'sometimes|nullable|numeric',
            'case_value'          => 'sometimes|nullable|numeric',
            'next_deadline'       => 'sometimes|nullable|date',
            'closed_at'           => 'sometimes|nullable|date',
            'notes'               => 'sometimes|nullable|string',
            'tags'                => 'sometimes|nullable|array',
        ]);

        $case->update($data);

        activity()->performedOn($case)->causedBy($request->user())->log('Processo atualizado');

        return response()->json($case->load(['client','responsible','lawyers']));
    }

    // DELETE /api/cases/{uuid}
    public function destroy(Request $request, string $uuid)
    {
        $case = LegalCase::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $case->delete();

        return response()->json(['message' => 'Processo arquivado com sucesso.']);
    }

    // POST /api/cases/search-cnj
    public function searchCNJ(Request $request)
    {
        $request->validate(['cnj_number' => 'required|string']);

        try {
            $data = $this->datajud->searchByNumber($request->cnj_number);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Processo não encontrado no DataJud.', 'error' => $e->getMessage()], 404);
        }
    }

    // POST /api/cases/search-oab
    public function searchByOAB(Request $request)
    {
        $request->validate([
            'oab_number' => 'required|string',
            'oab_state'  => 'required|string|size:2',
        ]);

        try {
            $data = $this->datajud->searchByOAB($request->oab_number, $request->oab_state);
            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erro ao consultar OAB.', 'error' => $e->getMessage()], 500);
        }
    }

    // POST /api/cases/{uuid}/summarize
    public function summarize(Request $request, string $uuid)
    {
        $workspace = $request->user()->currentWorkspace;

        if (!$workspace->has_ai) {
            return response()->json(['message' => 'IA disponível apenas no plano Premium.'], 403);
        }

        $case = LegalCase::with(['client','movements'])
            ->where('uuid', $uuid)
            ->where('workspace_id', $workspace->id)
            ->firstOrFail();

        $summary = $this->ai->summarizeCase($case);
        $case->update(['ai_summary' => $summary, 'ai_summarized_at' => now()]);

        return response()->json(['summary' => $summary]);
    }

    // POST /api/cases/{uuid}/movements
    public function addMovement(Request $request, string $uuid)
    {
        $case = LegalCase::where('uuid', $uuid)
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->firstOrFail();

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'occurred_at' => 'required|date',
        ]);

        $movement = $case->movements()->create([
            ...$data,
            'source'     => 'manual',
            'created_by' => $request->user()->id,
        ]);

        return response()->json($movement, 201);
    }
}
