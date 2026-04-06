import { useEffect, useState } from 'react';
import { CircleHelp, OctagonX, Info } from 'lucide-react';

const STYLES = `
@keyframes ankawa-modal-in {
  from { opacity: 0; transform: scale(0.88) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes ankawa-modal-out {
  from { opacity: 1; transform: scale(1) translateY(0); }
  to   { opacity: 0; transform: scale(0.88) translateY(12px); }
}
@keyframes ankawa-icon-pop {
  0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
  60%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
  80%  { transform: scale(0.92) rotate(-3deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes ankawa-icon-pulse {
  0%, 100% { box-shadow: 0 0 0 0px #BE0F4A40; }
  50%       { box-shadow: 0 0 0 10px #BE0F4A00; }
}
`;

const VARIANT_CONFIG = {
    warning: { Icon: CircleHelp, confirm: 'bg-[#BE0F4A] hover:bg-[#9c0a3b] shadow-[0_4px_14px_#BE0F4A40]' },
    danger:  { Icon: OctagonX,   confirm: 'bg-gradient-to-r from-[#BE0F4A] to-[#4A153D] hover:opacity-90 shadow-[0_4px_14px_#BE0F4A40]' },
    info:    { Icon: Info,        confirm: 'bg-[#291136] hover:bg-[#3d1a52] shadow-[0_4px_14px_#29113640]' },
};

export default function ConfirmModal({
    open,
    titulo,
    resumen,
    onConfirm,
    onCancel,
    confirmando = false,
    detalles = null,
    highlight = null,
    variant = 'warning',
}) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 280);
            return () => clearTimeout(t);
        }
    }, [open]);

    if (!mounted) return null;

    const { Icon, confirm: confirmCls } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.warning;

    const showDetalles = (detalles && detalles.length > 0) || highlight;

    return (
        <>
            <style>{STYLES}</style>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    transition: 'opacity 0.25s ease',
                    opacity: visible ? 1 : 0,
                }}
            >
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    style={{
                        animation: visible
                            ? 'ankawa-modal-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both'
                            : 'ankawa-modal-out 260ms ease both',
                    }}
                >
                    {/* Barra top */}
                    <div
                        className="h-1 w-full"
                        style={{ background: 'linear-gradient(90deg, transparent, #BE0F4A 40%, #4A153D 60%, transparent)' }}
                    />

                    {/* Zona icono */}
                    <div className="flex flex-col items-center pt-8 pb-4 px-6">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center bg-[#BE0F4A]/10 border-2 border-[#BE0F4A]/30"
                            style={{
                                animation: 'ankawa-icon-pop 450ms cubic-bezier(0.34,1.56,0.64,1) 120ms both, ankawa-icon-pulse 2s ease-in-out 600ms infinite',
                            }}
                        >
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #4A153D 0%, #291136 100%)' }}
                            >
                                <Icon size={26} className="text-white" />
                            </div>
                        </div>

                        {/* Título */}
                        <h3
                            className="mt-4 text-lg font-black text-[#291136] text-center tracking-tight"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            {titulo}
                        </h3>

                        {/* Mensaje */}
                        <p className="text-gray-500 text-sm leading-relaxed text-center mt-1.5">
                            {resumen}
                        </p>

                        {/* Detalles destacados */}
                        {showDetalles && (
                            <div className="mt-4 w-full rounded-xl bg-[#291136]/5 border border-[#291136]/10 p-4">
                                {highlight && !detalles && (
                                    <p className="text-[#BE0F4A] font-bold text-sm text-center">{highlight}</p>
                                )}
                                {detalles && detalles.map((d, i) => (
                                    <div key={i} className="flex items-center justify-between gap-2 py-1">
                                        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{d.label}</span>
                                        <span className="text-[#BE0F4A] font-bold text-sm text-right">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-center gap-3 px-6 pb-7 pt-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={confirmando}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#291136]/70 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={confirmando}
                            className={`px-7 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all flex items-center gap-2 ${confirmCls}`}
                        >
                            {confirmando && (
                                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            )}
                            {confirmando ? 'Procesando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
