# Pendiente 2 — Flujo de Conformidad / Admisión y Accesos

> Documento de seguimiento. Resume el trabajo sobre el flujo de **admisión de solicitudes**
> ("Admitir a Trámite" / conformidad) y el **modelo de accesos**, qué se hizo y qué queda.

---

## 1. El problema de origen

Al **"Admitir a Trámite"** una solicitud, el sistema generaba **automáticamente 3 movimientos fijos**
(hardcodeados en la función `iniciarConforme()` de
`resources/js/Pages/Expedientes/Partials/TabSolicitud.jsx`):

1. Notificación **CONFORME** al solicitante.
2. **Traslado** a la parte contraria (emplazado) + habilitar Mesa de Partes.
3. Requerimiento de **apersonamiento** al emplazado.

En el demo, los usuarios dijeron que **no quieren esos 3 fijos**, sino **tener control** de qué
movimientos crear. Eso choca con el principio del proyecto: **"nada hardcodeado"**.

---

## 2. ¿Qué es "Forma 1" y "Forma 2"?

Son las dos maneras que planteamos para "darles control" en la admisión:

- **Forma 1 — Admisión "seca":**
  "Admitir a Trámite" solo marca la solicitud como conforme/admitida. **No crea ningún movimiento.**
  El gestor luego arma lo que quiera desde el tab "Nuevo Movimiento". Lo más simple, pero todo manual.

- **Forma 2 — Admisión + editor vacío con plantillas opcionales** ✅ **(ELEGIDA):**
  "Admitir a Trámite" marca conforme y **abre el editor de movimientos vacío**. El gestor agrega los
  movimientos que necesite. Incluye un botón **"Agregar traslado de emplazamiento (recomendado)"** que
  pre-arma el movimiento de traslado (con habilitar Mesa de Partes a la contraparte) en **un clic**:
  opcional, editable, nunca obligatorio. Da **control** + conserva la **comodidad** del atajo.

---

## 3. Los 3 "interruptores" de acceso (modelo mental clave)

Son **independientes** y suelen confundirse entre sí:

| Interruptor | Qué hace | Cómo se enciende | ¿Necesario para responder? |
|---|---|---|---|
| **Validar correo** (`validado_por_gestor`) | Confirma identidad → **crea la cuenta** del actor + marca el correo verificado | Botón "Validar correo" en *Partes del Proceso* | Prerrequisito de seguridad |
| **Acceso a Mesa de Partes** (`acceso_mesa_partes`) | Portal por **OTP** (código al correo) para **responder requerimientos**. **Sin contraseña** | Movimiento de **traslado** (`habilitar_mesa_partes`) | **SÍ — este es el que importa** |
| **Credenciales / Expediente Electrónico** (`acceso_expediente_electronico`) | Login con **contraseña** a otro portal | `enviar_credenciales_expediente` | **NO** — no se necesita para responder |

