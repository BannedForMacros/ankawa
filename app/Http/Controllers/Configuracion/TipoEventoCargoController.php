<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoEventoCargo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TipoEventoCargoController extends Controller
{
    public function index()
    {
        $tipos = TipoEventoCargo::withCount('cargos')
            ->orderBy('codigo')
            ->get();

        return Inertia::render('Configuracion/TiposEventoCargo/Index', [
            'tipos' => $tipos,
        ]);
    }

    public function update(Request $request, TipoEventoCargo $tipoEventoCargo)
    {
        $request->validate([
            'nombre'       => 'required|string|max:150',
            'descripcion'  => 'nullable|string|max:1000',
            'genera_cargo' => 'required|boolean',
            'activo'       => 'required|boolean',
        ]);

        $tipoEventoCargo->update([
            'nombre'       => $request->nombre,
            'descripcion'  => $request->descripcion,
            'genera_cargo' => $request->genera_cargo,
            'activo'       => $request->activo,
        ]);

        return back()->with('success', 'Tipo de evento de cargo actualizado correctamente.');
    }
}
