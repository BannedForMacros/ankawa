import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
    show = false,
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    onConfirm,
    onCancel,
    processing = false,
}) {
    return (
        <Modal show={show} onClose={onCancel} maxWidth="sm">
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[#291136]">{title}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <SecondaryButton onClick={onCancel} disabled={processing}>
                        Cancelar
                    </SecondaryButton>
                    <DangerButton onClick={onConfirm} disabled={processing}>
                        {processing ? 'Procesando...' : confirmText}
                    </DangerButton>
                </div>
            </div>
        </Modal>
    );
}