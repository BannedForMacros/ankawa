import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Scale, UserPlus } from 'lucide-react';
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

export default function AccionesDirector({ expediente, arbitrosDisponibles }) {

    const [modal, setModal]           = useState(null);
    const [form, setForm]             = useState({});
    const [procesando, setProcesando] = useState(false);

    const arbitrosAsignados = expediente.arbitros ?? [];

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
                <h3 className="font-bold text-[#291136] text-sm">Acciones — Director</h3>
            </div>
            <div className="p-4 space-y-2">

                <button onClick={() => { setModal('designar'); setForm({ tipo_designacion: 'unico' }); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#BE0F4A] bg-[#BE0F4A]/10 hover:bg-[#BE0F4A]/20 transition-colors">
                    <Scale size={16} />
                    Designar Árbitro
                </button>

                {/* Árbitros ya asignados */}
                {arbitrosAsignados.length > 0 && (
                    <div className="mt-2 space-y-2">
                        {arbitrosAsignados.map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                                <div>
                                    <div className="text-sm font-semibold text-gray-800">{a.nombre_arbitro}</div>
                                    <div className="text-xs text-gray-400 capitalize">{a.tipo_designacion}</div>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                    ${a.estado_aceptacion === 'aceptado'  ? 'bg-green-100 text-green-700'  : ''}
                                    ${a.estado_aceptacion === 'pendiente' ? 'bg-yellow-100 text-yellow-700': ''}
                                    ${a.estado_aceptacion === 'rechazado' ? 'bg-red-100 text-red-700'      : ''}
                                `}>
                                    {a.estado_aceptacion}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Designar Árbitro */}
            <Modal open={modal === 'designar'} onClose={() => setModal(null)} title="Designar Árbitro">
                <div className="space-y-4">
                    {/* Tipo de tribunal */}
                    <div>
                        <label className="block text-sm font-semibold text-[#291136] mb-2">
                            Tipo de designación
                        </label>
                        <select value={form.tipo_designacion ?? 'unico'}
                            onChange={e => setForm({ ...form, tipo_designacion: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]">
                            <option value="unico">Árbitro Único</option>
                            <option value="presidente">Presidente del Tribunal</option>
                            <option value="coarbitro">Co-árbitro</option>
                        </select>
                    </div>

                    {/* Árbitro pre-registrado o externo */}
                    <div>
                        <label className="block text-sm font-semibold text-[#291136] mb-2">
                            Árbitro registrado en el sistema
                        </label>
                        <select value={form.usuario_id ?? ''}
                            onChange={e => {
                                const arbitro = arbitrosDisponibles.find(a => a.id == e.target.value);
                                setForm({
                                    ...form,
                                    usuario_id:      e.target.value,
                                    nombre_arbitro:  arbitro?.name ?? '',
                                    email_arbitro:   arbitro?.email ?? '',
                                });
                            }}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]">
                            <option value="">Seleccionar o ingresar externo...</option>
                            {arbitrosDisponibles?.map(a => (
                                <option key={a.id} value={a.id}>{a.name} — {a.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* Si no está en el sistema, ingresar manualmente */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Nombre (si es externo)
                            </label>
                            <input type="text"
                                value={form.nombre_arbitro ?? ''}
                                onChange={e => setForm({ ...form, nombre_arbitro: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                                placeholder="Nombre completo" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                                Correo
                            </label>
                            <input type="email"
                                value={form.email_arbitro ?? ''}
                                onChange={e => setForm({ ...form, email_arbitro: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                                placeholder="correo@ejemplo.com" />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <button onClick={() => setModal(null)}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button onClick={() => enviar(route('expedientes.designarArbitro', expediente.id), form)}
                            disabled={procesando || !form.nombre_arbitro || !form.email_arbitro}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] disabled:opacity-50">
                            {procesando ? 'Designando...' : 'Designar Árbitro'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}