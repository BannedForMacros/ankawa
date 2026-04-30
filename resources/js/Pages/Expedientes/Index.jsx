import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link } from '@inertiajs/react';
import {
    Scale, ChevronRight, Search, User, Clock,
    Layers, Calendar, AlertTriangle, FolderOpen,
    Activity, AlertOctagon, CheckCircle2, X, Inbox,
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

function StatCard({ icon: Icon, label, value, tone = 'deep', accent }) {
    const palettes = {
        deep:    'from-[#291136] to-[#4A153D] text-white',
        rose:    'from-[#BE0F4A] to-[#BC1D35] text-white',
        emerald: 'from-emerald-50 to-white text-emerald-900 border border-emerald-100',
        amber:   'from-amber-50 to-white text-amber-900 border border-amber-100',
        red:     'from-red-50 to-white text-red-900 border border-red-100',
    };
    const iconBg = {
        deep:    'bg-white/10 text-white',
        rose:    'bg-white/15 text-white',
        emerald: 'bg-emerald-100 text-emerald-700',
        amber:   'bg-amber-100 text-amber-700',
        red:     'bg-red-100 text-red-700',
    };

    return (
        <div className={`relative rounded-2xl p-4 bg-gradient-to-br ${palettes[tone]} shadow-sm overflow-hidden`}>
            {accent && (
                <div className="absolute top-0 right-0 w-20 h-20 -mr-6 -mt-6 rounded-full bg-white/10 pointer-events-none"/>
            )}
            <div className="flex items-start justify-between gap-3 relative">
                <div className="min-w-0">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${tone === 'deep' || tone === 'rose' ? 'text-white/70' : 'text-current opacity-70'}`}>
                        {label}
                    </p>
                    <p className="text-3xl font-black mt-1 leading-none tabular-nums">{value}</p>
                </div>
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconBg[tone]}`}>
                    <Icon size={18} strokeWidth={2.2}/>
                </div>
            </div>
        </div>
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

    return (
        <AuthenticatedLayout>
            <Head title={titulo} />

            <PageHeader
                title={titulo}
                subtitle="Consulta y seguimiento de expedientes activos"
                icon={Scale}
            />

            <div className="pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Métricas / Overview ── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard
                            icon={FolderOpen}
                            label="Total"
                            value={stats.total}
                            tone="deep"
                            accent
                        />
                        <StatCard
                            icon={Activity}
                            label="Activos"
                            value={stats.activo}
                            tone="emerald"
                        />
                        <StatCard
                            icon={AlertOctagon}
                            label="Plazo crítico"
                            value={stats.vencidos + stats.criticos}
                            tone="red"
                        />
                        <StatCard
                            icon={Clock}
                            label="Por vencer"
                            value={stats.urgentes}
                            tone="amber"
                        />
                    </div>

                    {/* ── Barra de filtros ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                        {/* Filtros estado */}
                        <div className="flex gap-1.5 flex-wrap">
                            {filtroEstadoOptions.map(({ key, label, count }) => {
                                const active = filtroEstado === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setFiltroEstado(key)}
                                        className={`group px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            active
                                                ? 'bg-[#291136] text-white shadow-sm'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {active && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse shrink-0" />
                                        )}
                                        <span className="uppercase tracking-wide">{label}</span>
                                        <span className={`tabular-nums px-1.5 py-0.5 rounded-full text-[10px] ${
                                            active ? 'bg-white/15' : 'bg-white text-gray-500 border border-gray-200'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-2 items-center w-full lg:w-auto">
                            {/* Filtro urgencia rápido */}
                            <select
                                value={filtroUrgencia}
                                onChange={e => setFiltroUrgencia(e.target.value)}
                                className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                            >
                                <option value="todos">Plazo: todos</option>
                                <option value="criticos">Vencidos / críticos</option>
                                <option value="urgentes">Por vencer (≤5d)</option>
                                <option value="sin_plazo">Sin plazo activo</option>
                            </select>

                            {/* Buscador */}
                            <div className="relative flex-1 lg:w-72">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input
                                    type="text"
                                    placeholder="Buscar nº, servicio, etapa, responsable…"
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                                />
                                {busqueda && (
                                    <button
                                        onClick={() => setBusqueda('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#BE0F4A]"
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X size={14}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Conteo + reset ── */}
                    <div className="flex items-center justify-between text-xs">
                        <p className="text-gray-500 font-medium">
                            Mostrando <span className="font-bold text-[#291136] tabular-nums">{filtrados.length}</span>
                            {' '}de <span className="font-bold text-[#291136] tabular-nums">{expedientes.length}</span> expedientes
                        </p>
                        {hayFiltros && (
                            <button
                                onClick={() => { setBusqueda(''); setFiltroEstado('todos'); setFiltroUrgencia('todos'); }}
                                className="font-bold text-[#BE0F4A] hover:underline flex items-center gap-1"
                            >
                                <X size={12}/> Limpiar filtros
                            </button>
                        )}
                    </div>

                    {/* ── Lista ── */}
                    {filtrados.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-50 mx-auto mb-4 flex items-center justify-center">
                                <Inbox size={28} className="text-gray-300"/>
                            </div>
                            <p className="text-base font-semibold text-[#291136]">
                                {hayFiltros ? 'Sin resultados para los filtros aplicados' : 'No hay expedientes registrados'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                {hayFiltros ? 'Intenta limpiar los filtros para ver todos los expedientes.' : 'Los nuevos expedientes aparecerán aquí.'}
                            </p>
                            {hayFiltros && (
                                <button
                                    onClick={() => { setBusqueda(''); setFiltroEstado('todos'); setFiltroUrgencia('todos'); }}
                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-[#291136] text-white hover:bg-[#4A153D] transition-colors"
                                >
                                    <X size={12}/> Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {filtrados.map(exp => {
                                const mov    = exp.movimiento_urgente ?? null;
                                const nivel  = getUrgencia(mov?.dias_restantes ?? null);
                                const cfg    = nivel ? URGENCIA_CONFIG[nivel] : null;
                                const tieneAnim = cfg?.anim && cfg.anim !== '';
                                const isUrgente = nivel === 'vencido' || nivel === 'critico';

                                return (
                                    <Link
                                        key={exp.id}
                                        href={route('expedientes.show', exp.id)}
                                        className={`block bg-white rounded-2xl border border-gray-100 border-l-4 ${borderByEstado[exp.estado] ?? 'border-l-gray-200'} shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all group ${tieneAnim ? cfg.anim : ''}`}
                                    >
                                        <div className="flex items-start gap-4 p-4">
                                            {/* Icono */}
                                            <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                                                isUrgente
                                                    ? 'bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] text-white shadow-sm'
                                                    : 'bg-[#BE0F4A]/10 text-[#BE0F4A] group-hover:bg-[#BE0F4A]/15'
                                            }`}>
                                                <Scale size={20} strokeWidth={2}/>
                                            </div>

                                            {/* Cuerpo */}
                                            <div className="flex-1 min-w-0">
                                                {/* Línea 1: número + estado + plazo */}
                                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        <span className="font-black font-mono text-[#291136] text-sm tracking-tight">
                                                            {exp.numero_expediente}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${estadoColors[exp.estado] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {exp.estado}
                                                        </span>
                                                    </div>
                                                    {mov && <PlazoLabel mov={mov} />}
                                                </div>

                                                {/* Línea 2: servicio (título) */}
                                                {exp.servicio && (
                                                    <h3 className="text-base font-bold text-[#291136] mt-1.5 leading-snug truncate">
                                                        {exp.servicio}
                                                    </h3>
                                                )}

                                                {/* Línea 3: meta — etapa · responsable(s) · fecha */}
                                                <div className="flex items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500 flex-wrap">
                                                    {exp.etapa && (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <Layers size={11} className="text-[#BE0F4A]"/>
                                                            <span className="font-semibold text-[#BE0F4A]">{exp.etapa}</span>
                                                        </span>
                                                    )}
                                                    {(exp.responsables?.length > 0 || exp.gestor) && (
                                                        <span className="inline-flex items-center gap-1.5"
                                                            title={exp.responsables?.join(', ')}>
                                                            <User size={11} className="text-gray-400"/>
                                                            <span>
                                                                {exp.responsables?.length > 1
                                                                    ? `${exp.responsables[0]} +${exp.responsables.length - 1}`
                                                                    : (exp.responsables?.[0] ?? exp.gestor)}
                                                            </span>
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Calendar size={11} className="text-gray-400"/>
                                                        <span className="tabular-nums">{exp.created_at}</span>
                                                    </span>
                                                </div>

                                                {/* Bloque de pendiente — destacado */}
                                                {mov && (
                                                    <div className={`mt-3 flex items-start gap-2 rounded-lg px-3 py-2 border ${
                                                        isUrgente
                                                            ? 'bg-red-50/60 border-red-100'
                                                            : nivel === 'urgente'
                                                                ? 'bg-amber-50/60 border-amber-100'
                                                                : 'bg-gray-50 border-gray-100'
                                                    }`}>
                                                        <AlertTriangle
                                                            size={13}
                                                            className={`shrink-0 mt-0.5 ${
                                                                isUrgente ? 'text-red-500' :
                                                                nivel === 'urgente' ? 'text-amber-500' :
                                                                'text-[#BE0F4A]'
                                                            }`}
                                                            strokeWidth={2.4}
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                                                isUrgente ? 'text-red-700' :
                                                                nivel === 'urgente' ? 'text-amber-700' :
                                                                'text-[#BE0F4A]'
                                                            }`}>
                                                                Pendiente
                                                            </p>
                                                            <p className="text-xs text-gray-700 mt-0.5 line-clamp-2">
                                                                {mov.instruccion}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chevron */}
                                            <ChevronRight
                                                size={18}
                                                className="shrink-0 text-gray-300 group-hover:text-[#BE0F4A] group-hover:translate-x-0.5 transition-all self-center"
                                            />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
