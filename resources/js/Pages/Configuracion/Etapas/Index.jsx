import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import toast from 'react-hot-toast';
import { Plus, GitBranch, Edit2, Trash2, Layers, ShieldAlert } from 'lucide-react';

export default function Index({ servicios = [], servicioActual, etapas = [] }) {
    const { flash } = usePage().props;
    const [servicioId, setServicioId] = useState(servicioActual ?? '');

    // ── Modal Etapa ──
    const [showModalEtapa, setShowModalEtapa] = useState(false);
    const [editandoEtapa, setEditandoEtapa] = useState(null);
    const formEtapa = useForm({ servicio_id: servicioId, nombre: '', descripcion: '', orden: '', activo: 1, requiere_conformidad: false });

    // ── Confirm ──
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);

    // ── Cambiar servicio ──
    function cambiarServicio(id) {
        setServicioId(id);
        if (id) {
            router.get(route('configuracion.etapas.index'), { servicio_id: id }, { preserveState: true });
        }
    }

    // ── Determinar si ya existe una etapa con requiere_conformidad en este servicio ──
    function yaExisteConformidad(excluirId = null) {
        return etapas.some(e => e.requiere_conformidad && e.activo && e.id !== excluirId);
    }

    // ── ETAPA CRUD ──
    function abrirCrearEtapa() {
        formEtapa.reset();
        formEtapa.setData('servicio_id', servicioId);
        setEditandoEtapa(null);
        setShowModalEtapa(true);
    }

    function abrirEditarEtapa(etapa) {
        formEtapa.setData({
            servicio_id:           etapa.servicio_id,
            nombre:                etapa.nombre,
            descripcion:           etapa.descripcion ?? '',
            orden:                 etapa.orden,
            activo:                etapa.activo,
            requiere_conformidad:  etapa.requiere_conformidad ?? false,
        });
        setEditandoEtapa(etapa);
        setShowModalEtapa(true);
    }

    function submitEtapa(e) {
        e.preventDefault();
        if (editandoEtapa) {
            formEtapa.put(route('configuracion.etapas.update', editandoEtapa.id), {
                preserveScroll: true,
                onSuccess: (page) => { setShowModalEtapa(false); toast.success(page.props.flash?.success ?? 'Etapa actualizada.'); },
                onError: () => toast.error('Error al actualizar. Verifique los campos.'),
            });
        } else {
            formEtapa.post(route('configuracion.etapas.store'), {
                preserveScroll: true,
                onSuccess: (page) => { setShowModalEtapa(false); formEtapa.reset(); toast.success(page.props.flash?.success ?? 'Etapa creada.'); },
                onError: () => toast.error('Error al crear. Verifique los campos.'),
            });
        }
    }

    // ── ELIMINAR ──
    function pedirConfirmacion(item) {
        setItemAEliminar(item);
        setConfirmOpen(true);
    }

    function handleDelete() {
        router.delete(route('configuracion.etapas.destroy', itemAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => { setConfirmOpen(false); toast.success(page.props.flash?.success ?? 'Desactivado.'); },
            onError: () => toast.error('Error al desactivar.'),
        });
    }

    const bloqueadaConformidad = editandoEtapa
        ? yaExisteConformidad(editandoEtapa.id)
        : yaExisteConformidad();

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#291136]/10 rounded-xl p-2.5">
                            <GitBranch className="text-[#291136]" size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#291136]">Etapas</h1>
                            <p className="text-sm text-gray-400">Configura las etapas del flujo por servicio</p>
                        </div>
                    </div>
                </div>

                {/* Selector de servicio */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                    <div className="flex items-center gap-4 flex-wrap">
                        <label className="text-sm font-bold text-[#291136]">Servicio:</label>
                        <select
                            value={servicioId}
                            onChange={e => cambiarServicio(e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 min-w-[250px] focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                        >
                            <option value="">— Seleccionar servicio —</option>
                            {servicios.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                        {servicioId && (
                            <PrimaryButton onClick={abrirCrearEtapa} className="ml-auto">
                                <Plus size={14} className="mr-1.5" /> Nueva Etapa
                            </PrimaryButton>
                        )}
                    </div>
                </div>

                {/* Lista de etapas */}
                {!servicioId ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <Layers size={40} className="mx-auto mb-3 text-gray-200"/>
                        <p className="text-sm text-gray-400">Seleccione un servicio para ver sus etapas.</p>
                    </div>
                ) : etapas.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <GitBranch size={40} className="mx-auto mb-3 text-gray-200"/>
                        <p className="text-sm text-gray-400">No hay etapas configuradas para este servicio.</p>
                        <PrimaryButton onClick={abrirCrearEtapa} className="mt-4">
                            <Plus size={14} className="mr-1.5" /> Crear primera etapa
                        </PrimaryButton>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {etapas.map(etapa => (
                            <div key={etapa.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="flex items-center gap-3 p-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-[#BE0F4A] bg-[#BE0F4A]/10 px-2 py-0.5 rounded">
                                                Orden {etapa.orden}
                                            </span>
                                            <span className="text-sm font-bold text-[#291136]">{etapa.nombre}</span>
                                            <Badge status={etapa.activo ? 'activo' : 'inactivo'} text={etapa.activo ? 'Activo' : 'Inactivo'}/>
                                            {etapa.requiere_conformidad && (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                                    <ShieldAlert size={11}/> Req. conformidad
                                                </span>
                                            )}
                                        </div>
                                        {etapa.descripcion && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{etapa.descripcion}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => abrirEditarEtapa(etapa)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                                            <Edit2 size={14}/>
                                        </button>
                                        <button onClick={() => pedirConfirmacion(etapa)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Desactivar">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal Etapa ── */}
            <Modal show={showModalEtapa} onClose={() => setShowModalEtapa(false)} maxWidth="md">
                <form onSubmit={submitEtapa} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#291136]">{editandoEtapa ? 'Editar Etapa' : 'Nueva Etapa'}</h3>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                        <input type="text" value={formEtapa.data.nombre} onChange={e => formEtapa.setData('nombre', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Ej: Etapa Postulatoria"/>
                        {formEtapa.errors.nombre && <p className="text-xs text-red-500 mt-1">{formEtapa.errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                        <textarea value={formEtapa.data.descripcion} onChange={e => formEtapa.setData('descripcion', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" rows={2}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Orden</label>
                            <input type="number" value={formEtapa.data.orden} onChange={e => formEtapa.setData('orden', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" min="1"/>
                        </div>
                        {editandoEtapa && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                                <select value={formEtapa.data.activo} onChange={e => formEtapa.setData('activo', e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Toggle requiere_conformidad */}
                    <div className={`rounded-xl border p-3.5 ${formEtapa.data.requiere_conformidad ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'}`}>
                        <label className={`flex items-start gap-3 cursor-pointer select-none ${bloqueadaConformidad && !formEtapa.data.requiere_conformidad ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="checkbox"
                                checked={!!formEtapa.data.requiere_conformidad}
                                disabled={bloqueadaConformidad && !formEtapa.data.requiere_conformidad}
                                onChange={e => formEtapa.setData('requiere_conformidad', e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-amber-500 rounded shrink-0"
                            />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <ShieldAlert size={14} className={formEtapa.data.requiere_conformidad ? 'text-amber-600' : 'text-gray-400'}/>
                                    <span className={`text-sm font-bold ${formEtapa.data.requiere_conformidad ? 'text-amber-800' : 'text-gray-600'}`}>
                                        Requiere conformidad antes de avanzar
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {bloqueadaConformidad && !formEtapa.data.requiere_conformidad
                                        ? 'Solo una etapa por servicio puede tener esta opción.'
                                        : 'El responsable no podrá avanzar a otra etapa hasta que la solicitud esté declarada CONFORME.'
                                    }
                                </p>
                            </div>
                        </label>
                        {formEtapa.errors.requiere_conformidad && (
                            <p className="text-xs text-red-500 mt-2">{formEtapa.errors.requiere_conformidad}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setShowModalEtapa(false)}>Cancelar</SecondaryButton>
                        <PrimaryButton type="submit" disabled={formEtapa.processing}>
                            {editandoEtapa ? 'Guardar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ── Confirm Dialog ── */}
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Etapa"
                message="Puede reactivarla posteriormente desde esta misma pantalla."
                confirmText="Sí, desactivar"
                processing={false}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
                detalles={[{ label: 'Etapa', value: itemAEliminar?.nombre }]}
                variant="danger"
            />
        </AuthenticatedLayout>
    );
}
