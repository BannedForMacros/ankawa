import React from 'react';

/**
 * Ilustración esquemática de un DNI peruano para el panel de ayuda del
 * dígito verificador. Reemplaza a public/images/servicios/digito.png:
 * al ser SVG inline se puede animar por capas — el badge verde con el
 * dígito hace 2 pulsos (anillo expansivo) cada vez que se abre el panel.
 *
 * @param {boolean} pulso  dispara los 2 pulsos del anillo (al expandir el panel)
 */
export default function DniEjemploSvg({ pulso = false, className = '' }) {
    return (
        <svg
            viewBox="0 0 320 200"
            role="img"
            aria-label="Ejemplo de DNI peruano: el dígito verificador es el número resaltado en verde junto al número de DNI"
            className={className}
        >
            {/* Tarjeta */}
            <rect x="8" y="14" width="304" height="176" rx="12" fill="#B9D7E6" />
            <rect x="8" y="14" width="304" height="176" rx="12" fill="none" stroke="#8FB8CD" strokeWidth="1.5" />

            {/* Encabezado */}
            <text x="24" y="40" fontSize="12" fontWeight="800" fill="#2E6079">REPÚBLICA</text>
            <text x="24" y="54" fontSize="12" fontWeight="800" fill="#2E6079">DEL PERÚ</text>
            <text x="100" y="38" fontSize="7" fontWeight="700" fill="#2E6079">DOCUMENTO NACIONAL</text>
            <text x="100" y="47" fontSize="7" fontWeight="700" fill="#2E6079">DE IDENTIDAD</text>

            {/* Número de DNI */}
            <text x="202" y="42" fontSize="9" fontWeight="700" fill="#2E6079">DNI</text>
            <text x="222" y="42" fontSize="10" fontWeight="800" fill="#BE0F4A">47654321</text>

            {/* Badge del dígito verificador — la capa animable */}
            <g>
                {pulso && (
                    <circle
                        key="anillo"
                        cx="291"
                        cy="38"
                        r="17"
                        fill="none"
                        stroke="#059669"
                        strokeWidth="2.5"
                        className="motion-safe:animate-pulse-ring-twice"
                        style={{ transformOrigin: '291px 38px' }}
                    />
                )}
                <circle cx="291" cy="38" r="15" fill="#FFFFFF" stroke="#059669" strokeWidth="3" />
                <text x="291" y="44" fontSize="15" fontWeight="800" fill="#059669" textAnchor="middle">-2</text>
            </g>

            {/* Foto (silueta) */}
            <rect x="24" y="72" width="62" height="72" rx="6" fill="#FFFFFF" />
            <circle cx="55" cy="96" r="12" fill="#2E6079" />
            <path d="M 35 144 Q 35 116 55 116 Q 75 116 75 144 Z" fill="#2E6079" />

            {/* Líneas de datos */}
            <rect x="100" y="76" width="118" height="8" rx="4" fill="#8FB8CD" />
            <rect x="100" y="92" width="94" height="8" rx="4" fill="#9FC4D6" />
            <rect x="100" y="108" width="106" height="8" rx="4" fill="#9FC4D6" />
            <rect x="100" y="124" width="82" height="8" rx="4" fill="#9FC4D6" />

            {/* Recuadro secundario (firma / datos) */}
            <rect x="232" y="72" width="64" height="44" rx="5" fill="#FFFFFF" opacity="0.85" />
            <rect x="238" y="80" width="52" height="5" rx="2.5" fill="#8FB8CD" />
            <rect x="238" y="90" width="42" height="5" rx="2.5" fill="#9FC4D6" />
            <rect x="238" y="100" width="48" height="5" rx="2.5" fill="#9FC4D6" />
            <rect x="272" y="122" width="24" height="20" rx="3" fill="#2E6079" opacity="0.75" />

            {/* Franja de chevrones (zona de lectura mecánica) */}
            {[0, 1].map((fila) => (
                <g key={fila} fill="none" stroke="#7FAEC4" strokeWidth="3" strokeLinecap="round">
                    {Array.from({ length: 10 }, (_, i) => {
                        const x = 26 + i * 27;
                        const y = 158 + fila * 16;
                        return <path key={i} d={`M ${x + 8} ${y} L ${x} ${y + 5} L ${x + 8} ${y + 10}`} />;
                    })}
                </g>
            ))}
        </svg>
    );
}
