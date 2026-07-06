# Imágenes de header por sección — CARD ANKAWA

> Guía canónica del sistema de headers estandarizados y los prompts para
> generar la imagen de fondo de cada sección con IA (Gemini / AI Studio /
> Bing Image Creator / Firefly).

---

## Cómo funciona el sistema

Toda la app usa **un solo componente de header**: `resources/js/Components/PageHeader.jsx`
(hero fotográfico con velo de marca plum→rose, águila a color, título Montserrat
blanco con acento rose, breadcrumb y animación Ken Burns).

- Las páginas de **Configuración** lo usan vía el alias `ConfigHeader.jsx`
  (mismo componente, imagen fija de la sección + botón CTA).
- La imagen de fondo se elige con la prop `image`. **Cada sección apunta a un
  archivo con nombre fijo** — para cambiar la imagen basta reemplazar el archivo,
  sin tocar código.

| Sección | Archivo en `public/images/backgrounds/` | Páginas |
|---|---|---|
| Panel de Control | `hero-dashboard.jpg` | `Dashboard.jsx` (default del componente) |
| Expedientes | `hero-expedientes.jpg` | `Expedientes/Index.jsx`, `Expedientes/Show.jsx` |
| Mesa de Partes (interna) | `hero-mesapartes.jpg` | `MesaPartes/MisSolicitudes.jsx`, `MesaPartes/NuevaSolicitudAuth.jsx` |
| Configuración | `hero-config.jpg` | Las 10 páginas de `Configuracion/*` (vía `ConfigHeader`) |
| Auditoría | `hero-auditoria.jpg` | `Admin/Auditoria/HistorialPortal.jsx` |

**Estado actual**: los archivos existen como *placeholders* (fotos corporativas
del set `bg1–bg5.png`). Reemplazarlos con las imágenes generadas usando los
prompts de abajo.

### Especificaciones técnicas de cada imagen

- **Formato**: 16:9, mínimo **1920 px** de ancho.
- **Peso**: optimizar a JPEG calidad ~72–76 (objetivo < 250 KB). Comando usado
  en el proyecto: `sips -s format jpeg -s formatOptions 72 -Z 1920 origen.png --out hero-x.jpg`
- **Composición obligatoria**: lado **izquierdo oscuro/calmado** (ahí va el
  texto) y el interés visual a la **derecha**. Bajo contraste — la imagen va
  debajo de un velo `plum → rose` a ~90 % de opacidad, solo se percibe la
  atmósfera.
