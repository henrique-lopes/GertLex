<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prazos Próximos — LexFlow</title>
    <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #F0F2FA; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        .header { background: #0D0F14; padding: 32px 40px; }
        .logo { font-size: 22px; font-weight: 900; color: #fff; }
        .logo span { color: #C9A84C; }
        .header p { color: #6B7491; font-size: 13px; margin: 4px 0 0; }
        .body { padding: 32px 40px; }
        h1 { font-size: 18px; color: #111827; margin: 0 0 8px; }
        p { font-size: 14px; color: #4B5563; line-height: 1.6; margin: 0 0 16px; }
        .case-card { border: 1px solid #E5E7EB; border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; }
        .case-card.urgent { border-left: 4px solid #EF4444; }
        .case-card.warning { border-left: 4px solid #F59E0B; }
        .case-card.normal  { border-left: 4px solid #3B82F6; }
        .case-title { font-weight: 700; color: #111827; font-size: 14px; margin-bottom: 2px; }
        .case-meta  { font-size: 12px; color: #6B7491; }
        .badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
        .badge.urgent  { background: #FEE2E2; color: #DC2626; }
        .badge.warning { background: #FEF3C7; color: #D97706; }
        .badge.normal  { background: #DBEAFE; color: #2563EB; }
        .btn { display: inline-block; background: #C9A84C; color: #000; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; }
        .footer { padding: 20px 40px; border-top: 1px solid #F3F4F6; text-align: center; }
        .footer p { font-size: 12px; color: #9CA3AF; margin: 0; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <div class="logo">Lex<span>Flow</span></div>
        <p>Lembrete de prazos processuais</p>
    </div>
    <div class="body">
        <h1>⚠️ {{ count($cases) }} prazo(s) próximo(s)</h1>
        <p>Olá, <strong>{{ $lawyer->name }}</strong>. Os seguintes processos têm prazos nos próximos dias:</p>

        @foreach ($cases as $case)
            @php
                $cardClass = $case['days'] <= 1 ? 'urgent' : ($case['days'] <= 3 ? 'warning' : 'normal');
                $badgeText = $case['days'] === 0 ? 'Hoje!' : ($case['days'] === 1 ? 'Amanhã' : "Em {$case['days']} dias");
            @endphp
            <div class="case-card {{ $cardClass }}">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <div class="case-title">{{ $case['title'] }}</div>
                        <div class="case-meta">{{ $case['client'] }} · Prazo: {{ \Carbon\Carbon::parse($case['deadline'])->format('d/m/Y') }}</div>
                    </div>
                    <span class="badge {{ $cardClass }}">{{ $badgeText }}</span>
                </div>
            </div>
        @endforeach

        <p style="margin-top: 24px; text-align: center;">
            <a href="{{ config('app.url') }}/processos" class="btn">Ver processos no LexFlow →</a>
        </p>
    </div>
    <div class="footer">
        <p>LexFlow · Você recebe este e-mail pois possui prazos nos próximos 5 dias.<br>
        Para desativar, acesse Configurações → Notificações.</p>
    </div>
</div>
</body>
</html>
