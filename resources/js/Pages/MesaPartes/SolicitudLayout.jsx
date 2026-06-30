import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import {
    ArrowLeft, CheckCircle2, HelpCircle, Menu, X, Landmark
} from 'lucide-react';
import AnkawaToaster from '@/Components/AnkawaToaster';

/* ─── Definición de etapas por slug de servicio ─── */
// Tienen que coincidir exactamente con la cantidad de bloques principales (.rounded-2xl) generados por cada formulario
const ETAPAS = {
    'arbitraje': [
        { label: 'Tipo de solicitud' },
        { label: 'Solicitud de Inicio de Arbitraje' },
        { label: 'Datos del demandante' },
        { label: 'Datos del demandado' },
        { label: 'Aspectos Controvertidos Sometidos a Arbitraje' },
        { label: 'Conformación del tribunal' },
        { label: 'Medida cautelar' },
        { label: 'Tasa de Solicitud de Arbitraje' },
        { label: 'Revisión y envío' },
    ],
    'arbitraje-emergencia': [
        { label: 'Tipo de solicitud' },
        { label: 'Datos del demandante' },
        { label: 'Datos del demandado' },
        { label: 'Documentos del Arbitraje de Emergencia' },
        { label: 'Tasa de Solicitud de Arbitraje de Emergencia' },
        { label: 'Revisión y envío' },
    ],
    'jprd': [
        { label: 'Tipo de solicitud' },
        { label: 'Datos de la entidad' },
        { label: 'Datos del contratista' },
        { label: 'Documentos' },
        { label: 'Petición de Decisión Vinculante' },
        { label: 'Revisión y envío' },
    ],
    'otros': [
        { label: 'Tipo de solicitud' },
        { label: 'Identificación' },
        { label: 'Contenido' },
        { label: 'Documentos adjuntos' },
        { label: 'Revisión y envío' },
    ],
};

/* ─── Evalúa si una sección del formulario tiene sus campos requeridos llenos ─── */
function evaluarSeccion(sectionEl) {
    const labels = sectionEl.querySelectorAll('label');
    let requiredCount = 0;
    let filledCount = 0;
    let optionalFilledCount = 0;

    labels.forEach(label => {
        const isRequired = label.innerHTML.includes('#BE0F4A') || label.innerHTML.includes('*');
        const wrapper = label.closest('.mb-5, .mb-4, .space-y-4 > div, .grid > div, div');
        if (!wrapper) return;

        if (isRequired) requiredCount++;

        let hasValue = false;

        // 1. Standard input/textarea
        const inputs = wrapper.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]), textarea');
        inputs.forEach(input => {
            if (input.value && input.value.trim().length > 0) hasValue = true;
        });

        // 2. CustomSelect & RadioGroup (buttons)
        const buttons = wrapper.querySelectorAll('button[type="button"]');
        buttons.forEach(btn => {
            // CustomSelect: has span and svg, and span is not text-gray-400
            const span = btn.querySelector('span');
            const svg = btn.querySelector('svg');
            if (span && svg && !span.classList.contains('text-gray-400')) hasValue = true;
            
            // RadioGroup: selected button has specific classes
            if (!svg && (btn.className.includes('bg-[#BE0F4A]/5') || btn.className.includes('border-[#BE0F4A]'))) {
                hasValue = true;
            }
        });

        // 3. MultiArchivoInput (files attached)
        const fileNames = wrapper.querySelectorAll('.truncate, [class*="truncate"]');
        if (fileNames.length > 0) hasValue = true;

        // 4. Elementos de solo lectura / verificados (ej: correo OTP bloqueado)
        if (wrapper.querySelector('[data-filled="true"], .bg-emerald-50.text-emerald-800, .border-emerald-300')) {
            hasValue = true;
        }

        if (hasValue) {
            if (isRequired) filledCount++;
            else optionalFilledCount++;
        }
    });

    // Check standalone checkboxes with required (like AceptacionReglamento)
    const checkboxes = sectionEl.querySelectorAll('input[type="checkbox"][required]');
    checkboxes.forEach(cb => {
        requiredCount++;
        if (cb.checked) filledCount++;
    });

    // Especial: Tipo de Solicitud no tiene label, tiene h2. Si hay un CustomSelect, debe ser requerido.
    const h2 = sectionEl.querySelector('h2');
    if (h2 && h2.textContent.toLowerCase().includes('tipo de solicitud')) {
        const customSelect = sectionEl.querySelector('button[type="button"]');
        if (customSelect) {
            const span = customSelect.querySelector('span');
            if (span) {
                requiredCount++;
                if (!span.classList.contains('text-gray-400')) {
                    filledCount++;
                }
            }
        } else {
            // No hay CustomSelect, significa que hay un badge estático (solo 1 opción). Es válido.
            optionalFilledCount++;
        }
    } else if (h2 && h2.textContent.toLowerCase().includes('solicitud de inicio de arbitraje')) {
        // Especial: "Solicitud de Inicio de Arbitraje" usa MultiArchivoInput sin label interno, su requerimiento está en el h2
        const isRequired = h2.innerHTML.includes('#BE0F4A') || h2.innerHTML.includes('*');
        if (isRequired) requiredCount++;
        
        const fileNames = sectionEl.querySelectorAll('.truncate, [class*="truncate"]');
        if (fileNames.length > 0) filledCount++;
    }

    // Caso especial: botones de Sí/No que no usan RadioGroup (Ej: Medida Cautelar).
    // Si hay un botón pre-seleccionado con el estilo dark, sumamos a llenados opcionales.
    const toggleButtons = sectionEl.querySelectorAll('button.bg-\\[\\#291136\\].text-white');
    if (toggleButtons.length > 0) optionalFilledCount++;

    // Si tiene campos requeridos, deben estar todos llenos.
    if (requiredCount > 0) {
        return filledCount >= requiredCount;
    }
    
    // Si NO tiene campos requeridos, se considera completada SOLO    // (o si tiene un valor por defecto válido, como el botón "No" en Medida Cautelar o el badge estático)
    return optionalFilledCount > 0;
}

