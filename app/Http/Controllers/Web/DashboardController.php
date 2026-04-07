<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LegalCase;
use App\Models\Invoice;
use App\Models\Event;
use App\Models\WorkspaceMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $workspaceId = $request->user()->current_workspace_id;
        $now = Carbon::now();

        // Stats
        $activeCases = LegalCase::where('workspace_id', $workspaceId)
            ->whereIn('status', ['active', 'urgent', 'waiting'])
            ->count();

        $prevMonthCases = LegalCase::where('workspace_id', $workspaceId)
            ->whereIn('status', ['active', 'urgent', 'waiting'])
            ->where('created_at', '<', $now->copy()->startOfMonth())
            ->count();

        $mrr = Invoice::where('workspace_id', $workspaceId)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->sum('amount_paid');

        $activeLawyers = WorkspaceMember::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->whereIn('role', ['owner', 'admin', 'lawyer'])
            ->count();

        $weekEvents = Event::where('workspace_id', $workspaceId)
            ->whereBetween('starts_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])
            ->count();

        // Recent cases
        $recentCases = LegalCase::where('workspace_id', $workspaceId)
            ->with(['client:id,name,company_name,type', 'responsible:id,name'])
            ->latest()
            ->take(5)
            ->get(['id', 'uuid', 'title', 'cnj_number', 'area', 'status', 'phase', 'case_value',
                   'client_id', 'responsible_user_id', 'next_deadline']);

        // Today events
        $todayEvents = Event::where('workspace_id', $workspaceId)
            ->whereDate('starts_at', $now->toDateString())
            ->orderBy('starts_at')
            ->get(['id', 'title', 'type', 'starts_at', 'location', 'status']);

        // Upcoming deadlines (next 7 days)
        $upcomingDeadlines = LegalCase::where('workspace_id', $workspaceId)
            ->whereNotNull('next_deadline')
            ->whereBetween('next_deadline', [$now->toDateString(), $now->copy()->addDays(7)->toDateString()])
            ->whereNotIn('status', ['closed_won', 'closed_lost'])
            ->with(['client:id,name,company_name,type'])
            ->orderBy('next_deadline')
            ->get(['id', 'uuid', 'title', 'next_deadline', 'status', 'client_id']);

        // Finance chart (last 6 months)
        $financeChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $received = Invoice::where('workspace_id', $workspaceId)
                ->where('status', 'paid')
                ->whereYear('paid_at', $month->year)
                ->whereMonth('paid_at', $month->month)
                ->sum('amount_paid');

            $expenses = \App\Models\Expense::where('workspace_id', $workspaceId)
                ->whereYear('expense_date', $month->year)
                ->whereMonth('expense_date', $month->month)
                ->sum('amount');

            $financeChart[] = [
                'month'     => $month->format('M/y'),
                'received'  => (float)$received,
                'expenses'  => (float)$expenses,
            ];
        }

        return Inertia::render('Dashboard', [
            'stats' => [
                'active_cases'   => $activeCases,
                'cases_delta'    => $activeCases - $prevMonthCases,
                'mrr'            => (float)$mrr,
                'active_lawyers' => $activeLawyers,
                'week_events'    => $weekEvents,
            ],
            'recent_cases'       => $recentCases,
            'today_events'       => $todayEvents,
            'upcoming_deadlines' => $upcomingDeadlines,
            'finance_chart'      => $financeChart,
        ]);
    }
}
