<?php

namespace App\Http\Controllers\Servicios\Arbitraje;

use App\Http\Controllers\Controller;
use App\Models\SolicitudArbitraje;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteMovimiento;
use App\Models\TipoActorExpediente;
use App\Models\ServicioTipoActor;
use App\Models\TipoCorrelativo;
use App\Models\Actividad;
use App\Models\Documento;
use App\Models\User;
use App\Models\Rol;
use App\Models\ExpedienteInstancia;
use App\Services\CorrelativoService;
use App\Mail\CargoSolicitudMail;
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
            'nombre_demandante'             => 'required|string|max:255',
            'documento_demandante'          => 'required|string|max:20',
            'nombre_representante'          => 'nullable|string|max:255',
            'documento_representante'       => 'nullable|string|max:20',
            'domicilio_demandante'          => 'required|string|max:500',
            'email_demandante'              => 'required|email|max:255',
            'telefono_demandante'           => 'required|string|max:20',

            'nombre_demandado'              => 'required|string|max:255',
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
            'documentos_anexos'             => 'nullable|array',
            'documentos_anexos.*'           => 'file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
        ]);

        DB::beginTransaction();

        try {
            // ── 2. Crear o recuperar usuario demandante ──────────────────────
            $userId      = \Illuminate\Support\Facades\Auth::id();
            $passwordRaw = null;

            if (!$userId) {
                $userExists = User::where('email', $request->email_demandante)
                    ->orWhere('numero_documento', $request->documento_demandante)
                    ->exists();

                if ($userExists) {
                    return back()->withErrors(['general' => 'El correo o documento ya pertenece a un usuario registrado. Por favor, inicie sesión.']);
                }

                $passwordRaw  = $request->documento_demandante . Str::random(6);
                $usuarioNuevo = User::create([
                    'name'             => $request->nombre_demandante,
                    'email'            => $request->email_demandante,
                    'password'         => Hash::make($passwordRaw),
                    'rol_id'           => Rol::where('slug', 'usuario')->value('id'),
                    'tipo_persona'     => $request->tipo_persona,
                    'numero_documento' => $request->documento_demandante,
                    'telefono'         => $request->telefono_demandante,
                    'direccion'        => $request->domicilio_demandante,
                    'activo'           => 1,
                ]);
                $userId = $usuarioNuevo->id;
            }

            // ── 3. Crear solicitud ───────────────────────────────────────────
            $solicitud = SolicitudArbitraje::create(array_merge(
                $request->except('documentos_anexos', 'documentos_controversia'),
                [
                    'usuario_id' => $userId,
                    'estado'     => 'pendiente',
                    'activo'     => 1,
                    // numero_cargo se asigna abajo para poder usar el ID de la solicitud como fallback
                ]
            ));

            // Generar número de cargo temporal (para el acuse de recibo)
            $numeroCargo = 'CARGO-' . str_pad($solicitud->id, 4, '0', STR_PAD_LEFT) . '-' . now()->year;
            $solicitud->update(['numero_cargo' => $numeroCargo]);

            // ── 4. Crear expediente con número correlativo automático ─────────
            // Buscar actividad inicial del servicio (etapa 1, actividad 1)
            $actividadInicial = Actividad::whereHas('etapa', fn($q) =>
                $q->where('servicio_id', $request->servicio_id)->where('orden', 1)
            )->orderBy('orden')->firstOrFail();

            // Buscar actividad de revisión secretaría (etapa 1, actividad 2)
            $actividadSecretaria = Actividad::whereHas('etapa', fn($q) =>
                $q->where('servicio_id', $request->servicio_id)->where('orden', 1)
            )->where('orden', '>', $actividadInicial->orden)->orderBy('orden')->firstOrFail();

            // Generar número de expediente usando CorrelativoService
            $tipoExpId = TipoCorrelativo::where('codigo', 'EXP')->value('id');
            $numeroExpediente = app(CorrelativoService::class)
                ->generarNumero($request->servicio_id, $tipoExpId);

            $expediente = Expediente::create([
                'solicitud_id'        => $solicitud->id,
                'servicio_id'         => $request->servicio_id,
                'numero_expediente'   => $numeroExpediente,
                'etapa_actual_id'     => $actividadSecretaria->etapa_id,
                'actividad_actual_id' => $actividadSecretaria->id,
                'estado'              => 'en_proceso',
            ]);

            // ── 5. Registrar actores del expediente ──────────────────────────

            // 5a. Demandante (usuario que crea la solicitud)
            $tipoActorDemandante = TipoActorExpediente::where('slug', 'demandante')->first();
            if ($tipoActorDemandante) {
                ExpedienteActor::create([
                    'expediente_id' => $expediente->id,
                    'usuario_id'    => $userId,
                    'tipo_actor_id' => $tipoActorDemandante->id,
                    'activo'        => 1,
                ]);
            }

            // 5b. Demandado (se crea cuenta si no existe)
            $tipoActorDemandado = TipoActorExpediente::where('slug', 'demandado')->first();
            if ($tipoActorDemandado) {
                $userDemandado = null;
                if ($request->email_demandado) {
                    $userDemandado = User::where('email', $request->email_demandado)->first();
                    if (!$userDemandado) {
                        $userDemandado = User::create([
                            'name'      => $request->nombre_demandado,
                            'email'     => $request->email_demandado,
                            'password'  => Hash::make(Str::random(10)),
                            'rol_id'    => Rol::where('slug', 'usuario')->value('id'),
                            'direccion' => $request->domicilio_demandado,
                            'telefono'  => $request->telefono_demandado,
                            'activo'    => 1,
                        ]);
                    }
                }

                ExpedienteActor::create([
                    'expediente_id'  => $expediente->id,
                    'usuario_id'     => $userDemandado?->id,          // null si no tiene email
                    'tipo_actor_id'  => $tipoActorDemandado->id,
                    'nombre_externo' => $userDemandado ? null : $request->nombre_demandado,
                    'email_externo'  => $userDemandado ? null : $request->email_demandado,
                    'activo'         => 1,
                ]);
            }

            // 5c. Auto-asignar actores configurados para este servicio (excepto demandante/demandado que ya se manejaron)
            $this->autoAsignarActores($expediente, $request->servicio_id);

            // ── 6. Registrar movimiento inicial ──────────────────────────────
            $movimientoInicial = ExpedienteMovimiento::create([
                'expediente_id'        => $expediente->id,
                'actividad_origen_id'  => $actividadInicial->id,
                'actividad_destino_id' => $actividadSecretaria->id,
                'usuario_id'           => $userId,
                'observaciones'        => 'Presentación de Solicitud de Arbitraje vía Portal Web.',
                'fecha_movimiento'     => now(),
            ]);

            // ── 6b. Crear instancia inicial del expediente ────────────────────
            $diasInicial      = $actividadSecretaria->dias_plazo;
            $fechaVencimiento = $diasInicial ? now()->addDays($diasInicial) : null;
            ExpedienteInstancia::create([
                'expediente_id'     => $expediente->id,
                'actividad_id'      => $actividadSecretaria->id,
                'movimiento_id'     => $movimientoInicial->id,
                'fecha_inicio'      => now(),
                'fecha_vencimiento' => $fechaVencimiento,
                'activa'            => true,
            ]);

            // ── 7. Guardar documentos adjuntos ───────────────────────────────
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

            // ── 8. Generar PDF cargo y enviar correo ─────────────────────────
            $pdfPath = $this->generarCargo($solicitud);
            Mail::to($solicitud->email_demandante, $solicitud->nombre_demandante)
                ->send(new CargoSolicitudMail($solicitud, $passwordRaw, $pdfPath));

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
                        $q->whereHas('expediente', fn($q2) => $q2->where('estado', 'en_proceso'))
                ])
                ->orderBy('expediente_actores_activos_count', 'asc')
                ->first();

            if (!$usuario) {
                continue;
            }

            ExpedienteActor::updateOrCreate(
                ['expediente_id' => $expediente->id, 'tipo_actor_id' => $config->tipo_actor_id],
                ['usuario_id' => $usuario->id, 'activo' => 1]
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
