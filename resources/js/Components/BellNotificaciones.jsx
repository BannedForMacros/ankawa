/**
 * BellNotificaciones — campana del staff con dropdown y no leídas en vivo (Reverb).
 */
import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Bell, CheckCheck, Inbox } from 'lucide-react';
import useNotificaciones from '@/hooks/useNotificaciones';

function tiempoRelativo(iso) {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
}

const PUNTO_TIPO = {
    respuesta: 'bg-emerald-500',
    solicitud: 'bg-ankawa-rose',
    requerimiento: 'bg-amber-500',
    notificacion: 'bg-ankawa-deep',
};

export default function BellNotificaciones() {
    const { items, noLeidas, marcarLeida, marcarTodas } = useNotificaciones();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function onClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const abrirItem = (n) => {
        if (!n.leida) marcarLeida(n.id);
        if (n.url) { setOpen(false); router.visit(n.url); }
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                title="Notificaciones"
                aria-label="Notificaciones"
                onClick={() => setOpen((o) => !o)}
                className="relative w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#291136]/70 hover:bg-gray-100 hover:text-[#291136] transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30"
            >
                <Bell size={20} />
                {noLeidas > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[#BE0F4A] text-white text-[10px] font-bold ring-2 ring-white tabular-nums">
                        {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[92vw] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-[#291136]">Notificaciones</p>
                        {noLeidas > 0 && (
                            <button
                                onClick={marcarTodas}
                                className="flex items-center gap-1 text-xs font-semibold text-[#BE0F4A] hover:text-[#9C0A3B] transition-colors"
                            >
                                <CheckCheck size={14} /> Marcar todas
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-10 text-gray-400">
                                <Inbox size={28} strokeWidth={1.5} className="mb-2" />
                                <p className="text-sm">Sin notificaciones</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {items.map((n) => (
                                    <li key={n.id}>
                                        <button
                                            onClick={() => abrirItem(n)}
                                            className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${n.leida ? '' : 'bg-[#BE0F4A]/[0.035]'}`}
                                        >
                                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.leida ? 'bg-gray-200' : (PUNTO_TIPO[n.tipo] ?? 'bg-[#BE0F4A]')}`} />
                                            <span className="min-w-0 flex-1">
                                                <span className="block text-sm font-semibold text-[#291136] truncate">{n.titulo}</span>
                                                <span className="block text-xs text-gray-500 line-clamp-2">{n.mensaje}</span>
                                                <span className="block text-[11px] text-gray-400 mt-0.5">{tiempoRelativo(n.created_at)}</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
