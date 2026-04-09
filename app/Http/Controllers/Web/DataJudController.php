<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LegalCase;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DataJudController extends Controller
{
    private const API_URL = 'https://api-publica.datajud.cnj.jus.br';

    /**
     * Busca processos pelo número OAB do advogado via DataJud CNJ.
     */
    public function searchByOAB(Request $request)
    {
        $request->validate([
            'oab_number'   => 'required|string|max:20',
            'oab_state'    => 'required|string|size:2',
            'tribunal'     => 'required|string|max:20',
        ]);

        $apiKey = config('services.datajud.api_key');
        $oab    = strtoupper(trim($request->oab_number));
        $state  = strtoupper($request->oab_state);
        $index  = $this->tribunalIndex($request->tribunal);

        $response = Http::withHeaders([
            'Authorization' => "APIKey {$apiKey}",
            'Content-Type'  => 'application/json',
        ])->post(self::API_URL . "/api_publica_{$index}/_search", [
            'query' => [
                'nested' => [
                    'path'  => 'partes',
                    'query' => [
                        'nested' => [
                            'path'  => 'partes.advocacia',
                            'query' => [
                                'bool' => [
                                    'must' => [
                                        ['match' => ['partes.advocacia.OAB'    => $oab]],
                                        ['match' => ['partes.advocacia.estado' => $state]],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
            'size' => 50,
            '_source' => [
                'numeroProcesso', 'classe.nome', 'assuntos',
                'orgaoJulgador.nome', 'tribunal', 'dataAjuizamento',
                'partes',
            ],
        ]);

        if (!$response->successful()) {
            return response()->json([
                'error' => 'Erro ao consultar DataJud. Verifique a chave de API.',
            ], 422);
        }

        $hits = $response->json('hits.hits', []);

        $cases = collect($hits)->map(function ($hit) {
            $src = $hit['_source'];
            return [
                'cnj_number' => $src['numeroProcesso'] ?? null,
                'title'      => $src['classe']['nome'] ?? 'Processo sem título',
                'tribunal'   => $src['tribunal'] ?? null,
                'court'      => $src['orgaoJulgador']['nome'] ?? null,
                'filed_at'   => isset($src['dataAjuizamento'])
                    ? substr($src['dataAjuizamento'], 0, 10)
                    : null,
                'parties'    => collect($src['partes'] ?? [])->map(fn($p) => [
                    'name' => $p['nome']  ?? '',
                    'type' => $p['polo']  ?? $p['tipo'] ?? '',
                ])->values(),
            ];
        });

        return response()->json(['cases' => $cases]);
    }

    /**
     * Importa um processo do DataJud para o workspace.
     */
    public function importCase(Request $request)
    {
        $request->validate([
            'cnj_number'      => 'required|string|max:30',
            'title'           => 'required|string|max:255',
            'tribunal'        => 'nullable|string|max:20',
            'court'           => 'nullable|string|max:255',
            'filed_at'        => 'nullable|date',
            'client_id'       => 'nullable|exists:clients,id',
            'opposing_party'  => 'nullable|string|max:255',
        ]);

        $wsId      = $request->user()->current_workspace_id;
        $workspace = $request->user()->currentWorkspace;

        if (!$workspace->canAddCase()) {
            return response()->json([
                'error' => "Limite de {$workspace->max_cases} processos atingido.",
            ], 422);
        }

        // Evita duplicata
        $exists = LegalCase::where('workspace_id', $wsId)
            ->where('cnj_number', $request->cnj_number)
            ->exists();

        if ($exists) {
            return response()->json(['error' => 'Este processo já foi importado.'], 422);
        }

        $case = LegalCase::create([
            'uuid'               => Str::uuid(),
            'workspace_id'       => $wsId,
            'client_id'          => $request->client_id,
            'responsible_user_id'=> $request->user()->id,
            'cnj_number'         => $request->cnj_number,
            'title'              => $request->title,
            'tribunal'           => $request->tribunal,
            'court'              => $request->court,
            'filed_at'           => $request->filed_at,
            'opposing_party'     => $request->opposing_party,
            'area'               => 'civil',
            'status'             => 'active',
            'side'               => 'author',
        ]);

        return response()->json([
            'message' => 'Processo importado com sucesso!',
            'uuid'    => $case->uuid,
        ]);
    }

    private function tribunalIndex(string $tribunal): string
    {
        return match(strtoupper($tribunal)) {
            'TJSP'  => 'tjsp',
            'TJRJ'  => 'tjrj',
            'TJMG'  => 'tjmg',
            'TJRS'  => 'tjrs',
            'TJPR'  => 'tjpr',
            'TJSC'  => 'tjsc',
            'TJBA'  => 'tjba',
            'TJPE'  => 'tjpe',
            'TJCE'  => 'tjce',
            'TJGO'  => 'tjgo',
            'TRT2'  => 'trt2',
            'TRT15' => 'trt15',
            'STJ'   => 'stj',
            'STF'   => 'stf',
            default => strtolower($tribunal),
        };
    }
}
