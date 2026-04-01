import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    FileText, FolderOpen, ArrowRight, Lock, 
    PlayCircle, Clock, Headphones, Mail, ShieldCheck
} from 'lucide-react';

// --- COMPONENTE DE ANIMACIÓN ---
const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.15 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const transformStyles = {
        up: 'translate-y-8',
        down: '-translate-y-8',
        left: 'translate-x-8',
        right: '-translate-x-8',
        none: 'translate-y-0 scale-95'
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${
                isVisible ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : `opacity-0 ${transformStyles[direction]}`
            } ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// 1. HEADER 
function Header() {
    return (
        <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
            {/* Se cambió h-20 por py-4 para permitir que el logo más grande quepa sin romperse */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Logo duplicado en tamaño (de h-10/12 a h-20/24) */}
                    <img 
                        src="/logo.png" 
                        alt="Logo Ankawa" 
                        className="h-20 sm:h-24 w-auto object-contain hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="border-l-2 border-[#BE0F4A]/20 pl-3 sm:pl-4 flex flex-col justify-center">
                        <h1 className="text-xs sm:text-sm font-black text-[#291136] leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            CARD ANKAWA INTL
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-semibold tracking-wide uppercase mt-0.5">
                            Centro de Arbitraje y Resolución de Disputas
                        </p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2 text-[#BE0F4A] bg-[#BE0F4A]/5 px-4 py-2 rounded-full border border-[#BE0F4A]/10">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Portal Seguro</span>
                </div>
            </div>
        </header>
    );
}

// 2. RECUADROS PRINCIPALES
function PlataformaAccesos() {
    return (
        <section className="pt-16 pb-16 lg:pt-20 lg:pb-20 relative overflow-hidden bg-gray-50">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent"></div>
            
            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <Reveal direction="up">
                    <div className="text-center mb-12 lg:mb-16">
                        {/* Título cambiado a "Mesa de Partes Virtual" */}
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#291136] mb-4 tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Mesa de Partes Virtual
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg px-2">
                            Gestione sus trámites arbitrales y acceda a sus expedientes de manera rápida, segura y 100% digital.
                        </p>
                    </div>
                </Reveal>

                <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {/* Tarjeta 1: Mesa de Partes */}
                    <Reveal delay={100} direction="up" className="h-full">
                        <div className="group relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-[#BE0F4A]/10 transform hover:-translate-y-2 transition-all duration-500 flex flex-col h-full text-center items-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#BE0F4A] to-[#f42c6c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[rgba(190,15,74,0.1)] rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 border border-[#BE0F4A]/20">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#BE0F4A]" />
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#291136] mb-3 sm:mb-4">Mesa de Partes</h3>
                            <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                                Ingrese nuevas solicitudes de arbitraje, presente demandas, contestaciones y adjunte documentación probatoria.
                            </p>
                            
                            <Link href="/mesa-partes"
                                className="relative overflow-hidden flex items-center justify-center gap-3 w-full bg-white text-[#BE0F4A] border-2 border-[#BE0F4A] px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-[#BE0F4A] hover:text-white active:scale-95 transition-all duration-300 group/btn">
                                <span className="text-sm sm:text-base">Ingresar Solicitud</span>
                                <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </Reveal>

                    {/* Tarjeta 2: Expedientes */}
                    <Reveal delay={200} direction="up" className="h-full">
                        <div className="group relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-[#BE0F4A]/10 transform hover:-translate-y-2 transition-all duration-500 flex flex-col h-full text-center items-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#BE0F4A] to-[#f42c6c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[rgba(190,15,74,0.1)] rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform duration-500 border border-[#BE0F4A]/20">
                                <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#BE0F4A]" />
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#291136] mb-3 sm:mb-4">Expedientes</h3>
                            <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                                Acceda a su panel privado para hacer seguimiento de sus casos, descargar laudos y gestionar notificaciones.
                            </p>
                            
                            <Link href="/login"
                                className="relative overflow-hidden flex items-center justify-center gap-3 w-full bg-[#BE0F4A] text-white px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-[#9c0c3c] active:scale-95 transition-all duration-300 shadow-md group/btn">
                                <Lock size={18} className="sm:w-5 sm:h-5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                <span className="text-sm sm:text-base">Iniciar Sesión</span>
                            </Link>
                        </div>
                    </Reveal>
                </div>
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
                        <h2 className="text-2xl sm:text-3xl font-black text-[#291136] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            ¿Cómo usar la plataforma?
                        </h2>
                        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                            Visualice nuestra guía rápida para presentar sus documentos sin contratiempos.
                        </p>
                    </div>
                    
                    <div className="relative mx-auto max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-[#291136] border border-gray-200 group">
                        <div className="h-8 sm:h-10 bg-gray-100 border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                        </div>
                        
                        {/* Modificado a fondo color #291136 sin imagen externa */}
                        <div className="relative w-full pb-[56.25%] bg-[#291136]">
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-[#291136]/80 transition-colors duration-300">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 border border-white/20">
                                    <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
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
function SoporteTecnico() {
    return (
        <footer className="bg-gray-100 text-gray-800 py-12 lg:py-16 relative border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <Reveal direction="up">
                    <div className="flex flex-col xl:flex-row gap-10 items-center xl:items-stretch">
                        
                        <div className="w-full xl:w-1/3 text-center xl:text-left flex flex-col justify-center">
                            <h3 className="text-2xl sm:text-3xl font-black mb-3 text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>Soporte Técnico</h3>
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base max-w-lg mx-auto xl:mx-0">
                                ¿Inconvenientes con la carga de documentos o acceso al sistema? Nuestro equipo está listo para asistirle en horario de oficina.
                            </p>
                        </div>

                        <div className="w-full xl:w-2/3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                
                                <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col">
                                    <Clock className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Atención</p>
                                    <p className="text-base lg:text-sm xl:text-base font-bold text-gray-900 whitespace-nowrap">08:00 AM – 06:00 PM</p>
                                    <p className="text-xs text-gray-500 mt-1">Lunes a Viernes</p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col">
                                    <Headphones className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Central Telefónica</p>
                                    <p className="text-base lg:text-sm xl:text-base font-bold text-gray-900 whitespace-nowrap">+51 XXX XXX XXX</p>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-2xl p-5 lg:p-6 hover:shadow-lg transition-all duration-300 flex flex-col sm:col-span-2 lg:col-span-1">
                                    <Mail className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Correo Electrónico</p>
                                    <a href="mailto:soporte@ankawagroup.org" className="text-sm sm:text-base lg:text-sm xl:text-base font-bold text-gray-900 hover:text-[#BE0F4A] transition-colors truncate block w-full" title="soporte@ankawagroup.org">
                                        soporte@ankawagroup.org
                                    </a>
                                </div>

                            </div>
                        </div>

                    </div>

                    <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-gray-300 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-gray-500 text-xs sm:text-sm">
                        <p className="font-medium">© {new Date().getFullYear()} The Ankawa Global Group SAC.</p>
                        <p>CARD ANKAWA INTL — Todos los derechos reservados.</p>
                    </div>
                </Reveal>
            </div>
        </footer>
    );
}

// 5. COMPONENTE PRINCIPAL
export default function Welcome() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-[#BE0F4A] selection:text-white">
            <Header />
            
            <main className="flex-grow">
                <PlataformaAccesos />
                <VideoTutorial />
            </main>

            <SoporteTecnico />
        </div>
    );
}