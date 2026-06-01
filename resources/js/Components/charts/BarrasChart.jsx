/**
 * BarrasChart — barras horizontales con Recharts (variante con librería).
 * Misma API que BarrasHorizontales: { data:[{label,total}], color?, emptyLabel? }.
 *
 * Paleta cohesionada en la familia rose con degradado (sin negros).
 *   color='rose' → rose vivo · color='deep' → rose profundo (mismo tono, más oscuro)
 */
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, LabelList, Cell,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

const GRAD = {
    rose: { id: 'ankawaBarRose', from: '#E0436F', to: '#BE0F4A' },
    deep: { id: 'ankawaBarDeep', from: '#BE0F4A', to: '#8A0A37' },
};

export default function BarrasChart({ data = [], color = 'rose', emptyLabel = 'Sin datos' }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-4">{emptyLabel}</p>;
    }

    const grad = GRAD[color] ?? GRAD.rose;
    const height = Math.max(data.length * 46, 90);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 0, bottom: 4 }}>
                <defs>
                    <linearGradient id={grad.id} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={grad.from} />
                        <stop offset="100%" stopColor={grad.to} />
                    </linearGradient>
                </defs>
                <CartesianGrid horizontal={false} stroke="#29113610" />
                <XAxis type="number" hide />
                <YAxis
                    type="category"
                    dataKey="label"
                    width={150}
                    tick={{ fontSize: 12, fill: '#291136b3' }}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip cursor={{ fill: '#be0f4a0a' }} content={<ChartTooltip />} />
                <Bar dataKey="total" radius={[0, 7, 7, 0]} barSize={16} isAnimationActive animationDuration={700}>
                    {data.map((_, i) => <Cell key={i} fill={`url(#${grad.id})`} />)}
                    <LabelList
                        dataKey="total"
                        position="right"
                        style={{ fontSize: 12, fontFamily: 'monospace', fill: '#291136' }}
                    />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
