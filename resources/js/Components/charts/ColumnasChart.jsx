/**
 * ColumnasChart — serie temporal corta con Recharts (área con gradiente de marca).
 * Misma API que ColumnasMensuales: { data:[{label,total}] }.
 */
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip,
} from 'recharts';
import ChartTooltip from './ChartTooltip';

export default function ColumnasChart({ data = [] }) {
    if (!data || data.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-4">Sin datos</p>;
    }

    return (
        <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
                <defs>
                    <linearGradient id="ankawaAreaRose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#BE0F4A" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#BE0F4A" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#29113610" />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#29113680' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis hide allowDecimals={false} />
                <Tooltip cursor={{ stroke: '#BE0F4A', strokeWidth: 1, strokeDasharray: '4 4' }} content={<ChartTooltip suffix="cargos" />} />
                <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#BE0F4A"
                    strokeWidth={2.5}
                    fill="url(#ankawaAreaRose)"
                    dot={{ r: 3, fill: '#BE0F4A', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#BE0F4A' }}
                    isAnimationActive
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
