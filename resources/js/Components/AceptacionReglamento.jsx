import { ShieldCheck, ChevronRight } from 'lucide-react';
import Checkbox from '@/Components/Checkbox';

/**
 * Bloque reutilizable de "Declaración y Aceptación" para los formularios
 * de Mesa de Partes (Arbitraje, Arbitraje de Emergencia, JPRD, Otros).
 *
 * Centraliza la mención a los reglamentos del CARD ANKAWA INTL y la
 * autorización del tratamiento de datos (Ley N° 29733). Cada formulario
 * puede insertar viñetas adicionales propias del trámite vía `bulletsExtra`.
 *
 * Props:
 *  - checked, onChange(boolean): control del checkbox
 *  - error: mensaje o flag de error
 *  - contexto: texto que completa "...aplicables al/a la {contexto}"
 *  - finalidad: texto que completa "...exclusivamente para los fines del presente {finalidad}"
 *  - bulletsExtra: array de nodos React insertados entre la viñeta del reglamento y la final
 */
export default function AceptacionReglamento({
    checked,
    onChange,
    error,
    contexto = 'al presente trámite',
    finalidad = 'trámite',
    bulletsExtra = [],
}) {
    const bullets = [
        <>Conozco y me someto a los <strong className="text-[#291136]">reglamentos del CARD ANKAWA INTL</strong> aplicables {contexto}.</>,
        ...bulletsExtra,
        <>Autorizo el tratamiento de los datos personales conforme a la <strong className="text-[#291136]">Ley N° 29733</strong> y al D.S. 003-2013-JUS, exclusivamente para los fines del presente {finalidad}.</>,
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <ShieldCheck size={16} className="text-[#BE0F4A]" />
                </div>
                <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Declaración y Aceptación</h2>
            </div>
            <div className="p-6">
                <div className={`rounded-xl p-5 transition-all ${
                    error
                        ? 'bg-red-50 border-2 border-red-400 ring-4 ring-red-100'
                        : checked
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-gray-50 border border-gray-200'
                }`}>
                    <Checkbox
                        checked={!!checked}
                        onChange={e => onChange(e.target.checked)}
                        required
                        error={error}
                        label="Declaro bajo juramento y acepto expresamente lo siguiente"
                    >
                        <ul className="mt-2 space-y-2 text-xs text-gray-600 leading-relaxed font-normal">
                            {bullets.map((b, i) => (
                                <li key={i} className="flex gap-2">
                                    <ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>
                                    <span>{b}</span>
                                </li>
                            ))}
                        </ul>
                    </Checkbox>
                </div>
            </div>
        </div>
    );
}
