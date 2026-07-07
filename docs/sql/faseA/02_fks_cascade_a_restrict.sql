-- =============================================================================
-- Fase A · Script 2 — Cambiar 12 FKs de ON DELETE CASCADE a ON DELETE RESTRICT
-- =============================================================================
-- Qué hace:
--   Hoy varias foreign keys están en CASCADE: borrar un expediente (o un
--   movimiento) arrastra en cadena y BORRA su propia bitácora de auditoría,
--   documentos, notificaciones y evidencia de validación de actores.
--   Este script las cambia a RESTRICT: un intento de borrar el padre FALLA
--   ruidosamente en vez de destruir evidencia en silencio.
--
-- Seguridad: ningún endpoint de la app borra expedientes ni movimientos
--   (no hay Route::delete sobre ellos), así que RESTRICT no rompe ningún flujo.
--   Los datos actuales ya satisfacen las FKs, por lo que recrearlas es seguro.
--
-- Idempotente: usa DROP CONSTRAINT IF EXISTS antes de recrear.
--
-- ⚠️ IMPORTANTE: al poner fk_actor_usuario en RESTRICT, la pantalla actual de
--   "eliminar mi cuenta" (ProfileController::destroy, que hoy hace borrado
--   físico) empezará a fallar con error de FK si el usuario es actor de un
--   expediente. Es el comportamiento buscado. Desplegar el arreglo de la Fase B
--   (punto 6: baja lógica) poco después.
--
-- Autor: auditoría de trazabilidad — ver docs/plan-remediacion-trazabilidad-2026-07.md (punto 4.1)
-- =============================================================================

BEGIN;

-- ── Historial (la FK más crítica) ────────────────────────────────────────────
ALTER TABLE expediente_historial DROP CONSTRAINT IF EXISTS expediente_historial_expediente_id_fkey;
ALTER TABLE expediente_historial ADD  CONSTRAINT expediente_historial_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

-- ── Movimientos y sus tablas hijas ───────────────────────────────────────────
ALTER TABLE expediente_movimientos DROP CONSTRAINT IF EXISTS expediente_movimientos_expediente_id_fkey;
ALTER TABLE expediente_movimientos ADD  CONSTRAINT expediente_movimientos_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_documentos DROP CONSTRAINT IF EXISTS movimiento_documentos_movimiento_id_fkey;
ALTER TABLE movimiento_documentos ADD  CONSTRAINT movimiento_documentos_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_notificaciones DROP CONSTRAINT IF EXISTS movimiento_notificaciones_movimiento_id_fkey;
ALTER TABLE movimiento_notificaciones ADD  CONSTRAINT movimiento_notificaciones_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_responsables DROP CONSTRAINT IF EXISTS movimiento_responsables_movimiento_id_fkey;
ALTER TABLE movimiento_responsables ADD  CONSTRAINT movimiento_responsables_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_extensiones_plazo DROP CONSTRAINT IF EXISTS movimiento_extensiones_plazo_movimiento_id_fkey;
ALTER TABLE movimiento_extensiones_plazo ADD  CONSTRAINT movimiento_extensiones_plazo_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

ALTER TABLE movimiento_traslados_auto DROP CONSTRAINT IF EXISTS movimiento_traslados_auto_movimiento_id_fkey;
ALTER TABLE movimiento_traslados_auto ADD  CONSTRAINT movimiento_traslados_auto_movimiento_id_fkey
  FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE RESTRICT;

-- ── Actores y evidencia de validación ────────────────────────────────────────
ALTER TABLE expediente_actores DROP CONSTRAINT IF EXISTS fk_actor_expediente;
ALTER TABLE expediente_actores ADD  CONSTRAINT fk_actor_expediente
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actores DROP CONSTRAINT IF EXISTS fk_actor_usuario;
ALTER TABLE expediente_actores ADD  CONSTRAINT fk_actor_usuario
  FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT IF EXISTS expediente_actor_aceptaciones_expediente_id_fkey;
ALTER TABLE expediente_actor_aceptaciones ADD  CONSTRAINT expediente_actor_aceptaciones_expediente_id_fkey
  FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT IF EXISTS expediente_actor_aceptaciones_expediente_actor_id_fkey;
ALTER TABLE expediente_actor_aceptaciones ADD  CONSTRAINT expediente_actor_aceptaciones_expediente_actor_id_fkey
  FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE RESTRICT;

ALTER TABLE expediente_actor_emails DROP CONSTRAINT IF EXISTS expediente_actor_emails_expediente_actor_id_fkey;
ALTER TABLE expediente_actor_emails ADD  CONSTRAINT expediente_actor_emails_expediente_actor_id_fkey
  FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE RESTRICT;

COMMIT;

