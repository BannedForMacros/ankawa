import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ArbitrajeForm from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import { ArrowLeft, Scale } from 'lucide-react';

export default function NuevaSolicitudAuth({ servicios }) {
    const [servicioSeleccionado, setServicioSeleccionado] = useState(null);

    // Renderizamos dinámicamente según el servicio (Igual que en lo público)
    const renderFormulario = () => {
        if (!servicioSeleccionado) return null;
        
        if (servicioSeleccionado.nombre.toLowerCase().includes('arbitraje')) {
            return <ArbitrajeForm servicio={servicioSeleccionado} />;
        }
        return <div className="p-10 text-center text-red-500">Formulario no encontrado para este servicio.</div>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Solicitud" />
            
            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header */}
                    <div className="mb-8">
                        <Link href={route('mesa-partes.mis-solicitudes')} 
                            className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#BE0F4A] mb-4 transition-colors">
                            <ArrowLeft size={16} className="mr-1" /> Volver a mis solicitudes
                        </Link>
                        <h1 className="text-3xl font-bold text-[#291136]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {servicioSeleccionado ? servicioSeleccionado.nombre : 'Nueva Solicitud'}
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            {servicioSeleccionado 
                                ? 'Complete el formulario para iniciar su proceso.' 
                                : 'Seleccione el tipo de trámite que desea iniciar.'}
                        </p>
                    </div>

                    {/* Paso 1: Elegir Servicio (Si no ha elegido) */}
                    {!servicioSeleccionado ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            {servicios.map((servicio) => (
                                <button key={servicio.id} onClick={() => setServicioSeleccionado(servicio)}
                                    className="bg-white border border-gray-200 rounded-2xl p-6 text-left hover:border-[#BE0F4A] hover:shadow-lg transition-all group">
                                    <div className="w-12 h-12 rounded-xl bg-[#BE0F4A]/10 text-[#BE0F4A] flex items-center justify-center mb-4 group-hover:bg-[#BE0F4A] group-hover:text-white transition-colors">
                                        <Scale size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-[#291136] mb-1">{servicio.nombre}</h3>
                                    <p className="text-sm text-gray-500">{servicio.descripcion}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Paso 2: Mostrar el Formulario Importado */
                        <div className="bg-transparent">
                            {renderFormulario()}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}