<?php

namespace App\Providers;

use App\Services\CorrelativoService;
use App\Services\GestorExpedienteService;
use App\Services\MovimientoService;
use App\Services\NotificacionService;
use App\Services\VencimientoService;
use App\Services\EtapaService;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(CorrelativoService::class);
        $this->app->singleton(GestorExpedienteService::class);
        $this->app->singleton(MovimientoService::class);
        $this->app->singleton(NotificacionService::class);
        $this->app->singleton(VencimientoService::class);
        $this->app->singleton(EtapaService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
