<?php
// config/services.php
return [

    'mailgun' => [
        'domain'   => env('MAILGUN_DOMAIN'),
        'secret'   => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme'   => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // ── Claude / Anthropic ─────────────────────────────────
    'anthropic' => [
        'key'   => env('ANTHROPIC_API_KEY'),
        'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-4-20250514'),
        'url'   => 'https://api.anthropic.com/v1/messages',
    ],

    // ── DataJud CNJ ────────────────────────────────────────
    'datajud' => [
        'key' => env('DATAJUD_API_KEY'),
        'url' => env('DATAJUD_API_URL', 'https://api-publica.datajud.cnj.jus.br'),
    ],

    // ── Asaas (Pagamentos) ─────────────────────────────────
    'asaas' => [
        'key'         => env('ASAAS_API_KEY'),
        'environment' => env('ASAAS_ENVIRONMENT', 'sandbox'),
        'url'         => env('ASAAS_ENVIRONMENT', 'sandbox') === 'production'
            ? 'https://api.asaas.com/v3'
            : 'https://sandbox.asaas.com/api/v3',
    ],

    // ── Google (Calendar OAuth) ────────────────────────────
    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI', 'https://app.gertlex.com.br/auth/google/callback'),
    ],

];
