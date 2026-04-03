import { AlertCircle } from 'lucide-react';

export default function ConfirmModal({ open, titulo, resumen, onConfirm, onCancel, confirmando = false }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                    <AlertCircle size={20} className="text-[#BE0F4A]" />
                    <h3 className="text-white font-bold">{titulo}</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed">{resumen}</p>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={confirmando}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={confirmando}
                        className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors"
                    >
                        {confirmando ? 'Enviando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
