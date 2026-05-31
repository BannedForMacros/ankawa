# Contexto 3 — Auditoría de Configuración + Matriz de Permisos por Rol

> Registro de la sesión (30-31 may 2026). Cubre: auditoría de los **catálogos de
> Configuración**, eliminación de código muerto (`ActoresServicio`), cierre del gap de
> autorización en `tipos-actor`, y la nueva **pantalla de matriz de permisos por rol**.
> Documento de traspaso para continuar sin perder el hilo.

---

## 1. Auditoría de las 10 páginas de Configuración (catálogos)

Se auditaron contra los patrones del proyecto (CRUD completo, 3 estados, Zod, SweetAlert,
`ConfigHeader`, filtros `CustomSelect` + búsqueda client-side). Páginas:
`Usuarios, Roles, Servicios, TiposDocumento, TiposActor, Correlativos, Etapas, Modulos,
TiposEventoCargo` + (huérfana) `ActoresServicio`.

**Veredicto general:** la base está sólida. CRUD + reactivar (borrado lógico; físico solo en
Módulos con limpieza de huérfanos), doble validación (Zod cliente + Laravel servidor),
confirmaciones SweetAlert y `ConfigHeader` serif están bien en todas.

**Aclaración importante (no es bug):** los agentes marcaron "loading/error state faltante",
pero **no aplica** igual aquí — son páginas Inertia donde la data llega como **props del
servidor** en el render inicial; no hay `fetch` cliente que pueda quedar en loading o fallar.
El empty state sí existe (vía `Table` / tablas manuales).

### Hallazgos REALES (verificados)
1. **`ActoresServicio` huérfano y roto** → ELIMINADO (ver §2).
2. **`tipos-actor` sin middleware `permiso:`** → CORREGIDO (ver §3).
3. **Título de `TiposEventoCargo` incompleto:** `title="Tipos de"` + `titleAccent="Cargo"` →
   renderiza "Tipos de Cargo", pierde "Evento". ✅ **RESUELTO** (31 may): `title="Tipos de Evento de"`
   + `titleAccent="Cargo"` → "Tipos de Evento de Cargo" (breadcrumb actualizado también).

### Inconsistencias menores (mejora, no rotura) — pendientes
- **Roles** usaba `<input>/<textarea>/<select>` nativos (Usuarios/Servicios usan los
  componentes compartidos `Input`/`Textarea`/`CustomSelect`). ✅ **RESUELTO** (31 may): migrado a
  `Input`/`Textarea`/`CustomSelect`, replicado 1:1 de `Servicios/Index.jsx`. Modal de matriz de
  permisos intacto.
- **Esquemas Zod mínimos** en Roles/Servicios/Módulos/TiposEventoCargo (solo "requerido"); el
  backend valida más (máx. largo, rango plazos 1-365, unicidad slug). ✅ **PARCIAL** (31 may):
  reforzados Roles (`nombre` máx 255), Servicios (`nombre` 255, plazos 1-365), TiposEventoCargo
  (`nombre` 150, `descripcion` 1000) reflejando reglas reales del backend. Unicidad de slug/nombre
  se deja al servidor (el cliente no tiene la lista). Módulos sigue mínimo.
- **Módulos:** selector `parent_id` no se excluye a sí mismo (posible referencia circular en
  UI); unicidad de slug solo en backend. ✅ **RESUELTO parcial** (31 may): `parent_id` ahora excluye
  el propio módulo en edición (`padresDisponibles`). Unicidad de slug sigue solo en backend.
- **TiposEventoCargo:** toggles inline (activo / emite-cargo) se aplican **sin** `confirmar()`.
  ✅ **RESUELTO** (31 may): toggles ahora pasan por `confirmar()` variante `info`.
- **Bonus detectado:** módulo `id 19 "Acciones de Flujo"` (`/configuracion/acciones`,
  `activo=0`) existe en `modules` pero no estaba entre las 10 páginas. ✅ **RESUELTO** (31 may):
  era **código muerto huérfano** — feature completa (controller `AccionFlujoController`, modelo
  `CatalogoAccion`, página `Acciones/Index.jsx`, 4 rutas, tabla `catalogo_acciones`) borrada
  deliberadamente en el commit `aacea22 "retomando"` (24-mar) por contradecir la filosofía de
  "primitivas componibles, no flujos hardcodeados" (`docs/movimientos.md` §5). La eliminación no
  limpió la BD → sobrevivían la fila `modules` id=19 y un permiso huérfano (`rol_modulo_permiso`
  id=120). Ambos eliminados vía psql (ver §6).

> El hex hardcodeado (`#291136` vs `ankawa-deep`) **no se cuenta como hallazgo** — el CLAUDE.md
> lo declara equivalente 1:1 sin migración obligatoria.

---

## 2. Eliminación de `ActoresServicio` (código muerto)

