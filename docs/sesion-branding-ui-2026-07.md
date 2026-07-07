# Sesión de branding UI — julio 2026 (contexto para futuras sesiones)

> Registro completo de la remodelación visual aplicada el 05–06/07/2026 según el
> **Manual de Identidad Visual** (`Manual de identidad de ANKAWA INTL.pdf`, raíz
> del repo). Leer este doc deja en contexto todo lo hecho, las decisiones y lo
> pendiente. Docs hermanos: [`header-images.md`](header-images.md) (sistema de
> headers + prompts IA) y [`movimientos.md`](movimientos.md) (motor de expedientes).

---

## 1. Tipografía — solo Montserrat (manual, pág. 9)

- El manual autoriza para plataformas virtuales **únicamente Montserrat**
  (Tahoma es solo para documentación oficial física/PDF, pág. 10).
- Se eliminó **Fraunces** (`font-serif`) de TODA la app y todos los `font-mono`
  de Dashboard, Expedientes y componentes compartidos (PageHeader, KPICard,
  SectionHeading, ConfigHeader, DonutChart, ChartTooltip, ListingSection).
- **Patrón para números/códigos** (n° cargo, RUC, expediente, fechas): Montserrat
  + `tabular-nums` (alineación de dígitos sin monospace).
- ⚠️ El `@import` de Fraunces sigue en `resources/css/app.css` (ya nadie la usa —
  se puede quitar para no descargarla). Quedan `font-mono` residuales en ~8
  archivos fuera del alcance pedido: `MesaPartes/MisSolicitudes` (8), `Bandeja`
  (2), `Configuracion/Modulos` (3), `Correlativos` (2), `HistorialPortal` (2),
  `InfoPago` (2), `ColumnasMensuales` (2), `BarrasHorizontales`, `NuevaSolicitudAuth`.

## 2. Sistema de headers estandarizado (toda la app)

- **`Components/PageHeader.jsx` es la única fuente de verdad**: hero fotográfico
  con velo de marca (plum→rose `100deg`), águila `logo.png` a color a la derecha,
  título Montserrat `font-black` blanco con acento rose, breadcrumb blanco,
  animaciones `hero-in` / `hero-kenburns` (keyframes en `app.css`).
- Props: `breadcrumb, title, titleAccent, description, image, action, actions`.
  - `image`: foto por sección (ver tabla abajo).
  - `action` `{label, onClick, icon}`: CTA **blanco** (texto plum) a la derecha;
    cuando hay CTA **el águila se oculta** para no chocar.
- **`ConfigHeader.jsx` = alias delgado** de PageHeader con
  `image=hero-config.jpg` — las 10 páginas de Configuración no cambiaron sus
  imports. `EstadoSistema` pasa `actions` custom (botones opacos, funcionan).
- Imágenes por sección en `public/images/backgrounds/` (reemplazables SIN tocar
  código, mismo nombre): `hero-dashboard.jpg`, `hero-expedientes.jpg` (Index+Show),
  `hero-mesapartes.jpg` (MisSolicitudes + NuevaSolicitudAuth), `hero-config.jpg`
  (Configuración), `hero-auditoria.jpg` (HistorialPortal).
- Las 5 imágenes finales fueron **generadas con Gemini** por el usuario (prompts
  en `header-images.md`), se les **removió la marca de agua** ✦ (inpainting por
  difusión con PIL — la estrella cae siempre en ~(2510-2535, 1273-1310) de
  2752×1536) y se optimizaron a JPEG ~85–105 KB.
- **Regla de composición de las fotos**: tercio izquierdo oscuro (texto) ·
  sujeto al CENTRO · borde derecho limpio (ahí flota el águila o el CTA).

## 3. Dashboard (`/dashboard`)

- **Hero** = PageHeader estándar ("Hola, {nombre}").
- **KPICard** (`Components/KPICard.jsx`) ganó `variant="filled"`: card partido —
  banda superior con degradado de paleta por acento (`deep/rose/crimson/muted`,
  todos resolviendo a plum) con **título primero** (blanco, `text-sm font-bold`
  uppercase), cuerpo **OPACO** (blanco + tinte del acento 14%) con número grande
  `text-5xl` plum + **sello de icono** grande de fondo (18% opacidad). Hover eleva.
  `variant="outline"` (default) queda intacto para el resto de la app.
- **Count-up** en valores numéricos (hook `useCountUp` dentro de KPICard, 750ms,
  respeta `prefers-reduced-motion`).
- **Panel** (local en `Dashboard.jsx`): card partido con banda de gradiente
  canónico `#291136→#4A153D 55%→#BE0F4A` + icono en tile `bg-white/15` 44px +
  título blanco. Links de acción = pill `bg-white/15`.
- **Animaciones** en `app.css`: `.dash-stagger > *` (entrada escalonada
  fade-up por nth-child), `.hero-in`, `.hero-kenburns` (zoom 20s). Todas dentro
  de `@media (prefers-reduced-motion: no-preference)`.
- Etiquetas de sección ("Visión institucional", etc.) en rose `font-bold` uppercase.

## 4. Fondo global — águila de marca

- `AuthenticatedLayout.jsx` → `<main>` lleva el fondo de TODA la app:
  `#f5f3f6` + `aguila-bg.png` con `background-attachment: fixed`,
  `auto 40vh`, `center 66%` (debajo del header para que el título no la tape;
  fija al hacer scroll).
