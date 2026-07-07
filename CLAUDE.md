# CARD ANKAWA — Contexto para Claude Code

## Stack técnico
- Laravel 12 + Inertia.js + React (JSX) + TypeScript + PostgreSQL
- Tailwind CSS (clases utilitarias, sin CSS custom salvo variables)
- Lucide React para iconos
- Fuente: **Montserrat** es la fuente `sans` por defecto en `tailwind.config.js` (toda la app la hereda). Se carga con pesos `400;500;600;700;800;900` en `app.blade.php` y `app.css` — los `800/900` son obligatorios porque `font-black` (900) los necesita reales, no sintéticos. **No usar `style={{ fontFamily: 'Montserrat' }}` inline** — ya viene del default.

## Reglas críticas de base de datos
- NUNCA ejecutar `php artisan migrate` directamente
- Conectar a PostgreSQL vía psql usando las credenciales del `.env`
- Verificar estructura de tablas con `\d nombre_tabla` antes de cualquier cambio

---

## Identidad visual — The Ankawa Global Group SAC

### Paleta oficial (Manual de Identidad Visual + uso real en código)

| Token              | Hex       | Tailwind token         | Uso en la app                                                              |
|--------------------|-----------|------------------------|----------------------------------------------------------------------------|
| `ankawa-deep`      | `#291136` | `ankawa-deep`          | Texto principal, fondos oscuros, base de gradientes hero                    |
| `ankawa-deep-hover`| `#3D1A52` | `ankawa-deep-hover`    | **Hover state de `#291136`** (botones, modales, badges plum)                |
| `ankawa-plum`      | `#4A153D` | `ankawa-plum`          | Punto medio de gradiente hero (`from-#291136 via-#4A153D to-#BE0F4A`)       |
| `ankawa-rose`      | `#BE0F4A` | `ankawa-rose`          | Acento principal, CTA, bordes activos, tabs activos, iconos destacados      |
| `ankawa-rose-hover`| `#9C0A3B` | `ankawa-rose-hover`    | **Hover state oscuro de `#BE0F4A`** (patrón en ConfirmDialog, Login, etc.)  |
| `ankawa-crimson`   | `#BC1D35` | `ankawa-crimson`       | Hover alternativo de rose (usado en formularios de Mesa de Partes)          |
| `ankawa-muted`     | `#B23241` | `ankawa-muted`         | Focus state (raro — solo en `Auth/Login.jsx`)                                |

**Patrones de hover canónicos**:
- `bg-ankawa-rose hover:bg-ankawa-rose-hover` — pares oscuros, predominante en componentes nuevos
- `bg-ankawa-rose hover:bg-ankawa-crimson` — par cálido, predominante en formularios MesaPartes (legacy, equivalente)
- `bg-ankawa-deep hover:bg-ankawa-deep-hover` — para botones plum/deep

**IMPORTANTE**: los tokens están definidos en `tailwind.config.js` desde abril 2026. Para componentes **nuevos** usar tokens (`bg-ankawa-rose`, `text-ankawa-deep/55`). Los 61 archivos con hex hardcodeado (`bg-[#BE0F4A]`, `text-[#291136]/55`) siguen siendo válidos — equivalentes 1:1 a los tokens, no requieren migración inmediata.

**Colores de soporte (Tailwind estándar)**
- Fondo de página: `bg-gray-50`
- Badge activo: `emerald` (emerald-100 / emerald-700)
- Badge suspendido: `amber` (amber-100 / amber-700)
- Badge concluido: `gray` (gray-100 / gray-600)
- Texto de cuerpo: `gray-600` / `gray-500`
- Bordes sutiles: `gray-200`

### Tipografía (plataformas virtuales)
- **Fuente**: Montserrat (todos los pesos)
- **Títulos de página / hero**: `font-black` (900), tamaño mínimo `text-3xl`, idealmente `text-4xl` o `text-5xl`
- **Subtítulos de sección**: `font-bold` (700), `text-xl` o `text-2xl`
- **Labels y encabezados de tabla**: `font-semibold` (600), `text-sm` uppercase + `tracking-wide`
- **Texto de cuerpo**: `font-normal` (400), `text-sm` o `text-base`
- **Nunca** usar Inter, Roboto, Arial o fuentes del sistema para elementos de marca

