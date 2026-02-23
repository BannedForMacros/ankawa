<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\Correlativo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CorrelativoController extends Controller
{
    public function index(Request $request)
    {
        $query = Correlativo::query();

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('tipo', 'ilike', '%' . $request->search . '%')
                  ->orWhere('anio', 'ilike', '%' . $request->search . '%');
            });
        }

        $sortBy  = in_array($request->sort, ['id', 'tipo', 'anio', 'ultimo_numero', 'activo']) ? $request->sort : 'id';
        $sortDir = $request->dir === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sortBy, $sortDir);

        $correlativos = $query->paginate(20)->withQueryString();

        return Inertia::render('Configuracion/Correlativos/Index', [
            'correlativos' => $correlativos,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'tipo'          => 'required|string|max:50',
            'anio'          => 'required|integer|min:2000|max:2099',
            'ultimo_numero' => 'required|integer|min:0',
        ], [
            'tipo.required'          => 'El tipo es obligatorio.',
            'anio.required'          => 'El año es obligatorio.',
            'anio.integer'           => 'El año debe ser un número válido.',
            'ultimo_numero.required' => 'El último número es obligatorio.',
            'ultimo_numero.min'      => 'El último número no puede ser negativo.',
        ]);

        // No permitir duplicado tipo+anio
        $existe = Correlativo::where('tipo', $request->tipo)
            ->where('anio', $request->anio)
            ->exists();

        if ($existe) {
            return back()->withErrors([
                'tipo' => 'Ya existe un correlativo para ese tipo y año.',
            ]);
        }

        Correlativo::create([
            'tipo'          => strtoupper($request->tipo),
            'anio'          => $request->anio,
            'ultimo_numero' => $request->ultimo_numero,
            'activo'        => 1,
        ]);

        return back()->with('success', 'Correlativo creado correctamente.');
    }

    public function update(Request $request, Correlativo $correlativo)
    {
        $request->validate([
            'tipo'          => 'required|string|max:50',
            'anio'          => 'required|integer|min:2000|max:2099',
            'ultimo_numero' => 'required|integer|min:0',
            'activo'        => 'required|in:0,1',
        ], [
            'tipo.required'          => 'El tipo es obligatorio.',
            'anio.required'          => 'El año es obligatorio.',
            'ultimo_numero.required' => 'El último número es obligatorio.',
            'ultimo_numero.min'      => 'El último número no puede ser negativo.',
        ]);

        // Verificar duplicado excluyendo el actual
        $existe = Correlativo::where('tipo', $request->tipo)
            ->where('anio', $request->anio)
            ->where('id', '!=', $correlativo->id)
            ->exists();

        if ($existe) {
            return back()->withErrors([
                'tipo' => 'Ya existe un correlativo para ese tipo y año.',
            ]);
        }

        $correlativo->update([
            'tipo'          => strtoupper($request->tipo),
            'anio'          => $request->anio,
            'ultimo_numero' => $request->ultimo_numero,
            'activo'        => $request->activo,
        ]);

        return back()->with('success', 'Correlativo actualizado correctamente.');
    }

    public function destroy(Correlativo $correlativo)
    {
        $correlativo->update(['activo' => 0]);
        return back()->with('success', 'Correlativo desactivado correctamente.');
    }
}