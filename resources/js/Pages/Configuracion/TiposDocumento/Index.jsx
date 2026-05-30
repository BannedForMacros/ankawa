import { useState, useEffect, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import { confirmar, confirmarDesactivar, confirmarReactivar } from '@/lib/swalAnkawa';
import { validarZod, requeridos } from '@/lib/validar';

const tipoDocSchema = requeridos({ nombre: 'El nombre es obligatorio.' });
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import {
    FileStack, Plus, Pencil, Trash2, Settings, Users,
    Upload, Eye, Building2, Send, X, RotateCcw
} from 'lucide-react';

// ── Chips ─────────────────────────────────────────────────────────────────────

function ServicioChip({ nombre, esParaSolicitud }) {
    return (
        <span
            title={esParaSolicitud ? `${nombre} · aparece en el formulario de nueva solicitud` : nombre}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#291136]/80 bg-white border border-[#291136]/20 px-2.5 py-1 rounded-lg">
            <span>{nombre}</span>
            {esParaSolicitud && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#BE0F4A]">
                    <Send size={10} className="shrink-0" /> Solicitud
                </span>
            )}
        </span>
    );
}

function ActorChip({ nombre, puedeSubir, puedeVer }) {
    const partes = [];
    if (puedeVer)   partes.push('puede ver');
    if (puedeSubir) partes.push('se le puede requerir');
    return (
        <span
            title={partes.length ? `${nombre} · ${partes.join(' · ')}` : nombre}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 px-2.5 py-1 rounded-lg">
            <span>{nombre}</span>
            {(puedeVer || puedeSubir) && (
                <span className="inline-flex items-center gap-1 pl-1.5 border-l border-gray-200 shrink-0">
                    {puedeVer && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-emerald-100 text-emerald-600">
                            <Eye size={11} />
                        </span>
                    )}
                    {puedeSubir && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-100 text-amber-600">
                            <Upload size={11} />
                        </span>
                    )}
                </span>
            )}
        </span>
    );
}

// ── Modal: Crear / Editar ─────────────────────────────────────────────────────

