# Auditoría — CARD ANKAWA (Centro Arbitral)

> Fecha: 2026-06-01 · Alcance: seguridad/acceso, integridad procesal-legal, robustez/producción y cobertura de notificaciones (Reverb).
> Documento de seguimiento. Cada hallazgo cita `archivo:línea` y trae impacto + fix sugerido.
> Marca `[ ]` / `[x]` para llevar el avance de remediación.

## Resumen ejecutivo

La base es sólida: transacciones bien puestas, correlativos atómicos (`lockForUpdate`),
historial e historial de cargos/cédulas **append-only de facto**, scheduler de
vencimientos existente, cómputo de días hábiles con feriados y zona horaria correcta.

El riesgo NO está en la lógica de negocio, sino en la **capa legal y de seguridad**
que la rodea: documentos accesibles sin autorización, plazo anclado al momento
equivocado, dependencia de un cron no verificado y pérdida de solicitudes por
emails dentro de transacción. Esos cuatro son los que hay que atender antes de
producción.

Leyenda de severidad: 🚨 CRÍTICO · 🟠 ALTO · 🟡 MEDIO · 🔵 BAJO

---

## 📌 Estado de la remediación (para retomar rápido) — act. 2026-06-01

**Resuelto:**
- ✅ **C-1** Seguridad documental — disco privado `documentos` + descargas autorizadas (staff y portal OTP) + `app/Support/DocumentoAcceso.php`. Enlaces del email de requerimiento ahora autorizados (login-si-hace-falta + retorno al PDF). En `ModalResponder.jsx` los documentos del requerimiento salen desplegados y destacados.
- ✅ **C-4** Email del cargo movido fuera de la transacción en `SolicitudArbitrajeController::store`.

**Próximo en el plan acordado:** **A-7** (encolar emails: `ShouldQueue` + `afterCommit` — saca el SMTP de la petición; también arregla la lentitud) y **A-8** (reset de contraseña antes del envío).

**Hilo de correo / fiabilidad ("nunca me llegó"):**
- Con SMTP plano NO se puede saber si un correo se **entregó** (solo "enviado/fallido"). Para entregado/rebotó se necesita un proveedor con webhooks.
- **Decisión:** proveedor = **Amazon SES** (sin marca de agua —Brevo gratis mete footer—, trazabilidad vía SNS, ~$0.10/1K = centavos, driver nativo Laravel). NO configurado aún.
- El **portal es la verdad legal**; el correo es solo aviso (dejarlo en el reglamento).
- Pasos: usuario crea cuenta AWS + verifica dominio (DKIM/SPF/DMARC) + sale del sandbox → luego implementar endpoint Laravel que recibe eventos SNS y actualiza `movimiento_notificaciones` (= panel de estado real, hallazgo **A-5**). Quedó ofrecido un `SES-setup.md`.

**⚠️ Pendiente al desplegar (de C-1):** mover `storage/app/public/{expedientes,movimientos,solicitudes}` → `storage/app/private/documentos/` + `php artisan config:clear`; cambios JSX requieren `npm run build`.

---

## 🚨 CRÍTICOS (bloqueantes para producción)

### [x] C-1 · Documentos legales accesibles sin autorización — RESUELTO (2026-06-01)
**Implementado:** disco privado `documentos` (`storage/app/private/documentos`); descargas solo por
endpoints autorizados (`DocumentoController::descargar` para staff, `PortalController::descargarDocumento`
para portal OTP); autorización centralizada en `app/Support/DocumentoAcceso.php`; todos los `store`/`url`
migrados de `'public'` a disco privado/ruta firmada; email `movimiento-notificacion.blade.php` ya no expone
URL directa. 95 archivos existentes migrados en dev.
> ⚠️ **En producción**, tras desplegar: mover los archivos existentes de `storage/app/public/{expedientes,movimientos,solicitudes}`
> a `storage/app/private/documentos/` y correr `php artisan config:clear`. Considerar limpiar registros huérfanos
> de `documentos`/`movimiento_documentos` cuyo archivo ya no exista (desincronización detectada en dev).

<details><summary>Detalle original del hallazgo</summary>
**Doble problema, mismo origen:**
- Adjuntos guardados en disco **público** (`->store(..., 'public')`) y servidos por URL
  directa `/storage/...` sin pasar por Laravel ni sesión.
  `PortalController.php:123,152,602` · `EnvioExternoController.php:206` · `config/filesystems.php:41-45,77`
