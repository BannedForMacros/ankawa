/**
 * KPICard — Tarjeta de indicador (KPI) para resúmenes editoriales Ankawa.
 *
 * Componente puramente presentacional, sin defaults visibles en label/value/
 * unit/footer: si una prop opcional no llega, esa parte no se renderiza.
 * Solo `accentColor` tiene fallback ('deep') porque es decisión visual, no
 * dato del backend.
 *
 * Props:
 *   - label:        string                                 — obligatorio (uppercase)
 *   - value:        number | string                        — obligatorio (número grande)
 *   - unit?:        string                                 — sufijo del valor
 *   - icon?:        ReactNode                              — usualmente <LucideIcon size={18} />
 *   - accentColor?: 'deep' | 'rose' | 'crimson' | 'muted'  — default 'deep'
 *   - footer?:      ReactNode                              — pie opcional
 *   - variant?:     'outline' | 'filled'                   — default 'outline' (borde);
 *                                                            'filled' = fondo de marca + texto blanco
 */

import { cloneElement, isValidElement, useState, useEffect, useRef } from 'react';

/* Cuenta ascendente para los valores numéricos (solo cuando enabled). */
function useCountUp(value, enabled) {
    const [display, setDisplay] = useState(() => (enabled ? 0 : value));
    const raf = useRef(0);
    useEffect(() => {
        if (!enabled || typeof value !== 'number' || !Number.isFinite(value)) {
            setDisplay(value);
            return;
        }
        const duration = 750;
        let startTs;
        const step = (ts) => {
            if (startTs === undefined) startTs = ts;
            const p = Math.min(1, (ts - startTs) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(value * eased));
            if (p < 1) raf.current = requestAnimationFrame(step);
        };
        raf.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf.current);
    }, [value, enabled]);
    return display;
}

const ACCENT_BORDER = {
    deep:    'border-t-ankawa-deep',
    rose:    'border-t-ankawa-rose',
    crimson: 'border-t-ankawa-crimson',
    muted:   'border-t-ankawa-muted',
};

/* Fondos degradados de la paleta para la variante 'filled' — todos armonizan
   resolviendo hacia el plum profundo de marca. */
const FILLED_BG = {
    deep:    'linear-gradient(135deg, #291136 0%, #4A153D 100%)',
    rose:    'linear-gradient(135deg, #BE0F4A 0%, #4A153D 100%)',
    crimson: 'linear-gradient(135deg, #BC1D35 0%, #4A153D 100%)',
    muted:   'linear-gradient(135deg, #B23241 0%, #291136 100%)',
};

/* RGB de cada acento para tintar sutilmente el cuerpo y el sello de icono. */
const ACCENT_RGB = {
    deep:    '41,17,54',
    rose:    '190,15,74',
    crimson: '188,29,53',
    muted:   '178,50,65',
};

export default function KPICard({
    label,
    value,
    unit,
    icon,
    accentColor = 'deep',
    footer,
    variant = 'outline',
}) {
    const accentClass = ACCENT_BORDER[accentColor] ?? ACCENT_BORDER.deep;

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const countEnabled = variant === 'filled' && typeof value === 'number' && !prefersReduced;
    const shown = useCountUp(value, countEnabled);

    /* Variante rellena: card con fondo de marca y texto blanco (usada en el
       Panel de Control para dar color). El resto de la app usa 'outline'. */
    if (variant === 'filled') {
        const rgb = ACCENT_RGB[accentColor] ?? ACCENT_RGB.deep;
        return (
            <div className="rounded-xl overflow-hidden shadow-md border border-ankawa-deep/20 flex flex-col transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
                {/* Banda de título con gradiente de marca — el título va solo y primero */}
                <div
                    className="px-4 py-3"
                    style={{ background: FILLED_BG[accentColor] ?? FILLED_BG.deep }}
                >
                    <span className="block text-sm font-bold tracking-wide uppercase text-white leading-snug">
                        {label}
                    </span>
                </div>

                {/* Cuerpo: cantidad grande + sello de icono de fondo (mata el blanco plano) */}
                <div
                    className="relative overflow-hidden px-5 py-5 flex-1"
                    style={{ background: `linear-gradient(135deg, rgba(${rgb},0.04) 0%, rgba(${rgb},0.13) 100%)` }}
                >
                    {icon && (
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-4 -right-3"
                            style={{ color: `rgba(${rgb},0.18)` }}
                        >
                            {isValidElement(icon) ? cloneElement(icon, { size: 108, strokeWidth: 1.5, className: '' }) : icon}
                        </span>
                    )}
                    <div className="relative flex items-baseline gap-2 flex-wrap">
                        <span className="text-5xl font-semibold text-ankawa-deep leading-none tabular-nums">
                            {shown}
                        </span>
                        {unit && <span className="text-xs text-ankawa-deep/60">{unit}</span>}
                    </div>
                    {footer && <div className="relative text-sm text-ankawa-deep/60 mt-2">{footer}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-white rounded-xl px-5 py-4 border border-ankawa-deep/[0.08] border-t-[3px] ${accentClass} flex flex-col gap-2.5`}>
            <div className="flex items-start justify-between gap-3">
                <span className="text-xs tracking-widest uppercase text-ankawa-deep/60">
                    {label}
                </span>
                {icon && (
                    <span className="text-ankawa-deep/40 shrink-0 leading-none">
                        {icon}
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-5xl font-semibold text-ankawa-deep leading-none tabular-nums">
                    {value}
                </span>
                {unit && (
                    <span className="text-xs text-ankawa-deep/60">
                        {unit}
                    </span>
                )}
            </div>

            {footer && (
                <div className="text-sm text-ankawa-deep/60">
                    {footer}
                </div>
            )}
        </div>
    );
}
