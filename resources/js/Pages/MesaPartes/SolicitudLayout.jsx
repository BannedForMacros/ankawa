import { useState, useEffect, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle2, HelpCircle, Menu, X, ChevronRight,
} from 'lucide-react';
import AnkawaToaster from '@/Components/AnkawaToaster';

/* ─── Definición de etapas por slug de servicio ─── */
const ETAPAS = {
    'arbitraje': [
        { label: 'Tipo de solicitud' },
        { label: 'Datos del demandante' },
        { label: 'Datos del demandado' },
        { label: 'Materia y pretensión' },
        { label: 'Documentos adjuntos' },
        { label: 'Tasa de solicitud' },
        { label: 'Revisión y envío' },
    ],
    'arbitraje-emergencia': [
        { label: 'Tipo de solicitud' },
        { label: 'Datos del demandante' },
        { label: 'Datos del demandado' },
        { label: 'Documentos' },
        { label: 'Tasa de solicitud' },
        { label: 'Revisión y envío' },
    ],
    'jprd': [
        { label: 'Tipo de solicitud' },
        { label: 'Datos de la entidad' },
        { label: 'Datos del contratista' },
        { label: 'Documentos adjuntos' },
        { label: 'Revisión y envío' },
    ],
    'otros': [
        { label: 'Identificación' },
        { label: 'Contenido' },
        { label: 'Documentos adjuntos' },
        { label: 'Revisión y envío' },
    ],
};

/* ─── Step item individual ─── */
/* Estados:
   - 'en_curso'  → paso actualmente visible (rosa activo)
   - 'visitado'  → el usuario ya scrolleó por aquí (neutral, NO significa completado)
   - 'pendiente' → aún no ha llegado a esta sección
*/
function StepItem({ number, label, estado, isLast }) {
    const isVisited  = estado === 'visitado';
    const isActive   = estado === 'en_curso';

    return (
        <div className="flex items-start gap-3 relative">
            {/* Línea conectora vertical */}
            {!isLast && (
                <div
                    className="absolute left-[15px] top-[36px] w-0.5 h-[calc(100%+4px)]"
                    style={{
                        background: isVisited || isActive
                            ? 'rgba(255,255,255,0.20)'
                            : 'rgba(255,255,255,0.08)',
                    }}
                />
            )}

            {/* Círculo numerado */}
            <div
                className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    isActive
                        ? 'bg-[#BE0F4A] text-white shadow-lg shadow-[#BE0F4A]/40 ring-2 ring-[#BE0F4A]/30 ring-offset-2 ring-offset-[#291136]'
                        : isVisited
                            ? 'bg-white/20 text-white/70 border border-white/25'
                            : 'bg-white/10 text-white/30 border border-white/10'
                }`}
            >
                {number}
            </div>

            {/* Label */}
            <div className="pt-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight transition-colors duration-300 ${
                    isActive
                        ? 'text-white'
                        : isVisited
                            ? 'text-white/60'
                            : 'text-white/30'
                }`}>
                    {label}
                </p>
                <p className={`text-[10px] mt-0.5 font-medium ${
                    isActive
                        ? 'text-[#BE0F4A]/80'
                        : isVisited
                            ? 'text-white/25'
                            : 'text-white/15'
                }`}>
                    {isActive ? 'En curso' : isVisited ? 'Visitado' : 'Pendiente'}
                </p>
            </div>
        </div>
    );
}

