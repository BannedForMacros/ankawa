<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mail con credenciales temporales de acceso a la plataforma.
 * Reemplaza los Mail::raw que enviaban contraseña en cleartext.
 *
 * Se usa tanto al crear un actor externo (modo externo en ExpedienteActorController)
 * como al habilitar acceso al Expediente Electrónico (MovimientoService).
 */
class CredencialesAccesoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nombreDestinatario,
        public string $emailUsuario,
        public string $passwordTemporal,
        public ?string $numeroExpediente = null,
        public ?string $numeroCargo = null,
        public ?string $contexto = 'general',  // 'general' | 'expediente'
    ) {}

    public function envelope(): Envelope
    {
        $sufijo  = config('app.sufijo_centro', 'CARD ANKAWA');
        $subject = $this->numeroExpediente
            ? "Acceso al Expediente {$this->numeroExpediente} - {$sufijo}"
            : "Credenciales de acceso - {$sufijo}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.credenciales-acceso');
    }
}
