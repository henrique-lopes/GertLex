<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;

class GoogleCalendarController extends Controller
{
    public function __construct(private GoogleCalendarService $google) {}

    /**
     * Redireciona para o OAuth do Google.
     */
    public function redirect(Request $request)
    {
        $state = csrf_token();
        session(['google_oauth_state' => $state]);
        return redirect($this->google->authUrl($state));
    }

    /**
     * Callback OAuth — salva tokens no usuário.
     */
    public function callback(Request $request)
    {
        if ($request->get('state') !== session('google_oauth_state')) {
            return redirect()->route('calendar.index')->with('error', 'Falha na autenticação com Google.');
        }

        if ($request->has('error')) {
            return redirect()->route('calendar.index')->with('error', 'Acesso negado pelo Google.');
        }

        $tokens = $this->google->exchangeCode($request->get('code'));

        if (!isset($tokens['access_token'])) {
            return redirect()->route('calendar.index')->with('error', 'Erro ao obter tokens do Google.');
        }

        $request->user()->update([
            'google_access_token'     => $tokens['access_token'],
            'google_refresh_token'    => $tokens['refresh_token'] ?? $request->user()->google_refresh_token,
            'google_token_expires_at' => now()->addSeconds(($tokens['expires_in'] ?? 3600) - 60),
        ]);

        // Importa eventos existentes do Google imediatamente
        $wsId    = $request->user()->current_workspace_id;
        $created = $this->google->pullEvents($request->user(), $wsId);

        return redirect()->route('calendar.index')
            ->with('success', "Google Agenda conectado! {$created} eventos importados.");
    }

    /**
     * Desconecta o Google Calendar.
     */
    public function disconnect(Request $request)
    {
        $request->user()->update([
            'google_access_token'     => null,
            'google_refresh_token'    => null,
            'google_token_expires_at' => null,
        ]);

        return redirect()->route('calendar.index')
            ->with('success', 'Google Agenda desconectado.');
    }

    /**
     * Sincronização manual — puxa eventos do Google para o GertLex.
     */
    public function sync(Request $request)
    {
        $user    = $request->user();
        $wsId    = $user->current_workspace_id;
        $created = $this->google->pullEvents($user, $wsId);

        return redirect()->route('calendar.index')
            ->with('success', "{$created} novos eventos importados do Google.");
    }
}
