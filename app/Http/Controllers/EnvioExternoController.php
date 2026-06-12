<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteHistorial;
use App\Models\ExpedienteMovimiento;
use App\Models\MovimientoDocumento;
use App\Models\TipoDocumento;
use App\Services\GestorExpedienteService;
use App\Support\FileRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EnvioExternoController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
    ) {}

    public function index(Expediente $expediente)
    {
        $this->autorizarVista($expediente);

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
            'tipos_documento_permitidos' => $this->tiposDocumentoPermitidos($expediente),
        ]);
    }

    public function aceptar(Request $request, Expediente $expediente, ExpedienteMovimiento $movimiento)
    {
        abort_unless($this->gestorService->esGestor($expediente, (int) Auth::id()), 403,
            'Solo el Gestor del expediente puede aceptar envíos.');

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
        abort_unless($this->gestorService->esGestor($expediente, (int) Auth::id()), 403,
            'Solo el Gestor del expediente puede rechazar envíos.');

        $this->guard($expediente, $movimiento);

        $tiposPermitidosIds = collect($this->tiposDocumentoPermitidos($expediente))->pluck('id')->all();

        $request->validate([
            'motivo'            => ['required', 'string', 'max:2000'],
            'tipo_documento_id' => ['required', 'integer', Rule::in($tiposPermitidosIds)],
            'archivo'           => ['required', ...explode('|', FileRules::accept())],
        ], [
            'tipo_documento_id.in' => 'El tipo de documento seleccionado no está habilitado para tu perfil en este expediente.',
            'archivo.required'     => 'Debes adjuntar un documento que sustente el rechazo.',
        ]);

        $rutaArchivoSubido = null;

        try {
            DB::transaction(function () use ($request, $expediente, $movimiento, &$rutaArchivoSubido) {
                $movimiento->update([
                    'estado'         => ExpedienteMovimiento::ESTADO_RECHAZADO,
                    'rechazado_por'  => Auth::id(),
                    'fecha_rechazo'  => now(),
                    'motivo_rechazo' => $request->motivo,
                ]);

                $archivo = $request->file('archivo');
                $carpeta = "expedientes/{$movimiento->expediente_id}/movimientos/{$movimiento->id}";
                $rutaArchivoSubido = $archivo->store($carpeta, 'documentos');

                if (!$rutaArchivoSubido) {
                    throw new \RuntimeException('No se pudo almacenar el archivo de sustento.');
                }

                MovimientoDocumento::create([
                    'movimiento_id'     => $movimiento->id,
                    'tipo_documento_id' => (int) $request->tipo_documento_id,
                    'subido_por'        => Auth::id(),
                    'nombre_original'   => $archivo->getClientOriginalName(),
                    'ruta_archivo'      => $rutaArchivoSubido,
                    'peso_bytes'        => $archivo->getSize(),
                    'momento'           => 'rechazo',
                ]);

                ExpedienteHistorial::create([
                    'expediente_id' => $expediente->id,
                    'usuario_id'    => Auth::id(),
                    'tipo_evento'   => 'envio_externo_rechazado',
                    'descripcion'   => "Envío espontáneo rechazado.",
                    'datos_extra'   => [
                        'movimiento_id'     => $movimiento->id,
                        'portal_email'      => $movimiento->portal_email_envio,
                        'motivo'            => $request->motivo,
                        'tipo_documento_id' => (int) $request->tipo_documento_id,
                    ],
                ]);
            });
        } catch (\Throwable $e) {
            if ($rutaArchivoSubido && Storage::disk('documentos')->exists($rutaArchivoSubido)) {
                Storage::disk('documentos')->delete($rutaArchivoSubido);
            }

            report($e);

            return response()->json([
                'ok'      => false,
                'mensaje' => 'No se pudo registrar el rechazo. La operación fue revertida.',
            ], 500);
        }

        return response()->json(['ok' => true, 'mensaje' => 'Envío rechazado.']);
    }

    /**
     * Tipos de documento que el usuario logueado puede subir en este expediente,
     * según su tipo_actor en `expediente_actores` y el pivot `tipo_actor_tipo_documento`
     * con puede_subir=true para el servicio del expediente.
     */
    private function tiposDocumentoPermitidos(Expediente $expediente): array
    {
        $tipoActorId = ExpedienteActor::query()
            ->where('expediente_id', $expediente->id)
            ->where('usuario_id', Auth::id())
            ->where('activo', 1)
            ->value('tipo_actor_id');

        if (!$tipoActorId) {
            return [];
        }

        return TipoDocumento::query()
            ->where('activo', true)
            ->whereHas('tiposActor', function ($q) use ($tipoActorId, $expediente) {
                $q->where('tipo_actor_id', $tipoActorId)
                  ->where('servicio_id', $expediente->servicio_id)
                  ->where('puede_subir', true);
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->map(fn($t) => ['id' => $t->id, 'nombre' => $t->nombre])
            ->all();
    }

    /**
     * Mismo criterio de acceso que ExpedienteController::show — admins con
     * puede_ver_todos_expedientes, o actor activo con acceso al expediente electrónico.
     */
    private function autorizarVista(Expediente $expediente): void
    {
        $user = Auth::user();

        if ($user->rol?->puede_ver_todos_expedientes) {
            return;
        }

        $tieneAcceso = ExpedienteActor::where('expediente_id', $expediente->id)
            ->where('usuario_id', $user->id)
            ->where('activo', 1)
            ->where('acceso_expediente_electronico', 1)
            ->exists();

        abort_unless($tieneAcceso, 403, 'No tiene acceso a este expediente.');
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
        $mapearDoc = fn($d) => [
            'id'              => $d->id,
            'nombre_original' => $d->nombre_original,
            'peso_bytes'      => $d->peso_bytes,
            'url'             => route('documentos.descargar', $d->id),
        ];

        $docsRemitente = $m->documentos->where('momento', '!=', 'rechazo')->values();
        $docRechazo    = $m->documentos->firstWhere('momento', 'rechazo');

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
            'documentos'         => $docsRemitente->map($mapearDoc)->values(),
            'documento_rechazo'  => $docRechazo ? $mapearDoc($docRechazo) : null,
        ];
    }
}
