<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DeadlineReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User  $lawyer,
        public array $cases,   // array of ['title', 'client', 'deadline', 'days', 'uuid']
    ) {}

    public function envelope(): Envelope
    {
        $count = count($this->cases);
        return new Envelope(
            subject: "⚠️ LexFlow — {$count} prazo(s) próximo(s) nos seus processos",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.deadline-reminder',
        );
    }
}
