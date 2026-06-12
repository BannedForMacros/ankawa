<?php

namespace App\Support;

use App\Models\Documento;
use App\Models\Expediente;
use App\Models\ExpedienteActor;
use App\Models\MovimientoDocumento;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Acceso autorizado a documentos de expediente (evidencia legal).
 *
 * Los adjuntos viven en el disco PRIVADO `documentos` y NUNCA se sirven por URL
 * directa. Toda descarga pasa por aquí, que resuelve el expediente/solicitud
 * dueño del documento y decide si quien pide tiene derecho a verlo:
 *   - Staff interno  → DocumentoController::descargar (guard web).
 *   - Parte externa  → PortalController::descargarDocumento (sesión OTP).
 *
 * Un documento puede vivir en dos tablas:
 *   - `documentos` (polimórfico) → adjuntos de la Solicitud.
 *   - `movimiento_documentos`    → adjuntos de un movimiento.
 */
class DocumentoAcceso
{
    /** Disco privado donde residen los documentos de expediente. */
    public const DISK = 'documentos';

    /** Busca el documento por id en ambas tablas (sin distinción para el frontend). */
    public static function resolver(int|string $id): ?Model
    {
        return Documento::find($id) ?? MovimientoDocumento::find($id);
    }

    /** Expediente dueño del documento, o null si aún es una solicitud sin expediente. */
    public static function expediente(Model $doc): ?Expediente
    {
        if ($doc instanceof MovimientoDocumento) {
            return $doc->movimiento?->expediente;
        }

        if ($doc instanceof Documento) {
            $modelo = $doc->modelo; // SolicitudArbitraje | SolicitudJPRD | Expediente | ...
            if ($modelo instanceof Expediente) {
                return $modelo;
            }
            // Las solicitudes exponen el expediente como relación MorphOne.
            if ($modelo && method_exists($modelo, 'expediente')) {
                return $modelo->expediente;
            }
        }

        return null;
    }

    /**
     * Emails dueños de la solicitud asociada (para el acceso pre-expediente:
     * el solicitante puede descargar sus propios adjuntos antes de que la
     * solicitud se convierta en expediente).
     */
    public static function emailsSolicitud(Model $doc): array
    {
        if (!$doc instanceof Documento) {
            return [];
        }
        $modelo = $doc->modelo;
        if (!$modelo) {
            return [];
        }

        $emails = [];
        foreach (['email_demandante', 'email_remitente', 'email'] as $col) {
            if (!empty($modelo->{$col})) {
                $emails[] = mb_strtolower(trim($modelo->{$col}));
            }
        }
        return array_values(array_unique($emails));
    }

    /** ¿El usuario interno (staff o solicitante autenticado) puede ver el documento? */
    public static function usuarioPuedeVer(Model $doc, User $user): bool
    {
        // Alcance global (admin / mesa de partes): ve todo.
        if ($user->rol?->puede_ver_todos_expedientes) {
            return true;
        }

        // Participa como actor activo del expediente dueño.
        $expediente = self::expediente($doc);
        if ($expediente) {
            $participa = ExpedienteActor::where('expediente_id', $expediente->id)
                ->where('usuario_id', $user->id)
                ->where('activo', 1)
                ->exists();
            if ($participa) {
                return true;
            }
        }

        // Solicitud sin expediente todavía: es el propio solicitante.
        $emails = self::emailsSolicitud($doc);
        return $user->email && in_array(mb_strtolower($user->email), $emails, true);
    }

    /**
     * ¿La sesión de portal (lista de actorIds + email) puede ver el documento?
     * $actorIds = ids de expediente_actores que pertenecen al email de la sesión OTP.
     */
    public static function portalPuedeVer(Model $doc, array $actorIds, string $email): bool
    {
        $expediente = self::expediente($doc);
        if ($expediente) {
            // Mismos flags que el dashboard y enviarDocumento: un actor desactivado
            // o con acceso revocado por el gestor no debe seguir descargando evidencia.
            $algunoParticipa = ExpedienteActor::where('expediente_id', $expediente->id)
                ->whereIn('id', $actorIds)
                ->where('activo', 1)
                ->where('acceso_mesa_partes', 1)
                ->exists();
            if ($algunoParticipa) {
                return true;
            }
        }

        $emails = self::emailsSolicitud($doc);
        return $email && in_array(mb_strtolower($email), $emails, true);
    }

    /**
     * Sirve el archivo desde el disco privado con headers seguros.
     * PDF/imágenes en línea; el resto se fuerza como descarga.
     * Debe llamarse SOLO después de validar autorización.
     */
    public static function servir(Model $doc): BinaryFileResponse
    {
        $disk = Storage::disk(self::DISK);

        abort_if(empty($doc->ruta_archivo) || !$disk->exists($doc->ruta_archivo), 404, 'El documento no existe en el servidor.');

        $absoluto = $disk->path($doc->ruta_archivo);
        $mime = @mime_content_type($absoluto) ?: 'application/octet-stream';

        // Solo se muestran en línea formatos seguros de previsualizar; el resto se descarga.
        $enLinea = in_array($mime, ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'], true);
        $disposicion = $enLinea ? 'inline' : 'attachment';
        $nombre = str_replace('"', '', (string) $doc->nombre_original) ?: 'documento';

        return response()->file($absoluto, [
            'Content-Type'           => $mime,
            'Content-Disposition'    => $disposicion . '; filename="' . $nombre . '"',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
