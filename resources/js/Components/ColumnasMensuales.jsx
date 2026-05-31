/**
 * ColumnasMensuales — mini gráfico de columnas verticales (sin dependencias).
 *
 * Para series temporales cortas tipo {label, total} (ej. cargos emitidos por mes).
 * Columnas de altura proporcional al máximo, en color de marca.
 *
 * Props:
 *   - data: Array<{ label: string, total: number }>
 */

export default function ColumnasMensuales({ data = [] }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-4">Sin datos</p>;
    }

    const max = Math.max(...data.map((d) => Number(d.total) || 0), 1);

    return (
        <div className="flex items-end justify-between gap-2 h-32">
            {data.map((d, i) => {
                const total = Number(d.total) || 0;
                const pct = total > 0 ? Math.max((total / max) * 100, 6) : 2;
                return (
                    <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="font-mono text-xs tabular-nums text-ankawa-deep/70">{total}</span>
                        <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                            <div
                                className="w-full max-w-[2.5rem] rounded-t-md bg-gradient-to-t from-ankawa-deep to-ankawa-rose transition-[height] duration-700 ease-out"
                                style={{ height: `${pct}%` }}
                            />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-ankawa-deep/50">
                            {d.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
