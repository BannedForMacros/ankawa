# Plan de remediación — Trazabilidad (puntos 2, 3, 4, 5, 6)

**Fecha:** 6 de julio de 2026
**Base:** [`docs/auditoria-trazabilidad-2026-07.md`](auditoria-trazabilidad-2026-07.md)
**Fuera de alcance por decisión de negocio:** punto 1 (cómputo del plazo desde la creación del movimiento) — la dueña lo quiere así.

Todos los cambios de estructura de BD se aplican **por psql** (nunca `php artisan migrate`, regla del proyecto). Cada bloque SQL va envuelto en `BEGIN; … COMMIT;` para poder abortar.

---

## Orden de ejecución recomendado

1. **Fase A — Blindaje de BD** (solo psql, reversible, sin desplegar código): triggers append-only + FKs `CASCADE→RESTRICT`. Es lo de mayor impacto legal y menor riesgo funcional (ningún flujo de la app borra padres ni edita historial/cargos).
2. **Fase B — Cambios de código** (punto 5, 6, 2 y el `$fillable` del punto 3).
3. **Fase C — Defensa en profundidad** (rol de BD sin superusuario) — recomendada, se puede hacer después.

---

## PUNTO 3 — Historial y cargos inalterables

Dos capas. La capa de trigger es la que **funciona de inmediato aunque la app siga conectada como `postgres`** (los triggers se disparan también para el superusuario; solo los evade `session_replication_role=replica`, que requiere superusuario y no lo usa nadie en la app).

### 3.1 — Trigger append-only en `expediente_historial` y `cargos` (Fase A, psql)

```sql
BEGIN;

-- Función que bloquea UPDATE/DELETE
CREATE OR REPLACE FUNCTION bloquear_mutacion_registro() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabla append-only: % no permitido en %', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

-- Función que bloquea TRUNCATE (statement-level)
CREATE OR REPLACE FUNCTION bloquear_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabla append-only: TRUNCATE no permitido en %', TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

-- expediente_historial
CREATE TRIGGER trg_historial_no_update BEFORE UPDATE ON expediente_historial
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_historial_no_delete BEFORE DELETE ON expediente_historial
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_historial_no_truncate BEFORE TRUNCATE ON expediente_historial
  FOR EACH STATEMENT EXECUTE FUNCTION bloquear_truncate();

-- cargos
CREATE TRIGGER trg_cargos_no_update BEFORE UPDATE ON cargos
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_cargos_no_delete BEFORE DELETE ON cargos
  FOR EACH ROW EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_cargos_no_truncate BEFORE TRUNCATE ON cargos
  FOR EACH STATEMENT EXECUTE FUNCTION bloquear_truncate();

COMMIT;
```

**Precondición verificada:** en todo `app/` el historial y los cargos solo reciben `::create` (INSERT); no hay un solo `update`/`delete` sobre ellos, así que el trigger no rompe ningún flujo. Corrección de un asiento erróneo = insertar un asiento correctivo (patrón append-only correcto), nunca editar.

**Reversión:** `DROP TRIGGER … ; DROP FUNCTION bloquear_mutacion_registro; DROP FUNCTION bloquear_truncate;`

### 3.2 — Quitar `created_at` de `$fillable` (Fase B, código)

`app/Models/ExpedienteHistorial.php:14-21` — eliminar `'created_at'` del array `$fillable`. Así ningún caller puede backdatear; la columna la fija el default de BD `CURRENT_TIMESTAMP`.

**Verificar antes:** ningún `ExpedienteHistorial::create([...])` en `app/` pasa `created_at` (revisado: ninguno lo hace, todos dependen del default). Tras el cambio, si alguno lo pasara, Eloquent lo ignora silenciosamente — comportamiento deseado.

### 3.3 — (Fase C, recomendada) Rol de aplicación sin superusuario

Hoy `DB_USERNAME=postgres` (SUPERUSER). Crear un rol de mínimos privilegios y apuntar el `.env` de producción a él:

```sql
-- Ejecutar como postgres
CREATE ROLE ankawa_app LOGIN PASSWORD '<fuerte>';
GRANT CONNECT ON DATABASE ankawa TO ankawa_app;
GRANT USAGE ON SCHEMA public TO ankawa_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ankawa_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ankawa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ankawa_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ankawa_app;

-- Append-only reforzado a nivel de privilegios (redundante con los triggers, defensa en profundidad)
REVOKE UPDATE, DELETE, TRUNCATE ON expediente_historial, cargos FROM ankawa_app;
```

