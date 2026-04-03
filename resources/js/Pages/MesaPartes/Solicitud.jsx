import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ArbitrajeForm from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import JPRDForm      from '@/Pages/MesaPartes/Formularios/JPRDForm';
import OtrosForm     from '@/Pages/MesaPartes/Formularios/OtrosForm';

const FORMS = {
    arbitraje: ArbitrajeForm,
    jprd:      JPRDForm,
};

export default function Solicitud({ servicio, portalEmail, portalUser }) {
    const Form = FORMS[servicio.slug] ?? OtrosForm;

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Head title={`${servicio.nombre} — Mesa de Partes`} />

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
                <Form
                    servicio={servicio}
                    portalEmail={portalEmail}
                    portalUser={portalUser}
                />
            </div>
        </div>
    );
}
