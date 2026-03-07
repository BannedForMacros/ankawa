import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
    UserCheck, Plus, Pencil, Trash2, Users, Settings,
    CheckCircle, XCircle, Zap, Building2, ChevronDown, ChevronUp
} from 'lucide-react';

// ── Helpers visuales ──────────────────────────────────────────────────────────

function SlugChip({ slug }) {
    return (
        <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
            {slug}
        </code>
    );
}

function ServicioChip({ nombre, esAuto }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border
            ${esAuto
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-[#291136]/5 text-[#291136]/70 border-[#291136]/10'
            }`}>
            {esAuto && <Zap size={9} className="shrink-0"/>}
            {nombre}
        </span>
    );
}

// ── Modal: Editar tipo de actor ───────────────────────────────────────────────

function ModalTipoActor({ show, onClose, editando }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre: '',
        activo: 1,
    });

    // Sync cuando cambia editando (al abrir el modal)
    useEffect(() => {
        if (show) {
            setData({
                nombre: editando?.nombre ?? '',
                activo: editando?.activo ?? 1,
            });
        }
    }, [show, editando]);

    const submit = (e) => {
        e.preventDefault();
        const method     = editando ? put  : post;
        const routeName  = editando
            ? route('configuracion.tipos-actor.update', editando.id)
            : route('configuracion.tipos-actor.store');

        method(routeName, {
            preserveScroll: true,
            onSuccess: (page) => {
                onClose();
                reset();
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
                            <UserCheck size={18} className="text-white"/>
                        </div>
                        <h2 className="text-lg font-bold text-[#291136]">
                            {editando ? 'Editar Tipo de Actor' : 'Nuevo Tipo de Actor'}
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
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"/>
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">
                                Se generará un identificador automático (slug) a partir del nombre.
                            </p>
                        </div>

                        {editando && (
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Estado
                                </label>
                                <select value={data.activo}
                                    onChange={e => setData('activo', Number(e.target.value))}
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
                        {processing ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Modal: Gestionar Servicios ────────────────────────────────────────────────

function ModalServicios({ show, onClose, tipoActor, servicios }) {
    // Construir estado inicial: por cada servicio, si está asignado y cómo
    const buildInitial = () =>
        servicios.map(srv => {
            const pivot = tipoActor?.servicios?.find(s => s.id === srv.id)?.pivot;
            return {
                servicio_id:   srv.id,
                nombre:        srv.nombre,
                activo:        !!pivot,
                es_automatico: pivot?.es_automatico ?? false,
                rol_auto_slug: pivot?.rol_auto_slug ?? '',
                orden:         pivot?.orden ?? 1,
            };
        });

    const { data, setData, post, processing } = useForm({
        servicios: [],
    });

    // Reconstruir el estado cuando cambia el tipoActor o se abre el modal
    useEffect(() => {
        if (show && tipoActor) {
            setData('servicios', buildInitial());
        }
    }, [show, tipoActor?.id]);

    const updateRow = (idx, field, value) => {
        const updated = data.servicios.map((row, i) =>
            i === idx ? { ...row, [field]: value } : row
        );
        setData('servicios', updated);
    };

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

    const SLUGS_INMUTABLES = ['demandante', 'demandado'];
    const esInmutable = tipoActor ? SLUGS_INMUTABLES.includes(tipoActor.slug) : false;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#BE0F4A] flex items-center justify-center shrink-0">
                            <Building2 size={18} className="text-white"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#291136]">Configurar Servicios</h2>
                            <p className="text-xs text-gray-400">
                                <strong>{tipoActor?.nombre}</strong> — ¿En qué servicios aplica este tipo de actor?
                            </p>
                        </div>
                    </div>

                    {esInmutable && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-semibold mb-4">
                            Este tipo de actor (demandante/demandado) es auto-asignado desde el formulario de solicitud
                            en todos los servicios. No requiere configuración adicional.
                        </div>
                    )}

                    <div className="space-y-3 mt-4">
                        {data.servicios.map((row, idx) => (
                            <div key={row.servicio_id}
                                className={`border rounded-2xl p-4 transition-colors ${row.activo ? 'border-[#291136]/20 bg-[#291136]/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>

                                {/* Fila principal: toggle activo */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${row.activo ? 'bg-[#291136]/10' : 'bg-gray-100'}`}>
                                            <Building2 size={14} className={row.activo ? 'text-[#291136]' : 'text-gray-300'}/>
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
                                            ${row.activo ? 'translate-x-5' : 'translate-x-0'}`}/>
                                    </button>
                                </div>

                                {/* Opciones avanzadas (si está activo) */}
                                {row.activo && !esInmutable && (
                                    <div className="mt-4 pl-11 space-y-3 border-t border-gray-100 pt-3">

                                        {/* Auto-asignar toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-[#291136]">Auto-asignar al crear expediente</p>
                                                <p className="text-[10px] text-gray-400">Se asigna automáticamente sin intervención manual.</p>
                                            </div>
                                            <button type="button"
                                                onClick={() => updateRow(idx, 'es_automatico', !row.es_automatico)}
                                                className={`relative w-11 h-6 rounded-full transition-colors duration-200
                                                    ${row.es_automatico ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                                                    ${row.es_automatico ? 'translate-x-5' : 'translate-x-0'}`}/>
                                            </button>
                                        </div>

                                        {/* Rol de auto-asignación */}
                                        {row.es_automatico && (
                                            <div>
                                                <label className="block text-[10px] font-bold text-[#291136] uppercase tracking-wide mb-1.5">
                                                    Slug del Rol a asignar
                                                </label>
                                                <input type="text"
                                                    placeholder="Ej: secretaria_general_adjunta"
                                                    value={row.rol_auto_slug}
                                                    onChange={e => updateRow(idx, 'rol_auto_slug', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"/>
                                                <p className="text-[10px] text-gray-400 mt-1">
                                                    Se buscará el usuario con ese rol y menor carga de expedientes activos.
                                                    Dejar vacío si el actor proviene del formulario.
                                                </p>
                                            </div>
                                        )}

                                        {/* Orden */}
                                        <div>
                                            <label className="block text-[10px] font-bold text-[#291136] uppercase tracking-wide mb-1.5">
                                                Orden de visualización
                                            </label>
                                            <input type="number" min={1} max={99}
                                                value={row.orden}
                                                onChange={e => updateRow(idx, 'orden', Number(e.target.value))}
                                                className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"/>
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
                            {processing ? 'Guardando...' : 'Guardar Configuración'}
                        </button>
                    )}
                </div>
            </form>
        </Modal>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TiposActorIndex({ tipos, servicios }) {
    const [modalTipo,     setModalTipo]     = useState(false);
    const [modalServ,     setModalServ]     = useState(false);
    const [editando,      setEditando]      = useState(null);
    const [gestionando,   setGestionando]   = useState(null);
    const [confirmOpen,   setConfirmOpen]   = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [deleting,      setDeleting]      = useState(false);

    const abrirCrear = () => { setEditando(null); setModalTipo(true); };
    const abrirEditar = (tipo) => { setEditando(tipo); setModalTipo(true); };
    const abrirServicios = (tipo) => { setGestionando(tipo); setModalServ(true); };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.tipos-actor.destroy', itemAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setItemAEliminar(null);
                setDeleting(false);
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error)   toast.error(page.props.flash.error);
            },
            onError: () => { setDeleting(false); toast.error('Error al desactivar.'); },
        });
    };

    const SLUGS_INMUTABLES = ['demandante', 'demandado'];

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#291136] flex items-center justify-center shadow-sm">
                            <UserCheck size={24} className="text-white"/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">
                                Tipos de Actor
                            </h1>
                            <p className="text-sm text-gray-400">
                                Catálogo de roles por expediente y su asignación por servicio
                            </p>
                        </div>
                    </div>
                    <button onClick={abrirCrear}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg transition-colors">
                        <Plus size={16}/> Nuevo Tipo
                    </button>
                </div>

                {/* Leyenda */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-emerald-400"/>
                        <Zap size={10}/> Auto-asignado al crear expediente
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#291136]/20"/>
                        Asignación manual
                    </span>
                </div>

                {/* Lista */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tipos.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <Users size={40} className="mx-auto mb-3 opacity-30"/>
                            <p className="font-medium">No hay tipos de actor registrados.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {tipos.map(tipo => {
                                const esInmutable = SLUGS_INMUTABLES.includes(tipo.slug);
                                return (
                                    <div key={tipo.id}
                                        className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors group">

                                        {/* Icono */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${tipo.activo ? 'bg-[#291136]/10' : 'bg-gray-100'}`}>
                                            <UserCheck size={15} className={tipo.activo ? 'text-[#291136]' : 'text-gray-300'}/>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className={`font-bold text-sm ${tipo.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                                    {tipo.nombre}
                                                </span>
                                                <SlugChip slug={tipo.slug}/>
                                                {!tipo.activo && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">
                                                        Inactivo
                                                    </span>
                                                )}
                                                {esInmutable && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
                                                        Base del sistema
                                                    </span>
                                                )}
                                            </div>

                                            {/* Chips de servicios */}
                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                {tipo.servicios?.length > 0 ? (
                                                    tipo.servicios.map(srv => (
                                                        <ServicioChip
                                                            key={srv.id}
                                                            nombre={srv.nombre}
                                                            esAuto={srv.pivot?.es_automatico}
                                                        />
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 italic">
                                                        Sin servicios configurados
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-gray-400 mt-1.5">
                                                En uso: {tipo.actores_expediente_count} expediente(s)
                                            </p>
                                        </div>

                                        {/* Acciones */}
                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => abrirServicios(tipo)}
                                                title="Gestionar Servicios"
                                                className="p-2 rounded-lg text-[#291136]/60 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors">
                                                <Settings size={15}/>
                                            </button>
                                            <button onClick={() => abrirEditar(tipo)}
                                                title="Editar"
                                                className="p-2 rounded-lg text-[#BE0F4A]/60 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors">
                                                <Pencil size={15}/>
                                            </button>
                                            {!esInmutable && tipo.actores_expediente_count === 0 && (
                                                <button onClick={() => { setItemAEliminar(tipo); setConfirmOpen(true); }}
                                                    title="Desactivar"
                                                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                    <Trash2 size={15}/>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
            />

            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Tipo de Actor"
                message={`¿Seguro que deseas desactivar "${itemAEliminar?.nombre}"? No se puede deshacer si hay expedientes activos.`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}
