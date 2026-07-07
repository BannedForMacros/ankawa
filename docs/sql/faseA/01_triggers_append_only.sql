-- =============================================================================
-- Fase A · Script 1 — Candado append-only en expediente_historial y cargos
-- =============================================================================
-- Qué hace:
--   Instala triggers que RECHAZAN cualquier UPDATE, DELETE o TRUNCATE sobre las
--   tablas expediente_historial (bitácora de auditoría) y cargos (constancias de
--   recepción). Los INSERT siguen permitidos: se puede seguir registrando
--   actividad, pero el pasado ya no se puede editar ni borrar — ni siquiera con
--   acceso directo a la BD como superusuario (los triggers se disparan para
--   todos; solo los evade session_replication_role=replica, que nadie usa).
--
-- Seguridad: verificado que en todo app/ estas tablas SOLO reciben ::create
--   (INSERT). Ningún flujo hace update/delete sobre ellas, así que este candado
--   no rompe nada. Corregir un asiento erróneo = insertar uno correctivo.
--
-- Idempotente: se puede ejecutar más de una vez sin daño.
-- Compatibilidad: EXECUTE FUNCTION requiere PostgreSQL 11+. En PG 10 o anterior
--   reemplazar "EXECUTE FUNCTION" por "EXECUTE PROCEDURE".
--
-- Autor: auditoría de trazabilidad — ver docs/plan-remediacion-trazabilidad-2026-07.md (punto 3.1)
-- =============================================================================

BEGIN;

-- Función que rechaza cualquier UPDATE o DELETE (nivel fila)
CREATE OR REPLACE FUNCTION bloquear_mutacion_registro() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabla append-only: % no permitido en %', TG_OP, TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

-- Función que rechaza TRUNCATE (nivel sentencia)
CREATE OR REPLACE FUNCTION bloquear_truncate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Tabla append-only: TRUNCATE no permitido en %', TG_TABLE_NAME
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

-- ── expediente_historial ─────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_historial_no_update   ON expediente_historial;
DROP TRIGGER IF EXISTS trg_historial_no_delete   ON expediente_historial;
DROP TRIGGER IF EXISTS trg_historial_no_truncate ON expediente_historial;

CREATE TRIGGER trg_historial_no_update   BEFORE UPDATE   ON expediente_historial
  FOR EACH ROW       EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_historial_no_delete   BEFORE DELETE   ON expediente_historial
  FOR EACH ROW       EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_historial_no_truncate BEFORE TRUNCATE ON expediente_historial
  FOR EACH STATEMENT EXECUTE FUNCTION bloquear_truncate();

-- ── cargos ───────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_cargos_no_update   ON cargos;
DROP TRIGGER IF EXISTS trg_cargos_no_delete   ON cargos;
DROP TRIGGER IF EXISTS trg_cargos_no_truncate ON cargos;

CREATE TRIGGER trg_cargos_no_update   BEFORE UPDATE   ON cargos
  FOR EACH ROW       EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_cargos_no_delete   BEFORE DELETE   ON cargos
  FOR EACH ROW       EXECUTE FUNCTION bloquear_mutacion_registro();
CREATE TRIGGER trg_cargos_no_truncate BEFORE TRUNCATE ON cargos
  FOR EACH STATEMENT EXECUTE FUNCTION bloquear_truncate();

COMMIT;

-- =============================================================================
-- VERIFICACIÓN (debe listar 6 triggers)
-- =============================================================================
-- SELECT tgname, tgrelid::regclass AS tabla
-- FROM pg_trigger
-- WHERE tgname LIKE 'trg_historial_no_%' OR tgname LIKE 'trg_cargos_no_%'
-- ORDER BY tabla, tgname;
--
-- PRUEBA (ambas deben fallar con error y no modificar nada):
-- UPDATE expediente_historial SET descripcion = 'x' WHERE id = (SELECT MIN(id) FROM expediente_historial);
-- DELETE FROM cargos WHERE id = (SELECT MIN(id) FROM cargos);

-- =============================================================================
-- REVERSIÓN
-- =============================================================================
-- DROP TRIGGER IF EXISTS trg_historial_no_update   ON expediente_historial;
-- DROP TRIGGER IF EXISTS trg_historial_no_delete   ON expediente_historial;
-- DROP TRIGGER IF EXISTS trg_historial_no_truncate ON expediente_historial;
-- DROP TRIGGER IF EXISTS trg_cargos_no_update   ON cargos;
-- DROP TRIGGER IF EXISTS trg_cargos_no_delete   ON cargos;
-- DROP TRIGGER IF EXISTS trg_cargos_no_truncate ON cargos;
-- DROP FUNCTION IF EXISTS bloquear_mutacion_registro();
-- DROP FUNCTION IF EXISTS bloquear_truncate();
