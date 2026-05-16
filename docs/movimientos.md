# Módulo de Movimientos — Arquitectura y reglas de negocio

Este documento consolida todas las decisiones de diseño y las primitivas que componen el módulo de movimientos del expediente arbitral. La lógica aquí descrita evolucionó a través de varios stages — cada uno fue ampliando capacidades manteniendo compatibilidad con los movimientos previos.

## Tabla de contenidos

1. [Principios de diseño](#principios-de-diseño)
2. [Modelos de datos](#modelos-de-datos)
3. [Estados](#estados)
4. [Flujo: crear un requerimiento](#flujo-crear-un-requerimiento)
5. [Flujo: responder en Mesa de Partes](#flujo-responder-en-mesa-de-partes)
6. [Auto-traslado (cascadas automáticas)](#auto-traslado-cascadas-automáticas)
7. [Cancelación de movimientos auto-generados](#cancelación-de-movimientos-auto-generados)
8. [Sistema de cargos](#sistema-de-cargos)
9. [Notificaciones por email](#notificaciones-por-email)
10. [Patrones de UI](#patrones-de-ui)
11. [Glosario de endpoints](#glosario-de-endpoints)
12. [SQL aplicado al schema](#sql-aplicado-al-schema)

---

## Principios de diseño

### 1. Trazabilidad lineal
La línea de tiempo del expediente es **append-only**. Ningún movimiento existente se "retrocede" — los errores se corrigen mediante NUEVOS eventos hacia adelante (cancelaciones, requerimientos de subsanación, etc.), nunca modificando o revirtiendo eventos previos.

### 2. Una sola fuente de cargo
Cada acto procesal que requiere constancia genera **exactamente un cargo** numerado globalmente (`CARGO-GEN-2026-NNN`). El cargo es global a la institución, no por servicio.

### 3. Documento de sustento obligatorio para acciones del gestor
Toda acción procesal del gestor (cancelaciones, resoluciones) debe estar respaldada con un documento adjunto — no basta con un campo de texto. Refleja la práctica legal real donde el gestor emite resoluciones firmadas.

### 4. Email validado previamente para destinatarios
Los selectores de destinatarios solo listan actores cuyo email fue verificado previamente:
- Internos: `users.email_verified_at` no nulo.
- Externos: existe entry en `verification_codes` con `usado=true` y `validado_at` no nulo (OTP confirmado).

### 5. Primitivas componibles, no flujos hardcodeados
Cada feature se construye con piezas genéricas (campos opcionales, cascadas configurables, cancelaciones con sustento) que el secretario puede combinar para modelar cualquier proceso arbitral, sin necesidad de tocar código para agregar un nuevo tipo de flujo.

---

## Modelos de datos

### `expediente_movimientos` (tabla central)

Cada fila es un acto procesal del expediente.

```
id, expediente_id, tipo, etapa_id, instruccion (sumilla), observaciones,
estado, dias_plazo, tipo_dias, fecha_limite, fecha_respuesta, respuesta,
creado_por, respondido_por, resuelto_por, fecha_resolucion,
resolucion_tipo_id, resolucion_nota,
tipo_documento_requerido_id (LEGACY — null en movimientos nuevos),
genera_cargo,
habilitar_mesa_partes, enviar_credenciales_expediente, actor_credenciales_*,
actores_mesa_partes_ids, portal_email_envio,
aceptado_por, fecha_aceptacion, rechazado_por, fecha_rechazo, motivo_rechazo,
creado_por_auto,    -- bool: el movimiento lo creó dispararTrasladosAuto()
cancelado_at, cancelado_por, motivo_cancelacion,  -- snapshot de la cancelación
activo, created_at, updated_at
```

**Tipos** (`tipo` column): `requerimiento`, `propia`, `notificacion`, `envio_externo`.

### `movimiento_responsables`

Una fila por **(movimiento × tipo_documento × actor)**. Es el pivot que permite:
- Pedir múltiples tipos de documento en un solo requerimiento.
- Asignar distintos responsables a cada tipo con su propio plazo.
- Marcar tipos como opcionales (sin penalidad si no se entrega).

```
id, movimiento_id, expediente_actor_id, tipo_actor_id,
tipo_documento_id,           -- null = requerimiento "libre" sin doc específico (legacy)
es_opcional,                 -- bool, default false. Si true: no exige adjuntar.
dias_plazo, tipo_dias, fecha_limite,
estado,                      -- pendiente | respondido | omitido | vencido
respuesta, respondido_por, fecha_respuesta,
created_at, updated_at
```

### `movimiento_documentos`

Archivos asociados a un movimiento. La columna `momento` describe en qué fase fue subido:

```
id, movimiento_id, tipo_documento_id, subido_por,
nombre_original, ruta_archivo, peso_bytes,
momento,                     -- creacion | respuesta | rechazo | cancelacion
activo, created_at, updated_at
```

### `movimiento_traslados_auto`

Configuración del traslado automático asociado a un (movimiento × tipo_documento).

```
id, movimiento_id, tipo_documento_id,
sumilla,                            -- texto del traslado a enviar
disparadores_actor_ids JSONB,       -- subset de responsables del tipo que gatillan
destinatarios_actor_ids JSONB,      -- actores que reciben la notificación
genera_requerimiento_auto BOOLEAN,  -- si true: crea un requerimiento; si false: solo notifica
requerimiento_auto_config JSONB,    -- { tipo_documento_id, dias_plazo, tipo_dias, responsable_actor_id }
activo, created_at, updated_at
UNIQUE (movimiento_id, tipo_documento_id)
```

### `movimiento_traslados_auto_disparos`

Log de cada vez que un traslado efectivamente se disparó. Sirve para:
- Idempotencia: un mismo (config × actor) no puede disparar dos veces.
- Trazabilidad: queda registro de qué actor activó la cascada y qué movimiento se generó.

```
id, traslado_auto_id, triggered_by_actor_id, movimiento_generado_id,
triggered_at
UNIQUE (traslado_auto_id, triggered_by_actor_id)
```

### `movimiento_notificaciones`

Una fila por cada email enviado de notificación. Cada entrega lleva su propia cédula correlativada.

```
id, movimiento_id, actor_id, email_destino, nombre_destino,
asunto, numero_cedula, estado_envio, enviado_at, created_at
```

### `movimiento_extensiones_plazo`

Auditoría de cada extensión de plazo de un movimiento, con quien la otorgó.

---

## Estados

### Estados de un `expediente_movimiento`

| Estado | Significado |
|---|---|
| `pendiente` | Requerimiento aún no respondido. Hay plazo corriendo. |
| `respondido` | El responsable entregó su respuesta. |
| `recibido` | Notificación / actuación propia que no requería respuesta — ya cumplió su función. |
| `vencido` | El plazo se cumplió sin respuesta. |
| `pendiente_aceptacion` | Envío espontáneo del portal externo aún no procesado. |
| `rechazado` | Envío espontáneo rechazado por el gestor (con documento de sustento). |
| `cancelado` | Movimiento auto-generado anulado por el gestor (con documento de sustento). |

### Estados de una fila de `movimiento_responsables`

| Estado | Significado |
|---|---|
| `pendiente` | El actor todavía debe entregar este tipo de documento. |
| `respondido` | El actor entregó el documento de este tipo. |
| `omitido` | El actor decidió no presentar este tipo (solo aplica a `es_opcional=true`). |
| `vencido` | El plazo individual de esta fila se venció. |

### Cierre del movimiento padre

Un movimiento `pendiente` pasa a `respondido` cuando **todas las filas `es_opcional=false` están `respondido` o `vencido`** (las opcionales pueden quedar pendientes / omitidas sin bloquear el cierre).

---

## Flujo: crear un requerimiento

### UI (TabNuevoMovimiento)

El secretario configura un requerimiento como una composición de bloques:

```
Requerimiento (tipo)
├─ Bloque 1: Tipo de documento "Contestación de demanda"
│  └─ Responsables: [{ tipo_actor: Demandado, actor: SOREN, plazo: 10 días cal., es_opcional: false }]
│  └─ Traslado automático (opcional): { sumilla, destinatarios, genera_req_auto: true, ... }
└─ Bloque 2: Tipo de documento "Demanda reconvencional"
   └─ Responsables: [{ tipo_actor: Demandado, actor: SOREN, plazo: 10 días cal., es_opcional: TRUE }]
   └─ Traslado automático (opcional): { ... }
```

### Backend (`MovimientoController::store` → `MovimientoService::crear`)

1. Crea una fila en `expediente_movimientos`.
2. Por cada `requerimiento` del payload:
   - Por cada `responsable`:
     - Por cada `actor_id`:
       - Inserta una fila en `movimiento_responsables` con su `tipo_documento_id`, `es_opcional`, plazo, fecha límite.
   - Si tiene `traslado_auto` configurado, persiste una fila en `movimiento_traslados_auto`.
3. Guarda los archivos adjuntos del propio requerimiento (`momento='creacion'`).
4. Notifica a los actores en `notificar_a` con su cédula correlativada.

### Compatibilidad legacy

Movimientos viejos creados antes de Stage 1 tenían `tipo_documento_requerido_id` en `expediente_movimientos` (uno solo). Esos siguen funcionando — la UI los muestra con el comportamiento clásico. Los movimientos nuevos dejan ese campo en NULL y usan `movimiento_responsables.tipo_documento_id` (uno por tipo).

---

## Flujo: responder en Mesa de Partes

### UI (ModalResponder)

El demandado entra y ve:
- La instrucción/sumilla del requerimiento.
- Plazo urgente integrado en el header (no flotante).
- **Sección "Tu entrega"** con un sub-card por cada tipo pendiente:
  - Etiqueta del tipo + plazo + fecha de vencimiento.
  - Badge "Opcional" en estilo amber si `es_opcional=true`.
  - Botón "Adjuntar archivo" propio del tipo.
- **Mensaje de respuesta** (textarea, después de los uploads).
- **Información de contexto** (colapsable, al final):
  - "Documentos del requerimiento": los que adjuntó el remitente.
  - "Ya entregaste anteriormente": tipos `respondido` u `omitido` con su rastro.

### Validación de submit

- Al menos un tipo debe tener archivos.
- Si quedan tipos **requeridos** sin archivo: aparece un confirm "respuesta parcial" listando qué se queda pendiente con su fecha. Los opcionales NO disparan esa advertencia.
- Si solo quedan opcionales sin archivo: submit directo, sin advertencia.

### Backend (`PortalController::responder`)

En una sola transacción:

1. Por cada tipo con archivos:
   - Marca todas las filas pendientes de ese actor + tipo como `respondido`.
   - Guarda los archivos con `momento='respuesta'` y el `tipo_documento_id` correcto.
2. Por cada fila **opcional** pendiente del actor que NO recibió archivos:
   - Se marca como `omitido` (decisión registrada).
3. Si todas las filas requeridas del movimiento están cerradas → el movimiento entero pasa a `respondido`.
4. **Un solo cargo** por evento de entrega: `CARGO-GEN-2026-NNN`. Email al actor con detalle de archivos entregados y pendientes restantes.
5. Por cada tipo entregado: dispara los auto-traslados configurados (ver sección siguiente).

### Idempotencia y atomicidad

Si algo falla a mitad de la transacción (un archivo no se puede guardar, una excepción inesperada), todo se revierte y los archivos que ya se subieron a disco se eliminan en un `catch` que limpia las rutas. La base queda en su estado previo a la entrega.

---

## Auto-traslado (cascadas automáticas)

### Configuración (al crear el requerimiento)

Por cada tipo de documento del requerimiento, el secretario puede activar "traslado automático al responder". El modal pide:

- **Sumilla**: el texto que aparecerá en el movimiento generado.
- **Disparadores**: subconjunto de los responsables que pueden disparar la cascada al entregar.
- **Destinatarios**: actores que reciben la notificación (filtrados por email validado).
- **(Opcional) Generar requerimiento automático**:
  - Tipo de documento que se pedirá.
  - Plazo (días, calendario o hábiles).
  - Responsable (un solo actor).

### Trigger (`MovimientoService::dispararTrasladosAuto`)

Llamado desde `PortalController::responder()` tras marcar las filas como respondidas:

```
Para cada tipo entregado por el actor:
  1. Busca config en movimiento_traslados_auto matching (movimiento, tipo_doc).
  2. Verifica que el actor esté en disparadores_actor_ids (o lista vacía = todos disparan).
  3. Verifica idempotencia: no debe existir disparo previo para este (config × actor).
  4. Si pasa:
       - Si genera_requerimiento_auto = true:
           → Crea UN movimiento `requerimiento` (creado_por_auto = true) con:
             - instruccion = sumilla del traslado
             - responsable del tipo configurado, con su plazo
             - notificar_a = unión de destinatarios + responsable
       - Si genera_requerimiento_auto = false:
           → Crea UN movimiento `notificacion` (creado_por_auto = true).
           → Notifica a destinatarios_actor_ids.
       - Registra en movimiento_traslados_auto_disparos (idempotencia + trazabilidad).
```

### Principio: 1 evento de cascada = 1 movimiento

Cuando se genera un requerimiento automático, NO se crea una notificación separada. El requerimiento ya notifica intrínsecamente a través de su `notificar_a`. Esto evita el doble card en el historial.

---

## Cancelación de movimientos auto-generados

### Quién y cuándo

Solo el **gestor del expediente** puede cancelar un movimiento que tenga `creado_por_auto=true` y que no esté ya cancelado.

### UI (ModalCancelarAuto, desde TabHistorial)

En el card expandido del movimiento auto-generado aparece un botón rojo **"Cancelar movimiento automático"**. Al click se abre un modal con:

- **Motivo** (textarea, obligatorio): justificación procesal.
- **Tipo de documento de sustento** (select obligatorio): qué tipo de resolución/acta.
- **Documento de sustento** (file input obligatorio): el PDF firmado del gestor.

### Backend (`MovimientoController::cancelarAuto` → `MovimientoService::cancelarMovimientoAuto`)

Acciones en una sola transacción:

1. Marca el movimiento como `estado='cancelado'`, persiste `cancelado_at`, `cancelado_por`, `motivo_cancelacion`.
2. Guarda el documento de sustento en `movimiento_documentos` con `momento='cancelacion'`.
3. Registra el evento en `expediente_historial`.

**NO** se modifica el movimiento padre, NO se reabren filas de `movimiento_responsables`, NO se elimina el disparo. La línea de tiempo permanece intacta — el rastro de lo que ocurrió queda preservado, solo se congela el plazo del movimiento cancelado.

### Si el gestor necesita pedir resubmisión

La cancelación por sí sola no reabre nada. Si el gestor quiere que el actor presente un documento corregido, debe emitir un **nuevo requerimiento** explícito hacia adelante (acción manual, no automática).

---

## Sistema de cargos

### Numeración global

Desde la sesión de refactorización del cargo, **todos los cargos comparten un solo contador global**. Formato: `CARGO-GEN-2026-NNN`.

- Tabla `correlativos` para el tipo CARGO tiene UNA sola fila con `servicio_id=NULL` y `codigo_servicio='GEN'`.
- `Cargo::crear()` siempre fuerza `$servicioId = null` al invocar `CorrelativoService::generarNumero()`, ignorando el `cargable_type` o el servicio del expediente.

### Cuándo se emite

1. **Al presentar una solicitud** en Mesa de Partes (`Cargo::crear('solicitud', $solicitud, null)`).
2. **Al responder un requerimiento** desde Mesa de Partes (`Cargo::crear('respuesta_requerimiento', $movimiento, $userId)`) si:
   - El movimiento es `tipo='requerimiento'`
   - `genera_cargo=true` en la fila del movimiento
   - `tipos_evento_cargo` para `respuesta_requerimiento` está activo y con `genera_cargo=true`
3. **Un cargo por evento de entrega**: si el actor sube N archivos de M tipos en una sola tanda, recibe UN solo cargo que abarca todo.

### Email del cargo

`CargoRespuestaMail` envía al actor un email con:
- Número de cargo, expediente, sumilla, fecha y hora.
- **Caja verde — Documentos recibidos**: listado por tipo + nombres de archivos (clickeables para abrir).
- **Caja rose — Documentos aún pendientes** (si los hay): tipos que el actor todavía debe presentar con su fecha de vencimiento.
- Mensaje final: felicitación si completó, recordatorio si quedó parcial.

---

## Notificaciones por email

### MovimientoNotificacionMail

Se envía a cada destinatario cuando se crea/dispara un movimiento que requiere notificar (`notificar_a` no vacío).

El email muestra:
- Número de cédula correlativada (`Cédula Notif. NNN-2026-{SERVICIO}-{CENTRO}`).
- Expediente, etapa, sumilla, destinatario, fecha y hora.
- **Sección "Documentos que debe presentar"** (caja con borde rose): lista los tipos que ESE destinatario específico debe entregar, con su plazo individual y fecha de vencimiento. Solo aparece si el actor tiene filas en `movimiento_responsables` con `tipo_documento_id` no nulo.
- **Sección "Documentos adjuntos al requerimiento"**: archivos que el remitente adjuntó al movimiento (con links clickeables a `Storage::disk('public')->url()`).

### Validación de emails para destinatarios

`NotificacionService::actoresConEmailValidado(int $expedienteId)`:
- Filtra actores activos del expediente cuyos emails están validados:
  - Internos: `users.email_verified_at` no nulo.
  - Externos: existe entry en `verification_codes` con `usado=true` y `validado_at` no nulo.
- **No requiere `acceso_mesa_partes`** — un actor con email validado es elegible para destinatarios de traslado aunque aún no haya entrado al portal.

---

## Patrones de UI

### Historial colapsable por etapa (TabHistorial)

El timeline del expediente está agrupado por **etapa** (estilo carpetas VS Code). Por defecto solo la etapa actual está expandida, las anteriores colapsadas para evitar scroll innecesario.

- Header de cada etapa con chevron rotativo, count de movimientos, badge "Etapa actual" si aplica, y rango de fechas cuando está cerrada.
- Link "Expandir/Colapsar todas" arriba del timeline.
- Estado controlado por `etapasExpandidas: Set<etapaKey>` con `useEffect` inicial que selecciona la etapa de `expediente.etapa_actual_id`.

### Animación suave para expandir/colapsar

Tanto cada `MovimientoCard` como cada grupo de etapa usa la técnica `grid-template-rows: 0fr → 1fr` con `transition-all duration-300 ease-out`. Es el patrón moderno para animar altura desconocida sin medir el contenido.

```jsx
<div className={`grid transition-all duration-300 ease-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
    <div className="overflow-hidden">
        {/* contenido de altura variable */}
    </div>
</div>
```

Los chevrons rotan con `rotate-90` (ChevronRight) o `rotate-180` (ChevronDown), también con `transition-transform`.

### Badges de estado de un movimiento

| Estado | Color |
|---|---|
| Pendiente | `bg-amber-50 text-amber-700` |
| Respondido | `bg-emerald-50 text-emerald-600` |
| Recibido | `bg-purple-50 text-purple-600` |
| Vencido | `bg-red-50 text-red-600` |
| **Cancelado** | `bg-[#291136] text-white` (plum profundo Ankawa) con ícono **Ban** |

Si el movimiento fue creado por la cascada (`creado_por_auto=true`), aparece **también** un mini-badge ámbar **⚡ Auto** al lado.

### Vista del cancelado en el expandido

Cuando `mov.estado === 'cancelado'`, el card expandido muestra un panel de fondo plum profundo con:
- Título "Movimiento cancelado por el gestor" + ícono Ban en amber-300.
- Motivo entre comillas (italics, blanco/85).
- Fecha + nombre del usuario que canceló.
- Sección "Sustento" con el documento de respaldo del gestor (clickeable, abre en nueva pestaña).

### Vista MULTI-DOC en el historial

Cuando el movimiento tiene filas en `movimiento_responsables` con `tipo_documento_id` no nulo, el card expandido reemplaza la vieja lista plana de responsables por una vista **agrupada por tipo de documento**:

```
📄 Acta                                  1/2 entregados   (si hay 2+ actores obligados)
   o "Entregado" / "Pendiente" / "No presentado (opcional)" si es 1 solo actor
├─ Demandante — 10 días cal.  ✓  Juan Pérez
├─ Demandado — 10 días cal.   ⏳
└─ ARCHIVOS ENTREGADOS (1)
   📎 contrato.pdf
```

Los chips del header de la card (cuando está colapsada) muestran cada actor con su progreso `X/Y ⏳` (si tiene varias obligaciones).

### ModalResponder en Mesa de Partes

Layout reorganizado para priorizar la acción primaria:

1. **Header**: instrucción + plazo urgente integrado (no flotante).
2. **Tu entrega**: secciones por tipo de doc pendiente (uploads).
3. **Mensaje de respuesta** (textarea, abajo de los uploads).
4. **Información de contexto** (al final, todos colapsables por defecto):
   - Documentos del requerimiento (lo que adjuntó el remitente).
   - Ya entregaste anteriormente (rastro de respuestas previas + opcionales omitidos).

### Modal de cancelación (ModalCancelarAuto)

Disponible solo para el gestor en movimientos auto-generados. Es un modal grande:
- Aviso amber sobre el efecto (congelar plazo).
- Motivo (textarea obligatorio).
- Tipo de documento de sustento (select).
- Upload del documento (obligatorio).
- Botón final rojo "Cancelar movimiento".

---

## Glosario de endpoints

### Lado interno (Expediente Electrónico)

| Método | Ruta | Controlador | Función |
|---|---|---|---|
| POST | `/expedientes/{expediente}/movimientos` | `MovimientoController@store` | Crear un movimiento individual (puede traer N requerimientos con N responsables) |
| POST | `/expedientes/{expediente}/movimientos/lote` | `MovimientoController@storeLote` | Crear varios movimientos en lote (mismo formato pero anidado en `movimientos[]`) |
| POST | `/expedientes/{expediente}/movimientos/{movimiento}/resolver` | `MovimientoController@resolver` | Resolver un movimiento respondido (con tipo_resolucion + nota) |
| POST | `/expedientes/{expediente}/movimientos/{movimiento}/cancelar-auto` | `MovimientoController@cancelarAuto` | Cancelar un movimiento auto-generado (con motivo + tipo_documento + archivo de sustento) |
| GET | `/expedientes/{expediente}/envios` | `EnvioExternoController@index` | Listar envíos espontáneos pendientes/procesados del portal externo |
| POST | `/expedientes/{expediente}/envios/{movimiento}/aceptar` | `EnvioExternoController@aceptar` | Aceptar un envío espontáneo (queda en historial) |
| POST | `/expedientes/{expediente}/envios/{movimiento}/rechazar` | `EnvioExternoController@rechazar` | Rechazar un envío espontáneo (con motivo + tipo_documento + archivo) |

### Lado externo (Mesa de Partes Portal OTP)

| Método | Ruta | Controlador | Función |
|---|---|---|---|
| GET | `/mesa-partes/inicio` | `PortalController@dashboard` | Dashboard con expedientes accesibles + requerimientos pendientes |
| POST | `/mesa-partes/movimientos/{movimiento}/responder` | `PortalController@responder` | Responder un requerimiento subiendo archivos por tipo (`archivos[tipo_id][]`) |

---

## SQL aplicado al schema

### Stage Multi-tipo de documento (movimiento_responsables)

```sql
ALTER TABLE movimiento_responsables
  ADD COLUMN IF NOT EXISTS tipo_documento_id BIGINT NULL REFERENCES tipo_documentos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_movres_tipo_doc ON movimiento_responsables(tipo_documento_id);
```

### Stage Traslado Automático

```sql
CREATE TABLE IF NOT EXISTS movimiento_traslados_auto (
    id                          BIGSERIAL PRIMARY KEY,
    movimiento_id               BIGINT NOT NULL REFERENCES expediente_movimientos(id) ON DELETE CASCADE,
    tipo_documento_id           BIGINT NOT NULL REFERENCES tipo_documentos(id),
    sumilla                     TEXT NOT NULL,
    disparadores_actor_ids      JSONB NOT NULL DEFAULT '[]'::jsonb,
    destinatarios_actor_ids     JSONB NOT NULL DEFAULT '[]'::jsonb,
    genera_requerimiento_auto   BOOLEAN NOT NULL DEFAULT false,
    requerimiento_auto_config   JSONB,
    activo                      BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ,
    updated_at                  TIMESTAMPTZ,
    UNIQUE (movimiento_id, tipo_documento_id)
);

CREATE TABLE IF NOT EXISTS movimiento_traslados_auto_disparos (
    id                          BIGSERIAL PRIMARY KEY,
    traslado_auto_id            BIGINT NOT NULL REFERENCES movimiento_traslados_auto(id) ON DELETE CASCADE,
    triggered_by_actor_id       BIGINT NOT NULL REFERENCES expediente_actores(id),
    movimiento_generado_id      BIGINT REFERENCES expediente_movimientos(id) ON DELETE SET NULL,
    triggered_at                TIMESTAMPTZ NOT NULL,
    UNIQUE (traslado_auto_id, triggered_by_actor_id)
);

CREATE INDEX IF NOT EXISTS idx_mta_mov ON movimiento_traslados_auto(movimiento_id);
CREATE INDEX IF NOT EXISTS idx_mtad_traslado ON movimiento_traslados_auto_disparos(traslado_auto_id);
```

### Stage Tipos opcionales

```sql
ALTER TABLE movimiento_responsables
  ADD COLUMN IF NOT EXISTS es_opcional BOOLEAN NOT NULL DEFAULT false;
```

### Stage Cancelación de auto-movimientos

```sql
ALTER TABLE expediente_movimientos
  ADD COLUMN IF NOT EXISTS creado_por_auto    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cancelado_at       TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS cancelado_por      BIGINT NULL REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS motivo_cancelacion TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_em_creado_auto
  ON expediente_movimientos(creado_por_auto) WHERE creado_por_auto = true;
```

### Fixes secundarios

```sql
-- Permitir actores externos (sin usuario_id interno) en el historial.
ALTER TABLE expediente_historial ALTER COLUMN usuario_id DROP NOT NULL;

-- Aceptar nuevos estados en movimientos.
ALTER TABLE expediente_movimientos DROP CONSTRAINT IF EXISTS expediente_movimientos_estado_check;
ALTER TABLE expediente_movimientos ADD CONSTRAINT expediente_movimientos_estado_check
  CHECK (estado IN ('pendiente','respondido','vencido','recibido','omitido','pendiente_aceptacion','rechazado','cancelado'));

-- Aceptar nuevos momentos en movimiento_documentos.
ALTER TABLE movimiento_documentos DROP CONSTRAINT IF EXISTS movimiento_documentos_momento_check;
ALTER TABLE movimiento_documentos ADD CONSTRAINT movimiento_documentos_momento_check
  CHECK (momento IN ('creacion','respuesta','rechazo','cancelacion'));
```

### CARGO global (numeración única para todos los servicios)

```sql
DELETE FROM correlativos
WHERE tipo_correlativo_id = (SELECT id FROM tipos_correlativo WHERE codigo='CARGO')
  AND servicio_id IS NOT NULL;

UPDATE correlativos
SET codigo_servicio = 'GEN'
WHERE tipo_correlativo_id = (SELECT id FROM tipos_correlativo WHERE codigo='CARGO')
  AND servicio_id IS NULL;

UPDATE tipos_correlativo
SET formato = '{PREFIJO}-{SERVICIO}-{ANIO}-{NUMERO:3}'
WHERE codigo = 'CARGO';
-- → Resultado: CARGO-GEN-2026-NNN
```

---

## Ejemplo end-to-end: Contestación de demanda

Para entender cómo componer las primitivas:

```
Movimiento creado por el secretario:
  Tipo: requerimiento
  Sumilla: "Conteste la demanda en el plazo señalado."

  Bloque 1: Tipo "Contestación de demanda"
    Responsable: Demandado, 10 días cal., es_opcional=false
    Traslado auto: SÍ
      Sumilla: "Se corre traslado de la contestación al demandante"
      Disparadores: [Demandado]
      Destinatarios: [Demandante]
      Genera requerimiento auto: NO

  Bloque 2: Tipo "Demanda reconvencional"
    Responsable: Demandado, 10 días cal., es_opcional=TRUE
    Traslado auto: SÍ
      Sumilla: "Se corre traslado de la reconvención al demandante. Conteste en 20 días."
      Disparadores: [Demandado]
      Destinatarios: [Demandante]
      Genera requerimiento auto: SÍ
        → Tipo: "Contestación de reconvención"
        → Plazo: 20 días cal.
        → Responsable: Demandante
```

Escenarios posibles:

| Acción del demandado | Resultado |
|---|---|
| Sube SOLO la contestación | Contestación → respondido. Reconvencional → omitido. Movimiento cierra. Se notifica al demandante del traslado de la contestación. Cargo único. |
| Sube AMBAS | Ambas filas → respondido. Cierra. Notificación al demandante + se crea automáticamente un nuevo requerimiento al demandante para contestar la reconvención, con plazo de 20 días desde la entrega. Cargo único. |
| Después de subir mal, el gestor cancela el req auto | El req auto pasa a `cancelado` (plazo congelado). Documentos previos del demandado quedan intactos. Si el gestor necesita pedir corrección, emite un nuevo requerimiento explícito. |

---

## Convenciones de código

- En Mailables, la etiqueta del campo `movimiento->instruccion` siempre es **"Sumilla"**, nunca "Requerimiento".
- Acciones procesales del gestor requieren **documento de sustento adjunto**, no solo texto.
- Tipos de fechas: `calendario` (corre todos los días) vs `habiles` (excluye sábado/domingo + feriados de la tabla `feriados`).
- El símbolo `∅` se usa en el historial para el estado `omitido`.
- El símbolo `⚡` se usa para indicar movimientos creados por la cascada (`creado_por_auto`).
- El símbolo `🚫` (icono `Ban` de lucide-react) se usa para el estado `cancelado`.

---

## Referencias en código

| Archivo | Rol |
|---|---|
| `app/Models/ExpedienteMovimiento.php` | Modelo principal del movimiento. Define constantes de estado y tipo. |
| `app/Models/MovimientoResponsable.php` | Pivot (tipo × actor) por movimiento. |
| `app/Models/MovimientoTrasladoAuto.php` | Configuración de cascada automática. |
| `app/Models/MovimientoTrasladoAutoDisparo.php` | Log de cada disparo de cascada. |
| `app/Services/MovimientoService.php` | Lógica de creación, disparo de cascadas, cancelación. |
| `app/Services/NotificacionService.php` | Envío de cédulas + helper de actores con email validado. |
| `app/Http/Controllers/MovimientoController.php` | Endpoints de creación, resolución, cancelación. |
| `app/Http/Controllers/PortalController.php` | Dashboard y endpoint `responder` del portal externo. |
| `app/Http/Controllers/EnvioExternoController.php` | Envíos espontáneos del portal externo. |
| `resources/js/Pages/Expedientes/partials/TabNuevoMovimiento.jsx` | UI de creación con bloques multi-tipo. |
| `resources/js/Pages/Expedientes/partials/TabHistorial.jsx` | Timeline colapsable por etapa con animaciones. |
| `resources/js/Pages/Expedientes/partials/ModalTrasladoAuto.jsx` | Modal de configuración de cascada. |
| `resources/js/Pages/Expedientes/partials/ModalCancelarAuto.jsx` | Modal de cancelación con doc de sustento. |
| `resources/js/Pages/MesaPartes/Partials/ModalResponder.jsx` | Modal de respuesta en Mesa de Partes. |
| `resources/views/emails/movimiento-notificacion.blade.php` | Template de cédula de notificación. |
| `resources/views/emails/cargo-respuesta.blade.php` | Template del cargo de respuesta con detalle de entregas y pendientes. |
