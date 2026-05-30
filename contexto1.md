# Contexto 1 — Admisión "Forma 2" + Modelo de Accesos (Mesa de Partes)

> Resumen de la sesión. Cubre: el rediseño de **"Admitir a Trámite"** (Forma 2), la aclaración
> del **modelo de accesos** (Mesa de Partes vs Expediente Electrónico) y los **fixes de notificación/sumilla**.
> Documento de traspaso para continuar sin perder el hilo.

---

## 1. El modelo de accesos (concepto clave)

Hay **dos puertas distintas** al expediente. No confundirlas:

| | **Mesa de Partes** | **Expediente Electrónico** |
|---|---|---|
| Qué es | La **ventanilla del expediente** | Portal con **credenciales** |
| Para qué | La parte **VE ese expediente** y puede **ENVIAR documentos** a él | Acceso con **contraseña** |
| Login | OTP al correo + DNI, **sin contraseña**, acotado a ese expediente | Usuario + contraseña |
| Multi-correo | **SÍ, a propósito** — en un **consorcio**, cualquiera de los correos registrados del actor puede entrar y enviar | Acá sí conviene controlar fino |
| Flag en BD | `acceso_mesa_partes` (en `expediente_actores`) | `acceso_expediente_electronico` |

**Conclusión de diseño:** Mesa de Partes **NO** es un "acceso privilegiado" — es solo "ver y enviar a
ese expediente". El multi-correo es una **feature** (consorcios), no un riesgo. Por eso **NO se restringe**
`PortalController::actorIdsPorEmail()` (sigue resolviendo principal + `expediente_actor_emails`). Lo que
se mejoró fue la **claridad de la UI**, no la lógica.

**Los 3 interruptores (independientes):**
1. **Validar correo** (`validado_por_gestor`): confirma identidad → crea la cuenta del actor. *Prerrequisito.*
2. **Acceso a Mesa de Partes** (`acceso_mesa_partes`): se concede con el movimiento de **traslado**
   (`habilitar_mesa_partes`). **Es el que importa para que la parte vea/responda.**
3. **Credenciales / Exp. Electrónico** (`acceso_expediente_electronico`): login con contraseña. **No**
   se necesita para responder.

> El acceso se acopla al **traslado**, no a la validación, para que la parte no vea el expediente antes
> de ser emplazada formalmente.

---

## 2. Forma 2 — "Admitir a Trámite"

### Antes (problema)
Al "Admitir a Trámite", `iniciarConforme()` pre-armaba **3 movimientos fijos hardcodeados**
(notificación conforme + traslado + apersonamiento). Los usuarios pidieron **control**; choca con el
principio "nada hardcodeado".

### Ahora (elegido e implementado)
- **"Admitir a Trámite" abre el editor de movimientos VACÍO.** El gestor arma lo que necesite.
- Botón **"Agregar traslado de emplazamiento (recomendado)"** = atajo opcional para emplazar en un clic
  (ver §3). Editable y quitable.
- **Aviso suave** (no bloqueo): si confirmas conforme **sin** un movimiento que habilite Mesa de Partes,
  un `window.confirm` avisa pero **deja admitir** (emplazar después es válido).
- El botón "Admitir a Trámite" **ya no se bloquea** por la validación del emplazado; la validación se
  exige recién al **agregar el traslado**. Hint informativo (no bloqueante) si falta validar.

---

## 3. El atajo "Agregar traslado de emplazamiento" → DOS movimientos

Un movimiento = **una sola sumilla**. No se puede notificar a dos partes con un mismo texto. Por eso el
atajo arma **dos** movimientos, cada uno con su cédula correcta:

| # | Movimiento | Destinatario | `notificar_a` | `habilitar_mesa_partes` | Sumilla |
|---|---|---|---|---|---|
| 1 | Notificación de **admisión** | Solicitante (ya tiene acceso) | `[solicitante]` | — | "Admisión a trámite: …admitida a trámite y se ha corrido traslado a la contraparte." |
| 2 | **Traslado** / emplazamiento | Emplazado (demandado) | `[]` | ✅ `[emplazado]` | "Traslado de la solicitud al demandado: …ha sido emplazado… Se habilita Mesa de Partes…" |

**Por qué el traslado (mov. 2) lleva `notificar_a = []`:** el emplazado recibe su cédula **a través del
propio `habilitar_mesa_partes`**. El backend (`MovimientoService::crear`, líneas ~157-166) agrega al actor
recién habilitado a la lista de notificación **en el mismo acto** de concederle acceso. Si además lo
pusiéramos en `notificar_a`, se duplicaría.

---

## 4. Mecánica de notificación (por qué el demandado no aparece en "Notificar por email")

