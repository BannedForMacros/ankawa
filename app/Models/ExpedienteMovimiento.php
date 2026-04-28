<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ExpedienteMovimiento extends Model
{
    protected $table = 'expediente_movimientos';

    // Estados posibles de un movimiento
    public const ESTADO_PENDIENTE             = 'pendiente';
    public const ESTADO_RESPONDIDO            = 'respondido';
    public const ESTADO_VENCIDO               = 'vencido';
    public const ESTADO_RECIBIDO              = 'recibido';
    public const ESTADO_PENDIENTE_ACEPTACION  = 'pendiente_aceptacion';
    public const ESTADO_RECHAZADO             = 'rechazado';

    public const ESTADOS = [
        self::ESTADO_PENDIENTE,
        self::ESTADO_RESPONDIDO,
        self::ESTADO_VENCIDO,
        self::ESTADO_RECIBIDO,
        self::ESTADO_PENDIENTE_ACEPTACION,
        self::ESTADO_RECHAZADO,
    ];

    // Tipos de movimiento
    public const TIPO_REQUERIMIENTO = 'requerimiento';
    public const TIPO_PROPIA        = 'propia';
    public const TIPO_NOTIFICACION  = 'notificacion';
    public const TIPO_ENVIO_EXTERNO = 'envio_externo';

    public const TIPOS = [
        self::TIPO_REQUERIMIENTO,
        self::TIPO_PROPIA,
        self::TIPO_NOTIFICACION,
        self::TIPO_ENVIO_EXTERNO,
    ];

    protected $fillable = [
        'expediente_id',
        'tipo',
        'etapa_id',
        'tipo_actor_responsable_id',
        'usuario_responsable_id',
        'creado_por',
        'instruccion',
        'observaciones',
        'respuesta',
        'dias_plazo',
        'tipo_dias',
        'fecha_limite',
        'fecha_respuesta',
        'respondido_por',
        'tipo_documento_requerido_id',
        'resolucion_tipo_id',
        'resolucion_nota',
        'resuelto_por',
        'fecha_resolucion',
        'estado',
        'enviar_credenciales',
        'credenciales_enviadas',
        'actor_credenciales_id',
        'credenciales_email_destino',
        'genera_cargo',
        'habilitar_mesa_partes',
        'enviar_credenciales_expediente',
        'actor_credenciales_exp_id',
        'actores_mesa_partes_ids',
        'aceptado_por',
        'fecha_aceptacion',
        'rechazado_por',
        'fecha_rechazo',
        'motivo_rechazo',
        'portal_email_envio',
        'activo',
    ];

    protected $casts = [
        'fecha_limite'                   => 'date',
        'fecha_respuesta'                => 'datetime',
        'fecha_resolucion'               => 'datetime',
        'activo'                         => 'boolean',
        'enviar_credenciales'            => 'boolean',
        'credenciales_enviadas'          => 'boolean',
        'genera_cargo'                   => 'boolean',
        'habilitar_mesa_partes'          => 'boolean',
        'enviar_credenciales_expediente' => 'boolean',
        'actores_mesa_partes_ids'        => 'array',
        'fecha_aceptacion'               => 'datetime',
        'fecha_rechazo'                  => 'datetime',
    ];

    public function expediente(): BelongsTo
    {
        return $this->belongsTo(Expediente::class, 'expediente_id');
    }

    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function tipoActorResponsable(): BelongsTo
    {
        return $this->belongsTo(TipoActorExpediente::class, 'tipo_actor_responsable_id');
    }

    public function usuarioResponsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_responsable_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function respondidoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'respondido_por');
    }

    public function documentos(): HasMany
    {
        return $this->hasMany(MovimientoDocumento::class, 'movimiento_id');
    }

    public function tipoDocumentoRequerido(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_requerido_id');
    }

    public function resolucionTipo(): BelongsTo
    {
        return $this->belongsTo(TipoResolucionMovimiento::class, 'resolucion_tipo_id');
    }

    public function resueltoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resuelto_por');
    }

    public function actorCredenciales(): BelongsTo
    {
        return $this->belongsTo(ExpedienteActor::class, 'actor_credenciales_id');
    }

    public function cargo(): \Illuminate\Database\Eloquent\Relations\MorphOne
    {
        return $this->morphOne(\App\Models\Cargo::class, 'cargable');
    }

    public function responsables(): HasMany
    {
        return $this->hasMany(MovimientoResponsable::class, 'movimiento_id');
    }

    public function puedeSerResuelto(): bool
    {
        $tieneResponsable = $this->usuario_responsable_id !== null
            || $this->responsables()->exists();

        return $this->estado === 'respondido'
            && $tieneResponsable
            && $this->resolucion_tipo_id === null;
    }

    public function esResponsable(int $userId): bool
    {
        if ((int) $this->usuario_responsable_id === $userId) {
            return true;
        }
        return $this->responsables()
            ->whereHas('actor', fn($q) => $q->where('usuario_id', $userId))
            ->where('estado', 'pendiente')
            ->exists();
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(MovimientoNotificacion::class, 'movimiento_id');
    }

    public function extensiones(): HasMany
    {
        return $this->hasMany(MovimientoExtensionPlazo::class, 'movimiento_id')
            ->orderBy('created_at');
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeEnviosPendientes($query, ?int $expedienteId = null)
    {
        $query->where('tipo', self::TIPO_ENVIO_EXTERNO)
              ->where('estado', self::ESTADO_PENDIENTE_ACEPTACION);

        if ($expedienteId !== null) {
            $query->where('expediente_id', $expedienteId);
        }
        return $query;
    }

    public function scopeEnviosProcesados($query, ?int $expedienteId = null)
    {
        $query->where('tipo', self::TIPO_ENVIO_EXTERNO)
              ->whereIn('estado', [self::ESTADO_RECIBIDO, self::ESTADO_RECHAZADO]);

        if ($expedienteId !== null) {
            $query->where('expediente_id', $expedienteId);
        }
        return $query;
    }

    public function aceptadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aceptado_por');
    }

    public function rechazadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rechazado_por');
    }

    public function estaVencido(): bool
    {
        return $this->estado === 'pendiente'
            && $this->fecha_limite
            && $this->fecha_limite->isPast();
    }

    /**
     * Días restantes hasta fecha_limite.
     * Cuenta días hábiles (lun-vie, excluye feriados) cuando tipo_dias = 'habiles',
     * días calendario en caso contrario. Negativo si ya venció.
     */
    public function diasRestantes(): ?int
    {
        if (!$this->fecha_limite) return null;

        $hoy    = now()->startOfDay();
        $limite = $this->fecha_limite->copy()->startOfDay();

        if ($this->tipo_dias !== 'habiles') {
            return (int) ceil(($limite->timestamp - $hoy->timestamp) / 86400);
        }

        // Días hábiles restantes (sin fines de semana ni feriados)
        $feriados = \DB::table('feriados')->where('activo', true)->pluck('fecha')->map(fn($f) => $f)->toArray();
        $dias     = 0;
        $actual   = $hoy->copy();

        if ($actual->gte($limite)) {
            while ($actual->gt($limite)) {
                $actual->subDay();
                if ($actual->dayOfWeek !== 0 && $actual->dayOfWeek !== 6
                    && !in_array($actual->toDateString(), $feriados)) {
                    $dias--;
                }
            }
            return $dias;
        }

        while ($actual->lt($limite)) {
            $actual->addDay();
            if ($actual->dayOfWeek !== 0 && $actual->dayOfWeek !== 6
                && !in_array($actual->toDateString(), $feriados)) {
                $dias++;
            }
        }
        return $dias;
    }
}
