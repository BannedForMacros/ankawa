import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import SectionHeading from '@/Components/SectionHeading';
import KPIGrid from '@/Components/KPIGrid';
import KPICard from '@/Components/KPICard';
import SectionDivider from '@/Components/SectionDivider';
import ListingSection from '@/Components/ListingSection';
import { Head, Link } from '@inertiajs/react';
import {
    Scale, ChevronRight, Search, User, Clock,
    Layers, Calendar, AlertTriangle, Folder,
    Activity, X, Inbox,
} from 'lucide-react';
import { useState, useMemo } from 'react';

const estadoColors = {
    activo:     'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspendido: 'bg-amber-50 text-amber-700 border-amber-200',
    concluido:  'bg-gray-100 text-gray-500 border-gray-200',
};

const borderByEstado = {
    activo:     'border-l-emerald-400',
    suspendido: 'border-l-amber-400',
    concluido:  'border-l-gray-300',
};

function getUrgencia(diasRestantes) {
    if (diasRestantes === null || diasRestantes === undefined) return null;
    if (diasRestantes <= 0)  return 'vencido';
    if (diasRestantes <= 2)  return 'critico';
    if (diasRestantes <= 5)  return 'urgente';
    if (diasRestantes <= 10) return 'proximo';
    return 'normal';
}

const URGENCIA_CONFIG = {
    vencido: {
        anim:  'animate-float-urgent',
        badge: 'bg-red-50 text-red-700 border-red-200',
        dot:   'bg-red-500',
        ring:  'ring-red-200',
        accent:'bg-red-500',
    },
    critico: {
        anim:  'animate-float-med',
        badge: 'bg-orange-50 text-orange-700 border-orange-200',
        dot:   'bg-orange-500',
        ring:  'ring-orange-200',
        accent:'bg-orange-500',
    },
    urgente: {
        anim:  'animate-float-slow',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        dot:   'bg-amber-400',
        ring:  'ring-amber-200',
        accent:'bg-amber-400',
    },
    proximo: {
        anim:  '',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        dot:   'bg-blue-400',
        ring:  'ring-blue-100',
        accent:'bg-blue-400',
    },
    normal: {
        anim:  '',
        badge: 'bg-gray-100 text-gray-500 border-gray-200',
        dot:   'bg-gray-400',
        ring:  'ring-gray-100',
        accent:'bg-gray-300',
    },
};

