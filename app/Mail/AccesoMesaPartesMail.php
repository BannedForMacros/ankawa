<?php

namespace App\Mail;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AccesoMesaPartesMail extends Mailable
{
    public function __construct(
        public Expediente $expediente,
        public ExpedienteActor $actor,
    ) {}

    public function envelope(): Envelope
    {
        $this->expediente->loadMissing('servicio');
        $numExp = $this->expediente->numero_expediente ?? 'S/N';

        return new Envelope(
            subject: "Acceso habilitado a Mesa de Partes — Expediente {$numExp}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.acceso-mesa-partes',
        );
    }
}
