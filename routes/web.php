<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Controladores Base
use App\Http\Controllers\WelcomeController;
use App\Http\Controllers\ProfileController;

// Controladores Públicos (Mesa de Partes)
use App\Http\Controllers\MesaPartesController;
use App\Http\Controllers\Servicios\Arbitraje\SolicitudArbitrajeController;
use App\Http\Controllers\Servicios\Otros\SolicitudOtrosController;
use App\Http\Controllers\Servicios\JPRD\SolicitudJPRDController;
use App\Http\Controllers\PortalController;

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
use App\Http\Controllers\Configuracion\TipoDocumentoController;
use App\Http\Controllers\Configuracion\ModuloController;



// =========================================================================
// 1. PÁGINA WEB PÚBLICA
// =========================================================================
Route::get('/', [WelcomeController::class, 'index'])->name('welcome');

// =========================================================================
// 2. MESA DE PARTES / PORTAL UNIFICADO
// =========================================================================

// ── Públicas (sin auth) ──
Route::get('/mesa-partes', [MesaPartesController::class, 'index'])->name('mesa-partes.index');
Route::get('/mesa-partes/confirmacion/{numeroCargo}', [MesaPartesController::class, 'confirmacion'])->name('mesa-partes.confirmacion');

// OTP unificado (acepta cualquier email)
Route::post('/mesa-partes/enviar-codigo', [PortalController::class, 'enviarCodigo'])->name('mesa-partes.enviarCodigo');
Route::post('/mesa-partes/verificar-codigo', [PortalController::class, 'verificarCodigo'])->name('mesa-partes.verificarCodigo');

// Submit de formularios (sin auth requerida, el portal_email se verifica en el controller)
Route::post('/mesa-partes/servicios/arbitraje', [SolicitudArbitrajeController::class, 'store'])->name('solicitud.arbitraje.store');
Route::post('/mesa-partes/servicios/otros', [SolicitudOtrosController::class, 'store'])->name('solicitud.otros.store');
Route::post('/mesa-partes/servicios/jprd', [SolicitudJPRDController::class, 'store'])->name('solicitud.jprd.store');

// Consulta de documentos (proxy Decolecta — público, sin auth)
Route::get('/consulta-documento', [\App\Http\Controllers\ConsultaDocumentoController::class, 'consultar'])->name('consulta.documento');
Route::get('/mesa-partes/servicios/{servicio}/tipos-documento', function (\App\Models\Servicio $servicio) {
    $tipos = $servicio->tiposDocumento()
        ->where('tipo_documentos.activo', true)
        ->wherePivot('es_para_solicitud', true)
        ->get(['tipo_documentos.id', 'tipo_documentos.nombre']);
    return response()->json($tipos);
})->name('servicios.tipos-documento');

