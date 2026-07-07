-- =============================================================================
-- Fase A · Script 3 — Nuevo tipo de cargo para el envío espontáneo del portal
-- =============================================================================
-- Qué hace:
--   Agrega una fila al catálogo `tipos_evento_cargo`. Hoy ese catálogo solo
--   tiene 'solicitud' y 'respuesta_requerimiento'; por eso cuando un ciudadano
--   sube un documento a su expediente ("envío espontáneo") el sistema no tiene
--   un tipo de cargo con el cual emitir su constancia de recepción.
--
--   Este INSERT crea la opción 'envio_espontaneo'. Por sí solo NO cambia el
--   comportamiento: es una herramienta de configuración que recién se usa cuando
--   se despliegue el código de la Fase B (PortalController::enviarDocumento
--   llamará a Cargo::crear('envio_espontaneo', ...)). Es inofensivo dejarlo
--   puesto de antemano.
--
-- Idempotente: ON CONFLICT (codigo) DO NOTHING — se puede correr varias veces.
--   Las columnas created_at / updated_at se llenan solas (default now()).
--
-- Autor: auditoría de trazabilidad — ver docs/plan-remediacion-trazabilidad-2026-07.md (punto 5.1)
-- =============================================================================

INSERT INTO tipos_evento_cargo (codigo, nombre, genera_cargo, activo)
VALUES ('envio_espontaneo', 'Presentación de documento por el administrado', true, true)
ON CONFLICT (codigo) DO NOTHING;

-- =============================================================================
-- VERIFICACIÓN (debe aparecer la fila nueva con activo = t y genera_cargo = t)
-- =============================================================================
-- SELECT id, codigo, nombre, activo, genera_cargo
-- FROM tipos_evento_cargo
-- ORDER BY id;

-- =============================================================================
-- REVERSIÓN
-- =============================================================================
-- Nota: funcionará solo mientras ningún cargo use todavía este tipo. Una vez que
-- la Fase B empiece a emitir cargos de envío espontáneo, la FK lo impedirá (y eso
-- es lo correcto: no se debe borrar un tipo de evento ya usado por constancias).
-- DELETE FROM tipos_evento_cargo WHERE codigo = 'envio_espontaneo';
