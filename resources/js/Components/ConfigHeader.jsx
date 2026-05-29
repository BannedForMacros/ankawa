/**
 * ConfigHeader — Encabezado serif premium para las pantallas de Configuración.
 *
 * Misma identidad que PageHeader (breadcrumb, línea rose, título serif con
 * acento y marca de agua del logo), pero añade un slot de acciones (botón
 * "Nuevo X") en la esquina superior derecha. La marca de agua se ancla abajo a
 * la derecha para no quedar tapada por el botón.
 *
 * Props:
 *   - breadcrumb?:    Array<{ label: string, href?: string }>
 *   - title:          string                    — obligatorio
 *   - titleAccent?:   string                    — fragmento en rose al final
 *   - description?:   string
 *   - actions?:       ReactNode                 — botón(es) a la derecha
 *   - showWatermark?: boolean (default true)
 */

import { Link } from '@inertiajs/react';

const WATERMARK_FILTER = 'brightness(0) saturate(100%) invert(11%) sepia(34%) saturate(2419%) hue-rotate(264deg) brightness(95%) contrast(96%)';

export default function ConfigHeader({
    breadcrumb = [],
    title,
    titleAccent,
    description,
    actions = null,
    showWatermark = true,
}) {
    const hasBreadcrumb = Array.isArray(breadcrumb) && breadcrumb.length > 0;

    return (
        <header className="relative overflow-hidden bg-white px-6 sm:px-10 py-8 border-b border-ankawa-deep/5">
            {showWatermark && (
                <img
                    src="/logo-white.png"
                    alt=""
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none select-none absolute right-8 bottom-0 h-[120px] w-auto z-0"
                    style={{ filter: WATERMARK_FILTER, opacity: 0.06 }}
                />
            )}

            <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
                <div className="max-w-3xl">
                    {hasBreadcrumb && (
                        <nav aria-label="Breadcrumb" className="mb-4">
                            <ol className="flex flex-wrap items-center font-mono text-xs uppercase tracking-widest">
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

                    <h1 className="font-serif font-medium text-4xl md:text-5xl leading-tight text-ankawa-deep mb-3">
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

                {actions && (
                    <div className="shrink-0 pt-1">{actions}</div>
                )}
            </div>
        </header>
    );
}
