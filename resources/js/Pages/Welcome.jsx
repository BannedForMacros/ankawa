import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import {
    FileText, FolderOpen, Shield, Zap, CheckCircle, Clock,
    Download, Bell, Search, Mail, Eye, Paperclip, BarChart3,
    Lock, Server, Headphones, ChevronDown, ArrowRight, Award,
    Users, TrendingUp, FileCheck, Calendar, MapPin, Phone,
    GitBranch, Menu, X
} from 'lucide-react';

// ── Animated Counter ──
function useOnScreen(ref) {
    const [isIntersecting, setIntersecting] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) =>
            setIntersecting(entry.isIntersecting)
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);
    return isIntersecting;
}

function AnimatedCounter({ end, suffix = '', duration = 2000 }) {
    const [count, setCount]         = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref    = useRef(null);
    const onScreen = useOnScreen(ref);

    useEffect(() => {
        if (onScreen && !hasAnimated) {
            let start = 0;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
                start += increment;
                if (start >= end) {
                    setCount(end);
                    clearInterval(timer);
                    setHasAnimated(true);
                } else {
                    setCount(Math.ceil(start));
                }
            }, 16);
            return () => clearInterval(timer);
        }
    }, [onScreen, end, duration, hasAnimated]);

    return <span ref={ref} className="tabular-nums">{count}{suffix}</span>;
}

