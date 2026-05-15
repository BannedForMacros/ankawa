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
        // Lista de docs entregados en ESTE cargo: [['nombre' => 'Acta', 'count' => 2], ...]
        public array $docsEntregados = [],
        // Lista de docs que el actor TODAVÍA debe presentar (pendientes después de esta entrega):
        // [['nombre' => 'Legajos', 'fecha_limite' => '30/05/2026', 'dias_plazo' => 15, 'tipo_dias' => 'calendario'], ...]
        public array $docsPendientes = [],
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