Luego `DB_USERNAME=ankawa_app` + `DB_PASSWORD=<fuerte>` en el `.env` de producción. Beneficio extra: una inyección SQL deja de correr como superusuario.
**Riesgo:** olvidar un `GRANT` rompe un flujo → probar el ciclo completo (crear expediente, movimiento, responder, subir doc) en staging antes de producción. Por eso es Fase C separada.

---

## PUNTO 4 — Eliminar los `ON DELETE CASCADE` sobre datos probatorios

Cambiar 12 FKs de `CASCADE` a `RESTRICT`: un `DELETE` del padre falla ruidosamente en vez de arrasar historial/evidencia en silencio. Ningún endpoint de la app borra expedientes ni movimientos (verificado: sin `Route::delete` sobre ellos), así que `RESTRICT` no rompe nada.

### 4.1 — Fase A, psql

```sql
BEGIN;

-- Historial: la FK más crítica (jamás debe ser CASCADE)
ALTER TABLE expediente_historial DROP CONSTRAINT expediente_historial_expediente_id_fkey;
ALTER TABLE expediente_historial ADD CONSTRAINT expediente_historial_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

-- Movimientos y sus hijos
ALTER TABLE expediente_movimientos DROP CONSTRAINT expediente_movimientos_expediente_id_fkey;
ALTER TABLE expediente_movimientos ADD CONSTRAINT expediente_movimientos_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_documentos DROP CONSTRAINT movimiento_documentos_movimiento_id_fkey;
ALTER TABLE movimiento_documentos ADD CONSTRAINT movimiento_documentos_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_notificaciones DROP CONSTRAINT movimiento_notificaciones_movimiento_id_fkey;
ALTER TABLE movimiento_notificaciones ADD CONSTRAINT movimiento_notificaciones_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_responsables DROP CONSTRAINT movimiento_responsables_movimiento_id_fkey;
ALTER TABLE movimiento_responsables ADD CONSTRAINT movimiento_responsables_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_extensiones_plazo DROP CONSTRAINT movimiento_extensiones_plazo_movimiento_id_fkey;
ALTER TABLE movimiento_extensiones_plazo ADD CONSTRAINT movimiento_extensiones_plazo_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_traslados_auto DROP CONSTRAINT movimiento_traslados_auto_movimiento_id_fkey;
ALTER TABLE movimiento_traslados_auto ADD CONSTRAINT movimiento_traslados_auto_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

-- Actores y su evidencia de validación
ALTER TABLE expediente_actores DROP CONSTRAINT fk_actor_expediente;
ALTER TABLE expediente_actores ADD CONSTRAINT fk_actor_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actores DROP CONSTRAINT fk_actor_usuario;
ALTER TABLE expediente_actores ADD CONSTRAINT fk_actor_usuario
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT;   -- clave para el punto 6

ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT expediente_actor_aceptaciones_expediente_id_fkey;
ALTER TABLE expediente_actor_aceptaciones ADD CONSTRAINT expediente_actor_aceptaciones_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT expediente_actor_aceptaciones_expediente_actor_id_fkey;
ALTER TABLE expediente_actor_aceptaciones ADD CONSTRAINT expediente_actor_aceptaciones_expediente_actor_id_fkey
  FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actor_emails DROP CONSTRAINT expediente_actor_emails_expediente_actor_id_fkey;
ALTER TABLE expediente_actor_emails ADD CONSTRAINT expediente_actor_emails_expediente_actor_id_fkey
  FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE RESTRICT;

COMMIT;
```

**Verificación post-cambio:** `SELECT conname, confdeltype FROM pg_constraint WHERE contype='f' AND confdeltype='c';` no debe listar ninguna de estas (confdeltype pasa de `c` a `r`).
**Nota:** al pasar `expediente_actor_emails`/`aceptaciones` (hijos del actor) a `RESTRICT`, la baja lógica de actores sigue funcionando (nunca se borra la fila del actor). Los `delete()` actuales de aceptaciones (punto A14) se convertirán en revocación lógica en la mejora del punto 6 (opcional abajo).

---

## PUNTO 6 — `DELETE /profile` no debe destruir participación probatoria

Doble capa: (a) la FK `fk_actor_usuario` ya pasa a `RESTRICT` en 4.1 (un hard delete de un usuario-actor fallará en BD); (b) convertir el endpoint en baja lógica para que ni siquiera se intente.