- `aguila-bg.png` = recorte del ave de `logo.png` (sin texto) con **opacidad
  horneada al 18%**. Regenerable con PIL (crop 54.5% superior + bbox + alpha×0.18).
- **Regla de oro**: la marca de agua vive DETRÁS; los cards (KPICard filled,
  Panel, ListingSection) son **opacos** para que nunca se transparente sobre
  números/iconos. No usar cuerpos translúcidos sobre este fondo.
- `bg-cover` recorta/zoomea — para mostrar el águila completa usar
  `contain`/tamaño explícito, nunca cover.

## 5. Sidebar

- **Inicia SIEMPRE minimizado** y oculto en su totalidad (`lg:w-0`; móvil drawer).
  El usuario rechazó el mini-rail de iconos — no reintroducirlo.
- **Bug histórico resuelto**: iniciaba abierto y el evento `navigate` de Inertia
  (que también dispara en la carga inicial) lo colapsaba → flash de abrir/cerrar.
  Fix: `useState(false)`.
- Pie de marca: **águila BLANCA centrada** (`/images/aguila-icon-white.png`,
  silueta blanca con alpha — la de color no contrasta sobre el fondo plum del
  sidebar). Existe también `/images/aguila-icon.png` (color, sin uso actual).

## 6. Expediente Electrónico

- **Index** (`/expedientes`): 4 KPIs → `variant="filled"` + `dash-stagger`;
  `Components/ListingSection.jsx` rediseñado como panel de marca (banda
  gradiente canónico + icono en tile + cuerpo blanco con filtros/meta/cards).
  Estado de plazo **"proximo" ya NO es azul** → tinte plum (`#291136/5`).
- **Show** (`/expedientes/{id}`): tabs = **control segmentado** sobre card
  blanco (`p-1.5`), tab activo pill `bg-#BE0F4A` texto blanco, badge invertido;
  banner "¿Qué sigue?" tipo `info` → tinte plum (era azul).
- Los **partials de tabs** (Historial, Solicitud, Actores, Envíos, NuevoMov) ya
  usaban gradientes canónicos — no se rediseñaron. En TabSolicitud se corrigió
  la caja "Empresas del consorcio" (azul → tinte plum).
- **Decisión de diseño consciente**: los badges de CATEGORÍA conservan colores
  semánticos (Requerimiento=azul, Notificación=púrpura, Consorcio=azul,
  Empresa=violeta, Recibido=púrpura). NO es violación de marca: 4-6 categorías
  necesitan tonos distintos para escanear. Solo se eliminan azules en avisos
  NEUTROS/plazos (regla CLAUDE.md). Si la clienta pide marca estricta, re-mapear
  a gama derivada de la paleta.
- `Components/Table.jsx` **ya estaba brandeado** (thead gradiente plum,
  paginación rose) — cubre las 6 tablas de Configuración + Bandeja.

## 7. Assets actuales (`public/images/`)

| Archivo | Uso |
|---|---|
| `backgrounds/hero-*.jpg` (5) | Headers por sección (85–105 KB c/u) |
| `backgrounds/aguila-bg.png` | Marca de agua global (layout) |
| `backgrounds/bg1–bg5.png` | Rotación de fondos de MesaPartes/Dashboard (⚠️ ~26 MB, optimizables) |
| `aguila-icon-white.png` | Pie del sidebar |
| `aguila-icon.png` | Águila color sin texto (reserva, sin uso) |
| `logo.png` / `logo-white.png` | Logo completo (header águila / emails) |

Eliminados por limpieza: `public/images/hero/` (PNG fuente 6 MB c/u),
`backgrounds/fondo.png`, `contenido-aguila.jpg`, `aguila-watermark.png`.

## 8. Técnicas útiles (repetibles)

- **Quitar marca de agua Gemini**: NO usar detección automática por alta
  frecuencia (confunde con sujetos nítidos). La estrella cae en offset fijo
  ~(2510–2535, 1273–1310) de 2752×1536; inpainting por difusión multi-escala
  (PIL + numpy) — código en el historial de la sesión. Alternativa: generar en
  aistudio.google.com (sin marca visible).
- **Optimizar imágenes**: `sips -s format jpeg -s formatOptions 72 -Z 1920 in.png --out out.jpg`.
- **Previsualizar sin browser del usuario**: Brave headless
  (`/Applications/Brave Browser.app/.../Brave Browser --headless --screenshot=...`)
  — Chrome no está instalado en esta máquina.
- Build a veces falla con error opaco de rolldown → **reintentar**, es transitorio.

## 9. Pendientes conocidos

1. `font-mono` residuales fuera de Dashboard/Expedientes (lista en §1) + quitar
   `@import` de Fraunces en `app.css`.
2. Cards internos de `MesaPartes/MisSolicitudes` y página de Auditoría: aún sin
   el tratamiento de paneles partidos.
3. `bg1–bg5.png` de Mesa de Partes: optimizar a JPEG (~26 MB → ~1 MB).
4. Ofrecido y no decidido: re-mapear colores semánticos de categorías a gama de
   marca (solo si la clienta exige marca estricta).

## 10. Contexto de producto

- La clienta se quejaba: *"me da tristeza entrar a la página"* → todo lo anterior
  busca color/calidez con autoridad institucional (tono del manual: elegante,
  con presencia, no minimalista genérico).
- El usuario valida cada cambio visualmente en `http://127.0.0.1:8000` (dev
  server Vite en :5173 con `npm run dev`); prefiere iterar con vistas previas
  (artifacts) antes de decidir. Preguntar antes de ampliar alcance a otra página.
