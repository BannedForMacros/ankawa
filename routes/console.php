<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduler: primero marcar vencidos, luego enviar recordatorios del día
resolve(Schedule::class)->command('expedientes:procesar-vencimientos')->dailyAt('07:00');
resolve(Schedule::class)->command('expedientes:enviar-recordatorios-vencimiento')->dailyAt('08:00');
