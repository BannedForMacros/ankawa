/**
 * DonutChart — distribución como dona con Recharts + total centrado.
 * API: { data:[{label,total}], emptyLabel? }.
 *
 * Paleta cohesionada en la familia rose (tonal), no toda la paleta de marca.
 * Leyenda propia debajo → la dona queda centrada y el total calza exacto.
 */
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';

// Rampa tonal rose (oscuro → claro), sin negros/plomos que ensucien.
const RAMPA_ROSE = ['#BE0F4A', '#8A0A37', '#E0436F', '#5C0822', '#F2A0B8', '#A30C3E'];

export default function DonutChart({ data = [], emptyLabel = 'Sin datos' }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-4">{emptyLabel}</p>;
    }

    const total = data.reduce((acc, d) => acc + (Number(d.total) || 0), 0);

    return (
        <div>
            <div className="relative" style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="total"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={62}
                            outerRadius={86}
                            paddingAngle={data.length > 1 ? 3 : 0}
                            cornerRadius={4}
                            stroke="none"
                            isAnimationActive
                            animationDuration={700}
                        >
                            {data.map((_, i) => <Cell key={i} fill={RAMPA_ROSE[i % RAMPA_ROSE.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Total exactamente al centro de la dona */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-semibold leading-none text-ankawa-deep tabular-nums">{total}</span>
                    <span className="text-[10px] uppercase tracking-widest text-ankawa-deep/45 mt-1.5">Total</span>
                </div>
            </div>

            {/* Leyenda propia */}
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-4">
                {data.map((d, i) => (
                    <li key={`${d.label}-${i}`} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: RAMPA_ROSE[i % RAMPA_ROSE.length] }} />
                        <span className="text-sm text-ankawa-deep/70">{d.label}</span>
                        <span className="text-sm tabular-nums text-ankawa-deep">{d.total}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
