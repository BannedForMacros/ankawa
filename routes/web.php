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
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpedienteController;
use App\Http\Controllers\MovimientoController;
use App\Http\Controllers\ExpedienteActorController;
use App\Http\Controllers\ExpedienteEstadoController;
use App\Http\Controllers\DocumentoController;

// Controladores de Configuración
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use App\Http\Controllers\Configuracion\CorrelativoController;
use App\Http\Controllers\Configuracion\ServicioController;
use App\Http\Controllers\Configuracion\EtapaController;
use App\Http\Controllers\Configuracion\TipoActorController;


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

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ── Perfil de Usuario ──
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ── Bandejas Iniciales (Solicitudes antes de ser Expediente) ──
    Route::get('/mesa-partes/bandeja', [MesaPartesController::class, 'bandeja'])->name('mesa-partes.bandeja');
    Route::get('/mesa-partes/mis-solicitudes', [MesaPartesController::class, 'misSolicitudes'])->name('mesa-partes.mis-solicitudes');
    Route::post('/mesa-partes/solicitud/{solicitud}/subsanar', [MesaPartesController::class, 'subsanar'])->name('mesa-partes.subsanar');
    Route::get('/mesa-partes/nueva-solicitud', [MesaPartesController::class, 'nuevaSolicitudAuth'])->name('mesa-partes.nueva-solicitud');

    // ── MOTOR DE EXPEDIENTES ──
    Route::get('/expedientes/todos', [ExpedienteController::class, 'index'])->name('expedientes.index');
    Route::get('/expedientes/mis', [ExpedienteController::class, 'misExpedientes'])->name('expedientes.mis');
    Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show'])->name('expedientes.show');

    // Movimientos
    Route::post('/expedientes/{expediente}/movimientos', [MovimientoController::class, 'store'])->name('expedientes.movimientos.store');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/responder', [MovimientoController::class, 'responder'])->name('expedientes.movimientos.responder');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/omitir', [MovimientoController::class, 'omitir'])->name('expedientes.movimientos.omitir');

    // Actores
    Route::post('/expedientes/{expediente}/actores', [ExpedienteActorController::class, 'store'])->name('expedientes.actores.store');
    Route::delete('/expedientes/{expediente}/actores/{actor}', [ExpedienteActorController::class, 'destroy'])->name('expedientes.actores.destroy');
    Route::post('/expedientes/{expediente}/gestor', [ExpedienteActorController::class, 'designarGestor'])->name('expedientes.gestor.designar');

    // Estado del expediente
    Route::post('/expedientes/{expediente}/suspender', [ExpedienteEstadoController::class, 'suspender'])->name('expedientes.suspender');
    Route::post('/expedientes/{expediente}/reactivar', [ExpedienteEstadoController::class, 'reactivar'])->name('expedientes.reactivar');
    Route::post('/expedientes/{expediente}/concluir', [ExpedienteEstadoController::class, 'concluir'])->name('expedientes.concluir');
    Route::post('/expedientes/{expediente}/cambiar-etapa', [ExpedienteEstadoController::class, 'cambiarEtapa'])->name('expedientes.cambiar-etapa');

    Route::get('/documentos/{documento}/descargar', [DocumentoController::class, 'descargar'])->name('documentos.descargar');

    // ── MÓDULO DE CONFIGURACIÓN ──
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

        // Etapas y Sub-etapas
        Route::get('/etapas', [EtapaController::class, 'index'])->name('configuracion.etapas.index')->middleware('permiso:configuracion.etapas,ver');
        Route::post('/etapas', [EtapaController::class, 'storeEtapa'])->name('configuracion.etapas.store')->middleware('permiso:configuracion.etapas,crear');
        Route::put('/etapas/{etapa}', [EtapaController::class, 'updateEtapa'])->name('configuracion.etapas.update')->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/etapas/{etapa}', [EtapaController::class, 'destroyEtapa'])->name('configuracion.etapas.destroy')->middleware('permiso:configuracion.etapas,eliminar');
        Route::post('/etapas/{etapa}/sub-etapas', [EtapaController::class, 'storeSubEtapa'])->name('configuracion.sub-etapas.store')->middleware('permiso:configuracion.etapas,crear');
        Route::put('/sub-etapas/{subEtapa}', [EtapaController::class, 'updateSubEtapa'])->name('configuracion.sub-etapas.update')->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/sub-etapas/{subEtapa}', [EtapaController::class, 'destroySubEtapa'])->name('configuracion.sub-etapas.destroy')->middleware('permiso:configuracion.etapas,eliminar');

        // Tipos de Actor
        Route::get('tipos-actor',                              [TipoActorController::class, 'index'])->name('configuracion.tipos-actor.index');
        Route::post('tipos-actor',                             [TipoActorController::class, 'store'])->name('configuracion.tipos-actor.store');
        Route::put('tipos-actor/{tipoActor}',                  [TipoActorController::class, 'update'])->name('configuracion.tipos-actor.update');
        Route::delete('tipos-actor/{tipoActor}',               [TipoActorController::class, 'destroy'])->name('configuracion.tipos-actor.destroy');
        Route::post('tipos-actor/{tipoActor}/servicios',        [TipoActorController::class, 'syncServicios'])->name('configuracion.tipos-actor.sync-servicios');
    });

});

require __DIR__.'/auth.php';
