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
use App\Http\Controllers\EnvioExternoController;

// Controladores de Configuración
use App\Http\Controllers\Configuracion\RolController;
use App\Http\Controllers\Configuracion\UsuarioController;
use App\Http\Controllers\Configuracion\CorrelativoController;
use App\Http\Controllers\Configuracion\ServicioController;
use App\Http\Controllers\Configuracion\EtapaController;
use App\Http\Controllers\Configuracion\TipoActorController;
use App\Http\Controllers\Configuracion\TipoDocumentoController;
use App\Http\Controllers\Configuracion\TipoEventoCargoController;
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

// OTP unificado — flujo verificado: email + DNI/RUC + dígito verificador + captcha
Route::post('/mesa-partes/enviar-codigo', [PortalController::class, 'enviarCodigo'])
    ->middleware('throttle:portal-otp-enviar')
    ->name('mesa-partes.enviarCodigo');
Route::post('/mesa-partes/verificar-codigo', [PortalController::class, 'verificarCodigo'])
    ->middleware('throttle:portal-otp-verificar')
    ->name('mesa-partes.verificarCodigo');

// Submit de formularios (sin auth requerida, el portal_email se verifica en el controller)
Route::post('/mesa-partes/servicios/arbitraje', [SolicitudArbitrajeController::class, 'store'])
    ->middleware('throttle:portal-form-submit')
    ->name('solicitud.arbitraje.store');
Route::post('/mesa-partes/servicios/otros', [SolicitudOtrosController::class, 'store'])
    ->middleware('throttle:portal-form-submit')
    ->name('solicitud.otros.store');
Route::post('/mesa-partes/servicios/jprd', [SolicitudJPRDController::class, 'store'])
    ->middleware('throttle:portal-form-submit')
    ->name('solicitud.jprd.store');

// Consulta de documentos (proxy Decolecta — público, sin auth)
Route::get('/consulta-documento', [\App\Http\Controllers\ConsultaDocumentoController::class, 'consultar'])
    ->middleware('throttle:consulta-documento')
    ->name('consulta.documento');
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
    Route::post('/mesa-partes/expedientes/{expediente}/aceptar-conocimiento', [PortalController::class, 'aceptarConocimiento'])->name('mesa-partes.aceptarConocimiento');

    // Envíos espontáneos del externo al expediente
    Route::get('/mesa-partes/expedientes/{expediente}/tipos-documento-envio', [PortalController::class, 'tiposDocumentoEnvio'])->name('mesa-partes.tipos-documento-envio');
    Route::post('/mesa-partes/expedientes/{expediente}/envios', [PortalController::class, 'enviarDocumento'])->name('mesa-partes.envios.store');

    // Autorización de canales privados del portal (WebSocket / Reverb)
    Route::post('/mesa-partes/broadcasting/auth', \App\Http\Controllers\PortalBroadcastAuthController::class)
        ->name('portal.broadcasting.auth');
});


