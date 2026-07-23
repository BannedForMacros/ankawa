import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import {
    Bell, CheckCircle, FileText, PlusCircle, AlertCircle,
    ArrowRight, Send, LogOut, Scale, FolderOpen,
    ShieldCheck, Clock, Activity, Landmark, Inbox, Rocket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AnkawaToaster from '@/Components/AnkawaToaster';

import ModalServicios         from './Partials/ModalServicios';
import ModalTomaConocimiento  from './Partials/ModalTomaConocimiento';
import ModalResponder         from './Partials/ModalResponder';
import ModalEnviarDocumento   from './Partials/ModalEnviarDocumento';
import PlazoUrgente           from './Partials/PlazoUrgente';
import usePortalAvisos        from '@/hooks/usePortalAvisos';

/* ─── Constantes visuales ─── */
const BADGE_ESTADO = {
    activo:     'bg-emerald-100 text-emerald-700',
    suspendido: 'bg-amber-100 text-amber-700',
    concluido:  'bg-gray-100 text-gray-600',
};
const LABEL_ESTADO = { activo: 'Activo', suspendido: 'Suspendido', concluido: 'Concluido' };
const ICON_ESTADO = {
    activo:     <Activity size={12} className="text-emerald-500" />,
    suspendido: <Clock size={12} className="text-amber-500" />,
    concluido:  <CheckCircle size={12} className="text-gray-400" />,
};

const BACKGROUNDS = [
    '/images/backgrounds/bg1.jpg',
    '/images/backgrounds/bg2.jpg',
    '/images/backgrounds/bg3.jpg',
    '/images/backgrounds/bg4.jpg',
    '/images/backgrounds/bg5.jpg',
];

export default function Dashboard({ expedientes, servicios, portalUser, portalEmail, pendientesAceptacion = [], avisoActorIds = [] }) {
    const [modalMov,       setModalMov]       = useState(null);
    const [modalServicios, setModalServicios] = useState(false);
    const [modalEnvioExp,  setModalEnvioExp]  = useState(null);
    const [bgIndex, setBgIndex]               = useState(0);

    usePortalAvisos(avisoActorIds);

    // Carousel de fondo idéntico al Welcome
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(prev => (prev + 1) % BACKGROUNDS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    function onRespondido() {
        router.reload({ only: ['expedientes'] });
    }

    function onEnvioRegistrado() {
        toast.success('El responsable revisará tu envío.');
    }

    function irASolicitud(slug) {
        setModalServicios(false);
        router.get(route('mesa-partes.solicitud', { slug }));
    }

    const totalMovPendientes = (expedientes ?? []).reduce((s, e) => s + (e.movimientos_pendientes?.length ?? 0), 0);
    const totalExpedientes = (expedientes ?? []).length;
    const activos    = (expedientes ?? []).filter(e => e.estado === 'activo').length;
    const concluidos = (expedientes ?? []).filter(e => e.estado === 'concluido').length;

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <Head title="Panel de Expedientes">
                {/* Preload para imágenes de servicios del ModalServicios para evitar delay */}
                <link rel="preload" as="image" href="/images/servicio-final/arbitraje.png" />
                <link rel="preload" as="image" href="/images/servicio-final/jprd.png" />
                <link rel="preload" as="image" href="/images/servicio-final/otros.png" />
                <link rel="preload" as="image" href="/images/servicio-final/emergencia.png" />
            </Head>
            <AnkawaToaster position="top-right" />

            {/* ── Animaciones ── */}
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
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes countUp {
                    from { opacity: 0; transform: scale(0.5); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .card-urgente {
                    border: 2px solid #BE0F4A;
                    animation: levanteAgresivo 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                    will-change: transform, box-shadow;
                }
                .anim-entrada {
                    animation: slideIn 0.5s ease-out forwards;
                    opacity: 0;
                }
                .anim-entrada-left {
                    animation: slideInLeft 0.5s ease-out forwards;
                    opacity: 0;
                }
                .float-anim {
                    animation: float 3s ease-in-out infinite;
                }
                .count-anim {
                    animation: countUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                .stat-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -8px rgba(41, 17, 54, 0.15);
                }
            `}</style>

            {/* ── Fondo: imágenes rotando en grayscale (estilo Welcome / SolicitudLayout) ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gray-100">
                {BACKGROUNDS.map((bg, idx) => (
                    <div
                        key={bg}
                        className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-[1500ms] grayscale ${
                            idx === bgIndex ? 'opacity-[0.40]' : 'opacity-0'
                        }`}
                        style={{ backgroundImage: `url(${bg})` }}
                    />
                ))}
            </div>

            {/* Modal bloqueante de Toma de Conocimiento */}
            {pendientesAceptacion.length > 0 && (
                <ModalTomaConocimiento pendientes={pendientesAceptacion} />
            )}

            {/* ═══════════════ HEADER (estilo SolicitudLayout) ═══════════════ */}
            <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#291136] via-[#431259] to-[#BE0F4A]"></div>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#291136] flex items-center justify-center shadow-inner shrink-0">
                                <Landmark size={14} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#BE0F4A] leading-none mb-1">Ankawa Center</span>
                                <span className="text-sm font-black text-[#291136] leading-none">Mesa de Partes</span>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l-2 border-gray-100">
                            <div className="w-7 h-7 rounded-full bg-[#291136]/10 flex items-center justify-center text-[10px] font-black text-[#291136]">
                                {(portalEmail ?? '?')[0].toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{portalEmail}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {totalMovPendientes > 0 && (
                            <div className="hidden sm:flex items-center gap-1.5 bg-[#BE0F4A]/10 text-[#BE0F4A] px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#BE0F4A]/20 animate-pulse">
                                <Bell size={12} />
                                {totalMovPendientes}
                            </div>
                        )}
                        <a href={route('mesa-partes.logout')}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-[#BE0F4A] transition-colors">
                            <LogOut size={15}/> <span className="hidden sm:inline">Cerrar Sesión</span>
                        </a>
                    </div>
                </div>
            </header>

            {/* ═══════════════ HERO CARD (estilo SolicitudLayout encabezado) ═══════════════ */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8">
                <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#291136]/[0.03] via-[#BE0F4A]/[0.02] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-transparent" />
                    <div className="relative flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-2">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BE0F4A] opacity-30"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BE0F4A]"></span>
                                </span>
                                <p className="text-[11px] font-black text-[#BE0F4A] uppercase tracking-[0.2em]">
                                    Panel de Expedientes
                                </p>
                            </div>
                            <h1 className="text-2xl sm:text-[32px] font-black text-[#291136] tracking-tight uppercase leading-tight mb-2">
                                Mis Expedientes
                            </h1>
                            <p className="text-sm sm:text-base text-gray-500 font-medium max-w-xl">
                                Historial y seguimiento completo de tus solicitudes presentadas en Mesa de Partes.
                            </p>
                        </div>
                        <div className="w-28 sm:w-36 shrink-0 relative z-10 hidden sm:block">
                            <img src="/logo.png" alt="Ankawa Logo" className="w-full h-auto object-contain" />
                        </div>
                        <div className="w-24 shrink-0 relative z-10 sm:hidden mb-2">
                            <img src="/logo.png" alt="Ankawa Logo" className="w-full h-auto object-contain" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════ MAIN CONTENT ═══════════════ */}
            <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pb-16">

                {/* ═══════════════ STAT CARDS + CTA ═══════════════ */}
                <div className="mt-6 mb-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Total */}
                    <div className="stat-card bg-white rounded-xl border border-gray-200 p-5 anim-entrada" style={{ animationDelay: '0ms' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[#291136]/5 flex items-center justify-center">
                                <FolderOpen size={16} className="text-[#291136]/60" />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                        </div>
                        <span className="text-3xl font-black text-[#291136] count-anim block" style={{ animationDelay: '200ms' }}>
                            {totalExpedientes}
                        </span>
                        <span className="text-xs text-gray-400 font-medium mt-1 block">expediente{totalExpedientes !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Activos */}
                    <div className="stat-card bg-white rounded-xl border border-emerald-100 p-5 anim-entrada" style={{ animationDelay: '100ms' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Activity size={16} className="text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Activos</span>
                        </div>
                        <span className="text-3xl font-black text-emerald-600 count-anim block" style={{ animationDelay: '300ms' }}>
                            {activos}
                        </span>
                        <span className="text-xs text-emerald-400 font-medium mt-1 block">en curso</span>
                    </div>

                    {/* Pendientes */}
                    <div className={`stat-card bg-white rounded-xl border p-5 anim-entrada ${
                        totalMovPendientes > 0 ? 'border-[#BE0F4A]/20' : 'border-gray-200'
                    }`} style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                totalMovPendientes > 0 ? 'bg-[#BE0F4A]/10' : 'bg-gray-50'
                            }`}>
                                <Bell size={16} className={totalMovPendientes > 0 ? 'text-[#BE0F4A]' : 'text-gray-400'} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                totalMovPendientes > 0 ? 'text-[#BE0F4A]' : 'text-gray-400'
                            }`}>Pendientes</span>
                        </div>
                        <span className={`text-3xl font-black count-anim block ${
                            totalMovPendientes > 0 ? 'text-[#BE0F4A]' : 'text-gray-300'
                        }`} style={{ animationDelay: '400ms' }}>
                            {totalMovPendientes}
                        </span>
                        <span className="text-xs text-gray-400 font-medium mt-1 block">requerimiento{totalMovPendientes !== 1 ? 's' : ''}</span>
                    </div>

                    {/* CTA Nueva Solicitud */}
                    <button
                        onClick={() => setModalServicios(true)}
                        className="stat-card bg-[#BE0F4A] rounded-xl border border-[#BE0F4A] p-5 anim-entrada text-left group cursor-pointer hover:bg-[#9c0a3b]"
                        style={{ animationDelay: '300ms' }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <PlusCircle size={16} className="text-white" />
                            </div>
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Nuevo</span>
                        </div>
                        <span className="text-base font-black text-white block leading-tight">
                            Iniciar Solicitud
                        </span>
                        <span className="text-xs text-white/50 font-medium mt-1 flex items-center gap-1">
                            Comenzar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </div>

                {/* Banner Global de Urgencia */}
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

                {/* ══════ EXPEDIENTES ══════ */}
                <div>
                    {totalExpedientes === 0 ? (
                        /* ── EMPTY STATE PREMIUM ── */
                        <div className="anim-entrada">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-8 py-16 sm:py-20 text-center">
                                    <div className="float-anim mx-auto mb-8">
                                        <div className="w-24 h-24 rounded-2xl bg-[#291136]/5 border border-[#291136]/10 flex items-center justify-center mx-auto shadow-lg shadow-[#291136]/5">
                                            <Inbox size={44} className="text-[#291136]/30" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-[#291136] tracking-tight mb-3">
                                        Tu bandeja está vacía
                                    </h3>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
                                        Aún no tienes expedientes registrados. Una vez que inicies un trámite, todos tus expedientes aparecerán aquí con actualizaciones en tiempo real.
                                    </p>

                                    <button
                                        onClick={() => setModalServicios(true)}
                                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] transition-all shadow-lg shadow-[#BE0F4A]/20 group"
                                    >
                                        <Rocket size={17} className="group-hover:-translate-y-0.5 transition-transform" />
                                        Iniciar mi primer trámite
                                    </button>

                                    {/* Beneficios */}
                                    <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-gray-100">
                                        {[
                                            { icon: ShieldCheck, title: 'Seguro',  desc: 'Información encriptada y protegida.' },
                                            { icon: Clock,       title: 'Rápido',  desc: 'Notificaciones en tiempo real.' },
                                            { icon: Scale,       title: 'Digital', desc: 'Trámites 100% digitales.' },
                                        ].map((b, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 p-4">
                                                <div className="w-10 h-10 rounded-xl bg-[#291136]/5 flex items-center justify-center">
                                                    <b.icon size={18} className="text-[#291136]/40" />
                                                </div>
                                                <span className="text-xs font-black text-[#291136] uppercase tracking-wide">{b.title}</span>
                                                <span className="text-[11px] text-gray-400 leading-relaxed">{b.desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── TARJETAS DE EXPEDIENTES ── */
                        <div className="space-y-5">
                            {(expedientes ?? []).map((exp, expIdx) => (
                                <div
                                    key={exp.id}
                                    className={`bg-white rounded-2xl shadow-sm anim-entrada overflow-hidden transition-all duration-300 hover:shadow-md ${
                                        exp.tiene_pendiente
                                            ? 'border-2 border-[#BE0F4A]/30'
                                            : 'border border-gray-200 hover:border-[#BE0F4A]/20'
                                    }`}
                                    style={{ animationDelay: `${expIdx * 80}ms` }}
                                >
                                    {/* Barra de acento superior */}
                                    <div className={`h-1 w-full ${
                                        exp.tiene_pendiente
                                            ? 'bg-gradient-to-r from-[#BE0F4A] via-[#BE0F4A]/60 to-transparent'
                                            : exp.estado === 'activo'
                                                ? 'bg-gradient-to-r from-emerald-400 via-emerald-300/40 to-transparent'
                                                : 'bg-gradient-to-r from-gray-200 via-gray-100 to-transparent'
                                    }`} />

                                    {/* Cabecera del Expediente */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5">
                                        <div className="flex items-start gap-4">
                                            <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                                exp.tiene_pendiente
                                                    ? 'bg-[#BE0F4A]/10 text-[#BE0F4A]'
                                                    : exp.estado === 'activo'
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                <Scale size={22} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                                    <span className="font-black text-[#291136] text-lg tracking-tight">
                                                        {exp.numero_expediente}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${BADGE_ESTADO[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                                        {ICON_ESTADO[exp.estado]}
                                                        {LABEL_ESTADO[exp.estado] ?? exp.estado}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium">{exp.servicio}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            {exp.etapa_actual && (
                                                <div className="bg-[#291136]/[0.03] border border-[#291136]/10 px-4 py-2 rounded-lg text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Etapa</p>
                                                    <p className="text-xs font-bold text-[#291136]">{exp.etapa_actual}</p>
                                                </div>
                                            )}
                                            {exp.estado === 'activo' && (
                                                <button
                                                    onClick={() => setModalEnvioExp(exp)}
                                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-[#291136]/15 text-[#291136] hover:bg-[#291136] hover:text-white transition-all duration-300 group/btn"
                                                >
                                                    <Send size={13} className="group-hover/btn:rotate-[-20deg] transition-transform" />
                                                    <span className="hidden sm:inline">Enviar documento</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contenido (Requerimientos) */}
                                    <div className="px-6 pb-5">
                                        {(exp.movimientos_pendientes ?? []).length > 0 ? (
                                            <div className="space-y-6 pt-2">
                                                {(exp.movimientos_pendientes ?? []).map((mov, idx) => {
                                                    const total = (exp.movimientos_pendientes ?? []).length;
                                                    return (
                                                        <div key={mov.id} className="relative z-10">
                                                            <div className="card-urgente bg-white rounded-xl">
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
                                            <div className="flex items-center gap-3 text-sm font-bold text-emerald-700 bg-emerald-50/70 w-fit px-5 py-3 rounded-xl border border-emerald-100">
                                                <CheckCircle size={18} className="text-emerald-500"/>
                                                Todo en orden. Sin requerimientos pendientes.
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

            {modalEnvioExp && (
                <ModalEnviarDocumento
                    expediente={modalEnvioExp}
                    onClose={() => setModalEnvioExp(null)}
                    onEnviado={onEnvioRegistrado}
                />
            )}
        </div>
    );
}