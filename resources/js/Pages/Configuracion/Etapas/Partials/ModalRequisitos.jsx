import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import toast from 'react-hot-toast';
import { FolderOpen, Plus, Pencil, Trash2, X, AlertCircle, CheckCircle2, Circle } from 'lucide-react';

const opcionesSiNo = [
    { id: true,  nombre: 'Sí, es obligatorio' },
    { id: false, nombre: 'No, es opcional'    },
];

export default function ModalRequisitos({ show, onClose, actividad, tiposDocumento = [] }) {
    const [editando, setEditando] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        nombre:            '',
        descripcion:       '',
        tipo_documento_id: '',
        es_obligatorio:    true,
        orden:             1,
    });

    if (!actividad) return null;

    const opcionesDocumento = [
        { id: '', nombre: '-- Sin tipo específico --' },
        ...tiposDocumento.map(d => ({ id: d.id, nombre: d.nombre })),
    ];

    const siguienteOrden = () => (actividad.requisitos_documento?.length ?? 0) + 1;

    const cancelar = () => {
        setEditando(null);
        reset();
        clearErrors();
    };

    const abrirEditar = (req) => {
        clearErrors();
        setEditando(req);
        setData({
            nombre:            req.nombre,
            descripcion:       req.descripcion ?? '',
            tipo_documento_id: req.tipo_documento_id ?? '',
            es_obligatorio:    !!req.es_obligatorio,
            orden:             req.orden,
        });
    };

    const abrirNuevo = () => {
        clearErrors();
        setEditando(null);
        setData({
            nombre:            '',
            descripcion:       '',
            tipo_documento_id: '',
            es_obligatorio:    true,
            orden:             siguienteOrden(),
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const routeName = editando
            ? route('configuracion.requisitos.update', editando.id)
            : route('configuracion.requisitos.store', actividad.id);
        const method = editando ? put : post;
        method(routeName, {
            preserveScroll: true,
            onSuccess: (page) => {
                cancelar();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Error al guardar el requisito'),
        });
    };

    const handleDelete = (reqId) => {
        if (!confirm('¿Desactivar este requisito?')) return;
        router.delete(route('configuracion.requisitos.destroy', reqId), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (editando?.id === reqId) cancelar();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
        });
    };

    const requisitos = actividad.requisitos_documento ?? [];

    return (
        <Modal show={show} onClose={() => { cancelar(); onClose(); }} maxWidth="xl">
            <div className="p-7 max-h-[90vh] overflow-y-auto">

                {/* Cabecera */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-600">
                            <FolderOpen size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#291136]">Documentos Requeridos</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Actividad: <span className="text-[#BE0F4A] font-semibold">{actividad.nombre}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Lista actual */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80">
                            Slots configurados
                        </h3>
                        <button
                            type="button"
                            onClick={abrirNuevo}
                            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            <Plus size={13} /> Agregar slot
                        </button>
                    </div>

                    {requisitos.length === 0 ? (
                        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-400 border border-dashed border-gray-200 flex items-center justify-center gap-2">
                            <AlertCircle size={15} />
                            Sin slots. El usuario podrá subir documentos libremente.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {requisitos.map((req) => (
                                <div key={req.id}
                                    className={`flex items-center justify-between p-3 border rounded-xl transition-all
                                        ${editando?.id === req.id
                                            ? 'border-purple-400 bg-purple-50'
                                            : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                                            {req.orden}
                                        </span>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-[#291136]">{req.nombre}</p>
                                                {req.es_obligatorio
                                                    ? <span className="inline-flex items-center gap-1 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                                                        <CheckCircle2 size={10} /> Obligatorio
                                                      </span>
                                                    : <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                                                        <Circle size={10} /> Opcional
                                                      </span>
                                                }
                                                {req.tipo_documento && (
                                                    <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                                                        {req.tipo_documento.nombre}
                                                    </span>
                                                )}
                                            </div>
                                            {req.descripcion && (
                                                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{req.descripcion}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 pl-2 ml-2 border-l border-gray-200 shrink-0">
                                        <button type="button" onClick={() => abrirEditar(req)}
                                            className="p-1.5 text-[#291136] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                            <Pencil size={13} />
                                        </button>
                                        <button type="button" onClick={() => handleDelete(req.id)}
                                            className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulario */}
                <div className={`p-5 rounded-2xl border transition-all ${editando ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80">
                            {editando ? 'Editando slot' : 'Nuevo slot de documento'}
                        </h3>
                        {editando && (
                            <button type="button" onClick={cancelar} className="text-xs text-purple-600 font-bold hover:underline">
                                Cancelar edición
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <Input
                                    label="Nombre del documento solicitado"
                                    required
                                    type="text"
                                    value={data.nombre}
                                    onChange={e => setData('nombre', e.target.value)}
                                    placeholder="Ej: Escrito de Demanda, Poder Notarial..."
                                    className="!mb-0"
                                />
                                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-1">Tipo de documento</label>
                                <CustomSelect
                                    value={data.tipo_documento_id}
                                    onChange={v => setData('tipo_documento_id', v)}
                                    options={opcionesDocumento}
                                    placeholder={null}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-1">¿Es obligatorio?</label>
                                <CustomSelect
                                    value={data.es_obligatorio}
                                    onChange={v => setData('es_obligatorio', v)}
                                    options={opcionesSiNo}
                                    placeholder={null}
                                />
                            </div>

                            <div className="col-span-2">
                                <Input
                                    label="Instrucción al usuario (opcional)"
                                    type="text"
                                    value={data.descripcion}
                                    onChange={e => setData('descripcion', e.target.value)}
                                    placeholder="Ej: Debe estar firmado y con sello notarial"
                                    className="!mb-0"
                                />
                            </div>

                            <div>
                                <Input
                                    label="Orden"
                                    required
                                    type="number"
                                    min="1"
                                    value={data.orden}
                                    onChange={e => setData('orden', parseInt(e.target.value) || 1)}
                                    className="!mb-0"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-gray-200">
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Agregar Slot'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>

            </div>
        </Modal>
    );
}
