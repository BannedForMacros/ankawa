# Auditoría de trazabilidad — CARD Ankawa (Mesa de Partes + Expediente Electrónico)

**Fecha:** 6 de julio de 2026
**Alcance:** garantía de trazabilidad de inicio a fin del expediente electrónico y la mesa de partes digital, en clave de exigencias legales (TUO Ley 27444, constancia de recepción con fecha cierta, notificación fehaciente, integridad e inalterabilidad del expediente, control de acceso a la evidencia).
**Método:** revisión de código (`app/`, `routes/`, `resources/`), esquema real de PostgreSQL (`\d`, FKs, triggers) y datos de producción (solo lectura). Seis dimensiones auditadas en paralelo.

> **Nota de estado**: ningún hallazgo describe un dato ya corrompido en producción. La secuencia de cargos está íntegra (001–012), no hay documentos sin hash en la tabla que sí lo calcula, y no hay hoy código que borre expedientes. Los hallazgos son **capacidades del sistema** que permiten romper la trazabilidad, no incidentes ocurridos.

---

## Veredicto general

El sistema tiene buenos cimientos de trazabilidad —correlativo atómico sin huecos, `expediente_historial` con 30+ puntos de escritura, movimientos manuales inmutables, cancelaciones con motivo+sustento, disco de documentos privado con acceso autorizado— **pero no garantiza aún la inalterabilidad que la ley exige de un expediente electrónico.** Hay cuatro debilidades estructurales que, combinadas, permiten que un hecho procesal quede sin constancia oponible o que la evidencia se altere/borre sin dejar rastro:

1. **La bitácora es append-only solo por convención de código**, no por la base de datos.
2. **Los plazos corren aunque la notificación falle o ni se emita**, y la cédula no se archiva.
3. **Presentaciones ciudadanas por el portal pueden quedar sin cargo** (constancia de recepción).
4. **La evidencia (documentos, aceptaciones, solicitud original) es alterable o borrable en cascada**, sin hash de integridad ni registro de accesos.

---

## Hallazgos CRÍTICOS

### C1 — El plazo corre desde la creación del movimiento, no desde la notificación; y corre aunque la notificación falle o no se emita
`MovimientoService.php:44,90,485-501` calcula `fecha_limite` con `now()` al **crear** el movimiento. La notificación es un paso posterior y opcional (`MovimientoController.php:94-95` valida `notificar_a` como `nullable`): un requerimiento con responsables y plazo puede crearse con `notificar_a=[]` → cero emails, cero cédula, y el plazo corre igual hasta que el cron lo marca vencido. Si el SMTP falla, `NotificacionService.php:75-78` marca `fallido` y hace `Log::warning`, pero **nadie consume ese estado**: no hay reintento, ni alerta al gestor, ni suspensión del plazo, ni evento en el historial.
**Impacto legal:** en derecho peruano el plazo se computa desde la notificación válida. Aquí un movimiento puede vencer (con efecto de preclusión/rebeldía de facto) sin que exista constancia de notificación alguna.

### C2 — La cédula de notificación no queda archivada: no es reproducible qué se notificó
La cédula es solo un correlativo (`NotificacionService.php:48`) + una fila en `movimiento_notificaciones` (destinatario, asunto, estado) + un email renderizado al vuelo con datos vivos (`resources/views/emails/movimiento-notificacion.blade.php`). El **contenido** no se persiste (ni HTML ni PDF). Si el movimiento se edita después, es imposible reconstruir qué texto/fechas recibió la parte. dompdf ya está en el proyecto pero no se usa para cédulas.
**Impacto legal:** la "constancia fehaciente" exigida a la notificación electrónica no existe como documento; ante impugnación ("nunca me notificaron X"), el centro solo puede exhibir un asunto de correo y un número.

