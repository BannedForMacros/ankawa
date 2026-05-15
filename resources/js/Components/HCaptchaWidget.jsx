import { useEffect, useRef, useState } from 'react';

/**
 * Widget hCaptcha reutilizable.
 * Si `siteKey` está vacío (modo dev), no renderiza nada y onToken('') queda.
 * Llama a onToken(token) cuando el usuario completa el desafío.
 *
 * Uso:
 *   <HCaptchaWidget siteKey={hcaptchaSiteKey} onToken={setCaptchaToken} />
 */
export default function HCaptchaWidget({ siteKey, onToken }) {
    const containerRef = useRef(null);
    const [widgetId, setWidgetId] = useState(null);

    useEffect(() => {
        if (!siteKey) return;
        if (window.hcaptcha) return;
        if (document.getElementById('hcaptcha-api-script')) return;

        const script = document.createElement('script');
        script.id = 'hcaptcha-api-script';
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, [siteKey]);

    useEffect(() => {
        if (!siteKey) return;
        if (widgetId !== null) return;

        const intervalo = setInterval(() => {
            if (window.hcaptcha && containerRef.current) {
                clearInterval(intervalo);
                const id = window.hcaptcha.render(containerRef.current, {
                    sitekey: siteKey,
                    callback: (token) => onToken?.(token),
                    'expired-callback': () => onToken?.(''),
                });
                setWidgetId(id);
            }
        }, 200);

        return () => clearInterval(intervalo);
    }, [siteKey, widgetId, onToken]);

    if (!siteKey) return null;

    return <div ref={containerRef} />;
}
