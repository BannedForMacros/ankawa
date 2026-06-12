<?php

namespace App\Http\Controllers\Servicios\Otros;

use App\Http\Controllers\Controller;
use App\Models\Cargo;
use App\Models\Servicio;
use App\Models\SolicitudOtros;
use App\Mail\CargoSolicitudOtrosMail;
use App\Support\AuditoriaPortal;
use App\Support\CaptchaValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SolicitudOtrosController extends Controller
{
    public function store(Request $request)
    {
        $servicio = Servicio::findOrFail($request->servicio_id);

        $request->validate([
            'servicio_id'            => 'required|exists:servicios,id',
            'tipo_documento_id'      => 'required|exists:tipo_documentos,id',
            'tipo_persona'           => 'nullable|in:natural,juridica',
            'tipo_doc_identidad'     => 'nullable|in:dni,ruc,ce',
            'numero_doc_identidad'   => 'nullable|string|max:20',
            'nombre_remitente'       => 'required|string|max:255',
            'email_remitente'        => 'required|email|max:255',
            'descripcion'            => 'nullable|string|max:2000',
            'observacion'            => 'nullable|string|max:2000',
            'acepta_reglamento_card' => 'nullable|in:0,1',
            'captcha_token'          => 'nullable|string',
        ]);

        if (!CaptchaValidator::valido($request->captcha_token, $request->ip())) {
            return back()->with('error', 'No pudimos verificar que eres humano. Recarga la página e intenta de nuevo.');
        }

        AuditoriaPortal::registrar('solicitud_enviada', $request, [
            'servicio_id' => $request->servicio_id,
            'tipo'        => 'otros',
        ]);

        // Solicitud + cargo en una sola transacción: sin número de cargo la solicitud
        // queda huérfana (sin seguimiento posible) y cada reintento crearía otra.
        try {
            [$solicitud, $cargo] = DB::transaction(function () use ($request) {
                $solicitud = SolicitudOtros::create([
                    'servicio_id'            => $request->servicio_id,
                    'tipo_documento_id'      => $request->tipo_documento_id,
                    'tipo_persona'           => $request->tipo_persona,
                    'tipo_doc_identidad'     => $request->tipo_doc_identidad,
                    'numero_doc_identidad'   => $request->numero_doc_identidad,
                    'nombre_remitente'       => $request->nombre_remitente,
                    'email_remitente'        => $request->email_remitente,
                    'descripcion'            => $request->descripcion,
                    'observacion'            => $request->observacion,
                    'acepta_reglamento_card' => $request->boolean('acepta_reglamento_card'),
                ]);

                $cargo = Cargo::crear('solicitud', $solicitud, null, null, $request);

                if (!$cargo) {
                    // El tipo de evento 'solicitud' está desactivado en Configuración → Tipos de Cargo.
                    // Sin cargo no hay número de seguimiento que mostrar al ciudadano: se revierte el ingreso.
                    throw new \RuntimeException('cargo_no_disponible');
                }

                $solicitud->update(['numero_cargo' => $cargo->numero_cargo]);

                return [$solicitud, $cargo];
            });
        } catch (\Throwable $e) {
            if (!($e instanceof \RuntimeException && $e->getMessage() === 'cargo_no_disponible')) {
                report($e);
            }
            return back()->with('error',
                'No es posible registrar la solicitud en este momento. Contacte con el centro.');
        }

        AuditoriaPortal::registrar('cargo_generado', $request, [
            'numero_cargo' => $cargo->numero_cargo,
        ], $solicitud);

        try {
            // QUEUE_CONNECTION=database sin worker: el cargo debe salir con send(), no queue().
            Mail::to($request->email_remitente)
                ->send(new CargoSolicitudOtrosMail($cargo, $solicitud));
        } catch (\Exception $e) {
            \Log::warning("Error enviando cargo otros #{$solicitud->id}: " . $e->getMessage());
        }

        return redirect()->route('mesa-partes.confirmacion', $cargo->numero_cargo);
    }
}
