<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MemberInviteMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $acceptUrl;

    public function __construct(
        public User      $invitedUser,
        public Workspace $workspace,
        public string    $token,
    ) {
        $this->acceptUrl = url(route('password.reset', [
            'token' => $token,
            'email' => $invitedUser->email,
        ], false));
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Você foi convidado para {$this->workspace->name} no LexFlow",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.member-invite',
        );
    }
}
