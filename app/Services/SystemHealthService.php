<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * SystemHealthService — radiografía en vivo de los servicios de infraestructura
 * que deben estar levantados en producción (cron, worker de colas, Reverb,
 * broadcasting) más chequeos de soporte (PostgreSQL, storage, correo, última
 * corrida de vencimientos).
 *
 * Estrategia para procesos que PHP no puede consultar directamente (cron/worker):
 *   - HEARTBEAT. El scheduler escribe `hb:scheduler` cada minuto (síncrono) y
 *     despacha HeartbeatJob, que al ejecutarse escribe `hb:queue`. Si el worker
 *     está vivo, ese segundo latido llega en segundos. Comparando la frescura de
 *     ambos latidos sabemos si el cron corre y si el worker los procesa.
 *
 * IMPORTANTE: usa config() — NO env() — para que siga funcionando con
 * `php artisan config:cache` en producción.
 */
class SystemHealthService
{
    public const HB_SCHEDULER    = 'hb:scheduler';
    public const HB_QUEUE        = 'hb:queue';
    public const HB_VENCIMIENTOS = 'hb:vencimientos:last';

    /** Un latido se considera "fresco" si tiene menos de estos segundos. */
    private const UMBRAL_LATIDO = 150; // 2.5 min — holgura sobre el minuto del scheduler

