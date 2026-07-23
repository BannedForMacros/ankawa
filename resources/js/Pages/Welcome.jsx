import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    FileText, FolderOpen, ArrowRight, Lock,
    PlayCircle, Clock, Headphones, Mail, ShieldCheck, ChevronDown
} from 'lucide-react';
import Reveal, { usePrefersReducedMotion } from '@/Components/Reveal';

// Detecta si la página ya se desplazó más de `px` (header sticky, indicador de scroll)
function useScrolledPast(px = 50) {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                setScrolled(window.scrollY > px);
                ticking = false;
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [px]);

    return scrolled;
}

// 1. HEADER
function Header() {
    const scrolled = useScrolledPast(50);

    return (
        <header
            className={`sticky top-0 w-full z-50 transition-all duration-500 border-b ${
                scrolled
                    ? 'bg-white/90 backdrop-blur-md border-gray-200 shadow-md'
                    : 'bg-white/70 backdrop-blur-sm border-transparent shadow-none'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

                <div className="flex items-center gap-3 sm:gap-4">
                    <picture>
                        <source srcSet="/logo.webp" type="image/webp" />
                        <img
                            src="/logo.png"
                            alt="Logo Ankawa"
                            className="h-20 sm:h-24 w-auto object-contain hover:scale-105 transition-transform duration-300"
                        />
                    </picture>
                    <div className="border-l-2 border-ankawa-rose/20 pl-3 sm:pl-4 flex flex-col justify-center">
                        <h1 className="text-xs sm:text-sm font-black text-ankawa-deep leading-tight">
                            CARD ANKAWA INTL
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-semibold tracking-wide uppercase mt-0.5">
                            Centro de Arbitraje y Resolución de Disputas
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 text-ankawa-rose bg-ankawa-rose/5 px-4 py-2 rounded-full border border-ankawa-rose/10">
                    <ShieldCheck size={16} className="motion-safe:animate-shield-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Portal Seguro</span>
                </div>
            </div>
        </header>
    );
}

// 2. RECUADROS PRINCIPALES
const BACKGROUNDS = [1, 2, 3, 4, 5].map((n) => ({
    avif: `/images/backgrounds/bg${n}.avif`,
    webp: `/images/backgrounds/bg${n}.webp`,
    jpg:  `/images/backgrounds/bg${n}.jpg`,
}));

// Clases compartidas de las 2 tarjetas de acceso. La sombra de hover vive en un
// ::after (solo opacity) — no animar box-shadow, y sin overflow-hidden en la
// tarjeta para no recortarla.
const CARD_CLASSES = [
    'group relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-xl',
    'transition-transform duration-500 ease-out motion-safe:hover:-translate-y-1.5',
    'after:content-[""] after:absolute after:inset-0 after:rounded-3xl after:pointer-events-none',
    'after:shadow-2xl after:shadow-ankawa-rose/15 after:opacity-0 hover:after:opacity-100',
    'after:transition-opacity after:duration-500',
    'flex flex-col h-full text-center items-center',
].join(' ');

function PlataformaAccesos() {
    const [bgIndex, setBgIndex] = useState(0);
    const scrolled = useScrolledPast(50);
    const reduced = usePrefersReducedMotion();
    const parallaxRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Parallax suave del fondo (solo transform, vía rAF; máx ~40px)
    useEffect(() => {
        if (reduced) return;
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const y = Math.min(window.scrollY * 0.12, 40);
                if (parallaxRef.current) {
                    parallaxRef.current.style.transform = `translate3d(0, ${y}px, 0)`;
                }
                ticking = false;
            });
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [reduced]);

    return (
        <section className="pt-16 pb-16 lg:pt-20 lg:pb-20 relative overflow-hidden bg-gray-50">
            {/* Fondo decorativo (base) */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent z-0"></div>

            {/* Carousel de fondo — con sangrado vertical para el parallax */}
            <div ref={parallaxRef} className="absolute inset-x-0 -inset-y-10 z-0 will-change-transform" aria-hidden="true">
                {BACKGROUNDS.map((bg, idx) => (
                    <div
                        key={bg.jpg}
                        className={`absolute inset-0 overflow-hidden transition-opacity duration-[1500ms] ${
                            idx === bgIndex ? 'opacity-[0.40]' : 'opacity-0'
                        }`}
                    >
                        <picture>
                            <source srcSet={bg.avif} type="image/avif" />
                            <source srcSet={bg.webp} type="image/webp" />
                            <img
                                src={bg.jpg}
                                alt=""
                                loading={idx === 0 ? 'eager' : 'lazy'}
                                decoding="async"
                                className={`w-full h-full object-cover grayscale ${
                                    idx === bgIndex ? 'motion-safe:animate-kenburns-slow' : ''
                                }`}
                            />
                        </picture>
                    </div>
                ))}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="text-center mb-12 lg:mb-16">
                    {/* Título: nombre del sistema */}
                    <h2 className="motion-safe:animate-fade-up-blur text-3xl sm:text-4xl md:text-5xl font-black text-ankawa-deep mb-4 tracking-tight drop-shadow-sm">
                        Ankawa Center
                    </h2>
                    <p
                        className="motion-safe:animate-fade-up-blur text-gray-600 max-w-2xl mx-auto text-base sm:text-lg px-2"
                        style={{ animationDelay: '150ms' }}
                    >
                        Gestione sus trámites y acceda a sus expedientes de manera rápida, segura y 100% digital.
                    </p>
                </div>

                <Reveal
                    staggerChildren={150}
                    className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto"
                    childClassName="h-full"
                >
                    {/* Tarjeta 1: Mesa de Partes */}
                    <div className={CARD_CLASSES}>
                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-r from-ankawa-rose to-[#f42c6c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>

                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ankawa-rose/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 border border-ankawa-rose/20">
                            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-ankawa-rose" />
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-bold text-ankawa-deep mb-3 sm:mb-4">Mesa de Partes</h3>
                        <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                            Canal oficial para la presentación de solicitudes, escritos, comunicaciones y demás documentación dirigida al Centro.
                        </p>

                        <Link href="/mesa-partes"
                            className="relative overflow-hidden flex items-center justify-center gap-3 w-full bg-white text-ankawa-rose border-2 border-ankawa-rose px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-ankawa-rose hover:text-white active:scale-95 transition-all duration-300 group/btn">
                            <span className="text-sm sm:text-base">Ingresar Trámite</span>
                            <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </Link>
                    </div>

                    {/* Tarjeta 2: Expedientes */}
                    <div className={CARD_CLASSES}>
                        <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-r from-ankawa-rose to-[#f42c6c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>

                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-ankawa-rose/10 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 border border-ankawa-rose/20">
                            <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-ankawa-rose" />
                        </div>

                        <h3 className="text-2xl sm:text-3xl font-bold text-ankawa-deep mb-3 sm:mb-4">Expedientes</h3>
                        <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                            Acceda a su panel privado para hacer seguimiento de sus casos, descargar y gestionar notificaciones.
                        </p>

                        <Link href="/login"
                            className="relative overflow-hidden flex items-center justify-center gap-3 w-full bg-ankawa-rose text-white px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-ankawa-rose-hover active:scale-95 transition-all duration-300 shadow-md group/btn">
                            {/* Shine sweep — un solo barrido al hacer hover */}
                            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
                                <span className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[160%] skew-x-[-20deg] motion-safe:group-hover/btn:animate-shine"></span>
                            </span>
                            <Lock size={18} className="sm:w-5 sm:h-5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                            <span className="text-sm sm:text-base">Iniciar Sesión</span>
                        </Link>
                    </div>
                </Reveal>

                {/* Pagination Dots */}
                <div className="flex justify-center items-center gap-3 mt-12 relative z-10">
                    {BACKGROUNDS.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setBgIndex(idx)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 shadow-sm ${
                                idx === bgIndex ? 'bg-ankawa-rose scale-125' : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Ir a la imagen ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Indicador de scroll — desaparece al desplazarse */}
            <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-opacity duration-500 ${
                    scrolled ? 'opacity-0' : 'opacity-100'
                }`}
                aria-hidden="true"
            >
                <ChevronDown className="w-6 h-6 text-ankawa-deep/50 motion-safe:animate-chevron-drift" />
            </div>
        </section>
    );
}

