# Contexto 2 — Refactorización UI/UX y arquitectura de Configuración

Registro de todo lo trabajado en esta sesión sobre **CARD ANKAWA** (Laravel 12 + Inertia + React + Tailwind + PostgreSQL).

---

## 1. CRUD de Tipos de Documento — limpieza y rediseño

- **Slug oculto** al usuario final (se sigue generando en backend, solo dejó de mostrarse).
- **Formato / Tamaño eliminados de la UI**: se confirmó que la validación de archivos es **global** (`config/uploads.php` + `App\Support\FileRules`), no por tipo. Esas columnas (`formatos_permitidos`, `tamanio_maximo_mb`) eran campos muertos en la UI → se quitaron de tabla y modal. El backend usa los valores globales por defecto.
- **Columna Servicios/Actores rediseñada**: de "badge tipo botón" a **tags suaves** (fondo blanco, borde notorio, `rounded-lg`), con color que **significa algo**:
  - Actor **puede ver** → badge **verde** (emerald) con ícono 👁.
  - Actor **se le puede requerir** → badge **ámbar** con ícono ⬆.
  - Marcador **Solicitud** (servicio) → rose con ícono ✉.
- Leyenda "Significado:" con los íconos explicados.

## 2. Filtros y búsqueda normalizados (todas las CRUD de Configuración)

- **Búsqueda a la derecha** de la tabla (se modificó el componente `Table` compartido, modo retrocompatible).
- **Filtros como `CustomSelect`** (no pills), con etiqueta **"Filtrar por:"** + ícono de embudo.
- Filtros por tabla según su data:
  | Tabla | Filtros |
  |---|---|
  | Usuarios | Estado · Rol |
  | Roles, Servicios, Tipos de Documento, Tipos de Actor, Módulos | Estado (+ Servicio donde aplica) |
  | Correlativos | Estado · Servicio · Tipo |
  | Tipos de Cargo | Estado · Emisión de cargo |
  | Etapas | Estado (sobre el servicio seleccionado) |
- **Client-side**: los controladores de catálogo pasaron de `paginate()` a `->get()` (una sola consulta; filtrado/búsqueda/orden/paginación en el navegador). Justificado por ser catálogos chicos.

## 3. Header (Navbar) — refactor a barra blanca

`resources/js/Components/Navbar.jsx`:
- Fondo **blanco**, línea inferior **oscura de marca** (`border-b-2 border-[#291136]`).
- De izquierda a derecha: **hamburguesa** (toggle sidebar) → **logo a color** (`/logo.png`, agrandado 1.5× → `h-[4.5rem]`, header `h-20`) → divisor → **título** ("Mesa de Partes Virtual" / "Expediente Electrónico") → **búsqueda** 🔍 + **notificaciones** 🔔 (con punto de no leídas) → **usuario** con **ícono de persona** (no iniciales) + nombre/email + menú (cerrar sesión).
- El menú de navegación horizontal salió del header (vive en el sidebar).

## 4. Sidebar (nuevo)

`resources/js/Components/Sidebar.jsx`:
- **Degradado oscuro de marca** (`#291136 → #4A153D`) — presencia Ankawa sin saturar.
- Navegación desde `auth.menu` (respeta permisos del backend): enlaces directos + **grupos acordeón** con **animación de altura suave** (truco `grid-rows-[0fr]→[1fr]` + fade). Activo en rose.
- **Pie discreto** con logo blanco + firma de la empresa.
- Controlado por la hamburguesa (estado en `AuthenticatedLayout`).
- **Responsive**: en escritorio forma parte del flujo y colapsa su ancho; en móvil es drawer con backdrop.
- **Se colapsa al navegar** (listener `router.on('navigate')`).

## 5. Headers de página — `ConfigHeader` (serif premium)

- Se decidió **subir todo al header serif premium** (Fraunces + breadcrumb + marca de agua), igual que Expedientes.
- **NO se modificó `PageHeader`** (lo usa Expedientes). Se creó **`resources/js/Components/ConfigHeader.jsx`**: mismo lenguaje serif + **slot de acción** (botón "Nuevo X") + marca de agua en esquina inferior derecha (para no chocar con el botón).
- **CTA estandarizado** y proporcional al título (px-6 py-3.5, rojo de marca), centralizado vía prop `action={{ label, onClick, icon }}`.
- Aplicado a las 9 pantallas de Configuración. Contenido centrado en `max-w-6xl mx-auto`.

## 6. Tipos de Actor — columna "Servicios donde participa"

- Volvió como **columna propia** (no debajo del nombre). Diseñada para **máximo 3 servicios**: columnas **ajustadas a su contenido** (`w-px whitespace-nowrap`), repartiendo el sobrante entre Nombre y Servicios (sin columna espaciadora ni huecos).
- Acciones **adaptadas a datos** (botones `p-2`, sin anchos fijos).

---

## 7. Confirmaciones con SweetAlert2