### Tono visual
La marca Ankawa es **institucional, elegante y con presencia**. El diseño debe transmitir autoridad legal y profesionalismo. No es minimalista genérico — usa color con intención. Los fondos oscuros con acento rose son la firma visual del sistema.

---

## Patrones de UI para CARD ANKAWA

### Page Hero Header — Páginas de lista (ej: Index.jsx)
```jsx
<div className="bg-white border-b border-gray-200 mb-6">
  <div className="px-6 py-6 border-l-4 border-[#BE0F4A]">
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase">
          {titulo}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta y seguimiento de expedientes
        </p>
      </div>
      {/* Stats pills */}
      <div className="flex gap-2 flex-wrap">
        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#291136]/10 text-[#291136]">
          Activos: {stats.activos}
        </span>
      </div>
    </div>
  </div>
</div>
```

### Page Hero Header — Páginas de detalle (ej: Show.jsx)
```jsx
<div
  className="w-full px-6 py-8 mb-6"
  style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 50%, #BE0F4A 100%)' }}
>
  {/* Breadcrumb */}
  <Link href="/expedientes" className="text-white/60 text-sm hover:text-white/90 flex items-center gap-1 mb-4">
    ← Expedientes
  </Link>
  <div className="flex items-start justify-between flex-wrap gap-3">
    <div>
      <p className="text-white/70 text-sm mb-1">Servicio: {expediente.servicio}</p>
      <h1 className="text-4xl font-black text-white tracking-tight">{expediente.numero}</h1>
      <p className="text-white/70 text-sm mt-1">Etapa: {expediente.etapa_actual}</p>
    </div>
    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30">
      {expediente.estado}
    </span>
  </div>
</div>
```

### Cards de expediente — borde lateral por estado
```jsx
const borderByEstado = {
  activo: 'border-l-emerald-400',
  suspendido: 'border-l-amber-400',
  concluido: 'border-l-gray-300',
};

<div className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${borderByEstado[expediente.estado]} p-5`}>
  {/* Icono en círculo con color Ankawa */}
  <div className="w-10 h-10 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center">
    <Scale className="w-5 h-5 text-[#BE0F4A]" />
  </div>
</div>
```

### Tabs activos
```jsx
// Tab activo: color #BE0F4A, no #291136
<button className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
  activeTab === tab.key
    ? 'border-[#BE0F4A] text-[#BE0F4A]'
    : 'border-transparent text-gray-500 hover:text-[#291136]'
}`}>
```

### Filtros / Pills de filtro activos
```jsx
// Pill activo: fondo #291136 + punto animado #BE0F4A
<button className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 ${
  activeFilter === key
    ? 'bg-[#291136] text-white'
    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
}`}>
  {activeFilter === key && (
    <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse" />
  )}
  {label}
</button>
```

### Iconos con color de marca
```jsx
// Iconos informativos en paneles de detalle
<div className="flex items-center gap-2">
  <Briefcase className="w-4 h-4 text-[#BE0F4A]" />
  <span className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Servicio</span>
