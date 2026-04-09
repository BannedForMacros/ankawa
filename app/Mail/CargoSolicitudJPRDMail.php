<?php

namespace App\Mail;

use App\Models\Cargo;
use App\Models\Expediente;
use App\Models\SolicitudJPRD;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CargoSolicitudJPRDMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Cargo $cargo,
        public SolicitudJPRD $solicitud,
        public ?Expediente $expediente = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ankawa Internacional — Cargo de Solicitud JPRD ' . $this->cargo->numero_cargo,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.cargo-solicitud-jprd');
    }
}
