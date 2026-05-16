<?php
/**
 * End-to-end test de Entrega A (tipos opcionales) + Entrega B (cancelación auto).
 *
 * Recorre el mismo código que dispararía un POST real desde el navegador:
 *   - MovimientoController::store           (gestor crea requerimiento)
 *   - PortalController::responder           (demandado responde, skip opcional)
 *   - MovimientoController::cancelarAuto    (gestor cancela auto-mov)
 *
 * Bypassa solo:
 *   - El captcha hCaptcha del flujo de login Mesa de Partes
 *   - El OTP de verificación (irrelevante para el feature)
 *   - El middleware CSRF (la ruta está dentro del web group)
 *
 * Deja la BD lista para que abras la UI y veas el resultado.
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Expediente;
use App\Models\ExpedienteMovimiento;
use App\Models\MovimientoResponsable;
use App\Models\MovimientoTrasladoAuto;
use App\Models\MovimientoTrasladoAutoDisparo;

/* ───────────────────────── Helpers ───────────────────────── */
function paso(string $titulo): void { echo PHP_EOL."═══ ".$titulo." ═══".PHP_EOL; }
function ok(string $m): void { echo "  ✓ $m".PHP_EOL; }
function info(string $m): void { echo "  · $m".PHP_EOL; }
function falla(string $m): void { echo "  ✗ $m".PHP_EOL; exit(1); }

function archivoTemporal(string $nombre): UploadedFile {
    // Genera un PNG real chiquito para pasar la validación MIME del backend.
    $path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $nombre . '.png';
    $im = imagecreate(20, 20);
    imagecolorallocate($im, 240, 240, 240);
    $rojo = imagecolorallocate($im, 190, 15, 74);
    imagestring($im, 1, 2, 6, substr($nombre, 0, 3), $rojo);
    imagepng($im, $path);
    imagedestroy($im);
    return new UploadedFile($path, $nombre . '.png', 'image/png', null, true);
}

/* ───────────────────────── Limpieza previa (idempotencia) ───────────────────────── */
paso('Limpieza · borrar movimientos previos del expediente #1');
\DB::transaction(function () {
    // Borrar TODO el rastro de movimientos del expediente #1 (CASCADE limpia children).
    \DB::statement('DELETE FROM movimiento_traslados_auto_disparos WHERE traslado_auto_id IN (SELECT id FROM movimiento_traslados_auto WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id = 1))');
    \DB::statement('DELETE FROM movimiento_traslados_auto WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id = 1)');
    \DB::statement('DELETE FROM movimiento_documentos WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id = 1)');
    \DB::statement('DELETE FROM movimiento_responsables WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id = 1)');
    \DB::statement('DELETE FROM movimiento_notificaciones WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id = 1)');
    \DB::statement('DELETE FROM expediente_movimientos WHERE expediente_id = 1');
});
ok('Datos previos del expediente #1 limpiados');

/* ───────────────────────── Verificación inicial ───────────────────────── */
paso('Estado inicial');
$expediente = Expediente::find(1);
if (!$expediente) falla('No existe el expediente #1');
ok("Expediente {$expediente->numero_expediente} (id={$expediente->id}, etapa={$expediente->etapa_actual_id})");

$demandado = \App\Models\ExpedienteActor::where('expediente_id', 1)
    ->where('tipo_actor_id', 2)->where('activo', 1)->first();
$demandante = \App\Models\ExpedienteActor::where('expediente_id', 1)
    ->where('tipo_actor_id', 1)->where('activo', 1)->first();
$gestorActor = \App\Models\ExpedienteActor::where('expediente_id', 1)
    ->where('es_gestor', true)->where('activo', 1)->first();

info("Demandante actor_id={$demandante->id} (usuario {$demandante->usuario_id})");
info("Demandado actor_id={$demandado->id} (externo {$demandado->email_externo})");
info("Gestor actor_id={$gestorActor->id} (usuario {$gestorActor->usuario_id})");

