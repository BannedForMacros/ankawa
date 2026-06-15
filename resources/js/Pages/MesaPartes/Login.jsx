import OtpLoginFlow from '@/Components/OtpLoginFlow';

export default function MesaPartesLogin({ hcaptchaSiteKey }) {
    return (
        <OtpLoginFlow
            hcaptchaSiteKey={hcaptchaSiteKey}
            headTitle="Mesa de Partes — Ankawa Center"
            titulo="Mesa de Partes"
            subtitulo="Verifique su identidad para iniciar sesión."
            enviarRoute="mesa-partes.enviarCodigo"
            verificarRoute="mesa-partes.verificarCodigo"
            redirectFallback="mesa-partes.inicio"
            overlayEnvio
        />
    );
}
