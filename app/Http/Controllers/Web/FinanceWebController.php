<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Expense;
use App\Models\Client;
use App\Models\LegalCase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class FinanceWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId = $this->workspaceId($request);
        $now  = Carbon::now();

        $received = Invoice::where('workspace_id', $wsId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->sum('amount_paid');

        $pending = Invoice::where('workspace_id', $wsId)
            ->where('status', 'pending')
            ->sum('amount');

        $overdue = Invoice::where('workspace_id', $wsId)
            ->where('status', 'pending')
            ->where('due_date', '<', $now->toDateString())
            ->sum('amount');

        $expenses = Expense::where('workspace_id', $wsId)
            ->whereBetween('expense_date', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->sum('amount');

        // Finance chart last 6 months
        $chart = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $chart[] = [
                'month'    => $month->format('M/y'),
                'received' => (float)Invoice::where('workspace_id', $wsId)->where('status', 'paid')
                    ->whereYear('paid_at', $month->year)->whereMonth('paid_at', $month->month)->sum('amount_paid'),
                'expenses' => (float)Expense::where('workspace_id', $wsId)
                    ->whereYear('expense_date', $month->year)->whereMonth('expense_date', $month->month)->sum('amount'),
            ];
        }

        // Expenses by category
        $expensesByCategory = Expense::where('workspace_id', $wsId)
            ->whereBetween('expense_date', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->get();

        // Due soon (next 7 days)
        $dueSoon = Invoice::where('workspace_id', $wsId)
            ->where('status', 'pending')
            ->whereBetween('due_date', [$now->toDateString(), $now->copy()->addDays(7)->toDateString()])
            ->with(['client:id,name,company_name,type', 'legalCase:id,title'])
            ->orderBy('due_date')
            ->take(10)
            ->get();

        return Inertia::render('Finance/Index', [
            'stats' => [
                'received' => (float)$received,
                'pending'  => (float)$pending,
                'overdue'  => (float)$overdue,
                'expenses' => (float)$expenses,
                'profit'   => (float)$received - (float)$expenses,
            ],
            'chart'               => $chart,
            'expenses_by_category'=> $expensesByCategory,
            'due_soon'            => $dueSoon,
        ]);
    }

    public function invoices(Request $request)
    {
        $wsId  = $this->workspaceId($request);
        $query = Invoice::where('workspace_id', $wsId)
            ->with(['client:id,name,company_name,type', 'legalCase:id,title,uuid']);

        if ($search = $request->get('search')) {
            $query->where('description', 'like', "%{$search}%");
        }
        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }
        if ($clientId = $request->get('client_id')) {
            $query->where('client_id', $clientId);
        }

        $invoices = $query->latest('due_date')->paginate(15)->withQueryString();
        $clients  = Client::where('workspace_id', $wsId)->orderBy('name')->get(['id', 'name', 'company_name', 'type']);

        return Inertia::render('Finance/Invoices', [
            'invoices' => $invoices,
            'clients'  => $clients,
            'filters'  => $request->only(['search', 'status', 'client_id']),
        ]);
    }

    public function storeInvoice(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $data = $request->validate([
            'client_id'   => 'required|exists:clients,id',
            'case_id'     => 'nullable|exists:cases,id',
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0',
            'due_date'    => 'required|date',
            'installments'=> 'nullable|integer|min:1|max:60',
            'notes'       => 'nullable|string',
        ]);

        $installments = (int)($data['installments'] ?? 1);

        for ($i = 1; $i <= $installments; $i++) {
            Invoice::create([
                'uuid'               => Str::uuid(),
                'workspace_id'       => $wsId,
                'client_id'          => $data['client_id'],
                'case_id'            => $data['case_id'] ?? null,
                'description'        => $data['description'],
                'amount'             => $data['amount'],
                'discount'           => 0,
                'late_fee'           => 0,
                'amount_paid'        => 0,
                'installment_number' => $i,
                'installment_total'  => $installments,
                'due_date'           => Carbon::parse($data['due_date'])->addMonths($i - 1)->toDateString(),
                'status'             => 'pending',
                'created_by'         => $request->user()->id,
                'notes'              => $data['notes'] ?? null,
            ]);
        }

        return redirect()->route('finance.invoices')
            ->with('success', 'Cobrança criada com sucesso!');
    }

    public function payInvoice(Request $request, int $id)
    {
        $wsId    = $this->workspaceId($request);
        $invoice = Invoice::where('workspace_id', $wsId)->findOrFail($id);

        $data = $request->validate([
            'payment_method' => 'required|string|max:30',
            'amount_paid'    => 'nullable|numeric|min:0',
            'paid_at'        => 'nullable|date',
        ]);

        $amountPaid = $data['amount_paid'] ?? $invoice->amount;
        $status     = $amountPaid >= $invoice->amount ? 'paid' : 'partial';

        $invoice->update([
            'status'         => $status,
            'amount_paid'    => $amountPaid,
            'paid_at'        => $data['paid_at'] ?? now()->toDateString(),
            'payment_method' => $data['payment_method'],
        ]);

        return redirect()->route('finance.invoices')
            ->with('success', 'Pagamento registrado com sucesso!');
    }

    public function expenses(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $query = Expense::where('workspace_id', $wsId);
        if ($category = $request->get('category')) {
            $query->where('category', $category);
        }
        if ($month = $request->get('month')) {
            $query->whereRaw('DATE_FORMAT(expense_date, "%Y-%m") = ?', [$month]);
        }

        $expenses = $query->latest('expense_date')->paginate(15)->withQueryString();

        return Inertia::render('Finance/Expenses', [
            'expenses' => $expenses,
            'filters'  => $request->only(['category', 'month']),
        ]);
    }

    public function storeExpense(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $data = $request->validate([
            'description'  => 'required|string|max:255',
            'category'     => 'required|string|max:50',
            'amount'       => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'notes'        => 'nullable|string',
        ]);

        Expense::create([
            ...$data,
            'uuid'            => Str::uuid(),
            'workspace_id'    => $wsId,
            'is_reimbursable' => false,
            'is_reimbursed'   => false,
            'created_by'      => $request->user()->id,
        ]);

        return redirect()->route('finance.expenses')
            ->with('success', 'Despesa registrada com sucesso!');
    }

    public function destroyExpense(Request $request, int $id)
    {
        $wsId    = $this->workspaceId($request);
        $expense = Expense::where('workspace_id', $wsId)->findOrFail($id);
        $expense->delete();

        return redirect()->route('finance.expenses')
            ->with('success', 'Despesa removida com sucesso!');
    }
}