</div>
<p className="text-gray-800 font-medium mt-0.5">{valor}</p>
```

---

## Estados obligatorios en componentes

Todo componente que cargue datos DEBE tener los 3 estados:
1. **Loading**: skeleton con `animate-pulse` y bloques `bg-gray-200`
2. **Empty state**: icono + mensaje descriptivo + acción sugerida
3. **Error state**: mensaje claro + botón de reintentar

---

## Reglas generales de desarrollo

- Cambios quirúrgicos: modificar solo lo necesario, no refactorizar código que funciona
- No usar `alert()` — usar toast o feedback inline (cumplido en MesaPartes: react-hot-toast + `ConfirmModal`)
- No usar estilos inline salvo gradientes complejos (`style={{ background: '...' }}`)
- Usar `cn()` de `clsx` para clases condicionales (objetivo; los formularios MesaPartes legacy aún usan template strings)
- Formularios: `react-hook-form` + validación Zod (objetivo; los 4 formularios de MesaPartes aún validan a mano — migración pendiente)
- Tablas con más de 10 registros: paginación obligatoria. El componente `Table` (`resources/js/Components/Table.jsx`) soporta `clientSide` (filtra/ordena/pagina en navegador, para datasets chicos) y modo servidor. **Si el controller no soporta `search/sort/page`, usar `clientSide` + `searchKeys`** (ver `Bandeja.jsx`)
- **Validación de archivos en cliente**: antes de aceptar un upload, filtrar con `filtrarArchivosValidos(files, { mimes: upload_mimes, maxMb: upload_max_mb })` de `resources/js/utils/archivos.js` — rechaza por extensión/tamaño con toast antes de enviar. `upload_mimes`/`upload_max_mb`/`upload_accept` llegan por props de Inertia
- Mobile-first: el hero se apila verticalmente en pantallas pequeñas (`flex-wrap gap-4`). Grids de inputs siempre con breakpoint (`grid-cols-1 sm:grid-cols-N`), nunca `grid-cols-N` fijo
- No crear archivos de migración — toda estructura de BD se verifica directamente con psql
- **Listas mutables con estado local por fila** (ej. filas de consorcio con candado SUNAT): usar clave estable (`_key: crypto.randomUUID()`), NUNCA `key={index}` — y quitar `_key` del payload antes de enviar al backend
- **Inertia `useForm` vs `router.post`**: si el envío usa `router.post` con `FormData` manual, `useForm` NO llena `errors`/`processing`. Leer errores con `usePage().props.errors` y manejar un estado `enviando` propio para deshabilitar el botón (evita doble submit) — ver `ArbitrajeForm.jsx`

---

## Archivos de referencia del proyecto

- `resources/js/Pages/Expedientes/Index.jsx` — lista de expedientes
- `resources/js/Pages/Expedientes/Show.jsx` — detalle con tabs
- [`docs/header-images.md`](docs/header-images.md) — sistema de headers estandarizados (`PageHeader`/`ConfigHeader`), tabla de imágenes `hero-*.jpg` por sección y prompts de IA para generarlas
- [`docs/sesion-branding-ui-2026-07.md`](docs/sesion-branding-ui-2026-07.md) — **contexto completo de la remodelación visual de julio 2026**: tipografía, headers, dashboard, águila de fondo global, sidebar, KPICard `filled`, decisiones de diseño y pendientes. Leer antes de tocar UI
- `app/Http/Controllers/ExpedienteController.php` — controlador principal
- `resources/js/utils/archivos.js` — `filtrarArchivosValidos()` (validación de uploads en cliente)
- `app/Http/Controllers/PortalController.php` — flujo del portal externo (OTP, responder, enviar doc)
- `.env` — credenciales de base de datos para psql

---

## Estado actual del sistema (actualizado junio 2026)

### Motor de Expedientes
- **Doc arquitectónico canónico**: ver [`docs/movimientos.md`](docs/movimientos.md) — toda la lógica de movimientos, primitivas (multi-tipo de doc, opcionales, auto-traslado, cancelación), estados, endpoints, SQL.
- Expedientes con tabs: Solicitud, Actores, Historial, Nuevo Movimiento, Envíos
- Movimientos: tipos `requerimiento` | `propia` | `notificacion` | `envio_externo`; estados `pendiente` | `respondido` | `recibido` | `vencido` | `omitido` | `pendiente_aceptacion` | `rechazado` | `cancelado`
- Componente `MovimientoCard` exportado desde `TabNuevoMovimiento.jsx` — **reutilizar siempre**, nunca duplicar. También exporta `movVacioBase`, `requerimientoVacio` y `GENERA_CARGO_DEFAULT`
- `TabSolicitud.jsx` importa `MovimientoCard`, `movVacioBase` y `GENERA_CARGO_DEFAULT` desde `TabNuevoMovimiento.jsx`
- Payload de creación: `requerimientos: [{ tipo_documento_id, responsables: [{ actor_ids, dias_plazo, tipo_dias, es_opcional }], traslado_auto?: {...} }]`

### Sistema de Cargos
- El correlativo se genera vía tabla `correlativos` + `lockForUpdate` (NO la vieja `cargo_seq`) → formato `CARGO-GEN-2026-001`
- Modelo `app/Models/Cargo.php` — método estático `Cargo::crear($tipo, $cargable, $userId)`; puede retornar `null` si el tipo de evento está desactivado en Configuración → Tipos de Cargo (los callers deben manejarlo)
- `genera_cargo` (boolean) en `expediente_movimientos`; default `true` para `requerimiento`, `false` para los demás
- El cargo de respuesta se emite en `PortalController::responder()` (única vía de respuesta — Mesa de Partes) si `$movimiento->genera_cargo === true`
- **Las respuestas a requerimientos solo se hacen desde Mesa de Partes** — el flujo de respuesta en Expediente Electrónico fue removido (los actores responden vía portal externo con OTP)
- **Todos los controllers que crean movimientos deben pasar `genera_cargo`**: `MovimientoController::store()`, `storeLote()`, `ExpedienteController::registrarConformidad()`

### Configuración — Módulo de Tipos de Actor
- **Una sola página**: `resources/js/Pages/Configuracion/TiposActor/Index.jsx` — tabla con columnas: Nombre | Servicios donde participa | Estado | Acciones
- Cada tipo de actor puede estar en uno o más servicios (pivot `servicio_tipos_actor`)
- Pivot tiene: `es_automatico`, `permite_externo`, `rol_auto_slug`, `orden`, `activo`
- **Auto-asignar**: al crear el expediente, el sistema busca el usuario con el `rol_auto_slug` que tenga menor carga y lo asigna. El rol se selecciona desde un `<select>` con los roles activos del sistema.
- **Demandante/Demandado**: slugs `demandante` / `demandado` — inmutables, se asignan desde el formulario de solicitud en todos los servicios, no requieren configuración de pivot.
- `TipoActorController::syncServicios()` — guarda la config de todos los servicios de un actor en bulk
- No existe página separada "Actores por Servicio" — fue consolidada en Tipos de Actor

### Configuración — Tipos de Documento
- `resources/js/Pages/Configuracion/TiposDocumento/Index.jsx` — tabla con componente `Table`
- Pivot `servicio_tipo_documento` incluye `es_para_solicitud` (si aparece como opción en el formulario público)
- Pivot `tipo_actor_tipo_documento` incluye `puede_ver`, `puede_subir`
- `TipoDocumentoController` — métodos: `index`, `store`, `update`, `destroy`, `syncServicios`, `syncActores`

### Menú / Navegación
- Tabla `modules` (no `modulos`) — `parent_id=1` para hijos de Configuración
- Permisos en `rol_modulo_permiso` — al eliminar un módulo de `modules`, borrar también sus registros huérfanos en `rol_modulo_permiso`
- Middleware `permiso:` valida por slug del módulo

### Servicio "Otros"
- `SolicitudOtros` + `Cargo` directo, sin expediente ni actores
- Form: `resources/js/Pages/MesaPartes/Formularios/OtrosForm.jsx` — filtra tipos de documento con `es_para_solicitud=true`

### Emails
- Templates en `resources/views/emails/` — todos usan `@include('emails.partials.logo')`
- Logo embebido como base64 en `resources/views/emails/partials/logo.blade.php` — **nunca usar `asset()` o `url()` para imágenes en emails**
- `QUEUE_CONNECTION=database` — usar `Mail::send()` no `Mail::queue()` (verificado en todo el flujo, incl. servicio "Otros")
- **Mail fuera de transacciones**: `Cargo::crear` toma `lockForUpdate` sobre el correlativo global; enviar el mail DENTRO de la `DB::transaction` bloquea la emisión de cargos de todo el sistema si el SMTP es lento. Capturar el cargo dentro de la TX y enviar el mail DESPUÉS del commit (patrón en `PortalController::responder()` y `SolicitudArbitrajeController`)
- **Etiqueta canónica "Sumilla"** para `movimiento->instruccion` en todos los blade. NO usar "Sumilla" para otros campos (servicio, tipo de actor → usar "Servicio" / "Participa como")
- **"Número de Cargo"** es la etiqueta única del identificador `CARGO-GEN-...` en todos los emails y pantallas (antes había "Número de Registro" / "N° Cargo" mezclados). La cédula de notificación se etiqueta "Cédula de Notificación", no "Número de Registro"

---

## Mesa de Partes / Portal externo — reglas de endurecimiento (junio 2026)

> **Deuda técnica planificada**: ver [`PENDIENTES.md`](PENDIENTES.md) — refactors pendientes (lookups de ArbitrajeForm, multi-tipo, migración a react-hook-form+Zod, dedup de ArbitrajeEmergenciaForm) con el contexto de por qué quedaron pendientes y por qué conviene hacerlos. Lo ya hecho: helper `utils/consultaDocumento.js`, hook `hooks/useDocumentoLookup.js` (JPRD migrado), `Components/FilePreviewModal.jsx`, `Components/OtpLoginFlow.jsx`.

Auditoría de seguridad, lógica, contenido y marca aplicada al flujo público. Reglas a respetar:

### Seguridad y lógica de backend
- **Ventanilla multi-correo**: un actor puede tener varios correos (consorcios). `email_externo` y `expediente_actor_emails.email` se guardan **en minúsculas** (mutators en los modelos `ExpedienteActor` / `ExpedienteActorEmail`). La sesión OTP también compara en minúsculas; contra `users.email` (que puede tener mayúsculas históricas) usar `whereRaw('LOWER(email) = ?')`. NO restringir `actorIdsPorEmail`
- **Actor externo puro** (`usuario_id IS NULL` con `acceso_mesa_partes=1`): al escribir en `expediente_historial`, pasar `usuario_id => $actor->usuario_id` (puede ser `null` — la columna lo permite). NUNCA `?? 0` (viola FK a `users`)
- **Autorización de envíos externos** (`EnvioExternoController`): `aceptar`/`rechazar` exigen ser Gestor (`GestorExpedienteService::esGestor`); `index` exige acceso al expediente electrónico. El `guard()` solo valida coherencia, no permisos
- **`PortalController::responder()`**: buscar el actor del email filtrando por `expediente_id` del movimiento (el mismo correo puede estar en varios expedientes); usar `lockForUpdate` dentro de la TX para evitar doble cargo por doble submit; responde `422` si la entrega ya fue procesada
- **`DocumentoAcceso::portalPuedeVer()`**: exige `activo=1` Y `acceso_mesa_partes=1` (un actor revocado no debe descargar evidencia)
- **OTP** (`PortalController::enviarCodigo`/`verificarCodigo`): invalidar el código al 5.º intento fallido; `session()->regenerate()` al validar (anti fijación); si falla el envío del correo, invalidar el código y responder 503 (no decir "ok"). El throttle vive en `AppServiceProvider` (`portal-otp-enviar`/`-verificar`)
- **`/consulta-documento`** (público): valida formato (DNI 8 díg., RUC 11) antes de llamar a la API externa; rate limit `8/min` + `100/día` por IP
- **Servicio "Otros"** y flujos que crean registro + cargo: envolver en `DB::transaction` (sin cargo, la solicitud queda huérfana)
- Código muerto eliminado: `MesaPartesController::enviarCodigo/verificarCodigo` (versión insegura del OTP) — las rutas apuntan solo a `PortalController`

### Contenido y UX (público: "que cualquiera lo entienda, de 5 a 70 años")
- **Tratamiento "usted"** uniforme en todo el flujo público (no tú, jamás voseo)
- Sin jerga sin explicar: "cargo" = constancia de recepción; glosar demandante/demandado en los formularios; el número de cargo es **copiable** en `Confirmacion.jsx`
- **Requisitos por servicio** en la portada (`Index.jsx`, `REQUISITOS_POR_SLUG`) — no exigir "convenio arbitral" a JPRD u Otros
- **Reenviar código OTP**: ambos logins tienen botón con cuenta regresiva de 60 s + aviso de spam/vencimiento. El captcha es de un solo uso: si el server lo rechaza al reenviar, volver al paso de identidad
- Terminología consistente: "solicitud" (no "trámite"); "documento" (lo que el centro pide) vs "archivo" (el PDF que se sube)
- Cuidar tildes y ortografía en textos públicos y emails

### Marca (cumplimiento estricto de paleta)
- **Cards de selección de servicio** (`ModalServicios`) y todo gradiente: variaciones del gradiente canónico `#291136 → #4A153D → #BE0F4A`. Prohibido azul/rojo/gris genéricos
- Estados de éxito/verificación: `emerald` (no `green`); plazos/avisos neutros: tinte de marca `bg-[#291136]/5` (no `blue`)
- Badges de estado de expediente: spec del manual (`emerald/amber/gray-100/700`, `rounded-full`) con etiqueta capitalizada ("Activo", no "activo" crudo)

### psql
```bash
PGPASSWORD=postgres psql -U postgres -h 127.0.0.1 -d ankawa
```