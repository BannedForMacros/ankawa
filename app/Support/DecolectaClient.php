<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente unificado de Decolecta (RENIEC/SUNAT).
 * Devuelve siempre un array con:
 *   ['estado' => 'ok'|'no_encontrado'|'error'|'no_configurado',
 *    'http'   => int,
 *    'data'   => array|null,
 *    'mensaje'=> string|null]
 */
final class DecolectaClient
{
    private const URL_DNI = 'https://api.decolecta.com/v1/reniec/dni';
    private const URL_RUC = 'https://api.decolecta.com/v1/sunat/ruc';

    public static function consultarDni(string $numero): array
    {
        return self::consultar(self::URL_DNI, $numero);
    }

    public static function consultarRuc(string $numero): array
    {
        return self::consultar(self::URL_RUC, $numero);
    }

    private static function consultar(string $url, string $numero): array
    {
        $token = config('services.decolecta.token');
        if (!$token) {
            return ['estado' => 'no_configurado', 'http' => 0, 'data' => null, 'mensaje' => 'Servicio no configurado'];
        }

        try {
            $resp = Http::withToken($token)->timeout(8)->get($url, ['numero' => $numero]);
        } catch (\Throwable $e) {
            Log::warning('Decolecta network error: ' . $e->getMessage());
            return ['estado' => 'error', 'http' => 0, 'data' => null, 'mensaje' => 'No disponible'];
        }

        if ($resp->successful()) {
            return ['estado' => 'ok', 'http' => $resp->status(), 'data' => $resp->json(), 'mensaje' => null];
        }

        if (in_array($resp->status(), [404, 422], true)) {
            return ['estado' => 'no_encontrado', 'http' => $resp->status(), 'data' => null, 'mensaje' => 'No encontrado en RENIEC/SUNAT'];
        }

        return ['estado' => 'error', 'http' => $resp->status(), 'data' => null, 'mensaje' => 'Error en servicio externo'];
    }
}
