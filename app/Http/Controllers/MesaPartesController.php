<?php

namespace App\Http\Controllers;

use App\Models\Servicio;
use App\Support\FileRules;
use App\Models\SolicitudArbitraje;
use App\Models\SolicitudJPRD;
use App\Models\SolicitudOtros;
use App\Models\SolicitudSubsanacion;
use App\Models\Documento;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Mail\CodigoVerificacionMail;
use Inertia\Inertia;

class MesaPartesController extends Controller
{
    // =======================================================
    // 1. MÉTODOS PÚBLICOS (Sin Login)
    // =======================================================

    // ── Entrada unificada — Login OTP ──
    public function index()
    {
        if (session('portal_email')) {
            return redirect()->route('mesa-partes.inicio');
        }
        return Inertia::render('MesaPartes/Login');
    }

    // ── Formulario de solicitud por slug (protegido por portal.auth) ──
    public function formularioPorSlug(string $slug)
    {
        $servicio = Servicio::where('slug', $slug)->where('activo', 1)->firstOrFail();
        $email    = session('portal_email');
        $usuario  = User::where('email', $email)->first();

        $portalUser = $usuario ? [
            'name'             => $usuario->name,
            'email'            => $email,
            'numero_documento' => $usuario->numero_documento,
            'telefono'         => $usuario->telefono,
            'direccion'        => $usuario->direccion,
            'tipo_persona'     => $usuario->tipo_persona,
        ] : null;

        return Inertia::render('MesaPartes/Solicitud', [
            'servicio'   => $servicio,
            'portalEmail' => $email,
            'portalUser'  => $portalUser,
        ]);
    }

