/**
 * PageHeader — Hero de marca estandarizado para todas las vistas internas Ankawa.
 *
 * Mismo look en toda la app (estilo Panel de Control): fondo fotográfico con
 * zoom lento (Ken Burns), velo de marca (plum → rose), águila a color a la
 * derecha y título Montserrat en blanco con acento rose.
 *
 * La imagen de fondo es tematizable por sección vía la prop `image` — los
 * archivos viven en /public/images/backgrounds/hero-*.jpg y se pueden
 * reemplazar sin tocar código (mismo nombre de archivo).
 *
 * Props:
 *   - breadcrumb?:  Array<{ label: string, href?: string }>  — n niveles; el último es la posición actual
 *   - title:        string                                    — obligatorio
 *   - titleAccent?: string                                    — fragmento en rose al final del título
 *   - description?: string                                    — párrafo descriptivo
 *   - image?:       string  — ruta de la foto de fondo (default: hero-dashboard.jpg)
 *   - action?:      { label, onClick, icon }  — CTA estandarizado a la derecha (ej. "Nuevo Rol")
 *   - actions?:     ReactNode                 — nodo libre a la derecha, por si se necesita algo a medida
 *
 * Uso:
 *   <PageHeader
 *     breadcrumb={[{ label: 'Inicio', href: route('dashboard') }, { label: 'Expedientes' }]}
 *     title="Expedientes"
 *     titleAccent="Electrónicos"
 *     description="Accede, consulta y da seguimiento a tus expedientes."
 *     image="/images/backgrounds/hero-expedientes.jpg"
 *   />
 */

import { Link } from '@inertiajs/react';

export default function PageHeader({
    breadcrumb = [],
    title,
    titleAccent,
    description,
    image = '/images/backgrounds/hero-dashboard.jpg',
    action = null,
    actions = null,
}) {
    const hasBreadcrumb = Array.isArray(breadcrumb) && breadcrumb.length > 0;
    const ActionIcon = action?.icon;
    const hasCta = Boolean(action || actions);

    return (
        <header className="relative overflow-hidden">
            {/* Foto de sección (zoom lento Ken Burns) */}
            <div
                className="absolute inset-0 bg-cover bg-center hero-kenburns"
                style={{ backgroundImage: `url(${image})` }}
            />
            {/* Velo de marca — oscuro a la izquierda (legibilidad) hacia rose a la derecha */}
            <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(100deg, rgba(41,17,54,0.95) 0%, rgba(74,21,61,0.88) 42%, rgba(190,15,74,0.60) 100%)' }}
            />
            {/* Águila a color de marca (se oculta si hay CTA para no chocar con el botón) */}
            {!hasCta && (
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none select-none absolute right-8 lg:right-14 top-1/2 -translate-y-1/2 h-[200px] w-auto z-10"
                    style={{ opacity: 0.9 }}
                />
            )}

            <div className="relative z-20 px-6 sm:px-10 py-10 flex items-center justify-between gap-6 flex-wrap hero-in">
                <div className="max-w-3xl">
                    {hasBreadcrumb && (
                        <nav aria-label="Breadcrumb" className="mb-4">
                            <ol className="flex flex-wrap items-center text-xs uppercase tracking-widest">
                                {breadcrumb.map((item, idx) => {
                                    const isLast = idx === breadcrumb.length - 1;
                                    const labelClass = isLast ? 'text-white font-medium' : 'text-white/60';
                                    return (
                                        <li key={`${item.label}-${idx}`} className="flex items-center">
                                            {item.href && !isLast ? (
                                                <Link
                                                    href={item.href}
                                                    className={`${labelClass} hover:text-white transition-colors cursor-pointer`}
                                                >
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <span className={labelClass}>{item.label}</span>
                                            )}
                                            {!isLast && (
                                                <span className="mx-2 text-white/30" aria-hidden="true">›</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ol>
                        </nav>
                    )}

                    <div className="w-12 h-[3px] bg-ankawa-rose mb-4" aria-hidden="true" />

                    <h1 className="font-black text-4xl md:text-5xl leading-tight text-white tracking-tight mb-2">
                        {title}
                        {titleAccent && (
                            <>
                                {' '}
                                <span className="text-ankawa-rose">{titleAccent}</span>
                            </>
                        )}
                    </h1>

                    {description && (
                        <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl">
                            {description}
                        </p>
                    )}
                </div>

                {hasCta && (
                    <div className="shrink-0 pt-1">
                        {action ? (
                            <button
                                type="button"
                                onClick={action.onClick}
                                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[15px] font-bold text-ankawa-deep bg-white hover:bg-white/90 shadow-lg shadow-black/20 transition-all hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-white/60"
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
