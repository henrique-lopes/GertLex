<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWorkspaceActive
{
    // Rotas liberadas mesmo com workspace bloqueado
    private const ALLOWED_ROUTES = [
        'plans.index',
        'settings.index',
        'settings.workspace.update',
        'settings.profile.update',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // Super admin sem workspace só acessa /admin e /configuracoes
        if ($request->user()?->is_super_admin) {
            if (!$request->user()->currentWorkspace) {
                if ($request->routeIs('settings.index', 'settings.profile.update')) {
                    return $next($request);
                }
                return redirect('/admin');
            }
            return $next($request);
        }

        $workspace = $request->user()?->currentWorkspace;

        if (!$workspace) {
            return $next($request);
        }

        if ($workspace->isBlocked()) {
            // Permite acessar a página de planos e configurações
            if ($request->routeIs(...self::ALLOWED_ROUTES)) {
                return $next($request);
            }

            $reason = $workspace->isTrialExpired()
                ? 'Seu período de trial expirou. Escolha um plano para continuar.'
                : 'Seu acesso foi suspenso. Regularize sua assinatura para continuar.';

            return redirect()->route('plans.index')
                ->with('plan_block', $reason);
        }

        return $next($request);
    }
}
