import Modal from '@/Components/Modal';
import { CircleHelp, OctagonX, Info } from 'lucide-react';

const STYLES = `
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

export default function ConfirmDialog({
    show = false,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    onConfirm,
    onCancel,
    processing = false,
    detalles = null,
    highlight = null,
    variant = 'warning',
}) {
    const { Icon, confirm: confirmCls } = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.warning;
    const showDetalles = (detalles && detalles.length > 0) || highlight;

    return (
        <Modal show={show} onClose={onCancel} maxWidth="sm">
            <style>{STYLES}</style>

            {/* Barra top */}
            <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, transparent, #BE0F4A 40%, #4A153D 60%, transparent)' }}
            />

            <div className="flex flex-col items-center pt-8 pb-4 px-6">
                {/* Icono animado */}
                <div
                    className="w-20 h-20 rounded-full flex items-center justify-center bg-[#BE0F4A]/10 border-2 border-[#BE0F4A]/30"
                    style={{
                        animation: show
                            ? 'ankawa-icon-pop 450ms cubic-bezier(0.34,1.56,0.64,1) 180ms both, ankawa-icon-pulse 2s ease-in-out 700ms infinite'
                            : undefined,
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
                    {title}
                </h3>

                {/* Mensaje */}
                <p className="text-gray-500 text-sm leading-relaxed text-center mt-1.5">
                    {message}
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
                    disabled={processing}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#291136]/70 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={onConfirm}
                    disabled={processing}
                    className={`px-7 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all flex items-center gap-2 ${confirmCls}`}
                >
                    {processing && (
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    )}
                    {processing ? 'Procesando...' : confirmText}
                </button>
            </div>
        </Modal>
    );
}
