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


            <Form
                servicio={servicio}
                portalEmail={portalEmail}
                portalUser={portalUser}
                hcaptchaSiteKey={hcaptchaSiteKey}
            />
        </SolicitudLayout>
    );
}

