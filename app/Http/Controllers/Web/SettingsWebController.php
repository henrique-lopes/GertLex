<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsWebController extends Controller
{
    private function workspace(Request $request): Workspace
    {
        return $request->user()->currentWorkspace;
    }

    public function index(Request $request)
    {
        return Inertia::render('Settings/Index', [
            'workspace' => $this->workspace($request),
        ]);
    }

    public function updateWorkspace(Request $request)
    {
        $workspace = $this->workspace($request);

        $data = $request->validate([
            'name'               => 'required|string|max:255',
            'email'              => 'required|email|max:255',
            'phone'              => 'nullable|string|max:20',
            'cnpj'               => 'nullable|string|max:18',
            'oab_seccional'      => 'nullable|string|max:2',
            'oab_number'         => 'nullable|string|max:20',
            'address_street'     => 'nullable|string|max:255',
            'address_number'     => 'nullable|string|max:20',
            'address_city'       => 'nullable|string|max:100',
            'address_state'      => 'nullable|string|max:2',
            'address_zipcode'    => 'nullable|string|max:10',
            'timezone'           => 'nullable|string|max:50',
        ]);

        $workspace->update($data);

        return redirect()->route('settings.index')
            ->with('success', 'Configurações atualizadas com sucesso!');
    }
}
