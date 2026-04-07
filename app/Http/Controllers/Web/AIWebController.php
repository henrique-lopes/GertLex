<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;

class AIWebController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('AI/Index');
    }

    public function chat(Request $request)
    {
        $request->validate([
            'messages' => 'required|array',
            'messages.*.role'    => 'required|in:user,assistant',
            'messages.*.content' => 'required|string',
        ]);

        $apiKey = config('services.anthropic.key');

        if (!$apiKey) {
            return response()->json(['error' => 'API da IA não configurada.'], 503);
        }

        $response = Http::withHeaders([
            'x-api-key'         => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type'      => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model'      => 'claude-sonnet-4-6',
            'max_tokens' => 2048,
            'system'     => 'Você é um assistente jurídico especializado no direito brasileiro. Forneça respostas precisas, citando legislação e jurisprudência quando relevante. Use linguagem formal porém clara.',
            'messages'   => $request->messages,
        ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Erro ao comunicar com a IA.'], 500);
        }

        $content = $response->json('content.0.text', '');

        return response()->json(['content' => $content]);
    }
}
