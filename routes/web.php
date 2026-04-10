<?php
// ════════════════════════════════════════════════════════════════
// routes/web.php — Rotas Inertia.js (frontend React)
// ════════════════════════════════════════════════════════════════

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\CaseWebController;
use App\Http\Controllers\Web\ClientWebController;
use App\Http\Controllers\Web\TeamWebController;
use App\Http\Controllers\Web\FinanceWebController;
use App\Http\Controllers\Web\CalendarWebController;
use App\Http\Controllers\Web\DocumentWebController;
use App\Http\Controllers\Web\AIWebController;
use App\Http\Controllers\Web\SettingsWebController;
use App\Http\Controllers\Web\PlanController;
use App\Http\Controllers\Web\AdminController;
use App\Http\Controllers\Web\DataJudController;
use App\Http\Controllers\Web\GoogleCalendarController;

// ── Super Admin ─────────────────────────────────────────────────
Route::middleware(['auth', 'super.admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/',                         [AdminController::class, 'index'])->name('index');
    Route::get('/workspaces/{id}',          [AdminController::class, 'show'])->name('workspaces.show');
    Route::put('/workspaces/{id}/plan',     [AdminController::class, 'updatePlan'])->name('workspaces.plan');
    Route::post('/workspaces/{id}/toggle',  [AdminController::class, 'toggleActive'])->name('workspaces.toggle');
});

// ── App (protegido) ─────────────────────────────────────────────
Route::middleware(['auth', 'verified'])->group(function () {

    // Planos (acessível mesmo com workspace bloqueado)
    Route::get('/planos',          [PlanController::class, 'index'])->name('plans.index');
    Route::post('/planos/upgrade', [PlanController::class, 'requestUpgrade'])->name('plans.upgrade');

    // Google OAuth callback (sem workspace.active)
    Route::get('/auth/google/callback', [GoogleCalendarController::class, 'callback'])->name('google.calendar.callback');

    // Demais rotas — verificam workspace ativo
    Route::middleware('workspace.active')->group(function () {

        // Dashboard
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // DataJud
        Route::post('/datajud/buscar-oab',  [DataJudController::class, 'searchByOAB'])->name('datajud.search');
        Route::post('/datajud/importar',    [DataJudController::class, 'importCase'])->name('datajud.import');

        // Processos
        Route::get('/processos',                 [CaseWebController::class, 'index'])->name('cases.index');
        Route::get('/processos/novo',            [CaseWebController::class, 'create'])->name('cases.create');
        Route::post('/processos',                [CaseWebController::class, 'store'])->name('cases.store');
        Route::get('/processos/{uuid}',          [CaseWebController::class, 'show'])->name('cases.show');
        Route::get('/processos/{uuid}/editar',   [CaseWebController::class, 'edit'])->name('cases.edit');
        Route::put('/processos/{uuid}',          [CaseWebController::class, 'update'])->name('cases.update');
        Route::delete('/processos/{uuid}',       [CaseWebController::class, 'destroy'])->name('cases.destroy');

        // Clientes
        Route::get('/clientes',                  [ClientWebController::class, 'index'])->name('clients.index');
        Route::get('/clientes/novo',             [ClientWebController::class, 'create'])->name('clients.create');
        Route::post('/clientes',                 [ClientWebController::class, 'store'])->name('clients.store');
        Route::post('/clientes/extrair-procuracao', [ClientWebController::class, 'extractFromProcuracao'])->name('clients.extract');
        Route::get('/clientes/{uuid}',           [ClientWebController::class, 'show'])->name('clients.show');
        Route::get('/clientes/{uuid}/editar',    [ClientWebController::class, 'edit'])->name('clients.edit');
        Route::put('/clientes/{uuid}',           [ClientWebController::class, 'update'])->name('clients.update');
        Route::delete('/clientes/{uuid}',        [ClientWebController::class, 'destroy'])->name('clients.destroy');

        // Equipe — apenas owner e admin
        Route::middleware('role:owner,admin')->group(function () {
            Route::get('/equipe',                [TeamWebController::class, 'index'])->name('team.index');
            Route::post('/equipe/convidar',      [TeamWebController::class, 'invite'])->name('team.invite');
            Route::put('/equipe/{id}',           [TeamWebController::class, 'update'])->name('team.update');
            Route::delete('/equipe/{id}',        [TeamWebController::class, 'remove'])->name('team.remove');
        });

        // Financeiro — apenas owner e admin
        Route::middleware('role:owner,admin')->group(function () {
            Route::get('/financeiro',                    [FinanceWebController::class, 'index'])->name('finance.index');
            Route::get('/financeiro/faturas',            [FinanceWebController::class, 'invoices'])->name('finance.invoices');
            Route::post('/financeiro/faturas',           [FinanceWebController::class, 'storeInvoice'])->name('finance.invoices.store');
            Route::put('/financeiro/faturas/{id}/pagar', [FinanceWebController::class, 'payInvoice'])->name('finance.invoices.pay');
            Route::get('/financeiro/despesas',           [FinanceWebController::class, 'expenses'])->name('finance.expenses');
            Route::post('/financeiro/despesas',          [FinanceWebController::class, 'storeExpense'])->name('finance.expenses.store');
            Route::delete('/financeiro/despesas/{id}',   [FinanceWebController::class, 'destroyExpense'])->name('finance.expenses.destroy');
        });

        // Agenda
        Route::get('/agenda',                    [CalendarWebController::class, 'index'])->name('calendar.index');
        Route::post('/agenda',                   [CalendarWebController::class, 'store'])->name('calendar.store');

        // Google Calendar (deve vir antes de /agenda/{id})
        Route::get('/agenda/google/conectar',    [GoogleCalendarController::class, 'redirect'])->name('google.calendar.redirect');
        Route::get('/agenda/google/desconectar', [GoogleCalendarController::class, 'disconnect'])->name('google.calendar.disconnect');
        Route::get('/agenda/google/sincronizar', [GoogleCalendarController::class, 'sync'])->name('google.calendar.sync');

        Route::put('/agenda/{id}',               [CalendarWebController::class, 'update'])->name('calendar.update');
        Route::delete('/agenda/{id}',            [CalendarWebController::class, 'destroy'])->name('calendar.destroy');

        // Documentos
        Route::get('/documentos',                [DocumentWebController::class, 'index'])->name('documents.index');
        Route::post('/documentos',               [DocumentWebController::class, 'store'])->name('documents.store');
        Route::delete('/documentos/{id}',        [DocumentWebController::class, 'destroy'])->name('documents.destroy');

        // IA Jurídica
        Route::get('/ia',                        [AIWebController::class, 'index'])->name('ai.index');
        Route::post('/ia/chat',                  [AIWebController::class, 'chat'])->name('ai.chat');

        // Configurações
        Route::get('/configuracoes',             [SettingsWebController::class, 'index'])->name('settings.index');
        Route::put('/configuracoes/workspace',   [SettingsWebController::class, 'updateWorkspace'])->name('settings.workspace.update');
        Route::put('/configuracoes/perfil',      [SettingsWebController::class, 'updateProfile'])->name('settings.profile.update');
    });
});

require __DIR__.'/auth.php';
