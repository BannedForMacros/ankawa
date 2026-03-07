<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedientePlazoOverride;
use App\Services\PlazoService;
use Illuminate\Http\Request;

class ExpedientePlazoController extends Controller
{
    private const SLUGS_GESTORES = ['administrador_ti', 'director', 'secretaria_general', 'secretaria_general_adjunta'];

    public function store(Request $request, Expediente $expediente)
    {
        abort_unless(in_array(auth()->user()->rol?->slug, self::SLUGS_GESTORES), 403);

        $request->validate([
            'dias_plazo' => 'required|integer|min:1|max:3650',
            'motivo'     => 'required|string|max:500',
        ]);

        ExpedientePlazoOverride::updateOrCreate(
            [
                'expediente_id' => $expediente->id,
                'actividad_id'  => $expediente->actividad_actual_id,
            ],
            [
                'dias_plazo'  => $request->dias_plazo,
                'motivo'      => $request->motivo,
                'usuario_id'  => auth()->id(),
                'activo'      => 1,
            ]
        );

        // Sincronizar fecha_vencimiento de la instancia activa
        app(PlazoService::class)->sincronizarInstancia($expediente);

        return back()->with('success', 'Plazo actualizado correctamente.');
    }

    public function destroy(Expediente $expediente)
    {
        abort_unless(in_array(auth()->user()->rol?->slug, self::SLUGS_GESTORES), 403);

        ExpedientePlazoOverride::where([
            'expediente_id' => $expediente->id,
            'actividad_id'  => $expediente->actividad_actual_id,
            'activo'        => 1,
        ])->update(['activo' => 0]);

        // Recalcular con plazo por defecto
        $expediente->load('actividadActual');
        app(PlazoService::class)->sincronizarInstancia($expediente);

        return back()->with('success', 'Override de plazo eliminado. Se aplica el plazo por defecto.');
    }
}