// Buscar tipos de documento permitidos para este servicio.
$tipos = DB::table('tipo_documentos as td')
    ->join('servicio_tipo_documento as std', 'std.tipo_documento_id', '=', 'td.id')
    ->where('std.servicio_id', 1)
    ->where('td.activo', true)
    ->orderBy('td.nombre')
    ->limit(4)
    ->get(['td.id','td.nombre']);
if ($tipos->count() < 2) falla('Necesitamos al menos 2 tipos de documento del servicio Arbitraje');
$tipoActa     = $tipos[0];
$tipoReconv   = $tipos[1];
$tipoContest  = $tipos->count() > 2 ? $tipos[2] : $tipoActa;  // para auto-requerimiento
info("Tipo REQUERIDO: '{$tipoActa->nombre}' (id={$tipoActa->id})");
info("Tipo OPCIONAL:  '{$tipoReconv->nombre}' (id={$tipoReconv->id})");
info("Tipo AUTO-REQ:  '{$tipoContest->nombre}' (id={$tipoContest->id})");

/* ───────────────────────── FASE 1: Gestor crea movimiento ───────────────────────── */
paso('FASE 1 · Gestor crea movimiento con 1 requerido + 1 opcional con traslado auto');

Auth::loginUsingId($gestorActor->usuario_id);
ok("Login como gestor (user id={$gestorActor->usuario_id} - card.secretario03)");

// Construir el payload tal como lo manda el frontend
$payload = [
    'tipo'        => 'requerimiento',
    'etapa_id'    => (string) $expediente->etapa_actual_id,
    'instruccion' => 'Conteste la demanda, opcionalmente puede presentar reconvención.',
    'requerimientos' => [
        // Bloque 1: Tipo REQUERIDO (Acta) para Demandado, 10 días
        [
            'tipo_documento_id' => (string) $tipoActa->id,
            'responsables' => [[
                'actor_ids'  => [(string) $demandado->id],
                'dias_plazo' => '10',
                'tipo_dias'  => 'calendario',
                'es_opcional' => '0',
            ]],
        ],
        // Bloque 2: Tipo OPCIONAL (Reconvención) con auto-traslado configurado
        [
            'tipo_documento_id' => (string) $tipoReconv->id,
            'responsables' => [[
                'actor_ids'  => [(string) $demandado->id],
                'dias_plazo' => '10',
                'tipo_dias'  => 'calendario',
                'es_opcional' => '1',
            ]],
            'traslado_auto' => [
                'sumilla' => 'Se corre traslado de la reconvención presentada por el demandado. Conteste en 20 días calendario.',
                'disparadores_actor_ids'  => [(string) $demandado->id],
                'destinatarios_actor_ids' => [(string) $demandante->id],
                'genera_requerimiento_auto' => '1',
                'requerimiento_auto_config' => [
                    'tipo_documento_id'     => (string) $tipoContest->id,
                    'dias_plazo'            => '20',
                    'tipo_dias'             => 'calendario',
                    'responsable_actor_id'  => (string) $demandante->id,
                ],
            ],
        ],
    ],
];

$req = Request::create("/expedientes/{$expediente->id}/movimientos", 'POST', $payload);
$req->setLaravelSession(app('session.store'));

$respuesta = app(\App\Http\Controllers\MovimientoController::class)->store($req, $expediente);
ok("MovimientoController::store ejecutado → status " . (method_exists($respuesta, 'getStatusCode') ? $respuesta->getStatusCode() : 'redirect'));

// Verificar lo que quedó en BD
$movCreado = ExpedienteMovimiento::where('expediente_id', 1)->orderByDesc('id')->first();
ok("Movimiento creado id={$movCreado->id} tipo={$movCreado->tipo} estado={$movCreado->estado}");

$resps = MovimientoResponsable::where('movimiento_id', $movCreado->id)
    ->with('tipoDocumento:id,nombre')->get();
