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

// 1. HEADER (Con Marca Explícita y Responsive)
function Header() {
    return (
        <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                
                {/* Logo y Nombre de Marca */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <img 
                        src="/logo.png" 
                        alt="Logo Ankawa" 
                        className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="border-l-2 border-[#BE0F4A]/20 pl-3 sm:pl-4">
                        <h1 className="text-xs sm:text-sm font-black text-[#291136] leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            CARD ANKAWA INTL
                        </h1>
                        <p className="hidden sm:block text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
                            Centro de Arbitraje y Resolución de Disputas
                        </p>
                    </div>
                </div>

                {/* Badge Seguro */}
                <div className="hidden md:flex items-center gap-2 text-[#291136] bg-[#291136]/5 px-4 py-2 rounded-full border border-[#291136]/10">
                    <ShieldCheck size={16} className="text-[#BE0F4A]" />
                    <span className="text-xs font-bold uppercase tracking-widest">Portal Seguro</span>
                </div>
            </div>
        </header>
    );
}

// 2. RECUADROS PRINCIPALES (Diseño Premium)
function PlataformaAccesos() {
    return (
        <section className="pt-16 pb-16 lg:pt-20 lg:pb-20 relative overflow-hidden bg-gray-50">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-200/50 to-transparent"></div>
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#BE0F4A]/10 rounded-full blur-3xl hidden md:block"></div>
            <div className="absolute top-40 -left-40 w-96 h-96 bg-[#291136]/10 rounded-full blur-3xl hidden md:block"></div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
                <Reveal direction="up">
                    <div className="text-center mb-12 lg:mb-16">
                        <span className="text-[#BE0F4A] text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 block">
                            Ankawa Internacional
                        </span>
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
                        <div className="group relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-[#BE0F4A]/10 transform hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#BE0F4A] to-[#f42c6c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#BE0F4A]/10 to-[#BE0F4A]/5 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-[#BE0F4A]/20">
                                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-[#BE0F4A]" />
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#291136] mb-3 sm:mb-4">Mesa de Partes</h3>
                            <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                                Ingrese nuevas solicitudes de arbitraje, presente demandas, contestaciones y adjunte documentación probatoria.
                            </p>
                            
                            <Link href="/mesa-partes"
                                className="relative overflow-hidden flex items-center justify-between w-full bg-gray-50 text-[#BE0F4A] border border-gray-200 px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-[#BE0F4A] hover:text-white hover:border-[#BE0F4A] active:scale-95 transition-all duration-300 group/btn">
                                <span className="relative z-10 text-sm sm:text-base">Ingresar Solicitud</span>
                                <div className="bg-white/20 p-2 rounded-lg group-hover/btn:bg-white/20 group-hover/btn:translate-x-1 transition-all">
                                    <ArrowRight size={18} className="sm:w-5 sm:h-5" />
                                </div>
                            </Link>
                        </div>
                    </Reveal>

                    {/* Tarjeta 2: Expediente */}
                    <Reveal delay={200} direction="up" className="h-full">
                        <div className="group relative bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-[#291136]/10 transform hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#291136] to-[#4A153D] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#291136]/10 to-[#291136]/5 rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 border border-[#291136]/20">
                                <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-[#291136]" />
                            </div>
                            
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#291136] mb-3 sm:mb-4">Expedientes</h3>
                            <p className="text-gray-500 leading-relaxed mb-8 sm:mb-10 flex-grow text-sm sm:text-base lg:text-lg">
                                Acceda a su panel privado para hacer seguimiento de sus casos, descargar laudos y gestionar notificaciones.
                            </p>
                            
                            <Link href="/login"
                                className="relative overflow-hidden flex items-center justify-between w-full bg-[#291136] text-white px-5 py-3 sm:px-6 sm:py-4 rounded-xl font-bold hover:bg-[#1a0a22] active:scale-95 transition-all duration-300 shadow-md group/btn">
                                <span className="text-sm sm:text-base">Iniciar Sesión</span>
                                <div className="bg-white/10 p-2 rounded-lg group-hover/btn:bg-white/20 transition-all">
                                    <Lock size={18} className="sm:w-5 sm:h-5 group-hover/btn:scale-110 transition-transform" />
                                </div>
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
        <section className="py-16 lg:py-20 bg-white relative">
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
                    
                    <div className="relative mx-auto max-w-4xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(41,17,54,0.2)] bg-gray-900 border border-gray-200 group">
                        <div className="h-8 sm:h-10 bg-gray-100 border-b border-gray-200 flex items-center px-3 sm:px-4 gap-2">
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
                        </div>
                        
                        <div className="relative w-full pb-[56.25%] bg-black">
                            {/* AQUÍ VA TU IFRAME O VIDEO */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80")' }}></div>
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#BE0F4A]/90 backdrop-blur-sm rounded-full flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_30px_rgba(190,15,74,0.5)]">
                                    <PlayCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" />
                                </div>
                                <span className="text-white font-medium mt-4 sm:mt-6 relative z-10 tracking-wide text-base sm:text-lg">Reproducir Tutorial</span>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

// 4. FOOTER (Cards Arregladas y 100% Responsive)
function SoporteTecnico() {
    return (
        <footer className="bg-[#291136] text-white py-12 lg:py-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#BE0F4A] to-transparent opacity-50"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                <Reveal direction="up">
                    {/* Contenedor Flex para que apile bien en móviles y se divida en escritorio */}
                    <div className="flex flex-col xl:flex-row gap-10 items-center xl:items-stretch">
                        
                        {/* Texto de la Izquierda */}
                        <div className="w-full xl:w-1/3 text-center xl:text-left flex flex-col justify-center">
                            <h3 className="text-2xl sm:text-3xl font-bold mb-3">Soporte Técnico</h3>
                            <p className="text-white/70 leading-relaxed text-sm sm:text-base max-w-lg mx-auto xl:mx-0">
                                ¿Inconvenientes con la carga de documentos o acceso al sistema? Nuestro equipo está listo para asistirle en horario de oficina.
                            </p>
                        </div>

                        {/* Cards de Soporte - Arreglo de grid para evitar que se rompa el texto */}
                        <div className="w-full xl:w-2/3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                
                                {/* Card Horario */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6 hover:bg-white/10 transition-colors duration-300 flex flex-col">
                                    <Clock className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Atención</p>
                                    <p className="text-base lg:text-sm xl:text-base font-medium whitespace-nowrap">08:00 AM – 06:00 PM</p>
                                    <p className="text-xs text-white/40 mt-1">Lunes a Viernes</p>
                                </div>

                                {/* Card Teléfono */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6 hover:bg-white/10 transition-colors duration-300 flex flex-col">
                                    <Headphones className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Central Telefónica</p>
                                    <p className="text-base lg:text-sm xl:text-base font-medium whitespace-nowrap">+51 XXX XXX XXX</p>
                                </div>

                                {/* Card Correo (Toma el ancho completo en móvil/tablet si sobra, o 1 columna en PC) */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 lg:p-6 hover:bg-white/10 transition-colors duration-300 flex flex-col sm:col-span-2 lg:col-span-1">
                                    <Mail className="text-[#BE0F4A] w-7 h-7 sm:w-8 sm:h-8 mb-4" />
                                    <p className="text-[10px] sm:text-xs text-white/50 uppercase tracking-widest font-semibold mb-1 sm:mb-2">Correo Electrónico</p>
                                    <a href="mailto:soporte@ankawagroup.org" className="text-sm sm:text-base lg:text-sm xl:text-base font-medium hover:text-[#BE0F4A] transition-colors truncate block w-full" title="soporte@ankawagroup.org">
                                        soporte@ankawagroup.org
                                    </a>
                                </div>

                            </div>
                        </div>

                    </div>

                    {/* Footer Bottom */}
                    <div className="mt-12 lg:mt-16 pt-6 lg:pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-white/40 text-xs sm:text-sm">
                        <p className="font-medium">© {new Date().getFullYear()} The Ankawa Global Group SAC.</p>
                        <p>CARD ANKAWA INTL — Plataforma de trámites digitales.</p>
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