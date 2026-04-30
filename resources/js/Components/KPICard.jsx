/**
 * KPICard — Tarjeta de indicador (KPI) para resúmenes editoriales Ankawa.
 *
 * Componente puramente presentacional, sin defaults visibles en label/value/
 * unit/footer: si una prop opcional no llega, esa parte no se renderiza.
 * Solo `accentColor` tiene fallback ('deep') porque es decisión visual, no
 * dato del backend.
 *
 * Props:
 *   - label:        string                                 — obligatorio (font-mono uppercase)
 *   - value:        number | string                        — obligatorio (serif grande)
 *   - unit?:        string                                 — sufijo del valor
 *   - icon?:        ReactNode                              — usualmente <LucideIcon size={18} />
 *   - accentColor?: 'deep' | 'rose' | 'crimson' | 'muted'  — default 'deep'
 *   - footer?:      ReactNode                              — pie opcional
 */

const ACCENT_BORDER = {
    deep:    'border-t-ankawa-deep',
    rose:    'border-t-ankawa-rose',
    crimson: 'border-t-ankawa-crimson',
    muted:   'border-t-ankawa-muted',
};

export default function KPICard({
    label,
    value,
    unit,
    icon,
    accentColor = 'deep',
    footer,
}) {
    const accentClass = ACCENT_BORDER[accentColor] ?? ACCENT_BORDER.deep;

    return (
        <div className={`relative bg-white rounded-xl px-5 py-4 border border-ankawa-deep/[0.08] border-t-[3px] ${accentClass} flex flex-col gap-2.5`}>
            <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-xs tracking-widest uppercase text-ankawa-deep/60">
                    {label}
                </span>
                {icon && (
                    <span className="text-ankawa-deep/40 shrink-0 leading-none">
                        {icon}
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-serif text-5xl font-medium text-ankawa-deep leading-none tabular-nums">
                    {value}
                </span>
                {unit && (
                    <span className="font-mono text-xs text-ankawa-deep/60">
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
