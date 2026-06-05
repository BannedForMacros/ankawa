<?php

use App\Jobs\HeartbeatJob;
use App\Services\SystemHealthService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduler: primero marcar vencidos, luego enviar recordatorios del día
resolve(Schedule::class)->command('expedientes:procesar-vencimientos')->dailyAt('07:00');
resolve(Schedule::class)->command('expedientes:enviar-recordatorios-vencimiento')->dailyAt('08:00');

// Latidos para el panel "Estado del Sistema":
//  - El propio scheduler marca su pulso (confirma que el cron corre).
//  - HeartbeatJob se procesa solo si el worker de colas está activo.
resolve(Schedule::class)->call(fn () => Cache::put(SystemHealthService::HB_SCHEDULER, now()->timestamp, 1800))
    ->everyMinute()->name('hb-scheduler')->withoutOverlapping();
resolve(Schedule::class)->job(new HeartbeatJob)->everyMinute()->name('hb-queue');

// Refresco semanal de la lista de dominios de correo desechables (antes sin agendar).
resolve(Schedule::class)->command('disposable:refresh')->weeklyOn(1, '03:00');
