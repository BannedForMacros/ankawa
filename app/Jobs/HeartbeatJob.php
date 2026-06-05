<?php

namespace App\Jobs;

use App\Services\SystemHealthService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;

/**
 * Latido de la cola. El scheduler lo despacha cada minuto; cuando un worker
 * activo lo procesa, escribe `hb:queue`. SystemHealthService compara la frescura
 * de ese latido para saber si el worker de colas sigue vivo.
 */
class HeartbeatJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        Cache::put(SystemHealthService::HB_QUEUE, now()->timestamp, 1800);
    }
}
