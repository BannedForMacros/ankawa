<?php

namespace App\Http\Controllers\Servicios\Otros;

use App\Http\Controllers\Controller;
use App\Models\Cargo;
use App\Models\Servicio;
use App\Models\SolicitudOtros;
use App\Mail\CargoSolicitudOtrosMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SolicitudOtrosController extends Controller
{
    public function store(Request $request)
    {
        $servicio = Servicio::findOrFail($request->servicio_id);

        $request->validate([
            'servicio_id'          => 'required|exists:servicios,id',
            'tipo_documento_id'    => 'required|exists:tipo_documentos,id',
            'tipo_persona'         => 'nullable|in:natural,juridica',
            'tipo_doc_identidad'   => 'nullable|in:dni,ruc,ce',
            'numero_doc_identidad' => 'nullable|string|max:20',
            'nombre_remitente'     => 'required|string|max:255',
            'email_remitente'      => 'required|email|max:255',
            'descripcion'          => 'nullable|string|max:2000',
        ]);

        $solicitud = SolicitudOtros::create([
            'servicio_id'          => $request->servicio_id,
            'tipo_documento_id'    => $request->tipo_documento_id,
            'tipo_persona'         => $request->tipo_persona,
            'tipo_doc_identidad'   => $request->tipo_doc_identidad,
            'numero_doc_identidad' => $request->numero_doc_identidad,
            'nombre_remitente'     => $request->nombre_remitente,
            'email_remitente'      => $request->email_remitente,
            'descripcion'          => $request->descripcion,
            'observacion'          => $request->observacion,
        ]);

        $cargo = Cargo::crear('solicitud', $solicitud, null);
        $solicitud->update(['numero_cargo' => $cargo->numero_cargo]);

        try {
            Mail::to($request->email_remitente)
                ->queue(new CargoSolicitudOtrosMail($cargo, $solicitud));
        } catch (\Exception $e) {
            \Log::warning("Error enviando cargo otros #{$solicitud->id}: " . $e->getMessage());
        }

        return redirect()->route('mesa-partes.confirmacion', $cargo->numero_cargo);
    }
}
