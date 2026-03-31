<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoDocumento;
use App\Models\Servicio;
use App\Models\TipoActorExpediente;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TipoDocumentoController extends Controller
{
    public function index(Request $request)
    {
        $sortable = ['nombre', 'tamanio_maximo_mb', 'activo'];
        $sort     = in_array($request->sort, $sortable) ? $request->sort : 'nombre';
        $dir      = $request->dir === 'desc' ? 'desc' : 'asc';

        $tipos = TipoDocumento::withCount('documentos')
            ->with([
                'servicios' => fn($q) => $q->select('servicios.id', 'servicios.nombre'),
                'tiposActor',
            ])
            ->when($request->search, fn($q, $s) => $q->where('nombre', 'ilike', "%{$s}%"))
            ->orderBy($sort, $dir)
            ->paginate(15)
            ->withQueryString();

        $servicios  = Servicio::orderBy('nombre')->get(['id', 'nombre']);
        $tiposActor = TipoActorExpediente::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre', 'slug']);

        return Inertia::render('Configuracion/TiposDocumento/Index', [
            'tipos'      => $tipos,
            'servicios'  => $servicios,
            'tiposActor' => $tiposActor,
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
            'actores'                 => 'required|array',
            'actores.*.tipo_actor_id' => 'required|integer|exists:tipos_actor_expediente,id',
            'actores.*.activo'        => 'required|boolean',
            'actores.*.puede_subir'   => 'required|boolean',
            'actores.*.puede_ver'     => 'required|boolean',
        ]);

        $sync = [];
        foreach ($request->actores as $actor) {
            if ($actor['activo']) {
                $sync[$actor['tipo_actor_id']] = [
                    'puede_subir' => $actor['puede_subir'],
                    'puede_ver'   => $actor['puede_ver'],
                ];
            }
        }

        $tipoDocumento->tiposActor()->sync($sync);

        return back()->with('success', 'Permisos de actores actualizados correctamente.');
    }
}
