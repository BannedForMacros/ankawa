<?php

namespace App\Providers;

use App\Services\CorrelativoService;
use App\Services\GestorExpedienteService;
use App\Services\MovimientoService;
use App\Services\NotificacionService;
use App\Services\VencimientoService;
use App\Services\EtapaService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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

        // Anti-fuerza-bruta del flujo OTP del portal público.
        RateLimiter::for('portal-otp-enviar', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email')));
            return [
                Limit::perHour(5)->by($request->ip()),
                Limit::perMinutes(15, 3)->by('email:' . $email),
            ];
        });

        RateLimiter::for('portal-otp-verificar', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email')));
            return [
                Limit::perHour(20)->by($request->ip()),
                Limit::perHour(10)->by('email:' . $email),
            ];
        });

        // Validador de DNI/RUC público vía Decolecta.
        RateLimiter::for('consulta-documento', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        // Submit del formulario público (anti-spam).
        RateLimiter::for('portal-form-submit', function (Request $request) {
            return Limit::perHour(10)->by($request->ip());
        });
    }
}