// =========================================================================
// 3. RUTAS PROTEGIDAS (Requieren Login)
// =========================================================================
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // ── Notificaciones (campana, staff interno) ──
    Route::get('/notificaciones', [\App\Http\Controllers\NotificacionController::class, 'index'])->name('notificaciones.index');
    Route::post('/notificaciones/{id}/leida', [\App\Http\Controllers\NotificacionController::class, 'marcarLeida'])->name('notificaciones.leida');
    Route::post('/notificaciones/leer-todas', [\App\Http\Controllers\NotificacionController::class, 'marcarTodasLeidas'])->name('notificaciones.leerTodas');

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
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/resolver', [MovimientoController::class, 'resolver'])->name('expedientes.movimientos.resolver');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/cancelar-auto', [MovimientoController::class, 'cancelarAuto'])->name('expedientes.movimientos.cancelar-auto');
    Route::post('/expedientes/{expediente}/movimientos/{movimiento}/extender-plazo', [MovimientoController::class, 'extenderPlazo'])->name('expedientes.movimientos.extender-plazo');

    // Envíos espontáneos del usuario externo (lado interno: aceptar/rechazar)
    Route::get('/expedientes/{expediente}/envios', [EnvioExternoController::class, 'index'])->name('expedientes.envios.index');
    Route::post('/expedientes/{expediente}/envios/{movimiento}/aceptar', [EnvioExternoController::class, 'aceptar'])->name('expedientes.envios.aceptar');
    Route::post('/expedientes/{expediente}/envios/{movimiento}/rechazar', [EnvioExternoController::class, 'rechazar'])->name('expedientes.envios.rechazar');

    // Solicitud del expediente (actualizar datos)
    Route::put('/expedientes/{expediente}/solicitud', [ExpedienteController::class, 'updateSolicitud'])->name('expedientes.solicitud.update');
    // Conformidad de la solicitud
    Route::post('/expedientes/{expediente}/conformidad', [ExpedienteController::class, 'registrarConformidad'])->name('expedientes.conformidad');

    // Actores
    Route::post('/expedientes/{expediente}/actores', [ExpedienteActorController::class, 'store'])->name('expedientes.actores.store');
    Route::delete('/expedientes/{expediente}/actores/{actor}', [ExpedienteActorController::class, 'destroy'])->name('expedientes.actores.destroy');
    Route::post('/expedientes/{expediente}/gestor', [ExpedienteActorController::class, 'designarGestor'])->name('expedientes.gestor.designar');

    // Emails adicionales de actor
    Route::post('/expedientes/{expediente}/actores/{actor}/emails', [ExpedienteActorController::class, 'storeEmail'])->name('expedientes.actores.emails.store');
    Route::delete('/expedientes/{expediente}/actores/{actor}/emails/{emailId}', [ExpedienteActorController::class, 'destroyEmail'])->name('expedientes.actores.emails.destroy');
    Route::patch('/expedientes/{expediente}/actores/{actor}/acceso', [ExpedienteActorController::class, 'toggleAcceso'])->name('expedientes.actores.acceso');

    // Corrección de correo principal del actor + validación manual del gestor
    Route::put('/expedientes/{expediente}/actores/{actor}/email-principal', [ExpedienteActorController::class, 'actualizarEmailPrincipal'])->name('expedientes.actores.email-principal.update');
    Route::post('/expedientes/{expediente}/actores/{actor}/validar', [ExpedienteActorController::class, 'validar'])->name('expedientes.actores.validar');
    Route::delete('/expedientes/{expediente}/actores/{actor}/validar', [ExpedienteActorController::class, 'invalidar'])->name('expedientes.actores.invalidar');

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
        Route::patch('/roles/{rol}/reactivar',[RolController::class,'reactivar'])->name('configuracion.roles.reactivar')->middleware('permiso:configuracion.roles,editar');
        Route::post('/roles/{rol}/permisos',[RolController::class,'syncPermisos'])->name('configuracion.roles.permisos')->middleware('permiso:configuracion.roles,editar');

        // USUARIOS
        Route::get('/usuarios',             [UsuarioController::class, 'index'])  ->name('configuracion.usuarios.index')  ->middleware('permiso:configuracion.usuarios,ver');
        Route::post('/usuarios',            [UsuarioController::class, 'store'])  ->name('configuracion.usuarios.store')  ->middleware('permiso:configuracion.usuarios,crear');
        Route::put('/usuarios/{usuario}',   [UsuarioController::class, 'update']) ->name('configuracion.usuarios.update') ->middleware('permiso:configuracion.usuarios,editar');
        Route::delete('/usuarios/{usuario}',[UsuarioController::class, 'destroy'])->name('configuracion.usuarios.destroy')->middleware('permiso:configuracion.usuarios,eliminar');
        Route::patch('/usuarios/{usuario}/reactivar',[UsuarioController::class, 'reactivar'])->name('configuracion.usuarios.reactivar')->middleware('permiso:configuracion.usuarios,editar');

        Route::get('/correlativos',                [CorrelativoController::class, 'index'])  ->name('configuracion.correlativos.index')  ->middleware('permiso:configuracion.correlativos,ver');
        Route::post('/correlativos',               [CorrelativoController::class, 'store'])  ->name('configuracion.correlativos.store')  ->middleware('permiso:configuracion.correlativos,crear');
        Route::put('/correlativos/{correlativo}',  [CorrelativoController::class, 'update']) ->name('configuracion.correlativos.update') ->middleware('permiso:configuracion.correlativos,editar');
        Route::delete('/correlativos/{correlativo}',[CorrelativoController::class,'destroy'])->name('configuracion.correlativos.destroy')->middleware('permiso:configuracion.correlativos,eliminar');
        Route::patch('/correlativos/{correlativo}/reactivar',[CorrelativoController::class,'reactivar'])->name('configuracion.correlativos.reactivar')->middleware('permiso:configuracion.correlativos,editar');

        Route::get('/servicios',               [ServicioController::class, 'index'])  ->name('configuracion.servicios.index')  ->middleware('permiso:configuracion.servicios,ver');
        Route::post('/servicios',              [ServicioController::class, 'store'])  ->name('configuracion.servicios.store')  ->middleware('permiso:configuracion.servicios,crear');
        Route::put('/servicios/{servicio}',    [ServicioController::class, 'update']) ->name('configuracion.servicios.update') ->middleware('permiso:configuracion.servicios,editar');
        Route::delete('/servicios/{servicio}', [ServicioController::class, 'destroy'])->name('configuracion.servicios.destroy')->middleware('permiso:configuracion.servicios,eliminar');
        Route::patch('/servicios/{servicio}/reactivar', [ServicioController::class, 'reactivar'])->name('configuracion.servicios.reactivar')->middleware('permiso:configuracion.servicios,editar');

        // Etapas
        Route::get('/etapas', [EtapaController::class, 'index'])->name('configuracion.etapas.index')->middleware('permiso:configuracion.etapas,ver');
        Route::post('/etapas', [EtapaController::class, 'storeEtapa'])->name('configuracion.etapas.store')->middleware('permiso:configuracion.etapas,crear');
        Route::put('/etapas/{etapa}', [EtapaController::class, 'updateEtapa'])->name('configuracion.etapas.update')->middleware('permiso:configuracion.etapas,editar');
        Route::delete('/etapas/{etapa}', [EtapaController::class, 'destroyEtapa'])->name('configuracion.etapas.destroy')->middleware('permiso:configuracion.etapas,eliminar');
        Route::patch('/etapas/{etapa}/reactivar', [EtapaController::class, 'reactivarEtapa'])->name('configuracion.etapas.reactivar')->middleware('permiso:configuracion.etapas,editar');

        // Tipos de Actor
        Route::get('tipos-actor',                              [TipoActorController::class, 'index'])->name('configuracion.tipos-actor.index')->middleware('permiso:configuracion.tipos-actor,ver');
        Route::post('tipos-actor',                             [TipoActorController::class, 'store'])->name('configuracion.tipos-actor.store')->middleware('permiso:configuracion.tipos-actor,crear');
        Route::put('tipos-actor/{tipoActor}',                  [TipoActorController::class, 'update'])->name('configuracion.tipos-actor.update')->middleware('permiso:configuracion.tipos-actor,editar');
        Route::delete('tipos-actor/{tipoActor}',               [TipoActorController::class, 'destroy'])->name('configuracion.tipos-actor.destroy')->middleware('permiso:configuracion.tipos-actor,eliminar');
        Route::patch('tipos-actor/{tipoActor}/reactivar',      [TipoActorController::class, 'reactivar'])->name('configuracion.tipos-actor.reactivar')->middleware('permiso:configuracion.tipos-actor,editar');
        Route::post('tipos-actor/{tipoActor}/servicios',        [TipoActorController::class, 'syncServicios'])->name('configuracion.tipos-actor.sync-servicios')->middleware('permiso:configuracion.tipos-actor,editar');

        // Módulos
        Route::get('modulos',              [ModuloController::class, 'index'])  ->name('configuracion.modulos.index')  ->middleware('permiso:configuracion.modulos,ver');
        Route::post('modulos',             [ModuloController::class, 'store'])  ->name('configuracion.modulos.store')  ->middleware('permiso:configuracion.modulos,crear');
        Route::put('modulos/{modulo}',     [ModuloController::class, 'update']) ->name('configuracion.modulos.update') ->middleware('permiso:configuracion.modulos,editar');
        Route::delete('modulos/{modulo}',  [ModuloController::class, 'destroy'])->name('configuracion.modulos.destroy')->middleware('permiso:configuracion.modulos,eliminar');

        // Tipos de Cargo (catálogo de eventos que emiten correlativo CARGO)
        Route::get('tipos-evento-cargo',                                  [TipoEventoCargoController::class, 'index'])        ->name('configuracion.tipos-evento-cargo.index')       ->middleware('permiso:configuracion.tipos-evento-cargo,ver');
        Route::put('tipos-evento-cargo/{tipoEventoCargo}',                [TipoEventoCargoController::class, 'update'])       ->name('configuracion.tipos-evento-cargo.update')      ->middleware('permiso:configuracion.tipos-evento-cargo,editar');

        // Tipos de Documento
        Route::get('tipos-documentos',                                    [TipoDocumentoController::class, 'index'])         ->name('configuracion.tipos-documentos.index')         ->middleware('permiso:configuracion.tipos-documentos,ver');
        Route::post('tipos-documentos',                                   [TipoDocumentoController::class, 'store'])          ->name('configuracion.tipos-documentos.store')         ->middleware('permiso:configuracion.tipos-documentos,crear');
        Route::put('tipos-documentos/{tipoDocumento}',                    [TipoDocumentoController::class, 'update'])         ->name('configuracion.tipos-documentos.update')        ->middleware('permiso:configuracion.tipos-documentos,editar');
        Route::delete('tipos-documentos/{tipoDocumento}',                 [TipoDocumentoController::class, 'destroy'])        ->name('configuracion.tipos-documentos.destroy')       ->middleware('permiso:configuracion.tipos-documentos,eliminar');
        Route::patch('tipos-documentos/{tipoDocumento}/reactivar',        [TipoDocumentoController::class, 'reactivar'])      ->name('configuracion.tipos-documentos.reactivar')     ->middleware('permiso:configuracion.tipos-documentos,editar');
        Route::post('tipos-documentos/{tipoDocumento}/servicios',         [TipoDocumentoController::class, 'syncServicios'])  ->name('configuracion.tipos-documentos.sync-servicios')->middleware('permiso:configuracion.tipos-documentos,editar');
        Route::post('tipos-documentos/{tipoDocumento}/actores',           [TipoDocumentoController::class, 'syncActores'])    ->name('configuracion.tipos-documentos.sync-actores')  ->middleware('permiso:configuracion.tipos-documentos,editar');
    });

    // ── Auditoría del Portal Público (acceso interno) ──
    // Una vez creado el módulo `auditoria.portal` en `modules` y asignado el permiso `ver`
    // al rol correspondiente, agregar `->middleware('permiso:auditoria.portal,ver')`.
    Route::get('/auditoria/portal',                       [\App\Http\Controllers\Admin\AuditoriaPortalController::class, 'index'])
        ->name('auditoria.portal.index');
    Route::get('/auditoria/portal/cargo/{numeroCargo}',   [\App\Http\Controllers\Admin\AuditoriaPortalController::class, 'porCargo'])
        ->name('auditoria.portal.por-cargo');
});

// =========================================================================
// 4. PORTAL EXTERNO (Actores externos — autenticación OTP sin cuenta)
// =========================================================================
Route::prefix('portal')->name('portal.')->group(function () {
    Route::get('/',                    [PortalController::class, 'index'])        ->name('login');
    Route::post('/enviar-codigo',      [PortalController::class, 'enviarCodigo'])
        ->middleware('throttle:portal-otp-enviar')
        ->name('enviar-codigo');
    Route::post('/verificar-codigo',   [PortalController::class, 'verificarCodigo'])
        ->middleware('throttle:portal-otp-verificar')
        ->name('verificar-codigo');
    Route::get('/logout',              [PortalController::class, 'logout'])       ->name('logout');

    Route::middleware('portal.auth')->group(function () {
        Route::get('/mis-expedientes',                      [PortalController::class, 'misExpedientes'])->name('expedientes');
        Route::post('/movimientos/{movimiento}/responder',  [PortalController::class, 'responder'])     ->name('responder');
    });
});

require __DIR__.'/auth.php';
