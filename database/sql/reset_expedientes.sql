-- ================================================================
-- RESET COMPLETO DE EXPEDIENTES — CARD ANKAWA
-- ================================================================
-- Trunca expedientes, movimientos, solicitudes y cargos.
-- Resetea todas las secuencias a 1.
-- Recrea los correlativos de expedientes y cédulas para cada
-- servicio (Arbitraje, JPRD, Arbitraje de Emergencia) y el cargo_seq.
--
-- Uso:
--   PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d ankawa -f database/sql/reset_expedientes.sql
-- ================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Documentos polimórficos (sin FK, no los alcanza CASCADE)
-- ────────────────────────────────────────────────────────────────
DELETE FROM documentos
WHERE modelo_tipo IN (
    'App\Models\SolicitudArbitraje',
    'App\Models\SolicitudJPRD',
    'App\Models\SolicitudOtros',
    'App\Models\ExpedienteMovimiento'
);

-- ────────────────────────────────────────────────────────────────
-- 2. Truncate principal (CASCADE cubre todas las tablas dependientes:
--    expediente_actores, expediente_historial, expediente_movimientos,
--    expediente_actor_emails, expediente_actor_aceptaciones,
--    movimiento_documentos, movimiento_notificaciones,
--    movimiento_responsables, solicitud_subsanaciones)
-- ────────────────────────────────────────────────────────────────
TRUNCATE TABLE
    expedientes,
    solicitudes_arbitraje,
    solicitudes_jprd,
    solicitudes_otros,
    cargos
CASCADE;

-- ────────────────────────────────────────────────────────────────
-- 3. Resetear secuencias a 1
-- ────────────────────────────────────────────────────────────────
ALTER SEQUENCE expedientes_id_seq                   RESTART WITH 1;
ALTER SEQUENCE expediente_actores_id_seq            RESTART WITH 1;
ALTER SEQUENCE expediente_historial_id_seq          RESTART WITH 1;
ALTER SEQUENCE expediente_movimientos_id_seq        RESTART WITH 1;
ALTER SEQUENCE expediente_actor_emails_id_seq       RESTART WITH 1;
ALTER SEQUENCE expediente_actor_aceptaciones_id_seq RESTART WITH 1;
ALTER SEQUENCE movimiento_documentos_id_seq         RESTART WITH 1;
ALTER SEQUENCE movimiento_notificaciones_id_seq     RESTART WITH 1;
ALTER SEQUENCE movimiento_responsables_id_seq       RESTART WITH 1;
ALTER SEQUENCE solicitudes_arbitraje_id_seq         RESTART WITH 1;
ALTER SEQUENCE solicitudes_jprd_id_seq              RESTART WITH 1;
ALTER SEQUENCE solicitudes_otros_id_seq             RESTART WITH 1;
ALTER SEQUENCE cargos_id_seq                        RESTART WITH 1;
ALTER SEQUENCE cargo_seq                            RESTART WITH 1;

-- ────────────────────────────────────────────────────────────────
-- 4. Resetear correlativos existentes a 0 y eliminar los del año
--    actual para recrearlos limpios
-- ────────────────────────────────────────────────────────────────
DELETE FROM correlativos WHERE anio = EXTRACT(YEAR FROM NOW())::int;

-- ────────────────────────────────────────────────────────────────
-- 5. Recrear correlativos para el año en curso
--    Servicios: 1=Arbitraje, 2=JPRD, 3=Arbitraje de Emergencia
--    Tipos:     1=Expediente (EXP), 5=Cédula de Notificación (CEDULA)
--
--    Ejemplos:
--      Exp. N° 001-2026-ARB-CARD ANKAWA
--      Exp. N° 001-2026-JPRD-CARD ANKAWA
--      Exp. N° 001-2026-ARB EMERG-CARD ANKAWA
--      Cédula Notif. 001-2026-ARB-CARD ANKAWA
--      Cédula Notif. 001-2026-JPRD-CARD ANKAWA
--      Cédula Notif. 001-2026-ARB EMERG-CARD ANKAWA
-- ────────────────────────────────────────────────────────────────
INSERT INTO correlativos (anio, ultimo_numero, activo, tipo_correlativo_id, servicio_id, codigo_servicio)
VALUES
    -- Expedientes
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 1, 1, 'ARB'),
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 1, 2, 'JPRD'),
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 1, 3, 'ARB EMERG'),
    -- Cédulas de Notificación
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 5, 1, 'ARB'),
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 5, 2, 'JPRD'),
    (EXTRACT(YEAR FROM NOW())::int, 0, 1, 5, 3, 'ARB EMERG');

-- ────────────────────────────────────────────────────────────────
-- 6. Verificación final
-- ────────────────────────────────────────────────────────────────
SELECT
    tc.prefijo || ' ' ||
    lpad((c.ultimo_numero + 1)::text, 3, '0') || '-' ||
    c.anio || '-' ||
    c.codigo_servicio ||
    CASE WHEN tc.aplica_sufijo_centro THEN '-CARD ANKAWA' ELSE '' END AS ejemplo_siguiente,
    c.ultimo_numero,
    c.anio
FROM correlativos c
JOIN tipos_correlativo tc ON tc.id = c.tipo_correlativo_id
LEFT JOIN servicios s ON s.id = c.servicio_id
ORDER BY tc.nombre, s.nombre;

COMMIT;
