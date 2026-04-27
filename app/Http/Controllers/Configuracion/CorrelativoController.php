<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Correlativo;
use App\Models\TipoCorrelativo;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CorrelativoController extends Controller
{
    public function index(Request $request)
    {
        $query = Correlativo::with(['tipoCorrelativo', 'servicio']);

        if ($request->filled('search')) {
            $busqueda = $request->search;
            $query->where(function ($q) use ($busqueda) {
                $q->whereHas('tipoCorrelativo', fn($q2) =>
                    $q2->where('nombre', 'ilike', "%{$busqueda}%")
                       ->orWhere('codigo', 'ilike', "%{$busqueda}%")
                )
                ->orWhere('codigo_servicio', 'ilike', "%{$busqueda}%")
                ->orWhere('anio', 'ilike', "%{$busqueda}%");
            });
        }

        $sortBy  = in_array($request->sort, ['id', 'anio', 'ultimo_numero', 'activo']) ? $request->sort : 'id';
        $sortDir = $request->dir === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $correlativos     = $query->paginate(20)->withQueryString();
        // Enviamos también `prefijo`, `formato`, `aplica_sufijo_centro` y `activo` para que la
        // pantalla pueda renderizar el preview real y abrir el modal de edición de formato.
        $tiposCorrelativo = TipoCorrelativo::orderBy('id')
            ->get(['id', 'nombre', 'codigo', 'prefijo', 'formato', 'aplica_sufijo_centro', 'activo']);
        $servicios        = Servicio::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Configuracion/Correlativos/Index', [
            'correlativos'     => $correlativos,
            'tiposCorrelativo' => $tiposCorrelativo,
            'servicios'        => $servicios,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tipo_correlativo_id' => 'required|exists:tipos_correlativo,id',
            'servicio_id'         => 'nullable|exists:servicios,id',
            'codigo_servicio'     => 'nullable|string|max:50',
            'anio'                => 'required|integer|min:2000|max:2099',
            'ultimo_numero'       => 'required|integer|min:0',
        ], [
            'tipo_correlativo_id.required' => 'El tipo de correlativo es obligatorio.',
            'anio.required'                => 'El año es obligatorio.',
            'ultimo_numero.min'            => 'El último número no puede ser negativo.',
        ]);

        // Si no se pasa código de servicio, derivarlo: slug del servicio en mayúsculas o 'GEN'
        $codigoServicio = $request->codigo_servicio
            ? strtoupper(trim($request->codigo_servicio))
            : ($request->servicio_id
                ? strtoupper(\App\Models\Servicio::find($request->servicio_id)?->slug ?? 'GEN')
                : 'GEN');

        $existe = Correlativo::where('tipo_correlativo_id', $request->tipo_correlativo_id)
            ->where(function ($q) use ($request) {
                $request->servicio_id
                    ? $q->where('servicio_id', $request->servicio_id)
                    : $q->whereNull('servicio_id');
            })
            ->where('anio', $request->anio)
            ->exists();

        if ($existe) {
            return back()->withErrors([
                'tipo_correlativo_id' => 'Ya existe un correlativo para ese tipo, servicio y año.',
            ]);
        }

        Correlativo::create([
            'tipo_correlativo_id' => $request->tipo_correlativo_id,
            'servicio_id'         => $request->servicio_id ?: null,
            'codigo_servicio'     => $codigoServicio,
            'anio'                => $request->anio,
            'ultimo_numero'       => $request->ultimo_numero,
            'activo'              => true,
        ]);

        return back()->with('success', 'Correlativo creado correctamente.');
    }

    public function update(Request $request, Correlativo $correlativo)
    {
        $request->validate([
            'tipo_correlativo_id' => 'required|exists:tipos_correlativo,id',
            'servicio_id'         => 'nullable|exists:servicios,id',
            'codigo_servicio'     => 'nullable|string|max:50',
            'anio'                => 'required|integer|min:2000|max:2099',
            'ultimo_numero'       => 'required|integer|min:0',
            'activo'              => 'required|boolean',
        ]);

        $codigoServicio = $request->codigo_servicio
            ? strtoupper(trim($request->codigo_servicio))
            : ($request->servicio_id
                ? strtoupper(\App\Models\Servicio::find($request->servicio_id)?->slug ?? 'GEN')
                : 'GEN');

        $existe = Correlativo::where('tipo_correlativo_id', $request->tipo_correlativo_id)
            ->where(function ($q) use ($request) {
                $request->servicio_id
                    ? $q->where('servicio_id', $request->servicio_id)
                    : $q->whereNull('servicio_id');
            })
            ->where('anio', $request->anio)
            ->where('id', '!=', $correlativo->id)
            ->exists();

        if ($existe) {
            return back()->withErrors([
                'tipo_correlativo_id' => 'Ya existe un correlativo para ese tipo, servicio y año.',
            ]);
        }

        $correlativo->update([
            'tipo_correlativo_id' => $request->tipo_correlativo_id,
            'servicio_id'         => $request->servicio_id ?: null,
            'codigo_servicio'     => $codigoServicio,
            'anio'                => $request->anio,
            'ultimo_numero'       => $request->ultimo_numero,
            'activo'              => $request->activo,
        ]);

        return back()->with('success', 'Correlativo actualizado correctamente.');
    }

    public function destroy(Correlativo $correlativo)
    {
        $correlativo->update(['activo' => false]);
        return back()->with('success', 'Correlativo desactivado correctamente.');
    }
}