- Endpoint de descarga `GET /documentos/{id}/descargar` solo exige `auth,verified`; no
  valida pertenencia al expediente → IDOR iterando IDs.
  `DocumentoController.php:11-39` (ruta `routes/web.php:139`)

**Impacto:** exfiltración de prueba documental confidencial de cualquier expediente,
incluso de forma anónima si se filtra/adivina la URL pública.

**Fix:** mover adjuntos a disco privado (`storage/app/private`) y servirlos solo por
un endpoint autorizado con `response()->file()`, reutilizando la verificación de
`ExpedienteController::show` (gestor o pertenencia activa en `expediente_actores`;
para externos, `actorIdsPorEmail`). Reemplazar todos los `Storage::disk('public')->url()`.
</details>

---

### [ ] C-2 · El plazo se computa desde la CREACIÓN, no desde la NOTIFICACIÓN
`MovimientoService.php:44,90` — `fecha_limite` se calcula con `now()` al registrar el
movimiento, no desde el `enviado_at` de la cédula (`movimiento_notificaciones`).

**Impacto legal:** en derecho procesal el plazo corre desde el día siguiente a la
**notificación válida**. Anclarlo a la creación = **causal de nulidad** del acto y de
todo lo actuado en consecuencia. Se agrava si el email se demora o falla y se reenvía.

**Fix:** anclar el cómputo a `enviado_at` de la cédula y recalcular `fecha_limite` tras
el envío exitoso, o registrar `fecha_notificacion` explícita como base del cómputo.
⚠️ Decisión de negocio: confirmar contra el reglamento del centro desde qué hecho corre el plazo.

---

### [ ] C-3 · El motor de vencimientos depende de un cron no verificado
`routes/console.php:12` agenda `expedientes:procesar-vencimientos` a las 07:00, pero
solo se ejecuta si el SO tiene `* * * * * php artisan schedule:run`.

**Impacto:** si ese cron no está en producción, **ningún plazo vence automáticamente**
pese a que el código existe. El motor de vencimientos queda inerte.

**Fix:** configurar y documentar el cron de `schedule:run` (ver `Produccion.md`).
Añadir `withoutOverlapping()` y un healthcheck del job.

---

### [x] C-4 · Pérdida de solicitudes por email dentro de la transacción — RESUELTO (2026-06-01)
**Implementado:** el `Mail::send` del cargo se movió DESPUÉS del `DB::commit()` en
`SolicitudArbitrajeController::store`, en su propio try/catch que solo loguea. Un fallo de
SMTP ya no revierte la solicitud. (Reintento automático del correo = pendiente en A-5.)

<details><summary>Detalle original del hallazgo</summary>
`SolicitudArbitrajeController.php:411-414` — `Mail::send()` (síncrono) corre **antes**
del `DB::commit()`; el `catch` de línea 435 hace `rollBack()`.

**Impacto:** si el SMTP falla o se demora, se pierden solicitud + expediente + cargo +
actores + movimiento inicial. El demandante cree que presentó y no quedó nada. Además
mantiene locks de correlativos durante toda la latencia SMTP.

**Fix:** mover el `Mail::send` **después** del `DB::commit()`, en su propio try/catch
que solo loguee. El patrón de `PortalController::responder` (`:639`) es el modelo a replicar.
</details>

---

### [ ] C-5 · Sin tests de los flujos legales críticos
`tests/` solo tiene el scaffolding de Breeze (auth/profile). No hay cobertura de:
crear expediente/solicitud, responder requerimiento, emitir cargo, ni del cómputo de
plazos (`calcularFechaLimite`, `MovimientoService.php:485`) ni correlativos.

**Impacto:** un error de plazo o de correlativo es un incidente legal grave y hoy nada
lo detecta antes de producción.

**Fix:** tests de feature para los 4 flujos + unitarios para `calcularFechaLimite`
(feriados, fines de semana, cambio de año) y `CorrelativoService`.

---

## 🟠 ALTOS

