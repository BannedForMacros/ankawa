-- ============================================================
-- FASE 1: Rediseño del Sistema de Correlativos
-- Base de datos: ankawa | Motor: PostgreSQL
-- Ejecutar en pgAdmin 4 sobre la base de datos "ankawa"
-- ============================================================

-- ============================================================
-- PASO 1: Crear tabla tipos_correlativo
-- Define los tipos de documentos que usan correlativo
-- ============================================================
CREATE TABLE IF NOT EXISTS tipos_correlativo (
    id                   SERIAL       PRIMARY KEY,
    nombre               VARCHAR(100) NOT NULL,
    codigo               VARCHAR(20)  NOT NULL UNIQUE,
    prefijo              VARCHAR(50)  NOT NULL DEFAULT '',
    aplica_sufijo_centro BOOLEAN      NOT NULL DEFAULT TRUE,
    activo               BOOLEAN      NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  tipos_correlativo                    IS 'Catálogo de tipos de documentos con correlativo';
COMMENT ON COLUMN tipos_correlativo.codigo             IS 'Código corto único. Ej: EXP, CARTA, RES, OP';
COMMENT ON COLUMN tipos_correlativo.prefijo            IS 'Texto que precede al número. Ej: "Exp. N°"';
COMMENT ON COLUMN tipos_correlativo.aplica_sufijo_centro IS 'Si true, agrega el sufijo del centro al final. Ej: CARD ANKAWA';

-- ============================================================
-- PASO 2: Semilla de tipos base
-- ============================================================
INSERT INTO tipos_correlativo (nombre, codigo, prefijo, aplica_sufijo_centro, activo)
VALUES
    ('Expediente',     'EXP',   'Exp. N°', TRUE,  TRUE),
    ('Carta Orden',    'CARTA', 'Carta',   FALSE, TRUE),
    ('Resolución',     'RES',   'Res.',    FALSE, TRUE),
    ('Orden Procesal', 'OP',    'O.P.',    FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- PASO 3: Agregar columna slug a roles (para lookup dinámico)
-- ============================================================
ALTER TABLE roles
    ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Poblar slug a partir del nombre existente (formato snake_case simplificado)
UPDATE roles
SET slug = lower(regexp_replace(trim(nombre), '\s+', '_', 'g'))
WHERE slug IS NULL OR slug = '';

-- ============================================================
-- PASO 4: Rediseñar tabla correlativos
-- Agregar columnas nuevas (nullable primero para no romper datos)
-- ============================================================
ALTER TABLE correlativos
    ADD COLUMN IF NOT EXISTS tipo_correlativo_id INTEGER REFERENCES tipos_correlativo(id),
    ADD COLUMN IF NOT EXISTS servicio_id         INTEGER REFERENCES servicios(id),
    ADD COLUMN IF NOT EXISTS codigo_servicio     VARCHAR(50);

-- ============================================================
-- PASO 5: Eliminar correlativos CARGO (eran temporales del flujo viejo)
-- Son los generados automáticamente al recibir solicitudes.
-- Precaución: si quieres conservarlos, comenta esta línea.
-- ============================================================
DELETE FROM correlativos WHERE tipo = 'CARGO';

-- ============================================================
-- PASO 6: Migrar datos existentes
-- Mapear el tipo string viejo a tipo_correlativo_id + codigo_servicio
-- ============================================================
UPDATE correlativos c
SET
    tipo_correlativo_id = (SELECT id FROM tipos_correlativo WHERE codigo = 'EXP'),
    codigo_servicio     = c.tipo   -- el tipo viejo (ej: "EXP") pasa a ser el código de servicio
WHERE tipo_correlativo_id IS NULL;

-- ============================================================
-- PASO 7: Hacer tipo_correlativo_id NOT NULL
-- (ya todos los registros tienen valor)
-- ============================================================
ALTER TABLE correlativos
    ALTER COLUMN tipo_correlativo_id SET NOT NULL,
    ALTER COLUMN codigo_servicio     SET NOT NULL;

-- ============================================================
-- PASO 8: Eliminar columna tipo (ya reemplazada)
-- ============================================================
ALTER TABLE correlativos DROP COLUMN IF EXISTS tipo;

-- ============================================================
-- PASO 9: Eliminar constraint único viejo si existe
-- ============================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'correlativos_tipo_anio_unique'
    ) THEN
        ALTER TABLE correlativos DROP CONSTRAINT correlativos_tipo_anio_unique;
    END IF;
END $$;

-- ============================================================
-- PASO 10: Nuevo UNIQUE constraint
-- (tipo_correlativo_id, servicio_id, anio)
-- Para correlativos globales (servicio_id NULL) también aplica,
-- por eso usamos la expresión COALESCE para que NULL sea comparable.
-- ============================================================
ALTER TABLE correlativos
    ADD CONSTRAINT correlativos_tipo_servicio_anio_unique
    UNIQUE (tipo_correlativo_id, COALESCE(servicio_id, 0), anio);

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
SELECT
    c.id,
    tc.nombre   AS tipo,
    tc.codigo   AS codigo_tipo,
    s.nombre    AS servicio,
    c.codigo_servicio,
    c.anio,
    c.ultimo_numero,
    c.activo
FROM correlativos c
JOIN tipos_correlativo tc ON tc.id = c.tipo_correlativo_id
LEFT JOIN servicios s     ON s.id  = c.servicio_id
ORDER BY c.id;
