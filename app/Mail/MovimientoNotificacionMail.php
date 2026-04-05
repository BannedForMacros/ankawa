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
        public bool $esPortal = false,
    ) {}

    public function envelope(): Envelope
    {
        $this->movimiento->loadMissing(['expediente', 'expediente.servicio', 'etapa', 'subEtapa', 'tipoDocumentoRequerido']);
        $numExp = $this->movimiento->expediente->numero_expediente ?? 'S/N';

        $label = match($this->movimiento->tipo) {
            'requerimiento' => 'Requerimiento pendiente',
            'notificacion'  => 'Traslado / Notificación',
            default         => 'Nuevo movimiento',
        };

        return new Envelope(
            subject: "Expediente {$numExp} — {$label}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.movimiento-notificacion',
        );
    }
}
