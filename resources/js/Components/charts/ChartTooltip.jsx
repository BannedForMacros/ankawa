/**
 * Tooltip de marca compartido para los gráficos Recharts de Ankawa.
 * Fondo deep, texto claro, acento rose en el valor.
 */
export default function ChartTooltip({ active, payload, label, suffix = '' }) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    const titulo = label ?? item.name ?? item.payload?.label;
    return (
        <div className="rounded-lg bg-white px-3 py-2 shadow-lg border border-ankawa-deep/10 ring-1 ring-black/[0.03]">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ankawa-deep/50">{titulo}</p>
            <p className="font-serif text-lg leading-none mt-0.5">
                <span className="text-ankawa-rose">{item.value}</span>
                {suffix && <span className="text-ankawa-deep/50 text-xs ml-1">{suffix}</span>}
            </p>
        </div>
    );
}
