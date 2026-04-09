<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->currentWorkspace;
        $isSolo    = $workspace->type === 'solo';

        // Filtra planos pelo tipo do workspace
        $planKeys = $isSolo
            ? ['solo_trial', 'solo_starter', 'solo_pro']
            : ['trial', 'starter', 'pro', 'premium'];

        $plans = collect(Workspace::PLANS)
            ->only($planKeys)
            ->toArray();

        return Inertia::render('Plans/Index', [
            'workspace'    => array_merge($workspace->toArray(), [
                'storage_used_percent' => $workspace->storageUsedPercent(),
            ]),
            'plans'        => $plans,
            'isSolo'       => $isSolo,
            'trialDays'    => $workspace->daysRemainingInTrial(),
            'blockReason'  => session('plan_block'),
        ]);
    }

    /**
     * Simula a solicitação de upgrade — em produção, aqui entraria
     * a integração com Asaas para gerar o link de pagamento.
     */
    public function requestUpgrade(Request $request): \Illuminate\Http\RedirectResponse
    {
        $validPlans = array_keys(Workspace::PLANS);
        $request->validate(['plan' => 'required|in:' . implode(',', $validPlans)]);

        $workspace = $request->user()->currentWorkspace;
        $plan      = Workspace::PLANS[$request->plan];

        // TODO: Integrar com Asaas para gerar checkout
        $message = urlencode(
            "Olá! Tenho interesse em assinar o plano *{$plan['label']}* do GertLex " .
            "para o escritório *{$workspace->name}*. Pode me ajudar?"
        );

        return redirect("https://wa.me/5511999999999?text={$message}");
    }
}