- **Sin** texto, logos, marcas de agua ni rostros en foco.
- Si la imagen sale con la marca de agua de Gemini (estrella ✦ abajo-derecha),
  generarla en [AI Studio](https://aistudio.google.com) (sin marca visible) o
  entregarla igual — la marca se puede parchear reconstruyendo el degradado de
  la zona (ya se hizo una vez en este proyecto con PIL).

### Instalación de una imagen nueva

```bash
# 1. Optimizar (desde la imagen generada)
sips -s format jpeg -s formatOptions 72 -Z 1920 ~/Downloads/generada.png \
  --out public/images/backgrounds/hero-<seccion>.jpg

# 2. Nada más — el nombre de archivo ya está cableado en las páginas.
```

### Agregar una sección nueva

```jsx
<PageHeader
    breadcrumb={[{ label: 'Inicio', href: route('dashboard') }, { label: 'Mi Sección' }]}
    title="Mi"
    titleAccent="Sección"
    description="Descripción corta."
    image="/images/backgrounds/hero-miseccion.jpg"
/>
```

---

## Prompts por sección (copiar y pegar completos)

Todos comparten la misma base de estilo — eso da la concordancia visual.
Cada bloque es autónomo: copia el bloque entero de la sección en el generador.

**Negative prompt** (común, si el generador lo pide por separado):

```
text, watermark, logo, letters, faces in focus, cartoon, oversaturated,
cluttered, busy patterns, harsh lighting
```

### 1. Panel de Control — `hero-dashboard.jpg`

```
Professional photograph inside a modern high-end law firm, soft blurred
background (bokeh), deep plum purple (#291136) and magenta-crimson (#BE0F4A)
brand accents in the decor (glass panels, lamps, chair upholstery). Cinematic
soft lighting, elegant institutional atmosphere. Composition: left side dark
and calm with generous negative space for text overlay, subject interest on
the right side. Low contrast, muted tones, premium corporate aesthetic.
Subject: spacious executive lobby with floor-to-ceiling windows and a city
skyline, two silhouetted professionals conversing in the far background.
No text, no logos, no watermarks, no faces in focus. Wide 16:9 format.
```

### 2. Expedientes — `hero-expedientes.jpg`

```
Professional photograph inside a modern high-end law firm, soft blurred
background (bokeh), deep plum purple (#291136) and magenta-crimson (#BE0F4A)
brand accents in the decor (glass panels, lamps, chair upholstery). Cinematic
soft lighting, elegant institutional atmosphere. Composition: left side dark
and calm with generous negative space for text overlay, subject interest on
the right side. Low contrast, muted tones, premium corporate aesthetic.
Subject: stacks of organized legal case files and bound dossiers on a walnut
desk, a brass scale of justice softly blurred on the right.
No text, no logos, no watermarks, no faces in focus. Wide 16:9 format.
```

### 3. Mesa de Partes — `hero-mesapartes.jpg`

```
Professional photograph inside a modern high-end law firm, soft blurred
background (bokeh), deep plum purple (#291136) and magenta-crimson (#BE0F4A)
brand accents in the decor (glass panels, lamps, chair upholstery). Cinematic
soft lighting, elegant institutional atmosphere. Composition: left side dark
and calm with generous negative space for text overlay, subject interest on
the right side. Low contrast, muted tones, premium corporate aesthetic.
Subject: elegant reception counter with documents being handed over, a
stamped envelope and a fountain pen on the counter, right side.
No text, no logos, no watermarks, no faces in focus. Wide 16:9 format.
```

### 4. Configuración — `hero-config.jpg`

```
Professional photograph inside a modern high-end law firm, soft blurred
background (bokeh), deep plum purple (#291136) and magenta-crimson (#BE0F4A)
brand accents in the decor (glass panels, lamps, chair upholstery). Cinematic
soft lighting, elegant institutional atmosphere. Composition: left side dark
and calm with generous negative space for text overlay, subject interest on
the right side. Low contrast, muted tones, premium corporate aesthetic.
Subject: minimalist glass meeting room with neatly arranged binders and a
laptop, subtle geometric wall pattern echoing low-poly facets.
No text, no logos, no watermarks, no faces in focus. Wide 16:9 format.
```

### 5. Auditoría — `hero-auditoria.jpg`

```
Professional photograph inside a modern high-end law firm, soft blurred
background (bokeh), deep plum purple (#291136) and magenta-crimson (#BE0F4A)
brand accents in the decor (glass panels, lamps, chair upholstery). Cinematic
soft lighting, elegant institutional atmosphere. Composition: left side dark
and calm with generous negative space for text overlay, subject interest on
the right side. Low contrast, muted tones, premium corporate aesthetic.
Subject: close-up of a magnifying glass resting over printed registry ledgers
and audit reports, warm desk lamp glow on the right.
No text, no logos, no watermarks, no faces in focus. Wide 16:9 format.
```

---

## Apéndice — Fondo del contenido (águila de marca)

El fondo detrás de los cards **no** usa estas fotos: es el águila del logo con
fondo transparente, pre-atenuada, global para toda la app.

- Archivo: `public/images/backgrounds/aguila-bg.png` (recorte del ave de
  `public/logo.png`, opacidad horneada al 18 %).
- Vive en `resources/js/Layouts/AuthenticatedLayout.jsx` (`<main>`, con
  `background-attachment: fixed`, `auto 40vh`, `center 66%`).
- Regla de diseño: la marca de agua vive **detrás** del contenido; los cards
  (KPICard variante `filled`, paneles) son **opacos** para que nunca se
  transparente sobre números o iconos.

Si algún día se quiere regenerar un arte abstracto de marca (alternativa al
recorte del logo), prompt de referencia:

```
An elegant abstract corporate background for a legal-tech dashboard.
Low-poly geometric facets forming the subtle silhouette of an Andean condor
with outstretched wings emerging from deep shadow. Palette of deep plum
purple (#291136) blending into magenta-crimson (#BE0F4A); dark and moody on
the left, warming to a soft rose glow on the right. Sophisticated,
institutional, premium law-firm aesthetic. Smooth gradients with faint
faceted texture, generous negative space, cinematic soft lighting. No text,
no logo, no people. Wide cinematic composition, subtle and low-contrast to
sit behind UI elements.
```
