<?php
namespace App\Services;

use App\Models\LegalCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// ══════════════════════════════════════════════════════════════
// DataJudService — Integração com API pública do CNJ
// ══════════════════════════════════════════════════════════════
class DataJudService
{
    private string $baseUrl;
    private ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.datajud.url', 'https://api-publica.datajud.cnj.jus.br');
        $this->apiKey  = config('services.datajud.key');
    }

    /**
     * Busca processo pelo número CNJ
     * Formato: 0000000-00.0000.0.00.0000
     */
    public function searchByNumber(string $cnjNumber): array
    {
        // Limpa o número
        $clean = preg_replace('/\D/', '', $cnjNumber);

        if (strlen($clean) !== 20) {
            throw new \InvalidArgumentException("Número CNJ inválido: {$cnjNumber}");
        }

        // Determina o tribunal pelo dígito de posição 14-17
        $tribunal = $this->detectTribunal($clean);
        $index    = $this->getDataJudIndex($tribunal);

        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/api_publica_{$index}/_search", [
                'query' => [
                    'match' => ['numeroProcesso' => $clean],
                ],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException("DataJud retornou erro: " . $response->status());
        }

        $hits = $response->json('hits.hits', []);

        if (empty($hits)) {
            throw new \RuntimeException("Processo não encontrado no DataJud.");
        }

        return $this->normalizeProcess($hits[0]['_source'] ?? []);
    }

    /**
     * Busca processos por OAB do advogado
     */
    public function searchByOAB(string $oabNumber, string $oabState): array
    {
        $response = Http::withHeaders($this->headers())
            ->post("{$this->baseUrl}/api_publica_tjsp/_search", [
                'size' => 50,
                'query' => [
                    'bool' => [
                        'must' => [
                            ['match' => ['numeroOABAdvogado' => $oabNumber]],
                            ['match' => ['estadoOABAdvogado' => strtoupper($oabState)]],
                        ],
                    ],
                ],
                'sort' => [['dataAjuizamento' => ['order' => 'desc']]],
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException("Erro na consulta por OAB.");
        }

        $hits = $response->json('hits.hits', []);

        return array_map(fn($hit) => $this->normalizeProcess($hit['_source'] ?? []), $hits);
    }

    /**
     * Sincroniza movimentações de um processo já cadastrado
     */
    public function syncCase(LegalCase $case): void
    {
        try {
            $data = $this->searchByNumber($case->cnj_number);

            $case->update([
                'datajud_data'       => $data,
                'datajud_synced_at'  => now(),
                'phase'              => $data['phase'] ?? $case->phase,
                'court'              => $data['court'] ?? $case->court,
            ]);

            // Salva movimentações novas
            $existingIds = $case->movements()->where('source', 'datajud')->pluck('external_id')->toArray();

            foreach ($data['movements'] ?? [] as $mov) {
                if (!in_array($mov['id'], $existingIds)) {
                    $case->movements()->create([
                        'title'       => $mov['title'],
                        'description' => $mov['description'] ?? null,
                        'source'      => 'datajud',
                        'external_id' => $mov['id'],
                        'occurred_at' => $mov['date'],
                    ]);
                }
            }

            Log::info("Processo {$case->cnj_number} sincronizado com DataJud.");

        } catch (\Exception $e) {
            Log::error("Erro ao sincronizar processo {$case->cnj_number}: " . $e->getMessage());
        }
    }

    private function normalizeProcess(array $source): array
    {
        return [
            'cnj_number'  => $source['numeroProcesso'] ?? null,
            'court'       => $source['orgaoJulgador']['nome'] ?? null,
            'tribunal'    => $source['tribunal'] ?? null,
            'phase'       => $source['fase'] ?? null,
            'filed_at'    => $source['dataAjuizamento'] ?? null,
            'subject'     => $source['assuntos'][0]['nome'] ?? null,
            'class'       => $source['classe']['nome'] ?? null,
            'movements'   => array_map(fn($m) => [
                'id'          => $m['complementosTabelados'][0]['codigo'] ?? uniqid(),
                'title'       => $m['nome'] ?? 'Movimentação',
                'description' => $m['complemento'] ?? null,
                'date'        => $m['dataHora'] ?? null,
            ], $source['movimentos'] ?? []),
            'raw' => $source,
        ];
    }

    private function detectTribunal(string $cleanNumber): string
    {
        // Posições 14-17 do número CNJ = código do tribunal
        $code = substr($cleanNumber, 13, 4);
        return match(true) {
            str_starts_with($code, '8.26') => 'tjsp',
            str_starts_with($code, '8.19') => 'tjrj',
            str_starts_with($code, '8.13') => 'tjmg',
            default => 'tjsp',
        };
    }

    private function getDataJudIndex(string $tribunal): string
    {
        return match($tribunal) {
            'tjsp' => 'tjsp',
            'tjrj' => 'tjrj',
            'tjmg' => 'tjmg',
            default => 'tjsp',
        };
    }

    private function headers(): array
    {
        $headers = ['Content-Type' => 'application/json'];
        if ($this->apiKey) {
            $headers['Authorization'] = "ApiKey {$this->apiKey}";
        }
        return $headers;
    }
}

