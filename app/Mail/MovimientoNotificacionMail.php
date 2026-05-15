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
        public ?string $numeroCedula = null,
        public ?int $actorId = null,
    ) {}

    public function envelope(): Envelope
    {
        $actorId = $this->actorId;
        $this->movimiento->loadMissing([
            'expediente',
            'expediente.servicio',
            'etapa',
            'tipoDocumentoRequerido',
            'documentos' => fn($q) => $q->where('momento', 'creacion')->where('activo', true),
            // Solo filas del actor destinatario, con su tipo_documento, ordenadas por fecha de vencimiento.
            'responsables' => function ($q) use ($actorId) {
                if ($actorId !== null) {
                    $q->where('expediente_actor_id', $actorId);
                }
                $q->whereNotNull('tipo_documento_id')->orderBy('fecha_limite');
            },
            'responsables.tipoDocumento:id,nombre',
        ]);
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