Se reemplazó el `ConfirmDialog` propio por **SweetAlert2 tematizado**.

- Librería: `sweetalert2` (instalada).
- Helper: **`resources/js/lib/swalAnkawa.js`**
  - `confirmar({ variant, titulo, mensaje, detalles, confirmText })` → 3 variantes:
    - `warning` (crear) = rose, ícono pregunta.
    - `info` (editar/guardar) = plum, ícono info.
    - `danger` (desactivar) = rose alerta.
  - Atajos: `confirmarDesactivar`, `confirmarReactivar`.
  - **Siempre muestra un resumen** de lo que se hará (mensaje + caja de detalles).
  - Botones controlados por Tailwind (`buttonsStyling: false`) → no se ve el SweetAlert genérico.
- Migradas **las 9 pantallas** (crear/editar + desactivar). Toasts (`react-hot-toast`) intactos para el aviso final.
- **Excepción intencional**: el modal "Servicios donde participa" (Tipos de Actor) guarda directo + toast, sin SweetAlert (es guardado de config, no destructivo).
- **Tailwind** ahora escanea `resources/js/**/*.js` (para que se generen las clases del helper).
- **Fix importante**: cuando hay un modal (Headless UI `Dialog`, `id="modal"`) abierto, el SweetAlert se renderiza **dentro** del modal (`target: #modal`) para no pelear con su focus-trap (causaba que se reabriera al cancelar).

## 8. Validación client-side con Zod

Arquitectura confirmada: **doble validación**.
- **Client-side (Zod)** → UX instantánea, errores **en línea, todos a la vez**, con estilo de marca.
- **Server-side (Laravel)** → la verdad/seguridad; nunca se confía solo en el cliente.
- Se eligió **Zod + Inertia `useForm`** (no react-hook-form, redundante con Inertia).

- Librería: `zod`.
- Helper: **`resources/js/lib/validar.js`**
  - `validarZod(schema, data, { setError, clearErrors })` → mapea issues de Zod a `setError` (errores inline).
  - `requeridos({ campo: 'mensaje' })` → esquema rápido de campos obligatorios.
- Cada formulario crear/editar valida **antes** del SweetAlert; `noValidate` en los `<form>` para evitar la burbuja nativa fea del navegador.
- Usuarios tiene esquema completo (nombre, correo formato, rol, contraseña ≥8 + coinciden).

## 9. Reactivar (toggle activo/inactivo) + listado por defecto solo activos

- **Backend**: ruta `PATCH .../{id}/reactivar` + método `reactivar()` (`activo = 1`) en: Usuarios, Roles, Servicios, Tipos de Documento, Tipos de Actor, Etapas, Correlativos.
- **Frontend**:
  - Botón que **permuta** según estado: activo → 🗑 Desactivar (rojo); inactivo → ↺ Reactivar (verde). Componente `ActionButtons` ampliado con `ReactivarButton`.
  - **Por defecto el listado muestra solo activos**; para ver/reactivar inactivos está el filtro de Estado.
  - Módulos no tiene reactivar (borrado físico).

---

## Componentes y archivos clave creados/modificados

**Nuevos:**
- `resources/js/Components/ConfigHeader.jsx`
- `resources/js/Components/Sidebar.jsx` (reescrito)
- `resources/js/Components/Popover.jsx` (popover reutilizable vía portal)
- `resources/js/Components/ServiceChips.jsx`
- `resources/js/lib/swalAnkawa.js`
- `resources/js/lib/validar.js`

**Modificados (componentes):** `Navbar.jsx`, `Table.jsx` (modo clientSide + filtros + búsqueda derecha), `CustomSelect.jsx` (animación), `ActionButtons.jsx`, `Input.jsx`/`PasswordInput.jsx` (no reenvían `required` — validación es Zod), `AuthenticatedLayout.jsx`.

**Modificados (páginas Configuración):** TiposDocumento, TiposActor, Usuarios, Roles, Servicios, Módulos, Correlativos, Etapas, TiposEventoCargo.

**Backend:** controladores de Configuración (índices a `->get()`, métodos `reactivar`), `routes/web.php` (rutas reactivar). Bug corregido: `TipoActorController::destroy` llamaba a `transicionesQueLoDesignan()` (método/tabla inexistente) → eliminado.

---

## Decisiones de arquitectura (resumen)

1. **Catálogos pequeños = client-side** (una consulta + filtrado en navegador). Si crecieran a miles de filas, volver a server-side.
2. **Borrados lógicos** (`activo = 0`) en catálogos; **físicos** solo en estructura (Módulos) y pivots.
3. **Doble validación**: Zod (cliente) + Laravel (servidor, la verdad).
4. **SweetAlert para confirmar, react-hot-toast para avisar.**
5. **Dos lenguajes de header**: `PageHeader` (público/Expedientes) y `ConfigHeader` (Configuración, con botón de acción) — mismo estilo serif premium.
