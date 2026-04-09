<?php

namespace App\Http\Controllers\Servicios\JPRD;

use App\Http\Controllers\Controller;
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

        DB::beginTransaction();

        try {
            // ── 1. Crear o recuperar usuario solicitante ─────────────────────
            $emailSol = $emailPrincipal['email'];
            $usuario  = User::where('email', $emailSol)
                ->orWhere('numero_documento', $request->documento_solicitante)
                ->first();

            $passwordRaw = null;
            if (!$usuario) {
                $passwordRaw = $request->documento_solicitante . Str::random(6);
                $usuario = User::create([
                    'name'             => $request->nombre_solicitante,
                    'email'            => $emailSol,
                    'password'         => Hash::make($passwordRaw),
                    'rol_id'           => Rol::where('slug', 'usuario')->value('id'),
                    'numero_documento' => $request->documento_solicitante,
                    'activo'           => 1,
                ]);
            }

            // ── 2. Crear solicitud ───────────────────────────────────────────
            $solicitud = SolicitudJPRD::create([
                'servicio_id'                => $request->servicio_id,
                'usuario_id'                 => $usuario->id,
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

            $cargo = Cargo::crear('solicitud', $solicitud, $usuario->id);
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

            // 5a. Entidad contratante → demandante (externo)
            $tipoActorDemandante = TipoActorExpediente::where('slug', 'demandante')->first();
            $emailsEntidad       = json_decode($request->emails_entidad ?? '[]', true) ?? [];
            $emailEntidad        = trim(collect($emailsEntidad)->first(fn($e) => !empty($e['email']))['email'] ?? '');

            if ($tipoActorDemandante) {
                ExpedienteActor::create([
                    'expediente_id'  => $expediente->id,
                    'usuario_id'     => null,
                    'tipo_actor_id'  => $tipoActorDemandante->id,
                    'nombre_externo' => $request->nombre_entidad,
                    'email_externo'  => $emailEntidad ?: null,
                    'activo'         => 1,
                ]);
            }

            // 5b. Contratista → demandado (externo)
            $tipoActorDemandado  = TipoActorExpediente::where('slug', 'demandado')->first();
            $emailsContratista   = json_decode($request->emails_contratista ?? '[]', true) ?? [];
            $emailContratista    = trim(collect($emailsContratista)->first(fn($e) => !empty($e['email']))['email'] ?? '');

            if ($tipoActorDemandado) {
                ExpedienteActor::create([
                    'expediente_id'  => $expediente->id,
                    'usuario_id'     => null,
                    'tipo_actor_id'  => $tipoActorDemandado->id,
                    'nombre_externo' => $request->nombre_contratista,
                    'email_externo'  => $emailContratista ?: null,
                    'activo'         => 1,
                ]);
            }

            // 5c. Auto-asignar Secretaria General Adjunta
            $this->autoAsignarActores($expediente, $request->servicio_id);

            // ── 6. Guardar documentos adjuntos ───────────────────────────────
            if ($request->hasFile('documentos')) {
                $carpeta = "expedientes/{$expediente->id}/solicitud";
                foreach ($request->file('documentos') as $archivo) {
                    $ruta = $archivo->store($carpeta, 'public');
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
            \Log::error('Error solicitud JPRD: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return back()->withErrors(['general' => 'Ocurrió un error. Por favor intente nuevamente.']);
        }
    }

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
