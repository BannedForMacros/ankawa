<?php

namespace App\Http\Controllers;

use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\ExpedienteActorEmail;
use App\Models\ExpedienteHistorial;
use App\Models\User;
use App\Models\Rol;
use App\Services\GestorExpedienteService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

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
            'tipo_actor_id'  => 'required|exists:tipos_actor_expediente,id',
            'modo'           => 'required|in:interno,externo',
            // Modo interno: seleccionar usuario existente
            'usuario_id'     => 'required_if:modo,interno|nullable|exists:users,id',
            // Modo externo: crear cuenta nueva
            'nombre_externo' => 'required_if:modo,externo|nullable|string|max:255',
            'email_externo'  => 'required_if:modo,externo|nullable|email|max:255',
        ]);

        $usuarioId = null;
        $credencialesEnviadas = false;

        if ($request->modo === 'interno') {
            $usuarioId = $request->usuario_id;
            // Usuario interno ya tiene credenciales del sistema
            $credencialesEnviadas = true;
        } else {
            // Modo externo: buscar o crear usuario
            $userExterno = User::where('email', $request->email_externo)->first();

            if (!$userExterno) {
                $passwordRaw = Str::random(10);
                $userExterno = User::create([
                    'name'     => $request->nombre_externo,
                    'email'    => $request->email_externo,
                    'password' => Hash::make($passwordRaw),
                    'rol_id'   => Rol::where('slug', 'usuario')->value('id'),
                    'activo'   => 1,
                ]);

                // Notificar al externo que se le creó cuenta
                try {
                    Mail::raw(
                        "Estimado(a) {$request->nombre_externo},\n\n" .
                        "Se le ha designado como actor en el expediente {$expediente->numero_expediente} en la plataforma ANKAWA.\n\n" .
                        "Sus credenciales de acceso son:\n" .
                        "Email: {$request->email_externo}\n" .
                        "Contraseña temporal: {$passwordRaw}\n\n" .
                        "Por favor ingrese a la plataforma y cambie su contraseña.\n\n" .
                        "Saludos cordiales.",
                        function ($message) use ($request) {
                            $message->to($request->email_externo, $request->nombre_externo)
                                    ->subject('Designación como actor en expediente - ANKAWA');
                        }
                    );
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
        $slugsProtegidos = ['demandante', 'demandado'];
        if (in_array($actor->tipoActor?->slug, $slugsProtegidos)) {
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
        abort_unless($user->rol?->puede_designar_gestor, 403,
            'No tiene permisos para designar gestor.');

        $request->validate([
            'actor_id' => 'required|exists:expediente_actores,id',
        ]);

        // Verificar que el actor pertenece a este expediente
        $actor = ExpedienteActor::where('id', $request->actor_id)
            ->where('expediente_id', $expediente->id)
            ->where('activo', 1)
            ->firstOrFail();

        // No permitir designar como gestor a demandante/demandado
        $slugsNoGestor = ['demandante', 'demandado'];
        if (in_array($actor->tipoActor?->slug, $slugsNoGestor)) {
            return back()->withErrors(['general' => 'El demandante y demandado no pueden ser designados como gestor.']);
        }

        $this->gestorService->designar($expediente, $actor->id, $user->id);

        $nombre = $actor->usuario?->name ?? 'Actor';
        return back()->with('success', "{$nombre} ha sido designado como Gestor del expediente.");
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

        // Si existe como baja lógica, reactivar; si no, crear
        $registro = ExpedienteActorEmail::where('expediente_actor_id', $actor->id)
            ->where('email', $emailNorm)
            ->first();

        if ($registro) {
            $registro->update(['activo' => 1, 'label' => $request->label]);
        } else {
            $orden = ExpedienteActorEmail::where('expediente_actor_id', $actor->id)->max('orden') + 1;
            $registro = ExpedienteActorEmail::create([
                'expediente_actor_id' => $actor->id,
                'email'  => $emailNorm,
                'label'  => $request->label,
                'orden'  => $orden,
                'activo' => 1,
            ]);
        }

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
}