    // ── Enviar OTP al email del demandante ──
    public function enviarCodigo(Request $request)
    {
        $request->validate([
            'email'     => 'required|email',
            'nombre'    => 'required|string',
            'documento' => 'required|string', // <-- AHORA RECIBIMOS EL DNI/RUC
            'servicio'  => 'required|string',
        ]);

        // 1. VALIDACIÓN ESTRICTA: ¿El correo o el documento ya existen?
        $userExists = \App\Models\User::where('email', $request->email)
            ->orWhere('numero_documento', $request->documento)
            ->exists();

        if ($userExists) {
            // Retornamos un error 409 (Conflicto) para que React lo atrape
            return response()->json([
                'ok'      => false,
                'mensaje' => 'Este correo electrónico o número de documento ya se encuentra registrado. Por favor, inicie sesión en su cuenta.'
            ], 409);
        }

        // 2. Si no existe, enviamos el código OTP normal
        VerificationCode::where('email', $request->email)
            ->where('usado', false)
            ->update(['usado' => true]);

        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'email'      => $request->email,
            'codigo'     => $codigo,
            'expires_at' => now()->addMinutes(15),
            'usado'      => false,
        ]);

        Mail::to($request->email)->send(
            new CodigoVerificacionMail($request->nombre, $codigo, $request->servicio)
        );

        return response()->json(['ok' => true]);
    }

    // ── Verificar OTP ──
    public function verificarCodigo(Request $request)
    {
        $request->validate([
            'email'  => 'required|email',
            'codigo' => 'required|string|size:6',
        ]);

        $registro = VerificationCode::where('email', $request->email)
            ->where('codigo', $request->codigo)
            ->where('usado', false)
            ->latest()
            ->first();

        if (!$registro || !$registro->esValido()) {
            return response()->json([
                'ok'      => false,
                'mensaje' => 'El codigo es invalido o ha expirado.',
            ], 422);
        }

        $registro->update(['usado' => true]);

        return response()->json(['ok' => true]);
    }

    // ── Pantalla final de Confirmación ──
    public function confirmacion($numeroCargo)
    {
        return Inertia::render('MesaPartes/Confirmacion', [
            'numeroCargo' => $numeroCargo
        ]);
    }


    // =======================================================
    // 2. MÉTODOS PRIVADOS (Requieren Login)
    // =======================================================

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

        // ── 1. Arbitraje (incluye Arbitraje de Emergencia) ──
        $arbitraje = SolicitudArbitraje::with([
                'servicio',
                'expediente',
                'subsanaciones' => fn($q) => $q->where('activo', true)->orderByDesc('created_at'),
                'documentos',
            ])
            ->where(function ($q) use ($user) {
                $q->where('email_demandante', $user->email)
                  ->orWhere('usuario_id', $user->id);
            })
            ->get()
            ->map(fn($s) => $this->mapSolicitudArbitraje($s));

        // ── 2. JPRD ──
        $jprd = SolicitudJPRD::with([
                'servicio',
                'expediente',
                'documentos',
            ])
            ->where('usuario_id', $user->id)
            ->get()
            ->map(fn($s) => $this->mapSolicitudJPRD($s));

        // ── 3. Otros ──
        $otros = SolicitudOtros::with(['servicio', 'tipoDocumento'])
            ->where('email_remitente', $user->email)
            ->get()
            ->map(fn($s) => $this->mapSolicitudOtros($s));

        $solicitudes = $arbitraje
            ->concat($jprd)
            ->concat($otros)
            ->sortByDesc('created_at_raw')
            ->values();

        return Inertia::render('MesaPartes/MisSolicitudes', [
            'solicitudes' => $solicitudes,
        ]);
    }

    private function mapSolicitudArbitraje(SolicitudArbitraje $s): array
    {
        $slug = $s->servicio?->slug;

        return [
            'id'                     => 'arbitraje:' . $s->id,
            'pk'                     => $s->id,
            'tipo_servicio'          => $slug === 'arbitraje-emergencia' ? 'arbitraje-emergencia' : 'arbitraje',
            'numero_cargo'           => $s->numero_cargo,
            'servicio'               => $s->servicio->nombre,
            'estado'                 => $s->estado,
            'created_at'             => $s->created_at->format('d/m/Y H:i'),
            'created_at_raw'         => $s->created_at,
            'expediente_id'          => $s->expediente?->id,
            'numero_expediente'      => $s->expediente?->numero_expediente,
            'acepta_reglamento_card' => (bool) $s->acepta_reglamento_card,
            'subsanacion_activa'     => $s->subsanaciones->where('estado', 'pendiente')->first(),
            'documentos'             => $s->documentos->map(fn($d) => [
                'id'              => $d->id,
                'nombre_original' => $d->nombre_original,
                'tipo_documento'  => $d->tipo_documento,
                'ruta_archivo'    => $d->ruta_archivo,
                'created_at'      => $d->created_at->format('d/m/Y'),
            ]),
            'datos' => [
                'demandante' => [
                    'tipo_persona'       => $s->tipo_persona,
                    'subtipo_juridico'   => $s->subtipo_juridico_demandante,
                    'tipo_documento'     => $s->tipo_documento,
                    'documento'          => $s->documento_demandante,
                    'nombre'             => $s->nombre_demandante,
                    'representante'      => [
                        'nombre'    => $s->nombre_representante,
                        'documento' => $s->documento_representante,
                    ],
                    'empresas_consorcio' => $this->jsonOrEmpty($s->empresas_consorcio_demandante),
                    'domicilio'          => $s->domicilio_demandante,
                    'email'              => $s->email_demandante,
                    'telefono'           => $s->telefono_demandante,
                ],
                'demandado' => [
                    'tipo_persona'       => $s->tipo_persona_demandado,
                    'subtipo_juridico'   => $s->subtipo_juridico_demandado,
                    'tipo_documento'     => $s->tipo_documento_demandado,
                    'documento'          => $s->documento_demandado,
                    'nombre'             => $s->nombre_demandado,
                    'representante'      => [
                        'nombre'    => $s->nombre_representante_demandado,
                        'documento' => $s->documento_representante_demandado,
                    ],
                    'empresas_consorcio' => $this->jsonOrEmpty($s->empresas_consorcio_demandado),
                    'domicilio'          => $s->domicilio_demandado,
                    'email'              => $s->email_demandado,
                    'telefono'           => $s->telefono_demandado,
                ],
                'controversia' => [
                    'resumen'                       => $s->resumen_controversia,
                    'pretensiones'                  => $s->pretensiones,
                    'monto_involucrado'             => $s->monto_involucrado,
                    'monto_controversias'           => $s->monto_controversias,
                    'suma_pretensiones_determinadas'=> $s->suma_monto_pretensiones_determinadas,
                    'pretensiones_indeterminadas'   => $s->pretensiones_indeterminadas,
                ],
                'arbitro' => [
                    'solicita_designacion_director' => (bool) $s->solicita_designacion_director,
                    'nombre'                        => $s->nombre_arbitro_propuesto,
                    'documento'                     => $s->documento_arbitro_propuesto,
                    'email'                         => $s->email_arbitro_propuesto,
                    'domicilio'                     => $s->domicilio_arbitro_propuesto,
                ],
                'medida_cautelar' => (bool) $s->tiene_medida_cautelar,
                'factura' => [
                    'ruc'           => $s->factura_ruc,
                    'razon_social'  => $s->factura_razon_social,
                ],
            ],
        ];
    }

    private function mapSolicitudJPRD(SolicitudJPRD $s): array
    {
        return [
            'id'                     => 'jprd:' . $s->id,
            'pk'                     => $s->id,
            'tipo_servicio'          => 'jprd',
            'numero_cargo'           => $s->numero_cargo,
            'servicio'               => $s->servicio->nombre,
            'estado'                 => $s->estado,
            'created_at'             => $s->created_at->format('d/m/Y H:i'),
            'created_at_raw'         => $s->created_at,
            'expediente_id'          => $s->expediente?->id,
            'numero_expediente'      => $s->expediente?->numero_expediente,
            'acepta_reglamento_card' => (bool) $s->acepta_reglamento_card,
            'subsanacion_activa'     => null,
            'documentos'             => $s->documentos->map(fn($d) => [
                'id'              => $d->id,
                'nombre_original' => $d->nombre_original,
                'tipo_documento'  => $d->tipo_documento,
                'ruta_archivo'    => $d->ruta_archivo,
                'created_at'      => $d->created_at->format('d/m/Y'),
            ]),
            'datos' => [
                'rol_solicitante'       => $s->rol_solicitante,
                'tiene_peticion_previa' => (bool) $s->tiene_peticion_previa,
                'observacion'           => $s->observacion,
                'entidad' => [
                    'nombre'        => $s->nombre_entidad,
                    'ruc'           => $s->ruc_entidad,
                    'tipo_persona'  => $s->tipo_persona_entidad,
                    'subtipo'       => $s->subtipo_entidad,
                    'representante' => [
                        'dni'    => $s->representante_entidad_dni,
                        'nombre' => $s->representante_entidad_nombre,
                    ],
                    'empresas'      => $s->empresas_entidad ?? [],
                    'emails'        => $s->emails_entidad ?? [],
                    'telefono'      => $s->telefono_entidad,
                ],
                'contratista' => [
                    'nombre'        => $s->nombre_contratista,
                    'ruc'           => $s->ruc_contratista,
                    'tipo_persona'  => $s->tipo_persona_contratista,
                    'subtipo'       => $s->subtipo_contratista,
                    'representante' => [
                        'dni'    => $s->representante_contratista_dni,
                        'nombre' => $s->representante_contratista_nombre,
                    ],
                    'empresas'      => $s->empresas_contratista ?? [],
                    'emails'        => $s->emails_contratista ?? [],
                    'telefono'      => $s->telefono_contratista,
                ],
            ],
        ];
    }

    private function mapSolicitudOtros(SolicitudOtros $s): array
    {
        return [
            'id'                     => 'otros:' . $s->id,
            'pk'                     => $s->id,
            'tipo_servicio'          => 'otros',
            'numero_cargo'           => $s->numero_cargo,
            'servicio'               => $s->servicio->nombre,
            'estado'                 => $s->cargo?->id ? 'admitida' : 'pendiente',
            'created_at'             => $s->created_at->format('d/m/Y H:i'),
            'created_at_raw'         => $s->created_at,
            'expediente_id'          => null,
            'numero_expediente'      => null,
            'acepta_reglamento_card' => (bool) $s->acepta_reglamento_card,
            'subsanacion_activa'     => null,
            'documentos'             => collect(),
            'datos' => [
                'remitente' => [
                    'tipo_persona'         => $s->tipo_persona,
                    'tipo_doc_identidad'   => $s->tipo_doc_identidad,
                    'numero_doc_identidad' => $s->numero_doc_identidad,
                    'nombre'               => $s->nombre_remitente,
                    'email'                => $s->email_remitente,
                ],
                'tipo_documento_nombre' => $s->tipoDocumento?->nombre,
                'descripcion'           => $s->descripcion,
                'observacion'           => $s->observacion,
            ],
        ];
    }

    private function jsonOrEmpty($value): array
    {
        if (is_array($value)) return $value;
        if (!$value) return [];
        $decoded = is_string($value) ? json_decode($value, true) : null;
        return is_array($decoded) ? $decoded : [];
    }

    // ── Subsanar (Cliente sube documentos y responde) ──
    public function subsanar(Request $request, SolicitudArbitraje $solicitud)
    {
        abort_if(
            $solicitud->email_demandante !== Auth::user()->email &&
            $solicitud->usuario_id !== Auth::id(),
            403
        );

        $request->validate([
            'respuesta'    => 'required|string|max:2000',
            'documentos'   => 'nullable|array',
            'documentos.*' => FileRules::accept(),
        ]);

        DB::beginTransaction();
        try {
            $subsanacion = SolicitudSubsanacion::where('solicitud_id', $solicitud->id)
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

            if ($request->hasFile('documentos')) {
                foreach ($request->file('documentos') as $archivo) {
                    $ruta = $archivo->store('solicitudes/' . $solicitud->id . '/subsanaciones', 'public');

                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'subsanacion',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            $solicitud->update(['estado' => 'pendiente']);

            DB::commit();
            return back()->with('success', 'Subsanación enviada correctamente. La secretaría revisará su respuesta.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error subsanar: ' . $e->getMessage());
            return back()->withErrors(['general' => 'Error al enviar la subsanación.']);
        }
    }

    // ── Nueva Solicitud (Cliente Logueado) ──
    public function nuevaSolicitudAuth()
    {
        // Traemos los servicios igual que en la página pública
        $servicios = Servicio::where('activo', 1)->orderBy('nombre')->get(['id', 'nombre', 'slug', 'descripcion']);

        return Inertia::render('MesaPartes/NuevaSolicitudAuth', [
            'servicios' => $servicios,
        ]);
    }
}