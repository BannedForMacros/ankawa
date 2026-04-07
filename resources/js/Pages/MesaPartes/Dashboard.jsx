import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Bell, CheckCircle, FileText, PlusCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { LogOut } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import ModalServicios         from './Partials/ModalServicios';
import ModalTomaConocimiento  from './Partials/ModalTomaConocimiento';
import ModalResponder         from './Partials/ModalResponder';
import PlazoUrgente           from './Partials/PlazoUrgente';

const BADGE_ESTADO = {
    activo:     'bg-emerald-100 text-emerald-800 border border-emerald-200',
    suspendido: 'bg-amber-100 text-amber-800 border border-amber-200',
    concluido:  'bg-gray-100 text-gray-700 border border-gray-200',
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
        <div className="min-h-screen bg-[#F8F9FA]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Head title="Mesa de Partes — Ankawa" />
            <Toaster position="top-right" />

            {/* Animación: La tarjeta se levanta y vuelve a caer */}
            <style>{`
                @keyframes levanteAgresivo {
                    0%, 100% {
                        transform: translateY(0) scale(1);
                        box-shadow: 0 4px 6px -1px rgba(190, 15, 74, 0.1), 0 2px 4px -1px rgba(190, 15, 74, 0.06);
                    }
                    50% {
                        transform: translateY(-8px) scale(1.02);
                        box-shadow: 0 25px 30px -5px rgba(190, 15, 74, 0.25), 0 15px 15px -5px rgba(190, 15, 74, 0.15);
                    }
                }

                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .card-urgente {
                    border: 2px solid #BE0F4A;
                    animation: levanteAgresivo 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    will-change: transform, box-shadow;
                }

                .anim-entrada {
                    animation: slideIn 0.4s ease-out forwards;
                    opacity: 0;
                }
            `}</style>

            {/* Modal bloqueante de Toma de Conocimiento */}
            {pendientesAceptacion.length > 0 && (
                <ModalTomaConocimiento pendientes={pendientesAceptacion} />
            )}

            {/* Header Limpio (Se eliminó la línea superior roja) */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="Ankawa" className="h-9 object-contain" />
                        <div className="hidden md:block pl-4 border-l-2 border-gray-100">
                            <h1 className="text-sm font-black text-[#291136] tracking-tight uppercase">MESA DE PARTES</h1>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">{portalEmail}</p>
                        </div>
                    </div>
                    <a href={route('mesa-partes.logout')}
                        className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#BE0F4A] transition-colors">
                        <LogOut size={16}/> <span className="hidden sm:inline">Cerrar Sesión</span>
                    </a>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-10">

                {/* Banner Global de Urgencia (Rediseñado para menos saturación visual) */}
                {totalMovPendientes > 0 && (
                    <div className="mb-8 anim-entrada">
                        <div className="bg-white border-2 border-[#BE0F4A] rounded-xl shadow-md shadow-[#BE0F4A]/10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-[#BE0F4A]/10 rounded-full animate-bounce">
                                    <Bell size={24} className="text-[#BE0F4A]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#BE0F4A] tracking-tight">Atención Inmediata Requerida</h3>
                                    <p className="text-sm text-gray-600 font-medium">
                                        Tienes <strong className="text-[#BE0F4A]">{totalMovPendientes} requerimiento{totalMovPendientes > 1 ? 's' : ''}</strong> esperando tu respuesta para continuar los trámites.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cabecera de la sección principal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-[#291136] tracking-tight">Mis Expedientes</h2>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Historial y estado de tus solicitudes en curso.</p>
                    </div>
                    
                    <button
                        onClick={() => setModalServicios(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <PlusCircle size={18}/> Iniciar Nueva Solicitud
                    </button>
                </div>

                {/* Lista de Expedientes */}
                <div>
                    {(expedientes ?? []).length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-20 text-center anim-entrada">
                            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText size={48} className="text-gray-300"/>
                            </div>
                            <p className="text-[#291136] font-black text-xl">Sin expedientes activos</p>
                            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">Tus solicitudes y trámites aparecerán en este espacio una vez que inicies un proceso.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {(expedientes ?? []).map((exp, expIdx) => (
                                <div
                                    key={exp.id}
                                    className={`bg-white rounded-2xl shadow-sm border anim-entrada overflow-hidden ${
                                        exp.tiene_pendiente ? 'border-[#BE0F4A]/30' : 'border-gray-200'
                                    }`}
                                    style={{ animationDelay: `${expIdx * 80}ms` }}
                                >
                                    {/* Cabecera del Expediente */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50/50">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-black text-[#291136] text-xl tracking-tight">
                                                    {exp.numero_expediente}
                                                </span>
                                                <span className={`text-xs font-bold px-3 py-1 rounded-md ${BADGE_ESTADO[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                                    {exp.estado}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-semibold">{exp.servicio}</p>
                                        </div>
                                        
                                        {exp.etapa_actual && (
                                            <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Etapa Actual</p>
                                                <p className="text-sm font-bold text-[#BE0F4A]">{exp.etapa_actual}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contenido (Requerimientos) */}
                                    <div className="p-6">
                                        {(exp.movimientos_pendientes ?? []).length > 0 ? (
                                            <div className="space-y-8 py-2">
                                                {(exp.movimientos_pendientes ?? []).map((mov, idx) => {
                                                    const total = (exp.movimientos_pendientes ?? []).length;
                                                    return (
                                                        /* ── Tarjeta de Requerimiento que se LEVANTA ── */
                                                        <div key={mov.id} className="relative z-10">
                                                            <div className="card-urgente bg-white rounded-xl">
                                                                
                                                                {/* Fila Superior: Título y Plazo */}
                                                                <div className="bg-[#BE0F4A]/5 border-b border-[#BE0F4A]/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-2 h-2 rounded-full bg-[#BE0F4A] animate-pulse"></div>
                                                                        <h4 className="text-sm font-black text-[#BE0F4A] uppercase tracking-wide">
                                                                            Requiere tu Acción {total > 1 ? `(${idx + 1}/${total})` : ''}
                                                                        </h4>
                                                                    </div>
                                                                    <div>
                                                                        <PlazoUrgente mov={mov} />
                                                                    </div>
                                                                </div>

                                                                {/* Cuerpo: Instrucción y Botón juntos para mejor flujo */}
                                                                <div className="p-6 flex flex-col md:flex-row gap-6 md:items-center">
                                                                    <div className="flex-1">
                                                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Instrucciones</p>
                                                                        <div className="border-l-4 border-[#BE0F4A] pl-4">
                                                                            <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                                                                {mov.instruccion}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="shrink-0 flex justify-end">
                                                                        <button
                                                                            onClick={() => setModalMov({ mov, expediente: exp.numero_expediente })}
                                                                            className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3.5 bg-[#BE0F4A] text-white text-sm font-black tracking-wide rounded-xl hover:bg-[#9c0a3b] transition-all shadow-md hover:shadow-lg"
                                                                        >
                                                                            Responder Ahora <ArrowRight size={18} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 text-sm font-bold text-emerald-700 bg-emerald-50 w-fit px-5 py-3 rounded-xl border border-emerald-100">
                                                <CheckCircle size={20} className="text-emerald-500"/> Todo en orden. Sin requerimientos pendientes.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

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