<?php

namespace App\Http\Controllers;

use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\ExpedienteDocumentoRequisito;
use App\Models\ActividadRequisitoDocumento;
use App\Models\TipoActorExpediente;
use App\Models\ServicioTipoActor;
use App\Models\ActividadTransicion;
use App\Models\Actividad;
use App\Models\User;
use App\Models\Documento;
use App\Mail\ExpedienteNotificacionMail;
use App\Services\PlazoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class ExpedienteController extends Controller
{
    // ── 1. ÍNDICE PRINCIPAL DE EXPEDIENTES EN CURSO ──
    public function index()
    {
        $expedientes = Expediente::with(['servicio', 'etapaActual', 'actividadActual'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function($exp) {
                return [
                    'id'                => $exp->id,
                    'numero_expediente' => $exp->numero_expediente ?? $exp->solicitud->numero_cargo, // Si no tiene N° formal, mostramos el cargo
                    'servicio'          => $exp->servicio->nombre,
                    'etapa'             => $exp->etapaActual->nombre,
                    'actividad'         => $exp->actividadActual->nombre,
                    'estado'            => $exp->estado,
                    'created_at'        => $exp->created_at->format('d/m/Y'),
                ];
            });

        return Inertia::render('Expedientes/Index', [
            'expedientes' => $expedientes
        ]);
    }

    // ── 2. VISOR DINÁMICO DEL EXPEDIENTE ──
    public function show(Expediente $expediente)
    {
        $expediente->load([
            'solicitud.documentos',
            'etapaActual',
            'actividadActual.roles',
            'actividadActual.transiciones.accionCatalogo',
            'actividadActual.transiciones.tipoDocumento',
            'actividadActual.transiciones.requisitoDocumento',
            'actividadActual.transiciones.actoresDesignables.tipoActor',
            'actividadActual.requisitosDocumento.tipoDocumento',
            'actores.usuario',
            'actores.tipoActor',
            'movimientos' => function ($q) {
                $q->orderByDesc('fecha_movimiento')
                  ->with([
                      'usuario',
                      'actividadOrigen',
                      'actividadDestino',
                      'documentos',
                      'requisitosDocumento.requisito',
                  ]);
            },
        ]);

        // Documentos activos por slot para esta actividad en este expediente
        $requisitosConArchivos = $expediente->actividadActual->requisitosDocumento
            ->map(function ($req) use ($expediente) {
                $docActual = ExpedienteDocumentoRequisito::where([
                    'expediente_id' => $expediente->id,
                    'requisito_id'  => $req->id,
                    'activo'        => true,
                ])->latest()->first();

                return [
                    'id'              => $req->id,
                    'nombre'          => $req->nombre,
                    'descripcion'     => $req->descripcion,
                    'es_obligatorio'  => $req->es_obligatorio,
                    'orden'           => $req->orden,
                    'tipo_documento'  => $req->tipoDocumento?->nombre,
                    'archivo_actual'  => $docActual ? [
                        'id'             => $docActual->id,
                        'nombre_original' => $docActual->nombre_original,
                        'ruta_archivo'   => $docActual->ruta_archivo,
                        'peso_bytes'     => $docActual->peso_bytes,
                    ] : null,
                ];
            });

        $rolUsuarioId = auth()->user()->rol_id;
        $puedeActuar  = $expediente->actividadActual->roles->contains('id', $rolUsuarioId);

        $slugsGestores = ['administrador_ti', 'director', 'secretaria_general', 'secretaria_general_adjunta'];
        $puedeGestionarActores = in_array(auth()->user()->rol?->slug, $slugsGestores);

        // Solo los tipos de actor configurados para el servicio de este expediente
        // (excluye demandante/demandado que son inmutables)
        $tiposActorIds = ServicioTipoActor::where('servicio_id', $expediente->servicio_id)
            ->where('activo', 1)
            ->pluck('tipo_actor_id');

        $tiposActor = TipoActorExpediente::whereIn('id', $tiposActorIds)
            ->whereNotIn('slug', ['demandante', 'demandado'])
            ->where('activo', 1)
            ->get(['id', 'nombre', 'slug']);

        $usuariosAsignables = User::where('activo', 1)
            ->whereHas('rol', fn($q) => $q->whereNotIn('slug', ['usuario']))
            ->with('rol:id,nombre,slug')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'rol_id']);

        $plazoService = app(PlazoService::class);

        return Inertia::render('Expedientes/Show', [
            'expediente'            => $expediente,
            'puedeActuar'           => $puedeActuar,
            'transiciones'          => $puedeActuar
                ? $expediente->actividadActual->transiciones->map(function ($t) use ($expediente) {
                    $slotCubierto = true;
                    if ($t->requisito_documento_id) {
                        $slotCubierto = ExpedienteDocumentoRequisito::where([
                            'expediente_id' => $expediente->id,
                            'requisito_id'  => $t->requisito_documento_id,
                            'activo'        => true,
                        ])->exists();
                    }
                    return array_merge($t->toArray(), [
                        'slot_cubierto'    => $slotCubierto,
                        'requisito_nombre' => $t->requisitoDocumento?->nombre,
                    ]);
                })
                : [],
            'requisitosConArchivos' => $requisitosConArchivos,
            'puedeGestionarActores' => $puedeGestionarActores,
            'tiposActor'            => $tiposActor,
            'usuariosAsignables'    => $usuariosAsignables,
            'plazo'                 => $plazoService->resumen($expediente),
        ]);
    }

    // ── 3. EL MOTOR ÚNICO Y DINÁMICO DE ACCIONES ──
    public function registrarAccion(Request $request, Expediente $expediente)
    {
        $request->validate([
            'transicion_id'              => 'required|exists:actividad_transiciones,id',
            'observaciones'              => 'nullable|string',
            'documentos_movimiento'      => 'nullable|array',
            'documentos_movimiento.*'    => 'file|mimes:pdf,doc,docx|max:10240',
            // actores_designados: [tipo_actor_id => usuario_id]
            'actores_designados'         => 'nullable|array',
            'actores_designados.*'       => 'nullable|integer|exists:users,id',
            // documentos_requisito: [requisito_id => file] — slots configurados por actividad
            'documentos_requisito'       => 'nullable|array',
            'documentos_requisito.*'     => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'notificar_a'                => 'nullable|array',
            'notificar_a.*'              => 'integer|exists:expediente_actores,id',
        ]);

        $transicion = ActividadTransicion::with('actoresDesignables')->findOrFail($request->transicion_id);

        // Validar que los slots obligatorios estén cubiertos (archivo existente o nuevo)
        $requisitosActividad = ActividadRequisitoDocumento::where('actividad_id', $expediente->actividad_actual_id)
            ->where('activo', true)->get();

        foreach ($requisitosActividad as $req) {
            if ($req->es_obligatorio) {
                $tieneArchivo = ExpedienteDocumentoRequisito::where([
                    'expediente_id' => $expediente->id,
                    'requisito_id'  => $req->id,
                    'activo'        => true,
                ])->exists();
                $subiendoNuevo = $request->hasFile("documentos_requisito.{$req->id}");
                if (!$tieneArchivo && !$subiendoNuevo) {
                    return back()->withErrors([
                        "documentos_requisito.{$req->id}" => "El documento \"{$req->nombre}\" es obligatorio.",
                    ]);
                }
            }
        }

        if ($transicion->requiere_observacion && empty($request->observaciones)) {
            return back()->withErrors(['observaciones' => 'Esta acción requiere que ingrese un motivo u observación.']);
        }

        if ($transicion->requiere_documento && !$request->hasFile('documentos_movimiento')) {
            return back()->withErrors(['documentos_movimiento' => 'Esta acción exige adjuntar un documento.']);
        }

        // Validar actores obligatorios antes de iniciar la transacción
        foreach ($transicion->actoresDesignables as $actorDesignable) {
            if ($actorDesignable->es_obligatorio) {
                $usuarioId = ($request->actores_designados[$actorDesignable->tipo_actor_id] ?? null);
                if (!$usuarioId) {
                    return back()->withErrors([
                        'actores_designados' => 'Debe designar al actor: ' . $actorDesignable->tipoActor->nombre,
                    ]);
                }
            }
        }

        DB::beginTransaction();
        try {
            // A. Registrar Historial del Movimiento
            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'        => $expediente->id,
                'actividad_origen_id'  => $expediente->actividad_actual_id,
                'transicion_id'        => $transicion->id,
                'actividad_destino_id' => $transicion->actividad_destino_id,
                'usuario_id'           => auth()->id(),
                'observaciones'        => $request->observaciones,
                'fecha_movimiento'     => now()
            ]);

            // B. Guardar documentos si los hay
            if ($request->hasFile('documentos_movimiento')) {
                $carpeta = $expediente->numero_expediente ?? 'temporal_' . $expediente->id;
                foreach ($request->file('documentos_movimiento') as $archivo) {
                    $ruta = $archivo->store("expedientes/{$carpeta}/movimientos", 'public');
                    Documento::create([
                        'modelo_tipo'       => ExpedienteMovimiento::class,
                        'modelo_id'         => $movimiento->id,
                        'tipo_documento'    => 'anexo_movimiento',
                        'tipo_documento_id' => $transicion->tipo_documento_id,
                        'nombre_original'   => $archivo->getClientOriginalName(),
                        'ruta_archivo'      => $ruta,
                        'peso_bytes'        => $archivo->getSize(),
                        'activo'            => 1,
                    ]);
                }
            }

            // C. Documentos por slot (requisitos configurados en la actividad)
            if ($request->documentos_requisito) {
                $carpeta = $expediente->numero_expediente ?? 'temporal_' . $expediente->id;
                foreach ($request->file('documentos_requisito') as $requisitoId => $archivo) {
                    // Desactivar versión anterior del mismo slot
                    ExpedienteDocumentoRequisito::where([
                        'expediente_id' => $expediente->id,
                        'requisito_id'  => $requisitoId,
                        'activo'        => true,
                    ])->update(['activo' => false]);

                    $ruta = $archivo->store("expedientes/{$carpeta}/requisitos", 'public');
                    ExpedienteDocumentoRequisito::create([
                        'expediente_id'  => $expediente->id,
                        'requisito_id'   => $requisitoId,
                        'movimiento_id'  => $movimiento->id,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'ruta_archivo'   => $ruta,
                        'peso_bytes'     => $archivo->getSize(),
                        'activo'         => true,
                    ]);
                }
            }

            // D. Designar actores (uno o varios según configuración de la transición)
            foreach ($transicion->actoresDesignables as $actorDesignable) {
                $usuarioId = $request->actores_designados[$actorDesignable->tipo_actor_id] ?? null;
                if ($usuarioId) {
                    ExpedienteActor::updateOrCreate(
                        ['expediente_id' => $expediente->id, 'tipo_actor_id' => $actorDesignable->tipo_actor_id],
                        ['usuario_id' => $usuarioId, 'activo' => 1]
                    );
                }
            }

            // E. Avanzar el flujo a la Actividad de Destino
            $actividadDestino = Actividad::find($transicion->actividad_destino_id);
            $expediente->update([
                'actividad_actual_id' => $transicion->actividad_destino_id,
                'etapa_actual_id'     => $actividadDestino->etapa_id,
            ]);

            // G. Rotar instancia: cerrar la activa y abrir la nueva con su fecha de vencimiento
            app(PlazoService::class)->avanzarInstancia($expediente, $actividadDestino, $movimiento->id);

            DB::commit();

            // H. Enviar notificaciones por correo (fuera de la transacción)
            if ($transicion->permite_notificar && !empty($request->notificar_a)) {
                $expediente->load(['solicitud', 'actividadActual']);

                $actoresANotificar = ExpedienteActor::with('usuario')
                    ->whereIn('id', $request->notificar_a)
                    ->where('expediente_id', $expediente->id)
                    ->where('activo', 1)
                    ->get();

                foreach ($actoresANotificar as $actor) {
                    $email  = $actor->usuario?->email ?? $actor->email_externo;
                    $nombre = $actor->usuario?->name  ?? $actor->nombre_externo ?? 'Participante';

                    if (!$email) {
                        continue;
                    }

                    try {
                        Mail::to($email, $nombre)->send(new ExpedienteNotificacionMail(
                            $expediente,
                            $movimiento,
                            $transicion,
                            $actividadDestino,
                            $nombre,
                        ));
                    } catch (\Exception $mailEx) {
                        \Log::warning("Fallo envío notificación actor {$actor->id}: " . $mailEx->getMessage());
                    }
                }
            }

            return back()->with('success', 'Acción registrada y expediente avanzado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error motor flujo: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar la acción dinámica.']);
        }
    }
}