    public function snapshot(): array
    {
        $servicios = [
            $this->checkScheduler(),
            $this->checkQueue(),
            $this->checkReverb(),
            $this->checkBroadcasting(),
            $this->checkDatabase(),
            $this->checkStorage(),
            $this->checkMail(),
            $this->checkVencimientos(),
        ];

        return [
            'generado_at' => now()->toIso8601String(),
            'global'      => $this->estadoGlobal($servicios),
            'servicios'   => $servicios,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Procesos críticos
    // ─────────────────────────────────────────────────────────────────────────

    private function checkScheduler(): array
    {
        $ts  = Cache::get(self::HB_SCHEDULER);
        $age = $ts ? now()->timestamp - (int) $ts : null;

        if ($ts === null) {
            return $this->item('scheduler', 'Cron / Programador', 'Clock', 'error', true,
                'Nunca registró señal. El cron del servidor no está ejecutando «php artisan schedule:run».',
                [['label' => 'Esperado', 'value' => 'crontab cada minuto']]);
        }

        $fresco = $age <= self::UMBRAL_LATIDO;

        return $this->item('scheduler', 'Cron / Programador', 'Clock',
            $fresco ? 'ok' : 'error', true,
            $fresco
                ? 'El programador de tareas está corriendo.'
                : 'Sin señal reciente — el cron parece estar caído.',
            [
                ['label' => 'Última señal', 'value' => $this->hace($age)],
                ['label' => 'Comando',      'value' => 'php artisan schedule:run'],
            ]);
    }

    private function checkQueue(): array
    {
        $ts  = Cache::get(self::HB_QUEUE);
        $age = $ts ? now()->timestamp - (int) $ts : null;

        // Métricas de soporte: backlog y trabajos fallidos.
        $pendientes = $this->contarTabla('jobs');
        $fallidos   = $this->contarTabla('failed_jobs');

        $detalle = [
            ['label' => 'En cola',  'value' => $pendientes === null ? '—' : (string) $pendientes],
            ['label' => 'Fallidos', 'value' => $fallidos === null ? '—' : (string) $fallidos],
        ];

        if ($ts === null) {
            return $this->item('queue', 'Worker de Colas', 'Cpu', 'error', true,
                'Ningún trabajo de latido fue procesado. El worker «php artisan queue:work» no está activo.',
                $detalle);
        }

        $fresco = $age <= self::UMBRAL_LATIDO;
        array_unshift($detalle, ['label' => 'Último latido', 'value' => $this->hace($age)]);

        return $this->item('queue', 'Worker de Colas', 'Cpu',
            $fresco ? 'ok' : 'error', true,
            $fresco
                ? 'El worker está procesando la cola.'
                : 'El worker no procesa trabajos hace rato — parece estar caído.',
            $detalle);
    }

    private function checkReverb(): array
    {
        $configurado = ! empty(config('broadcasting.connections.reverb.key'));

        $host = (string) config('reverb.servers.reverb.host', '127.0.0.1');
        if (in_array($host, ['0.0.0.0', '', '::'], true)) {
            $host = '127.0.0.1'; // 0.0.0.0 es de binding, no de conexión
        }
        $port = (int) config('reverb.servers.reverb.port', 8080);

        if (! $configurado) {
            return $this->item('reverb', 'WebSocket (Reverb)', 'Radio', 'warn', true,
                'Reverb no está configurado: falta la clave REVERB_APP_KEY. El tiempo real no funcionará.',
                [['label' => 'Sugerido', 'value' => 'definir claves REVERB_* en .env']]);
        }

        $abierto = $this->puertoAbierto($host, $port);

        return $this->item('reverb', 'WebSocket (Reverb)', 'Radio',
            $abierto ? 'ok' : 'error', true,
            $abierto
                ? 'El servidor de WebSockets responde.'
                : 'No se pudo conectar al servidor Reverb — parece estar apagado.',
            [
                ['label' => 'Destino',  'value' => "{$host}:{$port}"],
                ['label' => 'Comando',  'value' => 'php artisan reverb:start'],
            ]);
    }

    private function checkBroadcasting(): array
    {
        $driver = (string) config('broadcasting.default');
        $ok     = $driver === 'reverb';

        return $this->item('broadcasting', 'Broadcasting', 'Antenna',
            $ok ? 'ok' : 'warn', true,
            $ok
                ? 'Broadcasting apunta a Reverb.'
                : "Broadcasting está en «{$driver}» — los eventos no salen por WebSocket. Debe ser «reverb».",
            [
                ['label' => 'Driver actual', 'value' => $driver ?: '—'],
                ['label' => 'Esperado',      'value' => 'reverb'],
            ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Soporte
    // ─────────────────────────────────────────────────────────────────────────

    private function checkDatabase(): array
    {
        try {
            DB::select('select 1');
            return $this->item('database', 'Base de Datos', 'Database', 'ok', false,
                'Conexión a PostgreSQL activa.',
                [['label' => 'Conexión', 'value' => (string) config('database.default')]]);
        } catch (\Throwable $e) {
            return $this->item('database', 'Base de Datos', 'Database', 'error', true,
                'No se pudo conectar a la base de datos.',
                [['label' => 'Error', 'value' => Str::limit($e->getMessage(), 120)]]);
        }
    }

    private function checkStorage(): array
    {
        try {
            $nombre = 'health/_probe_' . now()->timestamp . '.txt';
            Storage::disk('local')->put($nombre, 'ok');
            $leido = Storage::disk('local')->get($nombre) === 'ok';
            Storage::disk('local')->delete($nombre);

            return $this->item('storage', 'Almacenamiento', 'HardDrive',
                $leido ? 'ok' : 'warn', false,
                $leido ? 'El disco de storage es escribible.' : 'Escritura inconsistente en storage.',
                [['label' => 'Disco', 'value' => 'local']]);
        } catch (\Throwable $e) {
            return $this->item('storage', 'Almacenamiento', 'HardDrive', 'error', false,
                'No se pudo escribir en storage.',
                [['label' => 'Error', 'value' => Str::limit($e->getMessage(), 120)]]);
        }
    }

    private function checkMail(): array
    {
        $mailer = (string) config('mail.default');
        $host   = (string) config("mail.mailers.{$mailer}.host", '');

        $ok = $mailer !== '' && $mailer !== 'log' && $mailer !== 'array';

        return $this->item('mail', 'Correo Saliente', 'Mail',
            $ok ? 'ok' : 'warn', false,
            $ok
                ? 'El correo está configurado con un transporte real.'
                : "El correo usa «{$mailer}» — no envía emails reales (modo desarrollo).",
            array_values(array_filter([
                ['label' => 'Transporte', 'value' => $mailer ?: '—'],
                $host ? ['label' => 'Host', 'value' => $host] : null,
            ])));
    }

    private function checkVencimientos(): array
    {
        $ts  = Cache::get(self::HB_VENCIMIENTOS);
        $age = $ts ? now()->timestamp - (int) $ts : null;

        if ($ts === null) {
            return $this->item('vencimientos', 'Proceso de Vencimientos', 'AlarmClock', 'desconocido', false,
                'Aún no hay registro de una corrida. Corre a diario a las 07:00 vía scheduler.',
                [['label' => 'Comando', 'value' => 'expedientes:procesar-vencimientos']]);
        }

        // Se ejecuta una vez al día: damos 26h de holgura antes de alertar.
        $reciente = $age <= 26 * 3600;

        return $this->item('vencimientos', 'Proceso de Vencimientos', 'AlarmClock',
            $reciente ? 'ok' : 'warn', false,
            $reciente
                ? 'El proceso diario de vencimientos corrió a tiempo.'
                : 'Hace más de un día que no corre — revisa el scheduler.',
            [['label' => 'Última corrida', 'value' => $this->hace($age)]]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private function item(string $clave, string $nombre, string $icono, string $estado, bool $critico, string $mensaje, array $detalle = []): array
    {
        return compact('clave', 'nombre', 'icono', 'estado', 'critico', 'mensaje', 'detalle');
    }

    private function estadoGlobal(array $servicios): string
    {
        foreach ($servicios as $s) {
            if (($s['critico'] ?? false) && $s['estado'] === 'error') {
                return 'error';
            }
        }
        foreach ($servicios as $s) {
            if (in_array($s['estado'], ['error', 'warn'], true)) {
                return 'warn';
            }
        }
        return 'ok';
    }

    private function puertoAbierto(string $host, int $port, float $timeout = 2.0): bool
    {
        $conn = @fsockopen($host, $port, $errno, $errstr, $timeout);
        if ($conn) {
            fclose($conn);
            return true;
        }
        return false;
    }

    private function contarTabla(string $tabla): ?int
    {
        try {
            return (int) DB::table($tabla)->count();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function hace(?int $segundos): string
    {
        if ($segundos === null) return '—';
        if ($segundos < 60)    return "hace {$segundos}s";
        if ($segundos < 3600)  return 'hace ' . intdiv($segundos, 60) . ' min';
        if ($segundos < 86400) return 'hace ' . intdiv($segundos, 3600) . ' h';
        return 'hace ' . intdiv($segundos, 86400) . ' d';
    }
}
