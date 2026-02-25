<?php

namespace App\Http\Controllers;

use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\TipoActorExpediente;
use App\Models\ActividadTransicion;
use App\Models\Actividad;
use App\Models\User;
use App\Models\Documento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ExpedienteController extends Controller
{
    // ── 1. BANDEJA DE EXPEDIENTES (Para la Secretaría / Árbitros) ──
    public function index()
    {
        // Traemos los expedientes con su etapa, actividad actual y actores
        $expedientes = Expediente::with(['servicio', 'etapaActual', 'actividadActual'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function($exp) {
                return [
                    'id'                => $exp->id,
                    'numero_expediente' => $exp->numero_expediente,
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

    // ── 2. EL PUENTE: ADMITIR SOLICITUD A TRÁMITE (Nace el Expediente) ──
    public function admitir(Request $request, SolicitudArbitraje $solicitud)
    {
        if ($solicitud->expediente) {
            return back()->withErrors(['general' => 'Esta solicitud ya tiene un expediente generado.']);
        }

        DB::beginTransaction();

        try {
            $tipoActorDemandante = TipoActorExpediente::where('slug', 'demandante')->firstOrFail();
            $tipoActorDemandado  = TipoActorExpediente::where('slug', 'demandado')->firstOrFail();
            
            // Busca la primera actividad de la etapa 1 del servicio de esta solicitud
            $actividadInicial = Actividad::whereHas('etapa', function($q) use ($solicitud) {
                $q->where('servicio_id', $solicitud->servicio_id)->where('orden', 1);
            })->orderBy('orden')->firstOrFail();

            // Generar número: EXP-2026-0001-CARD
            $correlativo = str_pad($solicitud->id, 4, '0', STR_PAD_LEFT);
            $numeroExpediente = "EXP-" . date('Y') . "-{$correlativo}-CARD";

            // Nace el Expediente
            $expediente = Expediente::create([
                'solicitud_id'        => $solicitud->id,
                'servicio_id'         => $solicitud->servicio_id,
                'numero_expediente'   => $numeroExpediente,
                'etapa_actual_id'     => $actividadInicial->etapa_id,
                'actividad_actual_id' => $actividadInicial->id,
                'estado'              => 'en_proceso'
            ]);

            // Asignar al Demandante
            ExpedienteActor::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $solicitud->usuario_id, 
                'tipo_actor_id' => $tipoActorDemandante->id,
            ]);

            // Crear cuenta y asignar al Demandado
            $userDemandado = User::where('email', $solicitud->email_demandado)->first();
            if (!$userDemandado) {
                $userDemandado = User::create([
                    'name'     => $solicitud->nombre_demandado,
                    'email'    => $solicitud->email_demandado,
                    'password' => bcrypt(Str::random(10)),
                    'rol_id'   => 3, // Rol "Cliente" genérico
                    'activo'   => 1
                ]);
            }

            ExpedienteActor::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => $userDemandado->id,
                'tipo_actor_id' => $tipoActorDemandado->id,
            ]);

            // Registrar movimiento inicial
            ExpedienteMovimiento::create([
                'expediente_id'        => $expediente->id,
                'actividad_origen_id'  => clone $actividadInicial->id, // Truco temporal inicial
                'actividad_destino_id' => $actividadInicial->id,
                'usuario_id'           => auth()->id(),
                'observaciones'        => 'Admisión a trámite y generación de expediente.',
                'fecha_movimiento'     => now()
            ]);

            $solicitud->update(['estado' => 'admitida']);

            DB::commit();
            return redirect()->route('expedientes.show', $expediente->id)->with('success', "¡Expediente {$numeroExpediente} generado!");

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error admitiendo solicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Ocurrió un error al generar el expediente.']);
        }
    }

    // ── 3. VISOR DINÁMICO DEL EXPEDIENTE ──
    public function show(Expediente $expediente)
    {
        $expediente->load([
            'solicitud.documentos', 
            'etapaActual', 
            'actividadActual.roles', 
            'actividadActual.transiciones.accionCatalogo', 
            'actores.usuario', 
            'actores.tipoActor',
            'movimientos.usuario',
            'movimientos.actividadDestino',
            'movimientos' => function($q) {
                $q->orderByDesc('fecha_movimiento');
            }
        ]);

        $rolUsuarioId = auth()->user()->rol_id;

        // ¿Tiene permiso para ver botones en esta actividad?
        $puedeActuar = $expediente->actividadActual->roles->contains('id', $rolUsuarioId);

        return Inertia::render('Expedientes/Show', [
            'expediente'   => $expediente,
            'puedeActuar'  => $puedeActuar,
            'transiciones' => $puedeActuar ? $expediente->actividadActual->transiciones : []
        ]);
    }

    // ── 4. EL MOTOR: EJECUTAR LA ACCIÓN DINÁMICA ──
    public function registrarAccion(Request $request, Expediente $expediente)
    {
        $request->validate([
            'transicion_id'          => 'required|exists:actividad_transiciones,id',
            'observaciones'          => 'nullable|string',
            'documentos_movimiento'  => 'nullable|array',
            'documentos_movimiento.*'=> 'file|mimes:pdf,doc,docx|max:10240',
            'usuario_designado_id'   => 'nullable|exists:users,id',
            'notificar_a'            => 'nullable|array' // IDs de expediente_actores a notificar
        ]);

        $transicion = ActividadTransicion::findOrFail($request->transicion_id);

        if ($transicion->requiere_observacion && empty($request->observaciones)) {
            return back()->withErrors(['observaciones' => 'Esta acción requiere que ingrese un motivo/observación.']);
        }

        if ($transicion->requiere_documento && !$request->hasFile('documentos_movimiento')) {
            return back()->withErrors(['documentos_movimiento' => 'Esta acción exige adjuntar un documento.']);
        }

        DB::beginTransaction();
        try {
            // A. Registrar Historial
            $movimiento = ExpedienteMovimiento::create([
                'expediente_id'        => $expediente->id,
                'actividad_origen_id'  => $expediente->actividad_actual_id,
                'transicion_id'        => $transicion->id,
                'actividad_destino_id' => $transicion->actividad_destino_id,
                'usuario_id'           => auth()->id(),
                'observaciones'        => $request->observaciones,
                'fecha_movimiento'     => now()
            ]);

            // B. Guardar documentos del movimiento
            if ($request->hasFile('documentos_movimiento')) {
                foreach ($request->file('documentos_movimiento') as $archivo) {
                    $ruta = $archivo->store("expedientes/{$expediente->numero_expediente}/movimientos", 'public');
                    Documento::create([
                        'modelo_tipo'     => ExpedienteMovimiento::class,
                        'modelo_id'       => $movimiento->id,
                        'tipo_documento'  => 'anexo_movimiento',
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'ruta_archivo'    => $ruta,
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            // C. Designar nuevo actor si aplica
            if ($transicion->designa_tipo_actor_id && $request->usuario_designado_id) {
                ExpedienteActor::updateOrCreate(
                    [
                        'expediente_id' => $expediente->id,
                        'tipo_actor_id' => $transicion->designa_tipo_actor_id
                    ],
                    ['usuario_id' => $request->usuario_designado_id, 'activo' => 1]
                );
            }

            // D. Avanzar el flujo
            // Buscamos la actividad destino para saber de qué etapa es
            $actividadDestino = Actividad::find($transicion->actividad_destino_id);
            $expediente->update([
                'actividad_actual_id' => $transicion->actividad_destino_id,
                'etapa_actual_id'     => $actividadDestino->etapa_id
            ]);

            // E. Despachar Correos a los seleccionados (Se implementará el Mail luego)
            if (!empty($request->notificar_a)) {
                // Lógica de notificaciones a los IDs que vinieron en el array
            }

            DB::commit();
            return back()->with('success', 'Acción registrada y expediente avanzado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error motor flujo: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar la acción.']);
        }
    }
}