### C3 — El historial de auditoría es append-only solo por convención; sin protección en la base de datos
En código no hay ningún `update()`/`delete()` sobre `expediente_historial` (bien). Pero la BD no lo protege: **cero triggers, cero REVOKE**, y la aplicación se conecta como `postgres` (**SUPERUSER**, verificado `pg_roles.rolsuper=t`). Cualquier inyección SQL, `artisan tinker` o acceso al `.env` puede reescribir o vaciar la bitácora sin dejar rastro. Además `created_at` está en `$fillable` (`ExpedienteHistorial.php:14-21`) → el propio código puede **backdatear** entradas.
**Impacto legal:** el registro no es "íntegro e inalterable"; su valor probatorio es débil ante un cuestionamiento serio.

### C4 — `ON DELETE CASCADE` destruye la bitácora y la evidencia junto con el expediente
FKs verificadas: `expediente_historial → expedientes ON DELETE CASCADE`, y en cascada desde `expedientes`: `expediente_movimientos`, `expediente_actores`, `expediente_actor_aceptaciones`, y desde movimientos: `movimiento_documentos`, `movimiento_responsables`, `movimiento_notificaciones`. Un solo `DELETE FROM expedientes` (por psql, tinker o un futuro endpoint) borra el expediente **y su propio historial de auditoría**, dejando los archivos físicos huérfanos. Para datos probatorios el patrón correcto es `ON DELETE RESTRICT` + soft-delete. Hoy no hay código que borre expedientes, pero la BD no defiende la evidencia.

### C5 — Envío espontáneo por mesa de partes: el ciudadano presenta y NO recibe cargo ni constancia
`PortalController::enviarDocumento` (`:822-905`) fuerza `genera_cargo=false` (`:863`). El ciudadano que presenta documentos a su expediente recibe solo un JSON ("Tu envío fue registrado… quedará disponible cuando el responsable lo acepte", `:903`, además con tuteo). Sin número de cargo, sin fecha cierta oponible, sin correo. El movimiento queda `pendiente_aceptacion` y el gestor puede **rechazarlo** (`EnvioExternoController::rechazar`) sin acuse al presentante. La única huella (`expediente_historial` `envio_externo_recibido`) es interna, no una constancia entregada al administrado.
**Impacto legal:** la fecha de presentación puede ser determinante para plazos; presentar sin cargo es la brecha de constancia más grave del sistema.

### C6 — Un usuario puede autodestruir su participación probatoria (hard delete con cascada)
`ProfileController::destroy` (`ProfileController.php:56`, ruta `DELETE /profile`, solo `auth`+`verified`) hace `$user->delete()`. Los actores externos validados reciben cuenta `User` real, y la FK `fk_actor_usuario ... ON DELETE CASCADE` arrastra `expediente_actores` → `expediente_actor_emails`, `expediente_actor_aceptaciones` (IP, user-agent, quién validó — la prueba del emplazamiento y de la validación OTP). Un demandado validado que aún no responde puede **borrar su cuenta y desaparecer del expediente sin dejar rastro** (no se escribe nada en el historial). Debería ser baja lógica, como sí hace `Configuracion/UsuarioController.php:97`.

---

## Hallazgos ALTOS

### A1 — Ruta de auditoría del portal sin control de permisos
`routes/web.php:244-247` — `/auditoria/portal` y `/auditoria/portal/cargo/{n}` están solo bajo `auth`+`verified`, **sin `permiso:`** (el propio comentario lo admite como pendiente). `AuditoriaPortalController::index` devuelve el log completo: emails, DNIs, nombres RENIEC, IPs, números de cargo, sin filtrar por el usuario que consulta. Como las cuentas externas se crean con rol `usuario` y login activo, **cualquier parte externa o rol interno de bajo privilegio puede cosechar los datos personales de todos los usuarios del portal**. Corrección: añadir `middleware('permiso:auditoria.portal,ver')`.

