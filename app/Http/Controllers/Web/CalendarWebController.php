<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\LegalCase;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Carbon\Carbon;

class CalendarWebController extends Controller
{
    private function workspaceId(Request $request): int
    {
        return $request->user()->current_workspace_id;
    }

    public function index(Request $request)
    {
        $wsId  = $this->workspaceId($request);
        $month = $request->get('month', Carbon::now()->format('Y-m'));

        [$year, $mon] = explode('-', $month);

        $events = Event::where('workspace_id', $wsId)
            ->whereYear('starts_at', $year)
            ->whereMonth('starts_at', $mon)
            ->with('legalCase:id,title,uuid')
            ->orderBy('starts_at')
            ->get();

        $cases = LegalCase::where('workspace_id', $wsId)
            ->whereNotIn('status', ['closed_won', 'closed_lost'])
            ->orderBy('title')
            ->get(['id', 'title', 'cnj_number']);

        return Inertia::render('Calendar/Index', [
            'events'  => $events,
            'cases'   => $cases,
            'month'   => $month,
        ]);
    }

    public function store(Request $request)
    {
        $wsId = $this->workspaceId($request);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'type'        => 'required|string|max:30',
            'starts_at'   => 'required|date',
            'ends_at'     => 'nullable|date|after_or_equal:starts_at',
            'all_day'     => 'boolean',
            'is_virtual'  => 'boolean',
            'location'    => 'nullable|string|max:255',
            'meeting_url' => 'nullable|string|max:500',
            'case_id'     => 'nullable|exists:cases,id',
            'alert_1d'    => 'boolean',
            'alert_5d'    => 'boolean',
            'description' => 'nullable|string',
        ]);

        Event::create([
            ...$data,
            'uuid'         => Str::uuid(),
            'workspace_id' => $wsId,
            'created_by'   => $request->user()->id,
            'status'       => 'pending',
            'alert_sent'   => false,
        ]);

        return redirect()->route('calendar.index')
            ->with('success', 'Evento criado com sucesso!');
    }

    public function update(Request $request, int $id)
    {
        $wsId  = $this->workspaceId($request);
        $event = Event::where('workspace_id', $wsId)->findOrFail($id);

        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'type'        => 'required|string|max:30',
            'starts_at'   => 'required|date',
            'ends_at'     => 'nullable|date',
            'all_day'     => 'boolean',
            'is_virtual'  => 'boolean',
            'location'    => 'nullable|string|max:255',
            'meeting_url' => 'nullable|string|max:500',
            'status'      => 'nullable|string|max:20',
            'description' => 'nullable|string',
        ]);

        $event->update($data);

        return redirect()->route('calendar.index')
            ->with('success', 'Evento atualizado!');
    }

    public function destroy(Request $request, int $id)
    {
        $wsId  = $this->workspaceId($request);
        $event = Event::where('workspace_id', $wsId)->findOrFail($id);
        $event->delete();

        return redirect()->route('calendar.index')
            ->with('success', 'Evento removido!');
    }
}