### [ ] A-1 · PII expuesta — auditoría del portal sin permiso
`routes/web.php:170-178` · `AuditoriaPortalController` — `/auditoria/portal` solo tiene
`auth,verified`; el propio código reconoce que falta `permiso:auditoria.portal,ver`.
Cualquier usuario interno (incluido rol `usuario`) lee emails, DNIs, IPs, user-agents y
datos RENIEC.
**Fix:** aplicar el middleware `permiso:auditoria.portal,ver` ya previsto.

### [ ] A-2 · IDOR de lectura — listado de envíos sin verificar pertenencia
`EnvioExternoController.php:20-50` (ruta `routes/web.php:117`) — `index()` no valida que
el usuario sea gestor ni participe; expone `portal_email` y URLs públicas de documentos.
**Fix:** agregar verificación de pertenencia/gestor al inicio (patrón de `ExpedienteController::show`).

### [ ] A-3 · El rol `usuario` (parte externa) alcanza el motor interno
`routes/web.php:101-140` — las cuentas con rol `usuario` pasan `auth,verified` y, combinadas
con C-1/A-1/A-2 (que no comprueban pertenencia), acceden a expedientes, descargas y auditoría.
**Fix:** middleware que excluya el rol `usuario` del grupo interno, o exigir permiso base de módulo.

### [ ] A-4 · Autoría externa débil en el audit trail
`PortalController.php:563` — los actos del portal registran `usuario_id=NULL`; la
autoría queda solo como string de email en `descripcion`/`datos_extra`.
**Impacto:** no-repudiación frágil de actos procesales externos (ej. la contestación de una parte).
**Fix:** agregar `actor_id` (FK a `expediente_actores`) a `expediente_historial`.

### [ ] A-5 · Cédula prueba ENVÍO, no RECEPCIÓN; y sin reintento ante fallo
`NotificacionService.php:62-78` — `enviado_at` prueba el despacho, no la recepción; un
`estado_envio=fallido` solo se loguea, sin reintento ni alerta. Ligado a C-2 (el plazo
no se ata a `enviado_at`).
**Fix:** (a) job de reintento de cédulas `fallido`; (b) atar `fecha_limite` a `enviado_at`
(ver C-2); (c) según reglamento, complementar con acuse.

### [ ] A-6 · Feriados solo cargados hasta 2026
Tabla `feriados`: 13 registros 2025, 12 de 2026, nada de 2027+. Jueves/Viernes Santo son
móviles. Un plazo hábil calculado en 2027 contará feriados como hábiles → **vencimientos prematuros**.
**Fix:** seeder/comando anual de feriados + validación que alerte si el cómputo cruza un año sin feriados.

### [ ] A-7 · Emails síncronos dentro de transacciones (locks largos)
`MovimientoService.php:39,155,171,175` — `crear()` envía correos (`Mail::send`) con la
transacción abierta; `storeLote` y `SolicitudArbitrajeController` lo anidan → N envíos SMTP
dentro de una transacción.
**Fix:** mailables `ShouldQueue` (la cola ya es `database`) o emitir post-commit.

### [ ] A-8 · Reset de contraseña antes del envío, sin compensación
`MovimientoService.php:273` — la contraseña se reescribe **antes** del try/catch del email;
si el correo falla, el actor queda con una clave que nunca recibió y sin señal al gestor.
**Fix:** persistir el nuevo password solo si el envío fue exitoso, o exponer el fallo al gestor.

### [ ] A-9 · Cola sin operar + sin backups
- Sin `queue:work` supervisado ni monitoreo de `failed_jobs` → avisos en vivo del staff no
  llegan (ver `Produccion.md`). `failed_jobs` existe como tabla.
- Sin estrategia de backup de BD ni de documentos en un sistema con valor probatorio.
**Fix:** `queue:work` bajo supervisor (`--tries=3 --backoff`) + alarma sobre `failed_jobs`;
`spatie/laravel-backup` (BD + carpeta de documentos) scheduleado, o pg_dump + storage documentado.

---

## 🟡 MEDIOS

### [ ] M-1 · Listado de expedientes sin paginación
`ExpedienteController.php:62` usa `->get()->map(...)` — trae todos los expedientes a
memoria y al cliente. Viola la regla del CLAUDE.md ("+10 registros: paginación obligatoria").
**Fix:** `->paginate()` con filtros server-side.