/* ─── Sidebar ─── */
function Sidebar({ etapas, pasoActivo, onClose, isMobile }) {
    const total = etapas.length;
    // El porcentaje refleja la posición de navegación, NO la completitud del formulario
    const porcentaje = Math.round(((pasoActivo + 1) / total) * 100);

    return (
        <aside className={`
            flex flex-col h-full
            bg-gradient-to-b from-[#1a0b24] via-[#291136] to-[#1a0b24]
            ${isMobile ? 'w-[300px]' : 'w-[280px]'}
        `}>
            {/* Logo — grande y prominente para que el usuario sepa que está en CARD ANKAWA */}
            <div className="px-5 pt-6 pb-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-[72px] h-[72px] rounded-2xl bg-white/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.12] overflow-hidden p-2 shadow-lg shadow-black/20">
                        <img src="/logo-white.png" alt="CARD Ankawa" className="w-full h-full object-contain" />
                    </div>
                    {isMobile && (
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors">
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div>
                    <p className="text-white font-black text-lg tracking-wider leading-none">ANKAWA</p>
                    <p className="text-white/50 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Internacional</p>
                    <div className="mt-2 px-2.5 py-1 rounded-md bg-[#BE0F4A]/15 border border-[#BE0F4A]/20 inline-block">
                        <p className="text-[9px] font-bold text-[#BE0F4A] tracking-[0.15em] uppercase">Centro de Arbitraje y Resolución de Disputas</p>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Progreso del trámite */}
            <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-5">
                    Progreso del trámite
                </p>

                <div className="space-y-5">
                    {etapas.map((etapa, i) => {
                        let estado = 'pendiente';
                        // Solo 'visitado' (neutro) para los que ya scrolleó, NO 'completado'
                        if (i < pasoActivo) estado = 'visitado';
                        else if (i === pasoActivo) estado = 'en_curso';

                        return (
                            <StepItem
                                key={i}
                                number={i + 1}
                                label={etapa.label}
                                estado={estado}
                                isLast={i === etapas.length - 1}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Bottom: Avance + Ayuda */}
            <div className="px-5 pb-5 space-y-3 mt-auto">
                {/* Barra de navegación */}
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Navegación</span>
                        <span className="text-lg font-black text-white">{porcentaje}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${porcentaje}%`,
                                background: 'linear-gradient(90deg, #BE0F4A, #e74572)',
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1.5 font-medium">
                        Sección {Math.min(pasoActivo + 1, total)} de {total} · {etapas[Math.min(pasoActivo, total - 1)]?.label}
                    </p>
                </div>

                {/* Ayuda */}
                <div className="bg-white/[0.04] rounded-xl p-3.5 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1">
                        <HelpCircle size={13} className="text-white/40" />
                        <span className="text-[11px] font-bold text-white/60">¿Necesita ayuda?</span>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed">
                        Mesa de Partes · Lun a Vie 9–18h
                        <br />
                        <a href="mailto:soporte@ankawa.org" className="text-[#BE0F4A]/70 hover:text-[#BE0F4A] transition-colors">
                            soporte@ankawa.org
                        </a>
                    </p>
                </div>
            </div>
        </aside>
    );
}

/* ─── Layout Principal ─── */
export default function SolicitudLayout({ servicio, children }) {
    const slug = servicio.slug;
    const etapas = ETAPAS[slug] ?? ETAPAS['otros'];

    const [pasoActivo, setPasoActivo] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const contentRef = useRef(null);

    /* ─── Intersection Observer para detectar sección visible ─── */
    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        let observer = null;
        let cleanupFn = null;

        function setupObserver() {
            // Find all section containers: Seccion/BloquePersona each have an h2 in header
            const form = container.querySelector('form');
            if (!form) return false;

            // Get all h2 elements (each Seccion has one), find their top-level section container
            const h2s = form.querySelectorAll('h2');
            const sectionContainers = [];
            const seen = new Set();

            h2s.forEach(h2 => {
                // Walk up from h2 to find the closest rounded-2xl section container
                let el = h2.closest('.rounded-2xl');
                if (el && !seen.has(el) && form.contains(el)) {
                    seen.add(el);
                    sectionContainers.push(el);
                }
            });

            // Also add the AceptacionReglamento section (last section before submit)
            // It may not have h2, so find it by checking for the checkbox area near end of form
            const aceptacion = form.querySelector('[class*="acepta"], [class*="declaraci"]');
            if (aceptacion) {
                const container = aceptacion.closest('.rounded-2xl');
                if (container && !seen.has(container)) {
                    seen.add(container);
                    sectionContainers.push(container);
                }
            }

            if (sectionContainers.length === 0) return false;

            observer = new IntersectionObserver(
                (entries) => {
                    // Track all currently visible sections
                    const visibleIndices = [];
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const idx = sectionContainers.indexOf(entry.target);
                            if (idx >= 0) visibleIndices.push(idx);
                        }
                    });

                    if (visibleIndices.length > 0) {
                        const topIndex = Math.min(...visibleIndices);
                        // Map section DOM index → step index (linear mapping)
                        const stepIndex = Math.min(
                            Math.round((topIndex / Math.max(sectionContainers.length - 1, 1)) * (etapas.length - 1)),
                            etapas.length - 1
                        );
                        setPasoActivo(stepIndex);
                    }
                },
                {
                    root: null,
                    rootMargin: '-15% 0px -55% 0px',
                    threshold: 0,
                }
            );

            sectionContainers.forEach(el => observer.observe(el));
            return true;
        }

        // Try immediately, then retry with delay (forms may mount async)
        if (!setupObserver()) {
            const retryTimer = setTimeout(setupObserver, 800);
            cleanupFn = () => clearTimeout(retryTimer);
        }

        return () => {
            observer?.disconnect();
            cleanupFn?.();
        };
    }, [etapas.length, slug]);

    // Close mobile sidebar on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AnkawaToaster position="top-center" duration={5000} />

            {/* Sidebar — desktop */}
            <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[280px]">
                <Sidebar etapas={etapas} pasoActivo={pasoActivo} isMobile={false} />
            </div>

            {/* Sidebar — mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-mp-overlay-in"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute inset-y-0 left-0 animate-mp-sidebar-in">
                        <Sidebar
                            etapas={etapas}
                            pasoActivo={pasoActivo}
                            onClose={() => setMobileOpen(false)}
                            isMobile={true}
                        />
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="lg:hidden w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-[#291136] transition-colors"
                            >
                                <Menu size={18} />
                            </button>

                            <button
                                onClick={() => router.get(route('mesa-partes.inicio'))}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#291136] transition-colors group"
                            >
                                <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                                <span className="hidden sm:inline">Mis expedientes</span>
                            </button>

                            <span className="text-gray-200 hidden sm:inline">·</span>

                            <div className="hidden sm:flex items-center gap-2">
                                <img src="/logo.png" alt="Ankawa" className="h-5 object-contain" />
                                <span className="text-sm font-bold text-[#291136]">{servicio.nombre}</span>
                            </div>
                        </div>

                        {/* Borrador guardado badge */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-semibold text-emerald-700">Borrador guardado</span>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <main ref={contentRef} className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
                    {/* Encabezado de la solicitud */}
                    <div className="border-l-4 border-[#BE0F4A] pl-4 mb-6">
                        <p className="text-[11px] font-bold text-[#BE0F4A] uppercase tracking-[0.18em] mb-1.5">
                            Mesa de Partes · Nueva Solicitud
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-black text-[#291136] tracking-tight uppercase leading-none">
                            {servicio.nombre}
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Complete los datos requeridos para presentar su solicitud.
                        </p>
                    </div>

                    {/* El formulario se renderiza aquí */}
                    {children}
                </main>
            </div>
        </div>
    );
}