### 6.1 — `ProfileController::destroy` a baja lógica (Fase B, código)

`app/Http/Controllers/ProfileController.php:46-62` — reemplazar `$user->delete()` por desactivación, replicando el patrón de `Configuracion/UsuarioController::destroy` (`update(['activo'=>0])`):

```php
public function destroy(Request $request): RedirectResponse
{
    $request->validate(['password' => ['required', 'current_password']]);

    $user = $request->user();
    Auth::logout();

    $user->update(['activo' => 0]);   // baja lógica: preserva actor, emails y aceptaciones

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return Redirect::to('/');
}
```

**Consideración:** la participación en expedientes (`expediente_actores`) es independiente de `users.activo`; el emplazamiento y las aceptaciones quedan intactos. Si se quiere impedir del todo la "eliminación" cuando el usuario es actor de un expediente, añadir un guard que bloquee y muestre mensaje. Mínimo viable: la baja lógica de arriba.

### 6.2 — (Opcional, recomendado) Revocación lógica de aceptaciones en vez de `delete`

`ExpedienteActorController.php:435-437` y `:531-533` hacen `ExpedienteActorAceptacion::…->delete()`. Para no perder la evidencia (IP/UA/quién validó):
- psql: `ALTER TABLE expediente_actor_aceptaciones ADD COLUMN revocado_at timestamp NULL, ADD COLUMN revocado_por bigint NULL;`
- Código: cambiar los `delete()` por `update(['revocado_at'=>now(), 'revocado_por'=>auth()->id()])` y filtrar `whereNull('revocado_at')` donde se consulten aceptaciones vigentes.
- Luego se puede añadir `expediente_actor_aceptaciones` al trigger append-only del punto 3.

---

## PUNTO 5 — Toda presentación por el portal emite cargo

### 5.1 — Nuevo tipo de evento de cargo (Fase A, psql)

```sql
INSERT INTO tipos_evento_cargo (codigo, nombre, activo, genera_cargo, created_at, updated_at)
VALUES ('envio_espontaneo', 'Presentación de documento por el administrado', true, true, now(), now());
```
(Verificar las columnas exactas de `tipos_evento_cargo` con `\d` antes de insertar; ajustar si tiene más NOT NULL.)

### 5.2 — `enviarDocumento` emite cargo y lo entrega (Fase B, código)

`PortalController.php:821-902`:
1. Dentro de la `DB::transaction`, tras crear el movimiento, cambiar `'genera_cargo' => false` a `true` y emitir el cargo capturándolo (sin enviar mail dentro de la TX):
   ```php
   $cargo = \App\Models\Cargo::crear('envio_espontaneo', $movimiento, $usuarioIdActor, null, $request);
   if (!$cargo) {
       throw new \RuntimeException('cargo_no_disponible'); // el tipo nunca debe estar inactivo para presentaciones
   }
   ```
   Pasar `$request` puebla `ip_origen`/`user_agent_origen` (hoy quedan NULL — corrige de paso el hallazgo B7).
2. Devolver el `numero_cargo` en el JSON y **enviar el correo de constancia DESPUÉS del `COMMIT`** (patrón del proyecto: mail fuera de la transacción del correlativo):
   ```php
   return response()->json([
       'ok' => true,
       'numero_cargo' => $cargo->numero_cargo,
       'mensaje' => 'Su envío fue registrado. Conserve su número de cargo como constancia de recepción.',
       'id' => $movimiento->id,
   ]);
   ```
   Corrige también el tuteo ("Tu envío" → "Su envío", regla de voz pública "usted").
3. Frontend del portal (componente de envío en `MisSolicitudes.jsx` / la vista de envío del expediente): mostrar el `numero_cargo` como **copiable** en la confirmación, igual que `Confirmacion.jsx` de Mesa de Partes.

### 5.3 — Acuse al rechazar un envío (Fase B, código)

`EnvioExternoController::rechazar` — al rechazar, notificar por correo a `portal_email_envio` del movimiento informando el rechazo y su motivo, **manteniendo válido el cargo de recepción** (recepción ≠ aceptación: la presentación existió y tiene constancia; el rechazo es un acto posterior documentado). Registrar el rechazo en `expediente_historial` (ya lo hace) y añadir el envío del acuse tras el commit.

---

## PUNTO 2 — Archivar la cédula de notificación (reproducible e inmutable)