foreach ($resps as $r) {
    info("  Responsable: tipo={$r->tipoDocumento->nombre} actor_id={$r->expediente_actor_id} plazo={$r->dias_plazo}d opcional=" . ($r->es_opcional ? 'SÍ' : 'no') . " estado={$r->estado}");
}

$trasAuto = MovimientoTrasladoAuto::where('movimiento_id', $movCreado->id)->first();
if (!$trasAuto) falla('No se persistió el traslado automático');
ok("Traslado automático persistido id={$trasAuto->id} tipo_doc={$trasAuto->tipo_documento_id} genera_req=" . ($trasAuto->genera_requerimiento_auto ? 'SÍ' : 'no'));

/* ───────────────────────── FASE 2: Demandado responde solo el requerido (omite opcional) ───────────────────────── */
paso('FASE 2 · Demandado responde SOLO el requerido (omite la reconvención opcional)');

Auth::logout();
// Bypass del OTP: setear portal_email directamente
app('session')->put('portal_email', $demandado->email_externo);
app('session')->put('portal_dni', '87654321');
ok("Sesión portal seteada → portal_email={$demandado->email_externo}");

// Hace falta una notificación para que el demandado esté autorizado a responder.
// Crear una manualmente porque normalmente la dispara la creación del movimiento si hubo 'notificar_a'.
\DB::table('movimiento_notificaciones')->insert([
    'movimiento_id'  => $movCreado->id,
    'actor_id'       => $demandado->id,
    'email_destino'  => $demandado->email_externo,
    'nombre_destino' => $demandado->nombre_externo,
    'asunto'         => 'Test',
    'estado_envio'   => 'enviado',
    'numero_cedula'  => 'Cédula Test',
    'enviado_at'     => now(),
    'created_at'     => now(),
]);
ok("Notificación de prueba insertada para autorizar al demandado");

// Payload de respuesta: subir 1 archivo del tipo REQUERIDO únicamente. Reconvención queda omitida.
$archivoActa = archivoTemporal('acta_contestacion.pdf', 'PDF dummy - acta de contestación');
$req2 = Request::create("/mesa-partes/movimientos/{$movCreado->id}/responder", 'POST',
    ['respuesta' => 'Presento la contestación. No incluyo reconvención.']
);
$req2->files->set('archivos', [(string) $tipoActa->id => [$archivoActa]]);
$req2->setLaravelSession(app('session.store'));

$movFresh = ExpedienteMovimiento::find($movCreado->id);
$respuesta2 = app(\App\Http\Controllers\PortalController::class)->responder($req2, $movFresh);
$body = json_decode($respuesta2->getContent(), true);
if (!($body['ok'] ?? false)) falla('Respuesta falló: ' . ($body['mensaje'] ?? 'unknown'));
ok("PortalController::responder OK → " . $body['mensaje']);

// Verificar estado de cada responsable
$resps = MovimientoResponsable::where('movimiento_id', $movCreado->id)
    ->with('tipoDocumento:id,nombre')->get();
foreach ($resps as $r) {
    info("  Responsable post-respuesta: tipo={$r->tipoDocumento->nombre} estado={$r->estado} es_opcional=" . ($r->es_opcional ? 'SÍ' : 'no'));
}

// El opcional debe estar 'omitido' y el requerido 'respondido'
$opt = MovimientoResponsable::where('movimiento_id', $movCreado->id)->where('tipo_documento_id', $tipoReconv->id)->first();
$req_ = MovimientoResponsable::where('movimiento_id', $movCreado->id)->where('tipo_documento_id', $tipoActa->id)->first();
if ($opt->estado !== 'omitido') falla("El opcional debería estar 'omitido' y está '{$opt->estado}'");
if ($req_->estado !== 'respondido') falla("El requerido debería estar 'respondido' y está '{$req_->estado}'");
ok("Estado correcto: requerido=respondido, opcional=omitido");

// El movimiento debe estar respondido
$movFresh->refresh();
if ($movFresh->estado !== 'respondido') falla("Movimiento debería estar 'respondido' y está '{$movFresh->estado}'");
ok("Movimiento padre cerrado (estado=respondido)");

