<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MesaPartesController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use App\Http\Controllers\Configuracion\CorrelativoController;
use App\Http\Controllers\Configuracion\ServicioController;
use App\Http\Controllers\Configuracion\EtapaController;
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\SecretariaController;
use App\Http\Controllers\ExpedienteArbController;
use App\Http\Controllers\SolicitudController;
use Inertia\Inertia;

Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
        Route::get('/mesa-partes/bandeja', [MesaPartesController::class, 'bandeja'])
        ->name('mesa-partes.bandeja');

    // Cliente
    Route::get('/mesa-partes/mis-solicitudes', [MesaPartesController::class, 'misSolicitudes'])
        ->name('mesa-partes.mis-solicitudes');

    // Subsanar (cliente)
    Route::post('/mesa-partes/solicitud/{solicitud}/subsanar', [MesaPartesController::class, 'subsanar'])
        ->name('mesa-partes.subsanar');

    Route::prefix('configuracion')->middleware(['auth'])->group(function () {

        Route::get('/roles',        [RolController::class, 'index'])  ->name('configuracion.roles.index')  ->middleware('permiso:configuracion.roles,ver');
        Route::post('/roles',       [RolController::class, 'store'])  ->name('configuracion.roles.store')  ->middleware('permiso:configuracion.roles,crear');
        Route::put('/roles/{rol}',  [RolController::class, 'update']) ->name('configuracion.roles.update') ->middleware('permiso:configuracion.roles,editar');
        Route::delete('/roles/{rol}',[RolController::class,'destroy'])->name('configuracion.roles.destroy')->middleware('permiso:configuracion.roles,eliminar');

        // USUARIOS
        Route::get('/usuarios',             [UsuarioController::class, 'index'])  ->name('configuracion.usuarios.index')  ->middleware('permiso:configuracion.usuarios,ver');
        Route::post('/usuarios',            [UsuarioController::class, 'store'])  ->name('configuracion.usuarios.store')  ->middleware('permiso:configuracion.usuarios,crear');
        Route::put('/usuarios/{usuario}',   [UsuarioController::class, 'update']) ->name('configuracion.usuarios.update') ->middleware('permiso:configuracion.usuarios,editar');
        Route::delete('/usuarios/{usuario}',[UsuarioController::class, 'destroy'])->name('configuracion.usuarios.destroy')->middleware('permiso:configuracion.usuarios,eliminar');
    

        Route::get('/correlativos',                [CorrelativoController::class, 'index'])  ->name('configuracion.correlativos.index')  ->middleware('permiso:configuracion.correlativos,ver');
        Route::post('/correlativos',               [CorrelativoController::class, 'store'])  ->name('configuracion.correlativos.store')  ->middleware('permiso:configuracion.correlativos,crear');
        Route::put('/correlativos/{correlativo}',  [CorrelativoController::class, 'update']) ->name('configuracion.correlativos.update') ->middleware('permiso:configuracion.correlativos,editar');
        Route::delete('/correlativos/{correlativo}',[CorrelativoController::class,'destroy'])->name('configuracion.correlativos.destroy')->middleware('permiso:configuracion.correlativos,eliminar');
        

        Route::get('/servicios',              [ServicioController::class, 'index'])  ->name('configuracion.servicios.index')  ->middleware('permiso:configuracion.servicios,ver');
        Route::post('/servicios',             [ServicioController::class, 'store'])  ->name('configuracion.servicios.store')  ->middleware('permiso:configuracion.servicios,crear');
        Route::put('/servicios/{servicio}',   [ServicioController::class, 'update']) ->name('configuracion.servicios.update') ->middleware('permiso:configuracion.servicios,editar');
        Route::delete('/servicios/{servicio}',[ServicioController::class, 'destroy'])->name('configuracion.servicios.destroy')->middleware('permiso:configuracion.servicios,eliminar');
            

        Route::get('/etapas', [EtapaController::class, 'index'])->name('configuracion.etapas.index')->middleware('permiso:configuracion.etapas,ver');

        // Etapas
        Route::post('/etapas',              [EtapaController::class, 'storeEtapa'])  ->name('configuracion.etapas.store')   ->middleware('permiso:configuracion.etapas,crear');
        Route::put('/etapas/{etapa}',       [EtapaController::class, 'updateEtapa']) ->name('configuracion.etapas.update')  ->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/etapas/{etapa}',    [EtapaController::class, 'destroyEtapa'])->name('configuracion.etapas.destroy') ->middleware('permiso:configuracion.etapas,eliminar');

        // Actividades
        Route::post('/actividades',             [EtapaController::class, 'storeActividad'])  ->name('configuracion.actividades.store')   ->middleware('permiso:configuracion.etapas,crear');
        Route::put('/actividades/{actividad}',  [EtapaController::class, 'updateActividad']) ->name('configuracion.actividades.update')  ->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/actividades/{actividad}',[EtapaController::class,'destroyActividad'])->name('configuracion.actividades.destroy') ->middleware('permiso:configuracion.etapas,eliminar');
    });
    // Vista principal Secretaría
    Route::get('/secretaria', [SecretariaController::class, 'index'])
        ->name('secretaria.index')
        ->middleware('permiso:secretaria,ver');

    // Detalle solicitud
    Route::get('/secretaria/solicitud/{solicitud}', [SecretariaController::class, 'verSolicitud'])
        ->name('secretaria.solicitud')
        ->middleware('permiso:secretaria,ver');

    // Acciones sobre solicitudes (Secretaria General Adjunta)
    Route::post('/secretaria/solicitud/{solicitud}/admitir', [SecretariaController::class, 'admitir'])
        ->name('secretaria.admitir')
        ->middleware('permiso:secretaria,editar');

    Route::post('/secretaria/solicitud/{solicitud}/observar', [SecretariaController::class, 'observar'])
        ->name('secretaria.observar')
        ->middleware('permiso:secretaria,editar');

    Route::post('/secretaria/solicitud/{solicitud}/rechazar', [SecretariaController::class, 'rechazar'])
        ->name('secretaria.rechazar')
        ->middleware('permiso:secretaria,editar');

    // Acciones sobre expedientes (Secretario General)
    Route::post('/secretaria/expediente/{expediente}/asignar-secretario', [SecretariaController::class, 'asignarSecretario'])
        ->name('secretaria.asignarSecretario')
        ->middleware('permiso:secretaria,editar');

    Route::post('/secretaria/expediente/{expediente}/notificar-demandado', [SecretariaController::class, 'notificarDemandado'])
        ->name('secretaria.notificarDemandado')
        ->middleware('permiso:secretaria,editar');

