import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, AlertTriangle, XCircle, Bell } from 'lucide-react';
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

export default function AccionesSecretariaAdjunta({ expediente }) {

    const [modal, setModal]           = useState(null);
    const [form, setForm]             = useState({});
    const [procesando, setProcesando] = useState(false);

    const solicitud = expediente.solicitud;
    const estado    = expediente.estado;

    const enviar = (url, data) => {
        setProcesando(true);
        router.post(url, data, {
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                setModal(null);
                setForm({});
            },
            onError: (errs) => toast.error(errs.general ?? 'Error al procesar.'),
            onFinish: () => setProcesando(false),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[#291136] text-sm">Acciones — Secretaría Adjunta</h3>
            </div>
            <div className="p-4 space-y-2">

                {/* Admitir — solo si está en estado admitido (recién creado sin secretario) */}
                {estado === 'admitido' && (
                    <button onClick={() => { setModal('notificar'); setForm({}); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <Bell size={16} />
                        Notificar al Demandado
                    </button>
                )}

                {/* Subsanar — siempre disponible si no está cerrado */}
                {!['cerrado','archivado'].includes(estado) && (
                    <button onClick={() => { setModal('subsanar'); setForm({ plazo_dias: 5 }); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors">
                        <AlertTriangle size={16} />
                        Solicitar Subsanación
                    </button>
                )}

                {/* Sin acciones */}
                {['cerrado','archivado'].includes(estado) && (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                        Expediente cerrado. Sin acciones disponibles.
                    </p>
                )}
            </div>

            {/* Modal Notificar Demandado */}
            <Modal open={modal === 'notificar'} onClose={() => setModal(null)} title="Notificar al Demandado">
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        El demandado tendrá <strong>5 días hábiles</strong> para apersonarse al proceso.
                    </div>
                    <textarea rows={3}
                        placeholder="Mensaje adicional (opcional)..."
                        value={form.mensaje_adicional ?? ''}
                        onChange={e => setForm({ ...form, mensaje_adicional: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setModal(null)}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={() => enviar(route('expedientes.notificarDemandado', expediente.id), form)}
                            disabled={procesando}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {procesando ? 'Enviando...' : 'Notificar'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Subsanación */}
            <Modal open={modal === 'subsanar'} onClose={() => setModal(null)} title="Solicitar Subsanación">
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                        El expediente quedará <strong>bloqueado</strong> hasta que el demandante subsane.
                    </div>
                    <textarea rows={4} required
                        placeholder="Detalle qué debe corregir el demandante..."
                        value={form.observacion ?? ''}
                        onChange={e => setForm({ ...form, observacion: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-[#291136]">Plazo (días):</label>
                        <input type="number" min={1} max={30}
                            value={form.plazo_dias ?? 5}
                            onChange={e => setForm({ ...form, plazo_dias: parseInt(e.target.value) })}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setModal(null)}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={() => enviar(route('expedientes.observar', expediente.solicitud.id), form)}
                            disabled={procesando || !form.observacion}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
                            {procesando ? 'Enviando...' : 'Enviar Observación'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}