### A2 — Edición ilimitada de la solicitud presentada, sin conservar valores previos
`ExpedienteController::updateSolicitud` (`:227-315`, JPRD `:321-379`, ruta `PUT /expedientes/{e}/solicitud`) permite al gestor reescribir en cualquier momento —incluso con el expediente concluido/suspendido y la solicitud ya conforme— nombres, documentos de identidad, domicilios, `resumen_controversia`, `pretensiones`, `monto_involucrado`, y sobrescribe `users.name/email`. El historial guarda **solo los nombres de los campos** (`:305-312`), no los valores. Sin versionado, **el contenido originalmente presentado (acto con cargo emitido) es irrecuperable tras la primera edición.**

### A3 — Los documentos de movimiento no tienen hash de integridad
`movimiento_documentos` (esquema verificado) no tiene `hash_sha256` ni `mime_type` ni `ip_subida`. Son el grueso de la evidencia procesal (respuestas por portal, envíos, sustentos de rechazo/cancelación) y **carecen de huella de integridad**: un reemplazo del archivo físico sería indetectable. La tabla `documentos` (adjuntos de solicitud) sí calcula SHA-256 en `Documento.php:51-66`, pero es "best effort": si no encuentra el archivo, crea el registro sin hash y sin error. No existe ningún job/comando que verifique hashes posteriormente.

### A4 — No existe foliación ni orden sellado
Grep de "folio" en todo el código: cero resultados. No hay numeración correlativa de documentos dentro del expediente ni cierre/sellado. El orden depende de `id` autoincremental y `created_at` (`timestamp` sin TZ, mutable por UPDATE, sin sellado de tiempo firmado/TSA). Combinado con A3, el expediente no puede demostrar hoy que su contenido y orden no fueron alterados.

### A5 — Ninguna descarga/consulta de documentos se registra
Ni `DocumentoController::descargar` ni `PortalController::descargarDocumento` escriben en historial, log ni auditoría; los eventos de `AuditoriaPortal` no incluyen descargas. **No es posible responder "quién accedió a qué documento y cuándo"** — requisito central de trazabilidad de la evidencia.

### A6 — El permiso `puede_ver` por tipo de actor no se aplica en el servidor
El pivot `tipo_actor_tipo_documento.puede_ver` solo se envía al frontend para filtrar la UI (`ExpedienteController.php:186-201`); `DocumentoAcceso` nunca lo consulta. Cualquier actor activo del expediente puede descargar por URL directa (`/documentos/{id}/descargar`) **cualquier** documento del expediente, incluidos los que su tipo de actor no debería ver. La granularidad configurada es cosmética.

### A7 — Colisión de espacio de IDs entre las dos tablas de documentos
`DocumentoAcceso::resolver()` (`:33-36`) hace `Documento::find($id) ?? MovimientoDocumento::find($id)`, y el frontend usa un único `doc.id` para ambas tablas. Las secuencias son independientes y sus rangos se solapan (`documentos_id_seq=8`, `movimiento_documentos_id_seq=17`). Cuando coincidan, el enlace de un documento de movimiento **servirá silenciosamente el documento de solicitud del mismo id** (o dará 403 a una parte). Hoy no hay colisión materializada, pero es estructuralmente inevitable al crecer los datos.

### A8 — La mayoría de los correos no deja registro persistente
Solo cédulas y recordatorios escriben en `movimiento_notificaciones`. Todos los demás `Mail::send` son "al vuelo" con `try/catch → Log::warning`: acceso a mesa de partes (`MovimientoService.php:233-239` — y el historial "Se habilitó acceso" se escribe **aunque todos los correos hayan fallado**), credenciales del expediente, cargo de respuesta al actor (`PortalController.php:759-767`), OTP, confirmaciones de solicitud. Para credenciales y cargos (actos de notificación/constancia) no puede probarse a quién ni cuándo se envió.

