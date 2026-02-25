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
            'actores.usuario', 
            'actores.tipoActor',
            'movimientos.usuario',
            'movimientos.actividadDestino',
            'movimientos' => function($q) {
                $q->orderByDesc('fecha_movimiento');
            }
        ]);

        $rolUsuarioId = auth()->user()->rol_id;
        $puedeActuar = $expediente->actividadActual->roles->contains('id', $rolUsuarioId);

        return Inertia::render('Expedientes/Show', [
            'expediente'   => $expediente,
            'puedeActuar'  => $puedeActuar,
            'transiciones' => $puedeActuar ? $expediente->actividadActual->transiciones : []
        ]);
    }

    // ── 3. EL MOTOR ÚNICO Y DINÁMICO DE ACCIONES ──
    public function registrarAccion(Request $request, Expediente $expediente)
    {
        $request->validate([
            'transicion_id'          => 'required|exists:actividad_transiciones,id',
            'observaciones'          => 'nullable|string',
            'numero_expediente'      => 'nullable|string|unique:expedientes,numero_expediente,' . $expediente->id, // Para el momento en que se admite manualmente
            'documentos_movimiento'  => 'nullable|array',
            'documentos_movimiento.*'=> 'file|mimes:pdf,doc,docx|max:10240',
            'usuario_designado_id'   => 'nullable|exists:users,id',
            'notificar_a'            => 'nullable|array'
        ]);

        $transicion = ActividadTransicion::findOrFail($request->transicion_id);

        if ($transicion->requiere_observacion && empty($request->observaciones)) {
            return back()->withErrors(['observaciones' => 'Esta acción requiere que ingrese un motivo u observación (Ej: Motivo de subsanación o rechazo).']);
        }

        if ($transicion->requiere_documento && !$request->hasFile('documentos_movimiento')) {
            return back()->withErrors(['documentos_movimiento' => 'Esta acción exige adjuntar un documento.']);
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
                // Usamos el ID del expediente como fallback si aún no tiene número oficial
                $carpeta = $expediente->numero_expediente ?? 'temporal_' . $expediente->id;
                foreach ($request->file('documentos_movimiento') as $archivo) {
                    $ruta = $archivo->store("expedientes/{$carpeta}/movimientos", 'public');
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

            // C. Asignar nuevo actor (Ej: Designar Árbitro)
            if ($transicion->designa_tipo_actor_id && $request->usuario_designado_id) {
                ExpedienteActor::updateOrCreate(
                    [
                        'expediente_id' => $expediente->id,
                        'tipo_actor_id' => $transicion->designa_tipo_actor_id
                    ],
                    ['usuario_id' => $request->usuario_designado_id, 'activo' => 1]
                );
            }

            // D. INYECCIÓN MANUAL DEL NÚMERO DE EXPEDIENTE (Cuando la Secretaria lo admite formalmente)
            if ($request->filled('numero_expediente') && empty($expediente->numero_expediente)) {
                $expediente->numero_expediente = $request->numero_expediente;
                // De forma opcional, si tu lógica de negocio lo requiere, marcamos la solicitud base como admitida
                if ($expediente->solicitud) {
                    $expediente->solicitud->update(['estado' => 'admitida']);
                }
            }

            // E. Avanzar el flujo a la Actividad de Destino
            $actividadDestino = Actividad::find($transicion->actividad_destino_id);
            $expediente->update([
                'actividad_actual_id' => $transicion->actividad_destino_id,
                'etapa_actual_id'     => $actividadDestino->etapa_id
            ]);

            DB::commit();
            return back()->with('success', 'Acción registrada y expediente avanzado correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error motor flujo: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al procesar la acción dinámica.']);
        }
    }
}