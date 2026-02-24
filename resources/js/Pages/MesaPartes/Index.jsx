import { useState } from 'react';
import { Head } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import Formulario from '@/Pages/Solicitud/Formulario';
import { Shield, CheckCircle, Zap, ArrowLeft, Clock, FileText, ChevronRight } from 'lucide-react';

// ── Requisitos antes del formulario ──
function Requisitos({ servicio, onContinue }) {
    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[#291136]">{servicio.nombre}</h2>
                {servicio.descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{servicio.descripcion}</p>
                )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                    <FileText size={18} />
                    Requisitos para presentar su solicitud
                </h3>
                <ul className="space-y-3">
                    {[
                        'Documento de identidad vigente (DNI, CE o RUC según corresponda)',
                        'Convenio arbitral o clausula arbitral del contrato',
                        'Documentos que sustenten la controversia',
                        'Poder de representacion (si actua como representante legal)',
                        'Comprobante de pago de derechos de presentacion',
                    ].map((req, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-amber-800">
                            <ChevronRight size={15} className="text-amber-500 shrink-0 mt-0.5" />
                            {req}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="bg-[#291136]/5 rounded-xl p-4 mb-6 text-sm text-[#291136]/70 leading-relaxed">
                Al continuar, usted declara haber leido y comprendido los requisitos.
                Recibira un correo con el cargo de presentacion y credenciales de acceso.
            </div>

            <button
                onClick={onContinue}
                className="w-full flex items-center justify-center gap-2 bg-[#BE0F4A] hover:bg-[#BC1D35] text-white font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg"
            >
                He leido los requisitos, continuar
                <ChevronRight size={18} />
            </button>
        </div>
    );
}

// ── Tabs dinamicos ──
function ServiceTabs({ servicios, activeTab, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {servicios.map(servicio => (
                <button
                    key={servicio.id}
                    onClick={() => onChange(servicio.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                        ${activeTab === servicio.id
                            ? 'bg-[#BE0F4A] text-white shadow-lg shadow-[#BE0F4A]/30'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-[#291136]'
                        }`}
                >
                    {servicio.nombre}
                </button>
            ))}
        </div>
    );
}

// ── Boton volver ──
function BackButton({ onClick, text }) {
    return (
        <button
            onClick={onClick}
            className="group mb-6 flex items-center text-gray-500 hover:text-[#BE0F4A] transition-all duration-300 font-medium"
        >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-[#BE0F4A]/10 transition-colors">
                <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300" />
            </div>
            {text}
        </button>
    );
}

export default function Index({ servicios }) {

    const [activeTab, setActiveTab]           = useState(servicios[0]?.id ?? null);
    const [showFormulario, setShowFormulario] = useState(false);

    const servicioActivo = servicios.find(s => s.id === activeTab);

    const handleTabChange = (id) => {
        setActiveTab(id);
        setShowFormulario(false);
    };

    return (
        <GuestLayout>
            <Head title="Mesa de Partes Virtual" />

            <div className="min-h-screen bg-gray-50/50 relative">
                <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-[#291136]/5 to-transparent -z-10" />

                <div className="py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Header */}
                        <div className="mb-12 text-center">
                            <span className="inline-block py-1 px-3 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A] text-sm font-semibold mb-4 border border-[#BE0F4A]/20">
                                Tramites Digitales
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold text-[#291136] mb-4"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Mesa de Partes Virtual
                            </h1>
                            <div className="w-24 h-1 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] mx-auto mb-6 rounded-full"></div>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Gestione sus expedientes y presente solicitudes de forma
                                <span className="font-semibold text-[#BE0F4A]"> segura, rapida y 100% digital</span>.
                            </p>
                        </div>

                        {/* Contenedor principal */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="h-2 w-full bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-[#291136]"></div>

                            <div className="p-6 md:p-10">
                                {servicios.length > 0 ? (
                                    <>
                                        {/* Tabs */}
                                        <ServiceTabs
                                            servicios={servicios}
                                            activeTab={activeTab}
                                            onChange={handleTabChange}
                                        />

                                        <div className="mt-8 min-h-[400px]">
                                            {servicioActivo && (
                                                <>
                                                    {/* Paso 1 — Requisitos */}
                                                    {!showFormulario && (
                                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                                                <Requisitos
                                                                    servicio={servicioActivo}
                                                                    onContinue={() => setShowFormulario(true)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Paso 2 — Formulario multi-paso */}
                                                    {showFormulario && (
                                                        <div className="animate-in fade-in zoom-in-95 duration-300">
                                                            <BackButton
                                                                onClick={() => setShowFormulario(false)}
                                                                text="Volver a los requisitos"
                                                            />
                                                            {/*
                                                                Formulario vive en Solicitud/Formulario.jsx
                                                                Recibe el servicio seleccionado como prop
                                                            */}
                                                            <Formulario servicio={servicioActivo} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                                        <Clock size={40} className="mb-4 opacity-30" />
                                        <h3 className="text-xl font-bold text-[#291136] mb-2">Proximamente</h3>
                                        <p className="max-w-md text-sm">
                                            Estamos configurando los servicios disponibles. Vuelva pronto.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info cards */}
                        <div className="mt-12 grid md:grid-cols-3 gap-6">
                            {[
                                { icon: <Shield size={22} />,      title: 'Seguridad Garantizada', desc: 'Encriptacion de nivel bancario para proteger toda su documentacion sensible.'        },
                                { icon: <CheckCircle size={22} />, title: 'Proceso Simplificado',  desc: 'Interfaz intuitiva guiada paso a paso para completar tramites sin errores.'          },
                                { icon: <Zap size={22} />,         title: 'Respuesta Inmediata',   desc: 'Notificaciones automaticas en tiempo real sobre el estado de su expediente.'         },
                            ].map((c, i) => (
                                <div key={i}
                                    className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-[#BE0F4A]/20 group">
                                    <div className="w-12 h-12 bg-[#BE0F4A]/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#BE0F4A] group-hover:scale-110 transition-all duration-300">
                                        <div className="text-[#BE0F4A] group-hover:text-white transition-colors">{c.icon}</div>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#291136] mb-2">{c.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}