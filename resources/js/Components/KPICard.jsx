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

import { cloneElement, isValidElement } from 'react';

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

    /* Variante rellena: card con fondo de marca y texto blanco (usada en el
       Panel de Control para dar color). El resto de la app usa 'outline'. */
    if (variant === 'filled') {
        return (
            <div
                className="relative rounded-xl px-5 py-4 shadow-sm overflow-hidden flex flex-col gap-2.5 text-white"
                style={{ background: FILLED_BG[accentColor] ?? FILLED_BG.deep }}
            >
                <div className="flex items-start justify-between gap-3">
                    <span className="text-xs tracking-widest uppercase text-white/75">
                        {label}
                    </span>
                    {icon && (
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15 ring-1 ring-white/20 shrink-0">
                            {isValidElement(icon) ? cloneElement(icon, { size: 20, strokeWidth: 2, className: 'text-white' }) : icon}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-5xl font-semibold leading-none tabular-nums">
                        {value}
                    </span>
                    {unit && <span className="text-xs text-white/70">{unit}</span>}
                </div>

                {footer && <div className="text-sm text-white/70">{footer}</div>}
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
