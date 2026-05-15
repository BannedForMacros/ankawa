<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class CaptchaValidator
{
    /**
     * Valida un token hCaptcha contra el endpoint oficial.
     * Devuelve true si el token es válido o si hCaptcha no está configurado
     * (modo desarrollo: si HCAPTCHA_SECRET es vacío se permite el paso para
     * no romper entornos locales; en producción la variable es obligatoria).
     */
    public static function valido(?string $token, ?string $ip = null): bool
    {
        $secret = config('services.hcaptcha.secret');

        if (empty($secret)) {
            return true;
        }

        if (empty($token)) {
            return false;
        }

        try {
            $resp = Http::asForm()
                ->timeout(6)
                ->post('https://hcaptcha.com/siteverify', array_filter([
                    'secret'   => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ]));

            if (!$resp->successful()) {
                Log::warning('hCaptcha verify HTTP error', ['status' => $resp->status()]);
                return false;
            }

            return (bool) ($resp->json('success') ?? false);
        } catch (\Throwable $e) {
            Log::warning('hCaptcha verify exception: ' . $e->getMessage());
            return false;
        }
    }
}
