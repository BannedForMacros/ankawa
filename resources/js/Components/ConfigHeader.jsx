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

export default function ConfigHeader({
    breadcrumb = [],
    title,
    titleAccent,
    description,
    action = null,   // { label, onClick, icon } — CTA estandarizado y proporcional al header
    actions = null,  // nodo libre, por si se necesita algo a medida
}) {
    const hasBreadcrumb = Array.isArray(breadcrumb) && breadcrumb.length > 0;
    const ActionIcon = action?.icon;

    return (
        <header className="relative overflow-hidden bg-white px-6 sm:px-10 py-8 border-b border-ankawa-deep/5">
            <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
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

                {(action || actions) && (
                    <div className="shrink-0 pt-1">
                        {action ? (
                            <button
                                type="button"
                                onClick={action.onClick}
                                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-white bg-ankawa-rose hover:bg-ankawa-rose-hover shadow-lg shadow-ankawa-rose/25 transition-all hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-ankawa-rose/40"
                            >
                                {ActionIcon && <ActionIcon size={20} strokeWidth={2.5} />}
                                {action.label}
                            </button>
                        ) : actions}
                    </div>
                )}
            </div>
        </header>
    );
}
