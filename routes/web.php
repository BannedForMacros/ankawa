<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controladores Base
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\ProfileController;

// Controladores Públicos (Mesa de Partes)
use App\Http\Controllers\MesaPartesController;
use App\Http\Controllers\Servicios\Arbitraje\SolicitudArbitrajeController;

// Controladores Internos
use App\Http\Controllers\ExpedienteController;

// Controladores de Configuración (Mantuvimos los tuyos intactos)
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use App\Http\Controllers\Configuracion\CorrelativoController;
use App\Http\Controllers\Configuracion\ServicioController;
use App\Http\Controllers\Configuracion\EtapaController;
use App\Http\Controllers\Configuracion\TipoActorController;
use App\Http\Controllers\Configuracion\AccionFlujoController;


// =========================================================================
// 1. PÁGINA WEB PÚBLICA
// =========================================================================
Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// =========================================================================
// 2. MESA DE PARTES VIRTUAL (Público - Sin Auth)
// =========================================================================
Route::get('/mesa-partes', [MesaPartesController::class, 'index'])->name('mesa-partes.index');
Route::get('/mesa-partes/confirmacion/{numeroCargo}', [MesaPartesController::class, 'confirmacion'])->name('mesa-partes.confirmacion');

// OTP (Autenticación para firmas/formularios)
Route::post('/mesa-partes/enviar-codigo', [MesaPartesController::class, 'enviarCodigo'])->name('mesa-partes.enviarCodigo');
Route::post('/mesa-partes/verificar-codigo', [MesaPartesController::class, 'verificarCodigo'])->name('mesa-partes.verificarCodigo');

// Recepción de solicitudes por servicio (Paso final del formulario público)
Route::post('/mesa-partes/servicios/arbitraje', [SolicitudArbitrajeController::class, 'store'])->name('solicitud.arbitraje.store');


// =========================================================================
// 3. RUTAS PROTEGIDAS (Requieren Login)
// =========================================================================
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    // ── Perfil de Usuario ──
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── Bandejas Iniciales (Solicitudes antes de ser Expediente) ──
    // Vista de la Secretaria (Para revisar y admitir)
    Route::get('/mesa-partes/bandeja', [MesaPartesController::class, 'bandeja'])->name('mesa-partes.bandeja');
    // Vista del Cliente
    Route::get('/mesa-partes/mis-solicitudes', [MesaPartesController::class, 'misSolicitudes'])->name('mesa-partes.mis-solicitudes');
    Route::post('/mesa-partes/solicitud/{solicitud}/subsanar', [MesaPartesController::class, 'subsanar'])->name('mesa-partes.subsanar');
    Route::get('/mesa-partes/nueva-solicitud', [MesaPartesController::class, 'nuevaSolicitudAuth'])->name('mesa-partes.nueva-solicitud');

    // ── EL MOTOR DE EXPEDIENTES (Nuevo Cerebro) ──
    Route::get('/expedientes', [ExpedienteController::class, 'index'])->name('expedientes.index');
    
    // El puente vital: De Solicitud a Expediente
    Route::post('/expedientes/admitir/{solicitud}', [ExpedienteController::class, 'admitir'])->name('expedientes.admitir');
    
    // Visor dinámico y motor de ejecución de botones
    Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show'])->name('expedientes.show');
    Route::post('/expedientes/{expediente}/accion', [ExpedienteController::class, 'registrarAccion'])->name('expedientes.accion');


    // ── MÓDULO DE CONFIGURACIÓN (Intacto) ──
    Route::prefix('configuracion')->middleware([])->group(function () {

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
        
        Route::get('/servicios',               [ServicioController::class, 'index'])  ->name('configuracion.servicios.index')  ->middleware('permiso:configuracion.servicios,ver');
        Route::post('/servicios',              [ServicioController::class, 'store'])  ->name('configuracion.servicios.store')  ->middleware('permiso:configuracion.servicios,crear');
        Route::put('/servicios/{servicio}',    [ServicioController::class, 'update']) ->name('configuracion.servicios.update') ->middleware('permiso:configuracion.servicios,editar');
        Route::delete('/servicios/{servicio}', [ServicioController::class, 'destroy'])->name('configuracion.servicios.destroy')->middleware('permiso:configuracion.servicios,eliminar');
            
        Route::get('/etapas', [EtapaController::class, 'index'])->name('configuracion.etapas.index')->middleware('permiso:configuracion.etapas,ver');

        // Etapas
        Route::post('/etapas',              [EtapaController::class, 'storeEtapa'])  ->name('configuracion.etapas.store')   ->middleware('permiso:configuracion.etapas,crear');
        Route::put('/etapas/{etapa}',       [EtapaController::class, 'updateEtapa']) ->name('configuracion.etapas.update')  ->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/etapas/{etapa}',    [EtapaController::class, 'destroyEtapa'])->name('configuracion.etapas.destroy') ->middleware('permiso:configuracion.etapas,eliminar');

        // Actividades
        Route::post('/actividades',              [EtapaController::class, 'storeActividad'])  ->name('configuracion.actividades.store')   ->middleware('permiso:configuracion.etapas,crear');
        Route::put('/actividades/{actividad}',   [EtapaController::class, 'updateActividad']) ->name('configuracion.actividades.update')  ->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/actividades/{actividad}',[EtapaController::class,'destroyActividad'])->name('configuracion.actividades.destroy') ->middleware('permiso:configuracion.etapas,eliminar');
        
        // Transiciones
        Route::post('/actividades/{actividad}/transiciones', [EtapaController::class, 'storeTransicion'])->name('transiciones.store');
        Route::put('/transiciones/{transicion}',             [EtapaController::class, 'updateTransicion'])->name('transiciones.update');
        Route::delete('/transiciones/{transicion}',          [EtapaController::class, 'destroyTransicion'])->name('transiciones.destroy');
        
        // Tipos de Actor
        Route::get('tipos-actor',                 [TipoActorController::class, 'index'])->name('configuracion.tipos-actor.index');
        Route::post('tipos-actor',                [TipoActorController::class, 'store'])->name('configuracion.tipos-actor.store');
        Route::put('tipos-actor/{tipoActor}',     [TipoActorController::class, 'update'])->name('configuracion.tipos-actor.update');
        Route::delete('tipos-actor/{tipoActor}',  [TipoActorController::class, 'destroy'])->name('configuracion.tipos-actor.destroy');

        // Acciones de Flujo
        Route::get('acciones',              [AccionFlujoController::class, 'index'])->name('configuracion.acciones.index');
        Route::post('acciones',             [AccionFlujoController::class, 'store'])->name('configuracion.acciones.store');
        Route::put('acciones/{accion}',     [AccionFlujoController::class, 'update'])->name('configuracion.acciones.update');
        Route::delete('acciones/{accion}',  [AccionFlujoController::class, 'destroy'])->name('configuracion.acciones.destroy');
    });

});

require __DIR__.'/auth.php';