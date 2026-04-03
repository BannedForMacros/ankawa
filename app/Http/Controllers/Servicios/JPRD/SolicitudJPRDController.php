<?php

namespace App\Http\Controllers\Servicios\JPRD;

use App\Http\Controllers\Controller;
use App\Models\Cargo;
use App\Models\Documento;
use App\Models\Servicio;
use App\Models\SolicitudJPRD;
use App\Mail\CargoSolicitudJPRDMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class SolicitudJPRDController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'servicio_id'               => 'required|exists:servicios,id',
            'nombre_solicitante'        => 'required|string|max:255',
            'tipo_documento_solicitante'=> 'required|string|in:dni,ruc,ce',
            'documento_solicitante'     => 'required|string|max:20',
            'emails_solicitante'        => 'required|string',
            'nombre_entidad'            => 'required|string|max:255',
            'ruc_entidad'               => 'required|string|max:11',
            'nombre_contratista'        => 'required|string|max:255',
            'ruc_contratista'           => 'required|string|max:11',
            'descripcion'               => 'required|string|max:3000',
            'documentos'                => 'nullable|array',
            'documentos.*'              => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        $emailsSolicitante = json_decode($request->emails_solicitante, true) ?? [];
        $emailPrincipal    = collect($emailsSolicitante)->first(fn($e) => !empty($e['email']));

        abort_unless($emailPrincipal, 422, 'Debe registrar al menos un correo del solicitante.');

        $solicitud = SolicitudJPRD::create([
            'servicio_id'                => $request->servicio_id,
            'nombre_solicitante'         => $request->nombre_solicitante,
            'tipo_documento_solicitante' => $request->tipo_documento_solicitante,
            'documento_solicitante'      => $request->documento_solicitante,
            'emails_solicitante'         => $emailsSolicitante,
            'nombre_entidad'             => $request->nombre_entidad,
            'ruc_entidad'                => $request->ruc_entidad,
            'telefono_entidad'           => $request->telefono_entidad,
            'emails_entidad'             => json_decode($request->emails_entidad ?? '[]', true) ?? [],
            'nombre_contratista'         => $request->nombre_contratista,
            'ruc_contratista'            => $request->ruc_contratista,
            'telefono_contratista'       => $request->telefono_contratista,
            'emails_contratista'         => json_decode($request->emails_contratista ?? '[]', true) ?? [],
            'descripcion'                => $request->descripcion,
            'observacion'                => $request->observacion,
            'estado'                     => 'pendiente',
        ]);

        $cargo = Cargo::crear('solicitud', $solicitud, null);
        $solicitud->update(['numero_cargo' => $cargo->numero_cargo]);

        // Guardar archivos adjuntos
        if ($request->hasFile('documentos')) {
            foreach ($request->file('documentos') as $archivo) {
                $ruta = $archivo->store('jprd/' . $solicitud->id, 'public');
                Documento::create([
                    'modelo_tipo'     => SolicitudJPRD::class,
                    'modelo_id'       => $solicitud->id,
                    'tipo_documento'  => 'solicitud',
                    'ruta_archivo'    => $ruta,
                    'nombre_original' => $archivo->getClientOriginalName(),
                    'peso_bytes'      => $archivo->getSize(),
                    'activo'          => 1,
                ]);
            }
        }

        try {
            Mail::to($emailPrincipal['email'])
                ->send(new CargoSolicitudJPRDMail($cargo, $solicitud));
        } catch (\Exception $e) {
            \Log::warning("Error enviando cargo JPRD #{$solicitud->id}: " . $e->getMessage());
        }

        return redirect()->route('mesa-partes.confirmacion', $cargo->numero_cargo);
    }
}
