<?php

namespace App\Mail;

use App\Models\ExpedienteMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MovimientoNotificacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ExpedienteMovimiento $movimiento,
        public string $nombreDestinatario,
    ) {}

    public function envelope(): Envelope
    {
        $this->movimiento->loadMissing('expediente');
        $numExp = $this->movimiento->expediente->numero_expediente ?? 'S/N';

        return new Envelope(
            subject: "Expediente {$numExp} — Nuevo movimiento registrado",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.movimiento-notificacion',
        );
    }
}
