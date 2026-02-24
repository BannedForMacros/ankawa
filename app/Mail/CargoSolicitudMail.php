<?php

namespace App\Mail;

use App\Models\SolicitudArbitraje;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CargoSolicitudMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SolicitudArbitraje $solicitud,
        public ?string $passwordRaw,
        public string $pdfPath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ankawa Internacional — Cargo de Presentacion ' . $this->solicitud->numero_cargo,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.cargo-solicitud',
        );
    }

    public function attachments(): array
    {
        return [
            Attachment::fromPath($this->pdfPath)
                ->as('Cargo_' . $this->solicitud->numero_cargo . '.pdf')
                ->withMime('application/pdf'),
        ];
    }
}