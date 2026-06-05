<?php

namespace App\Http\Controllers\Configuracion;

use App\Http\Controllers\Controller;
use App\Services\SystemHealthService;
use Inertia\Inertia;

class EstadoSistemaController extends Controller
{
    public function __construct(private SystemHealthService $health) {}

    /** Página del panel — entrega el primer snapshot ya resuelto. */
    public function index()
    {
        return Inertia::render('Configuracion/EstadoSistema/Index', [
            'inicial' => $this->health->snapshot(),
        ]);
    }

    /** Endpoint de sondeo (polling) que el panel consulta cada pocos segundos. */
    public function check()
    {
        return response()->json($this->health->snapshot());
    }
}
