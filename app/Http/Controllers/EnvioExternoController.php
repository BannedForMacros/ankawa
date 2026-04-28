<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EnvioExternoController extends Controller
{
    public function index(Expediente $expediente)
    {
        $pendientes = ExpedienteMovimiento::enviosPendientes($expediente->id)
            ->with([
                'documentos' => fn($q) => $q->where('activo', true),
                'tipoDocumentoRequerido:id,nombre',
                'etapa:id,nombre',
            ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($m) => $this->serializar($m));

        $procesados = ExpedienteMovimiento::enviosProcesados($expediente->id)
            ->with([
                'documentos' => fn($q) => $q->where('activo', true),
                'tipoDocumentoRequerido:id,nombre',
                'etapa:id,nombre',
                'aceptadoPor:id,name',
                'rechazadoPor:id,name',
            ])
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get()
            ->map(fn($m) => $this->serializar($m));

        return response()->json([
            'pendientes' => $pendientes,
            'procesados' => $procesados,
        ]);
    }

    public function aceptar(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        $this->guard($expediente, $movimiento);

        DB::transaction(function () use ($expediente, $movimiento) {
            $movimiento->update([
                'estado'           => ExpedienteMovimiento::ESTADO_RECIBIDO,
                'aceptado_por'     => Auth::id(),
                'fecha_aceptacion' => now(),
            ]);

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'tipo_evento'   => 'envio_externo_aceptado',
                'descripcion'   => "Envío espontáneo aceptado e incorporado al expediente.",
                'datos_extra'   => [
                    'movimiento_id' => $movimiento->id,
                    'portal_email'  => $movimiento->portal_email_envio,
                ],
            ]);
        });

        return response()->json(['ok' => true, 'mensaje' => 'Envío aceptado e incorporado al historial.']);
    }

    public function rechazar(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        $this->guard($expediente, $movimiento);

        $request->validate([
            'motivo' => ['required', 'string', 'max:2000'],
        ]);

        DB::transaction(function () use ($request, $expediente, $movimiento) {
            $movimiento->update([
                'estado'         => ExpedienteMovimiento::ESTADO_RECHAZADO,
                'rechazado_por'  => Auth::id(),
                'fecha_rechazo'  => now(),
                'motivo_rechazo' => $request->motivo,
            ]);

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => Auth::id(),
                'tipo_evento'   => 'envio_externo_rechazado',
                'descripcion'   => "Envío espontáneo rechazado.",
                'datos_extra'   => [
                    'movimiento_id' => $movimiento->id,
                    'portal_email'  => $movimiento->portal_email_envio,
                    'motivo'        => $request->motivo,
                ],
            ]);
        });

        return response()->json(['ok' => true, 'mensaje' => 'Envío rechazado.']);
    }

    private function guard(Expediente $expediente, ExpedienteMovimiento $movimiento): void
    {
        abort_unless(
            $movimiento->expediente_id === $expediente->id,
            404,
            'Envío no pertenece al expediente.'
        );
        abort_unless(
            $movimiento->tipo === ExpedienteMovimiento::TIPO_ENVIO_EXTERNO,
            422,
            'Este movimiento no es un envío externo.'
        );
        abort_unless(
            $movimiento->estado === ExpedienteMovimiento::ESTADO_PENDIENTE_ACEPTACION,
            422,
            'Este envío ya fue procesado.'
        );
    }

    private function serializar(ExpedienteMovimiento $m): array
    {
        return [
            'id'                 => $m->id,
            'estado'             => $m->estado,
            'descripcion'        => $m->instruccion,
            'tipo_documento'     => $m->tipoDocumentoRequerido?->nombre,
            'etapa'              => $m->etapa?->nombre,
            'portal_email'       => $m->portal_email_envio,
            'fecha_envio'        => $m->created_at?->format('d/m/Y H:i'),
            'fecha_aceptacion'   => $m->fecha_aceptacion?->format('d/m/Y H:i'),
            'fecha_rechazo'      => $m->fecha_rechazo?->format('d/m/Y H:i'),
            'aceptado_por'       => $m->aceptadoPor?->name,
            'rechazado_por'      => $m->rechazadoPor?->name,
            'motivo_rechazo'     => $m->motivo_rechazo,
            'documentos'         => $m->documentos->map(fn($d) => [
                'id'              => $d->id,
                'nombre_original' => $d->nombre_original,
                'peso_bytes'      => $d->peso_bytes,
                'url'             => Storage::disk('public')->url($d->ruta_archivo),
            ])->values(),
        ];
    }
}
