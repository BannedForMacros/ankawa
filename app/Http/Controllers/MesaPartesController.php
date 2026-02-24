<?php

namespace App\Http\Controllers;

use App\Models\SolicitudArbitraje;
use App\Models\ExpedienteArbSubsanacion;
use App\Models\ExpedienteArbNotificacion;
use App\Models\Documento;
use App\Models\Servicio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class MesaPartesController extends Controller
{
    // ── Página pública — presentar solicitud ──
    public function index()
    {
        $servicios = Servicio::where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'descripcion']);

        return Inertia::render('MesaPartes/Index', [
            'servicios' => $servicios,
        ]);
    }

    // ── Bandeja Secretaria Adjunta ──
    public function bandeja(Request $request)
    {
        $filtro = $request->get('filtro', 'todos');

        $query = SolicitudArbitraje::with([
                'servicio',
                'subsanaciones' => fn($q) => $q->where('activo', true)->orderByDesc('created_at'),
                'subsanaciones.registradoPor',
            ])
            ->whereDoesntHave('expediente') // Solo las que NO son expediente aún
            ->orderByDesc('created_at');

        if ($filtro !== 'todos') {
            $query->where('estado', $filtro);
        }

        $solicitudes = $query->get()->map(fn($s) => [
            'id'                  => $s->id,
            'numero_cargo'        => $s->numero_cargo,
            'servicio'            => $s->servicio->nombre,
            'tipo_persona'        => $s->tipo_persona,
            'nombre_demandante'   => $s->nombre_demandante,
            'documento_demandante'=> $s->documento_demandante,
            'email_demandante'    => $s->email_demandante,
            'telefono_demandante' => $s->telefono_demandante,
            'nombre_demandado'    => $s->nombre_demandado,
            'email_demandado'     => $s->email_demandado,
            'monto_involucrado'   => $s->monto_involucrado,
            'resumen_controversia'=> $s->resumen_controversia,
            'estado'              => $s->estado,
            'created_at'          => $s->created_at->format('d/m/Y H:i'),
            'subsanacion_activa'  => $s->subsanaciones
                ->where('estado', 'pendiente')
                ->first(),
        ]);

        // Contadores para los badges del filtro
        $contadores = [
            'todos'       => SolicitudArbitraje::whereDoesntHave('expediente')->count(),
            'pendiente'   => SolicitudArbitraje::whereDoesntHave('expediente')->where('estado', 'pendiente')->count(),
            'subsanacion' => SolicitudArbitraje::whereDoesntHave('expediente')->where('estado', 'subsanacion')->count(),
            'rechazada'   => SolicitudArbitraje::whereDoesntHave('expediente')->where('estado', 'rechazada')->count(),
        ];

        return Inertia::render('MesaPartes/Bandeja', [
            'solicitudes' => $solicitudes,
            'filtroActual'=> $filtro,
            'contadores'  => $contadores,
        ]);
    }

    // ── Mis Solicitudes (Cliente) ──
    public function misSolicitudes()
    {
        $user = Auth::user();

        $solicitudes = SolicitudArbitraje::with([
                'servicio',
                'expediente', // Para saber si ya es expediente
                'subsanaciones' => fn($q) => $q
                    ->where('activo', true)
                    ->orderByDesc('created_at'),
                'documentos',
            ])
            ->where('email_demandante', $user->email)
            ->orWhere('usuario_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($s) => [
                'id'                  => $s->id,
                'numero_cargo'        => $s->numero_cargo,
                'servicio'            => $s->servicio->nombre,
                'nombre_demandado'    => $s->nombre_demandado,
                'monto_involucrado'   => $s->monto_involucrado,
                'estado'              => $s->estado,
                'created_at'          => $s->created_at->format('d/m/Y H:i'),
                'expediente_id'       => $s->expediente?->id,
                'numero_expediente'   => $s->expediente?->numero_expediente,
                'subsanacion_activa'  => $s->subsanaciones
                    ->where('estado', 'pendiente')
                    ->first(),
                'documentos'          => $s->documentos->map(fn($d) => [
                    'id'             => $d->id,
                    'nombre_original'=> $d->nombre_original,
                    'tipo_documento' => $d->tipo_documento,
                    'ruta_archivo'   => $d->ruta_archivo,
                    'created_at'     => $d->created_at->format('d/m/Y'),
                ]),
            ]);

        return Inertia::render('MesaPartes/MisSolicitudes', [
            'solicitudes' => $solicitudes,
        ]);
    }

    // ── Subsanar (Cliente sube documentos y responde) ──
    public function subsanar(Request $request, SolicitudArbitraje $solicitud)
    {
        // Solo el dueño puede subsanar
        abort_if(
            $solicitud->email_demandante !== Auth::user()->email &&
            $solicitud->usuario_id !== Auth::id(),
            403
        );

        $request->validate([
            'respuesta'    => 'required|string|max:2000',
            'documentos'   => 'nullable|array',
            'documentos.*' => 'file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',
        ], [
            'respuesta.required'    => 'Debe escribir una respuesta a la observación.',
            'documentos.*.mimes'    => 'Solo se permiten archivos PDF, imágenes o documentos Word.',
            'documentos.*.max'      => 'Cada archivo no debe superar 10MB.',
        ]);

        DB::beginTransaction();
        try {
            // 1. Marcar subsanación como resuelta
            $subsanacion = ExpedienteArbSubsanacion::where('solicitud_id', $solicitud->id)
                ->where('estado', 'pendiente')
                ->where('activo', true)
                ->first();

            if ($subsanacion) {
                $subsanacion->update([
                    'estado'            => 'subsanado',
                    'subsanado_por'     => Auth::id(),
                    'fecha_subsanacion' => now(),
                    'respuesta'         => $request->respuesta,
                ]);
            }

            // 2. Subir documentos si los hay
            if ($request->hasFile('documentos')) {
                foreach ($request->file('documentos') as $archivo) {
                    $ruta = $archivo->store(
                        'solicitudes/' . $solicitud->id . '/subsanaciones',
                        'public'
                    );

                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'subsanacion',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => true,
                    ]);
                }
            }

            // 3. Volver estado a pendiente para que secretaria lo revise
            $solicitud->update(['estado' => 'pendiente']);

            // 4. Notificar a secretaria
            ExpedienteArbNotificacion::create([
                'solicitud_id'       => $solicitud->id,
                'enviado_por'        => Auth::id(),
                'destinatario_nombre'=> 'Secretaría General Adjunta',
                'destinatario_email' => config('mail.from.address'),
                'asunto'             => 'Solicitud subsanada: ' . $solicitud->numero_cargo,
                'tipo'               => 'subsanacion',
                'estado_envio'       => 'enviado',
                'activo'             => true,
            ]);

            DB::commit();
            return back()->with('success', 'Subsanación enviada correctamente. La secretaría revisará su respuesta.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error subsanar: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al enviar la subsanación.']);
        }
    }

    // ── Actualizar solicitud (Cliente — solo en estado subsanacion) ──
    public function actualizarSolicitud(Request $request, SolicitudArbitraje $solicitud)
    {
        // Solo el dueño
        abort_if(
            $solicitud->email_demandante !== Auth::user()->email &&
            $solicitud->usuario_id !== Auth::id(),
            403
        );

        // Solo si está en subsanacion
        abort_if($solicitud->estado !== 'subsanacion', 422, 'La solicitud no está en estado de subsanación.');

        $request->validate([
            // Demandante — solo domicilio
            'domicilio_demandante'  => 'nullable|string|max:500',

            // Demandado — todo editable
            'nombre_demandado'      => 'required|string|max:255',
            'documento_demandado'   => 'nullable|string|max:50',
            'email_demandado'       => 'required|email|max:255',
            'telefono_demandado'    => 'nullable|string|max:20',
            'domicilio_demandado'   => 'nullable|string|max:500',

            // Controversia
            'resumen_controversia'  => 'required|string',
            'pretensiones'          => 'required|string',
            'monto_involucrado'     => 'nullable|numeric|min:0',

            // Documentos nuevos
            'documentos_nuevos'     => 'nullable|array',
            'documentos_nuevos.*'   => 'file|mimes:pdf,jpg,jpeg,png,doc,docx|max:10240',

            // IDs de documentos a eliminar
            'documentos_eliminar'   => 'nullable|array',
            'documentos_eliminar.*' => 'exists:documentos,id',
        ]);

        DB::beginTransaction();
        try {
            // Actualizar campos permitidos
            $solicitud->update([
                'domicilio_demandante' => $request->domicilio_demandante,
                'nombre_demandado'     => $request->nombre_demandado,
                'documento_demandado'  => $request->documento_demandado,
                'email_demandado'      => $request->email_demandado,
                'telefono_demandado'   => $request->telefono_demandado,
                'domicilio_demandado'  => $request->domicilio_demandado,
                'resumen_controversia' => $request->resumen_controversia,
                'pretensiones'         => $request->pretensiones,
                'monto_involucrado'    => $request->monto_involucrado,
            ]);

            // Eliminar documentos marcados
            if ($request->documentos_eliminar) {
                $docs = Documento::whereIn('id', $request->documentos_eliminar)
                    ->where('modelo_tipo', SolicitudArbitraje::class)
                    ->where('modelo_id', $solicitud->id)
                    ->get();

                foreach ($docs as $doc) {
                    Storage::disk('public')->delete($doc->ruta_archivo);
                    $doc->delete();
                }
            }

            // Subir documentos nuevos
            if ($request->hasFile('documentos_nuevos')) {
                foreach ($request->file('documentos_nuevos') as $archivo) {
                    $ruta = $archivo->store(
                        'solicitudes/' . $solicitud->id . '/documentos',
                        'public'
                    );

                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'subsanacion',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => true,
                    ]);
                }
            }

            DB::commit();
            return back()->with('success', 'Solicitud actualizada correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('actualizarSolicitud: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al actualizar.']);
        }
    }
}