// Como el actor disparador NO entregó el opcional con auto-traslado, NO debe haberse disparado nada
$disparos = MovimientoTrasladoAutoDisparo::where('traslado_auto_id', $trasAuto->id)->count();
if ($disparos > 0) falla("Hubo $disparos disparo(s) pero no debería haber (el actor no entregó el opcional con auto-traslado)");
ok("Auto-traslado NO disparado (correcto — el opcional fue omitido)");

/* ───────────────────────── FASE 3: Demandado entrega ahora la reconvención (auto-traslado dispara) ───────────────────────── */
paso('FASE 3 · Demandado entrega TAMBIÉN la reconvención → cascada se dispara');

// Como el opcional ya está 'omitido', necesitamos reabrirlo manualmente para esta prueba
// (simulando que el demandado cambia de opinión y vuelve a entregar).
// En la app real esto pasaría con la primitiva de cancelación + resubmit del actor.
// Para este test, reabro la fila manualmente.
$opt->update([
    'estado' => 'pendiente',
    'respondido_por' => null,
    'fecha_respuesta' => null,
]);
$movFresh->update(['estado' => 'pendiente', 'respuesta' => null, 'fecha_respuesta' => null, 'respondido_por' => null]);
info("Fila opcional reabierta a 'pendiente' (simulando cambio de decisión)");

$archivoReconv = archivoTemporal('reconvencion.pdf', 'PDF dummy - reconvención');
$req3 = Request::create("/mesa-partes/movimientos/{$movCreado->id}/responder", 'POST',
    ['respuesta' => 'Presento adicionalmente la demanda reconvencional.']
);
$req3->files->set('archivos', [(string) $tipoReconv->id => [$archivoReconv]]);
$req3->setLaravelSession(app('session.store'));

$respuesta3 = app(\App\Http\Controllers\PortalController::class)->responder($req3, $movFresh->fresh());
$body3 = json_decode($respuesta3->getContent(), true);
if (!($body3['ok'] ?? false)) falla('Respuesta 2 falló: ' . ($body3['mensaje'] ?? 'unknown'));
ok("Segunda entrega OK → " . $body3['mensaje']);

// Ahora SÍ debería haberse disparado el auto-traslado
$disparos = MovimientoTrasladoAutoDisparo::where('traslado_auto_id', $trasAuto->id)->get();
if ($disparos->count() === 0) falla("El auto-traslado NO se disparó tras entregar el opcional");
ok("Auto-traslado disparado " . $disparos->count() . " vez(es)");

$idsGenerados = $disparos->pluck('movimiento_generado_id')->filter()->all();
$movsAuto = ExpedienteMovimiento::whereIn('id', $idsGenerados)
    ->orWhere(function($q) use ($movFresh){ $q->where('expediente_id', $movFresh->expediente_id)->where('creado_por_auto', true); })
    ->get();
info("Movimientos auto-generados:");
foreach ($movsAuto as $m) {
    info("  · id={$m->id} tipo={$m->tipo} estado={$m->estado} creado_por_auto=" . ($m->creado_por_auto?'SÍ':'no') . " instruccion=" . substr($m->instruccion, 0, 60) . '...');
}
$movRequerimientoAuto = $movsAuto->where('tipo', 'requerimiento')->first();
if (!$movRequerimientoAuto) falla("No se encontró el requerimiento automático generado");
ok("Requerimiento automático id={$movRequerimientoAuto->id} con plazo 20 días al demandante");

/* ───────────────────────── FASE 4: Gestor cancela el requerimiento automático ───────────────────────── */
paso('FASE 4 · Gestor cancela el requerimiento automático con doc de sustento');

Auth::loginUsingId($gestorActor->usuario_id);
ok("Login como gestor de nuevo");

