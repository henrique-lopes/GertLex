<?php

namespace App\Services;

use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleCalendarService
{
    private const TOKEN_URL    = 'https://oauth2.googleapis.com/token';
    private const CALENDAR_URL = 'https://www.googleapis.com/calendar/v3';
    private const AUTH_URL     = 'https://accounts.google.com/o/oauth2/v2/auth';

    private ?string $clientId;
    private ?string $clientSecret;
    private ?string $redirectUri;

    public function __construct()
    {
        $this->clientId     = config('services.google.client_id');
        $this->clientSecret = config('services.google.client_secret');
        $this->redirectUri  = config('services.google.redirect');
    }

    /**
     * Gera a URL de autorização OAuth2.
     */
    public function authUrl(string $state = ''): string
    {
        return self::AUTH_URL . '?' . http_build_query([
            'client_id'     => $this->clientId,
            'redirect_uri'  => $this->redirectUri,
            'response_type' => 'code',
            'scope'         => 'https://www.googleapis.com/auth/calendar',
            'access_type'   => 'offline',
            'prompt'        => 'consent',
            'state'         => $state,
        ]);
    }

    /**
     * Troca o code por access_token + refresh_token.
     */
    public function exchangeCode(string $code): array
    {
        $response = Http::asForm()->post(self::TOKEN_URL, [
            'code'          => $code,
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'redirect_uri'  => $this->redirectUri,
            'grant_type'    => 'authorization_code',
        ]);

        return $response->json();
    }

    /**
     * Renova o access_token usando o refresh_token.
     */
    public function refreshToken(User $user): bool
    {
        if (!$user->google_refresh_token) return false;

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'client_id'     => $this->clientId,
            'client_secret' => $this->clientSecret,
            'refresh_token' => $user->google_refresh_token,
            'grant_type'    => 'refresh_token',
        ]);

        if ($response->failed()) return false;

        $data = $response->json();
        $user->update([
            'google_access_token'    => $data['access_token'],
            'google_token_expires_at'=> Carbon::now()->addSeconds($data['expires_in'] - 60),
        ]);

        return true;
    }

    /**
     * Retorna um access_token válido (renova se necessário).
     */
    public function validToken(User $user): ?string
    {
        if (!$user->google_access_token) return null;

        if ($user->google_token_expires_at && Carbon::now()->gte($user->google_token_expires_at)) {
            if (!$this->refreshToken($user)) return null;
            $user->refresh();
        }

        return $user->google_access_token;
    }

    /**
     * Salva o evento no Google Calendar e armazena o google_event_id.
     */
    public function pushEvent(User $user, Event $event): bool
    {
        $token = $this->validToken($user);
        if (!$token) return false;

        $calendarId = $user->google_calendar_id ?? 'primary';
        $body       = $this->buildGoogleEvent($event);

        if ($event->google_event_id) {
            // Atualiza
            $response = Http::withToken($token)
                ->put(self::CALENDAR_URL . "/calendars/{$calendarId}/events/{$event->google_event_id}", $body);
        } else {
            // Cria
            $response = Http::withToken($token)
                ->post(self::CALENDAR_URL . "/calendars/{$calendarId}/events", $body);
        }

        if ($response->successful()) {
            $event->updateQuietly(['google_event_id' => $response->json('id')]);
            return true;
        }

        Log::error('GoogleCalendar pushEvent failed', ['status' => $response->status(), 'body' => $response->body()]);
        return false;
    }

    /**
     * Remove o evento do Google Calendar.
     */
    public function deleteEvent(User $user, Event $event): bool
    {
        if (!$event->google_event_id) return true;

        $token = $this->validToken($user);
        if (!$token) return false;

        $calendarId = $user->google_calendar_id ?? 'primary';

        Http::withToken($token)
            ->delete(self::CALENDAR_URL . "/calendars/{$calendarId}/events/{$event->google_event_id}");

        $event->updateQuietly(['google_event_id' => null]);
        return true;
    }

    /**
     * Importa eventos do Google Calendar para o GertLex (últimos 30 dias + próximos 90).
     */
    public function pullEvents(User $user, int $workspaceId): int
    {
        $token = $this->validToken($user);
        if (!$token) return 0;

        $calendarId = $user->google_calendar_id ?? 'primary';

        $response = Http::withToken($token)->get(self::CALENDAR_URL . "/calendars/{$calendarId}/events", [
            'timeMin'      => Carbon::now()->subDays(30)->toRfc3339String(),
            'timeMax'      => Carbon::now()->addDays(90)->toRfc3339String(),
            'singleEvents' => 'true',
            'orderBy'      => 'startTime',
            'maxResults'   => 250,
        ]);

        if ($response->failed()) return 0;

        $items   = $response->json('items', []);
        $created = 0;

        foreach ($items as $item) {
            if (($item['status'] ?? '') === 'cancelled') continue;

            $googleId = $item['id'];

            // Evita duplicata
            if (Event::where('google_event_id', $googleId)->exists()) {
                // Atualiza título/data se já existe
                Event::where('google_event_id', $googleId)->update([
                    'title'      => $item['summary'] ?? 'Evento Google',
                    'starts_at'  => $this->parseGoogleDate($item['start'] ?? []),
                    'ends_at'    => $this->parseGoogleDate($item['end'] ?? []),
                    'all_day'    => isset($item['start']['date']),
                    'location'   => $item['location'] ?? null,
                    'description'=> $item['description'] ?? null,
                    'meeting_url'=> $item['hangoutLink'] ?? null,
                    'is_virtual' => isset($item['hangoutLink']) || isset($item['conferenceData']),
                ]);
                continue;
            }

            Event::create([
                'uuid'          => \Illuminate\Support\Str::uuid(),
                'workspace_id'  => $workspaceId,
                'created_by'    => $user->id,
                'google_event_id'=> $googleId,
                'title'         => $item['summary'] ?? 'Evento Google',
                'starts_at'     => $this->parseGoogleDate($item['start'] ?? []),
                'ends_at'       => $this->parseGoogleDate($item['end'] ?? []),
                'all_day'       => isset($item['start']['date']),
                'location'      => $item['location'] ?? null,
                'description'   => $item['description'] ?? null,
                'meeting_url'   => $item['hangoutLink'] ?? null,
                'is_virtual'    => isset($item['hangoutLink']) || isset($item['conferenceData']),
                'type'          => 'reminder',
                'status'        => 'pending',
                'alert_sent'    => false,
            ]);
            $created++;
        }

        return $created;
    }

    private function buildGoogleEvent(Event $event): array
    {
        $body = [
            'summary'     => $event->title,
            'description' => $event->description ?? '',
            'location'    => $event->location ?? '',
        ];

        if ($event->all_day) {
            $body['start'] = ['date' => Carbon::parse($event->starts_at)->toDateString()];
            $body['end']   = ['date' => Carbon::parse($event->ends_at ?? $event->starts_at)->addDay()->toDateString()];
        } else {
            $tz = 'America/Sao_Paulo';
            $body['start'] = ['dateTime' => Carbon::parse($event->starts_at)->toIso8601String(), 'timeZone' => $tz];
            $body['end']   = ['dateTime' => Carbon::parse($event->ends_at ?? $event->starts_at)->addHour()->toIso8601String(), 'timeZone' => $tz];
        }

        if ($event->meeting_url) {
            $body['description'] .= "\n\nLink da reunião: {$event->meeting_url}";
        }

        return $body;
    }

    private function parseGoogleDate(array $dateArr): ?string
    {
        if (isset($dateArr['dateTime'])) return Carbon::parse($dateArr['dateTime'])->toDateTimeString();
        if (isset($dateArr['date']))     return Carbon::parse($dateArr['date'])->startOfDay()->toDateTimeString();
        return null;
    }
}