// ── Protegidas por OTP session (portal.auth) ──
Route::middleware('portal.auth')->group(function () {
    Route::get('/mesa-partes/inicio', [PortalController::class, 'dashboard'])->name('mesa-partes.inicio');
    Route::get('/mesa-partes/solicitud/{slug}', [MesaPartesController::class, 'formularioPorSlug'])->name('mesa-partes.solicitud');
    Route::get('/mesa-partes/logout', [PortalController::class, 'logout'])->name('mesa-partes.logout');
    Route::post('/mesa-partes/movimientos/{movimiento}/responder', [PortalController::class, 'responder'])->name('mesa-partes.responder');
});


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
    Route::get('/expedientes', [ExpedienteController::class, 'index'])->name('expedientes.index');
    Route::get('/expedientes/{expediente}', [ExpedienteController::class, 'show'])->name('expedientes.show');

    // Movimientos
    Route::post('/expedientes/{expediente}/movimientos', [MovimientoController::class, 'store'])->name('expedientes.movimientos.store');
    Route::post('/expedientes/{expediente}/movimientos/lote', [MovimientoController::class, 'storeLote'])->name('expedientes.movimientos.lote');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/responder', [MovimientoController::class, 'responder'])->name('expedientes.movimientos.responder');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/responder-y-crear', [MovimientoController::class, 'responderYCrear'])->name('expedientes.movimientos.responder-y-crear');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/resolver', [MovimientoController::class, 'resolver'])->name('expedientes.movimientos.resolver');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/extender-plazo', [MovimientoController::class, 'extenderPlazo'])->name('expedientes.movimientos.extender-plazo');

    // Solicitud del expediente (actualizar datos)
    Route::put('/expedientes/{expediente}/solicitud', [ExpedienteController::class, 'updateSolicitud'])->name('expedientes.solicitud.update');
    // Conformidad de la solicitud
    Route::post('/expedientes/{expediente}/conformidad', [ExpedienteController::class, 'registrarConformidad'])->name('expedientes.conformidad');

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

        // Módulos
        Route::get('modulos',              [ModuloController::class, 'index'])  ->name('configuracion.modulos.index')  ->middleware('permiso:configuracion.modulos,ver');
        Route::post('modulos',             [ModuloController::class, 'store'])  ->name('configuracion.modulos.store')  ->middleware('permiso:configuracion.modulos,crear');
        Route::put('modulos/{modulo}',     [ModuloController::class, 'update']) ->name('configuracion.modulos.update') ->middleware('permiso:configuracion.modulos,editar');
        Route::delete('modulos/{modulo}',  [ModuloController::class, 'destroy'])->name('configuracion.modulos.destroy')->middleware('permiso:configuracion.modulos,eliminar');

        // Tipos de Documento
        Route::get('tipos-documentos',                                    [TipoDocumentoController::class, 'index'])         ->name('configuracion.tipos-documentos.index')         ->middleware('permiso:configuracion.tipos-documentos,ver');
        Route::post('tipos-documentos',                                   [TipoDocumentoController::class, 'store'])          ->name('configuracion.tipos-documentos.store')         ->middleware('permiso:configuracion.tipos-documentos,crear');
        Route::put('tipos-documentos/{tipoDocumento}',                    [TipoDocumentoController::class, 'update'])         ->name('configuracion.tipos-documentos.update')        ->middleware('permiso:configuracion.tipos-documentos,editar');
        Route::delete('tipos-documentos/{tipoDocumento}',                 [TipoDocumentoController::class, 'destroy'])        ->name('configuracion.tipos-documentos.destroy')       ->middleware('permiso:configuracion.tipos-documentos,eliminar');
        Route::post('tipos-documentos/{tipoDocumento}/servicios',         [TipoDocumentoController::class, 'syncServicios'])  ->name('configuracion.tipos-documentos.sync-servicios')->middleware('permiso:configuracion.tipos-documentos,editar');
        Route::post('tipos-documentos/{tipoDocumento}/actores',           [TipoDocumentoController::class, 'syncActores'])    ->name('configuracion.tipos-documentos.sync-actores')  ->middleware('permiso:configuracion.tipos-documentos,editar');
    });

});

// =========================================================================
// 4. PORTAL EXTERNO (Actores externos — autenticación OTP sin cuenta)
// =========================================================================
Route::prefix('portal')->name('portal.')->group(function () {
    Route::get('/',                    [PortalController::class, 'index'])        ->name('login');
    Route::post('/enviar-codigo',      [PortalController::class, 'enviarCodigo']) ->name('enviar-codigo');
    Route::post('/verificar-codigo',   [PortalController::class, 'verificarCodigo'])->name('verificar-codigo');
    Route::get('/logout',              [PortalController::class, 'logout'])       ->name('logout');

    Route::middleware('portal.auth')->group(function () {
        Route::get('/mis-expedientes',                      [PortalController::class, 'misExpedientes'])->name('expedientes');
        Route::post('/movimientos/{movimiento}/responder',  [PortalController::class, 'responder'])     ->name('responder');
    });
});

require __DIR__.'/auth.php';
