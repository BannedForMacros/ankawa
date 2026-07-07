-- ============================================================================
-- CARD ANKAWA — Columnas faltantes detectadas al cruzar modelos Eloquent vs. BD
-- Fecha: 2026-07-07
-- Ejecutar en local y en el servidor de producción:
--   PGPASSWORD=... psql -U <user> -h <host> -d <db> -f 2026-07-07-columnas-faltantes.sql
-- Idempotente: se puede correr más de una vez sin error.
-- ============================================================================

BEGIN;

-- 1) documentos.etapa_id ------------------------------------------------------
-- El modelo App\Models\Documento declara 'etapa_id' en $fillable y la relación
-- etapa() (belongsTo Etapa), pero la columna no existía en la tabla.
-- FK nullable a etapas (igual que expedientes.etapa_actual_id / expediente_movimientos.etapa_id).
ALTER TABLE documentos
    ADD COLUMN IF NOT EXISTS etapa_id bigint NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'documentos_etapa_id_foreign'
    ) THEN
        ALTER TABLE documentos
            ADD CONSTRAINT documentos_etapa_id_foreign
            FOREIGN KEY (etapa_id) REFERENCES etapas (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS documentos_etapa_id_index
    ON documentos (etapa_id);

-- 2) solicitudes_jprd.mesa_partes_url_entidad --------------------------------
-- La entidad en JPRD siempre es entidad pública → necesita el enlace de su mesa
-- de partes virtual (donde se le notificará), igual que arbitraje guarda
-- mesa_partes_url_demandante / _demandado en solicitudes_arbitraje.
ALTER TABLE solicitudes_jprd
    ADD COLUMN IF NOT EXISTS mesa_partes_url_entidad text NULL;

COMMIT;