Auditoría a fondo confirmó que NO se usa:
- ❌ Sin definición de ruta en `web.php` y `php artisan route:list` no la conoce.
- ❌ Sin registro en tabla `modules` (no está en el menú).
- ❌ Sin referencias entrantes; solo se referenciaba a sí misma.
- La página llamaba a rutas inexistentes (`configuracion.actores-servicio.upsert/destroy`) →
  habría reventado si se renderizara.
- El `upsert()` del controller gestionaba el pivot `servicio_tipos_actor` — **exactamente lo
  mismo** que hoy hace `TipoActorController::syncServicios()`. Era la implementación legacy
  previa a la consolidación que menciona el CLAUDE.md.

**Eliminados:**
- `resources/js/Pages/Configuracion/ActoresServicio/Index.jsx` (+ carpeta vacía)
- `app/Http/Controllers/Configuracion/ActoresServicioController.php`

No se tocó `modules` ni `rol_modulo_permiso` (nunca tuvieron registro de esa pantalla).
Verificación post-borrado: **0 referencias** restantes.

---

## 3. Fix de autorización en `tipos-actor`

Era el **único** módulo de Configuración cuyas rutas no pasaban por el middleware `permiso:`
→ cualquier usuario autenticado podía CRUD Tipos de Actor sin importar su rol.

**Aplicado** en `routes/web.php` (líneas ~195-200):
```php
Route::get('tipos-actor', ...)->middleware('permiso:configuracion.tipos-actor,ver');
Route::post('tipos-actor', ...)->middleware('permiso:configuracion.tipos-actor,crear');
Route::put('tipos-actor/{tipoActor}', ...)->middleware('permiso:configuracion.tipos-actor,editar');
Route::delete('tipos-actor/{tipoActor}', ...)->middleware('permiso:configuracion.tipos-actor,eliminar');
Route::patch('tipos-actor/{tipoActor}/reactivar', ...)->middleware('permiso:configuracion.tipos-actor,editar');
Route::post('tipos-actor/{tipoActor}/servicios', ...)->middleware('permiso:configuracion.tipos-actor,editar');
```

El módulo `configuracion.tipos-actor` (id 18) y sus permisos ya estaban sembrados en BD →
funciona de inmediato. **Efecto:** hoy solo "Administrador TI" tiene el bit; los demás roles
quedan fuera (403) hasta que se les conceda vía la matriz (§5). Es el mismo comportamiento que
el resto de Configuración — consistente.

---

## 4. Cómo funciona el sistema de permisos (modelo mental)

- **Modelo:** por **módulo (≈ página) × rol**, con 4 booleanos granulares:
  `ver · crear · editar · eliminar` en la tabla `rol_modulo_permiso`
  (UNIQUE `(rol_id, modulo_id)`, valores `smallint` 0/1). No es un solo checkbox por página.
- **Validación:** rutas con `->middleware('permiso:slug,accion')` → `CheckPermiso` →
  `User::puedeEn($slug, $accion)` consulta esa tabla; si falta el bit → `403`.
- **Menú:** `HandleInertiaRequests::getMenuUsuario()` muestra padres con hijos donde `ver=1`;
  `getPermisosUsuario()` expone `auth.permisos` al frontend (lo lee `hooks/usePermiso.js` solo
  para mostrar/ocultar botones).
- **`ver` es la puerta:** sin `ver` no hay acceso al módulo en el menú ni a sus acciones.

**Gap que existía:** no había **ninguna UI** para editar esa matriz — `RolController` solo
manejaba nombre/descripción/activo, y los permisos se cargaban directo en BD (seeder). Eso es
lo que resuelve §5.

---

## 5. NUEVO — Pantalla de Matriz de Permisos por Rol

### Backend (`app/Http/Controllers/Configuracion/RolController.php`)
- **`index()`** ahora envía además:
  - `modulos`: módulos **activos** en orden jerárquico (`COALESCE(parent_id,id)`, `orden`, `id`).
  - `permisos`: mapa `{ rol_id: { modulo_id: {ver,crear,editar,eliminar} } }`.
- **`syncPermisos(Request, Rol $rol)`** (nuevo): guarda toda la matriz en bulk con
  `updateOrCreate` dentro de una transacción.
  - **Guard de seguridad:** si `$rol->slug === Rol::SLUG_ADMINISTRADOR_TI` (`administrador_ti`)
    → rechaza la edición (conserva acceso total). Evita auto-bloqueo del sistema.
  - Validación: `permisos.*.modulo_id exists:modules,id` + los 4 booleanos requeridos.

### Ruta (`routes/web.php`)
```php
Route::post('/roles/{rol}/permisos', [RolController::class,'syncPermisos'])
    ->name('configuracion.roles.permisos')
    ->middleware('permiso:configuracion.roles,editar');
```

### Frontend (`resources/js/Pages/Configuracion/Roles/Index.jsx`)
- **Botón 🔑 "Permisos"** por fila (icono `KeyRound`). Para `administrador_ti` se muestra
  deshabilitado con candado `Lock` + tooltip "conserva acceso total (no editable)".
