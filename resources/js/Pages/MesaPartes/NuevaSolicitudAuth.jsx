import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ArbitrajeForm from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import OtrosForm from '@/Pages/MesaPartes/Formularios/OtrosForm';
import { Scale, Briefcase } from 'lucide-react';
import { useState } from 'react';

const iconoServicio = { Scale };

export default function NuevaSolicitudAuth({ servicios }) {
    const [servicioSeleccionado, setServicioSeleccionado] = useState(
        servicios.length === 1 ? servicios[0] : null
    );

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Solicitud" />

            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-[#BE0F4A]">
                        <Briefcase size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">
                            Nueva Solicitud
                        </h1>
                        <p className="text-sm text-gray-400 font-medium">
                            {servicioSeleccionado
                                ? servicioSeleccionado.nombre
                                : 'Seleccione el tipo de trámite'}
                        </p>
                    </div>
                </div>

                {/* Selector de servicio siempre visible arriba */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-[#291136] mb-3 uppercase tracking-widest opacity-60">
                        Tipo de Servicio
                    </label>
                    <div className="flex gap-3 flex-wrap">
                        {servicios.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setServicioSeleccionado(s)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all
                                    ${servicioSeleccionado?.id === s.id
                                        ? 'bg-[#291136] text-white border-[#291136] shadow-md'
                                        : 'bg-white text-[#291136]/60 border-gray-200 hover:border-[#291136]/40 hover:text-[#291136]'}`}
                            >
                                {s.nombre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Formulario según servicio */}
                {!servicioSeleccionado ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Scale size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">Selecciona el tipo de servicio para continuar</p>
                    </div>
                ) : servicioSeleccionado.nombre === 'Otros' ? (
                    <OtrosForm servicio={servicioSeleccionado} />
                ) : (
                    <ArbitrajeForm servicio={servicioSeleccionado} />
                )}

            </div>
        </AuthenticatedLayout>
    );
}
