import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle, Clock, CheckCircle, ChevronRight,
    Inbox, Scale, Users, CalendarX, TrendingUp
} from 'lucide-react';

function UrgenciaChip({ urgencia, diasRestantes }) {
    if (urgencia === 'vencido') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200">
            <CalendarX size={11}/> Vencido hace {Math.abs(diasRestantes)} día(s)
        </span>
    );
    if (urgencia === 'proximo') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">
            <Clock size={11}/> {diasRestantes === 0 ? 'Vence hoy' : `${diasRestantes} día(s) restante(s)`}
        </span>
    );
    if (urgencia === 'ok') return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle size={11}/> {diasRestantes} día(s) restante(s)
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-400">
            Sin plazo configurado
        </span>
    );
}

function AccentBar({ urgencia }) {
    const colors = {
        vencido:   'bg-red-500',
        proximo:   'bg-amber-400',
        ok:        'bg-emerald-400',
        sin_plazo: 'bg-gray-200',
    };
    return <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${colors[urgencia] ?? 'bg-gray-200'}`}/>;
}

export default function Dashboard({ pendientes = [], stats = {} }) {
    const statCards = [
        {
            label:  'Pendientes para mí',
            value:  stats.mi_cola ?? 0,
            Icon:   Inbox,
            color:  'bg-[#291136]/5 text-[#291136]',
            accent: 'border-[#291136]/20',
        },
        {
            label:  'Vencidos',
            value:  stats.vencidos ?? 0,
            Icon:   CalendarX,
            color:  stats.vencidos > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400',
            accent: stats.vencidos > 0 ? 'border-red-200' : 'border-gray-100',
        },
        {
            label:  'Próximos a vencer',
            value:  stats.proximos ?? 0,
            Icon:   Clock,
            color:  stats.proximos > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400',
            accent: stats.proximos > 0 ? 'border-amber-200' : 'border-gray-100',
        },
        {
            label:  'Total en curso',
            value:  stats.total_curso ?? 0,
            Icon:   TrendingUp,
            color:  'bg-blue-50 text-blue-700',
            accent: 'border-blue-100',
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-[#291136]">
                    Panel de Control
                </h2>
            }
        >
            <Head title="Panel de Control" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

                    {/* ── Stats Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map(({ label, value, Icon, color, accent }) => (
                            <div key={label} className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${accent}`}>
                                <div className={`p-3 rounded-xl shrink-0 ${color}`}>
                                    <Icon size={22}/>
                                </div>
                                <div className="min-w-0">
                                    <div className="text-2xl font-black text-[#291136]">{value}</div>
                                    <div className="text-xs text-gray-400 font-medium leading-tight">{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Lista de pendientes ── */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-[#291136]">Mis Expedientes Pendientes</h3>
                                <p className="text-sm text-gray-400">Ordenados por urgencia — los más críticos primero.</p>
                            </div>
                            <Link href={route('expedientes.index')}
                                className="text-xs font-bold text-[#BE0F4A] hover:underline flex items-center gap-1">
                                Ver todos <ChevronRight size={13}/>
                            </Link>
                        </div>

                        {pendientes.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle size={28} className="text-emerald-400"/>
                                </div>
                                <h4 className="text-base font-bold text-[#291136] mb-1">¡Todo al día!</h4>
                                <p className="text-sm text-gray-400">No tiene expedientes pendientes de acción en este momento.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pendientes.map(exp => (
                                    <Link key={exp.id} href={route('expedientes.show', exp.id)}
                                        className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all relative overflow-hidden group">
                                        <AccentBar urgencia={exp.urgencia}/>
                                        <div className="pl-4 pr-5 py-4 flex items-center gap-4">

                                            {/* Icono de urgencia */}
                                            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                                exp.urgencia === 'vencido' ? 'bg-red-50 text-red-500' :
                                                exp.urgencia === 'proximo' ? 'bg-amber-50 text-amber-500' :
                                                exp.urgencia === 'ok'      ? 'bg-emerald-50 text-emerald-500' :
                                                'bg-gray-50 text-gray-300'
                                            }`}>
                                                {exp.urgencia === 'vencido' ? <AlertTriangle size={18}/> :
                                                 exp.urgencia === 'proximo' ? <Clock size={18}/>          :
                                                 exp.urgencia === 'ok'      ? <CheckCircle size={18}/>    :
                                                 <Scale size={18}/>}
                                            </div>

                                            {/* Datos principales */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="font-black font-mono text-[#291136] text-sm">
                                                        {exp.numero_expediente}
                                                    </span>
                                                    {exp.servicio && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#291136]/5 text-[#291136]/60">
                                                            {exp.servicio}
                                                        </span>
                                                    )}
                                                    <UrgenciaChip urgencia={exp.urgencia} diasRestantes={exp.dias_restantes}/>
                                                </div>

                                                {/* Etapa → Actividad */}
                                                <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap mb-1.5">
                                                    <span>{exp.etapa}</span>
                                                    <ChevronRight size={10} className="shrink-0"/>
                                                    <span className="font-semibold text-[#BE0F4A]">{exp.actividad}</span>
                                                </div>

                                                {/* Partes */}
                                                {(exp.demandante || exp.demandado) && (
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                                        {exp.demandante && (
                                                            <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                                <Users size={10} className="shrink-0 text-gray-300"/>
                                                                {exp.demandante}
                                                            </span>
                                                        )}
                                                        {exp.demandante && exp.demandado && (
                                                            <span className="text-gray-300">vs.</span>
                                                        )}
                                                        {exp.demandado && (
                                                            <span className="truncate max-w-[200px]">{exp.demandado}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Flecha */}
                                            <ChevronRight size={16} className="shrink-0 text-gray-300 group-hover:text-[#BE0F4A] transition-colors"/>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
