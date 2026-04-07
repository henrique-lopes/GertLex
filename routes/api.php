<?php
// ════════════════════════════════════════════════════════════════
// routes/api.php  — API REST completa do LexFlow
// ════════════════════════════════════════════════════════════════

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\TeamController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\AIController;

// ── Autenticação (público) ──────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ── Rotas protegidas (requer token Sanctum) ─────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Processos ─────────────────────────────────────────────
    Route::prefix('cases')->group(function () {
        Route::get('/',                  [CaseController::class, 'index']);
        Route::post('/',                 [CaseController::class, 'store']);
        Route::get('/{uuid}',            [CaseController::class, 'show']);
        Route::put('/{uuid}',            [CaseController::class, 'update']);
        Route::delete('/{uuid}',         [CaseController::class, 'destroy']);

        // Busca externa CNJ
        Route::post('/search-cnj',       [CaseController::class, 'searchCNJ']);
        Route::post('/search-oab',       [CaseController::class, 'searchByOAB']);

        // Movimentações
        Route::post('/{uuid}/movements', [CaseController::class, 'addMovement']);

        // IA
        Route::post('/{uuid}/summarize', [CaseController::class, 'summarize']);
    });

    // ── Clientes ──────────────────────────────────────────────
    Route::apiResource('clients', ClientController::class)->parameters(['clients' => 'uuid']);

    // ── Equipe ────────────────────────────────────────────────
    Route::prefix('team')->group(function () {
        Route::get('/',                      [TeamController::class, 'index']);
        Route::post('/invite',               [TeamController::class, 'invite']);
        Route::put('/members/{userId}',      [TeamController::class, 'updateMember']);
        Route::get('/members/{userId}/stats',[TeamController::class, 'lawyerStats']);
    });

    // ── Financeiro ────────────────────────────────────────────
    Route::prefix('finance')->group(function () {
        Route::get('/overview',             [FinanceController::class, 'overview']);

        // Cobranças
        Route::get('/invoices',             [FinanceController::class, 'invoices']);
        Route::post('/invoices',            [FinanceController::class, 'storeInvoice']);
        Route::patch('/invoices/{uuid}/pay',[FinanceController::class, 'markPaid']);

        // Despesas
        Route::get('/expenses',             [FinanceController::class, 'expenses']);
        Route::post('/expenses',            [FinanceController::class, 'storeExpense']);
    });

    // ── Agenda e Eventos ──────────────────────────────────────
    Route::prefix('events')->group(function () {
        Route::get('/',          [EventController::class, 'index']);
        Route::post('/',         [EventController::class, 'store']);
        Route::get('/{uuid}',    [EventController::class, 'show']);
        Route::put('/{uuid}',    [EventController::class, 'update']);
        Route::delete('/{uuid}', [EventController::class, 'destroy']);
        Route::patch('/{uuid}/complete', [EventController::class, 'complete']);
    });

    // ── Documentos ────────────────────────────────────────────
    Route::prefix('documents')->group(function () {
        Route::get('/',          [DocumentController::class, 'index']);
        Route::post('/',         [DocumentController::class, 'store']);    // multipart/form-data
        Route::get('/{uuid}',    [DocumentController::class, 'show']);
        Route::delete('/{uuid}', [DocumentController::class, 'destroy']);
        Route::get('/{uuid}/download', [DocumentController::class, 'download']);
    });

    // ── Tarefas ───────────────────────────────────────────────
    Route::prefix('tasks')->group(function () {
        Route::get('/',          [TaskController::class, 'index']);
        Route::post('/',         [TaskController::class, 'store']);
        Route::put('/{uuid}',    [TaskController::class, 'update']);
        Route::delete('/{uuid}', [TaskController::class, 'destroy']);
        Route::patch('/{uuid}/complete', [TaskController::class, 'complete']);
    });

    // ── IA Jurídica ───────────────────────────────────────────
    Route::prefix('ai')->group(function () {
        Route::post('/chat',      [AIController::class, 'chat']);
        Route::post('/petition',  [AIController::class, 'generatePetition']);
        Route::post('/risk/{uuid}', [AIController::class, 'analyzeRisk']);
    });

    // ── Workspace ─────────────────────────────────────────────
    Route::prefix('workspace')->group(function () {
        Route::get('/',     fn(Request $r) => response()->json($r->user()->currentWorkspace));
        Route::put('/',     [WorkspaceController::class, 'update']);
        Route::get('/plan', [WorkspaceController::class, 'plan']);
    });
});

// ── Webhook Asaas (público, validado por assinatura) ──────────
Route::post('/webhooks/asaas', [WebhookController::class, 'asaas']);
