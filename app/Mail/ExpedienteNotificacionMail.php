<?php

namespace App\Mail;

use App\Models\Actividad;
use App\Models\ActividadTransicion;
use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExpedienteNotificacionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Expediente          $expediente,
        public ExpedienteMovimiento $movimiento,
        public ActividadTransicion  $transicion,
        public Actividad            $actividadDestino,
        public string               $nombreDestinatario,
    ) {}

    public function envelope(): Envelope
    {
        $ref = $this->expediente->numero_expediente ?? $this->expediente->solicitud?->numero_cargo ?? "EXP-{$this->expediente->id}";

        return new Envelope(
            subject: "[{$ref}] {$this->transicion->etiqueta_boton} — {$this->actividadDestino->nombre}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.expediente-notificacion',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
