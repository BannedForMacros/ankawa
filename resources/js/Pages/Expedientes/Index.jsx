import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link } from '@inertiajs/react';
import { Scale, ChevronRight, Search, User } from 'lucide-react';
import { useState } from 'react';

const estadoColors = {
    activo:     'bg-emerald-100 text-emerald-700',
    suspendido: 'bg-amber-100 text-amber-700',
    concluido:  'bg-gray-100 text-gray-500',
};

const borderByEstado = {
    activo:     'border-l-emerald-400',
    suspendido: 'border-l-amber-400',
    concluido:  'border-l-gray-300',
};

export default function Index({ expedientes = [], titulo = 'Expedientes' }) {
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');

    const filtrados = expedientes.filter(exp => {
        const coincideBusqueda = !busqueda ||
            exp.numero_expediente?.toLowerCase().includes(busqueda.toLowerCase()) ||
            exp.servicio?.toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado === 'todos' || exp.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    const contadores = {
        todos:      expedientes.length,
        activo:     expedientes.filter(e => e.estado === 'activo').length,
        suspendido: expedientes.filter(e => e.estado === 'suspendido').length,
        concluido:  expedientes.filter(e => e.estado === 'concluido').length,
    };

    return (
        <AuthenticatedLayout>
            <Head title={titulo} />

            <PageHeader
                title={titulo}
                subtitle="Consulta y seguimiento de expedientes activos"
                icon={Scale}
                actions={
                    <div className="flex gap-2 flex-wrap">
                        {contadores.activo > 0 && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide">
                                Activos: {contadores.activo}
                            </span>
                        )}
                        {contadores.suspendido > 0 && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                                Suspendidos: {contadores.suspendido}
                            </span>
                        )}
                        {contadores.concluido > 0 && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wide">
                                Concluidos: {contadores.concluido}
                            </span>
                        )}
                    </div>
                }
            />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Filtros ── */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(contadores).map(([key, count]) => (
                                <button
                                    key={key}
                                    onClick={() => setFiltroEstado(key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                                        filtroEstado === key
                                            ? 'bg-[#291136] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {filtroEstado === key && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse shrink-0" />
                                    )}
                                    {key === 'todos' ? 'Todos' : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
                                </button>
                            ))}
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input
                                type="text"
                                placeholder="Buscar expediente..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                            />
                        </div>
                    </div>

                    {/* ── Lista ── */}
                    {filtrados.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                            <Scale size={40} className="mx-auto mb-3 text-gray-200"/>
                            <p className="text-sm text-gray-400">No se encontraron expedientes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtrados.map(exp => (
                                <Link
                                    key={exp.id}
                                    href={route('expedientes.show', exp.id)}
                                    className={`block bg-white rounded-2xl border border-gray-100 border-l-4 ${borderByEstado[exp.estado] ?? 'border-l-gray-200'} shadow-sm hover:shadow-md hover:border-[#291136]/20 transition-all p-4 group`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="shrink-0 w-10 h-10 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center text-[#BE0F4A]">
                                            <Scale size={18}/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-black font-mono text-[#291136] text-sm">
                                                    {exp.numero_expediente}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoColors[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                                    {exp.estado}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                                {exp.servicio && <span>{exp.servicio}</span>}
                                                {exp.etapa && (
                                                    <>
                                                        <span className="text-gray-200">•</span>
                                                        <span className="font-semibold text-[#BE0F4A]">{exp.etapa}</span>
                                                    </>
                                                )}
                                                {exp.gestor && (
                                                    <>
                                                        <span className="text-gray-200">•</span>
                                                        <span className="flex items-center gap-1">
                                                            <User size={10}/> {exp.gestor}
                                                        </span>
                                                    </>
                                                )}
                                                <span className="text-gray-200">•</span>
                                                <span>{exp.created_at}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="shrink-0 text-gray-300 group-hover:text-[#BE0F4A] transition-colors"/>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
