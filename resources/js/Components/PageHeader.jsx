/**
 * PageHeader — Encabezado de marca reutilizable para vistas internas Ankawa.
 *
 * Componente puramente presentacional: no hace fetching, no maneja estado, no
 * detecta rutas. El padre decide qué pasarle según la vista actual.
 *
 * Diseño: bloque blanco con breadcrumb dinámico, línea ornamental rose, título
 * Montserrat con acento opcional, descripción y marca de agua del logo a la
 * derecha. Por defecto es sutil (logo tintado en ankawa-deep al ~7 %); con
 * `watermarkVivid` se muestra el águila a todo color de la paleta (Dashboard).
 *
 * Uso típico:
 *   <PageHeader
 *     breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Expedientes' }]}
 *     title="Expedientes"
 *     titleAccent="Electrónicos"
 *     description="Accede, consulta y da seguimiento a tus expedientes electrónicos..."
 *   />
 *
 * Props:
 *   - breadcrumb?:    Array<{ label: string, href?: string }>  — array dinámico, n niveles
 *   - title:          string                                    — obligatorio
 *   - titleAccent?:   string                                    — fragmento en rose al final
 *   - description?:   string                                    — párrafo descriptivo
 *   - showWatermark?: boolean (default true)                    — marca de agua del logo
 *   - watermarkVivid?: boolean (default false)                  — águila a todo color (sin tinte)
 *
 * Notas:
 *   - Items con `href` se renderizan como Inertia <Link> (SPA navigation).
 *   - El último item del breadcrumb se ve más oscuro (posición actual).
 *   - Si breadcrumb es undefined o [], no se renderiza esa sección.
 *   - La marca de agua se oculta en pantallas md hacia abajo.
 */

import { Link } from '@inertiajs/react';

const WATERMARK_FILTER = 'brightness(0) saturate(100%) invert(11%) sepia(34%) saturate(2419%) hue-rotate(264deg) brightness(95%) contrast(96%)';

export default function PageHeader({
    breadcrumb = [],
    title,
    titleAccent,
    description,
    showWatermark = true,
    watermarkVivid = false,
}) {
    const hasBreadcrumb = Array.isArray(breadcrumb) && breadcrumb.length > 0;

    return (
        <header className="relative overflow-hidden bg-white px-6 sm:px-10 py-8 border-b border-ankawa-deep/5">
            {showWatermark && (
                <img
                    src={watermarkVivid ? '/logo.png' : '/logo-white.png'}
                    alt=""
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none select-none absolute right-6 lg:right-10 top-1/2 -translate-y-1/2 w-auto z-0"
                    style={watermarkVivid
                        ? { height: 210, opacity: 0.92 }
                        : { height: 170, opacity: 0.07, filter: WATERMARK_FILTER }}
                />
            )}

            <div className="relative z-10 max-w-3xl">
                {hasBreadcrumb && (
                    <nav aria-label="Breadcrumb" className="mb-4">
                        <ol className="flex flex-wrap items-center text-xs uppercase tracking-widest">
                            {breadcrumb.map((item, idx) => {
                                const isLast = idx === breadcrumb.length - 1;
                                const labelClass = isLast
                                    ? 'text-ankawa-deep/80 font-medium'
                                    : 'text-ankawa-deep/60';
                                return (
                                    <li key={`${item.label}-${idx}`} className="flex items-center">
                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                className={`${labelClass} hover:text-ankawa-rose transition-colors cursor-pointer`}
                                            >
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <span className={labelClass}>{item.label}</span>
                                        )}
                                        {!isLast && (
                                            <span className="mx-2 text-ankawa-deep/30" aria-hidden="true">›</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                )}

                <div className="w-12 h-[3px] bg-ankawa-rose mb-4" aria-hidden="true" />

                <h1 className="font-semibold text-4xl md:text-5xl leading-tight text-ankawa-deep mb-3">
                    {title}
                    {titleAccent && (
                        <>
                            {' '}
                            <span className="text-ankawa-rose">{titleAccent}</span>
                        </>
                    )}
                </h1>

                {description && (
                    <p className="text-sm md:text-base text-ankawa-deep/70 leading-relaxed max-w-xl">
                        {description}
                    </p>
                )}
            </div>
        </header>
    );
}
