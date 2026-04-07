<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite LexFlow</title>
    <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #F0F2FA; margin: 0; padding: 0; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        .header { background: #0D0F14; padding: 32px 40px; text-align: center; }
        .logo { font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        .logo span { color: #C9A84C; }
        .body { padding: 40px; }
        h1 { font-size: 20px; color: #111827; margin: 0 0 8px; }
        p { font-size: 15px; color: #4B5563; line-height: 1.6; margin: 0 0 16px; }
        .workspace-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
        .workspace-box strong { color: #111827; font-size: 16px; }
        .btn { display: inline-block; background: #C9A84C; color: #000; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; margin: 8px 0; }
        .footer { padding: 24px 40px; border-top: 1px solid #F3F4F6; text-align: center; }
        .footer p { font-size: 12px; color: #9CA3AF; margin: 0; }
        .note { font-size: 13px; color: #9CA3AF; margin-top: 20px; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <div class="logo">Lex<span>Flow</span></div>
    </div>
    <div class="body">
        <h1>Você foi convidado! 🎉</h1>
        <p>Olá, <strong>{{ $invitedUser->name }}</strong>.</p>
        <p>Você foi adicionado como membro do escritório:</p>
        <div class="workspace-box">
            <strong>{{ $workspace->name }}</strong>
        </div>
        <p>Clique no botão abaixo para definir sua senha e acessar o sistema:</p>
        <p style="text-align:center; margin: 28px 0;">
            <a href="{{ $acceptUrl }}" class="btn">Definir senha e acessar →</a>
        </p>
        <p class="note">Este link expira em 24 horas. Se você não esperava este convite, pode ignorar este e-mail.</p>
    </div>
    <div class="footer">
        <p>LexFlow — Sistema de Gestão Jurídica · <a href="{{ config('app.url') }}" style="color:#C9A84C;">{{ config('app.url') }}</a></p>
    </div>
</div>
</body>
</html>
