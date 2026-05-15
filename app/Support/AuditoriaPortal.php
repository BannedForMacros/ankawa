<?php

namespace App\Support;

use App\Models\AuditoriaPortal as AuditoriaPortalModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Helper centralizado para registrar eventos del portal público.
 * Se llama desde controllers, servicios y middleware en cada paso del flujo.
 */
final class AuditoriaPortal
{
    public static function registrar(
        string $evento,
        ?Request $request = null,
        array $metadata = [],
        ?Model $cargable = null,
    ): void {
        try {
            AuditoriaPortalModel::create([
                'evento'        => $evento,
                'email_sesion'  => session('portal_email'),
                'dni_sesion'    => session('portal_dni'),
                'user_id'       => session('portal_user_id'),
                'ip'            => $request?->ip(),
                'user_agent'    => $request?->userAgent(),
                'metadata'      => $metadata ?: null,
                'cargable_type' => $cargable ? get_class($cargable) : null,
                'cargable_id'   => $cargable?->getKey(),
            ]);
        } catch (\Throwable $e) {
            \Log::warning("AuditoriaPortal::registrar({$evento}) falló: " . $e->getMessage());
        }
    }
}
