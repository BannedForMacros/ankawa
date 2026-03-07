import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import toast from 'react-hot-toast';
import {
    GitBranch, Trash2, ArrowRight, Pencil, Bell,
    X, Users, FileText, Plus, AlertCircle, Edit3, Lock
} from 'lucide-react';

const opcionesSiNo = [
    { id: 1, nombre: 'Sí' },
    { id: 0, nombre: 'No' },
];

// ── Sub-componente: configurador de actores a designar ──
function ActoresDesignablesEditor({ tiposActor, actores, onChange }) {
    const tiposDisponibles = tiposActor.filter(
        ta => !actores.some(a => a.tipo_actor_id === ta.id)
    );

    const agregarActor = () => {
        if (tiposDisponibles.length === 0) return;
        onChange([...actores, { tipo_actor_id: tiposDisponibles[0].id, es_obligatorio: true }]);
    };

    const quitarActor = (idx) => onChange(actores.filter((_, i) => i !== idx));

    const cambiar = (idx, campo, valor) => {
        const nuevo = actores.map((a, i) => i === idx ? { ...a, [campo]: valor } : a);
        onChange(nuevo);
    };

    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#BE0F4A] flex items-center gap-1">
                    <Users size={12} /> Actores a designar al ejecutar esta acción
                </label>
                <button
                    type="button"
                    onClick={agregarActor}
                    disabled={tiposDisponibles.length === 0}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#291136] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={11} /> Agregar actor
                </button>
            </div>

            {actores.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">
                    Sin actores — la acción no pedirá designar a nadie.
                </p>
            ) : (
                actores.map((actor, idx) => {
                    const opcionesActor = tiposActor
                        .filter(ta => ta.id === actor.tipo_actor_id || !actores.some((a, i) => i !== idx && a.tipo_actor_id === ta.id))
                        .map(ta => ({ id: ta.id, nombre: ta.nombre }));

                    return (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex-1">
                                <CustomSelect
                                    value={actor.tipo_actor_id}
                                    onChange={v => cambiar(idx, 'tipo_actor_id', v)}
                                    options={opcionesActor}
                                    placeholder={null}
                                />
                            </div>
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={() => cambiar(idx, 'es_obligatorio', !actor.es_obligatorio)}
                                    className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-colors ${
                                        actor.es_obligatorio
                                            ? 'bg-red-100 text-red-700 border-red-200'
                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                    }`}
                                >
                                    {actor.es_obligatorio ? 'Obligatorio' : 'Opcional'}
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => quitarActor(idx)}
                                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default function ModalTransiciones({
    show,
    onClose,
    actividad,
    acciones = [],
    tiposActor = [],
    tiposDocumento = [],
    todasActividades = [],
}) {
    const [transicionEditando, setTransicionEditando] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        catalogo_accion_id:       '',
        etiqueta_boton:           '',
        actividad_destino_id:     '',
        tipo_documento_id:        '',
        requisito_documento_id:   '',
        requiere_documento:       0,
        permite_documento:        1,
        requiere_observacion:     0,
        permite_editar_solicitud: false,
        actores_designables:      [],
    });

    if (!actividad) return null;

    const opcionesAcciones  = acciones.map(a => ({ id: a.id, nombre: a.nombre }));
    const opcionesDestino   = todasActividades.map(a => ({ id: a.id, nombre: a.nombre_completo }));
    const opcionesDocumento = [
        { id: '', nombre: '-- Sin tipo específico --' },
        ...tiposDocumento.map(d => ({ id: d.id, nombre: d.nombre })),
    ];

    const cancelarEdicion = () => {
        setTransicionEditando(null);
        reset();
        clearErrors();
    };

    const abrirEditar = (t) => {
        clearErrors();
        setTransicionEditando(t);
        setData({
            catalogo_accion_id:       t.catalogo_accion_id,
            etiqueta_boton:           t.etiqueta_boton,
            actividad_destino_id:     t.actividad_destino_id,
            tipo_documento_id:        t.tipo_documento_id ?? '',
            requisito_documento_id:   t.requisito_documento_id ?? '',
            requiere_documento:       t.requiere_documento,
            permite_documento:        t.permite_documento,
            requiere_observacion:     t.requiere_observacion,
            permite_editar_solicitud: t.permite_editar_solicitud ?? false,
            actores_designables:      (t.actores_designables ?? []).map(a => ({
                tipo_actor_id:  a.tipo_actor_id,
                es_obligatorio: !!a.es_obligatorio,
            })),
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const routeName = transicionEditando
            ? route('transiciones.update', transicionEditando.id)
            : route('transiciones.store', actividad.id);
        const method = transicionEditando ? put : post;
        method(routeName, {
            preserveScroll: true,
            onSuccess: (page) => {
                cancelarEdicion();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Error al guardar la transición'),
        });
    };

    const handleDelete = (transicionId) => {
        if (!confirm('¿Eliminar este botón? Los expedientes no podrán usarlo más.')) return;
        router.delete(route('transiciones.destroy', transicionId), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (transicionEditando?.id === transicionId) cancelarEdicion();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
        });
    };

    return (
        <Modal show={show} onClose={() => { cancelarEdicion(); onClose(); }} maxWidth="2xl">
            <div className="p-7 max-h-[90vh] overflow-y-auto">

                {/* Cabecera */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#291136]">
                            <GitBranch size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#291136]">Flujo y Botones</h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Actividad: <span className="text-[#BE0F4A]">{actividad.nombre}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Lista de Transiciones Existentes */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80 mb-3">
                        Botones Configurados
                    </h3>

                    {(!actividad.transiciones || actividad.transiciones.length === 0) ? (
                        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-400 border border-dashed border-gray-200 flex items-center justify-center gap-2">
                            <AlertCircle size={15} />
                            No hay botones. El expediente se detendrá aquí.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {actividad.transiciones.map(t => (
                                <div key={t.id} className={`flex items-start justify-between p-3 border rounded-xl shadow-sm transition-all
                                    ${transicionEditando?.id === t.id
                                        ? 'border-[#BE0F4A] bg-[#BE0F4A]/5'
                                        : 'bg-white border-gray-200'}`}>

                                    <div className="flex-1 min-w-0">
                                        {/* Botón → Destino */}
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
                                                style={{ backgroundColor: t.accion_catalogo?.color_hex || '#291136' }}>
                                                {t.etiqueta_boton}
                                            </span>
                                            <ArrowRight size={14} className="text-gray-400 shrink-0" />
                                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[180px]"
                                                title={t.actividad_destino?.nombre}>
                                                {t.actividad_destino?.nombre}
                                            </span>
                                        </div>

                                        {/* Badges de configuración */}
                                        <div className="flex gap-1.5 text-[10px] flex-wrap">
                                            {t.actores_designables?.length > 0 && (
                                                <span className="bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Users size={10} />
                                                    {t.actores_designables.length} actor{t.actores_designables.length > 1 ? 'es' : ''}
                                                </span>
                                            )}
                                            {t.tipo_documento && (
                                                <span className="bg-purple-50 border border-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <FileText size={10} /> {t.tipo_documento.nombre}
                                                </span>
                                            )}
                                            {t.requisito_documento && (
                                                <span className="bg-orange-50 border border-orange-100 text-orange-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Lock size={10} /> Bloqueado por: {t.requisito_documento.nombre}
                                                </span>
                                            )}
                                            {t.requiere_documento === 1 && (
                                                <span className="bg-red-50 border border-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <FileText size={10} /> Exige PDF
                                                </span>
                                            )}
                                            {t.requiere_observacion === 1 && (
                                                <span className="bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                                                    Exige Texto
                                                </span>
                                            )}
                                            {t.permite_editar_solicitud && (
                                                <span className="bg-green-50 border border-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    <Edit3 size={10} /> Edita Solicitud
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-2 shrink-0">
                                        <button
                                            onClick={() => alert('Pronto: configurar emails automáticos.')}
                                            className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                                            title="Configurar Notificaciones"
                                        >
                                            <Bell size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => abrirEditar(t)}
                                            className="p-1.5 text-[#291136] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(t.id)}
                                            className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulario */}
                <div className={`p-5 rounded-2xl border transition-all ${transicionEditando ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80">
                            {transicionEditando ? 'Editando Botón' : 'Agregar Nuevo Botón'}
                        </h3>
                        {transicionEditando && (
                            <button type="button" onClick={cancelarEdicion} className="text-xs text-blue-600 font-bold hover:underline">
                                Cancelar edición
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Acción + Etiqueta */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-1">Tipo de Acción</label>
                                <CustomSelect
                                    value={data.catalogo_accion_id}
                                    onChange={v => setData('catalogo_accion_id', v)}
                                    options={opcionesAcciones}
                                    placeholder="-- Seleccione --"
                                />
                                {errors.catalogo_accion_id && <p className="text-xs text-red-500 mt-1">{errors.catalogo_accion_id}</p>}
                            </div>
                            <div>
                                <Input
                                    label="Etiqueta del Botón"
                                    required
                                    type="text"
                                    value={data.etiqueta_boton}
                                    onChange={e => setData('etiqueta_boton', e.target.value)}
                                    placeholder="Ej: Aprobar Solicitud"
                                    className="!mb-0"
                                />
                                {errors.etiqueta_boton && <p className="text-xs text-red-500 mt-1">{errors.etiqueta_boton}</p>}
                            </div>
                        </div>

                        {/* Destino */}
                        <div>
                            <label className="block text-xs font-bold text-[#291136] mb-1">
                                Destino (¿A qué actividad se mueve el expediente?)
                            </label>
                            <CustomSelect
                                value={data.actividad_destino_id}
                                onChange={v => setData('actividad_destino_id', v)}
                                options={opcionesDestino}
                                placeholder="-- Siguiente Actividad --"
                            />
                            {errors.actividad_destino_id && <p className="text-xs text-red-500 mt-1">{errors.actividad_destino_id}</p>}
                        </div>

                        {/* Actores a designar */}
                        <ActoresDesignablesEditor
                            tiposActor={tiposActor}
                            actores={data.actores_designables}
                            onChange={v => setData('actores_designables', v)}
                        />

                        {/* Documentos */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Exige Subir PDF?</label>
                                <CustomSelect value={data.requiere_documento} onChange={v => setData('requiere_documento', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Permite Subir PDF?</label>
                                <CustomSelect value={data.permite_documento} onChange={v => setData('permite_documento', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Exige Motivo/Texto?</label>
                                <CustomSelect value={data.requiere_observacion} onChange={v => setData('requiere_observacion', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                        </div>

                        {/* Tipo de documento esperado */}
                        <div>
                            <label className="block text-xs font-bold text-[#291136] mb-1">
                                Tipo de documento esperado (si aplica)
                            </label>
                            <CustomSelect
                                value={data.tipo_documento_id}
                                onChange={v => setData('tipo_documento_id', v)}
                                options={opcionesDocumento}
                                placeholder={null}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Clasifica automáticamente el PDF que se adjunte en este paso.
                            </p>
                        </div>

                        {/* Requisito de documento que desbloquea este botón */}
                        {actividad.requisitos_documento?.length > 0 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                                <label className="block text-xs font-bold text-orange-800 mb-1 flex items-center gap-1">
                                    <Lock size={11} /> Bloquear botón hasta subir documento
                                </label>
                                <CustomSelect
                                    value={data.requisito_documento_id}
                                    onChange={v => setData('requisito_documento_id', v)}
                                    options={[
                                        { id: '', nombre: '— Sin bloqueo —' },
                                        ...actividad.requisitos_documento.map(r => ({ id: r.id, nombre: r.nombre })),
                                    ]}
                                    placeholder={null}
                                />
                                <p className="text-[10px] text-orange-700 mt-1">
                                    El botón aparecerá deshabilitado hasta que el slot seleccionado tenga un archivo subido.
                                </p>
                            </div>
                        )}

                        {/* Permite editar solicitud */}
                        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                            <input
                                id="permite_editar_solicitud"
                                type="checkbox"
                                checked={!!data.permite_editar_solicitud}
                                onChange={e => setData('permite_editar_solicitud', e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded accent-[#291136] cursor-pointer"
                            />
                            <label htmlFor="permite_editar_solicitud" className="cursor-pointer flex-1">
                                <span className="text-xs font-bold text-[#291136] flex items-center gap-1">
                                    <Edit3 size={12} /> Permite editar datos de la solicitud
                                </span>
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                    Al ejecutar esta acción (Ej: Subsanar), el usuario podrá modificar los datos del demandante, demandado y documentos originales del expediente.
                                </p>
                            </label>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : transicionEditando ? 'Guardar Cambios' : 'Agregar Botón'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

            </div>
        </Modal>
    );
}
