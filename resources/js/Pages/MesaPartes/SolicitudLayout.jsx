import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle2, HelpCircle, Menu, X,
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

/* ─── Evalúa si una sección del formulario tiene sus campos requeridos llenos ─── */
function evaluarSeccion(sectionEl) {
    // 1. Buscar inputs de texto con asterisco (*) en su label
    const inputs = sectionEl.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea');
    const checkboxes = sectionEl.querySelectorAll('input[type="checkbox"]');

    let requiredCount = 0;
    let filledCount = 0;

    // Evaluar inputs de texto
    inputs.forEach(input => {
        // Verificar si es campo requerido: buscar * en su label cercano
        const wrapper = input.closest('.mb-5, .mb-4, .space-y-4 > div, .grid > div, div');
        const label = wrapper?.querySelector('label');
        const isRequired = label?.innerHTML?.includes('#BE0F4A') || input.required;

        if (isRequired) {
            requiredCount++;
            if (input.value && input.value.trim().length > 0) {
                filledCount++;
            }
        }
    });

    // Evaluar CustomSelect (es un <button> con un <span>, si el span NO tiene class text-gray-400 → tiene valor)
    const selectButtons = sectionEl.querySelectorAll('button[type="button"]');
    selectButtons.forEach(btn => {
        // Identificar CustomSelect: tiene un span hijo y un svg (ChevronDown)
        const span = btn.querySelector('span');
        const svg = btn.querySelector('svg');
        if (!span || !svg) return;

        // Verificar si tiene un label con asterisco arriba
        const wrapper = btn.closest('.relative, div')?.parentElement;
        const label = wrapper?.querySelector('label');
        const isRequired = label?.innerHTML?.includes('#BE0F4A');

        if (isRequired) {
            requiredCount++;
            // Si el span NO tiene class text-gray-400, significa que tiene un valor seleccionado
            if (!span.classList.contains('text-gray-400')) {
                filledCount++;
            }
        }
    });

    // Evaluar checkboxes (AceptacionReglamento)
    checkboxes.forEach(cb => {
        requiredCount++;
        if (cb.checked) filledCount++;
    });

    // Evaluar archivos adjuntos subidos: buscar elementos que muestran archivos listados
    // Los archivos cargados se muestran como spans/divs con nombres de archivo
    const fileListItems = sectionEl.querySelectorAll('[class*="truncate"]');
    if (fileListItems.length > 0) {
        // Si hay al menos un archivo listado, y hay un upload button con asterisco
        const uploadLabels = sectionEl.querySelectorAll('label');
        uploadLabels.forEach(lbl => {
            if (lbl.innerHTML?.includes('#BE0F4A') && lbl.closest('div')?.querySelector('button[type="button"]')) {
                // Ya contado arriba, verificar si tiene archivos
            }
        });
    }

    // Si no hay campos requeridos en esta sección, considerar completa si tiene algún contenido seleccionado
    // (ej: tipo de solicitud que solo muestra un badge)
    if (requiredCount === 0) {
        // Verificar si es una sección de "tipo de solicitud" con badge visible
        const badges = sectionEl.querySelectorAll('.rounded-full.font-semibold, [class*="bg-"][class*="rounded-full"]');
        if (badges.length > 0) return true;

        // Verificar si hay CustomSelects con valor seleccionado
        let anySelected = false;
        selectButtons.forEach(btn => {
            const span = btn.querySelector('span');
            if (span && !span.classList.contains('text-gray-400')) anySelected = true;
        });
        if (anySelected) return true;

        // Si no hay nada requerido y no hay indicadores, retornar null (no evaluable)
        return null;
    }

    return requiredCount > 0 && filledCount >= requiredCount;
}

/* ─── Step item individual ─── */
/* Estados:
   - 'completado' → todos los campos requeridos están llenos (check verde)
   - 'en_curso'   → paso actualmente visible (rosa activo)
   - 'pendiente'  → aún no ha llenado sus campos
*/
function StepItem({ number, label, estado, isLast }) {
    const isCompleted = estado === 'completado';
    const isActive    = estado === 'en_curso';

    return (
        <div className="flex items-start gap-3 relative">
            {/* Línea conectora vertical */}
            {!isLast && (
                <div
                    className="absolute left-[15px] top-[36px] w-0.5 h-[calc(100%+4px)]"
                    style={{
                        background: isCompleted
                            ? 'linear-gradient(to bottom, #22c55e, rgba(255,255,255,0.18))'
                            : isActive
                                ? 'rgba(255,255,255,0.20)'
                                : 'rgba(255,255,255,0.08)',
                    }}
                />
            )}

            {/* Círculo numerado */}
            <div
                className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    isCompleted
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : isActive
                            ? 'bg-[#BE0F4A] text-white shadow-lg shadow-[#BE0F4A]/40 ring-2 ring-[#BE0F4A]/30 ring-offset-2 ring-offset-[#291136]'
                            : 'bg-white/10 text-white/30 border border-white/10'
                }`}
            >
                {isCompleted ? (
                    <CheckCircle2 size={15} strokeWidth={2.5} />
                ) : (
                    number
                )}
            </div>

            {/* Label */}
            <div className="pt-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight transition-colors duration-300 ${
                    isCompleted
                        ? 'text-emerald-300'
                        : isActive
                            ? 'text-white'
                            : 'text-white/30'
                }`}>
                    {label}
                </p>
                <p className={`text-[10px] mt-0.5 font-medium ${
                    isCompleted
                        ? 'text-emerald-400/70'
                        : isActive
                            ? 'text-[#BE0F4A]/80'
                            : 'text-white/15'
                }`}>
                    {isCompleted ? 'Completado' : isActive ? 'En curso' : 'Pendiente'}
                </p>
            </div>
        </div>
    );
}