// 3. SECCIÓN DE VIDEO
function VideoTutorial() {
    return (
        <section className="py-16 lg:py-20 bg-white relative border-t border-gray-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
                <Reveal direction="up">
                    <div className="text-center mb-8 lg:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-black text-ankawa-deep mb-3">
                            ¿Cómo usar la plataforma?
                        </h2>
                        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                            Visualice nuestra guía rápida para presentar sus documentos sin contratiempos.
                        </p>
                    </div>
                </Reveal>

                <Reveal direction="zoom" delay={120} duration={800}>
                    <div className="relative mx-auto max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-ankawa-deep border border-gray-200 group">
                        <div className="h-8 sm:h-10 bg-gray-100 border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                        </div>

                        <div className="relative w-full pb-[56.25%] bg-ankawa-deep">
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-ankawa-deep/80 transition-colors duration-300">
                                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                                    {/* Anillo pulsante lento tras el botón de reproducir */}
                                    <span className="absolute inset-0 rounded-full border-2 border-white/30 motion-safe:animate-pulse-ring-slow" aria-hidden="true"></span>
                                    <div className="w-full h-full bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 border border-white/20">
                                        <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
                                    </div>
                                </div>
                                <span className="text-white font-bold mt-4 sm:mt-6 relative z-10 tracking-wider text-base sm:text-lg uppercase">Reproducir Tutorial</span>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// 4. FOOTER
const FOOTER_CARD_CLASSES = 'bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 hover:shadow-lg transition-shadow duration-300 flex flex-col group h-full';

function SoporteTecnico() {
    return (
        <footer className="bg-gray-100 text-gray-800 py-12 lg:py-16 relative border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <div className="flex flex-col xl:flex-row gap-10 items-center xl:items-stretch">

                    <Reveal direction="up" className="w-full xl:w-1/3 text-center xl:text-left flex flex-col justify-center">
                        <h3 className="text-2xl sm:text-3xl font-black mb-3 text-gray-900">Soporte Técnico</h3>
                        <p className="text-gray-600 leading-relaxed text-sm sm:text-base max-w-lg mx-auto xl:mx-0">
                            ¿Inconvenientes con la carga de documentos o acceso al sistema? Nuestro equipo está listo para asistirle en horario de oficina.
                        </p>
                    </Reveal>

                    <div className="w-full xl:w-2/3">
                        <Reveal
                            staggerChildren={130}
                            delay={100}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
                            childClassName="h-full sm:[&:nth-child(3)]:col-span-2 lg:[&:nth-child(3)]:col-span-1"
                        >
                            <div className={FOOTER_CARD_CLASSES}>
                                <Clock className="text-ankawa-rose w-7 h-7 sm:w-8 sm:h-8 mb-4 motion-safe:group-hover:animate-icon-bounce" />
                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Atención</p>
                                <p className="text-base lg:text-sm xl:text-base font-bold text-gray-900 whitespace-nowrap">08:00 AM – 06:00 PM</p>
                                <p className="text-xs text-gray-500 mt-1">Lunes a Viernes</p>
                            </div>

                            <div className={FOOTER_CARD_CLASSES}>
                                <Headphones className="text-ankawa-rose w-7 h-7 sm:w-8 sm:h-8 mb-4 motion-safe:group-hover:animate-icon-bounce" />
                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Central Telefónica</p>
                                <p className="text-base lg:text-sm xl:text-base font-bold text-gray-900 whitespace-nowrap">+51 933 798 089</p>
                            </div>

                            <div className={FOOTER_CARD_CLASSES}>
                                <Mail className="text-ankawa-rose w-7 h-7 sm:w-8 sm:h-8 mb-4 motion-safe:group-hover:animate-icon-bounce" />
                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Correo Electrónico</p>
                                <a href="mailto:soportetecnico@ankawainternacional.org" className="text-sm sm:text-base lg:text-sm xl:text-base font-bold text-gray-900 hover:text-ankawa-rose transition-colors break-all block" title="soportetecnico@ankawainternacional.org">
                                    soportetecnico@ankawainternacional.org
                                </a>
                            </div>
                        </Reveal>
                    </div>

                </div>

                <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-gray-500 text-xs sm:text-sm">
                    <p className="font-medium">© {new Date().getFullYear()} The Ankawa Global Group SAC.</p>
                    <p>CARD ANKAWA INTL — Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

// 5. COMPONENTE PRINCIPAL
export default function Welcome() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-ankawa-rose selection:text-white">
            <Header />

            <main className="flex-grow">
                <PlataformaAccesos />
                <VideoTutorial />
            </main>

            <SoporteTecnico />
        </div>
    );
}
