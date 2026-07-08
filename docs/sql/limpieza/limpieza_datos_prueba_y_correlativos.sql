-- =============================================================================
-- Limpieza de datos de prueba + ajuste de correlativos para puesta en producción
-- =============================================================================
-- Qué hace:
--   1) Borra los 2 expedientes de PRUEBA de Arbitraje (id 1 y 2) con TODOS sus
--      dependientes (movimientos, actores, historial, notificaciones, cargos de
--      prueba, etc.), en el orden correcto para no violar las FKs RESTRICT.
--   2) Renombra los 2 expedientes REALES de JPRD:
--        - id 3  →  Exp. N° 053-2026-JPRD-CARD ANKAWA
--        - id 6  →  Exp. N° 054-2026-JPRD-CARD ANKAWA
--   3) Ajusta los correlativos de Expediente:
--        - Arbitraje (ARB):  ultimo_numero = 19  → el próximo será 020
--        - JPRD:             ultimo_numero = 54  → el próximo será 055
--
-- NO TOCA los cargos reales de JPRD (CARGO-GEN-2026-013 y -014).
--
-- IMPORTANTE:
--   - Desactiva temporalmente los triggers append-only de expediente_historial y
--     cargos para poder borrar los registros de PRUEBA, y los reactiva al final.
--     Requiere ejecutarse como superusuario / dueño de las tablas (postgres).
--   - Probado en copia exacta de producción con ROLLBACK: 0 errores de FK,
--     0 huérfanos. Quedan solo los expedientes 053 y 054 y sus cargos 013/014.
--   - Los archivos físicos de los expedientes borrados quedan huérfanos en
--     storage/app/private/documentos (se pueden limpiar aparte; no afecta la BD).
--
-- CÓMO EJECUTAR (recomendado):
--   1) Respaldo:  pg_dump -Fc -f backup_antes_limpieza.dump ...
--   2) Ensayo:    cambia el "COMMIT;" final por "ROLLBACK;" y córrelo; revisa que
--                 la VERIFICACIÓN muestre solo 053 y 054 y correlativos 19/54.
--   3) Definitivo: vuelve a poner "COMMIT;" y córrelo.
-- =============================================================================

BEGIN;

ALTER TABLE expediente_historial DISABLE TRIGGER trg_historial_no_delete;
ALTER TABLE cargos               DISABLE TRIGGER trg_cargos_no_delete;

-- ── 1) BORRAR EXPEDIENTES DE PRUEBA (Arbitraje: id 1 y 2) ─────────────────────
DELETE FROM movimiento_traslados_auto_disparos
 WHERE traslado_auto_id IN (SELECT id FROM movimiento_traslados_auto WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2)))
    OR movimiento_generado_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2))
    OR triggered_by_actor_id  IN (SELECT id FROM expediente_actores    WHERE expediente_id IN (1,2));

DELETE FROM movimiento_traslados_auto    WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2));
DELETE FROM movimiento_documentos        WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2));
DELETE FROM movimiento_extensiones_plazo WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2));
DELETE FROM movimiento_notificaciones    WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2));
DELETE FROM movimiento_responsables      WHERE movimiento_id IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (1,2));

-- Cargos de prueba: TODOS los de Arbitraje + los de movimiento que NO pertenezcan
-- a los expedientes JPRD reales (3 y 6). Deja intactos los cargos JPRD (013/014).
DELETE FROM cargos
 WHERE cargable_type = 'App\Models\SolicitudArbitraje'
    OR (cargable_type = 'App\Models\ExpedienteMovimiento'
        AND cargable_id NOT IN (SELECT id FROM expediente_movimientos WHERE expediente_id IN (3,6)));

DELETE FROM expediente_movimientos       WHERE expediente_id IN (1,2);
DELETE FROM expediente_actor_aceptaciones WHERE expediente_id IN (1,2);
DELETE FROM expediente_actor_emails       WHERE expediente_actor_id IN (SELECT id FROM expediente_actores WHERE expediente_id IN (1,2));
DELETE FROM expediente_actores           WHERE expediente_id IN (1,2);
DELETE FROM expediente_historial         WHERE expediente_id IN (1,2);
DELETE FROM documentos WHERE modelo_tipo='App\Models\SolicitudArbitraje' AND modelo_id IN (2,3);
DELETE FROM expedientes                  WHERE id IN (1,2);
DELETE FROM solicitudes_arbitraje        WHERE id IN (2,3);

ALTER TABLE expediente_historial ENABLE TRIGGER trg_historial_no_delete;
ALTER TABLE cargos               ENABLE TRIGGER trg_cargos_no_delete;

-- ── 2) RENOMBRAR LOS JPRD REALES ─────────────────────────────────────────────
UPDATE expedientes SET numero_expediente='Exp. N° 053-2026-JPRD-CARD ANKAWA', updated_at=now() WHERE id=3;
UPDATE expedientes SET numero_expediente='Exp. N° 054-2026-JPRD-CARD ANKAWA', updated_at=now() WHERE id=6;

-- ── 3) AJUSTAR CORRELATIVOS DE EXPEDIENTE ────────────────────────────────────
-- Arbitraje: próximo = 020  → ultimo_numero = 19
UPDATE correlativos SET ultimo_numero=19 WHERE tipo_correlativo_id=1 AND codigo_servicio='ARB'  AND anio=2026;
-- JPRD: 053 y 054 ya usados → ultimo_numero = 54 (próximo = 055)
UPDATE correlativos SET ultimo_numero=54 WHERE tipo_correlativo_id=1 AND codigo_servicio='JPRD' AND anio=2026;

-- ── OPCIONAL (descomenta si quieres reiniciar el contador de cédulas de ARB,
--    que quedó en 12 por las notificaciones de prueba borradas) ───────────────
-- UPDATE correlativos SET ultimo_numero=0 WHERE tipo_correlativo_id=5 AND codigo_servicio='ARB' AND anio=2026;

-- ── VERIFICACIÓN (revisa antes de confirmar) ─────────────────────────────────
SELECT id, numero_expediente, estado FROM expedientes ORDER BY id;
SELECT id, numero_cargo, cargable_type, cargable_id FROM cargos ORDER BY id;
SELECT id, codigo_servicio, ultimo_numero FROM correlativos WHERE tipo_correlativo_id=1 ORDER BY codigo_servicio;

COMMIT;
-- Para ENSAYAR sin aplicar cambios: reemplaza el COMMIT de arriba por  ROLLBACK;