/* ─── Sidebar ─── */
function Sidebar({ etapas, pasoActivo, seccionesCompletas, onClose, isMobile }) {
    const total = etapas.length;
    const completadas = seccionesCompletas.filter(Boolean).length;
    const porcentaje = Math.round((completadas / total) * 100);

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
                        // Si la sección tiene todos sus campos requeridos → completado
                        if (seccionesCompletas[i]) estado = 'completado';
                        // Si es la sección actualmente visible → en_curso (salvo que ya esté completa)
                        if (i === pasoActivo && !seccionesCompletas[i]) estado = 'en_curso';

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
                {/* Barra de avance real */}
                <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-4 border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Avance</span>
                        <span className="text-lg font-black text-white">{porcentaje}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                                width: `${porcentaje}%`,
                                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-white/30 mt-1.5 font-medium">
                        {completadas} de {total} secciones completadas
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
    const [seccionesCompletas, setSeccionesCompletas] = useState(() => new Array(etapas.length).fill(false));
    const [mobileOpen, setMobileOpen] = useState(false);
    const contentRef = useRef(null);
    const sectionContainersRef = useRef([]);

    /* ─── Detectar secciones y evaluar completitud ─── */
    useEffect(() => {
        const container = contentRef.current;
        if (!container) return;

        let observer = null;
        let formListenerCleanup = null;

        function setupObservers() {
            const form = container.querySelector('form');
            if (!form) return false;

            // --- Encontrar secciones del DOM ---
            const h2s = form.querySelectorAll('h2');
            const sectionContainers = [];
            const seen = new Set();

            h2s.forEach(h2 => {
                let el = h2.closest('.rounded-2xl');
                if (el && !seen.has(el) && form.contains(el)) {
                    seen.add(el);
                    sectionContainers.push(el);
                }
            });

            if (sectionContainers.length === 0) return false;
            sectionContainersRef.current = sectionContainers;

            // --- IntersectionObserver: detectar sección visible (para "en_curso") ---
            observer = new IntersectionObserver(
                (entries) => {
                    const visibleIndices = [];
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const idx = sectionContainers.indexOf(entry.target);
                            if (idx >= 0) visibleIndices.push(idx);
                        }
                    });

                    if (visibleIndices.length > 0) {
                        const topIndex = Math.min(...visibleIndices);
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

            // --- Evaluar completitud real de cada sección ---
            function evaluarTodas() {
                const results = sectionContainers.map(sec => evaluarSeccion(sec));

                // Mapear resultados DOM → etapas (linear mapping)
                const etapaResults = new Array(etapas.length).fill(false);
                results.forEach((result, domIdx) => {
                    const stepIdx = Math.min(
                        Math.round((domIdx / Math.max(sectionContainers.length - 1, 1)) * (etapas.length - 1)),
                        etapas.length - 1
                    );
                    // Si el resultado es true, marcar la etapa como completa
                    // Si es null (no evaluable, ej: sección sin campos requeridos), verificar si ya estaba marcada
                    if (result === true) {
                        etapaResults[stepIdx] = true;
                    } else if (result === null && etapaResults[stepIdx] !== true) {
                        // Secciones sin campos requeridos que tienen contenido visible (ej: tipo de solicitud con badge)
                        etapaResults[stepIdx] = true;
                    }
                });

                setSeccionesCompletas(prev => {
                    const changed = prev.some((v, i) => v !== etapaResults[i]);
                    return changed ? etapaResults : prev;
                });
            }

            // Evaluar al inicio y cada vez que cambien inputs
            evaluarTodas();

            // Escuchar cambios en el formulario (input, change, click para checkboxes/selects)
            const debouncedEval = debounce(evaluarTodas, 300);
            form.addEventListener('input', debouncedEval);
            form.addEventListener('change', debouncedEval);
            form.addEventListener('click', debouncedEval);

            // MutationObserver para detectar archivos añadidos/eliminados (React actualiza el DOM)
            const mutationObs = new MutationObserver(debouncedEval);
            mutationObs.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'value', 'checked'] });

            formListenerCleanup = () => {
                form.removeEventListener('input', debouncedEval);
                form.removeEventListener('change', debouncedEval);
                form.removeEventListener('click', debouncedEval);
                mutationObs.disconnect();
            };

            return true;
        }

        // Intentar setup, reintentar si el form no está listo
        if (!setupObservers()) {
            const retryTimer = setTimeout(setupObservers, 800);
            return () => clearTimeout(retryTimer);
        }

        return () => {
            observer?.disconnect();
            formListenerCleanup?.();
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
                <Sidebar etapas={etapas} pasoActivo={pasoActivo} seccionesCompletas={seccionesCompletas} isMobile={false} />
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
                            seccionesCompletas={seccionesCompletas}
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

/* ─── Utilidad: debounce ─── */
function debounce(fn, ms) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
