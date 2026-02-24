<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Models\TipoActorExpediente;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Str;

class TipoActorController extends Controller
{
    public function index()
    {
        // Traemos todos, con un conteo de uso para saber si podemos eliminarlos o no
        $tipos = TipoActorExpediente::withCount(['actoresExpediente', 'transicionesQueLoDesignan'])
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Configuracion/TiposActor/Index', [
            'tipos' => $tipos
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
        ]);

        $slug = Str::slug($request->nombre, '_');

        // Validar que el slug autogenerado no exista
        if (TipoActorExpediente::where('slug', $slug)->exists()) {
            return back()->withErrors(['nombre' => 'Ya existe un tipo de actor con un nombre similar.']);
        }

        TipoActorExpediente::create([
            'nombre' => $request->nombre,
            'slug'   => $slug,
            'activo' => 1,
        ]);

        return back()->with('success', 'Tipo de Actor creado correctamente.');
    }

    public function update(Request $request, TipoActorExpediente $tipoActor)
    {
        $request->validate([
            'nombre' => 'required|string|max:100',
            'activo' => 'required|in:0,1',
        ]);

        $slug = Str::slug($request->nombre, '_');

        // Validar que el nuevo slug no pertenezca a OTRO registro
        if (TipoActorExpediente::where('slug', $slug)->where('id', '!=', $tipoActor->id)->exists()) {
            return back()->withErrors(['nombre' => 'El nombre genera un identificador que ya está en uso.']);
        }

        $tipoActor->update([
            'nombre' => $request->nombre,
            'slug'   => $slug,
            'activo' => $request->activo,
        ]);

        return back()->with('success', 'Tipo de Actor actualizado correctamente.');
    }

    public function destroy(TipoActorExpediente $tipoActor)
    {
        // Protección 1: ¿Hay expedientes usando este rol?
        if ($tipoActor->actoresExpediente()->exists()) {
            return back()->with('error', 'No se puede desactivar: Hay expedientes que tienen asignado este tipo de actor.');
        }

        // Protección 2: ¿Hay transiciones configuradas para designar este rol?
        if ($tipoActor->transicionesQueLoDesignan()->where('activo', 1)->exists()) {
            return back()->with('error', 'No se puede desactivar: Hay transiciones activas configuradas para designar este actor.');
        }

        $tipoActor->update(['activo' => 0]);

        return back()->with('success', 'Tipo de Actor desactivado correctamente.');
    }
}