// ══════════════════════════════════════════════════════════════
// AIService — Claude API
// ══════════════════════════════════════════════════════════════
class AIService
{
    private string $apiKey;
    private string $model;
    private string $apiUrl = 'https://api.anthropic.com/v1/messages';

    public function __construct()
    {
        $this->apiKey = config('services.anthropic.key', '');
        $this->model  = config('services.anthropic.model', 'claude-sonnet-4-20250514');
    }

    /**
     * Resume um processo juridicamente
     */
    public function summarizeCase(LegalCase $case): string
    {
        $movements = $case->movements->take(10)->map(fn($m) =>
            "- [{$m->occurred_at->format('d/m/Y')}] {$m->title}: {$m->description}"
        )->join("\n");

        $prompt = "Você é um assistente jurídico especializado. Analise o processo abaixo e forneça um resumo executivo claro e objetivo em português, destacando: situação atual, últimas movimentações, riscos identificados e próximos passos recomendados.

PROCESSO: {$case->title}
NÚMERO CNJ: {$case->cnj_number}
ÁREA: {$case->area}
FASE: {$case->phase}
VARA: {$case->court}
CLIENTE: {$case->client->name}
LADO: {$case->side}
VALOR DA CAUSA: R$ " . number_format($case->case_value, 2, ',', '.') . "

ÚLTIMAS MOVIMENTAÇÕES:
{$movements}

Forneça o resumo em formato estruturado com no máximo 300 palavras.";

        return $this->complete($prompt);
    }

    /**
     * Gera minuta de petição
     */
    public function generatePetition(string $type, array $context): string
    {
        $prompt = "Você é um advogado experiente. Redija uma {$type} profissional em português brasileiro, seguindo as normas do CPC/2015 e da OAB.

CONTEXTO:
" . json_encode($context, JSON_UNESCAPED_UNICODE) . "

Gere apenas o corpo da petição, com formatação adequada para uso profissional.";

        return $this->complete($prompt, 2000);
    }

    /**
     * Analisa risco do processo
     */
    public function analyzeRisk(LegalCase $case): array
    {
        $prompt = "Analise o risco jurídico do processo abaixo e retorne um JSON com:
- score: número de 0 a 1 (0 = sem risco, 1 = risco máximo)
- level: 'baixo', 'médio' ou 'alto'
- factors: array de fatores de risco identificados
- recommendation: texto com recomendação

PROCESSO: {$case->title} | ÁREA: {$case->area} | FASE: {$case->phase}
LADO: {$case->side} | VALOR: R$ " . number_format($case->case_value ?? 0, 2, ',', '.') . "

Retorne SOMENTE o JSON, sem texto adicional.";

        $json = $this->complete($prompt, 500);

        try {
            return json_decode($json, true) ?? ['score' => 0.5, 'level' => 'médio'];
        } catch (\Exception $e) {
            return ['score' => 0.5, 'level' => 'médio', 'factors' => [], 'recommendation' => 'Análise indisponível.'];
        }
    }

    /**
     * Chat livre com contexto jurídico
     */
    public function chat(array $messages): string
    {
        return $this->complete(
            end($messages)['content'],
            1500,
            "Você é um assistente jurídico especializado em direito brasileiro. Responda sempre em português de forma profissional e precisa. Cite legislação e jurisprudência quando relevante.",
            array_slice($messages, 0, -1)
        );
    }

    private function complete(
        string $prompt,
        int $maxTokens = 1000,
        string $system = "Você é um assistente jurídico especializado em direito brasileiro.",
        array $history = []
    ): string {
        $messages = array_merge($history, [['role' => 'user', 'content' => $prompt]]);

        $response = Http::withHeaders([
            'x-api-key'         => $this->apiKey,
            'anthropic-version' => '2023-06-01',
            'Content-Type'      => 'application/json',
        ])->post($this->apiUrl, [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'system'     => $system,
            'messages'   => $messages,
        ]);

        if (!$response->successful()) {
            Log::error('Claude API error: ' . $response->body());
            throw new \RuntimeException('Erro ao comunicar com IA: ' . $response->status());
        }

        return $response->json('content.0.text', 'Erro ao processar resposta da IA.');
    }
}