### A9 — Extensión de plazo: cálculo en calendario ignorando `tipo_dias`, y deja las filas hijas bloqueadas
`MovimientoController::extenderPlazo` (`:349`) usa `now()->addDays(...)` siempre en días **calendario**, aun si el movimiento es `habiles` (y la fila de auditoría graba el `tipo_dias` original, contradiciendo el cálculo). Además no reabre las filas `movimiento_responsables` en `vencido`; como `responder()` solo acepta filas `pendiente`, **el actor con plazo extendido sigue sin poder entregar**. Tampoco se le notifica la nueva fecha.

### A10 — Respuestas tardías aceptadas como oportunas, sin marca de extemporaneidad
`responder()` solo verifica `estado==='pendiente'` (`PortalController.php:469`); **no compara `now()` contra `fecha_limite`**. Una respuesta enviada tras el vencimiento pero antes de que el cron de las 07:00 marque `vencido` se registra como normal, sin marca de extemporánea (el concepto no existe en el modelo). La fecha efectiva de preclusión depende de la hora de un cron.

### A11 — El contador de correlativos es editable por UI sin auditoría
`CorrelativoController::store/update` (`:41,75,89,120`) aceptan `ultimo_numero` arbitrario, sin registrar el cambio. Retrocederlo hace colisionar cada cargo nuevo contra el unique (500 → mesa de partes inoperativa); adelantarlo fabrica huecos "legales". La garantía de correlativo sin huecos depende de un campo editable a mano.

### A12 — Toggle admin apaga silenciosamente el cargo de respuestas ciudadanas
Si el admin desactiva el tipo `respuesta_requerimiento` en Configuración, `PortalController::responder` hace `if ($cargo)` silencioso (`:691-693`): la respuesta se registra, el ciudadano recibe "éxito", pero **no hay cargo, no hay correo, no hay log**. Los flujos de solicitud sí abortan en ese caso — el doble estándar muestra que el diseño reconoce el problema. Hoy el tipo está activo, así que no ocurre.

### A13 — Configuración sin bitácora y con hard-deletes
Cambios en etapas, servicios, tipos de actor/documento, correlativos, roles, permisos y módulos no dejan ninguna bitácora, y varios borran físicamente (`ModuloController.php:72-73`, `TipoDocumentoController.php:170`, `TipoActorController.php:130`). Cambiar una etapa o un permiso de visibilidad de documentos afecta a expedientes sin rastro de quién/cuándo.

### A14 — Borrado físico de la evidencia de validación de correo
`ExpedienteActorController.php:435-437` y `:531-533` hacen `ExpedienteActorAceptacion::...->delete()`, destruyendo `ip_address`, `user_agent`, `portal_email`, `validado_por_user_id`. El historial anota el evento pero la evidencia original se pierde; debería ser revocación lógica.

---

## Hallazgos MEDIOS (resumen)

