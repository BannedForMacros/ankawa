<?php

namespace App\Console\Commands;

use App\Mail\RecordatorioVencimientoMail;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use App\Models\MovimientoNotificacion;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EnviarRecordatoriosVencimiento extends Command
{
    protected $signature = 'expedientes:enviar-recordatorios-vencimiento';
    protected $description = 'Envía recordatorio por email al responsable de requerimientos que vencen mañana (1 día hábil restante)';

    public function handle(): int
    {
        $candidatos = ExpedienteMovimiento::where('tipo', 'requerimiento')
            ->where('estado', 'pendiente')
            ->where('activo', true)
            ->whereNotNull('fecha_limite')
            ->with([
                'expediente',
                'etapa',
                'usuarioResponsable',
                'responsables.actor.usuario',
                'responsables.actor.emailsAdicionales',
            ])
            ->get()
            ->filter(fn($m) => $m->diasRestantes() === 1);

        $feriados  = DB::table('feriados')->where('activo', true)->pluck('fecha')->toArray();
        $totalEnviados = 0;

        foreach ($candidatos as $movimiento) {
            $enviados = 0;
            $fallidos = 0;

            // Caso A: responsable directo (usuario_responsable_id)
            if ($movimiento->usuarioResponsable?->email) {
                [$ok] = $this->enviarConRegistro(
                    $movimiento,
                    $movimiento->usuarioResponsable->email,
                    $movimiento->usuarioResponsable->name,
                );
                $ok ? $enviados++ : $fallidos++;
            }

            // Caso B: responsables via pivot movimiento_responsables
            foreach ($movimiento->responsables->where('estado', 'pendiente') as $responsable) {
                if (!$responsable->fecha_limite) {
                    continue;
                }

                $diasRestantes = $this->calcularDiasRestantes(
                    $responsable->fecha_limite,
                    $responsable->tipo_dias ?? 'calendario',
                    $feriados,
                );

                if ($diasRestantes !== 1) {
                    continue;
                }

                $actor  = $responsable->actor;
                $nombre = $actor->nombre ?? $actor->usuario?->name ?? 'Responsable';

                foreach ($actor->todosLosEmails() as $email) {
                    [$ok] = $this->enviarConRegistro($movimiento, $email, $nombre, $actor->id ?? null);
                    $ok ? $enviados++ : $fallidos++;
                }
            }

            // Registrar resumen en historial del expediente
            if ($enviados > 0 || $fallidos > 0) {
                $this->registrarHistorial($movimiento, $enviados, $fallidos);
                $totalEnviados += $enviados;
            }
        }

        $this->info("Recordatorios enviados: {$totalEnviados}");

        return self::SUCCESS;
    }

    /**
     * Envía el email y registra el resultado en movimiento_notificaciones.
     * Retorna [bool $ok].
     */
    private function enviarConRegistro(
        ExpedienteMovimiento $movimiento,
        string $email,
        string $nombre,
        ?int $actorId = null,
    ): array {
        $movimiento->loadMissing(['expediente']);
        $numExp = $movimiento->expediente->numero_expediente ?? 'S/N';
        $asunto = "Expediente {$numExp} — Su plazo vence mañana";

        $registro = MovimientoNotificacion::create([
            'movimiento_id' => $movimiento->id,
            'actor_id'      => $actorId,
            'email_destino' => $email,
            'nombre_destino'=> $nombre,
            'asunto'        => $asunto,
            'estado_envio'  => 'pendiente',
            'created_at'    => now(),
        ]);

        try {
            Mail::to($email)->send(new RecordatorioVencimientoMail($movimiento, $nombre));

            $registro->update([
                'estado_envio' => 'enviado',
                'enviado_at'   => now(),
            ]);

            return [true];
        } catch (\Throwable $e) {
            $registro->update(['estado_envio' => 'fallido']);

            Log::warning("RecordatorioVencimiento: fallo al enviar a {$email} para movimiento #{$movimiento->id}: {$e->getMessage()}");

            return [false];
        }
    }

    /**
     * Registra un evento en el historial del expediente con el resumen del envío.
     */
    private function registrarHistorial(ExpedienteMovimiento $movimiento, int $enviados, int $fallidos): void
    {
        $descripcion = "Recordatorio de vencimiento enviado: {$enviados} email(s) entregado(s)";
        if ($fallidos > 0) {
            $descripcion .= ", {$fallidos} con error";
        }

        ExpedienteHistorial::create([
            'expediente_id' => $movimiento->expediente_id,
            'usuario_id'    => $movimiento->creado_por,
            'tipo_evento'   => 'recordatorio_vencimiento_enviado',
            'descripcion'   => $descripcion,
            'datos_extra'   => [
                'movimiento_id' => $movimiento->id,
                'instruccion'   => $movimiento->instruccion,
                'fecha_limite'  => $movimiento->fecha_limite->toDateString(),
                'enviados'      => $enviados,
                'fallidos'      => $fallidos,
            ],
            'created_at'    => now(),
        ]);
    }

    /**
     * Calcula días restantes hasta $fechaLimite.
     * Misma lógica que ExpedienteMovimiento::diasRestantes().
     */
    private function calcularDiasRestantes(Carbon $fechaLimite, string $tipoDias, array $feriados): int
    {
        $hoy    = now()->startOfDay();
        $limite = $fechaLimite->copy()->startOfDay();

        if ($tipoDias !== 'habiles') {
            return (int) ceil(($limite->timestamp - $hoy->timestamp) / 86400);
        }

        $dias   = 0;
        $actual = $hoy->copy();

        if ($actual->gte($limite)) {
            while ($actual->gt($limite)) {
                $actual->subDay();
                if ($actual->dayOfWeek !== 0 && $actual->dayOfWeek !== 6
                    && !in_array($actual->toDateString(), $feriados)) {
                    $dias--;
                }
            }
            return $dias;
        }

        while ($actual->lt($limite)) {
            $actual->addDay();
            if ($actual->dayOfWeek !== 0 && $actual->dayOfWeek !== 6
                && !in_array($actual->toDateString(), $feriados)) {
                $dias++;
            }
        }

        return $dias;
    }
}


// cambio 9