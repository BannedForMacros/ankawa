<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class RefreshDisposableDomains extends Command
{
    protected $signature = 'disposable:refresh';
    protected $description = 'Refresca la lista local de dominios de correo desechables';

    private const URL  = 'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/master/disposable_email_blocklist.conf';
    private const RUTA = 'disposable-domains.txt';

    public function handle(): int
    {
        $this->info('Descargando lista actualizada…');

        try {
            $resp = Http::timeout(30)->get(self::URL);
        } catch (\Throwable $e) {
            $this->error("Error de red: {$e->getMessage()}");
            return self::FAILURE;
        }

        if (!$resp->successful()) {
            $this->error("HTTP {$resp->status()} al descargar la lista.");
            return self::FAILURE;
        }

        $contenido = $resp->body();
        $lineas    = preg_split('/\r\n|\r|\n/', $contenido) ?: [];
        $lineas    = array_values(array_filter(array_map('trim', $lineas), fn($l) => $l !== '' && !str_starts_with($l, '#')));

        if (count($lineas) < 100) {
            $this->error('Lista sospechosamente corta (' . count($lineas) . ' dominios). No se sobreescribe.');
            return self::FAILURE;
        }

        Storage::put(self::RUTA, implode("\n", $lineas) . "\n");
        $this->info('Lista actualizada: ' . count($lineas) . ' dominios.');

        return self::SUCCESS;
    }
}