### [ ] M-2 · Archivos huérfanos en disco al hacer rollback
`MesaPartesController::subsanar` (`:448-462`) y los uploads de `SolicitudArbitrajeController`
(~`:355-407`) guardan archivos dentro de la transacción sin limpiarlos en el `catch`.
(`PortalController::responder:639` sí lo hace bien — replicar.)
**Fix:** registrar rutas subidas y borrarlas en el `catch`.

### [ ] M-3 · Inmutabilidad de cargos e historial solo por convención
Tablas `cargos` y `expediente_historial` son append-only por código, no por BD: sin
trigger/constraint que impida `UPDATE`/`DELETE`. Un acceso directo a BD o un bug futuro
podría alterar prueba legal.
**Fix:** trigger `BEFORE UPDATE/DELETE` que bloquee modificación, o columna hash/firma de detección.

### [ ] M-4 · `cargos.created_at` es `timestamp` sin zona horaria
La fiabilidad de la hora (prueba de recepción) depende de que la app siempre escriba en
America/Lima; mezclar con jobs en otra TZ produciría horas inconsistentes.
**Fix:** migrar a `timestamptz` para evidencia legal robusta.

### [ ] M-5 · La cancelación de movimiento no avisa ni emite cargo a las partes
`MovimientoService.php:440-483` — cancelar un movimiento auto-generado congela un plazo
que las partes esperaban, pero no las notifica ni deja cargo del acto resolutivo (solo historial interno).
**Fix:** notificar (cédula) a los actores afectados y opcionalmente emitir cargo de la cancelación.

### [ ] M-6 · Filas opcionales quedan `vencido` colgando de un padre `respondido`
`PortalController.php:536` cierra solo filas `es_opcional=false`; las opcionales las marca
`vencido` el scheduler aunque el padre ya esté `respondido`. Inconsistencia cosmética de trazabilidad.
**Fix:** alinear el estado de filas opcionales al cerrar el movimiento padre.

---

## 🟡 Cobertura de notificaciones / tiempo real (Reverb)

El WebSocket está bien implementado, pero **varios eventos relevantes no avisan a nadie**.

| Evento de negocio | ¿Avisa hoy? | Dónde |
|---|---|---|
| Nueva solicitud **Arbitraje** | ✅ secretaría | `SolicitudArbitrajeController.php:422` |
| Nuevo movimiento/requerimiento/cédula a actores | ✅ portal + campana | `MovimientoService.php:191` |
| Parte responde requerimiento | ✅ gestores | `PortalController.php:657` |
| Parte sube **envío espontáneo** | ❌ | `PortalController::enviarDocumento:735` |
| Requerimiento **vencido / por vencer** | ❌ | `VencimientoService.php:30` |
| Solicitud **JPRD / Otros** entrante | ❌ | `SolicitudJPRDController`, `SolicitudOtrosController` |
| Envío externo **rechazado/aceptado** | ❌ | `EnvioExternoController.php:52,78` |
| **Gestor/actor recién asignado** | ❌ | `GestorExpedienteService::designar`, `autoAsignarActores` |
| Expediente **suspendido/concluido/reactivado** | ❌ | `ExpedienteEstadoController.php:22,45,66` |
| Cambio de etapa | ❌ | `ExpedienteEstadoController.php:89` |

**Huecos priorizados:**
- [ ] **N-1 (ALTO)** · Envío espontáneo no avisa a gestores → bandeja con documentos que nadie sabe que llegó. `avisarUsuarios($gestorUserIds, ...)` post-commit, espejo de `responder`.
- [ ] **N-2 (ALTO)** · Vencido / por vencer no notifica. Avisar al gestor en `procesarVencimientos`; job de pre-vencimiento usando `VencimientoService::resumen` (`por_vencer ≤2 días`).
- [ ] **N-3 (ALTO)** · JPRD/Otros no avisan a secretaría → replicar `avisarRol('secretaria_general', ...)`.
- [ ] **N-4 (MEDIO)** · Rechazo de envío externo no avisa a la parte (debe corregir y reenviar).
- [ ] **N-5 (MEDIO)** · Gestor recién asignado no recibe aviso del expediente a su cargo.
- [ ] **N-6 (MEDIO)** · `usePortalAvisos` solo vive en el Dashboard del portal; dentro del detalle no hay tiempo real.
- [ ] **N-7 (MEDIO)** · El Show del staff no tiene canal `expediente.{id}`: un gestor con el expediente abierto no ve entrar respuestas/envíos hasta recargar.
- [ ] **N-8 (BAJO)** · Cambios de estado del expediente no avisan a las partes (afectan plazos/derechos).

