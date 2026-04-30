<?php

namespace App\Mail;

use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CargoSolicitudMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SolicitudArbitraje $solicitud,
        public ?string $passwordRaw,
        public ?Expediente $expediente = null,
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
}