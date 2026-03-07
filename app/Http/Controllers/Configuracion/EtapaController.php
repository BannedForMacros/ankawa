<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Etapa;
use App\Models\Actividad;
use App\Models\Servicio;
use App\Models\Rol;
use App\Models\TipoDocumento;
use App\Models\TransicionActorDesignable;
use App\Models\ActividadRequisitoDocumento;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EtapaController extends Controller
{
public function index(Request $request)
    {
        $servicios = Servicio::where('activo', 1)
            ->orderBy('nombre')
            ->with(['etapas' => function ($q) {
                $q->orderBy('orden')
                  ->with(['actividades' => function ($q2) {
                      // AQUÍ AÑADIMOS LAS TRANSICIONES
                      $q2->orderBy('orden')
                         ->with([
                             'roles',
                             'transiciones.actividadDestino',
                             'transiciones.accionCatalogo',
                             'transiciones.tipoDocumento',
                             'transiciones.actoresDesignables.tipoActor',
                             'requisitosDocumento.tipoDocumento',
                         ]);
                  }]);
            }])
            ->get();

        $roles = Rol::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']);
        
        $acciones = \App\Models\CatalogoAccion::where('activo', 1)->get();
        $tiposActor = \App\Models\TipoActorExpediente::where('activo', 1)->get();
        $tiposDocumento = TipoDocumento::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'slug', 'aplica_para']);

        $todasActividades = \App\Models\Actividad::where('activo', 1)
            ->with('etapa.servicio')
            ->get()
            ->map(function ($act) {
                return [
                    'id'             => $act->id,
                    'nombre_completo' => $act->etapa->servicio->nombre . ' > ' . $act->etapa->nombre . ' > ' . $act->nombre,
                ];
            });

        return Inertia::render('Configuracion/Etapas/Index', [
            'servicios'        => $servicios,
            'roles'            => $roles,
            'acciones'         => $acciones,
            'tiposActor'       => $tiposActor,
            'tiposDocumento'   => $tiposDocumento,
            'todasActividades' => $todasActividades,
        ]);
    }

    // ── ETAPAS ──

    public function storeEtapa(Request $request)
    {
        $request->validate([
            'servicio_id' => 'required|exists:servicios,id',
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'required|integer|min:1',
        ]);

        Etapa::create([
            'servicio_id' => $request->servicio_id,
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden,
            'activo'      => 1,
        ]);

        return back()->with('success', 'Etapa creada correctamente.');
    }

    public function updateEtapa(Request $request, Etapa $etapa)
    {
        $request->validate([
            'nombre'      => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'orden'       => 'required|integer|min:1',
            'activo'      => 'required|in:0,1',
        ]);

        $etapa->update([
            'nombre'      => $request->nombre,
            'descripcion' => $request->descripcion,
            'orden'       => $request->orden,
            'activo'      => $request->activo,
        ]);

        return back()->with('success', 'Etapa actualizada correctamente.');
    }

    public function destroyEtapa(Etapa $etapa)
    {
        if ($etapa->actividades()->where('activo', 1)->exists()) {
            return back()->with('error', 'No se puede desactivar una etapa con actividades activas.');
        }

        $etapa->update(['activo' => 0]);
        return back()->with('success', 'Etapa desactivada correctamente.');
    }

    // ── ACTIVIDADES ──

    public function storeActividad(Request $request)
    {
        $request->validate([
            'etapa_id'       => 'required|exists:etapas,id',
            'nombre'         => 'required|string|max:255',
            'descripcion'    => 'nullable|string',
            'tipo'           => 'nullable|string|max:50',
            'es_obligatorio' => 'required|in:0,1',
            'dias_plazo'     => 'nullable|integer|min:1',
            'orden'          => 'required|integer|min:1',
            'roles'          => 'nullable|array',
            'roles.*'        => 'exists:roles,id',
        ]);

        $actividad = Actividad::create([
            'etapa_id'       => $request->etapa_id,
            'nombre'         => $request->nombre,
            'descripcion'    => $request->descripcion,
            'tipo'           => $request->tipo,
            'es_obligatorio' => $request->es_obligatorio,
            'dias_plazo'     => $request->dias_plazo,
            'orden'          => $request->orden,
            'activo'         => 1,
        ]);

        // Sincronizar roles
        if ($request->roles) {
            $actividad->roles()->sync($request->roles);
        }

        return back()->with('success', 'Actividad creada correctamente.');
    }

    public function updateActividad(Request $request, Actividad $actividad)
    {
        $request->validate([
            'nombre'         => 'required|string|max:255',
            'descripcion'    => 'nullable|string',
            'tipo'           => 'nullable|string|max:50',
            'es_obligatorio' => 'required|in:0,1',
            'dias_plazo'     => 'nullable|integer|min:1',
            'orden'          => 'required|integer|min:1',
            'activo'         => 'required|in:0,1',
            'roles'          => 'nullable|array',
            'roles.*'        => 'exists:roles,id',
        ]);

        $actividad->update([
            'nombre'         => $request->nombre,
            'descripcion'    => $request->descripcion,
            'tipo'           => $request->tipo,
            'es_obligatorio' => $request->es_obligatorio,
            'dias_plazo'     => $request->dias_plazo,
            'orden'          => $request->orden,
            'activo'         => $request->activo,
        ]);

        // Sincronizar roles (sync elimina los anteriores y pone los nuevos)
        $actividad->roles()->sync($request->roles ?? []);

        return back()->with('success', 'Actividad actualizada correctamente.');
    }

    public function destroyActividad(Actividad $actividad)
    {
        $actividad->update(['activo' => 0]);
        return back()->with('success', 'Actividad desactivada correctamente.');
    }

    // ── TRANSICIONES DE ACTIVIDAD ──

    public function storeTransicion(Request $request, \App\Models\Actividad $actividad)
    {
        $request->validate([
            'catalogo_accion_id'                    => 'required|exists:catalogo_acciones,id',
            'etiqueta_boton'                        => 'required|string|max:255',
            'actividad_destino_id'                  => 'required|exists:actividades,id',
            'tipo_documento_id'                     => 'nullable|exists:tipo_documentos,id',
            'requiere_documento'                    => 'required|in:0,1',
            'permite_documento'                     => 'required|in:0,1',
            'requiere_observacion'                  => 'required|in:0,1',
            'actores_designables'                   => 'nullable|array',
            'actores_designables.*.tipo_actor_id'   => 'required|exists:tipos_actor_expediente,id',
            'actores_designables.*.es_obligatorio'  => 'required|boolean',
            'permite_editar_solicitud'              => 'nullable|boolean',
        ]);

        $transicion = \App\Models\ActividadTransicion::create([
            'actividad_origen_id'      => $actividad->id,
            'catalogo_accion_id'       => $request->catalogo_accion_id,
            'etiqueta_boton'           => $request->etiqueta_boton,
            'actividad_destino_id'     => $request->actividad_destino_id,
            'tipo_documento_id'        => $request->tipo_documento_id,
            'requiere_documento'       => $request->requiere_documento,
            'permite_documento'        => $request->permite_documento,
            'requiere_observacion'     => $request->requiere_observacion,
            'permite_editar_solicitud' => $request->boolean('permite_editar_solicitud', false),
            'activo'                   => 1,
        ]);

        foreach ($request->actores_designables ?? [] as $actor) {
            $transicion->actoresDesignables()->create([
                'tipo_actor_id'  => $actor['tipo_actor_id'],
                'es_obligatorio' => $actor['es_obligatorio'],
            ]);
        }

        return back()->with('success', 'Transición configurada correctamente.');
    }

    public function updateTransicion(Request $request, \App\Models\ActividadTransicion $transicion)
    {
        $request->validate([
            'catalogo_accion_id'                    => 'required|exists:catalogo_acciones,id',
            'etiqueta_boton'                        => 'required|string|max:255',
            'actividad_destino_id'                  => 'required|exists:actividades,id',
            'tipo_documento_id'                     => 'nullable|exists:tipo_documentos,id',
            'requiere_documento'                    => 'required|in:0,1',
            'permite_documento'                     => 'required|in:0,1',
            'requiere_observacion'                  => 'required|in:0,1',
            'actores_designables'                   => 'nullable|array',
            'actores_designables.*.tipo_actor_id'   => 'required|exists:tipos_actor_expediente,id',
            'actores_designables.*.es_obligatorio'  => 'required|boolean',
            'permite_editar_solicitud'              => 'nullable|boolean',
        ]);

        $transicion->update([
            'catalogo_accion_id'       => $request->catalogo_accion_id,
            'etiqueta_boton'           => $request->etiqueta_boton,
            'actividad_destino_id'     => $request->actividad_destino_id,
            'tipo_documento_id'        => $request->tipo_documento_id,
            'requiere_documento'       => $request->requiere_documento,
            'permite_documento'        => $request->permite_documento,
            'requiere_observacion'     => $request->requiere_observacion,
            'permite_editar_solicitud' => $request->boolean('permite_editar_solicitud', false),
        ]);

        // Reemplazar actores designables
        $transicion->actoresDesignables()->delete();
        foreach ($request->actores_designables ?? [] as $actor) {
            $transicion->actoresDesignables()->create([
                'tipo_actor_id'  => $actor['tipo_actor_id'],
                'es_obligatorio' => $actor['es_obligatorio'],
            ]);
        }

        return back()->with('success', 'Transición actualizada correctamente.');
    }

    public function destroyTransicion(\App\Models\ActividadTransicion $transicion)
    {
        $transicion->delete(); // Aquí usamos delete real porque es configuración interna
        return back()->with('success', 'Transición eliminada.');
    }

    // ── REQUISITOS DE DOCUMENTO POR ACTIVIDAD ──

    public function storeRequisito(Request $request, Actividad $actividad)
    {
        $request->validate([
            'nombre'            => 'required|string|max:200',
            'descripcion'       => 'nullable|string',
            'tipo_documento_id' => 'nullable|exists:tipo_documentos,id',
            'es_obligatorio'    => 'required|boolean',
            'orden'             => 'required|integer|min:1',
        ]);

        $actividad->requisitosDocumento()->create([
            'nombre'            => $request->nombre,
            'descripcion'       => $request->descripcion,
            'tipo_documento_id' => $request->tipo_documento_id,
            'es_obligatorio'    => $request->boolean('es_obligatorio'),
            'orden'             => $request->orden,
            'activo'            => true,
        ]);

        return back()->with('success', 'Requisito de documento agregado.');
    }

    public function updateRequisito(Request $request, ActividadRequisitoDocumento $requisito)
    {
        $request->validate([
            'nombre'            => 'required|string|max:200',
            'descripcion'       => 'nullable|string',
            'tipo_documento_id' => 'nullable|exists:tipo_documentos,id',
            'es_obligatorio'    => 'required|boolean',
            'orden'             => 'required|integer|min:1',
        ]);

        $requisito->update([
            'nombre'            => $request->nombre,
            'descripcion'       => $request->descripcion,
            'tipo_documento_id' => $request->tipo_documento_id,
            'es_obligatorio'    => $request->boolean('es_obligatorio'),
            'orden'             => $request->orden,
        ]);

        return back()->with('success', 'Requisito actualizado.');
    }

    public function destroyRequisito(ActividadRequisitoDocumento $requisito)
    {
        $requisito->update(['activo' => false]);
        return back()->with('success', 'Requisito desactivado.');
    }
}