-- =============================================================================
-- VERIFICACIÓN (confdeltype debe ser 'r' = restrict en las 12; 'c' = cascade = no aplicado)
-- =============================================================================
-- SELECT conname, confdeltype
-- FROM pg_constraint
-- WHERE conname IN (
--   'expediente_historial_expediente_id_fkey',
--   'expediente_movimientos_expediente_id_fkey',
--   'movimiento_documentos_movimiento_id_fkey',
--   'movimiento_notificaciones_movimiento_id_fkey',
--   'movimiento_responsables_movimiento_id_fkey',
--   'movimiento_extensiones_plazo_movimiento_id_fkey',
--   'movimiento_traslados_auto_movimiento_id_fkey',
--   'fk_actor_expediente',
--   'fk_actor_usuario',
--   'expediente_actor_aceptaciones_expediente_id_fkey',
--   'expediente_actor_aceptaciones_expediente_actor_id_fkey',
--   'expediente_actor_emails_expediente_actor_id_fkey'
-- )
-- ORDER BY conname;

-- =============================================================================
-- REVERSIÓN (vuelve todas a ON DELETE CASCADE)
-- =============================================================================
-- BEGIN;
-- ALTER TABLE expediente_historial DROP CONSTRAINT IF EXISTS expediente_historial_expediente_id_fkey;
-- ALTER TABLE expediente_historial ADD  CONSTRAINT expediente_historial_expediente_id_fkey
--   FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_movimientos DROP CONSTRAINT IF EXISTS expediente_movimientos_expediente_id_fkey;
-- ALTER TABLE expediente_movimientos ADD  CONSTRAINT expediente_movimientos_expediente_id_fkey
--   FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE;
-- ALTER TABLE movimiento_documentos DROP CONSTRAINT IF EXISTS movimiento_documentos_movimiento_id_fkey;
-- ALTER TABLE movimiento_documentos ADD  CONSTRAINT movimiento_documentos_movimiento_id_fkey
--   FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE CASCADE;
-- ALTER TABLE movimiento_notificaciones DROP CONSTRAINT IF EXISTS movimiento_notificaciones_movimiento_id_fkey;
-- ALTER TABLE movimiento_notificaciones ADD  CONSTRAINT movimiento_notificaciones_movimiento_id_fkey
--   FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE CASCADE;
-- ALTER TABLE movimiento_responsables DROP CONSTRAINT IF EXISTS movimiento_responsables_movimiento_id_fkey;
-- ALTER TABLE movimiento_responsables ADD  CONSTRAINT movimiento_responsables_movimiento_id_fkey
--   FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE CASCADE;
-- ALTER TABLE movimiento_extensiones_plazo DROP CONSTRAINT IF EXISTS movimiento_extensiones_plazo_movimiento_id_fkey;
-- ALTER TABLE movimiento_extensiones_plazo ADD  CONSTRAINT movimiento_extensiones_plazo_movimiento_id_fkey
--   FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE CASCADE;
-- ALTER TABLE movimiento_traslados_auto DROP CONSTRAINT IF EXISTS movimiento_traslados_auto_movimiento_id_fkey;
-- ALTER TABLE movimiento_traslados_auto ADD  CONSTRAINT movimiento_traslados_auto_movimiento_id_fkey
--   FOREIGN KEY (movimiento_id) REFERENCES expediente_movimientos(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_actores DROP CONSTRAINT IF EXISTS fk_actor_expediente;
-- ALTER TABLE expediente_actores ADD  CONSTRAINT fk_actor_expediente
--   FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_actores DROP CONSTRAINT IF EXISTS fk_actor_usuario;
-- ALTER TABLE expediente_actores ADD  CONSTRAINT fk_actor_usuario
--   FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT IF EXISTS expediente_actor_aceptaciones_expediente_id_fkey;
-- ALTER TABLE expediente_actor_aceptaciones ADD  CONSTRAINT expediente_actor_aceptaciones_expediente_id_fkey
--   FOREIGN KEY (expediente_id) REFERENCES expedientes(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_actor_aceptaciones DROP CONSTRAINT IF EXISTS expediente_actor_aceptaciones_expediente_actor_id_fkey;
-- ALTER TABLE expediente_actor_aceptaciones ADD  CONSTRAINT expediente_actor_aceptaciones_expediente_actor_id_fkey
--   FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE CASCADE;
-- ALTER TABLE expediente_actor_emails DROP CONSTRAINT IF EXISTS expediente_actor_emails_expediente_actor_id_fkey;
-- ALTER TABLE expediente_actor_emails ADD  CONSTRAINT expediente_actor_emails_expediente_actor_id_fkey
--   FOREIGN KEY (expediente_actor_id) REFERENCES expediente_actores(id) ON DELETE CASCADE;
-- COMMIT;
