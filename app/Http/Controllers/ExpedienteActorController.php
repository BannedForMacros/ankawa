<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorAceptacion;
use App\Models\ExpedienteActorEmail;
use App\Models\ExpedienteHistorial;
use App\Models\User;
use App\Models\Rol;
use App\Models\TipoActorExpediente;
use App\Services\GestorExpedienteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use App\Mail\CredencialesAccesoMail;

class ExpedienteActorController extends Controller
{
    public function __construct(
        private GestorExpedienteService $gestorService,
    ) {}

    /**
     * Agregar un actor al expediente.
     * Puede ser un usuario interno (usuario_id) o externo (nombre + email → se crea cuenta).
     */
    public function store(Request $request, Expediente $expediente)
    {
        $this->autorizarGestion($expediente);

        $request->validate([
            'tipo_actor_id'  => [
                'required',
                Rule::exists('servicio_tipos_actor', 'tipo_actor_id')
                    ->where('servicio_id', $expediente->servicio_id),
            ],
            'modo'           => 'required|in:interno,externo',
            // Modo interno: seleccionar usuario existente
            'usuario_id'     => 'required_if:modo,interno|nullable|exists:users,id',
            // Modo externo: crear cuenta nueva
            'nombre_externo' => 'required_if:modo,externo|nullable|string|max:255',
            'email_externo'  => 'required_if:modo,externo|nullable|email|max:255',
        ]);

        $usuarioId = null;
        $credencialesEnviadas = false;

        // Detectar si es un demandado (flujo con validación diferida del User)
        $tipoActor = TipoActorExpediente::find($request->tipo_actor_id);
        $esDemandado = $tipoActor?->slug === TipoActorExpediente::SLUG_DEMANDADO;

        if ($request->modo === 'interno') {
            $usuarioId = $request->usuario_id;
            // Usuario interno ya tiene credenciales del sistema
            $credencialesEnviadas = true;
        } elseif ($esDemandado) {
            // Demandado externo: NO crear User. El User se creará cuando el gestor
            // valide el correo (vía endpoint validar()).
            $usuarioId = null;
            $credencialesEnviadas = false;
        } else {
            // Otros actores externos (Secretario Arbitral, Director, etc.): se crea
            // User y se envían credenciales como hoy. El gestor los agrega con
            // correos vetados.
            $userExterno = User::where('email', $request->email_externo)->first();

            if (!$userExterno) {
                $passwordRaw = Str::random(10);
                $userExterno = User::create([
                    'name'     => $request->nombre_externo,
                    'email'    => $request->email_externo,
                    'password' => Hash::make($passwordRaw),
                    'rol_id'   => Rol::where('slug', Rol::SLUG_USUARIO)->value('id'),
                    'activo'   => 1,
                ]);

                // Notificar al externo que se le creó cuenta
                try {
                    Mail::to($request->email_externo, $request->nombre_externo)
                        ->send(new CredencialesAccesoMail(
                            nombreDestinatario: $request->nombre_externo,
                            emailUsuario:       $request->email_externo,
                            passwordTemporal:   $passwordRaw,
                            numeroExpediente:   $expediente->numero_expediente,
                            contexto:           'expediente',
                        ));
                    $credencialesEnviadas = true;
                } catch (\Exception $e) {
                    \Log::warning("No se pudo enviar email a actor externo: " . $e->getMessage());
                }
            } else {
                // Usuario externo ya existía: ya tiene sus credenciales
                $credencialesEnviadas = true;
            }

            $usuarioId = $userExterno->id;
        }

        // Para demandado externo sin User no podemos usar updateOrCreate por usuario_id,
        // así que insertamos directo con email_externo/nombre_externo.
        if ($esDemandado && $request->modo === 'externo') {
            $actor = ExpedienteActor::create([
                'expediente_id'         => $expediente->id,
                'tipo_actor_id'         => $request->tipo_actor_id,
                'usuario_id'            => null,
                'nombre_externo'        => $request->nombre_externo,
                'email_externo'         => $request->email_externo,
                'activo'                => 1,
                'credenciales_enviadas' => false,
            ]);
        } else {
            $actor = ExpedienteActor::updateOrCreate(
                [
                    'expediente_id' => $expediente->id,
                    'tipo_actor_id' => $request->tipo_actor_id,
                    'usuario_id'    => $usuarioId,
                ],
                [
                    'activo'               => 1,
                    'credenciales_enviadas' => $credencialesEnviadas,
                ]
            );
        }

        $nombre = $actor->usuario?->name ?? $request->nombre_externo ?? 'Actor';
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'actor_agregado',
            'descripcion'   => "Se designó a {$nombre} como {$actor->tipoActor->nombre}.",
            'datos_extra'   => ['actor_id' => $actor->id, 'tipo_actor_id' => $request->tipo_actor_id],
            'created_at'    => now(),
        ]);

        return back()->with('success', "Actor designado correctamente: {$nombre}.");
    }

    /**
     * Desactivar un actor del expediente.
     */
    public function destroy(Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        // No permitir remover demandante/demandado
        if (in_array($actor->tipoActor?->slug, TipoActorExpediente::SLUGS_INMUTABLES, true)) {
            return back()->withErrors(['general' => 'No se puede remover al demandante ni al demandado.']);
        }

        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        $actor->update(['activo' => 0, 'es_gestor' => false]);

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'actor_removido',
            'descripcion'   => "Se removió al actor: {$nombre}",
            'datos_extra'   => ['actor_id' => $actor->id],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Actor removido correctamente.');
    }

    /**
     * Designar gestor del expediente.
     * Recibe actor_id (un actor ya asignado al expediente).
     */
    public function designarGestor(Request $request, Expediente $expediente)
    {
        $user = auth()->user();

        // Puede designar: rol con puede_designar_gestor O quien ya es responsable del expediente
        $puedeDesignar = ($user->rol?->puede_designar_gestor ?? false)
            || $this->gestorService->esGestor($expediente, $user->id);

        abort_unless($puedeDesignar, 403, 'No tiene permisos para designar responsable.');

        $request->validate([
            'actor_id' => [
                'required',
                Rule::exists('expediente_actores', 'id')->where('expediente_id', $expediente->id),
            ],
        ]);

        // Verificar que el actor pertenece a este expediente y está activo
        $actor = ExpedienteActor::where('id', $request->actor_id)
            ->where('expediente_id', $expediente->id)
            ->where('activo', 1)
            ->firstOrFail();

        // No permitir designar como responsable a demandante/demandado
        if (in_array($actor->tipoActor?->slug, TipoActorExpediente::SLUGS_INMUTABLES, true)) {
            return back()->withErrors(['general' => 'El demandante y demandado no pueden ser designados como responsable.']);
        }

        // Ya es responsable
        if ($actor->es_gestor) {
            return back()->withErrors(['general' => 'Este actor ya es responsable del expediente.']);
        }

        $this->gestorService->designar($expediente, $actor->id, $user->id);

        $nombre = $actor->usuario?->name ?? 'Actor';
        return back()->with('success', "{$nombre} ha sido designado como Responsable del expediente.");
    }

    /**
     * Agregar un email adicional a un actor.
     * Si el email ya existía (baja lógica), lo reactiva.
     */
    public function storeEmail(Request $request, Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $request->validate([
            'email' => 'required|email|max:255',
            'label' => 'nullable|string|max:100',
        ]);

        $emailNorm = strtolower(trim($request->email));

        // Verificar si ya está activo
        $activo = ExpedienteActorEmail::where('expediente_actor_id', $actor->id)
            ->where('email', $emailNorm)
            ->where('activo', 1)
            ->exists();

        if ($activo) {
            return back()->withErrors(['email' => 'Este email ya está registrado para este actor.']);
        }

        // Si existe como baja lógica, reactivar; si no, crear.
        // Envolvemos en transacción + lockForUpdate para evitar `orden` duplicado en
        // requests concurrentes (max('orden') sin lock es race condition).
        $registro = DB::transaction(function () use ($actor, $emailNorm, $request) {
            $existente = ExpedienteActorEmail::where('expediente_actor_id', $actor->id)
                ->where('email', $emailNorm)
                ->lockForUpdate()
                ->first();

            if ($existente) {
                $existente->update(['activo' => 1, 'label' => $request->label]);
                return $existente;
            }

            $maxOrden = ExpedienteActorEmail::where('expediente_actor_id', $actor->id)
                ->lockForUpdate()
                ->max('orden') ?? 0;

            return ExpedienteActorEmail::create([
                'expediente_actor_id' => $actor->id,
                'email'  => $emailNorm,
                'label'  => $request->label,
                'orden'  => $maxOrden + 1,
                'activo' => 1,
            ]);
        });

        $nombreActor = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'email_actor_agregado',
            'descripcion'   => "Se agregó el correo {$emailNorm} al actor {$nombreActor}.",
            'datos_extra'   => ['actor_id' => $actor->id, 'email_id' => $registro->id, 'email' => $emailNorm],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Email adicional agregado correctamente.');
    }

    /**
     * Baja lógica de un email adicional de un actor.
     */
    public function destroyEmail(Expediente $expediente, ExpedienteActor $actor, int $emailId)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $email = ExpedienteActorEmail::where('id', $emailId)
            ->where('expediente_actor_id', $actor->id)
            ->where('activo', 1)
            ->firstOrFail();

        $email->update(['activo' => 0]);

        $nombreActor = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'email_actor_eliminado',
            'descripcion'   => "Se eliminó el correo {$email->email} del actor {$nombreActor}.",
            'datos_extra'   => ['actor_id' => $actor->id, 'email_id' => $email->id, 'email' => $email->email],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Email eliminado correctamente.');
    }

    /**
     * Toggle de acceso (mesa_partes o expediente_electronico) para un actor.
     */
    public function toggleAcceso(Request $request, Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $request->validate([
            'campo' => 'required|in:acceso_mesa_partes,acceso_expediente_electronico',
        ]);

        $campo = $request->campo;
        $nuevoValor = $actor->$campo ? 0 : 1;
        $actor->update([$campo => $nuevoValor]);

        $nombre = $actor->usuario?->name ?? $actor->nombre_externo ?? 'Actor';
        $label = $campo === 'acceso_mesa_partes' ? 'Mesa de Partes' : 'Expediente Electrónico';
        $accion = $nuevoValor ? 'habilitado' : 'deshabilitado';

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => "acceso_{$accion}",
            'descripcion'   => "Acceso a {$label} {$accion} para {$nombre}.",
            'datos_extra'   => ['actor_id' => $actor->id, 'campo' => $campo, 'valor' => $nuevoValor],
            'created_at'    => now(),
        ]);

        return back()->with('success', "Acceso a {$label} {$accion} para {$nombre}.");
    }

    private function autorizarGestion(Expediente $expediente): void
    {
        $user = auth()->user();
        $esGestor = $this->gestorService->esGestor($expediente, $user->id);
        $puedeGestionar = $user->rol?->puede_designar_gestor ?? false;

        abort_unless($esGestor || $puedeGestionar, 403,
            'No tiene permisos para gestionar actores en este expediente.');
    }

    /**
     * Actualizar el correo principal de un actor del expediente.
     * Maneja 4 casos según el estado del actor:
     *   A  - Actor sin User: solo actualiza email_externo (NO crea User aún).
     *   B  - Actor con User exclusivo de este expediente: actualiza users.email.
     *   B' - Actor con User compartido en otros expedientes: crea User nuevo y re-apunta solo este actor.
     *   C  - El email nuevo ya pertenece a otro User existente: re-apunta el actor a ese User.
     * Si el actor estaba validado, la validación se invalida automáticamente.
     */
    public function actualizarEmailPrincipal(Request $request, Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $validated  = $request->validate(['email' => 'required|email|max:255']);
        $emailNuevo = strtolower(trim($validated['email']));
        $emailActual = strtolower($actor->usuario?->email ?? $actor->email_externo ?? '');

        if ($emailActual === $emailNuevo) {
            return back();
        }

        DB::transaction(function () use ($actor, $emailNuevo, $expediente, $request) {
            if ($actor->usuario_id) {
                $userExistente = User::where('email', $emailNuevo)->first();
                $userActual    = $actor->usuario;
                $usadoEnOtros  = ExpedienteActor::where('usuario_id', $userActual->id)
                    ->where('id', '!=', $actor->id)
                    ->exists();

                if ($userExistente) {
                    // Caso C: re-apuntar al User existente
                    $actor->update([
                        'usuario_id'     => $userExistente->id,
                        'email_externo'  => null,
                        'nombre_externo' => null,
                    ]);
                } elseif ($usadoEnOtros) {
                    // Caso B': User compartido → crear nuevo, re-apuntar solo este actor
                    $userNuevo = User::create([
                        'name'     => $userActual->name,
                        'email'    => $emailNuevo,
                        'password' => Hash::make(Str::random(10)),
                        'rol_id'   => Rol::where('slug', Rol::SLUG_USUARIO)->value('id'),
                        'activo'   => 1,
                    ]);
                    $actor->update([
                        'usuario_id'     => $userNuevo->id,
                        'email_externo'  => null,
                        'nombre_externo' => null,
                    ]);
                } else {
                    // Caso B: User exclusivo → actualizar su email
                    $userActual->update([
                        'email' => $emailNuevo,
                        'email_verified_at' => null,
                    ]);
                }
            } else {
                // Caso A: actor sin User → solo actualizar email_externo (NO crear User aún)
                $actor->update(['email_externo' => $emailNuevo]);
            }

            // Invalidar la validación previa (si existía)
            ExpedienteActorAceptacion::where('expediente_actor_id', $actor->id)
                ->where('tipo', 'validado_por_gestor')
                ->delete();

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => auth()->id(),
                'tipo_evento'   => 'correo_actor_actualizado',
                'descripcion'   => "Se actualizó el correo del actor #{$actor->id} a {$emailNuevo}. Validación previa invalidada (si existía).",
                'datos_extra'   => ['actor_id' => $actor->id, 'email_nuevo' => $emailNuevo],
                'created_at'    => now(),
            ]);
        });

        return back()->with('success', 'Correo actualizado correctamente.');
    }

    /**
     * Validar manualmente el correo de un actor.
     * Crea o linkea el User aplicando los 4 paradigmas + setea email_verified_at +
     * registra fila en expediente_actor_aceptaciones con tipo validado_por_gestor.
     */
    public function validar(Request $request, Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        $emailActual = strtolower($actor->usuario?->email ?? $actor->email_externo ?? '');
        abort_if($emailActual === '', 422, 'El actor no tiene correo. Asígnele uno antes de validar.');

        DB::transaction(function () use ($actor, $emailActual, $expediente, $request) {
            if (!$actor->usuario_id) {
                $userExistente = User::where('email', $emailActual)->first();
                if ($userExistente) {
                    $actor->update([
                        'usuario_id'     => $userExistente->id,
                        'email_externo'  => null,
                        'nombre_externo' => null,
                    ]);
                    $userExistente->forceFill(['email_verified_at' => now()])->save();
                } else {
                    $userNuevo = User::create([
                        'name'              => $actor->nombre_externo ?: 'Sin nombre',
                        'email'             => $emailActual,
                        'password'          => Hash::make(Str::random(10)),
                        'rol_id'            => Rol::where('slug', Rol::SLUG_USUARIO)->value('id'),
                        'activo'            => 1,
                        'email_verified_at' => now(),
                    ]);
                    $actor->update([
                        'usuario_id'     => $userNuevo->id,
                        'email_externo'  => null,
                        'nombre_externo' => null,
                    ]);
                }
            } else {
                // Actor ya tiene User: solo marcar verificado
                $actor->usuario->forceFill(['email_verified_at' => now()])->save();
            }

            ExpedienteActorAceptacion::firstOrCreate(
                [
                    'expediente_actor_id' => $actor->id,
                    'expediente_id'       => $expediente->id,
                    'tipo'                => 'validado_por_gestor',
                ],
                [
                    'ip_address'           => $request->ip(),
                    'user_agent'           => $request->userAgent(),
                    'portal_email'         => $emailActual,
                    'validado_por_user_id' => auth()->id(),
                    'created_at'           => now(),
                ]
            );

            ExpedienteHistorial::create([
                'expediente_id' => $expediente->id,
                'usuario_id'    => auth()->id(),
                'tipo_evento'   => 'actor_validado_por_gestor',
                'descripcion'   => "El gestor validó el correo {$emailActual} del actor #{$actor->id}.",
                'datos_extra'   => ['actor_id' => $actor->id, 'email' => $emailActual],
                'created_at'    => now(),
            ]);
        });

        return back()->with('success', 'Correo validado correctamente.');
    }

    /**
     * Revocar la validación previa de un actor.
     */
    public function invalidar(Request $request, Expediente $expediente, ExpedienteActor $actor)
    {
        $this->autorizarGestion($expediente);
        abort_unless($actor->expediente_id === $expediente->id, 404);

        ExpedienteActorAceptacion::where('expediente_actor_id', $actor->id)
            ->where('tipo', 'validado_por_gestor')
            ->delete();

        ExpedienteHistorial::create([
            'expediente_id' => $expediente->id,
            'usuario_id'    => auth()->id(),
            'tipo_evento'   => 'actor_invalidado_por_gestor',
            'descripcion'   => "El gestor revocó la validación del actor #{$actor->id}.",
            'datos_extra'   => ['actor_id' => $actor->id],
            'created_at'    => now(),
        ]);

        return back()->with('success', 'Validación revocada.');
    }
}
