<?php

namespace App\Console\Commands;

use App\Services\SystemHealthService;
use App\Services\VencimientoService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class ProcesarVencimientos extends Command
{
    protected $signature = 'expedientes:procesar-vencimientos';
    protected $description = 'Marca como vencidos los movimientos pendientes cuya fecha límite ya pasó';

    public function handle(VencimientoService $service): int
    {
        $cantidad = $service->procesarVencimientos();

        // Sella la última corrida para el panel "Estado del Sistema".
        Cache::put(SystemHealthService::HB_VENCIMIENTOS, now()->timestamp, 7 * 86400);

        $this->info("Se marcaron {$cantidad} movimiento(s) como vencido(s).");

        return self::SUCCESS;
    }
}
