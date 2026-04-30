import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ArbitrajeForm           from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import ArbitrajeEmergenciaForm from '@/Pages/MesaPartes/Formularios/ArbitrajeEmergenciaForm';
import JPRDForm                from '@/Pages/MesaPartes/Formularios/JPRDForm';
import OtrosForm               from '@/Pages/MesaPartes/Formularios/OtrosForm';
import { Scale } from 'lucide-react';
import { useState } from 'react';

const FORMS = {
    'arbitraje':            ArbitrajeForm,
    'arbitraje-emergencia': ArbitrajeEmergenciaForm,
    'jprd':                 JPRDForm,
    'otros':                OtrosForm,
};

export default function NuevaSolicitudAuth({ servicios }) {
    const [servicioSeleccionado, setServicioSeleccionado] = useState(
        servicios.length === 1 ? servicios[0] : null
    );

    return (
        <AuthenticatedLayout>
            <Head title="Nueva Solicitud" />

            <PageHeader
                breadcrumb={[
                    { label: 'Inicio',           href: route('mesa-partes.inicio') },
                    { label: 'Mis Solicitudes',  href: route('mesa-partes.mis-solicitudes') },
                    { label: 'Nueva solicitud' },
                ]}
                title="Nueva"
                titleAccent="Solicitud"
                description={
                    servicioSeleccionado
                        ? `Estás iniciando una solicitud de ${servicioSeleccionado.nombre}. Completa el formulario con los datos requeridos.`
                        : 'Selecciona el tipo de trámite que deseas iniciar y completa el formulario correspondiente.'
                }
            />

            <div className="py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Selector de servicio */}
                    <div className="mb-6">
                        <label className="block font-mono text-[11px] uppercase tracking-widest text-[#291136]/55 mb-3">
                            Tipo de Servicio
                        </label>
                        <div className="flex gap-2.5 flex-wrap">
                            {servicios.map(s => {
                                const active = servicioSeleccionado?.id === s.id;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setServicioSeleccionado(s)}
                                        className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            active
                                                ? 'bg-[#BE0F4A] text-white shadow-md shadow-[#BE0F4A]/20'
                                                : 'bg-white text-[#291136]/75 border border-[#291136]/[0.10] hover:border-[#291136]/25 hover:bg-[#291136]/[0.025]'
                                        }`}
                                    >
                                        {s.nombre}
                                        {active && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#BE0F4A] shadow-sm" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Formulario según servicio */}
                    {!servicioSeleccionado ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#291136]/[0.08]">
                            <Scale size={48} className="mb-4 text-[#291136]/20" />
                            <p className="font-medium text-[#291136]/65">Selecciona el tipo de servicio para continuar</p>
                        </div>
                    ) : (() => {
                        const Form = FORMS[servicioSeleccionado.slug] ?? OtrosForm;
                        return <Form servicio={servicioSeleccionado} />;
                    })()}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
