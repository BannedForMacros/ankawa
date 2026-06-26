-- ============================================================================
-- Sincronización de esquema — Solicitud de Arbitraje (Mesa de Partes)
-- Fecha: 2026-06-26
--
-- Cambios de base de datos realizados durante la sesión. Son los ÚNICOS
-- cambios de esquema; el resto fue código (validaciones, $fillable, UI).
--
-- Todas las columnas se agregan a la tabla `solicitudes_arbitraje`.
-- El script es idempotente (IF NOT EXISTS) y transaccional: se puede correr
-- más de una vez sin efectos secundarios.
--
-- Uso:
--   PGPASSWORD=*** psql -U <usuario> -h <host> -d <bd_produccion> -f sync_produccion_2026-06-26.sql
-- ============================================================================

BEGIN;

-- 1) Entidad pública: enlace/dirección de la Mesa de Partes Virtual (demandante).
ALTER TABLE solicitudes_arbitraje
    ADD COLUMN IF NOT EXISTS mesa_partes_url_demandante text;

-- 2) Entidad pública: enlace/dirección de la Mesa de Partes Virtual (demandado).
ALTER TABLE solicitudes_arbitraje
    ADD COLUMN IF NOT EXISTS mesa_partes_url_demandado text;

-- 3) Conformación del Tribunal: 'arbitro_unico' | 'tribunal_arbitral'.
ALTER TABLE solicitudes_arbitraje
    ADD COLUMN IF NOT EXISTS conformacion_tribunal varchar(20) DEFAULT 'arbitro_unico';

COMMIT;

-- Verificación (opcional):
-- \d solicitudes_arbitraje
