import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Inbox, Scale, Clock, CheckCircle, ChevronRight,
    CalendarX, TrendingUp, FileText
} from 'lucide-react';

export default function Dashboard({ stats = {} }) {
    const statCards = [
        {
            label:  'Expedientes Activos',
            value:  stats.expedientes_activos ?? 0,
            Icon:   Scale,
            color:  'bg-[#291136]/5 text-[#291136]',
            accent: 'border-[#291136]/20',
            href:   route('expedientes.index'),
        },
        {
            label:  'Mis Pendientes',
            value:  stats.mis_pendientes ?? 0,
            Icon:   Inbox,
            color:  stats.mis_pendientes > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-400',
            accent: stats.mis_pendientes > 0 ? 'border-blue-200' : 'border-gray-100',
            href:   route('expedientes.mis'),
        },
        {
            label:  'Por Vencer (3 días)',
            value:  stats.por_vencer ?? 0,
            Icon:   Clock,
            color:  stats.por_vencer > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-400',
            accent: stats.por_vencer > 0 ? 'border-amber-200' : 'border-gray-100',
        },
        {
            label:  'Solicitudes Pendientes',
            value:  stats.solicitudes_pendientes ?? 0,
            Icon:   FileText,
            color:  stats.solicitudes_pendientes > 0 ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-400',
            accent: stats.solicitudes_pendientes > 0 ? 'border-purple-200' : 'border-gray-100',
            href:   stats.solicitudes_pendientes > 0 ? route('mesa-partes.bandeja') : null,
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
                        {statCards.map(({ label, value, Icon, color, accent, href }) => {
                            const Card = (
                                <div className={`bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm ${accent} ${href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
                                    <div className={`p-3 rounded-xl shrink-0 ${color}`}>
                                        <Icon size={22}/>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-2xl font-black text-[#291136]">{value}</div>
                                        <div className="text-xs text-gray-400 font-medium leading-tight">{label}</div>
                                    </div>
                                </div>
                            );
                            return href ? (
                                <Link key={label} href={href}>{Card}</Link>
                            ) : (
                                <div key={label}>{Card}</div>
                            );
                        })}
                    </div>

                    {/* ── Accesos Rápidos ── */}
                    <div>
                        <h3 className="text-lg font-bold text-[#291136] mb-4">Accesos Rápidos</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Link href={route('expedientes.index')}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all p-5 flex items-center gap-4 group">
                                <div className="p-3 rounded-xl bg-[#291136]/5 text-[#291136]">
                                    <Scale size={22}/>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-[#291136]">Expedientes</div>
                                    <div className="text-xs text-gray-400">Ver todos los expedientes</div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#BE0F4A] transition-colors"/>
                            </Link>

                            <Link href={route('expedientes.mis')}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all p-5 flex items-center gap-4 group">
                                <div className="p-3 rounded-xl bg-blue-50 text-blue-700">
                                    <Inbox size={22}/>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-[#291136]">Mis Expedientes</div>
                                    <div className="text-xs text-gray-400">Donde soy actor</div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#BE0F4A] transition-colors"/>
                            </Link>

                            <Link href={route('mesa-partes.bandeja')}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all p-5 flex items-center gap-4 group">
                                <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
                                    <FileText size={22}/>
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-[#291136]">Mesa de Partes</div>
                                    <div className="text-xs text-gray-400">Solicitudes recibidas</div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-[#BE0F4A] transition-colors"/>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