**Aclaración clave:** para que una parte **responda** NO se necesitan credenciales (#3). Responde por
**Mesa de Partes con OTP** (#2). El "se rompe" que se veía era por correr un traslado **sin activar**
"habilitar Mesa de Partes" → la parte no recibía nada (porque `notificarActores` solo notifica a quien
tiene `acceso_mesa_partes = 1`).

---

## 4. Flujo correcto de admisión (acordado)

1. **Validar correo** → crea cuenta + verifica correo + log en historial. *(Aún NO da acceso.)*
2. **Admitir a trámite** → marca conforme + log.
3. **Traslado / emplazamiento** (un movimiento) → un clic concede acceso a Mesa de Partes + envía
   cédula/notificación + log. *(El acceso se acopla al **traslado**, no a la validación, para que la
   parte no vea el expediente antes de ser emplazada formalmente.)*
4. *(Opcional)* Apersonamiento.

---

## 5. HECHO en esta sesión

### 5.1 Modelo de accesos — endurecido
- **El UI ya acoplaba el acceso al traslado:** en `TabActores.jsx` los indicadores de acceso son de
  **solo lectura** (*"El acceso se otorga al crear un movimiento de Traslado"*). La función
  `toggleAcceso` estaba **huérfana** (definida, nunca llamada).
- **Guard en backend** (`app/Http/Controllers/ExpedienteActorController.php`, método `toggleAcceso`):
  ya **NO se puede conceder acceso** (ni Mesa de Partes ni Exp. Electrónico) a un **correo sin validar**.
  Mensaje claro al gestor. **Revocar** acceso siempre se permite. *(lint OK)*
- **Removida** la función muerta `toggleAcceso` del frontend (`TabActores.jsx`). *(build OK)*
- **Efecto:** ahora "acceso" implica siempre "validado + con cuenta". El selector de **Responsables**
  (filtra por `a.usuario` + `acceso_mesa_partes`) deja de mostrar estados inconsistentes.

### 5.2 Trabajo relacionado ya hecho antes (misma sesión, mismo flujo)
- **Bug del estado JPRD:** faltaban columnas `resultado_revision`, `fecha_revision`, `revisado_por`,
  `motivo_no_conformidad` en `solicitudes_jprd` **y** en `$fillable` del modelo → la admisión fallaba
  **en silencio**. Corregido (ALTER de tabla + `SolicitudJPRD::$fillable`).
- **Roles procesales dinámicos:** `iniciarConforme()` / `iniciarNoConforme()` ya **no** asumen
  entidad = solicitante; calculan **solicitante vs emplazado** desde `solicitud.rol_solicitante`
  (clave para JPRD, donde el contratista también puede ser el solicitante).
- **Edición de solicitud JPRD** habilitada (`updateSolicitud` con rama JPRD + componente `FormEditJPRD`).
- **Arbitraje de Emergencia:** sin cambios; reusa el modelo/controller de Arbitraje (detecta el servicio
  por slug). Hereda el motor que ya funciona.

---

## 5.3 HECHO — Forma 2 + modelo de correos clarificado (sesión 28-may-2026)

### Decisión de diseño: Mesa de Partes ≠ "acceso completo"
Aclaración clave del usuario que corrige el modelo mental:
- **Mesa de Partes** = la **ventanilla del expediente**. La parte **VE ese expediente** y puede
  **ENVIAR documentos** a él. Login por OTP + DNI, **sin contraseña**, acotado a ese expediente.
  **Multi-correo a propósito:** en un **consorcio**, **cualquiera** de los correos registrados del
  actor puede entrar y enviar. **NO es un privilegio del sistema.**
- **Expediente Electrónico** = acceso con **credenciales (contraseña)**. *Ese* sí es el "acceso" amplio.
- **NO se restringe** la lógica multi-correo. `PortalController::actorIdsPorEmail()` sigue resolviendo
  todos los correos del actor (principal + `expediente_actor_emails`) — es correcto. Solo se mejoró la
  **claridad** de la UI para que no se confundan las dos puertas.

### Cambios aplicados
- **Forma 2 (`TabSolicitud.jsx`):** `iniciarConforme()` ya **no** pre-arma los 3 movimientos fijos —
  abre el editor **vacío**. Nueva función `agregarTrasladoEmplazamiento()` inyecta el traslado
  pre-armado (notificación + `habilitar_mesa_partes` a la contraparte); requiere emplazado **validado**.
  Botón **"Agregar traslado de emplazamiento (recomendado)"** en el panel (solo si aún no hay traslado).
- **Fix sumilla del traslado:** un movimiento = una sumilla, y se notificaba a ambas partes con el
  texto "…al demandado… ha sido emplazado" → el solicitante recibía una cédula con texto ajeno.
  El atajo ahora arma **DOS movimientos**: (1) notificación de **admisión** al solicitante
  (`notificar_a=[solicitante]`), (2) **traslado** al emplazado (`notificar_a=[]`, recibe su cédula vía
  el propio `habilitar_mesa_partes`). Cada uno con su sumilla correcta. Editables/quitables.
- **Aviso suave** (decisión elegida, no bloqueo): al confirmar conforme **sin** un movimiento con
  `habilitar_mesa_partes`, un `window.confirm` avisa pero **deja admitir**. Emplazar después es válido.
- **Botón "Admitir a Trámite"** ya **no** se bloquea por validación del emplazado; la validación se
  exige recién al **agregar el traslado**. Hint informativo (no bloqueante) si falta validar.
- **Leyenda del checkbox `habilitar_mesa_partes` (`TabNuevoMovimiento.jsx`):** subtítulo permanente
  *"Ventanilla del expediente: la parte verá ESTE expediente y podrá enviar documentos (cualquiera de
  sus correos). No son credenciales de Expediente Electrónico."*
- **`TabActores.jsx`:** tooltips de los dos indicadores reescritos (Mesa de Partes con conteo de
  correos que pueden entrar; Exp. Electrónico = credenciales) + nota al pie "Dos accesos distintos".
- **Build OK** (vite).

---

## 6. LO QUE SIGUE (pendiente)

### 6.2 Limpiar dato inconsistente en BD local
Identificar y limpiar el/los actor(es) con `acceso_mesa_partes = 1` pero **sin validar / sin cuenta**
(data sembrada de pruebas). La app ya no produce ese estado. Decidir: revocar el acceso o validar bien al actor.

### 6.3 Restricción conocida (NO tocar sin testeo)
El detalle rico del requerimiento (`requerimientos` / `responsables`) que arma el `MovimientoCard`
**no se serializa** en `confirmar()` de la conformidad. El **apersonamiento funciona igual** porque se
cierra por la vía **"sin pivot"** (`app/Http/Controllers/PortalController.php`, ~línea 540).
Serializarlo (para guardar el detalle completo) es **riesgoso**: crearía una fila de responsable "sin
tipo de documento" que la lógica de respuesta **no sabe cerrar** → el apersonamiento quedaría
"pendiente" para siempre. Si se quiere, es **tarea aparte con testeo** (toca el flujo canónico).

---

## 7. Archivos clave de referencia
- `resources/js/Pages/Expedientes/Partials/TabSolicitud.jsx` — panel de conformidad, `iniciarConforme()`, `confirmar()`.
- `resources/js/Pages/Expedientes/Partials/TabNuevoMovimiento.jsx` — `MovimientoCard` (editor de movimientos reutilizable) + `movVacioBase`.
- `resources/js/Pages/Expedientes/Partials/TabActores.jsx` — Partes del Proceso, indicadores de acceso (solo lectura).
- `app/Http/Controllers/ExpedienteController.php` — `registrarConformidad()` (admisión), `updateSolicitud()`.
- `app/Http/Controllers/ExpedienteActorController.php` — `validar()`, `toggleAcceso()` (con el nuevo guard).
- `app/Services/MovimientoService.php` — `crear()`, `habilitarMesaPartes()`, notificaciones.
- `app/Http/Controllers/PortalController.php` — respuesta por Mesa de Partes (incluye la vía "sin pivot").