// ── Header ──
function Header() {
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md shadow-md">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <img src="/logo.png" alt="Ankawa Internacional" className="h-14 w-auto" />

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-6">
                        {[
                            { href: '#servicios',           label: 'Servicios'           },
                            { href: '/mesa-partes',         label: 'Mesa de Partes'      },
                            { href: '/login',               label: 'Expediente',         },
                            { href: '#sobre-nosotros',      label: 'Sobre Nosotros'      },
                            { href: '#contacto',            label: 'Contacto'            },
                        ].map(item => (
                            item.href.startsWith('#')
                                ? <a key={item.href} href={item.href}
                                    className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors text-sm">
                                    {item.label}
                                  </a>
                                : <Link key={item.href} href={item.href}
                                    className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors text-sm">
                                    {item.label}
                                  </Link>
                        ))}
                        <Link href="/login"
                            className="bg-[#BE0F4A] text-white px-5 py-2.5 rounded-xl hover:bg-[#BC1D35] transition-colors font-semibold shadow-lg text-sm">
                            Iniciar Sesion
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button className="md:hidden p-2 text-[#291136]" onClick={() => setMenuAbierto(!menuAbierto)}>
                        {menuAbierto ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile menu */}
                {menuAbierto && (
                    <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
                        {[
                            { href: '#servicios',      label: 'Servicios'      },
                            { href: '/mesa-partes',    label: 'Mesa de Partes' },
                            { href: '/login',          label: 'Expediente'     },
                            { href: '#sobre-nosotros', label: 'Sobre Nosotros' },
                            { href: '#contacto',       label: 'Contacto'       },
                        ].map(item => (
                            item.href.startsWith('#')
                                ? <a key={item.href} href={item.href}
                                    className="block text-[#291136] hover:text-[#BE0F4A] font-medium py-2 transition-colors"
                                    onClick={() => setMenuAbierto(false)}>
                                    {item.label}
                                  </a>
                                : <Link key={item.href} href={item.href}
                                    className="block text-[#291136] hover:text-[#BE0F4A] font-medium py-2 transition-colors"
                                    onClick={() => setMenuAbierto(false)}>
                                    {item.label}
                                  </Link>
                        ))}
                        <Link href="/login"
                            className="block bg-[#BE0F4A] text-white px-5 py-2.5 rounded-xl font-semibold text-center">
                            Iniciar Sesion
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    );
}

// ── Hero ──
function HeroSection() {
    return (
        <section className="relative pt-20 min-h-screen flex items-center bg-gradient-to-br from-[#291136] via-[#4A153D] to-[#291136]">
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23BE0F4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
                <div className="text-center">
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
                        <Award className="w-5 h-5 text-[#BE0F4A] mr-2" />
                        <span className="text-white text-sm font-medium">Marca registrada ante INDECOPI</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Centro de Arbitraje
                        <br />
                        <span className="text-[#BE0F4A]">Ankawa Internacional</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Plataforma integral para la gestion de arbitrajes y expedientes electronicos.
                        Presente demandas, consulte expedientes y acceda a toda su documentacion
                        de manera segura, rapida y profesional.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link href="/mesa-partes"
                            className="group px-8 py-4 bg-[#BE0F4A] text-white rounded-xl font-semibold text-lg shadow-2xl hover:bg-[#BC1D35] transition-all duration-300 transform hover:-translate-y-1 flex items-center">
                            Presentar Solicitud
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#servicios"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center">
                            Conocer Mas
                            <ChevronDown className="ml-2 w-5 h-5" />
                        </a>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        {[
                            { icon: <FileCheck className="w-8 h-8" />, value: 50, suffix: '+', label: 'Casos Exitosos'    },
                            { icon: <Clock className="w-8 h-8" />,      value: 24, suffix: '/7', label: 'Disponibilidad'   },
                            { icon: <TrendingUp className="w-8 h-8" />, value: 99, suffix: '%', label: 'Efectividad'       },
                            { icon: <Users className="w-8 h-8" />,      value: 50, suffix: '+', label: 'Clientes'          },
                        ].map((s, i) => (
                            <div key={i} className="text-white">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-3 text-[#BE0F4A]">
                                    {s.icon}
                                </div>
                                <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    <AnimatedCounter end={s.value} suffix={s.suffix} />
                                </div>
                                <div className="text-white/70 text-sm">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-8 h-8 text-white/50" />
            </div>
        </section>
    );
}

// ── Servicios desde BD ──
function ServicesSection({ servicios }) {
    return (
        <section id="servicios" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Nuestros Servicios
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6"></div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Plataforma completa para la gestion de arbitrajes y expedientes electronicos
                    </p>
                </div>

                {/* Accesos principales */}
                <div className="grid lg:grid-cols-2 gap-8 mb-16">
                    {/* Mesa de Partes */}
                    <div className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                        <div className="relative h-56 bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <FileText className="w-28 h-28 text-white/80 relative z-10" strokeWidth={1.2} />
                            <div className="absolute top-4 right-4 w-14 h-14 border-t-4 border-r-4 border-white/30 rounded-tr-2xl"></div>
                            <div className="absolute bottom-4 left-4 w-14 h-14 border-b-4 border-l-4 border-white/30 rounded-bl-2xl"></div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-[#291136] mb-3"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Mesa de Partes Virtual
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Ingrese nuevos casos de arbitraje, presente contestaciones a demandas
                                y gestione toda la documentacion necesaria de manera digital y eficiente.
                            </p>
                            <div className="space-y-3 mb-8">
                                {[
                                    { icon: <FileText size={16} />,   text: 'Presentacion de nuevas demandas arbitrales' },
                                    { icon: <FileCheck size={16} />,  text: 'Contestacion de expedientes activos'        },
                                    { icon: <Paperclip size={16} />,  text: 'Adjuntar documentos de hasta 100MB'         },
                                    { icon: <Bell size={16} />,       text: 'Notificaciones automaticas de estado'       },
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-700 group/item">
                                        <div className="w-8 h-8 bg-[#BE0F4A]/10 rounded-lg flex items-center justify-center text-[#BE0F4A] shrink-0 group-hover/item:bg-[#BE0F4A] group-hover/item:text-white transition-colors">
                                            {f.icon}
                                        </div>
                                        <span className="text-sm">{f.text}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/mesa-partes"
                                className="flex items-center justify-center w-full bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-xl group/btn">
                                Presentar Solicitud
                                <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {/* Expediente Electronico */}
                    <div className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
                        <div className="relative h-56 bg-gradient-to-br from-[#4A153D] to-[#B23241] overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/20"></div>
                            <FolderOpen className="w-28 h-28 text-white/80 relative z-10" strokeWidth={1.2} />
                            <div className="absolute top-4 right-4 w-14 h-14 border-t-4 border-r-4 border-white/30 rounded-tr-2xl"></div>
                            <div className="absolute bottom-4 left-4 w-14 h-14 border-b-4 border-l-4 border-white/30 rounded-bl-2xl"></div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-[#291136] mb-3"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Expediente Electronico
                            </h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                Consulte el estado actualizado de todos sus expedientes, revise la
                                documentacion presentada y acceda al historial completo de cada caso.
                            </p>
                            <div className="space-y-3 mb-8">
                                {[
                                    { icon: <Eye size={16} />,      text: 'Visualizacion de expedientes activos'      },
                                    { icon: <Download size={16} />, text: 'Descarga de documentos en formato PDF'     },
                                    { icon: <Clock size={16} />,    text: 'Historial completo de actuaciones'         },
                                    { icon: <Search size={16} />,   text: 'Busqueda avanzada por criterios'           },
                                ].map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-700 group/item">
                                        <div className="w-8 h-8 bg-[#291136]/10 rounded-lg flex items-center justify-center text-[#291136] shrink-0 group-hover/item:bg-[#291136] group-hover/item:text-white transition-colors">
                                            {f.icon}
                                        </div>
                                        <span className="text-sm">{f.text}</span>
                                    </div>
                                ))}
                            </div>
                            <Link href="/login"
                                className="flex items-center justify-center w-full bg-gradient-to-r from-[#4A153D] to-[#B23241] text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-xl group/btn">
                                Acceder con Login
                                <Lock className="ml-2 w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Servicios dinamicos desde BD */}
                {servicios.length > 0 && (
                    <div>
                        <h3 className="text-2xl font-bold text-[#291136] mb-6 text-center"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Tipos de Arbitraje Disponibles
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {servicios.map(servicio => (
                                <div key={servicio.id}
                                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#BE0F4A]/40 hover:shadow-lg transition-all duration-300 group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#BE0F4A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#BE0F4A] transition-colors">
                                            <GitBranch size={18} className="text-[#BE0F4A] group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-[#291136] mb-1">{servicio.nombre}</h4>
                                            {servicio.descripcion && (
                                                <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                                                    {servicio.descripcion}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

// ── Caracteristicas ──
function FeaturesSection() {
    return (
        <section id="caracteristicas" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Por que elegirnos?
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6"></div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tecnologia de punta al servicio del arbitraje moderno
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {[
                        { icon: <Shield className="w-10 h-10" />,    title: 'Seguridad Total',      desc: 'Cifrado de extremo a extremo y cumplimiento estricto de normativas de proteccion de datos personales.' },
                        { icon: <Zap className="w-10 h-10" />,       title: 'Acceso Inmediato',     desc: 'Disponible 24/7 desde cualquier dispositivo. Sin instalaciones ni configuraciones complejas.'           },
                        { icon: <Server className="w-10 h-10" />,    title: 'Respaldo Garantizado', desc: 'Copias de seguridad automaticas diarias y recuperacion ante desastres. Sus datos siempre protegidos.'   },
                        { icon: <Headphones className="w-10 h-10" />, title: 'Soporte Tecnico',     desc: 'Equipo especializado disponible para resolver cualquier inconveniente o consulta sobre el sistema.'     },
                    ].map((b, i) => (
                        <div key={i}
                            className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:border-[#BE0F4A] transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                                {b.icon}
                            </div>
                            <h3 className="text-lg font-bold text-[#291136] mb-3"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {b.title}
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-sm">{b.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: <Lock size={22} />,     title: 'Confidencialidad Absoluta', desc: 'Control de acceso por roles y permisos. Solo las partes autorizadas pueden ver la informacion de cada expediente.' },
                        { icon: <CheckCircle size={22}/>, title: 'Firma Digital',            desc: 'Documentos con validez legal mediante firma electronica certificada conforme a la normativa vigente.'              },
                        { icon: <Calendar size={22} />, title: 'Gestion de Plazos',         desc: 'Alertas automaticas de vencimientos y recordatorios para no perder ninguna fecha importante del proceso.'          },
                    ].map((f, i) => (
                        <div key={i} className="flex items-start gap-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="w-11 h-11 bg-[#BE0F4A] rounded-xl flex items-center justify-center text-white shrink-0">
                                {f.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-[#291136] mb-2">{f.title}</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Como funciona ──
function ProcessSection() {
    return (
        <section className="py-24 bg-gradient-to-br from-[#291136] to-[#4A153D]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-white mb-4"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Como Funciona
                    </h2>
                    <div className="w-24 h-1 bg-[#BE0F4A] mx-auto mb-6"></div>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto">
                        Proceso simple y eficiente en 4 pasos
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { n: '01', icon: <Users className="w-10 h-10" />,     title: 'Complete el Formulario', desc: 'Acceda a Mesa de Partes, llene sus datos y adjunte la documentacion necesaria.'        },
                        { n: '02', icon: <FileText className="w-10 h-10" />,  title: 'Presente su Caso',       desc: 'Envie su solicitud con todos los documentos. Recibira confirmacion al instante.'        },
                        { n: '03', icon: <BarChart3 className="w-10 h-10" />, title: 'Seguimiento',            desc: 'Reciba notificaciones del progreso y acceda al expediente con su codigo de seguimiento.' },
                        { n: '04', icon: <CheckCircle className="w-10 h-10"/>,title: 'Resolucion',             desc: 'Acceda a la documentacion final y laudo arbitral desde su expediente electronico.'       },
                    ].map((s, i) => (
                        <div key={i}
                            className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
                            <div className="absolute -top-5 left-8 w-10 h-10 bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] rounded-xl flex items-center justify-center text-white font-bold shadow-xl">
                                {s.n}
                            </div>
                            <div className="mt-5 mb-4 text-[#BE0F4A] group-hover:scale-110 transition-transform">
                                {s.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                {s.title}
                            </h3>
                            <p className="text-white/70 leading-relaxed text-sm">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Sobre Nosotros ──
function AboutSection() {
    return (
        <section id="sobre-nosotros" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-5xl font-bold text-[#291136] mb-6"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            The Ankawa Global Group SAC
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mb-8"></div>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Somos un centro de arbitraje reconocido y registrado ante INDECOPI,
                            comprometidos con la resolucion eficiente y transparente de conflictos
                            comerciales y civiles mediante procesos arbitrales modernos.
                        </p>
                        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                            Nuestra plataforma digital representa la evolucion natural del arbitraje
                            tradicional, combinando la solidez juridica con la eficiencia tecnologica.
                        </p>
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            {[
                                { icon: <Award size={22} />, value: '15+', label: 'Anos de experiencia'  },
                                { icon: <Users size={22} />, value: '50+', label: 'Arbitros certificados' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#BE0F4A]/10 rounded-xl flex items-center justify-center text-[#BE0F4A]">
                                        {s.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-2xl text-[#291136]">{s.value}</div>
                                        <div className="text-sm text-gray-600">{s.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/mesa-partes"
                            className="inline-flex items-center bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            Presentar una Solicitud
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#BE0F4A]/20 to-[#BC1D35]/20 rounded-3xl transform rotate-3"></div>
                        <img src="/logo.png" alt="Ankawa Internacional" className="relative rounded-3xl shadow-2xl p-8 bg-white" />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Testimonios ──
function TestimonialsSection() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Lo que dicen nuestros clientes
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto"></div>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { quote: 'La plataforma es increiblemente intuitiva. Pude presentar mi caso en minutos y el seguimiento en tiempo real me dio mucha tranquilidad.', author: 'Maria Gonzalez', pos: 'Directora Legal, Empresa Constructora' },
                        { quote: 'Excelente servicio. La seguridad de la informacion y la rapidez en las notificaciones superaron mis expectativas.', author: 'Carlos Ramirez', pos: 'Gerente General, Importadora' },
                        { quote: 'Finalmente un sistema moderno para arbitraje. La digitalizacion de expedientes nos ahorra tiempo y recursos significativos.', author: 'Ana Martinez', pos: 'Abogada Independiente' },
                    ].map((t, i) => (
                        <div key={i} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <svg key={j} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="text-gray-600 mb-6 leading-relaxed italic">"{t.quote}"</p>
                            <div className="border-t border-gray-100 pt-4">
                                <div className="font-bold text-[#291136]">{t.author}</div>
                                <div className="text-sm text-gray-500">{t.pos}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Stats ──
function StatsSection() {
    return (
        <section className="py-24 bg-gradient-to-r from-[#291136] to-[#4A153D]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    {[
                        { icon: <FileCheck className="w-10 h-10" />, value: 50,  suffix: '+', label: 'Casos Exitosos'           },
                        { icon: <Users className="w-10 h-10" />,     value: 50,  suffix: '+', label: 'Clientes'                 },
                        { icon: <TrendingUp className="w-10 h-10"/>, value: 98,  suffix: '%', label: 'Satisfaccion del Cliente' },
                        { icon: <Award className="w-10 h-10" />,     value: 15,  suffix: '+', label: 'Anos de Experiencia'      },
                    ].map((s, i) => (
                        <div key={i} className="text-white">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl mb-4 text-[#BE0F4A]">
                                {s.icon}
                            </div>
                            <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                <AnimatedCounter end={s.value} suffix={s.suffix} />
                            </div>
                            <div className="text-white/70">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── CTA ──
function CTASection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-5xl font-bold text-[#291136] mb-6"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Listo para comenzar?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Presente su solicitud de arbitraje de manera digital, segura y en minutos.
                </p>
                <Link href="/mesa-partes"
                    className="inline-flex items-center bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    Presentar Solicitud Ahora
                    <ArrowRight className="ml-3 w-6 h-6" />
                </Link>
            </div>
        </section>
    );
}

// ── Footer ──
function Footer() {
    return (
        <footer id="contacto" className="bg-[#291136] text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <img src="/logo.png" alt="Ankawa Internacional" className="h-14 w-auto mb-6" />
                        <p className="text-white/70 mb-4 text-sm">
                            Centro de Arbitraje registrado ante INDECOPI
                        </p>
                        <div className="flex items-center text-white/70">
                            <Award className="w-4 h-4 mr-2 text-[#BE0F4A]" />
                            <span className="text-sm">Marca Registrada</span>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-4">Servicios</h4>
                        <ul className="space-y-2">
                            {[
                                { href: '/mesa-partes', label: 'Mesa de Partes Virtual' },
                                { href: '/login',       label: 'Expediente Electronico' },
                            ].map(l => (
                                <li key={l.href}>
                                    <Link href={l.href} className="text-white/70 hover:text-white transition-colors text-sm">
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-4">Empresa</h4>
                        <ul className="space-y-2">
                            {[
                                { href: '#sobre-nosotros', label: 'Sobre Nosotros'       },
                                { href: '#',               label: 'Terminos y Condiciones' },
                                { href: '#',               label: 'Politica de Privacidad' },
                            ].map((l, i) => (
                                <li key={i}>
                                    <a href={l.href} className="text-white/70 hover:text-white transition-colors text-sm">
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold mb-4">Contacto</h4>
                        <ul className="space-y-3">
                            {[
                                { icon: <MapPin size={16} />,  text: 'Lima, Peru'           },
                                { icon: <Phone size={16} />,   text: '+51 XXX XXX XXX'       },
                                { icon: <Mail size={16} />,    text: 'contacto@ankawa.pe'    },
                            ].map((c, i) => (
                                <li key={i} className="flex items-center gap-2 text-white/70">
                                    <span className="text-[#BE0F4A] shrink-0">{c.icon}</span>
                                    <span className="text-sm">{c.text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-8 text-center text-white/60 text-sm">
                    &copy; {new Date().getFullYear()} The Ankawa Global Group SAC. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}

// ── Export Principal ──
export default function Welcome({ servicios = [] }) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <HeroSection />
            <ServicesSection servicios={servicios} />
            <FeaturesSection />
            <ProcessSection />
            <AboutSection />
            <TestimonialsSection />
            <StatsSection />
            <CTASection />
            <Footer />
        </div>
    );
}