- La lista **"Notificar por email"** (`NotificacionService::actoresNotificables`) filtra por
  `acceso_mesa_partes = 1` → **solo lista a quien YA tiene acceso al portal**.
- El **demandante** tiene acceso desde que presentó la solicitud → aparece.
- El **demandado** aún no → **no aparece** hasta que el traslado le concede acceso.
- El demandado se notifica **emplazándolo** (sección "Habilitar acceso a Mesa de Partes" del traslado),
  que en un solo acto le **da acceso + envía la cédula**. Desde ese movimiento en adelante, ya aparece
  en "Notificar por email" para movimientos futuros.

**Es correcto por diseño.** Regla: *"al portal solo recibe cédula quien tiene Mesa de Partes; la primera
vez, el emplazado la recibe en el mismo movimiento que le da el acceso (el traslado)."*

---

## 5. Cambios de UI (claridad de las dos puertas)

- **`TabNuevoMovimiento.jsx`** — checkbox `habilitar_mesa_partes` con subtítulo permanente:
  *"Ventanilla del expediente: la parte verá ESTE expediente y podrá enviar documentos (cualquiera de sus
  correos). No son credenciales de Expediente Electrónico."*
- **`TabActores.jsx`** — tooltips de los dos indicadores reescritos (Mesa de Partes con conteo de correos
  que pueden entrar; Exp. Electrónico = credenciales) + nota al pie "Dos accesos distintos".

---

## 6. Archivos tocados

- `resources/js/Pages/Expedientes/Partials/TabSolicitud.jsx`
  — `iniciarConforme()` (editor vacío), `agregarTrasladoEmplazamiento()` (2 movimientos),
    aviso suave en `confirmar()`, botón "Admitir a Trámite" sin bloqueo, banner del paso conforme.
- `resources/js/Pages/Expedientes/Partials/TabNuevoMovimiento.jsx`
  — leyenda del checkbox de Mesa de Partes.
- `resources/js/Pages/Expedientes/Partials/TabActores.jsx`
  — tooltips e indicadores separados + nota al pie.

**Build:** OK (vite). **Lógica backend de multi-correo:** intacta (a propósito).

---

## 7. Datos de prueba creados (entorno local)

Solicitud de arbitraje de prueba creada por el flujo real (`SolicitudArbitrajeController::store`):

- **Expediente:** `Exp. N° 002-2026-ARB-CARD ANKAWA` (id 2)
- **Cargo:** `CARGO-GEN-2026-012`
- **Demandante:** `cjrmac0706@gmail.com` (cuenta existente: ROJAS MACO, CESAR JESUS — validado, Mesa de Partes ya)
- **Demandado:** `crojasmac@unprg.edu.pe` (sin validar al inicio; Mesa de Partes se otorga al emplazar)
- **Gestor:** Sheyla Katya Kancha Castañeda (`secretaria.adjunta@ankawagroup.org`)

> Ojo: ambos correos son reales y `MAIL_MAILER=smtp` → al confirmar se envían correos de verdad.

---

## 8. Pendiente / próximos pasos

- **Restricción conocida (no tocar sin testeo):** el detalle rico de `requerimientos`/`responsables` del
  `MovimientoCard` no se serializa en `confirmar()` de la conformidad. El apersonamiento funciona por la
  vía "sin pivot" (`PortalController`, ~línea 540). Serializarlo es **tarea aparte con testeo**.
- Limpiar data inconsistente local: actores con `acceso_mesa_partes=1` pero sin validar (data de pruebas
  vieja; la app ya no produce ese estado).
- Probar el flujo completo de punta a punta (validar demandado → traslado → confirmar → llegada de
  cédulas correctas a cada parte).

---

## 9. Archivos de referencia

- `resources/js/Pages/Expedientes/Partials/TabSolicitud.jsx` — conformidad, `iniciarConforme()`, `agregarTrasladoEmplazamiento()`, `confirmar()`.
- `resources/js/Pages/Expedientes/Partials/TabNuevoMovimiento.jsx` — `MovimientoCard`, `movVacioBase`.
- `resources/js/Pages/Expedientes/Partials/TabActores.jsx` — Partes del Proceso, indicadores de acceso.
- `app/Http/Controllers/ExpedienteController.php` — `registrarConformidad()`, `show()`.
- `app/Http/Controllers/ExpedienteActorController.php` — `validar()`, `toggleAcceso()`, gestión de correos.
- `app/Services/MovimientoService.php` — `crear()`, `habilitarMesaPartes()`.
- `app/Services/NotificacionService.php` — `actoresNotificables()`, `notificarActores()`.
- `app/Http/Controllers/PortalController.php` — login OTP, `actorIdsPorEmail()`, respuesta por Mesa de Partes.
