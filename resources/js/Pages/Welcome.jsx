import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    FileText, FolderOpen, Shield, CheckCircle, Clock,
    Bell, Eye, BarChart3, Lock, Headphones, ArrowRight,
    Award, Users, TrendingUp, FileCheck, MapPin, Phone,
    Mail, GitBranch, Menu, X, Scale, Star
} from 'lucide-react';

function Header() {
    const [open, setOpen] = useState(false);
    const links = [
        { href: '#servicios',      label: 'Servicios'      },
        { href: '#como-funciona',  label: 'Cómo Funciona'  },
        { href: '#nosotros',       label: 'Nosotros'       },
        { href: '#contacto',       label: 'Contacto'       },
    ];

    return (
        <header className="fixed w-full top-0 z-50 shadow-lg" style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 50%, #BE0F4A 100%)' }}>
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <img src="/logo-white.png" alt="CARD Ankawa" className="h-14 w-auto" />

                <nav className="hidden md:flex items-center gap-8">
                    {links.map(l => (
                        <a key={l.href} href={l.href}
                            className="text-white/90 hover:text-white font-medium text-sm transition-colors">
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden md:flex items-center gap-3">
                    <Link href="/mesa-partes"
                        className="text-white border border-white/70 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors">
                        Mesa de Partes
                    </Link>
                    <Link href="/login"
                        className="bg-white text-[#BE0F4A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/90 transition-colors">
                        Iniciar Sesión
                    </Link>
                </div>

                <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {open && (
                <div className="md:hidden border-t border-white/20 px-6 py-4 space-y-3" style={{ background: '#4A153D' }}>
                    {links.map(l => (
                        <a key={l.href} href={l.href}
                            className="block text-white/90 hover:text-white font-medium py-1.5"
                            onClick={() => setOpen(false)}>
                            {l.label}
                        </a>
                    ))}
                    <Link href="/mesa-partes" className="block text-center border border-white/70 text-white py-2.5 rounded-lg font-semibold mt-2">Mesa de Partes</Link>
                    <Link href="/login" className="block text-center bg-white text-[#BE0F4A] py-2.5 rounded-lg font-bold">Iniciar Sesión</Link>
                </div>
            )}
        </header>
    );
}

function Hero() {
    return (
        <section className="pt-20 min-h-screen flex items-center bg-white">
            <div className="max-w-7xl mx-auto px-6 py-24 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="inline-flex items-center gap-2 bg-[#BE0F4A]/10 text-[#BE0F4A] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
                            <Award size={13} />
                            Plataforma Oficial · CARD ANKAWA INTL
                        </span>
                        <h1 className="text-5xl lg:text-6xl font-black text-[#291136] leading-tight mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Sistema de Mesa de Partes
                            <br />
                            <span className="text-[#BE0F4A]">& Expedientes Digitales</span>
                        </h1>
                        <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg">
                            La plataforma digital oficial del <strong className="text-[#291136]">Centro de Arbitraje y Resolución de Disputas Ankawa Internacional</strong>. Presente demandas, gestione expedientes y haga seguimiento de su caso 100% en línea.
                        </p>
                        <div className="flex flex-wrap gap-3 mb-12">
                            <Link href="/mesa-partes"
                                className="inline-flex items-center gap-2 bg-[#BE0F4A] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#BC1D35] transition-colors shadow-lg shadow-[#BE0F4A]/20">
                                Presentar Solicitud
                                <ArrowRight size={18} />
                            </Link>
                            <Link href="/login"
                                className="inline-flex items-center gap-2 border-2 border-[#291136] text-[#291136] px-7 py-3.5 rounded-xl font-bold hover:bg-[#291136] hover:text-white transition-all">
                                Ver mis Expedientes
                                <FolderOpen size={18} />
                            </Link>
                        </div>
                        <div className="flex gap-10">
                            {[
                                { value: '50+', label: 'Casos resueltos' },
                                { value: '15+', label: 'Años de experiencia' },
                                { value: '98%', label: 'Satisfacción' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className="text-2xl font-black text-[#291136]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{s.value}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <div className="absolute -inset-8 rounded-3xl opacity-10" style={{ background: 'linear-gradient(135deg, #291136, #BE0F4A)' }}></div>
                            <div className="relative bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
                                <img src="/logo.png" alt="Ankawa Global Group" className="w-64 h-auto mx-auto" />
                                <p className="text-center text-sm text-gray-400 mt-6 font-medium">The Ankawa Global Group SAC</p>
                                <div className="flex justify-center gap-2 mt-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Servicios({ servicios }) {
    return (
        <section id="servicios" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-black text-[#291136] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Nuestros Servicios
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto">Plataforma digital para la gestión integral de arbitrajes</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">
                    <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#BE0F4A]/40 hover:shadow-lg transition-all group">
                        <div className="w-12 h-12 bg-[#BE0F4A]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#BE0F4A] transition-colors">
                            <FileText className="w-6 h-6 text-[#BE0F4A] group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-[#291136] mb-2">Mesa de Partes Virtual</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Presente demandas, contestaciones y documentación de forma 100% digital. Sin desplazamientos ni filas.
                        </p>
                        <ul className="space-y-2 mb-6">
                            {['Nuevas demandas arbitrales', 'Contestación de demandas', 'Adjuntar documentos hasta 100MB', 'Confirmación instantánea'].map((t, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle size={14} className="text-[#BE0F4A] shrink-0" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <Link href="/mesa-partes"
                            className="flex items-center justify-center gap-2 w-full bg-[#BE0F4A] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#BC1D35] transition-colors">
                            Presentar Solicitud <ArrowRight size={15} />
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-[#291136]/20 hover:shadow-lg transition-all group">
                        <div className="w-12 h-12 bg-[#291136]/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#291136] transition-colors">
                            <FolderOpen className="w-6 h-6 text-[#291136] group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-[#291136] mb-2">Expediente Electrónico</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Acceda en tiempo real al historial de su expediente, descargue documentos y reciba notificaciones automáticas.
                        </p>
                        <ul className="space-y-2 mb-6">
                            {['Estado actualizado en tiempo real', 'Historial de actuaciones', 'Descarga de documentos PDF', 'Notificaciones automáticas'].map((t, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <CheckCircle size={14} className="text-[#291136] shrink-0" />
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <Link href="/login"
                            className="flex items-center justify-center gap-2 w-full bg-[#291136] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#4A153D] transition-colors">
                            Acceder al Sistema <Lock size={15} />
                        </Link>
                    </div>
                </div>

                {servicios.length > 0 && (
                    <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Modalidades de arbitraje</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {servicios.map(s => (
                                <span key={s.id} className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[#291136] text-sm font-medium px-4 py-2 rounded-full">
                                    <GitBranch size={12} className="text-[#BE0F4A]" />
                                    {s.nombre}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function ComoFunciona() {
    const pasos = [
        { n: '01', icon: <Users size={24} />, title: 'Complete el formulario', desc: 'Acceda a Mesa de Partes, ingrese sus datos y adjunte los documentos requeridos.' },
        { n: '02', icon: <FileText size={24} />, title: 'Envíe su solicitud', desc: 'Presente su caso digitalmente. Recibirá confirmación y número de expediente al instante.' },
        { n: '03', icon: <Eye size={24} />, title: 'Seguimiento en línea', desc: 'Acceda con su cuenta para ver el estado, notificaciones y actuaciones de su expediente.' },
        { n: '04', icon: <Scale size={24} />, title: 'Resolución', desc: 'Reciba el laudo arbitral y descargue la documentación final desde su expediente electrónico.' },
    ];

    return (
        <section id="como-funciona" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-black text-[#291136] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ¿Cómo Funciona?
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto">Proceso simple y transparente en 4 pasos</p>
                </div>
                <div className="grid md:grid-cols-4 gap-6">
                    {pasos.map((p, i) => (
                        <div key={i} className="relative text-center">
                            {i < pasos.length - 1 && (
                                <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gray-200 z-0" />
                            )}
                            <div className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#291136] text-white mb-4">
                                {p.icon}
                            </div>
                            <div className="text-xs font-black text-[#BE0F4A] uppercase tracking-widest mb-2">{p.n}</div>
                            <h3 className="font-bold text-[#291136] mb-2 text-sm">{p.title}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function PorQueElegirnos() {
    const items = [
        { icon: <Shield size={22} />, title: 'Seguridad Total', desc: 'Cifrado de extremo a extremo. Solo las partes autorizadas acceden a su información.' },
        { icon: <Clock size={22} />,  title: 'Disponible 24/7', desc: 'Acceda desde cualquier dispositivo, en cualquier momento, sin instalaciones.' },
        { icon: <Bell size={22} />,   title: 'Notificaciones', desc: 'Alertas automáticas de cada movimiento, vencimiento y actualización de su expediente.' },
        { icon: <Headphones size={22} />, title: 'Soporte Especializado', desc: 'Equipo técnico y legal disponible para resolver cualquier consulta sobre el proceso.' },
    ];

    return (
        <section className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-black text-[#291136] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ¿Por qué elegirnos?
                    </h2>
                    <p className="text-gray-500 max-w-xl mx-auto">Tecnología al servicio del arbitraje moderno</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {items.map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#BE0F4A]/30 hover:shadow-md transition-all">
                            <div className="w-11 h-11 bg-[#BE0F4A]/10 rounded-xl flex items-center justify-center text-[#BE0F4A] mb-4">
                                {item.icon}
                            </div>
                            <h3 className="font-bold text-[#291136] mb-2 text-sm">{item.title}</h3>
                            <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Nosotros() {
    return (
        <section id="nosotros" className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#BE0F4A] mb-4 block">Sobre Nosotros</span>
                        <h2 className="text-4xl font-black text-[#291136] mb-6 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            The Ankawa<br />Global Group SAC
                        </h2>
                        <div className="w-16 h-1 bg-[#BE0F4A] mb-6"></div>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Somos un centro de arbitraje reconocido y registrado ante INDECOPI, comprometidos con la resolución eficiente y transparente de conflictos comerciales y civiles.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-8">
                            Nuestra plataforma digital combina la solidez jurídica con la eficiencia tecnológica, ofreciendo un proceso arbitral moderno, accesible y completamente digital.
                        </p>
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { value: '15+', label: 'Años de experiencia' },
                                { value: '50+', label: 'Árbitros certificados' },
                                { value: '98%', label: 'Satisfacción' },
                            ].map((s, i) => (
                                <div key={i} className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-2xl font-black text-[#BE0F4A]" style={{ fontFamily: 'Montserrat, sans-serif' }}>{s.value}</div>
                                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <div className="bg-gray-50 rounded-3xl p-16 border border-gray-200">
                            <img src="/logo.png" alt="Ankawa Global Group" className="w-72 h-auto" />
                            <p className="text-center text-xs text-gray-400 mt-6 font-semibold uppercase tracking-widest">CARD — ANKAWA INTL</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CTA() {
    return (
        <section className="py-20" style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 50%, #BE0F4A 100%)' }}>
            <div className="max-w-4xl mx-auto px-6 text-center">
                <img src="/logo-white.png" alt="Ankawa" className="h-16 w-auto mx-auto mb-8" />
                <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ¿Listo para comenzar?
                </h2>
                <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                    Presente su solicitud de arbitraje de forma digital, segura y en minutos.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/mesa-partes"
                        className="inline-flex items-center gap-2 bg-white text-[#291136] px-8 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                        Presentar Solicitud <ArrowRight size={18} />
                    </Link>
                    <Link href="/login"
                        className="inline-flex items-center gap-2 border-2 border-white/50 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition-colors">
                        Iniciar Sesión <Lock size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer id="contacto" className="bg-[#291136] text-white py-14">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-10 mb-10">
                    <div>
                        <img src="/logo-white.png" alt="Ankawa" className="h-12 w-auto mb-4" />
                        <p className="text-white/60 text-sm leading-relaxed">Centro de Arbitraje y Resolución de Disputas Ankawa Internacional — CARD ANKAWA INTL. Registrado ante INDECOPI.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Plataforma</h4>
                        <ul className="space-y-2">
                            <li><Link href="/mesa-partes" className="text-white/60 hover:text-white text-sm transition-colors">Mesa de Partes Virtual</Link></li>
                            <li><Link href="/login" className="text-white/60 hover:text-white text-sm transition-colors">Expediente Electrónico</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Empresa</h4>
                        <ul className="space-y-2">
                            <li><a href="#nosotros" className="text-white/60 hover:text-white text-sm transition-colors">Sobre Nosotros</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Términos y Condiciones</a></li>
                            <li><a href="#" className="text-white/60 hover:text-white text-sm transition-colors">Política de Privacidad</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-4 uppercase tracking-wider">Contacto</h4>
                        <ul className="space-y-3">
                            {[
                                { icon: <MapPin size={14} />, text: 'Cusco, Perú' },
                                { icon: <Phone size={14} />,  text: '+51 XXX XXX XXX' },
                                { icon: <Mail size={14} />,   text: 'contacto@ankawa.pe' },
                            ].map((c, i) => (
                                <li key={i} className="flex items-center gap-2 text-white/60 text-sm">
                                    <span className="text-[#BE0F4A]">{c.icon}</span>
                                    {c.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
                    © {new Date().getFullYear()} The Ankawa Global Group SAC. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}

export default function Welcome({ servicios = [] }) {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <Hero />
            <Servicios servicios={servicios} />
            <ComoFunciona />
            <PorQueElegirnos />
            <Nosotros />
            <CTA />
            <Footer />
        </div>
    );
}
