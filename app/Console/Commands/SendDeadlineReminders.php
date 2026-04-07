<?php

namespace App\Console\Commands;

use App\Mail\DeadlineReminderMail;
use App\Models\LegalCase;
use App\Models\User;
use App\Models\WorkspaceMember;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendDeadlineReminders extends Command
{
    protected $signature   = 'deadlines:notify {--days=5 : Notificar prazos nos próximos N dias}';
    protected $description = 'Envia e-mails de lembrete de prazos processuais próximos';

    public function handle(): int
    {
        $lookaheadDays = (int) $this->option('days');
        $today         = Carbon::today();
        $limit         = $today->copy()->addDays($lookaheadDays);

        $this->info("Verificando prazos entre {$today->format('d/m/Y')} e {$limit->format('d/m/Y')}...");

        // Busca todos os processos ativos com prazos no período
        $cases = LegalCase::whereIn('status', ['active', 'urgent', 'waiting'])
            ->whereNotNull('next_deadline')
            ->whereBetween('next_deadline', [$today, $limit])
            ->with(['responsible:id,name,email', 'client:id,name,company_name,type'])
            ->get();

        if ($cases->isEmpty()) {
            $this->info('Nenhum prazo encontrado no período.');
            return self::SUCCESS;
        }

        // Agrupa por advogado responsável
        $byLawyer = $cases->groupBy('responsible_user_id');
        $sent     = 0;

        foreach ($byLawyer as $userId => $lawyerCases) {
            $lawyer = User::find($userId);

            if (!$lawyer || !$lawyer->email) continue;

            // Verifica se workspace está ativo
            $workspace = $lawyer->currentWorkspace;
            if (!$workspace || $workspace->isBlocked()) continue;

            $caseList = $lawyerCases->map(fn($c) => [
                'title'    => $c->title,
                'client'   => $c->client?->name ?? $c->client?->company_name ?? 'Cliente',
                'deadline' => $c->next_deadline->toDateString(),
                'days'     => (int) $today->diffInDays($c->next_deadline, false),
                'uuid'     => $c->uuid,
            ])->sortBy('days')->values()->toArray();

            try {
                Mail::to($lawyer->email)->send(new DeadlineReminderMail($lawyer, $caseList));
                $sent++;
                $this->line("  ✓ E-mail enviado para {$lawyer->name} ({$lawyer->email}) — " . count($caseList) . " prazo(s)");
            } catch (\Exception $e) {
                $this->error("  ✗ Falha ao enviar para {$lawyer->email}: {$e->getMessage()}");
            }
        }

        $this->info("Concluído — {$sent} e-mail(s) enviado(s).");
        return self::SUCCESS;
    }
}