- **M1 — `trustProxies(at: '*')`** (`bootstrap/app.php:15`): Laravel confía en `X-Forwarded-For` de cualquier cliente. Permite falsificar la IP que alimenta rate-limits y el rastro legal (`ValidacionDocumento.ip`, `AuditoriaPortal`, `ExpedienteActorAceptacion.ip_address`). Fijar el CIDR del balanceador.
- **M2 — Captcha "falla-abierto"** (`CaptchaValidator.php:20-22`): si `HCAPTCHA_SECRET` está vacío, todos los checks pasan. En producción debe fallar-cerrado.
- **M3 — Auto-verificación de correo sin verificar** (`SolicitudArbitrajeController.php:281`): en la rama anónima se marca `email_verified_at=now()` sin verificación real.
- **M4 — OTP en claro** (`PortalController.php:295-305,335-337`): el código se guarda y compara en texto plano. Hashearlo.
- **M5 — Cargo de respuesta condicionado a `genera_cargo` por-movimiento** (vía latente): la decisión de si un ciudadano recibe cargo no debería vivir en un flag overrideable por la contraparte procesal.
- **M6 — Email de cargo de respuesta imprime `now()`** del envío del correo, no `created_at` del cargo (`cargo-respuesta.blade.php:32-33`): la hora del acuse difiere del registro oficial.
- **M7 — Sin PDF de cargo ni verificación pública**: `generarCargo()` con dompdf es código muerto; `/mesa-partes/confirmacion/{numeroCargo}` renderiza cualquier string sin validarlo contra BD (`MesaPartesController.php:61-66`). No hay endpoint para que un tercero verifique la autenticidad de un cargo.
- **M8 — Feriados solo 2025–2026**, sin UI de administración ni prórroga a día hábil para vencimientos en calendario que caen en día inhábil. Al cruzar a 2027 los plazos hábiles se acortarán silenciosamente.
- **M9 — Operaciones sobre expedientes no activos sin bloqueo**: `resolver`, `extenderPlazo`, `cancelarAuto`, `aceptar/rechazar`, `cambiarEtapa`, `updateSolicitud`, `responder` y `enviarDocumento` no verifican el estado; un expediente concluido sigue recibiendo actos.
- **M10 — Cancelación de movimiento auto ya `respondido`** es posible (`MovimientoController.php:262-265`), pisando el estado que acredita la respuesta; además el mensaje de éxito contradice lo que hace el service.
- **M11 — Flag `activo` en documentos y movimientos como vector de ocultamiento**: un UPDATE en BD oculta un documento o un acto procesal de todas las vistas sin evento de historial.
- **M12 — Sin acuse de recepción real**: `estado='enviado'` solo prueba entrega al relay SMTP; no hay webhook de bounce ni reintentos de filas `fallido`.
- **M13 — 500 MB por archivo** en formularios públicos, sin límite agregado ni antivirus.
- **M14 — Varios writes de historial fuera de la transacción** de su mutación (`updateSolicitud`, `resolver`, `extenderPlazo`, `suspender/reactivar/concluir`, `ExpedienteActorController::store/destroy/toggleAcceso`): un fallo parcial deja la mutación sin asiento o viceversa.

---

## Hallazgos BAJOS (resumen)

- **B1** — Timezone: `.env` fija `America/Lima` pero `config/app.php:77` cae a `UTC` si falta la variable; conviene hardcodear el default. Tipos de columna `timestamp` mezclados con `timestamptz`.
- **B2** — Sesión OTP sin expiración absoluta (solo por inactividad).
- **B3** — Vencimientos automáticos atribuidos a `usuario_id = creado_por` (falsa autoría de un acto del sistema); vencimiento de filas pivot sin historial propio.
- **B4** — `AuditoriaPortal::registrar` traga excepciones (fail-open): la operación prosigue aunque la auditoría falle.
- **B5** — Creación de expediente y actores iniciales sin evento explícito; movimientos por auto-traslado sin historial; subsanación respondida (`MesaPartesController::subsanar`) sin ningún log.
- **B6** — `auditoria_portal` no cubre acciones post-login (responder, enviar doc, descargar), solo autenticación y solicitudes.
- **B7** — Cargos de respuesta sin IP/user-agent (`$request` no se pasa a `Cargo::crear`).
- **B8** — Carrera al crear la fila de correlativo de año nuevo → 500 en la 2.ª presentación concurrente.
- **B9** — `ip_subida` existe pero nunca se puebla; `nombre_original` semi-sanitizado en headers.
- **B10** — Disco local único sin redundancia/backup visible.
- **B11** — Lógica de cómputo de días hábiles duplicada en 3 sitios (riesgo de divergencia; ya divergió en `extenderPlazo`).
- **B12** — `PortalBroadcastAuthController` compara emails sensible a mayúsculas (fail-closed, solo correctness).

---

## Lo que está bien resuelto (no requiere acción)

