<?php

namespace App\Support;

/**
 * Calcula y valida el dígito verificador del DNI peruano.
 * Algoritmo Módulo 11 con tabla de sustitución (impreso en el DNI físico,
 * no calculable solo desde el número en sistemas externos).
 */
final class DniValidator
{
    private const PESOS    = [3, 2, 7, 6, 5, 4, 3, 2];
    private const NUMERICA = ['6', '7', '8', '9', '0', '1', '1', '2', '3', '4', '5'];
    private const LETRA    = ['K', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    public static function calcular(string $dni): array
    {
        if (!preg_match('/^\d{8}$/', $dni)) {
            throw new \InvalidArgumentException('DNI debe tener exactamente 8 dígitos');
        }

        $suma = 0;
        for ($i = 0; $i < 8; $i++) {
            $suma += (int) $dni[$i] * self::PESOS[$i];
        }

        $residuo = $suma % 11;
        $valor   = 11 - $residuo;
        $pos     = $valor + 1;
        if ($pos > 11) {
            $pos -= 11;
        }

        return [
            'numerico' => self::NUMERICA[$pos - 1],
            'letra'    => self::LETRA[$pos - 1],
        ];
    }

    public static function esValido(string $dni, string $digito): bool
    {
        try {
            $r = self::calcular($dni);
        } catch (\InvalidArgumentException) {
            return false;
        }

        $digito = mb_strtoupper(trim($digito));
        return $digito === $r['numerico'] || $digito === $r['letra'];
    }
}
