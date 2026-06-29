import { Head } from '@inertiajs/react';
import { FileText, ExternalLink } from 'lucide-react';
import SolicitudLayout         from '@/Pages/MesaPartes/SolicitudLayout';
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
        <SolicitudLayout servicio={servicio}>
            <Head title={`${servicio.nombre} — Mesa de Partes`} />

            {/* Info contextual para arbitraje de emergencia */}
            {servicio.slug === 'arbitraje-emergencia' && (
                <div className="mb-4 -mt-2">
                    <p className="text-sm text-gray-500">
                        Este servicio se presta de conformidad con lo regulado en la Directiva de Arbitraje de Emergencia del CARD ANKAWA INTL.
                    </p>
                    <a
                        href="https://www.ankawainternacional.org/wp-content/uploads/DIRECTIVA-ARBITRO-DE-EMERGENCIA-.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A] text-xs font-semibold hover:bg-[#BE0F4A]/15 transition-colors"
                    >
                        <FileText size={13} />
                        Directiva de Arbitraje de Emergencia (PDF)
                        <ExternalLink size={12} className="opacity-70" />
                    </a>
                </div>
            )}

            <Form
                servicio={servicio}
                portalEmail={portalEmail}
                portalUser={portalUser}
                hcaptchaSiteKey={hcaptchaSiteKey}
            />
        </SolicitudLayout>
    );
}

