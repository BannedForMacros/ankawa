<?php

namespace App\Http\Controllers\Servicios\JPRD;

use App\Http\Controllers\Controller;
use App\Support\FileRules;
use App\Models\Cargo;
use App\Models\Documento;
use App\Models\Etapa;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\Rol;
use App\Models\ServicioTipoActor;
use App\Models\SolicitudJPRD;
use App\Models\TipoActorExpediente;
use App\Models\TipoCorrelativo;
use App\Models\User;
use App\Mail\CargoSolicitudJPRDMail;
use App\Services\CorrelativoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class SolicitudJPRDController extends Controller
{
    public function store(Request $request)
    {
        // Validación: solo personas jurídicas; entidad siempre pública, contratista empresa o consorcio
        $request->validate([
            'servicio_id'                       => 'required|exists:servicios,id',
            'tipo_documento_id'                 => 'nullable|exists:tipo_documentos,id',
            'rol_solicitante'                   => 'required|in:entidad,contratista',
            'tipo_persona_entidad'              => 'required|in:juridica',
            'subtipo_entidad'                   => 'required|in:entidad_publica',
            'nombre_entidad'                    => 'nullable|string|max:255',
            'ruc_entidad'                       => 'nullable|string|max:20',
            'representante_entidad_dni'         => 'nullable|string|max:20',
            'representante_entidad_nombre'      => 'nullable|string|max:255',
            'emails_entidad'                    => 'required|string',
            'tipo_persona_contratista'          => 'required|in:juridica',
            'subtipo_contratista'               => 'required|in:empresa,consorcio',
            'nombre_contratista'                => 'nullable|string|max:255',
            'ruc_contratista'                   => 'nullable|string|max:20',
            'representante_contratista_dni'     => 'nullable|string|max:20',
            'representante_contratista_nombre'  => 'nullable|string|max:255',
            'emails_contratista'                => 'required|string',
            'observacion'                       => 'nullable|string|max:3000',
            'tiene_peticion_previa'             => 'sometimes|boolean',
            'doc_solicitud_conformacion'        => 'required|array|min:1',
            'doc_solicitud_conformacion.*'      => FileRules::accept(),
            'doc_contrato_obra'                 => 'required|array|min:1',
            'doc_contrato_obra.*'               => FileRules::accept(),
            'doc_adendas'                       => 'nullable|array',
            'doc_adendas.*'                     => FileRules::accept(),
            'doc_anexos'                        => 'nullable|array',
            'doc_anexos.*'                      => FileRules::accept(),
            'doc_peticion_previa'               => 'nullable|array',
            'doc_peticion_previa.*'             => FileRules::accept(),
            'acepta_reglamento_card'            => 'nullable|in:0,1',
        ]);

        if ($request->boolean('tiene_peticion_previa') && empty($request->file('doc_peticion_previa'))) {
            return back()
                ->withErrors(['doc_peticion' => 'Debe adjuntar el documento de petición de decisión vinculante.'])
                ->withInput();
        }

        $rolSolicitante   = $request->rol_solicitante;
        $emailsKey        = "emails_{$rolSolicitante}";
        $emailsSolicData  = json_decode($request->$emailsKey, true) ?? [];
        $emailPrincipal   = collect($emailsSolicData)->first(fn($e) => !empty($e['email']));

        abort_unless($emailPrincipal, 422, 'Debe registrar al menos un correo del solicitante.');

        // Para consorcio, el nombre viene pre-calculado desde el frontend (join de empresas)
        $empresasEntData  = json_decode($request->empresas_entidad ?? '[]', true) ?? [];
        $empresasConData  = json_decode($request->empresas_contratista ?? '[]', true) ?? [];

        $nombreEntidad    = $request->nombre_entidad
                         ?: $this->nombreDesdeEmpresas($empresasEntData, 'Entidad');
        $nombreContratista = $request->nombre_contratista
                          ?: $this->nombreDesdeEmpresas($empresasConData, 'Contratista');

        // Datos del solicitante según su rol (siempre persona jurídica → RUC)
        if ($rolSolicitante === 'entidad') {
            $nombreSol    = $nombreEntidad;
            $tipoDocSol   = 'ruc';
            $documentoSol = $request->ruc_entidad ?? '';
        } else {
            $nombreSol    = $nombreContratista;
            $tipoDocSol   = 'ruc';
            $documentoSol = $request->ruc_contratista ?? '';
        }

        DB::beginTransaction();

        try {
            // ── 1. Crear o recuperar usuario solicitante ─────────────────────
            $emailSol = $emailPrincipal['email'];
            $usuario  = User::where('email', $emailSol)->first()
                      ?? User::where('numero_documento', $documentoSol)->first();

            $passwordRaw = null;
            if (!$usuario) {
                $passwordRaw = $documentoSol . Str::random(6);
                $usuario = User::create([
                    'name'             => $nombreSol,
                    'email'            => $emailSol,
                    'password'         => Hash::make($passwordRaw),
                    'rol_id'           => Rol::where('slug', Rol::SLUG_USUARIO)->value('id'),
                    'numero_documento' => $documentoSol,
                    'activo'           => 1,
                ]);
            }

            // ── 2. Crear solicitud ───────────────────────────────────────────
            $emailsEntidad     = json_decode($request->emails_entidad, true) ?? [];
            $emailsContratista = json_decode($request->emails_contratista, true) ?? [];

            $solicitud = SolicitudJPRD::create([
                'servicio_id'                      => $request->servicio_id,
                'usuario_id'                       => $usuario->id,
                'rol_solicitante'                  => $rolSolicitante,
                'nombre_solicitante'               => $nombreSol,
                'tipo_documento_solicitante'       => $tipoDocSol,
                'documento_solicitante'            => $documentoSol,
                'emails_solicitante'               => $emailsSolicData,
                'nombre_entidad'                   => $nombreEntidad,
                'ruc_entidad'                      => $request->ruc_entidad,
                'telefono_entidad'                 => $request->telefono_entidad,
                'emails_entidad'                   => $emailsEntidad,
                'tipo_persona_entidad'             => $request->tipo_persona_entidad,
                'subtipo_entidad'                  => $request->subtipo_entidad,
                'representante_entidad_dni'        => $request->representante_entidad_dni,
                'representante_entidad_nombre'     => $request->representante_entidad_nombre,
                'empresas_entidad'                 => $empresasEntData,
                'nombre_contratista'               => $nombreContratista,
                'ruc_contratista'                  => $request->ruc_contratista,
                'telefono_contratista'             => $request->telefono_contratista,
                'emails_contratista'               => $emailsContratista,
                'tipo_persona_contratista'         => $request->tipo_persona_contratista,
                'subtipo_contratista'              => $request->subtipo_contratista,
                'representante_contratista_dni'    => $request->representante_contratista_dni,
                'representante_contratista_nombre' => $request->representante_contratista_nombre,
                'empresas_contratista'             => $empresasConData,
                'observacion'                      => $request->observacion,
                'tiene_peticion_previa'            => $request->boolean('tiene_peticion_previa'),
                'acepta_reglamento_card'           => $request->boolean('acepta_reglamento_card'),
                'estado'                           => 'pendiente',
                'tipo_documento_id'                => $request->tipo_documento_id ?: null,
            ]);

            $cargo = Cargo::crear('solicitud', $solicitud, $usuario->id);
            if (!$cargo) {
                throw new \RuntimeException(
                    "El tipo de evento de cargo 'solicitud' está desactivado. " .
                    "Habilítelo en Configuración → Tipos de Cargo para poder registrar nuevas solicitudes."
                );
            }
            $solicitud->update(['numero_cargo' => $cargo->numero_cargo]);

            // ── 3. Crear expediente ──────────────────────────────────────────
            $tipoExpId = TipoCorrelativo::where('codigo', 'EXP')->value('id');
            $numeroExpediente = app(CorrelativoService::class)
                ->generarNumero($request->servicio_id, $tipoExpId);

            $etapaInicial = Etapa::where('servicio_id', $request->servicio_id)
                ->where('activo', 1)
                ->orderBy('orden')
                ->first();

            $expediente = Expediente::create([
                'solicitud_type'    => SolicitudJPRD::class,
                'solicitud_id'      => $solicitud->id,
                'servicio_id'       => $request->servicio_id,
                'numero_expediente' => $numeroExpediente,
                'etapa_actual_id'   => $etapaInicial?->id,
                'estado'            => 'activo',
            ]);

            $solicitud->update(['expediente_id' => $expediente->id]);

            // ── 4. Movimiento inicial ────────────────────────────────────────
            app(\App\Services\MovimientoService::class)->crear(
                $expediente,
                [
                    'etapa_id'    => $etapaInicial?->id,
                    'instruccion' => "Solicitud de constitución de JPRD recibida. Expediente: {$numeroExpediente}",
                    'creado_por'  => $usuario->id,
                ],
                [],
                [],
                'recibido'
            );

            // ── 5. Registrar actores del expediente ──────────────────────────
            $tipoActorEntidad     = TipoActorExpediente::where('slug', TipoActorExpediente::SLUG_ENTIDAD_CONTRATANTE)->first();
            $tipoActorContratista = TipoActorExpediente::where('slug', TipoActorExpediente::SLUG_CONTRATISTA)->first();

            $emailEntidad     = trim(collect($emailsEntidad)->first(fn($e) => !empty($e['email']))['email'] ?? '');
            $emailContratista = trim(collect($emailsContratista)->first(fn($e) => !empty($e['email']))['email'] ?? '');

            // Si el solicitante ES la entidad contratante: acceso_mesa_partes = 1 y vinculamos usuario
            $esEntidadSolicitante     = ($rolSolicitante === 'entidad');
            $esContratistaSolicitante = ($rolSolicitante === 'contratista');

            if ($tipoActorEntidad) {
                ExpedienteActor::create([
                    'expediente_id'     => $expediente->id,
                    'usuario_id'        => $esEntidadSolicitante ? $usuario->id : null,
                    'tipo_actor_id'     => $tipoActorEntidad->id,
                    'nombre_externo'    => $esEntidadSolicitante ? null : $request->nombre_entidad,
                    'email_externo'     => $esEntidadSolicitante ? null : ($emailEntidad ?: null),
                    'acceso_mesa_partes'=> $esEntidadSolicitante ? 1 : 0,
                    'activo'            => 1,
                ]);
            }

            if ($tipoActorContratista) {
                ExpedienteActor::create([
                    'expediente_id'     => $expediente->id,
                    'usuario_id'        => $esContratistaSolicitante ? $usuario->id : null,
                    'tipo_actor_id'     => $tipoActorContratista->id,
                    'nombre_externo'    => $esContratistaSolicitante ? null : $request->nombre_contratista,
                    'email_externo'     => $esContratistaSolicitante ? null : ($emailContratista ?: null),
                    'acceso_mesa_partes'=> $esContratistaSolicitante ? 1 : 0,
                    'activo'            => 1,
                ]);
            }

            // Auto-asignar: Secretaría General Adjunta, Gestor de JPRD y Secretaría General
            $this->autoAsignarActores($expediente, $request->servicio_id);

            // ── 6. Guardar documentos por tipo ──────────────────────────────
            $carpeta = "expedientes/{$expediente->id}/solicitud";
            $tiposDoc = [
                'solicitud_conformacion'       => $request->file('doc_solicitud_conformacion') ?? [],
                'contrato_obra'                => $request->file('doc_contrato_obra') ?? [],
                'adenda'                       => $request->file('doc_adendas') ?? [],
                'anexo'                        => $request->file('doc_anexos') ?? [],
                'peticion_decision_vinculante' => $request->boolean('tiene_peticion_previa')
                    ? ($request->file('doc_peticion_previa') ?? [])
                    : [],
            ];

            foreach ($tiposDoc as $tipoDoc => $archivos) {
                foreach ($archivos as $archivo) {
                    $ruta = $archivo->store($carpeta, 'public');
                    Documento::create([
                        'modelo_tipo'     => SolicitudJPRD::class,
                        'modelo_id'       => $solicitud->id,
                        'tipo_documento'  => $tipoDoc,
                        'ruta_archivo'    => $ruta,
                        'nombre_original' => $archivo->getClientOriginalName(),
                        'peso_bytes'      => $archivo->getSize(),
                        'activo'          => 1,
                    ]);
                }
            }

            // ── 7. Enviar correo con cargo ───────────────────────────────────
            try {
                Mail::to($emailSol)
                    ->send(new CargoSolicitudJPRDMail($cargo, $solicitud, $expediente));
            } catch (\Exception $e) {
                \Log::warning("Error enviando cargo JPRD #{$solicitud->id}: " . $e->getMessage());
            }

            DB::commit();

            return redirect()->route('mesa-partes.confirmacion', $cargo->numero_cargo);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error solicitud JPRD: ' . $e->getMessage()
                . ' | ' . $e->getFile() . ':' . $e->getLine()
                . ' | Trace: ' . $e->getTraceAsString());
            return back()->withErrors(['general' => 'Ocurrió un error al procesar la solicitud: ' . $e->getMessage()]);
        }
    }

    /**
     * Para consorcio, genera un nombre descriptivo desde el array de empresas.
     */
    private function nombreDesdeEmpresas(array $empresas, string $fallback): string
    {
        $nombres = array_filter(array_column($empresas, 'nombre'));
        if (empty($nombres)) return $fallback;
        return 'Consorcio: ' . implode(' / ', $nombres);
    }

    private function autoAsignarActores(Expediente $expediente, int $servicioId): void
    {
        $slugsExcluir = TipoActorExpediente::SLUGS_INMUTABLES;

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

            $rolId = Rol::where('slug', $config->rol_auto_slug)->value('id');
            if (!$rolId) continue;

            $usuario = User::where('rol_id', $rolId)
                ->where('activo', 1)
                ->withCount([
                    'expedienteActoresActivos' => fn($q) =>
                        $q->whereHas('expediente', fn($q2) => $q2->where('estado', 'activo'))
                ])
                ->orderBy('expediente_actores_activos_count', 'asc')
                ->first();

            if (!$usuario) continue;

            ExpedienteActor::updateOrCreate(
                ['expediente_id' => $expediente->id, 'tipo_actor_id' => $config->tipo_actor_id],
                ['usuario_id' => $usuario->id, 'activo' => 1, 'credenciales_enviadas' => true]
            );
        }
    }
}
