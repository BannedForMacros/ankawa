import { Zap } from 'lucide-react';
import Popover from '@/Components/Popover';

// Un chip de servicio: blanco con borde plum, marcador "Auto" si aplica.
function Chip({ nombre, esAuto }) {
    return (
        <span
            title={esAuto ? `${nombre} · se asigna automáticamente al crear el expediente` : nombre}
            className="inline-flex items-center gap-1.5 max-w-[12rem] text-xs font-medium text-[#291136]/80 bg-white border border-[#291136]/20 px-2.5 py-1 rounded-lg">
            <span className="truncate">{nombre}</span>
            {esAuto && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 shrink-0">
                    <Zap size={10} className="shrink-0" /> Auto
                </span>
            )}
        </span>
    );
}

/**
 * Lista de chips de servicio con patrón "+N more".
 * Muestra hasta `max` chips; el resto se agrupa en un botón "+N" que abre un
 * popover (hover/foco) con los servicios restantes. Mantiene la fila en una
 * sola línea (altura uniforme).
 *
 * @param {Array}  servicios - [{ id, nombre, pivot: { es_automatico } }]
 * @param {number} max       - máximo de chips visibles (default 3)
 */
export default function ServiceChips({ servicios = [], max = 3 }) {
    if (!servicios.length) return null;

    const visibles = servicios.slice(0, max);
    const resto    = servicios.slice(max);

    return (
        <div className="flex items-center gap-1.5 min-w-0">
            {visibles.map(s => (
                <Chip key={s.id} nombre={s.nombre} esAuto={s.pivot?.es_automatico} />
            ))}

            {resto.length > 0 && (
                <Popover
                    panelClassName="bg-white border border-gray-200 rounded-xl shadow-2xl p-2 max-w-xs"
                    trigger={(triggerProps) => (
                        <button
                            type="button"
                            {...triggerProps}
                            aria-label={`Ver ${resto.length} servicio${resto.length > 1 ? 's' : ''} más`}
                            className="inline-flex items-center shrink-0 text-xs font-semibold text-[#291136]/70 bg-[#291136]/[0.06] hover:bg-[#291136]/10 border border-[#291136]/15 px-2 py-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30">
                            +{resto.length}
                        </button>
                    )}
                >
                    <div className="flex flex-col gap-1.5">
                        {resto.map(s => (
                            <Chip key={s.id} nombre={s.nombre} esAuto={s.pivot?.es_automatico} />
                        ))}
                    </div>
                </Popover>
            )}
        </div>
    );
}