La cédula pasa de "correo al vuelo" a **PDF congelado** almacenado en disco privado, con hash, referenciado desde `movimiento_notificaciones`. Se genera **una vez por actor** (el `numero_cedula` es por actor) y se referencia en todas las filas de notificación de ese actor.

### 2.1 — Columnas de archivo (Fase A, psql)

```sql
ALTER TABLE movimiento_notificaciones
  ADD COLUMN cedula_pdf_ruta varchar(500) NULL,
  ADD COLUMN cedula_hash     char(64)     NULL,
  ADD COLUMN cuerpo_snapshot text         NULL;   -- respaldo del HTML renderizado
```

### 2.2 — Vista PDF de la cédula (Fase B, código)

Crear `resources/views/pdf/cedula-notificacion.blade.php` con los datos **congelados al momento del envío**: número de cédula, número de expediente, servicio, sumilla/instrucción del movimiento, responsables y plazos, fecha y hora de emisión (`America/Lima`), destinatario. Nada de datos vivos ni `now()` recalculado después. Reutilizar `emails.partials.logo` (base64) para el membrete.

### 2.3 — Generar y archivar en `NotificacionService` (Fase B, código)

`app/Services/NotificacionService.php:39-80` — dentro del `foreach ($actores as $actor)`, tras obtener `$numeroCedula` y **antes** del loop de emails:
```php
$pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.cedula-notificacion', [...datos congelados...]);
$contenido = $pdf->output();
$ruta = "expedientes/{$movimiento->expediente_id}/cedulas/{$numeroCedula}.pdf";
\Storage::disk('documentos')->put($ruta, $contenido);
$hash = hash('sha256', $contenido);
```
Guardar `cedula_pdf_ruta`, `cedula_hash` y `cuerpo_snapshot` en cada `MovimientoNotificacion::create(...)` del actor, y **adjuntar el mismo PDF** al `MovimientoNotificacionMail` para que el destinatario reciba exactamente la pieza archivada. Añadir los 3 campos al `$fillable` de `MovimientoNotificacion`.

**Exposición a staff:** enlace de descarga de la cédula archivada en el `TabHistorial`/detalle del movimiento, servido por el endpoint autenticado existente (`DocumentoAcceso`/streaming), no por ruta pública.

**Nota:** esto no cambia *cuándo* corre el plazo (punto 1, fuera de alcance); solo garantiza que **qué se notificó** quede probado e inmutable.

---

## Verificación por fase

- **Fase A (psql):** tras aplicar, correr en un expediente de prueba: crear movimiento → responder desde portal → subir envío espontáneo → confirmar que todo inserta bien y que `DELETE FROM expedientes WHERE id=<test>` **falla** con error de FK, y `UPDATE expediente_historial …` / `DELETE FROM cargos …` **fallan** con la excepción del trigger.
- **Fase B (código):** usar la skill `/verify` sobre cada flujo tocado: envío espontáneo muestra número de cargo; baja de cuenta deja al actor en el expediente; cédula genera PDF con hash y llega adjunta.
- **Fase C (rol BD):** en staging, ciclo completo de expediente con `DB_USERNAME=ankawa_app` antes de tocar producción.

## Reversión

- Triggers y FKs: guardar los `DROP`/`ALTER` inversos (las FKs vuelven a `ON DELETE CASCADE` con el mismo `ADD CONSTRAINT`). Columnas nuevas son aditivas (no rompen nada si se dejan).
- Código: cambios acotados por archivo, revertibles por git.

## Resumen de archivos y objetos tocados

| Punto | BD (psql) | Código |
|-------|-----------|--------|
| 3 | triggers append-only en `expediente_historial`, `cargos`; (C) rol `ankawa_app` | `ExpedienteHistorial.php` (quitar `created_at` de `$fillable`) |
| 4 | 12 FKs `CASCADE→RESTRICT` | — |
| 6 | (cubierto por `fk_actor_usuario` RESTRICT); (opc.) `revocado_at/por` en aceptaciones | `ProfileController.php`; (opc.) `ExpedienteActorController.php` |
| 5 | `INSERT` tipo `envio_espontaneo` en `tipos_evento_cargo` | `PortalController.php` (enviarDocumento + rechazar), `EnvioExternoController.php`, frontend portal |
| 2 | 3 columnas en `movimiento_notificaciones` | `NotificacionService.php`, `MovimientoNotificacion.php`, nueva vista `pdf/cedula-notificacion.blade.php` |