// GET
Route::get('/expedientes', [ExpedienteArbController::class, 'index'])->name('expedientes.index');

// POST con segmentos fijos — ANTES del {expediente} wildcard
Route::post('/expedientes/solicitud/{solicitud}/admitir',  [ExpedienteArbController::class, 'admitir'])->name('expedientes.admitir');
Route::post('/expedientes/solicitud/{solicitud}/observar', [ExpedienteArbController::class, 'observar'])->name('expedientes.observar');
Route::post('/expedientes/solicitud/{solicitud}/rechazar', [ExpedienteArbController::class, 'rechazar'])->name('expedientes.rechazar');

// GET y POST con {expediente} wildcard — DESPUÉS
Route::get('/expedientes/{expediente}',                          [ExpedienteArbController::class, 'show'])->name('expedientes.show');
Route::post('/expedientes/{expediente}/asignar-secretario',      [ExpedienteArbController::class, 'asignarSecretario'])->name('expedientes.asignarSecretario');
Route::post('/expedientes/{expediente}/notificar-demandado',     [ExpedienteArbController::class, 'notificarDemandado'])->name('expedientes.notificarDemandado');
Route::post('/expedientes/{expediente}/avanzar',                 [ExpedienteArbController::class, 'avanzarActividad'])->name('expedientes.avanzar');
Route::post('/expedientes/{expediente}/designar-arbitro',        [ExpedienteArbController::class, 'designarArbitro'])->name('expedientes.designarArbitro');

});

// Mesa de Partes - SIN AUTENTICACIÓN
Route::get('/mesa-partes', [MesaPartesController::class, 'index'])->name('mesa-partes.index');
Route::post('/mesa-partes/solicitud-arbitraje', [MesaPartesController::class, 'storeSolicitudArbitraje'])->name('mesa-partes.solicitud-arbitraje');
Route::post('/mesa-partes/apersonamiento', [MesaPartesController::class, 'storeApersonamiento'])->name('mesa-partes.apersonamiento');
Route::post('/mesa-partes/compress-files', [MesaPartesController::class, 'compressFiles'])->name('mesa-partes.compress-files');

// Rutas públicas — sin auth
// Públicas — sin auth
Route::get('/solicitud',                     [SolicitudController::class, 'index'])        ->name('solicitud.index');
Route::get('/solicitud/{servicio}',          [SolicitudController::class, 'formulario'])   ->name('solicitud.formulario');
Route::post('/solicitud',                    [SolicitudController::class, 'store'])         ->name('solicitud.store');
Route::get('/solicitud/confirmacion/{numeroCargo}', [SolicitudController::class, 'confirmacion'])->name('solicitud.confirmacion');

// OTP — AJAX
Route::post('/solicitud/enviar-codigo',  [SolicitudController::class, 'enviarCodigo'])  ->name('solicitud.enviarCodigo');
Route::post('/solicitud/verificar-codigo',[SolicitudController::class, 'verificarCodigo'])->name('solicitud.verificarCodigo');

require __DIR__.'/auth.php';