/* ─── Step item individual ─── */
function StepItem({ id, number, label, isCompleted, isActive, isVisited, isLast }) {
    // Si está completado pero a la vez es el activo (el usuario está viéndolo), sumamos estilos
    return (
        <div id={id} className="flex items-start gap-3 relative">
            {/* Línea conectora vertical */}
            {!isLast && (
                <div
                    className="absolute left-[15px] top-[36px] w-0.5 h-[calc(100%+4px)]"
                    style={{
                        background: isCompleted
                            ? 'linear-gradient(to bottom, #22c55e, rgba(255,255,255,0.18))'
                            : (isActive || isVisited)
                                ? 'rgba(255,255,255,0.20)'
                                : 'rgba(255,255,255,0.08)',
                    }}
                />
            )}

            {/* Círculo numerado */}
            <div
                className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    isCompleted && isActive
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 ring-4 ring-emerald-500/30 ring-offset-2 ring-offset-[#291136]'
                        : isCompleted
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : isActive
                                ? 'bg-[#BE0F4A] text-white shadow-lg shadow-[#BE0F4A]/40 ring-2 ring-[#BE0F4A]/30 ring-offset-2 ring-offset-[#291136]'
                                : isVisited
                                    ? 'bg-white/20 text-white/70 border border-white/25'
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
                    isCompleted || isActive
                        ? 'text-white'
                        : isVisited
                            ? 'text-white/60'
                            : 'text-white/30'
                }`}>
                    {label}
                </p>
                <p className={`text-[10px] mt-0.5 font-medium ${
                    isCompleted && isActive
                        ? 'text-emerald-300 font-bold'
                        : isCompleted
                            ? 'text-emerald-400/70'
                            : isActive
                                ? 'text-[#BE0F4A]/80 font-bold'
                                : isVisited
                                    ? 'text-white/25'
                                    : 'text-white/15'
                }`}>
                    {isCompleted ? 'Completado' : isActive ? 'En curso' : isVisited ? 'Visitado' : 'Pendiente'}
                </p>
            </div>
        </div>
    );
}

/* ─── Sidebar ─── */
function Sidebar({ etapas, pasoActivo, maxPasoAlcanzado, seccionesCompletas, onClose, isMobile }) {
    const total = etapas.length;
    // Solo contamos como completadas visualmente las que cumplen la misma regla que los Steps:
    // válidas Y que ya fueron alcanzadas.
    const completadas = seccionesCompletas.filter((isValid, i) => {
        if (!isValid) return false;
        return i <= maxPasoAlcanzado;
    }).length;
    
    const porcentaje = Math.round((completadas / total) * 100);
    const scrollContainerRef = useRef(null);

    // Auto-scroll del sidebar para mantener centrado el paso activo
    useEffect(() => {
        const activeEl = document.getElementById(`sidebar-step-${pasoActivo}`);
        const container = scrollContainerRef.current;
        if (activeEl && container) {
            const containerHalf = container.clientHeight / 2;
            const elHalf = activeEl.clientHeight / 2;
            // offsetTop asume que el contenedor padre es relative
            container.scrollTo({
                top: activeEl.offsetTop - containerHalf + elHalf,
                behavior: 'smooth'
            });
        }
    }, [pasoActivo]);

    return (
        <aside className={`
            flex flex-col h-full relative overflow-hidden
            bg-[#13071A]
            ${isMobile ? 'w-[300px]' : 'w-[280px]'}
        `}>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-5%] right-[-15%] w-[300px] h-[300px] bg-[#BE0F4A]/35 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[40%] left-[-30%] w-[250px] h-[250px] bg-[#431259]/25 rounded-full blur-[90px] pointer-events-none" />
            
            {/* Logo — grande y prominente para que el usuario sepa que está en CARD ANKAWA */}
            <div className="px-5 pt-8 pb-6 relative">
                {isMobile && (
                    <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10">
                        <X size={18} />
                    </button>
                )}
                <div className="flex flex-col items-center text-center">
                    <div className="w-[100px] h-[100px] mb-4 rounded-[2rem] bg-white/[0.08] backdrop-blur-sm flex items-center justify-center border border-white/[0.12] overflow-hidden p-2.5 shadow-xl shadow-black/30">
                        <img src="/logo-white.png" alt="CARD Ankawa" className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <div>
                        <p className="text-white font-black text-xl tracking-[0.15em] leading-none">ANKAWA</p>
                        <p className="text-white/50 text-[11px] font-bold tracking-[0.3em] uppercase mt-1.5">Internacional</p>
                        <div className="mt-3 px-3 py-1.5 rounded-lg bg-[#BE0F4A]/15 border border-[#BE0F4A]/20 inline-block">
                            <p className="text-[9px] font-bold text-[#BE0F4A] tracking-[0.15em] uppercase">Centro de Arbitraje y<br/>Resolución de Disputas</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* Progreso del trámite */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-5 scrollbar-hide relative">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-5">
                    Progreso del trámite
                </p>

                <div className="space-y-5">
                    {etapas.map((etapa, i) => {
                        const isValid = !!seccionesCompletas[i];
                        // Es completada si es válida y el usuario ya alcanzó este paso alguna vez
                        const isCompleted = isValid && (i <= maxPasoAlcanzado);
                        
                        const isActive = i === pasoActivo;
                        // Es visitado si ya fue alcanzado pero no está completado
                        const isVisited = (i <= maxPasoAlcanzado) && !isCompleted && !isActive;

                        return (
                            <StepItem
                                key={i}
                                id={`sidebar-step-${i}`}
                                number={i + 1}
                                label={etapa.label}
                                isCompleted={isCompleted}
                                isActive={isActive}
                                isVisited={isVisited}
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
    const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState(0);
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
            const seccionesDOM = form.querySelectorAll('.rounded-2xl');
            
            // Array a partir de NodeList
            const sectionContainers = Array.from(seccionesDOM);
            
            // Si hay un botón de submit, añadimos su contenedor para representar la etapa final "Revisión y envío"
            const submitBtn = contentRef.current.querySelector('button[type="submit"]');
            if (submitBtn) {
                const submitWrapper = submitBtn.closest('.mt-8') || submitBtn.parentElement;
                if (submitWrapper && !sectionContainers.includes(submitWrapper)) {
                    sectionContainers.push(submitWrapper);
                }
            }

            // Función para determinar a qué índice de "etapas" corresponde un DOM element
            function findEtapaIndex(sectionEl, etapas) {
                if (sectionEl.querySelector('button[type="submit"]')) return etapas.length - 1;
                
                const h2 = sectionEl.querySelector('h2, h3');
                if (!h2) return -1;
                
                const normalize = (str) => (str || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const title = normalize(h2.textContent);
                
                return etapas.findIndex(e => {
                    const label = normalize(e.label);
                    return title.includes(label) || label.includes(title);
                });
            }

            sectionContainersRef.current = sectionContainers;

            // --- IntersectionObserver: detectar sección visible (para "en_curso") ---
            const visibleIndices = [];
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        const idx = findEtapaIndex(entry.target, etapas);
                        if (idx !== -1) {
                            if (entry.isIntersecting) {
                                if (!visibleIndices.includes(idx)) visibleIndices.push(idx);
                            } else {
                                const i = visibleIndices.indexOf(idx);
                                if (i >= 0) visibleIndices.splice(i, 1);
                            }
                        }
                    });

                    if (visibleIndices.length > 0) {
                        const topIndex = Math.min(...visibleIndices);
                        setPasoActivo(topIndex);
                        setMaxPasoAlcanzado(prev => Math.max(prev, topIndex));
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
                const etapaResults = new Array(etapas.length).fill(false);
                
                sectionContainers.forEach((sec) => {
                    const stepIdx = findEtapaIndex(sec, etapas);
                    if (stepIdx === -1) return; // Ignorar cajas que no son etapas reales
                    
                    const result = evaluarSeccion(sec);
                    if (result === true) {
                        etapaResults[stepIdx] = true;
                    } else if (result === null && etapaResults[stepIdx] !== true) {
                        // Secciones sin campos requeridos que tienen contenido visible
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

    // Determinar qué imagen de fondo mostrar (1 a 5) basado en el avance del formulario
    const getBgIndex = () => {
        const total = etapas.length;
        if (total <= 5) return Math.min(pasoActivo + 1, 5);
        
        // Distribución porcentual
        const percent = pasoActivo / (total - 1);
        if (percent < 0.2) return 1;
        if (percent < 0.4) return 2;
        if (percent < 0.6) return 3;
        if (percent < 0.8) return 4;
        return 5;
    };
    
    const bgIndex = getBgIndex();

    return (
        <div className="min-h-screen bg-gray-50/60 flex relative">
            {/* Animación de fondo: Imágenes fotográficas como marca de agua */}
            <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] pointer-events-none z-0 overflow-hidden bg-gray-100">
                {[1, 2, 3, 4, 5].map((num) => (
                    <div 
                        key={`bg-${num}`}
                        className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
                            bgIndex === num ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <img src={`/images/backgrounds/bg${num}.png`} alt="" className="w-full h-full object-cover grayscale opacity-[0.40]" />
                    </div>
                ))}
            </div>

            <AnkawaToaster position="top-center" duration={5000} />

            {/* Sidebar — desktop */}
            <div className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-[280px]">
                <Sidebar etapas={etapas} pasoActivo={pasoActivo} maxPasoAlcanzado={maxPasoAlcanzado} seccionesCompletas={seccionesCompletas} isMobile={false} />
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
                            maxPasoAlcanzado={maxPasoAlcanzado}
                            seccionesCompletas={seccionesCompletas}
                            onClose={() => setMobileOpen(false)}
                            isMobile={true}
                        />
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen relative z-10">
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
                    <div className="relative overflow-hidden bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]">
                        {/* Elementos decorativos de fondo para un look premium */}
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
                                        Mesa de Partes · Nueva Solicitud
                                    </p>
                                </div>
                                <h1 className="text-2xl sm:text-[32px] font-black text-[#291136] tracking-tight uppercase leading-tight mb-2">
                                    {servicio.nombre}
                                </h1>
                                <p className="text-sm sm:text-base text-gray-500 font-medium max-w-xl">
                                    Complete los datos requeridos para presentar su solicitud.
                                </p>
                            </div>

                            <div className="w-28 sm:w-36 shrink-0 relative z-10 hidden sm:block">
                                <img src="/logo.png" alt="Ankawa Logo" className="w-full h-auto object-contain" />
                            </div>
                            
                            {/* Logo móvil centrado/arriba */}
                            <div className="w-24 shrink-0 relative z-10 sm:hidden mb-2">
                                <img src="/logo.png" alt="Ankawa Logo" className="w-full h-auto object-contain" />
                            </div>
                        </div>
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
