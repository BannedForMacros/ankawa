import { useEffect, useState } from 'react';

/**
 * Overlay de carga con frases que avanzan, para el envío del código OTP del login
 * de Mesa de Partes (el correo se manda por SMTP síncrono y tarda unos segundos).
 *
 * Exclusivo de ese login — los formularios de solicitud ya usan AnkawaLoader.
 * Se activa vía el prop `overlayEnvio` de OtpLoginFlow (solo MesaPartes/Login lo pasa).
 *
 * Las frases avanzan cada ~1.8 s y se detienen en la última (si el envío demora,
 * se queda en "Casi listo…" en vez de reiniciar el ciclo).
 *
 * @param {boolean} visible
 */
const FRASES = [
    'Validando su información…',
    'Verificando su identidad ante RENIEC…',
    'Preparando el envío del código…',
    'Enviando el código a su correo…',
    'Casi listo, un momento…',
];

export default function LoginEnvioOverlay({ visible }) {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!visible) { setIdx(0); return; }
        setIdx(0);
        const t = setInterval(() => {
            setIdx(i => Math.min(i + 1, FRASES.length - 1)); // avanza y se queda en la última
        }, 1800);
        return () => clearInterval(t);
    }, [visible]);

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#291136]/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 px-6 text-center">
                {/* Logo con punto orbitando (mismo lenguaje visual que AnkawaLoader) */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                    <img src="/logo-white.png" alt="Ankawa" className="w-20 h-20 object-contain" />
                    <div className="absolute inset-0" style={{ animation: 'spin 1.4s linear infinite' }}>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#BE0F4A] shadow-lg shadow-[#BE0F4A]/50" />
                    </div>
                </div>

                {/* Frase actual (re-monta con key para re-animar en cada cambio) */}
                <div className="min-h-[1.5rem]">
                    <p
                        key={idx}
                        className="text-white text-sm sm:text-base font-semibold tracking-wide animate-pulse"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                        {FRASES[idx]}
                    </p>
                </div>

                {/* Progreso por pasos */}
                <div className="flex items-center gap-1.5">
                    {FRASES.map((_, i) => (
                        <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i <= idx ? 'w-6 bg-[#BE0F4A]' : 'w-3 bg-white/20'}`}
                        />
                    ))}
                </div>

                <p className="text-white/50 text-xs">Por favor, no cierre esta ventana.</p>
            </div>
        </div>
    );
}
