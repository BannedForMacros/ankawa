<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CodigoVerificacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombre,
        public string $codigo,
        public string $servicio,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ankawa Internacional — Codigo de Verificacion',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.codigo-verificacion',
        );
    }
}