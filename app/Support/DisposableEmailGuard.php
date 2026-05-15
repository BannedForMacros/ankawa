<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class DisposableEmailGuard
{
    private const RUTA = 'disposable-domains.txt';

    /**
     * Devuelve true si el email tiene un dominio considerado desechable
     * según la lista local en storage/app/disposable-domains.txt.
     * Si la lista no existe → devuelve false (fail-open: no bloqueamos
     * por configuración faltante, pero loggeamos en otra capa si se requiere).
     */
    public static function esDesechable(string $email): bool
    {
        $partes = explode('@', mb_strtolower(trim($email)));
        if (count($partes) !== 2 || empty($partes[1])) {
            return false;
        }

        $dominio = $partes[1];
        $lista   = self::cargar();

        return isset($lista[$dominio]);
    }

    /**
     * Carga la lista a un array indexado por dominio para lookup O(1).
     * Cachea estáticamente por request.
     */
    private static function cargar(): array
    {
        static $cache = null;

        if ($cache !== null) {
            return $cache;
        }

        if (!Storage::exists(self::RUTA)) {
            $cache = [];
            return $cache;
        }

        $contenido = Storage::get(self::RUTA);
        $lineas    = preg_split('/\r\n|\r|\n/', $contenido) ?: [];

        $cache = [];
        foreach ($lineas as $linea) {
            $d = trim(mb_strtolower($linea));
            if ($d === '' || str_starts_with($d, '#')) {
                continue;
            }
            $cache[$d] = true;
        }

        return $cache;
    }
}
