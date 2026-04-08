<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Workspace ────────────────────────────────────────
        $workspaceId = DB::table('workspaces')->insertGetId([
            'uuid'              => Str::uuid(),
            'name'              => 'Viana & Lima Advogados',
            'slug'              => 'viana-lima-adv',
            'email'             => 'contato@vianalima.adv.br',
            'phone'             => '(11) 3000-1234',
            'cnpj'              => '12.345.678/0001-90',
            'oab_seccional'     => 'SP',
            'address_city'      => 'São Paulo',
            'address_state'     => 'SP',
            'plan'              => 'premium',
            'plan_status'       => 'active',
            'trial_ends_at'     => null,
            'max_lawyers'       => 20,
            'max_cases'         => 9999,
            'has_ai'            => true,
            'has_client_portal' => true,
            'has_white_label'   => false,
            'timezone'          => 'America/Sao_Paulo',
            'is_active'         => true,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        // ── Owner ─────────────────────────────────────────────
        $ownerId = DB::table('users')->insertGetId([
            'uuid'                 => Str::uuid(),
            'name'                 => 'Dr. Marcos Viana',
            'email'                => 'admin@gertlex.test',
            'password'             => Hash::make('password'),
            'oab_number'           => '123456',
            'oab_state'            => 'SP',
            'phone'                => '(11) 99999-0001',
            'specialties'          => json_encode(['Trabalhista', 'Empresarial']),
            'current_workspace_id' => $workspaceId,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        DB::table('workspace_members')->insert([
            'workspace_id'       => $workspaceId,
            'user_id'            => $ownerId,
            'role'               => 'owner',
            'is_active'          => true,
            'billing_percentage' => 60,
            'joined_at'          => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // ── Advogados ─────────────────────────────────────────
        $lawyersData = [
            ['Dra. Ana Lima',      'ana.lima@gertlex.test',    '234567', ['Cível', 'Família']],
            ['Dr. Pedro Costa',    'pedro.costa@gertlex.test', '345678', ['Empresarial', 'Tributário']],
            ['Dra. Camila Torres', 'camila@gertlex.test',      '456789', ['Criminal', 'Previdenciário']],
        ];

        $lawyerIds = [];
        foreach ($lawyersData as [$name, $email, $oab, $specs]) {
            $uid = DB::table('users')->insertGetId([
                'uuid'                 => Str::uuid(),
                'name'                 => $name,
                'email'                => $email,
                'password'             => Hash::make('password'),
                'oab_number'           => $oab,
                'oab_state'            => 'SP',
                'specialties'          => json_encode($specs),
                'current_workspace_id' => $workspaceId,
                'created_at'           => now(),
                'updated_at'           => now(),
            ]);

            DB::table('workspace_members')->insert([
                'workspace_id'       => $workspaceId,
                'user_id'            => $uid,
                'role'               => 'lawyer',
                'is_active'          => true,
                'billing_percentage' => 30,
                'joined_at'          => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            $lawyerIds[] = $uid;
        }

        // ── Clientes ──────────────────────────────────────────
        $clientsData = [
            ['Tech Soluções Ltda',   'company',    null,             '12.000.000/0001-00', 'contato@techsolucoes.com.br'],
            ['João da Silva',        'individual', '123.456.789-00', null,                 'joao.silva@gmail.com'],
            ['Construtora ABC S.A.', 'company',    null,             '98.765.432/0001-10', 'adm@construtorabc.com.br'],
            ['Maria Fernandes',      'individual', '987.654.321-00', null,                 'maria.f@hotmail.com'],
            ['Indústria XYZ S.A.',   'company',    null,             '11.222.333/0001-44', 'juridico@xyz.ind.br'],
        ];

        $clientIds = [];
        foreach ($clientsData as [$name, $type, $cpf, $cnpj, $email]) {
            $clientIds[] = DB::table('clients')->insertGetId([
                'uuid'                => Str::uuid(),
                'workspace_id'        => $workspaceId,
                'responsible_user_id' => $ownerId,
                'type'                => $type,
                'name'                => $name,
                'company_name'        => $type === 'company' ? $name : null,
                'cpf'                 => $cpf,
                'cnpj'                => $cnpj,
                'email'               => $email,
                'phone'               => '(11) 9' . rand(1000, 9999) . '-' . rand(1000, 9999),
                'address_city'        => 'São Paulo',
                'address_state'       => 'SP',
                'status'              => 'active',
                'portal_token'        => Str::random(32),
                'portal_active'       => false,
                'client_since'        => Carbon::now()->subMonths(rand(1, 24))->toDateString(),
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);
        }

        // ── Processos ─────────────────────────────────────────
        $casesData = [
            ['Ação Trabalhista — Horas Extras',     'trabalhista', 'active',     'Instrução',    45000,  $clientIds[0], $ownerId],
            ['Cobrança de Honorários Contratuais',  'civil',       'waiting',    'Sentença',     12000,  $clientIds[1], $lawyerIds[0]],
            ['Dissolução Societária Litigiosa',     'empresarial', 'urgent',     'Recurso',     230000,  $clientIds[2], $lawyerIds[1]],
            ['Divórcio Litigioso',                  'familia',     'active',     'Mediação',      8000,  $clientIds[3], $lawyerIds[0]],
            ['Compensação de Créditos Tributários', 'tributario',  'closed_won', 'Transitado',  180000,  $clientIds[4], $ownerId],
            ['Rescisão Indireta de Contrato',       'trabalhista', 'active',     'Contestação',  32000,  $clientIds[0], $lawyerIds[2]],
        ];

        foreach ($casesData as [$title, $area, $status, $phase, $value, $clientId, $lawyerId]) {
            $caseId = DB::table('cases')->insertGetId([
                'uuid'                => Str::uuid(),
                'workspace_id'        => $workspaceId,
                'client_id'           => $clientId,
                'responsible_user_id' => $lawyerId,
                'title'               => $title,
                'area'                => $area,
                'status'              => $status,
                'phase'               => $phase,
                'case_value'          => $value,
                'fee_type'            => 'fixed_success',
                'fee_amount'          => $value * 0.1,
                'fee_success_pct'     => 20,
                'court'               => '2ª Vara ' . ucfirst($area) . ' de SP',
                'court_city'          => 'São Paulo',
                'court_state'         => 'SP',
                'tribunal'            => 'TJSP',
                'side'                => 'author',
                'filed_at'            => Carbon::now()->subMonths(rand(1, 18))->toDateString(),
                'next_deadline'       => $status !== 'closed_won'
                    ? Carbon::now()->addDays(rand(3, 30))->toDateString()
                    : null,
                'created_at'          => now(),
                'updated_at'          => now(),
            ]);

            DB::table('case_assignments')->insert([
                'case_id'            => $caseId,
                'user_id'            => $lawyerId,
                'role'               => 'lead',
                'billing_percentage' => 0,
                'is_active'          => true,
                'assigned_at'        => now(),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);

            $movements = [
                ['Petição inicial distribuída',    Carbon::now()->subMonths(6)],
                ['Citação realizada',              Carbon::now()->subMonths(5)],
                ['Contestação juntada',            Carbon::now()->subMonths(3)],
                ['Audiência de instrução pautada', Carbon::now()->subMonths(1)],
            ];
            foreach ($movements as [$mvTitle, $mvDate]) {
                DB::table('case_movements')->insert([
                    'case_id'     => $caseId,
                    'title'       => $mvTitle,
                    'source'      => 'manual',
                    'occurred_at' => $mvDate,
                    'created_by'  => $lawyerId,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            if ($status !== 'closed_won') {
                DB::table('invoices')->insert([
                    'uuid'               => Str::uuid(),
                    'workspace_id'       => $workspaceId,
                    'client_id'          => $clientId,
                    'case_id'            => $caseId,
                    'description'        => "Honorários — {$title}",
                    'amount'             => $value * 0.1,
                    'discount'           => 0,
                    'late_fee'           => 0,
                    'amount_paid'        => 0,
                    'installment_number' => 1,
                    'installment_total'  => 1,
                    'due_date'           => Carbon::now()->addDays(15)->toDateString(),
                    'status'             => 'pending',
                    'created_by'         => $lawyerId,
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ]);
            }
        }

        // ── Despesas ──────────────────────────────────────────
        $expensesData = [
            ['Aluguel — Sede Paulista',     'office',      8500],
            ['Salários equipe de apoio',    'staff',       6200],
            ['Custas processuais diversas', 'legal_costs', 1800],
            ['Software GertLex',            'technology',   497],
            ['Google Ads',                  'marketing',   1200],
        ];
        foreach ($expensesData as [$desc, $cat, $amount]) {
            DB::table('expenses')->insert([
                'uuid'            => Str::uuid(),
                'workspace_id'    => $workspaceId,
                'description'     => $desc,
                'category'        => $cat,
                'amount'          => $amount,
                'expense_date'    => Carbon::now()->startOfMonth()->toDateString(),
                'is_reimbursable' => false,
                'is_reimbursed'   => false,
                'created_by'      => $ownerId,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        // ── Eventos ───────────────────────────────────────────
        // Inserts individuais — batch insert no MySQL exige colunas
        // idênticas em TODOS os arrays. Nullable deve ser explícito.

        DB::table('events')->insert([
            'uuid'            => Str::uuid(),
            'workspace_id'    => $workspaceId,
            'case_id'         => null,
            'created_by'      => $ownerId,
            'title'           => 'Audiência Inicial — Tech Soluções',
            'description'     => null,
            'type'            => 'hearing',
            'starts_at'       => Carbon::now()->setTime(9, 0),
            'ends_at'         => null,
            'all_day'         => false,
            'location'        => '2ª Vara do Trabalho — SP',
            'meeting_url'     => null,
            'status'          => 'pending',
            'alert_1d'        => true,
            'alert_5d'        => true,
            'alert_sent'      => false,
            'google_event_id' => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        DB::table('events')->insert([
            'uuid'            => Str::uuid(),
            'workspace_id'    => $workspaceId,
            'case_id'         => null,
            'created_by'      => $ownerId,
            'title'           => 'Prazo Fatal: Recurso de Apelação',
            'description'     => null,
            'type'            => 'fatal_deadline',
            'starts_at'       => Carbon::now()->addDays(5)->setTime(23, 59),
            'ends_at'         => null,
            'all_day'         => false,
            'location'        => null,
            'meeting_url'     => null,
            'status'          => 'pending',
            'alert_1d'        => true,
            'alert_5d'        => true,
            'alert_sent'      => false,
            'google_event_id' => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        DB::table('events')->insert([
            'uuid'            => Str::uuid(),
            'workspace_id'    => $workspaceId,
            'case_id'         => null,
            'created_by'      => $lawyerIds[1],
            'title'           => 'Reunião com cliente — Construtora ABC',
            'description'     => null,
            'type'            => 'meeting',
            'starts_at'       => Carbon::now()->addDays(2)->setTime(14, 0),
            'ends_at'         => Carbon::now()->addDays(2)->setTime(15, 0),
            'all_day'         => false,
            'location'        => null,
            'meeting_url'     => null,
            'status'          => 'pending',
            'alert_1d'        => true,
            'alert_5d'        => false,
            'alert_sent'      => false,
            'google_event_id' => null,
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        // ── Workspace Trial (para testes) ──────────────────────
        $trialWorkspaceId = DB::table('workspaces')->insertGetId([
            'uuid'              => Str::uuid(),
            'name'              => 'Silva Advocacia',
            'slug'              => 'silva-advocacia-' . Str::random(4),
            'email'             => 'trial@gertlex.test',
            'plan'              => 'trial',
            'plan_status'       => 'trialing',
            'trial_ends_at'     => Carbon::now()->addDays(5), // 5 dias restantes (entra no alerta warning)
            'max_lawyers'       => 3,
            'max_cases'         => 20,
            'has_ai'            => false,
            'has_client_portal' => false,
            'has_white_label'   => false,
            'timezone'          => 'America/Sao_Paulo',
            'is_active'         => true,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);

        $trialUserId = DB::table('users')->insertGetId([
            'uuid'                 => Str::uuid(),
            'name'                 => 'Dra. Ana Silva',
            'email'                => 'trial@gertlex.test',
            'password'             => Hash::make('password'),
            'current_workspace_id' => $trialWorkspaceId,
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        DB::table('workspace_members')->insert([
            'workspace_id'       => $trialWorkspaceId,
            'user_id'            => $trialUserId,
            'role'               => 'owner',
            'is_active'          => true,
            'billing_percentage' => 100,
            'joined_at'          => now(),
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        $this->command->info('');
        $this->command->info('✅  Seed concluído com sucesso!');
        $this->command->info('');
        $this->command->info('📧  Login Premium : admin@gertlex.test  |  🔑 password');
        $this->command->info('📧  Login Trial   : trial@gertlex.test   |  🔑 password');
        $this->command->info('');
    }
}
