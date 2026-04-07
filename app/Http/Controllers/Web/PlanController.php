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

        return Inertia::render('Plans/Index', [
            'workspace'  => $workspace,
            'plans'      => Workspace::PLANS,
            'trialDays'  => $workspace->daysRemainingInTrial(),
            'blockReason'=> session('plan_block'),
        ]);
    }

    /**
     * Simula a solicitação de upgrade — em produção, aqui entraria
     * a integração com Asaas para gerar o link de pagamento.
     */
    public function requestUpgrade(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate(['plan' => 'required|in:starter,pro,premium']);

        $workspace = $request->user()->currentWorkspace;
        $plan      = Workspace::PLANS[$request->plan];

        // TODO: Integrar com Asaas para gerar checkout
        // Por ora, redireciona para WhatsApp com mensagem pré-preenchida
        $message = urlencode(
            "Olá! Tenho interesse em assinar o plano *{$plan['label']}* do LexFlow " .
            "para o escritório *{$workspace->name}*. Pode me ajudar?"
        );

        return redirect("https://wa.me/5511999999999?text={$message}");
    }
}
