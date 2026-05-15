import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import {
    Search, Calendar, Mail, FileText, Activity, Globe,
    Smartphone, ChevronDown, ChevronRight, Filter, X,
} from 'lucide-react';

const COLOR_EVENTO = {
    login_inicio:                 'bg-blue-50 text-blue-700 border-blue-200',
    login_dni_validado:           'bg-emerald-50 text-emerald-700 border-emerald-200',
    captcha_fallido:              'bg-amber-50 text-amber-700 border-amber-200',
    email_desechable_bloqueado:   'bg-red-50 text-red-700 border-red-200',
    dni_digito_invalido:          'bg-amber-50 text-amber-700 border-amber-200',
    documento_no_encontrado_reniec: 'bg-amber-50 text-amber-700 border-amber-200',
    ruc_no_activo:                'bg-amber-50 text-amber-700 border-amber-200',
    otp_solicitado:               'bg-blue-50 text-blue-700 border-blue-200',
    otp_validado:                 'bg-emerald-50 text-emerald-700 border-emerald-200',
    otp_fallido:                  'bg-red-50 text-red-700 border-red-200',
    sesion_iniciada:              'bg-emerald-50 text-emerald-700 border-emerald-200',
    sesion_cerrada:               'bg-gray-50 text-gray-600 border-gray-200',
    solicitud_enviada:            'bg-purple-50 text-purple-700 border-purple-200',
    cargo_generado:               'bg-[#BE0F4A]/10 text-[#BE0F4A] border-[#BE0F4A]/30',
};

function colorFor(evento) {
    return COLOR_EVENTO[evento] ?? 'bg-gray-50 text-gray-700 border-gray-200';
}

export default function HistorialPortal({ eventos = [], eventosDisponibles = [], filtros = {} }) {
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(true);
    const [expandido, setExpandido] = useState(null);
    const [f, setF] = useState({
        email:  filtros.email  ?? '',
        dni:    filtros.dni    ?? '',
        cargo:  filtros.cargo  ?? '',
        evento: filtros.evento ?? '',
        desde:  filtros.desde  ?? '',
        hasta:  filtros.hasta  ?? '',
    });

    function aplicarFiltros(e) {
        e.preventDefault();
        const params = Object.fromEntries(Object.entries(f).filter(([_, v]) => v !== ''));
        router.get(route('auditoria.portal.index'), params, { preserveState: false });
    }

    function limpiarFiltros() {
        setF({ email: '', dni: '', cargo: '', evento: '', desde: '', hasta: '' });
        router.get(route('auditoria.portal.index'), {}, { preserveState: false });
    }

    return (
        <AuthenticatedLayout>
            <Head title="Auditoría del Portal — Ankawa" />

            <PageHeader
                breadcrumb={[
                    { label: 'Inicio',     href: route('dashboard') },
                    { label: 'Expedientes', href: route('expedientes.index') },
                    { label: 'Auditoría del Portal' },
                ]}
                title="Auditoría del"
                titleAccent="Portal Público"
                description="Historial completo de la actividad de Mesa de Partes — sesiones, validaciones de identidad, solicitudes y cargos generados."
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
                <div className="flex justify-end mb-4">
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#291136]/10 text-[#291136]">
                        Eventos visibles: {eventos.length}{eventos.length === 500 ? ' (límite)' : ''}
                    </span>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <button
                        type="button"
                        onClick={() => setFiltrosAbiertos(v => !v)}
                        className="w-full flex items-center justify-between px-5 py-3 border-b border-gray-100"
                    >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#291136]">
                            <Filter size={16} className="text-[#BE0F4A]" /> Filtros
                        </span>
                        {filtrosAbiertos ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    </button>
                    {filtrosAbiertos && (
                        <form onSubmit={aplicarFiltros} className="p-5 grid grid-cols-1 md:grid-cols-6 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                                <input type="text" value={f.email} onChange={e => setF({ ...f, email: e.target.value })}
                                    placeholder="contiene…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">DNI</label>
                                <input type="text" value={f.dni} onChange={e => setF({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                                    placeholder="8 dígitos"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">N° Cargo</label>
                                <input type="text" value={f.cargo} onChange={e => setF({ ...f, cargo: e.target.value })}
                                    placeholder="CARGO-2026-…"
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Evento</label>
                                <select value={f.evento} onChange={e => setF({ ...f, evento: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A] bg-white">
                                    <option value="">Todos</option>
                                    {eventosDisponibles.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Desde</label>
                                <input type="date" value={f.desde} onChange={e => setF({ ...f, desde: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hasta</label>
                                <input type="date" value={f.hasta} onChange={e => setF({ ...f, hasta: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                            </div>

                            <div className="md:col-span-6 flex items-center justify-end gap-2 pt-1">
                                <button type="button" onClick={limpiarFiltros}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 hover:text-[#291136]">
                                    <X size={14} /> Limpiar
                                </button>
                                <button type="submit"
                                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#BE0F4A] text-white rounded-lg text-sm font-semibold hover:bg-[#9c0a3b]">
                                    <Search size={14} /> Buscar
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Línea de tiempo */}
                {eventos.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <Activity size={32} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No hay eventos para los filtros aplicados.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
                        {eventos.map(ev => (
                            <div key={ev.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                <button
                                    type="button"
                                    onClick={() => setExpandido(expandido === ev.id ? null : ev.id)}
                                    className="w-full flex items-start gap-3 text-left"
                                >
                                    <div className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${colorFor(ev.evento)} whitespace-nowrap`}>
                                        {ev.evento}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                                            <span className="flex items-center gap-1"><Calendar size={12} className="text-gray-400" /> {ev.created_at}</span>
                                            {ev.email_sesion && <span className="flex items-center gap-1"><Mail size={12} className="text-gray-400" /> {ev.email_sesion}</span>}
                                            {ev.dni_sesion && <span className="flex items-center gap-1"><FileText size={12} className="text-gray-400" /> DNI {ev.dni_sesion}</span>}
                                            {ev.ip && <span className="flex items-center gap-1"><Globe size={12} className="text-gray-400" /> {ev.ip}</span>}
                                        </div>
                                    </div>
                                    {expandido === ev.id ? <ChevronDown size={16} className="text-gray-400 mt-1" /> : <ChevronRight size={16} className="text-gray-400 mt-1" />}
                                </button>

                                {expandido === ev.id && (
                                    <div className="mt-3 ml-1 pl-3 border-l-2 border-[#BE0F4A]/30 space-y-2 text-xs">
                                        {ev.user_agent && (
                                            <div>
                                                <span className="font-semibold text-gray-500 flex items-center gap-1"><Smartphone size={11} /> User-agent:</span>
                                                <p className="text-gray-700 mt-0.5 font-mono text-[11px] break-all">{ev.user_agent}</p>
                                            </div>
                                        )}
                                        {ev.cargable_type && (
                                            <div>
                                                <span className="font-semibold text-gray-500">Vinculado a:</span>{' '}
                                                <span className="text-gray-700">{ev.cargable_type} #{ev.cargable_id}</span>
                                            </div>
                                        )}
                                        {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                                            <div>
                                                <span className="font-semibold text-gray-500">Metadata:</span>
                                                <pre className="mt-1 bg-gray-50 border border-gray-200 rounded p-2 text-[11px] font-mono text-gray-700 overflow-x-auto">
                                                    {JSON.stringify(ev.metadata, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
