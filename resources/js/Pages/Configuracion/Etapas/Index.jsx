import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Badge from '@/Components/Badge';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import {
    GitBranch, Plus, ChevronDown, ChevronRight,
    Pencil, Trash2, ListChecks, AlertCircle,
    CheckCircle2, Circle, Clock, FileText,
    Bell, Scale, Mic, Bookmark, Users
} from 'lucide-react';

const opcionesEstado = [
    { id: 1, nombre: 'Activo'   },
    { id: 0, nombre: 'Inactivo' },
];

const opcionesSiNo = [
    { id: 1, nombre: 'Si, es obligatorio' },
    { id: 0, nombre: 'No es obligatorio'  },
];

const opcionesTipo = [
    { id: 'documento',    nombre: 'Documento'    },
    { id: 'notificacion', nombre: 'Notificacion' },
    { id: 'resolucion',   nombre: 'Resolucion'   },
    { id: 'audiencia',    nombre: 'Audiencia'    },
    { id: 'otro',         nombre: 'Otro'         },
];

const iconoTipo = {
    documento:    <FileText size={13} />,
    notificacion: <Bell size={13} />,
    resolucion:   <Scale size={13} />,
    audiencia:    <Mic size={13} />,
    otro:         <Bookmark size={13} />,
};

// ── Selector múltiple de roles ──
function RolesSelector({ roles, seleccionados, onChange }) {
    const toggle = (id) => {
        if (seleccionados.includes(id)) {
            onChange(seleccionados.filter(r => r !== id));
        } else {
            onChange([...seleccionados, id]);
        }
    };

    return (
        <div>
            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                Roles que pueden actuar
            </label>
            <div className="flex flex-wrap gap-2">
                {roles.map(rol => {
                    const activo = seleccionados.includes(rol.id);
                    return (
                        <button
                            key={rol.id}
                            type="button"
                            onClick={() => toggle(rol.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                                ${activo
                                    ? 'bg-[#291136] text-white border-[#291136]'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-[#291136]/30'}`}>
                            {rol.nombre}
                        </button>
                    );
                })}
            </div>
            {seleccionados.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5 italic">
                    Sin roles asignados — cualquiera puede actuar.
                </p>
            )}
        </div>
    );
}

// ── Fila de Actividad ──
function FilaActividad({ actividad, onEdit, onDelete }) {
    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-gray-100 rounded-lg hover:border-[#BE0F4A]/20 transition-colors group">
            <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A] text-xs font-bold flex items-center justify-center shrink-0">
                    {actividad.orden}
                </span>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-[#291136]">{actividad.nombre}</p>
                        {actividad.tipo && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                {iconoTipo[actividad.tipo] ?? <Bookmark size={13} />}
                                {actividad.tipo}
                            </span>
                        )}
                        {/* Roles asignados */}
                        {actividad.roles?.map(r => (
                            <span key={r.id}
                                className="inline-flex items-center gap-1 text-xs text-[#291136] bg-[#291136]/10 px-2 py-0.5 rounded-full font-semibold">
                                <Users size={10} />
                                {r.nombre}
                            </span>
                        ))}
                    </div>
                    {actividad.descripcion && (
                        <p className="text-xs text-gray-400 mt-0.5">{actividad.descripcion}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                {actividad.dias_plazo && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <Clock size={11} />
                        {actividad.dias_plazo}d
                    </span>
                )}
                {actividad.es_obligatorio
                    ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 size={11} /> Obligatorio
                      </span>
                    : <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        <Circle size={11} /> Opcional
                      </span>
                }
                <Badge
                    status={actividad.activo ? 'activo' : 'inactivo'}
                    text={actividad.activo ? 'Activo' : 'Inactivo'}
                />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(actividad)}
                        className="p-1.5 rounded-lg text-[#BE0F4A]/70 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors"
                        title="Editar actividad">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => onDelete(actividad)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Desactivar actividad">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Card de Etapa — igual que antes ──
function CardEtapa({ etapa, onEditEtapa, onDeleteEtapa, onNewActividad, onEditActividad, onDeleteActividad }) {
    const [abierto, setAbierto] = useState(true);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 bg-[#291136]/5 border-b border-gray-200">
                <button onClick={() => setAbierto(!abierto)}
                    className="flex items-center gap-3 flex-1 text-left">
                    <span className="w-7 h-7 rounded-lg bg-[#291136] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {etapa.orden}
                    </span>
                    <div>
                        <p className="text-sm font-bold text-[#291136]">{etapa.nombre}</p>
                        {etapa.descripcion && (
                            <p className="text-xs text-gray-400">{etapa.descripcion}</p>
                        )}
                    </div>
                    <span className="ml-2 text-gray-400 shrink-0">
                        {abierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                </button>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge status={etapa.activo ? 'activo' : 'inactivo'} text={etapa.activo ? 'Activo' : 'Inactivo'} />
                    <button onClick={() => onNewActividad(etapa)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#BE0F4A] border border-[#BE0F4A]/30 hover:bg-[#BE0F4A]/10 transition-colors">
                        <Plus size={13} strokeWidth={2.5} /> Actividad
                    </button>
                    <button onClick={() => onEditEtapa(etapa)}
                        className="p-1.5 rounded-lg text-[#BE0F4A]/70 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors">
                        <Pencil size={15} />
                    </button>
                    <button onClick={() => onDeleteEtapa(etapa)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
            {abierto && (
                <div className="p-3 bg-gray-50 space-y-2">
                    {etapa.actividades.length === 0 ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
                            <AlertCircle size={15} />
                            <span>Sin actividades. Agrega la primera.</span>
                        </div>
                    ) : (
                        etapa.actividades.map(act => (
                            <FilaActividad
                                key={act.id}
                                actividad={act}
                                onEdit={onEditActividad}
                                onDelete={onDeleteActividad}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── Página principal ──
export default function Index({ servicios, roles }) {

    const [servicioSeleccionado, setServicioSeleccionado] = useState(
        servicios.length > 0 ? servicios[0] : null
    );

    const [modalEtapa, setModalEtapa]                     = useState(false);
    const [editandoEtapa, setEditandoEtapa]               = useState(null);
    const [modalActividad, setModalActividad]             = useState(false);
    const [editandoActividad, setEditandoActividad]       = useState(null);
    const [etapaParaActividad, setEtapaParaActividad]     = useState(null);
    const [rolesSeleccionados, setRolesSeleccionados]     = useState([]);

    const [confirmEtapa, setConfirmEtapa]         = useState(false);
    const [etapaAEliminar, setEtapaAEliminar]     = useState(null);
    const [confirmActividad, setConfirmActividad] = useState(false);
    const [actividadAEliminar, setActividadAEliminar] = useState(null);
    const [deleting, setDeleting]                 = useState(false);

    const formEtapa = useForm({
        servicio_id: '',
        nombre:      '',
        descripcion: '',
        orden:       1,
        activo:      1,
    });

    const formActividad = useForm({
        etapa_id:       '',
        nombre:         '',
        descripcion:    '',
        tipo:           '',
        es_obligatorio: 1,
        dias_plazo:     '',
        orden:          1,
        activo:         1,
        roles:          [],
    });

    const siguienteOrdenEtapa     = () => (servicioSeleccionado?.etapas?.length ?? 0) + 1;
    const siguienteOrdenActividad = (etapa) => (etapa?.actividades?.length ?? 0) + 1;

    // ── Etapas ──
    const abrirCrearEtapa = () => {
        formEtapa.reset();
        formEtapa.setData({
            servicio_id: servicioSeleccionado?.id ?? '',
            nombre:      '',
            descripcion: '',
            orden:       siguienteOrdenEtapa(),
            activo:      1,
        });
        setEditandoEtapa(null);
        setModalEtapa(true);
    };

    const abrirEditarEtapa = (etapa) => {
        formEtapa.setData({
            servicio_id: etapa.servicio_id,
            nombre:      etapa.nombre,
            descripcion: etapa.descripcion ?? '',
            orden:       etapa.orden,
            activo:      etapa.activo,
        });
        setEditandoEtapa(etapa);
        setModalEtapa(true);
    };

    const submitEtapa = (e) => {
        e.preventDefault();
        const route_name = editandoEtapa
            ? route('configuracion.etapas.update', editandoEtapa.id)
            : route('configuracion.etapas.store');
        const method = editandoEtapa ? formEtapa.put : formEtapa.post;
        method(route_name, {
            preserveScroll: true,
            onSuccess: (page) => {
                setModalEtapa(false);
                setEditandoEtapa(null);
                formEtapa.reset();
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => toast.error('Error al guardar la etapa.'),
        });
    };

    const handleDeleteEtapa = () => {
        setDeleting(true);
        router.delete(route('configuracion.etapas.destroy', etapaAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmEtapa(false);
                setEtapaAEliminar(null);
                setDeleting(false);
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => { setDeleting(false); toast.error('Error al desactivar.'); },
        });
    };

    // ── Actividades ──
    const abrirCrearActividad = (etapa) => {
        formActividad.reset();
        formActividad.setData({
            etapa_id:       etapa.id,
            nombre:         '',
            descripcion:    '',
            tipo:           '',
            es_obligatorio: 1,
            dias_plazo:     '',
            orden:          siguienteOrdenActividad(etapa),
            activo:         1,
            roles:          [],
        });
        setRolesSeleccionados([]);
        setEtapaParaActividad(etapa);
        setEditandoActividad(null);
        setModalActividad(true);
    };

    const abrirEditarActividad = (actividad) => {
        const rolesIds = actividad.roles?.map(r => r.id) ?? [];
        formActividad.setData({
            etapa_id:       actividad.etapa_id,
            nombre:         actividad.nombre,
            descripcion:    actividad.descripcion ?? '',
            tipo:           actividad.tipo ?? '',
            es_obligatorio: actividad.es_obligatorio,
            dias_plazo:     actividad.dias_plazo ?? '',
            orden:          actividad.orden,
            activo:         actividad.activo,
            roles:          rolesIds,
        });
        setRolesSeleccionados(rolesIds);
        setEditandoActividad(actividad);
        setModalActividad(true);
    };

    const submitActividad = (e) => {
        e.preventDefault();
        // Sincronizar roles seleccionados al form antes de enviar
        formActividad.setData('roles', rolesSeleccionados);

        const route_name = editandoActividad
            ? route('configuracion.actividades.update', editandoActividad.id)
            : route('configuracion.actividades.store');
        const method = editandoActividad ? formActividad.put : formActividad.post;
        method(route_name, {
            preserveScroll: true,
            onSuccess: (page) => {
                setModalActividad(false);
                setEditandoActividad(null);
                setRolesSeleccionados([]);
                formActividad.reset();
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => toast.error('Error al guardar la actividad.'),
        });
    };

    const handleDeleteActividad = () => {
        setDeleting(true);
        router.delete(route('configuracion.actividades.destroy', actividadAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmActividad(false);
                setActividadAEliminar(null);
                setDeleting(false);
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => { setDeleting(false); toast.error('Error al desactivar.'); },
        });
    };

    const etapasActuales = servicioSeleccionado
        ? (servicios.find(s => s.id === servicioSeleccionado.id)?.etapas ?? [])
        : [];

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: '#291136' }}>
                            <GitBranch size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">
                                Etapas y Actividades
                            </h1>
                            <p className="text-sm text-gray-400 font-medium">
                                Configura el flujo de cada tipo de servicio
                            </p>
                        </div>
                    </div>
                    {servicioSeleccionado && (
                        <PrimaryButton onClick={abrirCrearEtapa}>
                            <Plus size={18} strokeWidth={2.5} />
                            Nueva Etapa
                        </PrimaryButton>
                    )}
                </div>

                {servicios.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <GitBranch size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No hay servicios activos.</p>
                        <p className="text-sm mt-1">Crea primero un servicio en la sección Servicios.</p>
                    </div>
                ) : (
                    <div>
                        {/* Tabs servicios */}
                        <div className="flex gap-2 mb-6 flex-wrap">
                            {servicios.map(servicio => (
                                <button key={servicio.id}
                                    onClick={() => setServicioSeleccionado(servicio)}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                        ${servicioSeleccionado?.id === servicio.id
                                            ? 'bg-[#291136] text-white shadow-sm'
                                            : 'bg-white border border-gray-200 text-[#291136]/60 hover:border-[#291136]/30 hover:text-[#291136]'}`}>
                                    {servicio.nombre}
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full
                                        ${servicioSeleccionado?.id === servicio.id
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-500'}`}>
                                        {servicio.etapas?.length ?? 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Etapas */}
                        {etapasActuales.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                <ListChecks size={36} className="mx-auto mb-3 opacity-30" />
                                <p className="font-medium">Sin etapas configuradas</p>
                                <p className="text-sm mt-1">Crea la primera etapa para este servicio.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {etapasActuales.map(etapa => (
                                    <CardEtapa
                                        key={etapa.id}
                                        etapa={etapa}
                                        onEditEtapa={abrirEditarEtapa}
                                        onDeleteEtapa={(e) => { setEtapaAEliminar(e); setConfirmEtapa(true); }}
                                        onNewActividad={abrirCrearActividad}
                                        onEditActividad={abrirEditarActividad}
                                        onDeleteActividad={(a) => { setActividadAEliminar(a); setConfirmActividad(true); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Etapa — sin cambios */}
            <Modal show={modalEtapa} onClose={() => setModalEtapa(false)} maxWidth="sm">
                <form onSubmit={submitEtapa}>
                    <div className="p-7">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#291136' }}>
                                <GitBranch size={18} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editandoEtapa ? 'Editar Etapa' : 'Nueva Etapa'}
                            </h2>
                        </div>
                        <Input label="Nombre de la etapa" required type="text"
                            value={formEtapa.data.nombre}
                            onChange={e => formEtapa.setData('nombre', e.target.value)}
                            placeholder="Ej: Admision, Contestacion, Audiencia..."
                            error={formEtapa.errors.nombre} />
                        <Textarea label="Descripcion"
                            value={formEtapa.data.descripcion}
                            onChange={e => formEtapa.setData('descripcion', e.target.value)}
                            placeholder="Describe esta etapa del proceso..." rows={2} />
                        <Input label="Orden" required type="number" min="1"
                            value={formEtapa.data.orden}
                            onChange={e => formEtapa.setData('orden', parseInt(e.target.value) || 1)}
                            error={formEtapa.errors.orden} />
                        {editandoEtapa && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">Estado</label>
                                <CustomSelect value={formEtapa.data.activo}
                                    onChange={(val) => formEtapa.setData('activo', val)}
                                    options={opcionesEstado} placeholder={null} />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                        <SecondaryButton type="button" onClick={() => setModalEtapa(false)} disabled={formEtapa.processing}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={formEtapa.processing}>
                            {formEtapa.processing ? 'Procesando...' : editandoEtapa ? 'Guardar Cambios' : 'Crear Etapa'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Actividad — con selector de roles */}
            <Modal show={modalActividad} onClose={() => setModalActividad(false)} maxWidth="md">
                <form onSubmit={submitActividad}>
                    <div className="p-7">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#BE0F4A' }}>
                                <ListChecks size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#291136]">
                                    {editandoActividad ? 'Editar Actividad' : 'Nueva Actividad'}
                                </h2>
                                {etapaParaActividad && !editandoActividad && (
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Etapa: <span className="font-semibold text-[#291136]/70">{etapaParaActividad.nombre}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <Input label="Nombre de la actividad" required type="text"
                            value={formActividad.data.nombre}
                            onChange={e => formActividad.setData('nombre', e.target.value)}
                            placeholder="Ej: Notificar al demandado, Emitir resolucion..."
                            error={formActividad.errors.nombre} />

                        <Textarea label="Descripcion"
                            value={formActividad.data.descripcion}
                            onChange={e => formActividad.setData('descripcion', e.target.value)}
                            placeholder="Describe que se hace en esta actividad..." rows={2} />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">Tipo</label>
                                <CustomSelect value={formActividad.data.tipo}
                                    onChange={(val) => formActividad.setData('tipo', val)}
                                    options={opcionesTipo} placeholder="-- Tipo --" />
                            </div>
                            <Input label="Dias plazo" type="number" min="1"
                                value={formActividad.data.dias_plazo}
                                onChange={e => formActividad.setData('dias_plazo', e.target.value)}
                                placeholder="Ej: 5" error={formActividad.errors.dias_plazo} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="mb-5">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                    Obligatorio <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <CustomSelect value={formActividad.data.es_obligatorio}
                                    onChange={(val) => formActividad.setData('es_obligatorio', val)}
                                    options={opcionesSiNo} placeholder={null} />
                            </div>
                            <Input label="Orden" required type="number" min="1"
                                value={formActividad.data.orden}
                                onChange={e => formActividad.setData('orden', parseInt(e.target.value) || 1)}
                                error={formActividad.errors.orden} />
                        </div>

                        {/* Selector de roles — NUEVO */}
                        <div className="mb-5">
                            <RolesSelector
                                roles={roles}
                                seleccionados={rolesSeleccionados}
                                onChange={setRolesSeleccionados}
                            />
                        </div>

                        {editandoActividad && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">Estado</label>
                                <CustomSelect value={formActividad.data.activo}
                                    onChange={(val) => formActividad.setData('activo', val)}
                                    options={opcionesEstado} placeholder={null} />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                        <SecondaryButton type="button" onClick={() => setModalActividad(false)} disabled={formActividad.processing}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={formActividad.processing}>
                            {formActividad.processing ? 'Procesando...' : editandoActividad ? 'Guardar Cambios' : 'Crear Actividad'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirms */}
            <ConfirmDialog show={confirmEtapa} title="Desactivar Etapa"
                message={`Desactivar la etapa "${etapaAEliminar?.nombre}"? Debe no tener actividades activas.`}
                confirmText="Si, desactivar" processing={deleting}
                onConfirm={handleDeleteEtapa}
                onCancel={() => { setConfirmEtapa(false); setEtapaAEliminar(null); }} />

            <ConfirmDialog show={confirmActividad} title="Desactivar Actividad"
                message={`Desactivar la actividad "${actividadAEliminar?.nombre}"?`}
                confirmText="Si, desactivar" processing={deleting}
                onConfirm={handleDeleteActividad}
                onCancel={() => { setConfirmActividad(false); setActividadAEliminar(null); }} />

        </AuthenticatedLayout>
    );
}