$docResolucion = archivoTemporal('resolucion_cancelacion.pdf', 'PDF dummy - resolución firmada del gestor');
$req4 = Request::create(
    "/expedientes/{$expediente->id}/movimientos/{$movRequerimientoAuto->id}/cancelar-auto",
    'POST',
    [
        'motivo'            => 'Se detectó error en la reconvención presentada. Se anula el requerimiento generado al demandante para permitir subsanación.',
        'tipo_documento_id' => (string) $tipoContest->id,
    ]
);
$req4->files->set('archivo', $docResolucion);
$req4->setLaravelSession(app('session.store'));

try {
    $respuesta4 = app(\App\Http\Controllers\MovimientoController::class)->cancelarAuto(
        $req4, $expediente, $movRequerimientoAuto
    );
    ok("MovimientoController::cancelarAuto ejecutado");
} catch (\Throwable $e) {
    falla("Excepción al cancelar: " . $e->getMessage());
}

$movCancelado = $movRequerimientoAuto->fresh();
if ($movCancelado->estado !== 'cancelado') falla("El movimiento no quedó 'cancelado', está '{$movCancelado->estado}'");
ok("Movimiento auto cancelado correctamente: estado={$movCancelado->estado}");
info("  motivo: " . $movCancelado->motivo_cancelacion);
info("  cancelado_por: user_id={$movCancelado->cancelado_por} at={$movCancelado->cancelado_at}");

$docsCanc = \DB::table('movimiento_documentos')
    ->where('movimiento_id', $movCancelado->id)
    ->where('momento', 'cancelacion')
    ->get();
ok("Documentos de sustento de la cancelación: " . $docsCanc->count() . " archivo(s)");
foreach ($docsCanc as $d) info("  📎 {$d->nombre_original} ({$d->peso_bytes} bytes)");

// Trazabilidad lineal: la fila del padre QUEDA INTACTA (estado previo a la cancelación).
$opt->refresh();
$movFresh->refresh();
if ($opt->estado !== 'respondido') falla("Tras cancelar, la fila del opcional debe seguir 'respondido' (trazabilidad lineal) y está '{$opt->estado}'");
ok("Fila padre INTACTA (trazabilidad lineal): estado='{$opt->estado}'");
info("  estado movimiento padre: {$movFresh->estado}");

// Disparo NO debe eliminarse — queda como rastro histórico
$disparosRest = MovimientoTrasladoAutoDisparo::where('traslado_auto_id', $trasAuto->id)->count();
if ($disparosRest === 0) falla("El disparo se eliminó — debería quedar como rastro histórico");
ok("Disparos preservados ($disparosRest) → línea de tiempo lineal");

/* ───────────────────────── Resumen final ───────────────────────── */
paso('Resumen final · BD lista para ver en la UI');

echo "Expediente: http://localhost:8000/expedientes/1".PHP_EOL.PHP_EOL;
echo "Movimientos en el historial:".PHP_EOL;
foreach (ExpedienteMovimiento::where('expediente_id', 1)->orderBy('id')->get() as $m) {
    $auto = $m->creado_por_auto ? ' [AUTO]' : '';
    $canc = $m->estado === 'cancelado' ? ' [CANCELADO]' : '';
    echo sprintf("  #%-3d %-15s %-12s%s%s — %s", $m->id, $m->tipo, $m->estado, $auto, $canc, substr($m->instruccion, 0, 55)).PHP_EOL;
}

echo PHP_EOL."Filas en movimiento_responsables (movimiento padre):".PHP_EOL;
foreach (MovimientoResponsable::where('movimiento_id', $movCreado->id)->with('tipoDocumento:id,nombre')->get() as $r) {
    $opt = $r->es_opcional ? ' [OPCIONAL]' : '';
    echo "  · tipo='{$r->tipoDocumento->nombre}' estado={$r->estado}$opt".PHP_EOL;
}

echo PHP_EOL."✅ TODAS LAS VERIFICACIONES PASARON.".PHP_EOL;
echo "Abrí http://localhost:8000/expedientes/1 (login como card.secretario03@ankawagroup.org).".PHP_EOL;
