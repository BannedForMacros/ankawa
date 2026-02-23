import React, { useState, useEffect, useRef } from 'react';
import { Link } from '@inertiajs/react';
import { 
    FileText, 
    FolderOpen, 
    Shield, 
    Zap, 
    CheckCircle, 
    Clock, 
    Download, 
    Bell, 
    Search, 
    Mail, 
    Eye, 
    Paperclip,
    BarChart3,
    Lock,
    Server,
    Headphones,
    ChevronDown,
    ArrowRight,
    Award,
    Users,
    TrendingUp,
    FileCheck,
    Calendar,
    MapPin,
    Phone
} from 'lucide-react';

export default function Welcome() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header con navegación */}
            <Header />

            {/* Hero Section */}
            <HeroSection />

            {/* Servicios Section */}
            <ServicesSection />

            {/* Características Section */}
            <FeaturesSection />

            {/* Proceso Section */}
            <ProcessSection />

            {/* Sobre Nosotros */}
            <AboutSection />

            {/* Testimonios */}
            <TestimonialsSection />

            {/* Estadísticas */}
            <StatsSection />

            {/* CTA Final */}
            <CTASection />

            {/* Footer */}
            <Footer />
        </div>
    );
}

// ==================== COMPONENTES DE UTILIDAD ====================

// Hook y Componente para la animación de números
function useOnScreen(ref) {
    const [isIntersecting, setIntersecting] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIntersecting(entry.isIntersecting)
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [ref]);
    return isIntersecting;
}

