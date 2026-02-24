<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use Inertia\Inertia;

class WelcomeController extends Controller
{
    public function index()
    {
        $servicios = Servicio::where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion']);

        return Inertia::render('Welcome', [
            'servicios' => $servicios,
        ]);
    }
}