<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoDocumento;
use App\Models\Servicio;
use App\Models\TipoActorExpediente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TipoDocumentoController extends Controller
{
    public function index(Request $request)
    {
        $sortable = ['nombre', 'tamanio_maximo_mb', 'activo'];
        $sort     = in_array($request->sort, $sortable) ? $request->sort : 'nombre';
        $dir      = $request->dir === 'desc' ? 'desc' : 'asc';

        $tiposPage = TipoDocumento::withCount('documentos')
            ->with([
                'servicios' => fn($q) => $q->select('servicios.id', 'servicios.nombre'),
            ])
            ->when($request->search, fn($q, $s) => $q->where('nombre', 'ilike', "%{$s}%"))
            ->orderBy($sort, $dir)
            ->paginate(15)
            ->withQueryString();

        // Adjuntar pivots de actores a cada tipo_documento (raw, con servicio_id)
        $tipoIds = collect($tiposPage->items())->pluck('id');
        $pivots  = DB::table('tipo_actor_tipo_documento as tatd')
            ->join('tipos_actor_expediente as ta', 'ta.id', '=', 'tatd.tipo_actor_id')
            ->whereIn('tatd.tipo_documento_id', $tipoIds)
            ->select('tatd.tipo_documento_id', 'tatd.servicio_id', 'tatd.tipo_actor_id', 'ta.nombre as actor_nombre', 'tatd.puede_ver', 'tatd.puede_subir')
            ->get()
            ->groupBy('tipo_documento_id');

        $tiposPage->getCollection()->transform(function ($td) use ($pivots) {
            $td->actores_pivots = $pivots->get($td->id, collect())->values();
            return $td;
        });

        $servicios = Servicio::orderBy('nombre')->get(['id', 'nombre']);

        // Actores por servicio: para que el frontend sepa qué actores están disponibles en cada servicio
        $serviciosTiposActor = DB::table('servicio_tipos_actor as sta')
            ->join('tipos_actor_expediente as ta', 'ta.id', '=', 'sta.tipo_actor_id')
            ->where('sta.activo', 1)
            ->where('ta.activo', 1)
            ->select('sta.servicio_id', 'ta.id as tipo_actor_id', 'ta.nombre', 'ta.slug')
            ->orderBy('sta.orden')
            ->get()
            ->groupBy('servicio_id');

        return Inertia::render('Configuracion/TiposDocumento/Index', [
            'tipos'               => $tiposPage,
            'servicios'           => $servicios,
            'serviciosTiposActor' => $serviciosTiposActor,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre'              => 'required|string|max:150',
            'descripcion'         => 'nullable|string',
            'formatos_permitidos' => 'nullable|string|max:255',
            'tamanio_maximo_mb'   => 'nullable|integer|min:1|max:500',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (TipoDocumento::where('slug', $slug)->exists()) {
            return back()->withErrors(['nombre' => 'Ya existe un tipo de documento con un nombre similar.']);
        }

        TipoDocumento::create([
            'nombre'              => $request->nombre,
            'slug'                => $slug,
            'descripcion'         => $request->descripcion,
            'aplica_para'         => 'ambos',
            'formatos_permitidos' => $request->formatos_permitidos ?? 'pdf,doc,docx',
            'tamanio_maximo_mb'   => $request->tamanio_maximo_mb ?? 10,
            'activo'              => 1,
        ]);

        return back()->with('success', 'Tipo de Documento creado correctamente.');
    }

    public function update(Request $request, TipoDocumento $tipoDocumento)
    {
        $request->validate([
            'nombre'              => 'required|string|max:150',
            'descripcion'         => 'nullable|string',
            'formatos_permitidos' => 'nullable|string|max:255',
            'tamanio_maximo_mb'   => 'nullable|integer|min:1|max:500',
            'activo'              => 'required|in:0,1',
        ]);

        $slug = Str::slug($request->nombre, '_');

        if (TipoDocumento::where('slug', $slug)->where('id', '!=', $tipoDocumento->id)->exists()) {
            return back()->withErrors(['nombre' => 'El nombre genera un identificador que ya está en uso.']);
        }

        $tipoDocumento->update([
            'nombre'              => $request->nombre,
            'slug'                => $slug,
            'descripcion'         => $request->descripcion,
            'formatos_permitidos' => $request->formatos_permitidos,
            'tamanio_maximo_mb'   => $request->tamanio_maximo_mb,
            'activo'              => $request->activo,
        ]);

        return back()->with('success', 'Tipo de Documento actualizado correctamente.');
    }

    public function destroy(TipoDocumento $tipoDocumento)
    {
        if ($tipoDocumento->documentos()->exists()) {
            return back()->with('error', 'No se puede desactivar: hay documentos registrados con este tipo.');
        }

        $tipoDocumento->update(['activo' => 0]);

        return back()->with('success', 'Tipo de Documento desactivado correctamente.');
    }

    public function syncServicios(Request $request, TipoDocumento $tipoDocumento)
    {
        $request->validate([
            'servicios'                      => 'required|array',
            'servicios.*.servicio_id'        => 'required|integer|exists:servicios,id',
            'servicios.*.activo'             => 'required|boolean',
            'servicios.*.es_para_solicitud'  => 'required|boolean',
        ]);

        $sync = [];
        foreach ($request->servicios as $srv) {
            if ($srv['activo']) {
                $sync[$srv['servicio_id']] = [
                    'es_para_solicitud' => $srv['es_para_solicitud'],
                ];
            }
        }

        $tipoDocumento->servicios()->sync($sync);

        return back()->with('success', 'Servicios actualizados correctamente.');
    }

    public function syncActores(Request $request, TipoDocumento $tipoDocumento)
    {
        $request->validate([
            'servicio_id'             => 'required|integer|exists:servicios,id',
            'actores'                 => 'required|array',
            'actores.*.tipo_actor_id' => 'required|integer|exists:tipos_actor_expediente,id',
            'actores.*.activo'        => 'required|boolean',
            'actores.*.puede_subir'   => 'required|boolean',
            'actores.*.puede_ver'     => 'required|boolean',
        ]);

        $servicioId = $request->servicio_id;

        // Borrar solo los registros del servicio seleccionado para este tipo de documento
        DB::table('tipo_actor_tipo_documento')
            ->where('tipo_documento_id', $tipoDocumento->id)
            ->where('servicio_id', $servicioId)
            ->delete();

        // Insertar los activos
        $inserts = [];
        foreach ($request->actores as $actor) {
            if ($actor['activo']) {
                $inserts[] = [
                    'servicio_id'      => $servicioId,
                    'tipo_actor_id'    => $actor['tipo_actor_id'],
                    'tipo_documento_id' => $tipoDocumento->id,
                    'puede_ver'        => $actor['puede_ver'],
                    'puede_subir'      => $actor['puede_subir'],
                ];
            }
        }

        if (!empty($inserts)) {
            DB::table('tipo_actor_tipo_documento')->insert($inserts);
        }

        return back()->with('success', 'Permisos de actores actualizados correctamente.');
    }
}
