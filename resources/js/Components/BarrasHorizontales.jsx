/**
 * BarrasHorizontales — gráfico de barras horizontales ligero (sin dependencias).
 *
 * Para distribuciones tipo {label, total}: expedientes por servicio, carga por
 * gestor, casos por etapa. Barra proporcional al máximo, en color de marca.
 *
 * Props:
 *   - data:   Array<{ label: string, total: number }>
 *   - color?: 'rose' | 'deep'   (default 'rose')
 *   - emptyLabel?: string       texto cuando no hay datos
 */

const BARRA = {
    rose: 'bg-ankawa-rose',
    deep: 'bg-ankawa-deep',
};

export default function BarrasHorizontales({ data = [], color = 'rose', emptyLabel = 'Sin datos' }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-4">{emptyLabel}</p>;
    }

    const max = Math.max(...data.map((d) => Number(d.total) || 0), 1);
    const barClass = BARRA[color] ?? BARRA.rose;

    return (
        <ul className="flex flex-col gap-3">
            {data.map((d, i) => {
                const total = Number(d.total) || 0;
                const pct = Math.max((total / max) * 100, total > 0 ? 4 : 0);
                return (
                    <li key={`${d.label}-${i}`} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 truncate text-sm text-ankawa-deep/70" title={d.label}>
                            {d.label}
                        </span>
                        <div className="flex-1 h-2.5 rounded-full bg-ankawa-deep/[0.06] overflow-hidden">
                            <div
                                className={`h-full rounded-full ${barClass} transition-[width] duration-700 ease-out`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-ankawa-deep">
                            {total}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