function PlazoLabel({ mov, size = 'sm' }) {
    if (!mov) return null;
    const dias = mov.dias_restantes;
    const nivel = getUrgencia(dias);
    if (!nivel) return null;
    const cfg = URGENCIA_CONFIG[nivel];

    let texto;
    if (dias === null || dias === undefined) {
        texto = mov.fecha_limite ? `Vence ${mov.fecha_limite}` : null;
    } else if (dias <= 0) {
        texto = dias === 0 ? 'Vence hoy' : `Vencido hace ${Math.abs(dias)}d`;
    } else {
        const sufijo = mov.tipo_dias === 'habiles' ? ' háb.' : 'd';
        texto = `${dias}${sufijo} restantes`;
    }

    if (!texto) return null;

    const cls = size === 'sm'
        ? 'text-[10px] px-2 py-0.5'
        : 'text-xs px-2.5 py-1';

    return (
        <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${cls} ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${nivel !== 'normal' && nivel !== 'proximo' ? 'animate-pulse' : ''}`}/>
            <Clock size={size === 'sm' ? 9 : 11}/>
            {texto}
        </span>
    );
}

export default function Index({ expedientes = [], titulo = 'Expedientes' }) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroUrgencia, setFiltroUrgencia] = useState('todos');

    const stats = useMemo(() => {
        const base = {
            total:      expedientes.length,
            activo:     0,
            suspendido: 0,
            concluido:  0,
            vencidos:   0,
            criticos:   0,
            urgentes:   0,
        };
        for (const exp of expedientes) {
            if (base[exp.estado] !== undefined) base[exp.estado]++;
            const dias = exp.movimiento_urgente?.dias_restantes;
            const niv  = getUrgencia(dias);
            if (niv === 'vencido') base.vencidos++;
            else if (niv === 'critico') base.criticos++;
            else if (niv === 'urgente') base.urgentes++;
        }
        return base;
    }, [expedientes]);

    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return expedientes.filter(exp => {
            const responsablesTexto = (exp.responsables ?? []).join(' ').toLowerCase();
            const coincideBusqueda = !q ||
                exp.numero_expediente?.toLowerCase().includes(q) ||
                exp.servicio?.toLowerCase().includes(q) ||
                exp.etapa?.toLowerCase().includes(q) ||
                exp.gestor?.toLowerCase().includes(q) ||
                responsablesTexto.includes(q);
            const coincideEstado = filtroEstado === 'todos' || exp.estado === filtroEstado;

            let coincideUrg = true;
            if (filtroUrgencia !== 'todos') {
                const nivel = getUrgencia(exp.movimiento_urgente?.dias_restantes);
                if (filtroUrgencia === 'criticos') coincideUrg = nivel === 'vencido' || nivel === 'critico';
                else if (filtroUrgencia === 'urgentes') coincideUrg = nivel === 'urgente';
                else if (filtroUrgencia === 'sin_plazo') coincideUrg = !exp.movimiento_urgente;
            }
            return coincideBusqueda && coincideEstado && coincideUrg;
        });
    }, [expedientes, busqueda, filtroEstado, filtroUrgencia]);

    const filtroEstadoOptions = [
        { key: 'todos',      label: 'Todos',       count: stats.total },
        { key: 'activo',     label: 'Activos',     count: stats.activo },
        { key: 'suspendido', label: 'Suspendidos', count: stats.suspendido },
        { key: 'concluido',  label: 'Concluidos',  count: stats.concluido },
    ];

    const hayFiltros = filtroEstado !== 'todos' || filtroUrgencia !== 'todos' || busqueda.length > 0;

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroEstado('todos');
        setFiltroUrgencia('todos');
    };

    const filtrosBar = (
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex gap-1.5 flex-wrap">
                {filtroEstadoOptions.map(({ key, label, count }) => {
                    const active = filtroEstado === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setFiltroEstado(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                                active
                                    ? 'bg-ankawa-deep text-white shadow-sm'
                                    : 'bg-ankawa-deep/[0.05] text-ankawa-deep/75 hover:bg-ankawa-deep/[0.10]'
                            }`}
                        >
                            {active && (
                                <span className="w-1.5 h-1.5 rounded-full bg-ankawa-rose animate-pulse shrink-0" />
                            )}
                            <span className="uppercase tracking-wide">{label}</span>
                            <span className={`tabular-nums px-1.5 py-0.5 rounded-full text-[10px] ${
                                active ? 'bg-white/15' : 'bg-white text-ankawa-deep/65 border border-ankawa-deep/[0.08]'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-2 items-center w-full lg:w-auto">
                <select
                    value={filtroUrgencia}
                    onChange={e => setFiltroUrgencia(e.target.value)}
                    className="text-xs font-medium text-ankawa-deep/85 bg-white border border-ankawa-deep/[0.15] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ankawa-rose/20 focus:border-ankawa-rose"
                >
                    <option value="todos">Plazo: todos</option>
                    <option value="criticos">Vencidos / críticos</option>
                    <option value="urgentes">Por vencer (≤5d)</option>
                    <option value="sin_plazo">Sin plazo activo</option>
                </select>

                <div className="relative flex-1 lg:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ankawa-deep/40"/>
                    <input
                        type="text"
                        placeholder="Buscar nº, servicio, etapa, responsable…"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-ankawa-deep/[0.15] rounded-lg focus:outline-none focus:ring-2 focus:ring-ankawa-rose/20 focus:border-ankawa-rose"
                    />
                    {busqueda && (
                        <button
                            onClick={() => setBusqueda('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-ankawa-deep/40 hover:text-ankawa-rose"
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={14}/>
                        </button>
                    )}
                </div>

                {hayFiltros && (
                    <button
                        onClick={limpiarFiltros}
                        className="text-xs font-semibold text-ankawa-rose hover:text-ankawa-rose-hover whitespace-nowrap flex items-center gap-1 normal-case"
                    >
                        <X size={12}/> Limpiar
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title={titulo} />

            <PageHeader
                breadcrumb={[
                    { label: 'Inicio',       href: route('dashboard') },
                    { label: 'Expedientes' },
                ]}
                title="Expedientes"
                titleAccent="Electrónicos"
                description="Accede, consulta y da seguimiento a tus expedientes electrónicos de manera centralizada."
            />

            <div className="pt-10 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── Resumen ── */}
                    <section>
                        <SectionHeading title="Resumen del libro registro" />

                        <KPIGrid>
                            <KPICard
                                label="Total"
                                value={stats.total}
                                unit="expedientes"
                                icon={<Folder size={18} strokeWidth={1.8} />}
                                accentColor="deep"
                            />
                            <KPICard
                                label="En trámite"
                                value={stats.activo}
                                unit="activos"
                                icon={<Activity size={18} strokeWidth={1.8} />}
                                accentColor="rose"
                            />
                            <KPICard
                                label="Plazo crítico"
                                value={stats.vencidos + stats.criticos}
                                unit="≤ 2 días"
                                icon={<AlertTriangle size={18} strokeWidth={1.8} />}
                                accentColor="crimson"
                            />
                            <KPICard
                                label="Por vencer"
                                value={stats.urgentes}
                                unit="3 a 5 días"
                                icon={<Calendar size={18} strokeWidth={1.8} />}
                                accentColor="muted"
                            />
                        </KPIGrid>
                    </section>

                    <SectionDivider />

                    {/* ── Listado ── */}
                    <ListingSection
                        title="Listado de expedientes"
                        description="Consulta, filtra y abre cualquier expediente bajo tu jurisdicción."
                        meta={`Mostrando ${filtrados.length} de ${expedientes.length} expedientes`}
                        filters={filtrosBar}
                    >
                        {filtrados.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-ankawa-deep/[0.08] py-20 px-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-ankawa-deep/[0.04] mx-auto mb-4 flex items-center justify-center">
                                    <Inbox size={28} className="text-ankawa-deep/30"/>
                                </div>
                                <p className="text-base font-semibold text-ankawa-deep">
                                    {hayFiltros ? 'Sin resultados para los filtros aplicados' : 'No hay expedientes registrados'}
                                </p>
                                <p className="text-sm text-ankawa-deep/55 mt-1">
                                    {hayFiltros ? 'Intenta limpiar los filtros para ver todos los expedientes.' : 'Los nuevos expedientes aparecerán aquí.'}
                                </p>
                                {hayFiltros && (
                                    <button
                                        onClick={limpiarFiltros}
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-ankawa-deep text-white hover:bg-ankawa-deep-hover transition-colors"
                                    >
                                        <X size={12}/> Limpiar filtros
                                    </button>
                                )}
                            </div>
                        ) : (
                            filtrados.map(exp => {
                                const mov    = exp.movimiento_urgente ?? null;
                                const nivel  = getUrgencia(mov?.dias_restantes ?? null);
                                const cfg    = nivel ? URGENCIA_CONFIG[nivel] : null;
                                const tieneAnim = cfg?.anim && cfg.anim !== '';
                                const isUrgente = nivel === 'vencido' || nivel === 'critico';

                                return (
                                    <Link
                                        key={exp.id}
                                        href={route('expedientes.show', exp.id)}
                                        className={`block bg-white rounded-2xl border border-ankawa-deep/[0.08] border-l-4 ${borderByEstado[exp.estado] ?? 'border-l-gray-200'} shadow-sm hover:shadow-md hover:border-ankawa-deep/20 transition-all group ${tieneAnim ? cfg.anim : ''}`}
                                    >
                                        <div className="flex items-start gap-4 p-4">
                                            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                                                isUrgente
                                                    ? 'bg-gradient-to-br from-ankawa-rose to-ankawa-crimson text-white shadow-sm'
                                                    : 'bg-ankawa-rose/10 text-ankawa-rose group-hover:bg-ankawa-rose/15'
                                            }`}>
                                                <Scale size={20} strokeWidth={2}/>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        <span className="font-black font-mono text-ankawa-deep text-sm tracking-tight">
                                                            {exp.numero_expediente}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${estadoColors[exp.estado] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {exp.estado}
                                                        </span>
                                                    </div>
                                                    {mov && <PlazoLabel mov={mov} />}
                                                </div>

                                                {exp.servicio && (
                                                    <h3 className="text-base font-bold text-ankawa-deep mt-1.5 leading-snug truncate">
                                                        {exp.servicio}
                                                    </h3>
                                                )}

                                                <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-ankawa-deep/55 flex-wrap">
                                                    {exp.etapa && (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Layers size={11} className="text-ankawa-rose"/>
                                                            <span className="font-semibold text-ankawa-rose">{exp.etapa}</span>
                                                        </span>
                                                    )}
                                                    {(exp.responsables?.length > 0 || exp.gestor) && (
                                                        <span className="inline-flex items-center gap-1.5"
                                                            title={exp.responsables?.join(', ')}>
                                                            <User size={11} className="text-ankawa-deep/40"/>
                                                            <span>
                                                                {exp.responsables?.length > 1
                                                                    ? `${exp.responsables[0]} +${exp.responsables.length - 1}`
                                                                    : (exp.responsables?.[0] ?? exp.gestor)}
                                                            </span>
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Calendar size={11} className="text-ankawa-deep/40"/>
                                                        <span className="tabular-nums">{exp.created_at}</span>
                                                    </span>
                                                </div>

                                                {mov && (
                                                    <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 border ${
                                                        isUrgente
                                                            ? 'bg-red-50/60 border-red-100'
                                                            : nivel === 'urgente'
                                                                ? 'bg-amber-50/60 border-amber-100'
                                                                : 'bg-ankawa-deep/[0.03] border-ankawa-deep/[0.08]'
                                                    }`}>
                                                        <AlertTriangle
                                                            size={13}
                                                            className={`shrink-0 mt-0.5 ${
                                                                isUrgente ? 'text-red-500' :
                                                                nivel === 'urgente' ? 'text-amber-500' :
                                                                'text-ankawa-rose'
                                                            }`}
                                                            strokeWidth={2.4}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                                                isUrgente ? 'text-red-700' :
                                                                nivel === 'urgente' ? 'text-amber-700' :
                                                                'text-ankawa-rose'
                                                            }`}>
                                                                Pendiente
                                                            </p>
                                                            <p className="text-xs text-ankawa-deep/75 mt-0.5 line-clamp-2">
                                                                {mov.instruccion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <ChevronRight
                                                size={18}
                                                className="shrink-0 text-ankawa-deep/25 group-hover:text-ankawa-rose group-hover:translate-x-0.5 transition-all self-center"
                                            />
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </ListingSection>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
