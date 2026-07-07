# Fase A — Blindaje de base de datos (solo SQL)

Scripts de la Fase A del plan de remediación de trazabilidad
([`docs/plan-remediacion-trazabilidad-2026-07.md`](../../plan-remediacion-trazabilidad-2026-07.md)).
No tocan código PHP ni requieren desplegar la app: se ejecutan con `psql`.

## Qué hace cada script

| Archivo | Punto del plan | Efecto |
|---------|----------------|--------|
| `01_triggers_append_only.sql` | 3.1 | Candado: prohíbe UPDATE/DELETE/TRUNCATE sobre `expediente_historial` y `cargos` (los INSERT siguen permitidos). |
| `02_fks_cascade_a_restrict.sql` | 4.1 | Cambia 12 foreign keys de `ON DELETE CASCADE` a `RESTRICT`: borrar un expediente/movimiento ya no arrasa su historial y evidencia en silencio. |
| `03_tipo_cargo_envio_espontaneo.sql` | 5.1 | Agrega el tipo de cargo `envio_espontaneo` al catálogo (habilita, junto con la Fase B, la constancia para envíos del portal). |

Ninguno borra ni modifica datos existentes: agregan protecciones (1, 2) e insertan una fila de configuración (3). Los tres son idempotentes (se pueden correr más de una vez).

## Antes de ejecutar

1. **Respaldo** (siempre, antes de producción):
   ```bash
   pg_dump -U TU_USUARIO -h 127.0.0.1 -d TU_BASE -Fc -f respaldo_antes_faseA_$(date +%Y%m%d).dump
   ```

2. **Conexión** (usa las credenciales de tu servidor):
   ```bash
   PGPASSWORD='TU_PASSWORD' psql -U TU_USUARIO -h 127.0.0.1 -d TU_BASE
   ```

## Ejecución

Orden: **01 → 02 → 03**. Cada archivo trae, en comentarios al final, su bloque de
VERIFICACIÓN y su REVERSIÓN.

Opción A — un archivo a la vez:
```bash
psql -U TU_USUARIO -h 127.0.0.1 -d TU_BASE -v ON_ERROR_STOP=1 -f 01_triggers_append_only.sql
psql -U TU_USUARIO -h 127.0.0.1 -d TU_BASE -v ON_ERROR_STOP=1 -f 02_fks_cascade_a_restrict.sql
psql -U TU_USUARIO -h 127.0.0.1 -d TU_BASE -v ON_ERROR_STOP=1 -f 03_tipo_cargo_envio_espontaneo.sql
```
(`ON_ERROR_STOP=1` aborta ante el primer error; como cada script está en una
transacción `BEGIN…COMMIT`, un fallo hace rollback y no deja nada a medias.)

Opción B — pegar el contenido dentro de una sesión `psql` interactiva.

## Notas importantes

- **Compatibilidad PostgreSQL:** `01` usa `EXECUTE FUNCTION` (PG 11+). En PG 10 o
  anterior, reemplazar por `EXECUTE PROCEDURE`.
- **Coordinar `02` con la Fase B (código):** al pasar `fk_actor_usuario` a
  `RESTRICT`, el botón actual de "eliminar mi cuenta" (`ProfileController::destroy`,
  que hoy hace borrado físico) empezará a fallar con error de FK si el usuario es
  actor de un expediente. Es el comportamiento buscado; desplegar poco después el
  arreglo del punto 6 (baja lógica) del plan.
- **`03` es inerte hasta la Fase B:** la fila nueva no cambia nada hasta que el
  código de `PortalController::enviarDocumento` la use.