function AnimatedCounter({ end, suffix = "", duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const onScreen = useOnScreen(ref);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        if (onScreen && !hasAnimated) {
            let start = 0;
            const increment = end / (duration / 16); // 60fps frame time
            
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

    return (
        <span ref={ref} className="tabular-nums">
            {count}{suffix}
        </span>
    );
}

// ==================== COMPONENTES PRINCIPALES ====================

function Header() {
    return (
        <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md shadow-md">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center">
                        <img 
                            src="/logo.png" 
                            alt="Ankawa Internacional" 
                            className="h-16 w-auto"
                        />
                    </div>
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#servicios" className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors">
                            Servicios
                        </a>
                        <a href="#caracteristicas" className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors">
                            Características
                        </a>
                        <a href="#sobre-nosotros" className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors">
                            Sobre Nosotros
                        </a>
                        <a href="#contacto" className="text-[#291136] hover:text-[#BE0F4A] font-medium transition-colors">
                            Contacto
                        </a>
                        <Link
                            href="/login"
                            className="bg-[#BE0F4A] text-white px-6 py-2 rounded-lg hover:bg-[#BC1D35] transition-colors font-semibold shadow-lg hover:shadow-xl"
                        >
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    );
}

function HeroSection() {
    return (
        <section className="relative pt-20 min-h-screen flex items-center bg-gradient-to-br from-[#291136] via-[#4A153D] to-[#291136]">
            {/* Patrón de fondo decorativo */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23BE0F4A' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 w-full">
                <div className="text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8 border border-white/20">
                        <Award className="w-5 h-5 text-[#BE0F4A] mr-2" />
                        <span className="text-white text-sm font-medium">
                            Marca registrada ante INDECOPI ®
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Centro de Arbitraje
                        <br />
                        <span className="text-[#BE0F4A]">Ankawa Internacional</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Plataforma integral para la gestión de arbitrajes y expedientes electrónicos. 
                        Presente demandas, consulte expedientes y acceda a toda su documentación de manera 
                        segura, rápida y profesional.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Link
                            href="/register"
                            className="group relative px-8 py-4 bg-[#BE0F4A] text-white rounded-xl font-semibold text-lg shadow-2xl hover:bg-[#BC1D35] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(190,15,74,0.4)] flex items-center"
                        >
                            <span className="relative z-10">Comenzar Ahora</span>
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        
                        <a 
                            href="#servicios"
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300 flex items-center"
                        >
                            Conocer Más
                            <ChevronDown className="ml-2 w-5 h-5" />
                        </a>
                    </div>

                    {/* Stats Animados */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <StatItem 
                            icon={<FileCheck className="w-8 h-8" />}
                            value={50}
                            suffix="+" 
                            label="Casos Exitosos" 
                        />
                        <StatItem 
                            icon={<Clock className="w-8 h-8" />}
                            value={24}
                            suffix="/7" 
                            label="Disponibilidad" 
                        />
                        <StatItem 
                            icon={<TrendingUp className="w-8 h-8" />}
                            value={99}
                            suffix="%" 
                            label="Efectividad" 
                        />
                        <StatItem 
                            icon={<Users className="w-8 h-8" />}
                            value={50}
                            suffix="+" 
                            label="Clientes" 
                        />
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-8 h-8 text-white/50" />
            </div>
        </section>
    );
}

function ServicesSection() {
    return (
        <section id="servicios" className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Nuestros Servicios
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6"></div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Plataforma completa para la gestión de arbitrajes y expedientes electrónicos
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Mesa de Partes Card */}
                    <ServiceCard
                        title="Mesa de Partes Virtual"
                        description="Ingrese nuevos casos de arbitraje, presente contestaciones a demandas y gestione toda la documentación necesaria para sus procesos arbitrales de manera digital y eficiente."
                        gradient="from-[#BE0F4A] to-[#BC1D35]"
                        icon={<FileText className="w-32 h-32 text-white/80" strokeWidth={1.5} />}
                        features={[
                            { icon: <FileText className="w-5 h-5" />, text: "Presentación de nuevas demandas arbitrales" },
                            { icon: <FileCheck className="w-5 h-5" />, text: "Contestación de expedientes activos" },
                            { icon: <Paperclip className="w-5 h-5" />, text: "Adjuntar documentos de hasta 100MB" },
                            { icon: <Bell className="w-5 h-5" />, text: "Notificaciones automáticas de estado" },
                            { icon: <BarChart3 className="w-5 h-5" />, text: "Seguimiento en tiempo real" },
                        ]}
                        linkTo="/mesa-partes"
                        buttonText="Acceder al Servicio"
                    />

                    {/* Expediente Electrónico Card */}
                    <ServiceCard
                        title="Expediente Electrónico"
                        description="Consulte el estado actualizado de todos sus expedientes, revise la documentación presentada y acceda al historial completo de cada caso desde cualquier dispositivo."
                        gradient="from-[#4A153D] to-[#B23241]"
                        icon={<FolderOpen className="w-32 h-32 text-white/80" strokeWidth={1.5} />}
                        features={[
                            { icon: <Eye className="w-5 h-5" />, text: "Visualización de expedientes activos" },
                            { icon: <Download className="w-5 h-5" />, text: "Descarga de documentos en formato PDF" },
                            { icon: <Clock className="w-5 h-5" />, text: "Historial completo de actuaciones" },
                            { icon: <Search className="w-5 h-5" />, text: "Búsqueda avanzada por criterios" },
                            { icon: <Mail className="w-5 h-5" />, text: "Alertas por email de movimientos" },
                        ]}
                        linkTo="/expedientes"
                        buttonText="Ver Expedientes"
                    />
                </div>
            </div>
        </section>
    );
}

function ServiceCard({ title, description, gradient, icon, features, linkTo, buttonText }) {
    return (
        <div className="group bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2">
            <div className={`relative h-64 bg-gradient-to-br ${gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    {icon}
                </div>
                {/* Decorative Corners */}
                <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-white/30 rounded-tr-2xl"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-white/30 rounded-bl-2xl"></div>
            </div>

            <div className="p-8">
                <h3 className="text-3xl font-bold text-[#291136] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {title}
                </h3>
                
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {description}
                </p>

                <div className="space-y-4 mb-8">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start text-gray-700 group/item">
                            <div className="flex-shrink-0 w-10 h-10 bg-[#BE0F4A]/10 rounded-lg flex items-center justify-center text-[#BE0F4A] mr-3 group-hover/item:bg-[#BE0F4A] group-hover/item:text-white transition-colors">
                                {feature.icon}
                            </div>
                            <span className="pt-2">{feature.text}</span>
                        </div>
                    ))}
                </div>

                <Link
                    href={linkTo}
                    className={`flex items-center justify-center w-full bg-gradient-to-r ${gradient} text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl group/button`}
                >
                    {buttonText}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/button:translate-x-1 transition-transform" />
                </Link>
            </div>
        </div>
    );
}

function FeaturesSection() {
    return (
        <section id="caracteristicas" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        ¿Por qué elegirnos?
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6"></div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Tecnología de punta al servicio del arbitraje moderno
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <BenefitCard
                        icon={<Shield className="w-12 h-12" />}
                        title="Seguridad Total"
                        description="Cifrado de extremo a extremo y cumplimiento estricto de normativas de protección de datos personales y confidencialidad."
                    />
                    <BenefitCard
                        icon={<Zap className="w-12 h-12" />}
                        title="Acceso Inmediato"
                        description="Disponible 24/7 desde cualquier dispositivo con conexión a internet. Sin instalaciones ni configuraciones complejas."
                    />
                    <BenefitCard
                        icon={<Server className="w-12 h-12" />}
                        title="Respaldo Garantizado"
                        description="Copias de seguridad automáticas diarias y recuperación ante desastres. Sus datos siempre protegidos."
                    />
                    <BenefitCard
                        icon={<Headphones className="w-12 h-12" />}
                        title="Soporte Técnico"
                        description="Equipo especializado disponible para resolver cualquier inconveniente técnico o consulta sobre el sistema."
                    />
                </div>

                {/* Características adicionales en grid */}
                <div className="mt-16 grid md:grid-cols-3 gap-8">
                    <FeatureHighlight
                        icon={<Lock className="w-8 h-8" />}
                        title="Confidencialidad Absoluta"
                        description="Control de acceso por roles y permisos. Solo las partes autorizadas pueden ver la información de cada expediente."
                    />
                    <FeatureHighlight
                        icon={<CheckCircle className="w-8 h-8" />}
                        title="Firma Digital"
                        description="Documentos con validez legal mediante firma electrónica certificada conforme a la normativa vigente."
                    />
                    <FeatureHighlight
                        icon={<Calendar className="w-8 h-8" />}
                        title="Gestión de Plazos"
                        description="Alertas automáticas de vencimientos y recordatorios para no perder ninguna fecha importante del proceso."
                    />
                </div>
            </div>
        </section>
    );
}

function BenefitCard({ icon, title, description }) {
    return (
        <div className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 hover:border-[#BE0F4A] transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-[#291136] mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function FeatureHighlight({ icon, title, description }) {
    return (
        <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div className="flex-shrink-0 w-12 h-12 bg-[#BE0F4A] rounded-lg flex items-center justify-center text-white">
                {icon}
            </div>
            <div>
                <h4 className="font-bold text-[#291136] mb-2">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    );
}

function ProcessSection() {
    return (
        <section className="py-24 bg-gradient-to-br from-[#291136] to-[#4A153D]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Cómo Funciona
                    </h2>
                    <div className="w-24 h-1 bg-[#BE0F4A] mx-auto mb-6"></div>
                    <p className="text-xl text-white/80 max-w-2xl mx-auto">
                        Proceso simple y eficiente en 4 pasos
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <ProcessStep
                        number="01"
                        icon={<Users className="w-12 h-12" />}
                        title="Regístrese"
                        description="Cree su cuenta en minutos con sus datos básicos. Proceso simple y guiado."
                    />
                    <ProcessStep
                        number="02"
                        icon={<FileText className="w-12 h-12" />}
                        title="Presente su Caso"
                        description="Suba su demanda o contestación con toda la documentación necesaria de forma segura."
                    />
                    <ProcessStep
                        number="03"
                        icon={<BarChart3 className="w-12 h-12" />}
                        title="Seguimiento"
                        description="Monitoree el estado en tiempo real desde su panel personalizado con notificaciones."
                    />
                    <ProcessStep
                        number="04"
                        icon={<CheckCircle className="w-12 h-12" />}
                        title="Resolución"
                        description="Reciba notificaciones inmediatas y acceda a toda la documentación final del caso."
                    />
                </div>
            </div>
        </section>
    );
}

function ProcessStep({ number, icon, title, description }) {
    return (
        <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 group">
            <div className="absolute -top-6 left-8 w-12 h-12 bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xl">
                {number}
            </div>
            
            <div className="mt-6 mb-4 text-[#BE0F4A] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {title}
            </h3>
            <p className="text-white/70 leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function AboutSection() {
    return (
        <section id="sobre-nosotros" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-5xl font-bold text-[#291136] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            The Ankawa Global Group SAC
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mb-8"></div>
                        
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Somos un centro de arbitraje reconocido y registrado ante INDECOPI, 
                            comprometidos con la resolución eficiente y transparente de conflictos 
                            comerciales y civiles mediante procesos arbitrales modernos.
                        </p>

                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Nuestra plataforma digital representa la evolución natural del arbitraje 
                            tradicional, combinando la solidez jurídica con la eficiencia tecnológica 
                            para brindar un servicio de excelencia a nuestros usuarios.
                        </p>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-[#BE0F4A]/10 rounded-lg flex items-center justify-center">
                                    <Award className="w-6 h-6 text-[#BE0F4A]" />
                                </div>
                                <div>
                                    <div className="font-bold text-2xl text-[#291136]">15+</div>
                                    <div className="text-sm text-gray-600">Años de experiencia</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-[#BE0F4A]/10 rounded-lg flex items-center justify-center">
                                    <Users className="w-6 h-6 text-[#BE0F4A]" />
                                </div>
                                <div>
                                    <div className="font-bold text-2xl text-[#291136]">50+</div>
                                    <div className="text-sm text-gray-600">Árbitros certificados</div>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/register"
                            className="inline-flex items-center bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        >
                            Únase a Nosotros
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#BE0F4A]/20 to-[#BC1D35]/20 rounded-3xl transform rotate-3"></div>
                        <img 
                            src="/logo.png" 
                            alt="Ankawa Internacional" 
                            className="relative rounded-3xl shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function TestimonialsSection() {
    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#291136] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Lo que dicen nuestros clientes
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto"></div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <TestimonialCard
                        quote="La plataforma es increíblemente intuitiva. Pude presentar mi caso en minutos y el seguimiento en tiempo real me dio mucha tranquilidad."
                        author="María González"
                        position="Directora Legal, Empresa Constructora"
                    />
                    <TestimonialCard
                        quote="Excelente servicio. La seguridad de la información y la rapidez en las notificaciones superaron mis expectativas."
                        author="Carlos Ramírez"
                        position="Gerente General, Importadora"
                    />
                    <TestimonialCard
                        quote="Finalmente un sistema moderno para arbitraje. La digitalización de expedientes nos ahorra tiempo y recursos significativos."
                        author="Ana Martínez"
                        position="Abogada Independiente"
                    />
                </div>
            </div>
        </section>
    );
}

function TestimonialCard({ quote, author, position }) {
    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center mb-6">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                ))}
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed italic">
                "{quote}"
            </p>
            <div className="border-t border-gray-200 pt-4">
                <div className="font-bold text-[#291136]">{author}</div>
                <div className="text-sm text-gray-500">{position}</div>
            </div>
        </div>
    );
}

function StatsSection() {
    return (
        <section className="py-24 bg-gradient-to-r from-[#291136] to-[#4A153D]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                    <StatItem
                        icon={<FileCheck className="w-12 h-12" />}
                        value={50}
                        suffix="+"
                        label="Casos Exitosos"
                    />
                    <StatItem
                        icon={<Users className="w-12 h-12" />}
                        value={50}
                        suffix="+"
                        label="Clientes"
                    />
                    <StatItem
                        icon={<TrendingUp className="w-12 h-12" />}
                        value={98}
                        suffix="%"
                        label="Satisfacción del Cliente"
                    />
                    <StatItem
                        icon={<Award className="w-12 h-12" />}
                        value={15}
                        suffix="+"
                        label="Años de Experiencia"
                    />
                </div>
            </div>
        </section>
    );
}

function StatItem({ icon, value, suffix, label }) {
    return (
        <div className="text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 text-[#BE0F4A] mx-auto">
                {icon}
            </div>
            <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                <AnimatedCounter end={value} suffix={suffix} />
            </div>
            <div className="text-white/70 text-lg">{label}</div>
        </div>
    );
}

function CTASection() {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-5xl font-bold text-[#291136] mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ¿Listo para comenzar?
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Únase a cientos de usuarios que ya confían en nuestra plataforma para 
                    la gestión de sus procesos arbitrales
                </p>
                <Link
                    href="/register"
                    className="inline-flex items-center bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                    Crear Cuenta Gratuita
                    <ArrowRight className="ml-3 w-6 h-6" />
                </Link>
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer id="contacto" className="bg-[#291136] text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div>
                        <img 
                            src="/logo.png" 
                            alt="Ankawa Internacional" 
                            className="h-16 w-auto mb-6"
                        />
                        <p className="text-white/70 mb-4">
                            Centro de Arbitraje registrado ante INDECOPI
                        </p>
                        <div className="flex items-center text-white/70 mb-2">
                            <Award className="w-5 h-5 mr-2 text-[#BE0F4A]" />
                            <span className="text-sm">Marca Registrada ®</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-4">Servicios</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Mesa de Partes Virtual
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Expediente Electrónico
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Consultas
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-4">Empresa</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#sobre-nosotros" className="text-white/70 hover:text-white transition-colors">
                                    Sobre Nosotros
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Términos y Condiciones
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-white/70 hover:text-white transition-colors">
                                    Política de Privacidad
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-4">Contacto</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start text-white/70">
                                <MapPin className="w-5 h-5 mr-2 flex-shrink-0 text-[#BE0F4A]" />
                                <span className="text-sm">Lima, Perú</span>
                            </li>
                            <li className="flex items-center text-white/70">
                                <Phone className="w-5 h-5 mr-2 text-[#BE0F4A]" />
                                <span className="text-sm">+51 XXX XXX XXX</span>
                            </li>
                            <li className="flex items-center text-white/70">
                                <Mail className="w-5 h-5 mr-2 text-[#BE0F4A]" />
                                <span className="text-sm">contacto@ankawa.pe</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 text-center text-white/70">
                    <p>&copy; {new Date().getFullYear()} The Ankawa Global Group SAC. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}