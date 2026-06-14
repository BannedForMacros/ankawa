import OtpLoginFlow from '@/Components/OtpLoginFlow';

export default function PortalLogin({ hcaptchaSiteKey }) {
    return (
        <OtpLoginFlow
            hcaptchaSiteKey={hcaptchaSiteKey}
            headTitle="Portal Externo — Ankawa"
            titulo="Portal Externo"
            subtitulo="Verifique su identidad para acceder."
            enviarRoute="portal.enviar-codigo"
            verificarRoute="portal.verificar-codigo"
            redirectFallback="portal.expedientes"
        />
    );
}
