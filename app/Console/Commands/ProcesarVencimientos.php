<?php

namespace App\Console\Commands;

use App\Services\VencimientoService;
use Illuminate\Console\Command;

class ProcesarVencimientos extends Command
{
    protected $signature = 'expedientes:procesar-vencimientos';
    protected $description = 'Marca como vencidos los movimientos pendientes cuya fecha límite ya pasó';

    public function handle(VencimientoService $service): int
    {
        $cantidad = $service->procesarVencimientos();
        $this->info("Se marcaron {$cantidad} movimiento(s) como vencido(s).");

        return self::SUCCESS;
    }
}
