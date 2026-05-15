<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Documento extends Model
{
    protected $table = 'documentos';

    // Laravel gestiona created_at y updated_at automáticamente, no van en el fillable
    protected $fillable = [
        'modelo_tipo',
        'modelo_id',
        'etapa_id',
        'tipo_documento',
        'tipo_documento_id',
        'ruta_archivo',
        'nombre_original',
        'peso_bytes',
        'activo',
        'hash_sha256',
        'mime_type',
        'ip_subida',
    ];

    // Magia Polimórfica: Permite que el documento pertenezca a una Solicitud o a un Expediente
    public function modelo(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'modelo_tipo', 'modelo_id');
    }

    // Para agrupar los documentos en la vista por carpetas
    public function etapa(): BelongsTo
    {
        return $this->belongsTo(Etapa::class, 'etapa_id');
    }

    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', 1);
    }

    protected static function booted(): void
    {
        static::creating(function (Documento $doc) {
            if (empty($doc->hash_sha256) && !empty($doc->ruta_archivo)) {
                $absoluto = self::resolverPathAbsoluto($doc->ruta_archivo);
                if ($absoluto && is_file($absoluto)) {
                    $doc->hash_sha256 = hash_file('sha256', $absoluto) ?: null;
                    if (empty($doc->mime_type)) {
                        $doc->mime_type = function_exists('mime_content_type')
                            ? (mime_content_type($absoluto) ?: null)
                            : null;
                    }
                }
            }
        });
    }

    private static function resolverPathAbsoluto(string $rutaRelativa): ?string
    {
        $candidatos = [
            storage_path('app/public/' . ltrim($rutaRelativa, '/')),
            storage_path('app/private/' . ltrim($rutaRelativa, '/')),
            storage_path('app/' . ltrim($rutaRelativa, '/')),
            ltrim($rutaRelativa, '/'),
        ];

        foreach ($candidatos as $p) {
            if (is_file($p)) {
                return $p;
            }
        }
        return null;
    }
}