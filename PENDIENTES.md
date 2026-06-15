# PENDIENTES — Refactors y mejoras de Mesa de Partes

> Documento de deuda técnica **planificada**. Cada ítem explica: **qué** hacer, **por qué quedó pendiente** (la decisión) y **por qué conviene hacerlo** (el beneficio).
> Surge de la auditoría de Mesa de Partes (junio 2026). El criterio transversal para dejar cosas pendientes fue: **es flujo legal crítico y la verificación real requiere navegador** (los formularios están detrás del login OTP por correo), así que los cambios con divergencia de comportamiento se hacen en tandas por formulario, verificando cada una antes de seguir.

---

## Contexto: lo que YA se hizo (para no rehacerlo)

Refactors completados y verificados (build + navegador donde aplica):

- **`resources/js/utils/consultaDocumento.js`** — helper único para la llamada `consulta.documento` (RENIEC/SUNAT). Reemplazó las ~10 copias idénticas de `axios.get(route('consulta.documento'), ...)`. Cero cambio de comportamiento.
- **`resources/js/hooks/useDocumentoLookup.js`** — hook con la máquina de estado del autocompletado (debounce 500 ms, lock al verificar, manejo de fallo). Contrato: `onResuelto(doc, nombre)` donde `nombre === null` = "no tocar el nombre todavía" (mientras se tipea). **No borra lo tipeado al fallar.** Extendido con dos opciones retrocompatibles: `limpiarNombreEnFallo` (si el lookup falla, fija el nombre a `''` — comportamiento de Arbitraje) y `bloqueadoInicial` (arranca bloqueado al editar un actor ya cargado).
- **JPRD (`JPRDForm.jsx`) — totalmente migrado al hook**: `CampoRuc`/`CampoDni` (→ `CampoDocLookup`), `BloqueRepresentante` y `FilaEmpresaConsorcio`. Además se corrigió que la **razón social del bloque de entidad única ahora se bloquea** al verificar el RUC (antes era editable; el resto de la app sí la bloqueaba). Verificado en navegador.
- **Auditoría del validador (`contexto`) restaurada.** El helper `consultarDocumento(tipo, numero, contexto?)` y el hook (opción `contexto`) ahora propagan la etiqueta a `validaciones_documento` (antes el helper centralizado no la enviaba y TODO se registraba como `form_lookup`). En Arbitraje se setea el valor exacto que el enum del backend espera: parte → `form_demandante`/`form_demandado` (desde `esDemandante`), representante (legal y de consorcio) → `form_representante`, árbitro propuesto → `form_arbitro`. Empresa/factura/consorcio y JPRD/Otros quedan en `form_lookup` (genérico, correcto — los roles solicitante/emplazado de JPRD no están en el enum). Build OK.
- **Arbitraje (`ArbitrajeForm.jsx`) — `RepresentanteDNI`, `RucBuscador` y `FilaEmpresaConsorcio` migrados al hook** (ítem #1 de abajo). Usan el adaptador de callbacks (`onResuelto` → `onDniChange`/`onNombreChange` etc.) + `limpiarNombreEnFallo: true` (preservan su borrado del nombre al fallar) y `bloqueadoInicial: !!valor` donde aplicaba. **`ArbitrajeEmergenciaForm` hereda el cambio gratis** porque importa `RucBuscador`/`BloquePersona` desde `ArbitrajeForm`. Build OK. ⚠️ **Falta verificar en navegador** (detrás del login OTP). `BloquePersona` y `PanelConsorcio` se quedan con el helper a propósito (ver #2 y nota nueva).
- **`resources/js/Components/FilePreviewModal.jsx`** — previsualización de archivos (4 copias → 1) + **corrige fuga de memoria** (los object URLs nunca se liberaban).
- **`resources/js/Components/OtpLoginFlow.jsx`** — login OTP (2 copias casi idénticas → 1 componente; `MesaPartes/Login.jsx` y `Portal/Login.jsx` quedaron como wrappers).
- **Eliminado** `Portal/MisExpedientes.jsx` (código muerto: su ruta redirige al dashboard, que ya usa el `ModalResponder` bueno).

---

## 1. Migrar lookups de ArbitrajeForm al hook `useDocumentoLookup` — ✅ HECHO (build OK; falta verificación en navegador)

> **Aplicado:** el hook se extendió con `limpiarNombreEnFallo` y `bloqueadoInicial` (retrocompatibles), y los tres componentes pasaron a usarlo con adaptador de callbacks. Falta solo la verificación en navegador descrita más abajo (login OTP). Lo de abajo se conserva como registro de la decisión.

**Archivos**: `resources/js/Pages/MesaPartes/Formularios/ArbitrajeForm.jsx`
**Componentes**: `RepresentanteDNI`, `RucBuscador`, `FilaEmpresaConsorcio` (la de este archivo).

### Qué hacer
Reemplazar su máquina de estado interna (los `useState(cargando/bloqueado)` + `timerRef` + `handle*`/`buscar`/`limpiar`) por `useDocumentoLookup`, igual que ya se hizo en JPRD, **conservando su JSX**.

### Por qué quedó pendiente (la decisión)
Estos **divergen del patrón de JPRD**, así que migrarlos tal cual con el hook actual **cambiaría su comportamiento**. Diferencias confirmadas leyendo el código:
- Usan **dos callbacks separados** (`onDniChange`/`onNombreChange` o `onRazonSocialChange`), no el `onResuelto(doc, nombre)` único.
- **Sí borran el nombre cuando el lookup falla** (RENIEC/SUNAT no encuentra el documento). JPRD NO lo borra.
- `RucBuscador` **arranca bloqueado** si ya viene una razón social (`useState(!!razonSocialValue)`) — caso de edición de un actor ya cargado.

Para no romper nada, **primero hay que extender el hook** con dos opciones:
- `limpiarNombreEnFallo` (default `false`) → en `buscar()` catch, si es `true`, llamar `onResuelto(num, '')`.
- `bloqueadoInicial` (default `false`) → `useState(bloqueadoInicial)`.

Y en cada componente usar un **adaptador de callbacks** para mantener el contrato del padre, p. ej.:
`onResuelto={(doc, nom) => { onDniChange(doc); if (nom !== null) onNombreChange(nom); }}`

### Por qué conviene hacerlo
Elimina ~3 copias más de la misma máquina de estado (debounce/lock/fallo) y deja **una sola fuente de verdad** para el autocompletado. Hoy, un cambio (p. ej. ajustar el debounce o el mensaje) hay que hacerlo en cada copia.

### Cómo verificar (obligatorio antes de dar por hecho)
En navegador, en el formulario de **Arbitraje** (entrar por el portal): probar DNI del representante y RUC de empresa con un documento **válido** (autocompleta + bloquea + X) y uno **inexistente** (toast + **debe borrar** el nombre, comportamiento propio de este form). Probar también el **consorcio** (fila de empresa por RUC + representante).

### 1.b 4.ª copia inline en `PanelConsorcio` — ✅ HECHO (build OK; falta verificación en navegador)
Al migrar se detectó que **`PanelConsorcio` tenía su propia máquina de lookup inline** para el **DNI del representante del consorcio** (`onDniRepChange`/`buscarRep`/`limpiarRep`) — idéntica a `RepresentanteDNI`, fuera de la lista original. **Migrada**: el hook se destructura a los mismos nombres (`cargando: cargandoRep`, etc.) para no tocar el JSX, con adaptador `onRepresentanteChange(nom === null ? { dni: doc } : { dni: doc, nombre: nom })` + `limpiarNombreEnFallo: true`. **Resultado: `ArbitrajeForm` ya no tiene ninguna copia inline de la máquina** — solo `BloquePersona` usa el helper `consultarDocumento` directo (caso multi-tipo del #2, intencional). Falta verificar en navegador junto con el resto del consorcio.

---

## 2. Lookups multi-tipo (DNI/RUC/CE): NO forzarlos al hook actual

**Archivos/Componentes**:
- `ArbitrajeForm.jsx` → `BloquePersona` (función `consultarAPI`).
- `OtrosForm.jsx` → `CampoDocumento`.

### Qué hacer
Por ahora, **dejarlos solo con el helper `consultarDocumento`** (ya aplicado). Si en el futuro se quiere unificar, diseñar un **hook aparte más rico** (`useDocumentoLookupMulti`) que contemple sus particularidades.

### Por qué quedó pendiente (la decisión)
No encajan en el hook de "2 campos (doc + nombre)" porque hacen cosas extra que el hook no modela:
- Manejan **varios tipos de documento dinámicos** (`dni` | `ruc` | `ce`) y cambian de tipo según lo tipeado (ej. detectan RUC que empieza con `2` y cambian a persona jurídica).
- `BloquePersona` además **rellena el domicilio** cuando es RUC, y maneja un estado `modoManual`.
- `CampoDocumento` **resetea** su estado con un `useEffect` cuando cambia el tipo, y distingue 404 vs otros errores.

Forzarlos al hook actual significaría meterle ramas y opciones hasta volverlo ilegible, con **alto riesgo de regresión** en el camino crítico (es donde el ciudadano ingresa sus datos para presentar la demanda). El beneficio de dedup no compensa ese riesgo hoy.

### Por qué conviene (a futuro)
Si algún día se rediseña el bloque de identidad, vale la pena un hook multi-tipo compartido para que `BloquePersona` y `CampoDocumento` no repitan la lógica de detección de tipo + domicilio. No es urgente.

---

## 3. Migrar los 4 formularios a `react-hook-form` + Zod

**Archivos**: `ArbitrajeForm.jsx`, `ArbitrajeEmergenciaForm.jsx`, `JPRDForm.jsx`, `OtrosForm.jsx`.

### Qué hacer
Reemplazar la **validación manual** (los `if` que arman objetos `missingFields`/`errores` al hacer submit) por `react-hook-form` + `zodResolver` con un esquema Zod por formulario, en `mode: 'onBlur'`.

### Por qué quedó pendiente (la decisión)
Es un cambio **profundo** de los 4 formularios a la vez (estado, validación, render de errores). CLAUDE.md ya lo declara como objetivo, pero hoy validan a mano. `zod` **ya está instalado** (`package.json`), así que la mitad de la dependencia está; falta `react-hook-form`. Se dejó para una tarea dedicada porque toca el envío de solicitudes legales y conviene hacerlo con pruebas, no en lote con otros refactors.

### Por qué conviene hacerlo
- Validación **en `onBlur`** (hoy solo al pulsar Enviar): el usuario ve el error apenas sale del campo.
- Los errores aparecen **junto a cada campo** de forma consistente; elimina el modal de "campos faltantes" y el `useEffect` espejo que limpia marcas a mano (frágil, duplicado entre Arbitraje y Emergencia).
- Menos código manual y menos bugs de sincronización de estado.

### Relacionado (mismo esfuerzo)
- **Wizard / indicador de progreso** en `ArbitrajeForm`: hoy son ~8 secciones en una sola página sin "paso X de N" ni scroll-al-campo desde el modal de errores. Para un adulto mayor es una pared. Conviene numerar secciones o convertirlo en wizard al migrar a react-hook-form.

---

## 4. De-duplicar `ArbitrajeEmergenciaForm` (clon de `ArbitrajeForm`)

**Archivos**: `ArbitrajeEmergenciaForm.jsx` (~600 líneas clonadas de `ArbitrajeForm.jsx`).

### Qué hacer
Extraer un hook `useSolicitudArbitraje(config)` (estado + validación + armado de `FormData`) y componentes compartidos (`<BloqueParte/>`, `<ModalLegal/>`, `<ModalCamposFaltantes/>`). Ambos formularios postean a la **misma ruta** (`solicitud.arbitraje.store`); solo cambian las secciones de documentos.

### Por qué quedó pendiente (la decisión)
Es el refactor **más grande y arriesgado** de los de dedup. Ya hay deriva entre las dos copias, así que hay que reconciliar comportamientos con cuidado y verificación en navegador. Mejor hacerlo **después** (o junto con) la migración a react-hook-form, para no reescribirlo dos veces.

### Por qué conviene hacerlo
Hoy cualquier fix (p. ej. el de errores 422 que ya se aplicó) hay que hacerlo **dos veces**. Unificar deja ~150 líneas de diferencias reales en vez de ~600 duplicadas.

---

## Notas de método (por qué en tandas)

- **Verificación en navegador es obligatoria** para todo lo que toque el comportamiento del autocompletado o la validación: los formularios están detrás del **login OTP por correo**, que no se puede automatizar en este entorno. Por eso se migra **un formulario a la vez** y se confirma en pantalla antes de seguir.
- No hay runner de tests JS (vitest/jest) configurado. Si se quiere prueba dura de la lógica de un hook sin navegador, primero habría que agregar vitest + testing-library (decisión de tooling pendiente).
