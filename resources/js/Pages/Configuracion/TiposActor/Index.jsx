import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
    UserCheck, Plus, Pencil, Trash2, Settings,
    Zap, Building2, Users
} from 'lucide-react';

// ── Chip de servicio en la tabla ──────────────────────────────────────────────

function ServicioChip({ nombre, esAuto }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border
            ${esAuto
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-[#291136]/5 text-[#291136]/70 border-[#291136]/10'
            }`}>
            {esAuto && <Zap size={9} className="shrink-0" />}
            {nombre}
        </span>
    );
}

// ── Modal: Crear / Editar nombre del tipo de actor ────────────────────────────

function ModalTipoActor({ show, onClose, editando }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        activo: 1,
    });

    useEffect(() => {
        if (show) {
            setData({ nombre: editando?.nombre ?? '', activo: editando?.activo ?? 1 });
        }
    }, [show, editando?.id]);

    const submit = (e) => {
        e.preventDefault();
        const method    = editando ? put  : post;
        const routeName = editando
            ? route('configuracion.tipos-actor.update', editando.id)
            : route('configuracion.tipos-actor.store');

        method(routeName, {
            preserveScroll: true,
            onSuccess: (page) => {
                onClose(); reset();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Revise los campos e intente de nuevo.'),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <UserCheck size={18} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[#291136]">
                            {editando ? 'Editar tipo de actor' : 'Nuevo tipo de actor'}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Nombre <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <input type="text" required placeholder="Ej: Perito Informático"
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                        </div>

                        {editando && (
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">Estado</label>
                                <select value={data.activo} onChange={e => setData('activo', Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]">
                                    <option value={1}>Activo</option>
                                    <option value={0}>Inactivo</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg disabled:opacity-50 transition-colors">
                        {processing ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Modal: Configurar servicios para un tipo de actor ─────────────────────────

const SLUGS_INMUTABLES = ['demandante', 'demandado'];

function ModalServicios({ show, onClose, tipoActor, servicios, roles }) {
    const buildInitial = () =>
        servicios.map(srv => {
            const pivot = tipoActor?.servicios?.find(s => s.id === srv.id)?.pivot;
            return {
                servicio_id:     srv.id,
                nombre:          srv.nombre,
                activo:          !!pivot,
                es_automatico:   pivot?.es_automatico   ?? false,
                permite_externo: pivot?.permite_externo ?? false,
                rol_auto_slug:   pivot?.rol_auto_slug   ?? '',
                orden:           pivot?.orden           ?? 1,
            };
        });

    const { data, setData, post, processing } = useForm({ servicios: [] });

    useEffect(() => {
        if (show && tipoActor) setData('servicios', buildInitial());
    }, [show, tipoActor?.id]);

    const updateRow = (idx, field, value) =>
        setData('servicios', data.servicios.map((row, i) => i === idx ? { ...row, [field]: value } : row));

    const submit = (e) => {
        e.preventDefault();
        post(route('configuracion.tipos-actor.sync-servicios', tipoActor.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                onClose();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Error al guardar la configuración.'),
        });
    };

    const esInmutable = tipoActor ? SLUGS_INMUTABLES.includes(tipoActor.slug) : false;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#BE0F4A] flex items-center justify-center shrink-0">
                            <Building2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#291136]">Servicios donde participa</h2>
                            <p className="text-xs text-gray-400">
                                <strong>{tipoActor?.nombre}</strong> — indica en qué servicios interviene y cómo se asigna
                            </p>
                        </div>
                    </div>

                    {esInmutable && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold mb-4">
                            Demandante y Demandado se asignan automáticamente desde el formulario de solicitud
                            en todos los servicios — no requieren configuración adicional aquí.
                        </div>
                    )}

                    <div className="space-y-3">
                        {data.servicios.map((row, idx) => (
                            <div key={row.servicio_id}
                                className={`border rounded-2xl p-4 transition-colors ${row.activo ? 'border-[#291136]/20 bg-[#291136]/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${row.activo ? 'bg-[#291136]/10' : 'bg-gray-100'}`}>
                                            <Building2 size={14} className={row.activo ? 'text-[#291136]' : 'text-gray-300'} />
                                        </div>
                                        <span className={`text-sm font-bold ${row.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                            {row.nombre}
                                        </span>
                                    </div>
                                    <button type="button"
                                        onClick={() => updateRow(idx, 'activo', !row.activo)}
                                        disabled={esInmutable}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                                            ${row.activo ? 'bg-[#291136]' : 'bg-gray-200'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                                            ${row.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {row.activo && !esInmutable && (
                                    <div className="mt-4 pl-11 space-y-3 border-t border-gray-100 pt-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                                                <div>
                                                    <p className="text-xs font-bold text-[#291136]">Auto-asignar</p>
                                                    <p className="text-[10px] text-gray-400">Al crear expediente</p>
                                                </div>
                                                <button type="button"
                                                    onClick={() => updateRow(idx, 'es_automatico', !row.es_automatico)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-2 ${row.es_automatico ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${row.es_automatico ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                                                <div>
                                                    <p className="text-xs font-bold text-[#291136]">Acepta externo</p>
                                                    <p className="text-[10px] text-gray-400">Sin cuenta en el sistema</p>
                                                </div>
                                                <button type="button"
                                                    onClick={() => updateRow(idx, 'permite_externo', !row.permite_externo)}
                                                    className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ml-2 ${row.permite_externo ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${row.permite_externo ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {row.es_automatico && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-[#291136] uppercase tracking-wide mb-1.5">
                                                    Rol a asignar automáticamente
                                                </label>
                                                <select
                                                    value={row.rol_auto_slug}
                                                    onChange={e => updateRow(idx, 'rol_auto_slug', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400">
                                                    <option value="">— Seleccionar rol —</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.slug}>{r.nombre}</option>
                                                    ))}
                                                </select>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Se asignará el usuario con ese rol que tenga menor carga de expedientes activos.
                                                </p>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-bold text-[#291136] uppercase tracking-wide mb-1.5">
                                                Posición en la lista de participantes
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input type="number" min={1} max={99}
                                                    value={row.orden}
                                                    onChange={e => updateRow(idx, 'orden', Number(e.target.value))}
                                                    className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                                                <p className="text-[10px] text-gray-400">Número más bajo = aparece primero.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    {!esInmutable && (
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] shadow-lg disabled:opacity-50 transition-colors">
                            {processing ? 'Guardando...' : 'Guardar configuración'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TiposActorIndex({ tipos, servicios, roles }) {
    const [modalTipo,     setModalTipo]     = useState(false);
    const [modalServ,     setModalServ]     = useState(false);
    const [editando,      setEditando]      = useState(null);
    const [gestionando,   setGestionando]   = useState(null);
    const [confirmOpen,   setConfirmOpen]   = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [deleting,      setDeleting]      = useState(false);

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.tipos-actor.destroy', itemAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false); setItemAEliminar(null); setDeleting(false);
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error)   toast.error(page.props.flash.error);
            },
            onError: () => { setDeleting(false); toast.error('Error al desactivar.'); },
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-6">
                    <div className="px-6 py-6 border-l-4 border-[#BE0F4A]">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase">
                                    Tipos de Actor
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Define los roles que pueden participar en los expedientes y en qué servicios aplican
                                </p>
                            </div>
                            <button
                                onClick={() => { setEditando(null); setModalTipo(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg transition-colors">
                                <Plus size={16} /> Nuevo tipo de actor
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider rounded-tl-2xl w-1/4">
                                    Nombre
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Servicios donde participa
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">
                                    Estado
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28 rounded-tr-2xl">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {tipos.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-14 text-center text-gray-400">
                                        <Users size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">No hay tipos de actor registrados.</p>
                                    </td>
                                </tr>
                            ) : tipos.map(tipo => {
                                const esInmutable = SLUGS_INMUTABLES.includes(tipo.slug);
                                return (
                                    <tr key={tipo.id} className="hover:bg-gray-50/60 transition-colors group">

                                        {/* Nombre */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`font-bold ${tipo.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                                    {tipo.nombre}
                                                </span>
                                                {esInmutable && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                                                        Del sistema
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                En uso: {tipo.actores_expediente_count} expediente(s)
                                            </p>
                                        </td>

                                        {/* Servicios */}
                                        <td className="px-5 py-4">
                                            {tipo.servicios?.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {tipo.servicios.map(srv => (
                                                        <ServicioChip
                                                            key={srv.id}
                                                            nombre={srv.nombre}
                                                            esAuto={srv.pivot?.es_automatico}
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                esInmutable
                                                    ? <span className="text-[10px] text-amber-600 italic">Aplica en todos los servicios</span>
                                                    : <span className="text-[10px] text-gray-300 italic">Sin servicios configurados</span>
                                            )}
                                        </td>

                                        {/* Estado */}
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border
                                                ${tipo.activo
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200'
                                                }`}>
                                                {tipo.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>

                                        {/* Acciones */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => { setGestionando(tipo); setModalServ(true); }}
                                                    title="Configurar servicios"
                                                    className="p-2 rounded-lg text-[#BE0F4A]/60 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors">
                                                    <Settings size={15} />
                                                </button>
                                                <button
                                                    onClick={() => { setEditando(tipo); setModalTipo(true); }}
                                                    title="Editar nombre"
                                                    className="p-2 rounded-lg text-[#291136]/50 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors">
                                                    <Pencil size={15} />
                                                </button>
                                                {!esInmutable && tipo.actores_expediente_count === 0 && (
                                                    <button
                                                        onClick={() => { setItemAEliminar(tipo); setConfirmOpen(true); }}
                                                        title="Desactivar"
                                                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalTipoActor
                show={modalTipo}
                onClose={() => setModalTipo(false)}
                editando={editando}
            />

            <ModalServicios
                show={modalServ}
                onClose={() => setModalServ(false)}
                tipoActor={gestionando}
                servicios={servicios}
                roles={roles}
            />

            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar tipo de actor"
                message={`¿Seguro que deseas desactivar "${itemAEliminar?.nombre}"?`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}
