import { Clock, AlertTriangle } from 'lucide-react';

export default function PlazoUrgente({ mov }) {
    if (!mov?.fecha_limite) return null;

    const dias   = mov.dias_restantes;
    const sufijo = mov.tipo_dias === 'habiles' ? ' días hábiles' : ' días';

    let config;
    if (dias === null || dias === undefined) {
        config = { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', icon: Clock, msg: `Vence el ${mov.fecha_limite}` };
    } else if (dias <= 0) {
        config = { bg: 'bg-red-50 border-red-300', text: 'text-red-700', icon: AlertTriangle,
            msg: dias === 0 ? '⚠ Vence HOY' : `⚠ Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}` };
    } else if (dias <= 2) {
        config = { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-700', icon: AlertTriangle,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    } else if (dias <= 5) {
        config = { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', icon: Clock,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    } else {
        config = { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Clock,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    }

    const Icono = config.icon;
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${config.bg} ${config.text} ${dias !== null && dias <= 2 ? 'animate-pulse' : ''}`}>
            <Icono size={12} className="shrink-0"/>
            {config.msg}
        </div>
    );
}