function ModalTipoDocumento({ show, onClose, editando }) {
    const { data, setData, post, put, processing, errors, reset, setError, clearErrors } = useForm({
        nombre:      '',
        descripcion: '',
        activo:      1,
    });

    useEffect(() => {
        if (show) {
            setData({
                nombre:      editando?.nombre      ?? '',
                descripcion: editando?.descripcion ?? '',
                activo:      editando?.activo       ?? 1,
            });
        }
    }, [show, editando]);

    const submit = async (e) => {
        e.preventDefault();
        if (!validarZod(tipoDocSchema, data, { setError, clearErrors })) return;
        const ok = await confirmar({
            variant: editando ? 'info' : 'warning',
            titulo:  editando ? `¿Guardar cambios en "${data.nombre}"?` : `¿Crear tipo de documento "${data.nombre}"?`,
            mensaje: editando
                ? 'Se actualizará la configuración de este tipo de documento en todos los servicios y actores.'
                : 'Se registrará como un nuevo tipo de documento disponible para configurar en servicios.',
            detalles:    [{ label: 'Nombre', value: data.nombre }],
            confirmText: editando ? 'Sí, guardar' : 'Sí, crear',
        });
        if (ok) doSave();
    };

    const doSave = () => {
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
            <form onSubmit={submit} noValidate>
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

// ── Toggle helper ─────────────────────────────────────────────────────────────
function Toggle({ value, onChange, color = 'bg-[#291136]', size = 'md' }) {
    const h = size === 'sm' ? 'w-9 h-5' : 'w-11 h-6';
    const t = size === 'sm' ? 'w-4 h-4'  : 'w-5 h-5';
    return (
        <button type="button" onClick={() => onChange(!value)}
            className={`relative ${h} rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${value ? color : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 left-0.5 ${t} bg-white rounded-full shadow-sm transition-transform duration-200 ${value ? (size === 'sm' ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'}`} />
        </button>
    );
}

// ── Modal: Actores (con filtro por servicio) ──────────────────────────────────

function ModalActores({ show, onClose, tipoDoc, servicios, serviciosTiposActor }) {
    const [servicioId,  setServicioId]  = useState(null);
    const [filas,       setFilas]       = useState([]);
    const [processing,  setProcessing]  = useState(false);

    // Servicios donde este documento está activo
    const serviciosDelDoc = tipoDoc?.servicios ?? [];

    // Al abrir, seleccionar el primer servicio disponible
    useEffect(() => {
        if (show && serviciosDelDoc.length > 0) {
            setServicioId(prev => serviciosDelDoc.find(s => s.id === prev) ? prev : serviciosDelDoc[0].id);
        }
    }, [show, tipoDoc?.id]);

    // Al cambiar servicio, cargar las filas de actores para ese servicio
    useEffect(() => {
        if (!servicioId || !tipoDoc) return;
        const actoresDelServicio = serviciosTiposActor[servicioId] ?? [];
        setFilas(actoresDelServicio.map(actor => {
            const pivot = tipoDoc.actores_pivots?.find(
                p => p.tipo_actor_id === actor.tipo_actor_id && p.servicio_id === servicioId
            );
            return {
                tipo_actor_id: actor.tipo_actor_id,
                nombre:        actor.nombre,
                slug:          actor.slug,
                activo:        !!pivot,
                puede_ver:     pivot?.puede_ver    ?? true,
                puede_subir:   pivot?.puede_subir  ?? false,
            };
        }));
    }, [servicioId, tipoDoc?.id]);

    const updateRow = (idx, field, value) => {
        setFilas(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
    };

    const submit = (e) => {
        e.preventDefault();
        if (!servicioId) return;
        setProcessing(true);
        router.post(
            route('configuracion.tipos-documentos.sync-actores', tipoDoc.id),
            { servicio_id: servicioId, actores: filas },
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

    const servicioSelec = servicios.find(s => s.id === servicioId);

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <Users size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[#291136]">Permisos por Actor</h2>
                            <p className="text-xs text-gray-400">
                                <strong>{tipoDoc?.nombre}</strong>
                            </p>
                        </div>
                    </div>

                    {serviciosDelDoc.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-5 text-center">
                            <Building2 size={24} className="text-amber-400 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-amber-700">Sin servicios asignados</p>
                            <p className="text-xs text-amber-600 mt-1">
                                Primero asigna este documento a al menos un servicio.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Selector de servicio */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Servicio
                                </label>
                                <div className="flex gap-2 flex-wrap">
                                    {serviciosDelDoc.map(srv => (
                                        <button key={srv.id} type="button"
                                            onClick={() => setServicioId(srv.id)}
                                            className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors ${
                                                servicioId === srv.id
                                                    ? 'bg-[#291136] text-white border-[#291136]'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#291136]/30'
                                            }`}>
                                            {srv.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Lista de actores del servicio */}
                            {filas.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No hay tipos de actor configurados en {servicioSelec?.nombre}.
                                </div>
                            ) : (
                                <div className="space-y-2">
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
                                                <Toggle value={actor.activo} onChange={v => updateRow(idx, 'activo', v)} />
                                            </div>

                                            {actor.activo && (
                                                <div className="mt-3 pl-11 border-t border-gray-100 pt-3 space-y-2.5">
                                                    {/* Puede ver */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Eye size={13} className={actor.puede_ver ? 'text-emerald-600' : 'text-gray-300'} />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700">Puede ver en historial</p>
                                                                <p className="text-[10px] text-gray-400">Ve documentos de este tipo en el expediente</p>
                                                            </div>
                                                        </div>
                                                        <Toggle value={actor.puede_ver} onChange={v => updateRow(idx, 'puede_ver', v)} color="bg-emerald-500" size="sm" />
                                                    </div>
                                                    {/* Se le puede requerir */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Upload size={13} className={actor.puede_subir ? 'text-[#BE0F4A]' : 'text-gray-300'} />
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-700">Se le puede requerir</p>
                                                                <p className="text-[10px] text-gray-400">Aparece en el dropdown "Documento requerido" al crear un movimiento a este actor</p>
                                                            </div>
                                                        </div>
                                                        <Toggle value={actor.puede_subir} onChange={v => updateRow(idx, 'puede_subir', v)} color="bg-[#BE0F4A]" size="sm" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={processing || serviciosDelDoc.length === 0}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg disabled:opacity-50 transition-colors">
                        {processing ? 'Guardando...' : 'Guardar Permisos'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TiposDocumentoIndex({ tipos, servicios, serviciosTiposActor }) {
    const [modalTipo,     setModalTipo]     = useState(false);
    const [modalServ,     setModalServ]     = useState(false);
    const [modalActores,  setModalActores]  = useState(false);
    const [editando,      setEditando]      = useState(null);
    const [gestionando,   setGestionando]   = useState(null);
    // ── Filtros (estado + servicio) — por defecto solo activos ──
    const [estado,     setEstado]     = useState('activos');
    const [servicioId, setServicioId] = useState('');

    const tiposFiltrados = useMemo(() => {
        const sid = servicioId ? Number(servicioId) : null;
        return tipos.filter(t => {
            if (estado === 'activos'   && !t.activo) return false;
            if (estado === 'inactivos' &&  t.activo) return false;
            if (sid && !(t.servicios ?? []).some(s => s.id === sid)) return false;
            return true;
        });
    }, [tipos, estado, servicioId]);

    const filtros = (
        <>
            <div className="w-44">
                <CustomSelect value={estado} onChange={setEstado}
                    options={[{ id: 'activos', nombre: 'Activos' }, { id: 'inactivos', nombre: 'Inactivos' }]}
                    placeholder="Todos los estados" />
            </div>
            <div className="w-56">
                <CustomSelect value={servicioId} onChange={setServicioId}
                    options={servicios} placeholder="Todos los servicios" />
            </div>
        </>
    );

    const abrirCrear   = () => { setEditando(null); setModalTipo(true); };
    const abrirEditar  = (t) => { setEditando(t); setModalTipo(true); };
    const abrirServ    = (t) => { setGestionando(t); setModalServ(true); };
    const abrirActores = (t) => { setGestionando(t); setModalActores(true); };

    const pedirReactivar = async (row) => {
        const ok = await confirmarReactivar({
            titulo: 'Reactivar Tipo de Documento',
            mensaje: 'Volverá a poder usarse en solicitudes y asignarse a servicios.',
            detalle: { label: 'Tipo de documento', value: row.nombre },
        });
        if (!ok) return;
        router.patch(route('configuracion.tipos-documentos.reactivar', row.id), {}, {
            preserveScroll: true,
            onSuccess: (page) => { if (page.props.flash?.success) toast.success(page.props.flash.success); },
            onError: () => toast.error('Error al reactivar.'),
        });
    };

    const pedirDesactivar = async (row) => {
        const ok = await confirmarDesactivar({
            titulo: 'Desactivar Tipo de Documento',
            mensaje: 'No podrá usarse en nuevas solicitudes ni asignarse a servicios. Podrás reactivarlo cuando quieras.',
            detalle: { label: 'Tipo de documento', value: row.nombre },
        });
        if (!ok) return;

        router.delete(route('configuracion.tipos-documentos.destroy', row.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error)   toast.error(page.props.flash.error);
            },
            onError: () => toast.error('Error al desactivar.'),
        });
    };

    // Al filtrar por un servicio, las columnas muestran solo lo de ESE servicio
    const filtroServicioId = servicioId ? Number(servicioId) : null;

    const columns = [
        {
            key:   'nombre',
            label: 'Documento',
            render: (row) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#291136]">{row.nombre}</span>
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
            key:      'servicios',
            label:    'Servicios',
            sortable: false,
            render: (row) => {
                const servs = filtroServicioId
                    ? (row.servicios ?? []).filter(s => s.id === filtroServicioId)
                    : (row.servicios ?? []);
                return (
                    <div className="flex flex-wrap gap-1">
                        {servs.length > 0
                            ? servs.map(srv => (
                                <ServicioChip
                                    key={srv.id}
                                    nombre={srv.nombre}
                                    esParaSolicitud={srv.pivot?.es_para_solicitud}
                                />
                            ))
                            : <span className="text-[10px] text-gray-300 italic">—</span>
                        }
                    </div>
                );
            },
        },
        {
            key:      'actores',
            label:    'Actores',
            sortable: false,
            render: (row) => {
                // Acotar al servicio filtrado para no mezclar actores de otros servicios
                const pivots = filtroServicioId
                    ? (row.actores_pivots ?? []).filter(p => Number(p.servicio_id) === filtroServicioId)
                    : (row.actores_pivots ?? []);
                // Actores únicos con al menos un permiso
                const unicos = [];
                const seen   = new Set();
                pivots.forEach(p => {
                    if (!seen.has(p.tipo_actor_id)) {
                        seen.add(p.tipo_actor_id);
                        unicos.push(p);
                    }
                });
                return (
                    <div className="flex flex-wrap gap-1">
                        {unicos.length > 0
                            ? unicos.map(p => (
                                <ActorChip
                                    key={p.tipo_actor_id}
                                    nombre={p.actor_nombre}
                                    puedeSubir={p.puede_subir}
                                    puedeVer={p.puede_ver}
                                />
                            ))
                            : <span className="text-[10px] text-gray-300 italic">—</span>
                        }
                    </div>
                );
            },
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
                    {row.documentos_count === 0 && row.activo && (
                        <button onClick={() => pedirDesactivar(row)}
                            title="Desactivar"
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                            <Trash2 size={15} />
                        </button>
                    )}
                    {!row.activo && (
                        <button onClick={() => pedirReactivar(row)}
                            title="Reactivar"
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                            <RotateCcw size={15} />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <ConfigHeader
                breadcrumb={[
                    { label: 'Inicio', href: route('dashboard') },
                    { label: 'Configuración' },
                    { label: 'Tipos de Documento' },
                ]}
                title="Tipos de"
                titleAccent="Documento"
                description="Catálogo de documentos, servicios y permisos por tipo de actor."
                action={{ label: 'Nuevo Tipo', onClick: abrirCrear, icon: Plus }}
            />
            <div className="p-6 max-w-6xl mx-auto">

                {/* Leyenda de íconos */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-[11px] text-gray-400">
                    <span className="font-semibold text-gray-400 uppercase tracking-wide">Significado:</span>
                    <span className="inline-flex items-center gap-1"><Send size={11} className="text-[#BE0F4A]" /> Aparece en nueva solicitud</span>
                    <span className="inline-flex items-center gap-1"><Eye size={11} className="text-emerald-600" /> Actor que puede verlo</span>
                    <span className="inline-flex items-center gap-1"><Upload size={11} className="text-amber-600" /> Actor al que se le puede requerir</span>
                </div>

                <Table
                    columns={columns}
                    data={tiposFiltrados}
                    clientSide
                    perPage={15}
                    searchKeys={['nombre', 'descripcion']}
                    filters={filtros}
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
                servicios={servicios}
                serviciosTiposActor={serviciosTiposActor}
            />
        </AuthenticatedLayout>
    );
}
