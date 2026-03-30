# CARD ANKAWA — Contexto para Claude Code

## Stack técnico
- Laravel 12 + Inertia.js + React (JSX) + TypeScript + PostgreSQL
- Tailwind CSS (clases utilitarias, sin CSS custom salvo variables)
- Lucide React para iconos
- Fuente: Montserrat (importada vía Google Fonts en el layout principal)

## Reglas críticas de base de datos
- NUNCA ejecutar `php artisan migrate` directamente
- Conectar a PostgreSQL vía psql usando las credenciales del `.env`
- Verificar estructura de tablas con `\d nombre_tabla` antes de cualquier cambio

---

## Identidad visual — The Ankawa Global Group SAC

### Paleta oficial (Manual de Identidad Visual, Julio 2024)

| Token            | Hex       | Uso en la app                                      |
|------------------|-----------|----------------------------------------------------|
| `ankawa-deep`    | `#291136` | Fondos oscuros, texto principal en headers, gradientes |
| `ankawa-rose`    | `#BE0F4A` | Acento principal, CTA, bordes activos, tabs activos, iconos destacados |
| `ankawa-crimson` | `#BC1D35` | Variante de acento, uso en gradientes intermedios  |
| `ankawa-plum`    | `#4A153D` | Gradiente secundario, fondos de hero (punto medio) |
| `ankawa-muted`   | `#B23241` | Acento suave, hover states, variaciones de badge   |

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
- No usar `alert()` — usar toast o feedback inline
- No usar estilos inline salvo gradientes complejos (`style={{ background: '...' }}`)
- Usar `cn()` de `clsx` para clases condicionales
- Formularios: `react-hook-form` + validación Zod
- Tablas con más de 10 registros: paginación obligatoria
- Mobile-first: el hero se apila verticalmente en pantallas pequeñas (`flex-wrap gap-4`)
- No crear archivos de migración — toda estructura de BD se verifica directamente con psql

---

## Archivos de referencia del proyecto

- `resources/js/Pages/Expedientes/Index.jsx` — lista de expedientes
- `resources/js/Pages/Expedientes/Show.jsx` — detalle con tabs
- `app/Http/Controllers/ExpedienteController.php` — controlador principal
- `.env` — credenciales de base de datos para psql