- **Modal de matriz** (`maxWidth="2xl"`):
  - Filas = módulos agrupados **padre → hijos** (hijos indentados `pl-8`); muestra nombre + slug.
  - Columnas = **Ver / Crear / Editar / Eliminar** (checkboxes `accent-[#BE0F4A]`) + columna
    **"Todo"** por fila (`accent-[#291136]`, marca/limpia la fila completa).
  - **Cascada lógica:** activar Crear/Editar/Eliminar marca **Ver** automáticamente; quitar
    **Ver** limpia toda la fila (coherente con cómo `ver` gobierna menú y acciones).
  - Botones **"Marcar todo" / "Limpiar"** (toda la matriz). Header de tabla `sticky`,
    scroll `max-h-[55vh]`.
  - Guardado: `confirmar()` variante `info` + `router.post` a `configuracion.roles.permisos`
    + toast. Maneja `flash.error` (caso guard admin) y `flash.success`.
- Constantes nuevas: `SLUG_ADMIN`, `PERM_VACIO`, `ACCIONES`. Helper `FilaGrupo` (fuera del
  componente) renderiza padre + hijos.

### Verificación
- ✅ `php -l RolController.php` sin errores
- ✅ `php artisan route:list` registra `configuracion.roles.permisos`
- ✅ `npm run build` compila limpio (solo warning de chunk-size, preexistente)

---

## 6. PENDIENTE / próximos pasos

> **Cierre 31 may 2026:** los 3 pendientes de esta lista quedaron resueltos (ver detalle abajo).
> Build limpio (`npm run build`, solo warning preexistente de chunk-size).

1. ✅ **Fix título `TiposEventoCargo`** — aplicado: `title="Tipos de Evento de"` + `titleAccent="Cargo"`.
2. ✅ **Módulo `id 19 "Acciones de Flujo"`** — diagnosticado como código muerto huérfano y **limpiado** en BD:
   ```sql
   DELETE FROM rol_modulo_permiso WHERE modulo_id = 19;  -- permiso huérfano id=120
   DELETE FROM modules WHERE id = 19;                     -- fila huérfana activo=0
   ```
   Verificado: 0 registros restantes. Coherente con la regla de CLAUDE.md (borrar huérfanos en
   `rol_modulo_permiso` al eliminar un módulo).
3. ✅ **Estandarización/Zod** — Roles migrado a componentes compartidos; `parent_id` propio excluido en
   Módulos; Zod reforzado en Roles/Servicios/TiposEventoCargo; toggles de TiposEventoCargo con `confirmar()`.

### Quedan abiertos (menores, no bloqueantes)
- Zod de **Módulos** sigue mínimo; unicidad de slug/nombre solo en backend (por diseño: el cliente no
  tiene la lista de existentes).
- Estandarizar inputs nativos en otras páginas que aún los usen (no auditado fila por fila).

---

## 7. Archivos tocados en esta sesión

**Eliminados:**
- `resources/js/Pages/Configuracion/ActoresServicio/Index.jsx`
- `app/Http/Controllers/Configuracion/ActoresServicioController.php`

**Modificados:**
- `routes/web.php` — middleware `permiso:` en `tipos-actor` (6 rutas) + ruta `roles.permisos`.
- `app/Http/Controllers/Configuracion/RolController.php` — `index()` ampliado + `syncPermisos()`.
- `resources/js/Pages/Configuracion/Roles/Index.jsx` — botón Permisos + modal de matriz.

### Cierre de pendientes (31 may 2026)
**Modificados:**
- `resources/js/Pages/Configuracion/TiposEventoCargo/Index.jsx` — título corregido, toggles con
  `confirmar()`, Zod reforzado (`nombre` 150 / `descripcion` 1000).
- `resources/js/Pages/Configuracion/Servicios/Index.jsx` — Zod reforzado (`nombre` 255, plazos 1-365).
- `resources/js/Pages/Configuracion/Roles/Index.jsx` — formulario migrado a `Input`/`Textarea`/
  `CustomSelect`, Zod reforzado (`nombre` máx 255). **Modal de matriz de permisos intacto.**
- `resources/js/Pages/Configuracion/Modulos/Index.jsx` — `parent_id` excluye el módulo en edición
  (`padresDisponibles`).

**BD (psql):** eliminados `modules` id=19 y `rol_modulo_permiso` modulo_id=19 (módulo huérfano).

**Referencia útil:**
- `app/Http/Middleware/CheckPermiso.php` — valida `permiso:slug,accion`.
- `app/Http/Middleware/HandleInertiaRequests.php` — arma `auth.menu` y `auth.permisos`.
- `app/Models/User.php::puedeEn()` — chequeo del bit por (slug, acción).
- Tabla `rol_modulo_permiso` (rol_id, modulo_id, ver, crear, editar, eliminar) y `modules`.
