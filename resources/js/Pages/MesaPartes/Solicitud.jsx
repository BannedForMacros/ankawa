import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AnkawaToaster from '@/Components/AnkawaToaster';
import ArbitrajeForm           from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import ArbitrajeEmergenciaForm from '@/Pages/MesaPartes/Formularios/ArbitrajeEmergenciaForm';
import JPRDForm                from '@/Pages/MesaPartes/Formularios/JPRDForm';
import OtrosForm               from '@/Pages/MesaPartes/Formularios/OtrosForm';

const FORMS = {
    'arbitraje':            ArbitrajeForm,
    'arbitraje-emergencia': ArbitrajeEmergenciaForm,
    'jprd':                 JPRDForm,
};

export default function Solicitud({ servicio, portalEmail, portalUser, hcaptchaSiteKey }) {
    const Form = FORMS[servicio.slug] ?? OtrosForm;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title={`${servicio.nombre} — Mesa de Partes`} />
            <AnkawaToaster position="top-center" duration={5000} />

            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => router.get(route('mesa-partes.inicio'))}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#291136] transition-colors">
                        <ArrowLeft size={16}/> Mis expedientes
                    </button>
                    <span className="text-gray-200">·</span>
                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="Ankawa" className="h-6 object-contain" />
                        <span className="text-sm font-bold text-[#291136]">{servicio.nombre}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Encabezado de la solicitud — jerarquía y contexto */}
                <div className="border-l-4 border-[#BE0F4A] pl-4 mb-6">
                    <p className="text-[11px] font-bold text-[#BE0F4A] uppercase tracking-[0.18em] mb-1.5">
                        Mesa de Partes · Nueva Solicitud
                    </p>
                    <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase leading-none">
                        {servicio.nombre}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Complete los datos requeridos para presentar su solicitud.
                    </p>
                </div>

                <Form
                    servicio={servicio}
                    portalEmail={portalEmail}
                    portalUser={portalUser}
                    hcaptchaSiteKey={hcaptchaSiteKey}
                />
            </div>
        </div>
    );
}