**Riesgo de no-llegada:** los avisos de portal (`avisarActoresPortal`) no se persisten;
si la parte no tiene la pestaña abierta, se pierden. Los flujos sin email de respaldo
(envío espontáneo, aceptar conocimiento) quedan en silencio total.

---

## 🔵 BAJOS

- [ ] **B-1** · Subida hasta 500 MB por archivo, sin tope de cantidad → DoS de disco. `config/uploads.php:19`. Reducir a 20-50 MB y acotar el array.
- [ ] **B-2** · Validación de archivo por `mimes:` (extensión/MIME declarado), no por contenido. Usar `mimetypes:` + `Content-Disposition`. `FileRules.php:11-16`.
- [ ] **B-3** · Proxy RENIEC/SUNAT público sin captcha (tiene throttle). `ConsultaDocumentoController`.
- [ ] **B-4** · Logging: `LOG_STACK=single` + `LOG_LEVEL=debug` en prod. Pasar a `daily` + `warning`/`info`; considerar agregador (Sentry/Flare). `.env` / `config/logging.php`.
- [ ] **B-5** · No se pueden anular requerimientos manuales erróneos (solo `creado_por_auto`). Confirmar contra reglamento. `MovimientoController.php:257`.

---

## ✅ Verificado y correcto (no tocar)

- **Transacciones** en casi todas las operaciones multi-tabla (`MovimientoService::crear`, `PortalController::responder`, `Cargo::crear`, `CorrelativoService`, `EtapaService`, `ExpedienteActorController`, `EnvioExternoController`).
- **Correlativos atómicos** con `lockForUpdate` (sin huecos ni duplicados); `numero_cargo` UNIQUE.
- **Append-only de facto**: no hay `update`/`delete` de `cargos`, `expediente_historial` ni `movimiento_notificaciones` en `app/`.
- **Cómputo de días hábiles**: excluye fines de semana + feriados; `APP_TIMEZONE=America/Lima`; el vencimiento da el último día completo a la parte.
- **Ownership del portal externo** correctamente validado: `responder`, `tiposDocumentoEnvio`, `enviarDocumento`, `aceptarConocimiento` (vs `actorIdsPorEmail`).
- **Broadcast del portal**: `PortalBroadcastAuthController` restringe canal por regex y valida propiedad antes de firmar.
- **Autorización del motor interno**: `MovimientoController`, `ExpedienteEstadoController`, `ExpedienteActorController` verifican gestor + pertenencia del movimiento al expediente.
- **Mass assignment**: todos los modelos con `$fillable`; sin `fill($request->all())`.
- **Validación de inputs** con FKs scopeadas por servicio/expediente (`Rule::exists()->where(...)`).
- **`AvisoService`** envuelve todo broadcast/notificación en try/catch: una caída de Reverb nunca rompe el negocio.
- **Cancelación de movimientos** bien diseñada: sustento obligatorio, snapshot, trazabilidad lineal sin retroceder el pasado.
- **`PortalController::responder`**: manejo de errores ejemplar (transacción + limpieza de archivos en rollback + email/avisos post-commit + `report($e)`). Patrón a replicar.

---

## 🧭 Orden de remediación sugerido

1. **C-1** (seguridad documental) — bug claro, alto impacto. *Disco privado + endpoint autorizado.*
2. **C-4 / A-7 / A-8** (emails fuera de transacción + reset de password) — bugs concretos.
3. **C-3** (verificar cron en producción) — verificación inmediata.
4. **A-1 / A-2 / A-3** (permisos faltantes / IDOR) — cambios pequeños, alto impacto.
5. **C-2 / A-5** (anclaje del plazo a la notificación) — requiere confirmar reglamento del centro.
6. **N-1 / N-2 / N-3** (huecos de notificación de alto valor).
7. **C-5 / A-9** (tests + backups + operación de cola) — estructural, planificar.
8. Medios y bajos según capacidad.

> Nota: los ítems estructurales o con implicancia de negocio (C-2, A-5, B-5, N-*) deben
> confirmarse contra el **reglamento del centro arbitral** antes de implementar — la fecha
> desde la que corre un plazo o qué actos se pueden anular son decisiones normativas, no técnicas.
