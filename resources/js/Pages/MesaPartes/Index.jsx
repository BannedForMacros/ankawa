import { useState } from 'react';
import { Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import AnimatedTabs from '@/Components/AnimatedTabs';
import TipoTramiteSelector from '@/Components/MesaPartes/TipoTramiteSelector';
import RequisitosArbitraje from '@/Components/MesaPartes/RequisitosArbitraje';
import RequisitosApersonamiento from '@/Components/MesaPartes/RequisitosApersonamiento';
import FormularioArbitraje from '@/Components/MesaPartes/FormularioArbitraje';
import FormularioApersonamiento from '@/Components/MesaPartes/FormularioApersonamiento';
import { FileText, Scale, Shield, CheckCircle, Zap, ChevronLeft, ArrowLeft } from 'lucide-react';

export default function MesaPartesIndex() {
    const [activeTab, setActiveTab] = useState('arbitraje');
    const [tipoTramite, setTipoTramite] = useState(null); // 'solicitud' o 'apersonamiento'
    const [showFormulario, setShowFormulario] = useState(false);

    const tabs = [
        { id: 'arbitraje', name: 'Servicio de Arbitraje', icon: Scale },
        { id: 'jrpd', name: 'JRPD (Próximamente)', icon: FileText },
    ];

    const resetFlow = () => {
        setTipoTramite(null);
        setShowFormulario(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        resetFlow();
    };

    const handleTipoTramiteSelect = (tipo) => {
        setTipoTramite(tipo);
        setShowFormulario(false);
    };

    const handleContinueToForm = () => {
        setShowFormulario(true);
    };

    const handleBackToRequisitos = () => {
        setShowFormulario(false);
    };

    const handleBackToSelector = () => {
        resetFlow();
    };

    return (
        <GuestLayout>
            <Head title="Mesa de Partes Virtual" />

            {/* Fondo decorativo sutil */}
            <div className="min-h-screen bg-gray-50/50 relative">
                {/* Header decorativo superior (opcional, para dar profundidad) */}
                <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-[#291136]/5 to-transparent -z-10" />

                <div className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header Principal */}
                        <div className="mb-12 text-center">
                            <span className="inline-block py-1 px-3 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A] text-sm font-semibold mb-4 border border-[#BE0F4A]/20">
                                Trámites Digitales
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-[#291136] mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Mesa de Partes Virtual
                            </h1>
                            {/* Línea decorativa de la marca */}
                            <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6 rounded-full"></div>
                            
                            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                                Gestione sus expedientes y presente solicitudes de forma 
                                <span className="font-semibold text-[#BE0F4A]"> segura, rápida y 100% digital</span>.
                            </p>
                        </div>

                        {/* Contenedor Principal */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
                             {/* Barra superior decorativa */}
                            <div className="h-2 w-full bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-[#291136]"></div>
                            
                            <div className="p-6 md:p-10">
                                {/* Componente de Tabs (Asegúrate que este componente acepte clases o use colores neutros que combinen) */}
                                <div className="mb-8">
                                    <AnimatedTabs
                                        tabs={tabs}
                                        activeTab={activeTab}
                                        onChange={handleTabChange}
                                    />
                                </div>

                                <div className="mt-8 min-h-[400px]">
                                    {activeTab === 'arbitraje' && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            {/* Selector de Tipo de Trámite */}
                                            {!tipoTramite && (
                                                <TipoTramiteSelector onSelect={handleTipoTramiteSelect} />
                                            )}

                                            {/* Flujo de Solicitud */}
                                            {tipoTramite === 'solicitud' && !showFormulario && (
                                                <div>
                                                    <BackButton onClick={handleBackToSelector} text="Volver a la selección" />
                                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                        <RequisitosArbitraje onContinue={handleContinueToForm} />
                                                    </div>
                                                </div>
                                            )}

                                            {tipoTramite === 'solicitud' && showFormulario && (
                                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                                    <FormularioArbitraje onBack={handleBackToRequisitos} />
                                                </div>
                                            )}

                                            {/* Flujo de Apersonamiento */}
                                            {tipoTramite === 'apersonamiento' && !showFormulario && (
                                                <div>
                                                    <BackButton onClick={handleBackToSelector} text="Volver a la selección" />
                                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                        <RequisitosApersonamiento onContinue={handleContinueToForm} />
                                                    </div>
                                                </div>
                                            )}

                                            {tipoTramite === 'apersonamiento' && showFormulario && (
                                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                                    <FormularioApersonamiento onBack={handleBackToRequisitos} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'jrpd' && (
                                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                                <FileText className="w-10 h-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#291136] mb-2">
                                                Próximamente
                                            </h3>
                                            <p className="text-gray-500 max-w-md">
                                                Estamos trabajando para integrar el servicio de JRPD a nuestra plataforma digital.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Info adicional - Tarjetas con estilo de marca */}
                        <div className="mt-12 grid md:grid-cols-3 gap-6">
                            <InfoCard 
                                icon={<Shield className="w-6 h-6" />}
                                title="Seguridad Garantizada"
                                description="Encriptación de nivel bancario para proteger toda su documentación sensible."
                            />
                            <InfoCard 
                                icon={<CheckCircle className="w-6 h-6" />}
                                title="Proceso Simplificado"
                                description="Interfaz intuitiva guiada paso a paso para completar trámites sin errores."
                            />
                            <InfoCard 
                                icon={<Zap className="w-6 h-6" />}
                                title="Respuesta Inmediata"
                                description="Notificaciones automáticas en tiempo real sobre el estado de su expediente."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}

// Subcomponente para el Botón de Volver
function BackButton({ onClick, text }) {
    return (
        <button
            onClick={onClick}
            className="group mb-6 flex items-center text-gray-500 hover:text-[#BE0F4A] transition-all duration-300 font-medium"
        >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-[#BE0F4A]/10 transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            </div>
            {text}
        </button>
    );
}

// Subcomponente para las Tarjetas de Información
function InfoCard({ icon, title, description }) {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#BE0F4A]/20 group">
            <div className="w-12 h-12 bg-[#BE0F4A]/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#BE0F4A] group-hover:scale-110 transition-all duration-300">
                <div className="text-[#BE0F4A] group-hover:text-white transition-colors">
                    {icon}
                </div>
            </div>
            <h3 className="text-lg font-bold text-[#291136] mb-2 font-montserrat">
                {title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-700">
                {description}
            </p>
        </div>
    );
}