<?php

namespace App\Mail;

use App\Models\Cargo;
use App\Models\ExpedienteMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CargoRespuestaMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Cargo $cargo,
        public ExpedienteMovimiento $movimiento,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ankawa Internacional — Cargo de Respuesta ' . $this->cargo->numero_cargo,
        );
    }

    public function content(): Content
    {
        return new Content(view: 'emails.cargo-respuesta');
    }
}
