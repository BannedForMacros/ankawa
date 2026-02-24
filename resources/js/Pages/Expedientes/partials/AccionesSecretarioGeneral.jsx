import { useState } from 'react';
import { router } from '@inertiajs/react';
import { UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-[#291136] px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold">{title}</h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white text-xl">&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function AccionesSecretarioGeneral({ expediente, arbitrosDisponibles }) {

    const [modal, setModal]           = useState(null);
    const [form, setForm]             = useState({});
    const [procesando, setProcesando] = useState(false);

    const yaTieneSecretario = expediente.usuarios?.some(
        u => u.rol_en_expediente === 'secretario_arb' && u.activo
    );

    const enviar = (url, data) => {
        setProcesando(true);
        router.post(url, data, {
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                setModal(null);
                setForm({});
            },
            onError: (errs) => toast.error(errs.general ?? 'Error.'),
            onFinish: () => setProcesando(false),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[#291136] text-sm">Acciones — Secretario General</h3>
            </div>
            <div className="p-4 space-y-2">
                <button onClick={() => { setModal('asignar'); setForm({}); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                    <UserCheck size={16} />
                    {yaTieneSecretario ? 'Reasignar Secretario Arbitral' : 'Asignar Secretario Arbitral'}
                </button>

                {yaTieneSecretario && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                        Secretario actual: <strong>
                            {expediente.usuarios.find(u => u.rol_en_expediente === 'secretario_arb')?.usuario?.name}
                        </strong>
                    </div>
                )}
            </div>

            <Modal open={modal === 'asignar'} onClose={() => setModal(null)} title="Asignar Secretario Arbitral">
                <div className="space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800">
                        El Secretario Arbitral gestionará el expediente desde la <strong>Orden Procesal N°1</strong>.
                    </div>
                    <select value={form.secretario_id ?? ''}
                        onChange={e => setForm({ ...form, secretario_id: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]">
                        <option value="">Seleccionar secretario...</option>
                        {arbitrosDisponibles?.map(u => (
                            <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                        ))}
                    </select>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setModal(null)}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={() => enviar(route('expedientes.asignarSecretario', expediente.id), form)}
                            disabled={procesando || !form.secretario_id}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                            {procesando ? 'Asignando...' : 'Asignar'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}