- Correlativo de cargos **atómico** con `lockForUpdate` + savepoints (sin huecos por rollback), `UNIQUE` sobre `numero_cargo`; secuencia real 001–012 íntegra.
- Flujos de solicitud (arbitraje/JPRD/otros) **transaccionales**, abortan si no hay cargo (0 huérfanos); mail fuera de la transacción en Arbitraje.
- **Movimientos manuales inmutables** (sin endpoint de edición/borrado); cancelación de autos exige motivo + tipo de documento + archivo de sustento + usuario + timestamp, todo en transacción.
- Extensiones de plazo **versionan** valores anteriores en `movimiento_extensiones_plazo`.
- Documentos en **disco privado** (`storage/app/private`), nombres aleatorios de 40 chars, servidos solo por endpoints autorizados con streaming, `nosniff` y re-sniff de MIME.
- Validación de archivos **por contenido real** (MIME sniffing) en el 100% de los uploads.
- Autorización interna sólida: `esGestor` + pertenencia del recurso en todos los controllers de expediente; sin IDOR explotable detectado.
- OTP con buena entropía (`random_int`, 6 díg.), expiración 15 min, bloqueo al 5.º intento, `session()->regenerate()`, 503 si falla el correo.
- Revocación de acceso efectiva en portal (`activo=1 AND acceso_mesa_partes=1`).
- Bajas de actores y emails = lógicas, con historial.
- Recordatorio de vencimiento a 1 día hábil con registro completo (buen patrón de referencia para el resto de correos).

---

## Recomendaciones priorizadas

**Bloqueantes para poder afirmar "trazabilidad e inalterabilidad legal":**

1. **Endurecer el historial en la BD**: usuario de aplicación NO superusuario; `REVOKE UPDATE, DELETE, TRUNCATE` sobre `expediente_historial`, `cargos`, `movimiento_notificaciones`, `expediente_actor_aceptaciones`; quitar `created_at` de `$fillable`. Idealmente hash-chain (cada asiento encadena el hash del anterior) para detección de alteración. **(C3)**
2. **Cambiar los `ON DELETE CASCADE` sobre datos probatorios a `RESTRICT`** y adoptar soft-delete; en particular la FK del historial y `fk_actor_usuario`. Convertir `DELETE /profile` en baja lógica. **(C4, C6)**
3. **Emitir cargo en TODA presentación ciudadana**, incluido el envío espontáneo del portal; nunca depender de un toggle admin para la constancia de recepción. **(C5, A12)**
4. **Anclar el plazo a la notificación**: bloquear la creación de requerimientos con responsables sin destinatarios; recomputar/arrancar `fecha_limite` desde la primera notificación exitosa; alertar al gestor cuando todas las notificaciones queden `fallido`. **(C1, A8)**
5. **Archivar la cédula como PDF inmutable** (dompdf ya instalado) o persistir el HTML renderizado. **(C2)**
6. **Añadir `permiso:` a `/auditoria/portal`.** **(A1)**

**Integridad de la evidencia:**

7. Añadir `hash_sha256` + `mime_type` + `ip_subida` a `movimiento_documentos` y calcularlos al subir; job periódico que verifique hashes. **(A3)**
8. Aplicar `puede_ver` por tipo de actor **en el servidor**; separar los espacios de ID de las dos tablas de documentos (o resolver por tipo, no por id suelto). **(A6, A7)**
9. Registrar cada descarga/visualización (quién, cuándo, IP) en la bitácora. **(A5)**
10. Versionar la solicitud antes de cada edición y bloquear la edición sobre expedientes concluidos. **(A2)**

**Cómputo de plazos y correo:**

11. En `extenderPlazo`: respetar `tipo_dias`, reabrir filas pivot vencidas y notificar la nueva fecha. **(A9)**
12. En `responder()`: comparar `now()` contra `fecha_limite` y marcar/registrar extemporaneidad. **(A10)**
13. Registro persistente de todos los correos (credenciales, cargos, OTP) con estado enviado/fallido; reintentos y alerta. **(A8)**
14. UI de feriados + años futuros + prórroga a día hábil para vencimientos en calendario. **(M8)**

**Hardening:**

15. `trustProxies` con el CIDR del balanceador; captcha fail-closed; OTP hasheado; auditar cambios de correlativo y de configuración. **(M1, M2, M4, A11, A13)**
