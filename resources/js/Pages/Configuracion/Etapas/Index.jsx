import { useState } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import toast from 'react-hot-toast';
import { Plus, GitBranch, ChevronDown, ChevronRight, Edit2, Trash2, Layers } from 'lucide-react';

export default function Index({ servicios = [], servicioActual, etapas = [] }) {
    const { flash } = usePage().props;
    const [servicioId, setServicioId] = useState(servicioActual ?? '');

    // ── Modal Etapa ──
    const [showModalEtapa, setShowModalEtapa] = useState(false);
    const [editandoEtapa, setEditandoEtapa] = useState(null);
    const formEtapa = useForm({ servicio_id: servicioId, nombre: '', descripcion: '', orden: '', activo: 1 });

    // ── Modal Sub-etapa ──
    const [showModalSub, setShowModalSub] = useState(false);
    const [editandoSub, setEditandoSub] = useState(null);
    const [etapaParentId, setEtapaParentId] = useState(null);
    const formSub = useForm({ nombre: '', descripcion: '', orden: '', activo: 1 });

    // ── Confirm ──
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [tipoEliminar, setTipoEliminar] = useState('');

    // ── Accordion ──
    const [expandidas, setExpandidas] = useState({});

    function toggleExpand(id) {
        setExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
    }

    // ── Cambiar servicio ──
    function cambiarServicio(id) {
        setServicioId(id);
        if (id) {
            router.get(route('configuracion.etapas.index'), { servicio_id: id }, { preserveState: true });
        }
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
            servicio_id: etapa.servicio_id,
            nombre: etapa.nombre,
            descripcion: etapa.descripcion ?? '',
            orden: etapa.orden,
            activo: etapa.activo,
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
                onError: () => toast.error('Error al actualizar.'),
            });
        } else {
            formEtapa.post(route('configuracion.etapas.store'), {
                preserveScroll: true,
                onSuccess: (page) => { setShowModalEtapa(false); formEtapa.reset(); toast.success(page.props.flash?.success ?? 'Etapa creada.'); },
                onError: () => toast.error('Error al crear.'),
            });
        }
    }

    // ── SUB-ETAPA CRUD ──
    function abrirCrearSub(etapaId) {
        formSub.reset();
        setEditandoSub(null);
        setEtapaParentId(etapaId);
        setShowModalSub(true);
    }

    function abrirEditarSub(sub) {
        formSub.setData({
            nombre: sub.nombre,
            descripcion: sub.descripcion ?? '',
            orden: sub.orden,
            activo: sub.activo,
        });
        setEditandoSub(sub);
        setEtapaParentId(sub.etapa_id);
        setShowModalSub(true);
    }

    function submitSub(e) {
        e.preventDefault();
        if (editandoSub) {
            formSub.put(route('configuracion.sub-etapas.update', editandoSub.id), {
                preserveScroll: true,
                onSuccess: (page) => { setShowModalSub(false); toast.success(page.props.flash?.success ?? 'Sub-etapa actualizada.'); },
                onError: () => toast.error('Error al actualizar.'),
            });
        } else {
            formSub.post(route('configuracion.sub-etapas.store', etapaParentId), {
                preserveScroll: true,
                onSuccess: (page) => { setShowModalSub(false); formSub.reset(); toast.success(page.props.flash?.success ?? 'Sub-etapa creada.'); },
                onError: () => toast.error('Error al crear.'),
            });
        }
    }

    // ── ELIMINAR ──
    function pedirConfirmacion(item, tipo) {
        setItemAEliminar(item);
        setTipoEliminar(tipo);
        setConfirmOpen(true);
    }

    function handleDelete() {
        const routeName = tipoEliminar === 'etapa' ? 'configuracion.etapas.destroy' : 'configuracion.sub-etapas.destroy';
        router.delete(route(routeName, itemAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => { setConfirmOpen(false); toast.success(page.props.flash?.success ?? 'Desactivado.'); },
            onError: () => toast.error('Error al desactivar.'),
        });
    }

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
                            <h1 className="text-xl font-bold text-[#291136]">Etapas y Sub-etapas</h1>
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
                                {/* Cabecera de etapa */}
                                <div
                                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleExpand(etapa.id)}
                                >
                                    {expandidas[etapa.id]
                                        ? <ChevronDown size={16} className="text-[#291136] shrink-0"/>
                                        : <ChevronRight size={16} className="text-gray-400 shrink-0"/>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold text-[#BE0F4A] bg-[#BE0F4A]/10 px-2 py-0.5 rounded">
                                                Orden {etapa.orden}
                                            </span>
                                            <span className="text-sm font-bold text-[#291136]">{etapa.nombre}</span>
                                            <Badge status={etapa.activo ? 'activo' : 'inactivo'} text={etapa.activo ? 'Activo' : 'Inactivo'}/>
                                            <span className="text-xs text-gray-400">
                                                {etapa.sub_etapas?.length ?? 0} sub-etapa(s)
                                            </span>
                                        </div>
                                        {etapa.descripcion && (
                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{etapa.descripcion}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => abrirCrearSub(etapa.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#291136] hover:bg-[#291136]/5 transition-colors" title="Agregar sub-etapa">
                                            <Plus size={14}/>
                                        </button>
                                        <button onClick={() => abrirEditarEtapa(etapa)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Editar">
                                            <Edit2 size={14}/>
                                        </button>
                                        <button onClick={() => pedirConfirmacion(etapa, 'etapa')} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Desactivar">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Sub-etapas (expandible) */}
                                {expandidas[etapa.id] && (
                                    <div className="border-t border-gray-100 bg-gray-50/50">
                                        {(!etapa.sub_etapas || etapa.sub_etapas.length === 0) ? (
                                            <div className="p-4 text-center">
                                                <p className="text-xs text-gray-400 mb-2">Sin sub-etapas configuradas</p>
                                                <button onClick={() => abrirCrearSub(etapa.id)} className="text-xs font-bold text-[#291136] hover:underline">
                                                    + Crear sub-etapa
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {etapa.sub_etapas.map(sub => (
                                                    <div key={sub.id} className="flex items-center gap-3 px-4 py-3 pl-12">
                                                        <span className="text-xs font-mono text-gray-300 shrink-0">{sub.orden}.</span>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-semibold text-[#291136]">{sub.nombre}</span>
                                                            {sub.descripcion && (
                                                                <p className="text-xs text-gray-400 truncate">{sub.descripcion}</p>
                                                            )}
                                                        </div>
                                                        <Badge status={sub.activo ? 'activo' : 'inactivo'} text={sub.activo ? 'Activo' : 'Inactivo'}/>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button onClick={() => abrirEditarSub(sub)} className="p-1 rounded text-gray-400 hover:text-blue-600">
                                                                <Edit2 size={12}/>
                                                            </button>
                                                            <button onClick={() => pedirConfirmacion(sub, 'sub-etapa')} className="p-1 rounded text-gray-400 hover:text-red-600">
                                                                <Trash2 size={12}/>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
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
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setShowModalEtapa(false)}>Cancelar</SecondaryButton>
                        <PrimaryButton type="submit" disabled={formEtapa.processing}>
                            {editandoEtapa ? 'Guardar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ── Modal Sub-etapa ── */}
            <Modal show={showModalSub} onClose={() => setShowModalSub(false)} maxWidth="md">
                <form onSubmit={submitSub} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-[#291136]">{editandoSub ? 'Editar Sub-etapa' : 'Nueva Sub-etapa'}</h3>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                        <input type="text" value={formSub.data.nombre} onChange={e => formSub.setData('nombre', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Ej: Contestación de demanda"/>
                        {formSub.errors.nombre && <p className="text-xs text-red-500 mt-1">{formSub.errors.nombre}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Descripción</label>
                        <textarea value={formSub.data.descripcion} onChange={e => formSub.setData('descripcion', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" rows={2}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Orden</label>
                            <input type="number" value={formSub.data.orden} onChange={e => formSub.setData('orden', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" min="1"/>
                        </div>
                        {editandoSub && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Estado</label>
                                <select value={formSub.data.activo} onChange={e => formSub.setData('activo', e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={() => setShowModalSub(false)}>Cancelar</SecondaryButton>
                        <PrimaryButton type="submit" disabled={formSub.processing}>
                            {editandoSub ? 'Guardar' : 'Crear'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ── Confirm Dialog ── */}
            <ConfirmDialog
                show={confirmOpen}
                title={`Desactivar ${tipoEliminar === 'etapa' ? 'Etapa' : 'Sub-etapa'}`}
                message="Puede reactivarla posteriormente desde esta misma pantalla."
                confirmText="Sí, desactivar"
                processing={false}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
                detalles={[{ label: tipoEliminar === 'etapa' ? 'Etapa' : 'Sub-etapa', value: itemAEliminar?.nombre }]}
                variant="danger"
            />
        </AuthenticatedLayout>
    );
}
