<?php

namespace App\Mail;

use App\Models\Cargo;
use App\Models\SolicitudOtros;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CargoSolicitudOtrosMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Cargo $cargo,
        public SolicitudOtros $solicitud,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ankawa Internacional — Cargo de Envío ' . $this->cargo->numero_cargo,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.cargo-solicitud-otros');
    }
}
