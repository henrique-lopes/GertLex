<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    /**
     * Verifica se o usuário tem um dos papéis exigidos no workspace atual.
     * Uso nas rotas: ->middleware('role:owner,admin')
     */
    public function handle(Request $request, Closure $next, string ...$roles): mixed
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        $userRole = $user->roleIn($user->current_workspace_id);

        if (!in_array($userRole, $roles)) {
            abort(403, 'Acesso não permitido para seu perfil.');
        }

        return $next($request);
    }
}
