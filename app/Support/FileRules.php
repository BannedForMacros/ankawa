<?php

namespace App\Support;

class FileRules
{
    /**
     * Regla de validación Laravel para un campo de archivo individual.
     * Usar en: 'documentos.*' => FileRules::accept()
     */
    public static function accept(): string
    {
        $mimes = implode(',', config('uploads.allowed_mimes'));
        $maxKb = config('uploads.max_size_mb') * 1024;
        return "file|mimes:{$mimes}|max:{$maxKb}";
    }

    /**
     * Valor para el atributo HTML accept= de <input type="file">.
     * Disponible en el frontend vía usePage().props.upload_accept
     */
    public static function acceptAttr(): string
    {
        return implode(',', array_map(fn($m) => ".{$m}", config('uploads.allowed_mimes')));
    }
}
