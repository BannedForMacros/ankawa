# Guía de Estandarización de Imágenes de Fondo (Marcas de Agua)

Para asegurar que la experiencia de usuario sea consistente y profesional en todas las solicitudes (Arbitraje, JPRD, Emergencia, etc.), hemos dividido el flujo del formulario en **5 etapas conceptuales**. 

A continuación, te proporciono los **prompts exactos** que puedes usar en herramientas de IA (como Midjourney, DALL-E 3 o Adobe Firefly) para generar imágenes coherentes, con el mismo estilo fotográfico corporativo.

---

## 🎨 Estilo Visual (Añadir a todos los prompts)
Para que todas las imágenes parezcan de la misma "familia" y funcionen perfectamente como fondo de nuestro layout, asegúrate de que todas tengan este estilo base y estructura geométrica:
> *Professional corporate photography, high key lighting, very bright and airy, minimalist, dominated by white and light gray tones, subtle deep purple and magenta accents, depth of field, 8k resolution, highly detailed, photorealistic. **CRITICAL COMPOSITION:** Massive negative empty white space in the exact center of the image. The main subjects and focal points MUST be positioned exclusively on the far left or far right edges of the frame.*

---

## 📸 Los 5 Prompts para Generar las Imágenes

### 1. Etapa de Inicio (Selección de Solicitud)
**Concepto:** El comienzo formal del proceso. Elementos a la derecha.
**Prompt sugerido:**
> *A pristine modern office desk. On the **far right edge** of the frame, a sleek closed folder and a subtle silver gavel. The entire center and left side of the image must be completely empty white/light gray desk surface (negative space). Professional corporate photography, high key lighting, very bright and airy, minimalist, white and light gray tones, subtle deep purple and magenta accents, 8k resolution, photorealistic --ar 16:9*
**Nombre del archivo:** `bg-1-inicio.webp`

### 2. Etapa de Identificación (Demandante / Demandado / Entidad)
**Concepto:** Las partes involucradas. Elementos a la izquierda.
**Prompt sugerido:**
> *Two professional executives in sharp suits shaking hands across a brightly lit glass conference table. The handshake is positioned exclusively on the **far left edge** of the frame. The center and right side of the image must be massive empty negative space (blurred bright office background). Professional corporate photography, high key lighting, very bright and airy, minimalist, white and light gray tones, subtle magenta accents, 8k resolution, photorealistic --ar 16:9*
**Nombre del archivo:** `bg-2-partes.webp`

### 3. Etapa de Controversia (Contratos / Documentos / Aspectos)
**Concepto:** El análisis profundo del caso. Elementos a la derecha.
**Prompt sugerido:**
> *Close-up of a premium fountain pen resting on top of a stack of blurred legal contracts. These items are positioned exclusively on the **far right edge** of the image. The center and left side are pure empty bright negative space. Professional corporate photography, high key lighting, very bright and airy, minimalist, white and light gray tones, subtle deep purple accents, 8k resolution, photorealistic --ar 16:9*
**Nombre del archivo:** `bg-3-documentos.webp`

### 4. Etapa de Resolución / Tribunal (Árbitros / Medidas Cautelares)
**Concepto:** La autoridad e imparcialidad. Elementos distribuidos a los extremos (marco).
**Prompt sugerido:**
> *A modern, elegant boardroom. On the **far left edge**, a subtle balance scale of justice. On the **far right edge**, a high-back leather chair. The entire center of the image is completely empty bright white negative space. Professional corporate photography, high key lighting, very bright and airy, minimalist, white and light gray tones, subtle magenta accents, 8k resolution, photorealistic --ar 16:9*
**Nombre del archivo:** `bg-4-tribunal.webp`

### 5. Etapa de Cierre (Revisión, Envío y Tasa)
**Concepto:** La firma digital y oficialización. Elementos a la izquierda.
**Prompt sugerido:**
> *A person holding a sleek modern stylus ready to sign a digital tablet. This action is framed entirely on the **far left edge** of the image. The center and right side are massive empty bright negative space. Professional corporate photography, high key lighting, very bright and airy, minimalist, white and light gray tones, subtle deep purple accents, 8k resolution, photorealistic --ar 16:9*
**Nombre del archivo:** `bg-5-cierre.webp`

---

## 💾 ¿Dónde y cómo guardar estas imágenes?

Una vez que hayas generado las imágenes y elegido tus favoritas, sigue estos pasos:

1. **Optimización:**
   Antes de guardarlas en el proyecto, conviértelas a formato **WebP**. Esto es crucial porque las imágenes muy pesadas harán que el formulario cargue lento. Asegúrate de que pesen **menos de 300 KB** cada una.
   
2. **Ubicación en el Proyecto:**
   Guarda las imágenes dentro de tu proyecto de Laravel/React en la siguiente ruta exacta:
   `/public/images/backgrounds/`
   *(Si la carpeta `backgrounds` no existe, debes crearla dentro de `public/images/`).*

3. **Nombres de archivo:**
   Guárdalas exactamente con los nombres indicados arriba:
   - `/public/images/backgrounds/bg-1-inicio.webp`
   - `/public/images/backgrounds/bg-2-partes.webp`
   - `/public/images/backgrounds/bg-3-documentos.webp`
   - `/public/images/backgrounds/bg-4-tribunal.webp`
   - `/public/images/backgrounds/bg-5-cierre.webp`

Una vez que tengas estas 5 imágenes guardadas en esa ruta, yo podré conectarlas directamente a la lógica del `SolicitudLayout.jsx` para que cambien automáticamente cuando el usuario pase de una etapa a otra.
