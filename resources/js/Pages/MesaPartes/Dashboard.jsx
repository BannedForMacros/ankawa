import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Bell, CheckCircle, FileText, PlusCircle } from 'lucide-react';
import { LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import ModalServicios         from './Partials/ModalServicios';
import ModalTomaConocimiento  from './Partials/ModalTomaConocimiento';
import ModalResponder         from './Partials/ModalResponder';
import PlazoUrgente           from './Partials/PlazoUrgente';

const BADGE_ESTADO = {
    activo:     'bg-emerald-100 text-emerald-700',
    suspendido: 'bg-amber-100 text-amber-700',
    concluido:  'bg-gray-100 text-gray-600',
};

export default function Dashboard({ expedientes, servicios, portalUser, portalEmail, pendientesAceptacion = [] }) {
    const [modalMov,       setModalMov]       = useState(null);
    const [modalServicios, setModalServicios] = useState(false);

    function onRespondido() {
        router.reload({ only: ['expedientes'] });
    }

    function irASolicitud(slug) {
        setModalServicios(false);
        router.get(route('mesa-partes.solicitud', { slug }));
    }

    const totalMovPendientes = (expedientes ?? []).reduce((s, e) => s + (e.movimientos_pendientes?.length ?? 0), 0);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Head title="Mesa de Partes — Ankawa" />
            <Toaster position="top-right" />

            {/* Modal bloqueante de Toma de Conocimiento */}
            {pendientesAceptacion.length > 0 && (
                <ModalTomaConocimiento pendientes={pendientesAceptacion} />
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Ankawa" className="h-8 object-contain" />
                        <div>
                            <h1 className="text-sm font-black text-[#291136]">Mesa de Partes</h1>
                            <p className="text-xs text-gray-400">{portalEmail}</p>
                        </div>
                    </div>
                    <a href={route('mesa-partes.logout')}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut size={14}/> Salir
                    </a>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Nueva solicitud */}
                <div>
                    <button
                        onClick={() => setModalServicios(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] transition-colors shadow-sm"
                    >
                        <PlusCircle size={16}/> Nueva solicitud
                    </button>
                </div>

                {/* Alerta pendientes */}
                {totalMovPendientes > 0 && (
                    <div className="bg-[#BE0F4A]/10 border border-[#BE0F4A]/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                        <Bell size={20} className="text-[#BE0F4A] shrink-0 animate-pulse" />
                        <p className="text-sm font-semibold text-[#291136]">
                            Tienes <span className="text-[#BE0F4A]">{totalMovPendientes} requerimiento{totalMovPendientes > 1 ? 's' : ''} pendiente{totalMovPendientes > 1 ? 's' : ''}</span> de respuesta.
                        </p>
                    </div>
                )}

                {/* Expedientes */}
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mis expedientes</h2>

                    {(expedientes ?? []).length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <FileText size={40} className="text-gray-200 mx-auto mb-4"/>
                            <p className="text-gray-500 font-medium">No tienes expedientes registrados.</p>
                            <p className="text-gray-400 text-sm mt-1">Cuando presentes una solicitud, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(expedientes ?? []).map(exp => (
                                <div key={exp.id}
                                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                                        exp.tiene_pendiente
                                            ? 'border-[#BE0F4A]/30 border-l-4 border-l-[#BE0F4A]'
                                            : 'border-gray-100 border-l-4 border-l-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-[#291136] text-lg">{exp.numero_expediente}</span>
                                                {exp.tiene_pendiente && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-[#BE0F4A] bg-[#BE0F4A]/10 px-2 py-0.5 rounded-full">
                                                        <Bell size={10} className="animate-pulse"/> Acción requerida
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{exp.servicio}</p>
                                            {exp.etapa_actual && (
                                                <p className="text-xs text-gray-400 mt-0.5">Etapa: {exp.etapa_actual}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_ESTADO[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {exp.estado}
                                        </span>
                                    </div>

                                    {(exp.movimientos_pendientes ?? []).length > 0 && (
                                        <div className="mt-4 space-y-4">
                                            {(exp.movimientos_pendientes ?? []).map((mov, idx) => (
                                                /* ── Card de requerimiento con animación "ping" ── */
                                                <div key={mov.id} className="relative">
                                                    {/* Anillo pulsante — sale y vuelve alrededor de la card */}
                                                    <div className="absolute -inset-px rounded-xl bg-[#BE0F4A]/25 animate-ping pointer-events-none"/>

                                                    {/* Card real */}
                                                    <div className="relative bg-white border border-[#BE0F4A]/40 rounded-xl p-4 space-y-3 shadow-sm">
                                                        <div className="flex items-start gap-2">
                                                            {/* Icono urgencia */}
                                                            <div className="w-7 h-7 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Bell size={13} className="text-[#BE0F4A]"/>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                {(exp.movimientos_pendientes ?? []).length > 1 && (
                                                                    <p className="text-[10px] font-bold text-[#BE0F4A] uppercase tracking-widest mb-0.5">
                                                                        Requerimiento {idx + 1} de {(exp.movimientos_pendientes ?? []).length}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-1">Requerimiento pendiente</p>
                                                                <p className="text-sm text-[#291136] line-clamp-2">{mov.instruccion}</p>
                                                            </div>
                                                        </div>
                                                        <PlazoUrgente mov={mov} />
                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => setModalMov({ mov, expediente: exp.numero_expediente })}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#BE0F4A] text-white text-xs font-bold rounded-xl hover:bg-[#9c0a3b] transition-colors"
                                                            >
                                                                Responder →
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(exp.movimientos_pendientes ?? []).length === 0 && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                                            <CheckCircle size={13}/> Sin acciones pendientes
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalServicios && (
                <ModalServicios
                    servicios={servicios}
                    onSeleccionar={irASolicitud}
                    onClose={() => setModalServicios(false)}
                />
            )}

            {modalMov && (
                <ModalResponder
                    mov={modalMov.mov}
                    expediente={modalMov.expediente}
                    onClose={() => setModalMov(null)}
                    onRespondido={onRespondido}
                />
            )}
        </div>
    );
}
