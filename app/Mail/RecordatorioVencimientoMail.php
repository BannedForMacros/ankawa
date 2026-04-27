<?php

namespace App\Mail;

use App\Models\ExpedienteMovimiento;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecordatorioVencimientoMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Carbon|null  $fechaLimite  Fecha real que se mostrará al destinatario.
     *                                    Si es null, se usa la del movimiento padre.
     *                                    Útil cuando el responsable tiene plazo individual
     *                                    distinto al del padre (vía pivot movimiento_responsables).
     */
    public function __construct(
        public ExpedienteMovimiento $movimiento,
        public string $nombreDestinatario,
        public ?Carbon $fechaLimite = null,
    ) {}

    public function envelope(): Envelope
    {
        $this->movimiento->loadMissing(['expediente']);
        $numExp = $this->movimiento->expediente->numero_expediente ?? 'S/N';

        return new Envelope(
            subject: "Expediente {$numExp} — Su plazo vence mañana",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recordatorio-vencimiento',
        );
    }
}
