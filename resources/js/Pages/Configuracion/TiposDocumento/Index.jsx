import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
    FileStack, Plus, Pencil, Trash2, Settings, Users,
    Upload, Eye, Building2, Send
} from 'lucide-react';

// ── Chips ─────────────────────────────────────────────────────────────────────

function SlugChip({ slug }) {
    return (
        <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">
            {slug}
        </code>
    );
}

function ServicioChip({ nombre, esParaSolicitud }) {
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border
            ${esParaSolicitud
                ? 'bg-[#BE0F4A]/10 text-[#BE0F4A] border-[#BE0F4A]/20'
                : 'bg-[#291136]/5 text-[#291136]/70 border-[#291136]/10'}`}>
            {esParaSolicitud && <Send size={8} className="shrink-0" />}
            <Building2 size={9} className="shrink-0" />
            {nombre}
        </span>
    );
}

function ActorChip({ nombre, puedeSubir, puedeVer }) {
    return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            {puedeSubir && <Upload size={8} className="shrink-0" />}
            {puedeVer   && <Eye    size={8} className="shrink-0" />}
            {nombre}
        </span>
    );
}

// ── Modal: Crear / Editar ─────────────────────────────────────────────────────

function ModalTipoDocumento({ show, onClose, editando }) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:              '',
        descripcion:         '',
        formatos_permitidos: 'pdf,doc,docx',
        tamanio_maximo_mb:   10,
        activo:              1,
    });

    useEffect(() => {
        if (show) {
            setData({
                nombre:              editando?.nombre              ?? '',
                descripcion:         editando?.descripcion         ?? '',
                formatos_permitidos: editando?.formatos_permitidos ?? 'pdf,doc,docx',
                tamanio_maximo_mb:   editando?.tamanio_maximo_mb   ?? 10,
                activo:              editando?.activo               ?? 1,
            });
        }
    }, [show, editando]);

    const submit = (e) => {
        e.preventDefault();
        const method    = editando ? put  : post;
        const routeName = editando
            ? route('configuracion.tipos-documentos.update', editando.id)
            : route('configuracion.tipos-documentos.store');

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
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <FileStack size={18} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[#291136]">
                            {editando ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Nombre <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <input type="text" required
                                placeholder="Ej: Solicitud de Arbitraje"
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">Se generará un identificador (slug) automático.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Descripción
                            </label>
                            <textarea rows={2}
                                placeholder="Descripción opcional"
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Formatos permitidos
                                </label>
                                <input type="text"
                                    placeholder="pdf,doc,docx"
                                    value={data.formatos_permitidos}
                                    onChange={e => setData('formatos_permitidos', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                                <p className="text-[10px] text-gray-400 mt-1">Separados por coma.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Tamaño máx. (MB)
                                </label>
                                <input type="number" min={1} max={500}
                                    value={data.tamanio_maximo_mb}
                                    onChange={e => setData('tamanio_maximo_mb', Number(e.target.value))}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                            </div>
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

// ── Modal: Servicios ──────────────────────────────────────────────────────────

function ModalServicios({ show, onClose, tipoDoc, servicios }) {
    const [filas, setFilas]           = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (show && tipoDoc) {
            setFilas(servicios.map(srv => {
                const pivot = tipoDoc?.servicios?.find(s => s.id === srv.id)?.pivot;
                return {
                    servicio_id:       srv.id,
                    nombre:            srv.nombre,
                    activo:            !!pivot,
                    es_para_solicitud: pivot?.es_para_solicitud ?? false,
                };
            }));
        }
    }, [show, tipoDoc?.id]);

    const update = (idx, field, value) => {
        setFilas(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('configuracion.tipos-documentos.sync-servicios', tipoDoc.id),
            { servicios: filas },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setProcessing(false);
                    onClose();
                    if (page.props.flash?.success) toast.success(page.props.flash.success);
                },
                onError: () => { setProcessing(false); toast.error('Error al guardar los servicios.'); },
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#BE0F4A] flex items-center justify-center shrink-0">
                            <Building2 size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#291136]">Servicios</h2>
                            <p className="text-xs text-gray-400">
                                <strong>{tipoDoc?.nombre}</strong> — ¿En qué servicios aplica?
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        {filas.map((srv, idx) => (
                            <div key={srv.servicio_id}
                                className={`border rounded-2xl p-4 transition-colors ${srv.activo ? 'border-[#291136]/20 bg-[#291136]/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${srv.activo ? 'bg-[#291136]/10' : 'bg-gray-100'}`}>
                                            <Building2 size={13} className={srv.activo ? 'text-[#291136]' : 'text-gray-300'} />
                                        </div>
                                        <span className={`text-sm font-bold ${srv.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                            {srv.nombre}
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => update(idx, 'activo', !srv.activo)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${srv.activo ? 'bg-[#291136]' : 'bg-gray-200'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${srv.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {srv.activo && (
                                    <div className="mt-3 pl-10 border-t border-gray-100 pt-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-[#291136]">Aparece en nueva solicitud</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                El solicitante podrá elegir este tipo al enviar una solicitud de este servicio.
                                            </p>
                                        </div>
                                        <button type="button"
                                            onClick={() => update(idx, 'es_para_solicitud', !srv.es_para_solicitud)}
                                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ml-4 ${srv.es_para_solicitud ? 'bg-[#BE0F4A]' : 'bg-gray-200'}`}>
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${srv.es_para_solicitud ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                        <strong>Nota:</strong> Con 1 tipo marcado para solicitud se auto-selecciona.
                        Con 2 o más, el solicitante deberá elegir.
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] shadow-lg disabled:opacity-50 transition-colors">
                        {processing ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Modal: Actores ────────────────────────────────────────────────────────────

function ModalActores({ show, onClose, tipoDoc, tiposActor }) {
    const [filas, setFilas]           = useState([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (show && tipoDoc) {
            setFilas(tiposActor.map(actor => {
                const pivot = tipoDoc?.tipos_actor?.find(a => a.id === actor.id)?.pivot;
                return {
                    tipo_actor_id: actor.id,
                    nombre:        actor.nombre,
                    slug:          actor.slug,
                    activo:        !!pivot,
                    puede_ver:     pivot?.puede_ver   ?? true,
                    puede_subir:   pivot?.puede_subir ?? false,
                };
            }));
        }
    }, [show, tipoDoc?.id]);

    const updateRow = (idx, field, value) => {
        setFilas(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('configuracion.tipos-documentos.sync-actores', tipoDoc.id),
            { actores: filas },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setProcessing(false);
                    onClose();
                    if (page.props.flash?.success) toast.success(page.props.flash.success);
                },
                onError: () => { setProcessing(false); toast.error('Error al guardar los permisos.'); },
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <Users size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#291136]">Permisos por Actor</h2>
                            <p className="text-xs text-gray-400">
                                <strong>{tipoDoc?.nombre}</strong> — ¿Qué actores pueden ver/subir este documento?
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        {filas.map((actor, idx) => (
                            <div key={actor.tipo_actor_id}
                                className={`border rounded-2xl p-4 transition-colors ${actor.activo ? 'border-[#291136]/20 bg-[#291136]/[0.02]' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${actor.activo ? 'bg-[#291136]/10' : 'bg-gray-100'}`}>
                                            <Users size={14} className={actor.activo ? 'text-[#291136]' : 'text-gray-300'} />
                                        </div>
                                        <span className={`text-sm font-bold ${actor.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                            {actor.nombre}
                                        </span>
                                    </div>
                                    <button type="button" onClick={() => updateRow(idx, 'activo', !actor.activo)}
                                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${actor.activo ? 'bg-[#291136]' : 'bg-gray-200'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${actor.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {actor.activo && (
                                    <div className="mt-3 pl-11 flex items-center gap-6 border-t border-gray-100 pt-3">
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <button type="button" onClick={() => updateRow(idx, 'puede_ver', !actor.puede_ver)}
                                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${actor.puede_ver ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${actor.puede_ver ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <Eye size={12} className={actor.puede_ver ? 'text-emerald-600' : 'text-gray-300'} />
                                                <span className="text-xs font-semibold text-gray-600">Puede ver</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <button type="button" onClick={() => updateRow(idx, 'puede_subir', !actor.puede_subir)}
                                                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${actor.puede_subir ? 'bg-[#BE0F4A]' : 'bg-gray-200'}`}>
                                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${actor.puede_subir ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <Upload size={12} className={actor.puede_subir ? 'text-[#BE0F4A]' : 'text-gray-300'} />
                                                <span className="text-xs font-semibold text-gray-600">Puede subir</span>
                                            </div>
                                        </label>
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
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg disabled:opacity-50 transition-colors">
                        {processing ? 'Guardando...' : 'Guardar Permisos'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TiposDocumentoIndex({ tipos, servicios, tiposActor }) {
    const [modalTipo,     setModalTipo]     = useState(false);
    const [modalServ,     setModalServ]     = useState(false);
    const [modalActores,  setModalActores]  = useState(false);
    const [editando,      setEditando]      = useState(null);
    const [gestionando,   setGestionando]   = useState(null);
    const [confirmOpen,   setConfirmOpen]   = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [deleting,      setDeleting]      = useState(false);

    const abrirCrear   = () => { setEditando(null); setModalTipo(true); };
    const abrirEditar  = (t) => { setEditando(t); setModalTipo(true); };
    const abrirServ    = (t) => { setGestionando(t); setModalServ(true); };
    const abrirActores = (t) => { setGestionando(t); setModalActores(true); };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.tipos-documentos.destroy', itemAEliminar.id), {
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

    const columns = [
        {
            key:   'nombre',
            label: 'Documento',
            render: (row) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#291136]">{row.nombre}</span>
                        <SlugChip slug={row.slug} />
                        {!row.activo && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">
                                Inactivo
                            </span>
                        )}
                    </div>
                    {row.descripcion && (
                        <p className="text-[11px] text-gray-400 truncate max-w-xs">{row.descripcion}</p>
                    )}
                </div>
            ),
        },
        {
            key:      'formatos',
            label:    'Formatos / Tamaño',
            sortable: false,
            render: (row) => (
                <div className="flex flex-col gap-0.5">
                    <code className="text-[10px] font-mono bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100 w-fit">
                        {row.formatos_permitidos}
                    </code>
                    <span className="text-[10px] text-gray-400">máx. {row.tamanio_maximo_mb} MB</span>
                </div>
            ),
        },
        {
            key:      'servicios',
            label:    'Servicios',
            sortable: false,
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.servicios?.length > 0
                        ? row.servicios.map(srv => (
                            <ServicioChip
                                key={srv.id}
                                nombre={srv.nombre}
                                esParaSolicitud={srv.pivot?.es_para_solicitud}
                            />
                        ))
                        : <span className="text-[10px] text-gray-300 italic">—</span>
                    }
                </div>
            ),
        },
        {
            key:      'actores',
            label:    'Actores',
            sortable: false,
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.tipos_actor?.length > 0
                        ? row.tipos_actor.map(actor => (
                            <ActorChip
                                key={actor.id}
                                nombre={actor.nombre}
                                puedeSubir={actor.pivot?.puede_subir}
                                puedeVer={actor.pivot?.puede_ver}
                            />
                        ))
                        : <span className="text-[10px] text-gray-300 italic">—</span>
                    }
                </div>
            ),
        },
        {
            key:      'acciones',
            label:    'Acciones',
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => abrirServ(row)}
                        title="Gestionar Servicios"
                        className="p-1.5 rounded-lg text-[#291136]/50 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors">
                        <Settings size={15} />
                    </button>
                    <button onClick={() => abrirActores(row)}
                        title="Permisos por Actor"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                        <Users size={15} />
                    </button>
                    <button onClick={() => abrirEditar(row)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-[#BE0F4A]/50 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors">
                        <Pencil size={15} />
                    </button>
                    {row.documentos_count === 0 && row.activo === 1 && (
                        <button onClick={() => { setItemAEliminar(row); setConfirmOpen(true); }}
                            title="Desactivar"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="p-6">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-6">
                    <div className="px-6 py-6 border-l-4 border-[#BE0F4A]">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase">
                                    Tipos de Documento
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Catálogo de documentos, servicios y permisos por tipo de actor
                                </p>
                            </div>
                            <button onClick={abrirCrear}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg transition-colors">
                                <Plus size={16} /> Nuevo Tipo
                            </button>
                        </div>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={tipos.data}
                    meta={tipos.meta}
                    routeName="configuracion.tipos-documentos.index"
                    searchPlaceholder="Buscar tipo de documento..."
                />
            </div>

            <ModalTipoDocumento
                show={modalTipo}
                onClose={() => setModalTipo(false)}
                editando={editando}
            />
            <ModalServicios
                show={modalServ}
                onClose={() => setModalServ(false)}
                tipoDoc={gestionando}
                servicios={servicios}
            />
            <ModalActores
                show={modalActores}
                onClose={() => setModalActores(false)}
                tipoDoc={gestionando}
                tiposActor={tiposActor}
            />
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Tipo de Documento"
                message={`¿Desactivar "${itemAEliminar?.nombre}"? No se podrá usar en nuevas solicitudes.`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}
