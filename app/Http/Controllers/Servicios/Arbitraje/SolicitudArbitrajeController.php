<?php

namespace App\Http\Controllers\Servicios\Arbitraje;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorEmail;
use App\Models\TipoActorExpediente;
use App\Models\ServicioTipoActor;
use App\Models\TipoCorrelativo;
use App\Models\Documento;
use App\Models\User;
use App\Models\Rol;
use App\Models\Etapa;
use App\Services\CorrelativoService;
use App\Mail\CargoSolicitudMail;
use App\Models\Cargo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SolicitudArbitrajeController extends Controller
{
    public function store(Request $request)
    {
        // ── 1. Validaciones ──────────────────────────────────────────────────
        $request->validate([
            'servicio_id'                   => 'required|exists:servicios,id',
            'tipo_persona'                  => 'required|in:natural,juridica',
            'nombre_demandante'             => 'required_unless:subtipo_juridico_demandante,consorcio|nullable|string|max:255',
            'documento_demandante'          => 'required_unless:subtipo_juridico_demandante,consorcio|nullable|string|max:20',
            'nombre_representante'          => 'nullable|string|max:255',
            'documento_representante'       => 'nullable|string|max:20',
            'domicilio_demandante'          => 'required|string|max:500',
            'email_demandante'              => 'required|email|max:255',
            'telefono_demandante'           => 'required|string|max:20',

            'nombre_demandado'              => 'required|string|max:255',
            'documento_demandado'           => 'nullable|string|max:20',
            'tipo_persona_demandado'        => 'nullable|in:natural,juridica',
            'tipo_documento_demandado'      => 'nullable|in:dni,ruc,ce',
            'domicilio_demandado'           => 'required|string|max:500',
            'email_demandado'               => 'nullable|email|max:255',
            'telefono_demandado'            => 'nullable|string|max:20',

            'resumen_controversia'          => 'required|string',
            'pretensiones'                  => 'required|string',
            'monto_involucrado'             => 'nullable|numeric|min:0',
            'solicita_designacion_director' => 'required|in:0,1',
            'nombre_arbitro_propuesto'      => 'nullable|string|max:255',
            'email_arbitro_propuesto'       => 'nullable|email|max:255',
            'domicilio_arbitro_propuesto'   => 'nullable|string|max:500',
            'reglas_aplicables'             => 'nullable|string|max:255',

            'documentos_controversia'        => 'nullable|array',
            'documentos_controversia.*'      => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'documentos_anexos'              => 'nullable|array',
            'documentos_anexos.*'            => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',

            'subtipo_juridico_demandante'             => 'nullable|in:empresa,consorcio,entidad_publica',
            'empresas_consorcio_demandante'           => 'nullable|string',
            'subtipo_juridico_demandado'              => 'nullable|in:empresa,consorcio,entidad_publica',
            'empresas_consorcio_demandado'            => 'nullable|string',
            'nombre_representante_demandado'          => 'nullable|string|max:255',
            'documento_representante_demandado'       => 'nullable|string|max:50',
            'email_representante_consorcio_demandado' => 'nullable|email|max:255',
            'acepta_reglamento_card'                  => 'nullable|in:0,1',
            'precision_reglas'                        => 'nullable|string|max:100',
            'tiene_medida_cautelar'                   => 'nullable|in:0,1',

            'doc_vigencia_poder_dem.*'         => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'doc_contrato_consorcio_dem.*'     => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'doc_resolucion_facultades_dem.*'  => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'doc_vigencia_poder_dado.*'        => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'doc_contrato_consorcio_dado.*'    => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'doc_resolucion_facultades_dado.*' => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'documentos_medida_cautelar.*'     => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
            'comprobante_pago_tasa.*'          => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();

        try {
            // ── 2. Crear o recuperar usuario demandante ──────────────────────
            $authUser    = \Illuminate\Support\Facades\Auth::user();
            $passwordRaw = null;

            // Solo usar el usuario autenticado como demandante si es rol 'usuario'
            // (portal). Si es staff, se crea/busca por los datos del formulario.
            $esDemandantePortal = $authUser
                && optional($authUser->rol)->slug === 'usuario';

            $userId = $esDemandantePortal ? $authUser->id : null;

            if (!$userId) {
                $docBusqueda  = $request->documento_demandante ?: $request->documento_representante;
                $existingUser = User::where('email', $request->email_demandante)
                    ->when($docBusqueda, fn($q) => $q->orWhere('numero_documento', $docBusqueda))
                    ->first();

                $esPortal = session('portal_email') &&
                    strtolower(session('portal_email')) === strtolower($request->email_demandante);

                if ($existingUser && !$esPortal) {
                    return back()->withErrors(['general' => 'El correo o documento ya pertenece a un usuario registrado. Por favor, inicie sesión.']);
                }

                if ($existingUser) {
                    $userId = $existingUser->id;
                } else {
                // Para consorcio, nombre/doc pueden venir vacíos → usar los del representante
                $nombreCuenta    = $request->nombre_demandante    ?: $request->nombre_representante;
                $documentoCuenta = $request->documento_demandante ?: $request->documento_representante;
                $passwordRaw     = ($documentoCuenta ?: Str::random(8)) . Str::random(6);
                $usuarioNuevo = User::create([
                    'name'             => $nombreCuenta,
                    'email'            => $request->email_demandante,
                    'password'         => Hash::make($passwordRaw),
                    'rol_id'           => Rol::where('slug', 'usuario')->value('id'),
                    'tipo_persona'     => $request->tipo_persona,
                    'numero_documento' => $documentoCuenta,
                    'telefono'         => $request->telefono_demandante,
                    'direccion'        => $request->domicilio_demandante,
                    'activo'           => 1,
                ]);
                $userId = $usuarioNuevo->id;
                } // end else (nuevo usuario)
            }

            // ── 3. Crear solicitud ───────────────────────────────────────────
            $solicitud = SolicitudArbitraje::create(array_merge(
                $request->except(
                    'documentos_anexos', 'documentos_controversia',
                    'doc_vigencia_poder_dem', 'doc_contrato_consorcio_dem', 'doc_resolucion_facultades_dem',
                    'doc_vigencia_poder_dado', 'doc_contrato_consorcio_dado', 'doc_resolucion_facultades_dado',
                    'documentos_medida_cautelar', 'comprobante_pago_tasa',
                    'emails_demandante', 'emails_demandado'
                ),
                [
                    'usuario_id' => $userId,
                    'estado'     => 'pendiente',
                    'activo'     => 1,
                ]
            ));

            // Generar número de cargo correlativo universal
            $cargo = Cargo::crear('solicitud', $solicitud, $userId);
            $solicitud->update(['numero_cargo' => $cargo->numero_cargo]);

            // ── 4. Crear expediente con número correlativo automático ─────────
            $tipoExpId = TipoCorrelativo::where('codigo', 'EXP')->value('id');
            $numeroExpediente = app(CorrelativoService::class)
                ->generarNumero($request->servicio_id, $tipoExpId);

            // Etapa inicial del servicio (la de menor orden)
            $etapaInicial = Etapa::where('servicio_id', $request->servicio_id)
                ->where('activo', 1)
                ->orderBy('orden')
                ->first();

            $expediente = Expediente::create([
                'solicitud_type'    => SolicitudArbitraje::class,
                'solicitud_id'      => $solicitud->id,
                'servicio_id'       => $request->servicio_id,
                'numero_expediente' => $numeroExpediente,
                'etapa_actual_id'   => $etapaInicial?->id,
                'estado'            => 'activo',
            ]);

            // ── 4b. Crear movimiento inicial automático ────────────────────────
            app(\App\Services\MovimientoService::class)->crear(
                $expediente,
                [
                    'etapa_id'    => $etapaInicial?->id,
                    'instruccion' => "Envío de solicitud de arbitraje. Expediente asignado: {$numeroExpediente}",
                    'creado_por'  => $userId,
                ],
                [],
                [],
                'recibido'
            );

            // ── 5. Registrar actores del expediente ──────────────────────────

            // 5a. Demandante (usuario que crea la solicitud)
            // credenciales_enviadas = true porque recibirá el cargo con su contraseña por correo
            $tipoActorDemandante = TipoActorExpediente::where('slug', 'demandante')->first();
            if ($tipoActorDemandante) {
                ExpedienteActor::create([
                    'expediente_id'         => $expediente->id,
                    'usuario_id'            => $userId,
                    'tipo_actor_id'         => $tipoActorDemandante->id,
                    'activo'                => 1,
                    'credenciales_enviadas' => true,
                    'acceso_mesa_partes'    => 1,
                ]);
            }

            // 5b. Demandado (se crea cuenta si no existe)
            // Si email_demandado está vacío pero hay correos en emails_demandado, usar el primero como principal
            $tipoActorDemandado  = TipoActorExpediente::where('slug', 'demandado')->first();
            $emailsDemandadoArr  = json_decode($request->input('emails_demandado', '[]'), true) ?? [];
            $emailPrincipalDado  = trim($request->email_demandado ?? '');
            if ($emailPrincipalDado === '') {
                $emailPrincipalDado = trim($emailsDemandadoArr[0]['email'] ?? '');
            }

            if ($tipoActorDemandado) {
                $userDemandado = null;
                if ($emailPrincipalDado) {
                    $userDemandado = User::where('email', $emailPrincipalDado)->first();
                    if (!$userDemandado) {
                        $userDemandado = User::create([
                            'name'      => $request->nombre_demandado,
                            'email'     => $emailPrincipalDado,
                            'password'  => Hash::make(Str::random(10)),
                            'rol_id'    => Rol::where('slug', 'usuario')->value('id'),
                            'direccion' => $request->domicilio_demandado,
                            'telefono'  => $request->telefono_demandado,
                            'activo'    => 1,
                        ]);
                    }
                }

                ExpedienteActor::create([
                    'expediente_id'        => $expediente->id,
                    'usuario_id'           => $userDemandado?->id,
                    'tipo_actor_id'        => $tipoActorDemandado->id,
                    'nombre_externo'       => $userDemandado ? null : $request->nombre_demandado,
                    'email_externo'        => $userDemandado ? null : ($emailPrincipalDado ?: null),
                    'activo'               => 1,
                    'credenciales_enviadas' => false,
                ]);
            }

            // 5c. Guardar emails adicionales del demandante
            // Se omite el email que ya es el email principal de la cuenta del usuario
            $emailsDemandante   = json_decode($request->input('emails_demandante', '[]'), true) ?? [];
            $emailCuentaDem     = User::where('id', $userId)->value('email');
            if (!empty($emailsDemandante)) {
                $actorDemandante = ExpedienteActor::where('expediente_id', $expediente->id)
                    ->where('tipo_actor_id', $tipoActorDemandante?->id)->first();
                if ($actorDemandante) {
                    $ordenExtra = 1;
                    foreach ($emailsDemandante as $item) {
                        $email = trim($item['email'] ?? '');
                        if ($email === '' || strtolower($email) === strtolower($emailCuentaDem)) continue;
                        ExpedienteActorEmail::create([
                            'expediente_actor_id' => $actorDemandante->id,
                            'email'               => $email,
                            'label'               => $item['label'] ?? null,
                            'orden'               => $ordenExtra++,
                        ]);
                    }
                }
            }

            // 5d. Guardar emails adicionales del demandado
            // Se omite el email principal (ya usado como cuenta o email_externo)
            $emailCuentaDado = $userDemandado?->email ?? $emailPrincipalDado;
            if (!empty($emailsDemandadoArr)) {
                $actorDemandado = ExpedienteActor::where('expediente_id', $expediente->id)
                    ->where('tipo_actor_id', $tipoActorDemandado?->id)->first();
                if ($actorDemandado) {
                    $ordenExtra = 1;
                    foreach ($emailsDemandadoArr as $item) {
                        $email = trim($item['email'] ?? '');
                        if ($email === '' || strtolower($email) === strtolower($emailCuentaDado)) continue;
                        ExpedienteActorEmail::create([
                            'expediente_actor_id' => $actorDemandado->id,
                            'email'               => $email,
                            'label'               => $item['label'] ?? null,
                            'orden'               => $ordenExtra++,
                        ]);
                    }
                }
            }

            // 5e. Auto-asignar actores configurados para este servicio
            $this->autoAsignarActores($expediente, $request->servicio_id);

            // ── 6. Guardar documentos adjuntos ───────────────────────────────
            $carpeta = "expedientes/{$expediente->id}/solicitud";

            if ($request->hasFile('documentos_controversia')) {
                foreach ($request->file('documentos_controversia') as $archivo) {
                    $ruta = $archivo->store($carpeta, 'public');
                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'doc_controversia',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            if ($request->hasFile('documentos_anexos')) {
                foreach ($request->file('documentos_anexos') as $archivo) {
                    $ruta = $archivo->store($carpeta, 'public');
                    Documento::create([
                        'modelo_tipo'     => SolicitudArbitraje::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => 'anexo_inicial',
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            // ── 6b. Guardar documentos de subtipo jurídico y nuevas secciones ──
            $gruposDoc = [
                'doc_vigencia_poder_dem'          => 'vigencia_poder_demandante',
                'doc_contrato_consorcio_dem'      => 'contrato_consorcio_demandante',
                'doc_resolucion_facultades_dem'   => 'resolucion_facultades_demandante',
                'doc_vigencia_poder_dado'         => 'vigencia_poder_demandado',
                'doc_contrato_consorcio_dado'     => 'contrato_consorcio_demandado',
                'doc_resolucion_facultades_dado'  => 'resolucion_facultades_demandado',
                'documentos_medida_cautelar'      => 'medida_cautelar',
                'comprobante_pago_tasa'           => 'comprobante_pago_tasa',
            ];
            foreach ($gruposDoc as $campo => $tipoDoc) {
                if ($request->hasFile($campo)) {
                    foreach ($request->file($campo) as $archivo) {
                        $ruta = $archivo->store($carpeta, 'public');
                        Documento::create([
                            'modelo_tipo'     => SolicitudArbitraje::class,
                            'modelo_id'       => $solicitud->id,
                            'tipo_documento'  => $tipoDoc,
                            'ruta_archivo'    => $ruta,
                            'nombre_original' => $archivo->getClientOriginalName(),
                            'peso_bytes'      => $archivo->getSize(),
                            'activo'          => 1,
                        ]);
                    }
                }
            }

            // ── 7. Generar PDF cargo y enviar correo ─────────────────────────
            $pdfPath = $this->generarCargo($solicitud);
            Mail::to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->send(new CargoSolicitudMail($solicitud, $passwordRaw, $pdfPath, $expediente));

            DB::commit();
            @unlink($pdfPath);

            return redirect()->route('mesa-partes.confirmacion', $solicitud->numero_cargo);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solicitud arbitraje: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return back()->withErrors(['general' => 'Ocurrió un error. Por favor intente nuevamente.']);
        }
    }

    /**
     * Auto-asigna los actores configurados en servicio_tipos_actor para el servicio dado.
     * Excluye slugs 'demandante' y 'demandado' (ya asignados directamente del formulario).
     * Para cada entrada con es_automatico=true y rol_auto_slug, busca el usuario con menor carga.
     */
    private function autoAsignarActores(Expediente $expediente, int $servicioId): void
    {
        $slugsExcluir = ['demandante', 'demandado'];

        $configuraciones = ServicioTipoActor::where('servicio_id', $servicioId)
            ->where('es_automatico', true)
            ->whereNotNull('rol_auto_slug')
            ->where('activo', 1)
            ->with('tipoActor')
            ->get();

        foreach ($configuraciones as $config) {
            if (!$config->tipoActor || in_array($config->tipoActor->slug, $slugsExcluir)) {
                continue;
            }

            $rolSlug = $config->rol_auto_slug;
            $rolId   = Rol::where('slug', $rolSlug)->value('id');

            if (!$rolId) {
                continue;
            }

            // Balanceo de carga: asignar al usuario con menos expedientes activos
            $usuario = User::where('rol_id', $rolId)
                ->where('activo', 1)
                ->withCount([
                    'expedienteActoresActivos' => fn($q) =>
                        $q->whereHas('expediente', fn($q2) => $q2->where('estado', 'activo'))
                ])
                ->orderBy('expediente_actores_activos_count', 'asc')
                ->first();

            if (!$usuario) {
                continue;
            }

            ExpedienteActor::updateOrCreate(
                ['expediente_id' => $expediente->id, 'tipo_actor_id' => $config->tipo_actor_id],
                ['usuario_id' => $usuario->id, 'activo' => 1, 'credenciales_enviadas' => true]
            );
        }
    }

    private function generarCargo(SolicitudArbitraje $solicitud): string
    {
        $solicitud->load('servicio');
        $pdf  = app('dompdf.wrapper');
        $html = view('pdf.cargo-solicitud', ['solicitud' => $solicitud])->render();
        $pdf->loadHTML($html);
        $pdf->setPaper('A4', 'portrait');

        $path = storage_path('app/temp/cargo_' . $solicitud->numero_cargo . '.pdf');
        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, $pdf->output());
        return $path;
    }
}
