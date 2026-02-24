import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Badge from '@/Components/Badge';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import { FastForward, Plus, Pencil, Trash2, GitBranch } from 'lucide-react';

const opcionesEstado = [
    { id: 1, nombre: 'Activo'   },
    { id: 0, nombre: 'Inactivo' },
];

export default function AccionesIndex({ acciones }) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editando, setEditando]   = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        nombre: '',
        color_hex: '#291136',
        activo: 1,
    });

    const abrirCrear = () => {
        clearErrors();
        reset();
        setEditando(null);
        setModalOpen(true);
    };

    const abrirEditar = (item) => {
        clearErrors();
        setData({
            nombre: item.nombre,
            color_hex: item.color_hex || '#291136',
            activo: item.activo,
        });
        setEditando(item);
        setModalOpen(true);
    };

    const submit = (e) => {
        e.preventDefault();
        const route_name = editando 
            ? route('configuracion.acciones.update', editando.id)
            : route('configuracion.acciones.store');
            
        const method = editando ? put : post;

        method(route_name, {
            preserveScroll: true,
            onSuccess: (page) => {
                setModalOpen(false);
                setEditando(null);
                reset();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Ocurrió un error al guardar.'),
        });
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.acciones.destroy', itemAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setItemAEliminar(null);
                setDeleting(false);
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error) toast.error(page.props.flash.error);
            },
            onError: () => {
                setDeleting(false);
                toast.error('Error al desactivar el registro.');
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#BE0F4A' }}>
                            <FastForward size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">
                                Catálogo de Acciones
                            </h1>
                            <p className="text-sm text-gray-400 font-medium">
                                Acciones visuales base para configurar las transiciones
                            </p>
                        </div>
                    </div>
                    <PrimaryButton onClick={abrirCrear}>
                        <Plus size={18} strokeWidth={2.5} />
                        Nueva Acción
                    </PrimaryButton>
                </div>

                {/* Lista */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {acciones.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FastForward size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No hay acciones registradas.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {acciones.map((accion) => (
                                <div key={accion.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            {/* Indicador de Color */}
                                            <div className="w-4 h-4 rounded-full shadow-inner border border-black/10" 
                                                 style={{ backgroundColor: accion.color_hex }}></div>
                                            
                                            <p className="font-bold text-[#291136]">{accion.nombre}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 pl-7">
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <GitBranch size={12} />
                                                Usada en {accion.transiciones_count} botones de transición
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge status={accion.activo ? 'activo' : 'inactivo'} text={accion.activo ? 'Activo' : 'Inactivo'} />
                                        
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => abrirEditar(accion)}
                                                className="p-2 rounded-lg text-[#BE0F4A]/70 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors"
                                                title="Editar">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => { setItemAEliminar(accion); setConfirmOpen(true); }}
                                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Desactivar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Formulario */}
            <Modal show={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm">
                <form onSubmit={submit}>
                    <div className="p-7">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#BE0F4A' }}>
                                <FastForward size={18} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editando ? 'Editar Acción' : 'Nueva Acción'}
                            </h2>
                        </div>

                        <Input label="Nombre de la Acción" required type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej: Aprobar, Finalizar, Derivar..."
                            error={errors.nombre} />
                        
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Color del Botón
                            </label>
                            <div className="flex items-center gap-3">
                                <input type="color" 
                                    className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                                    value={data.color_hex}
                                    onChange={e => setData('color_hex', e.target.value)}
                                />
                                <Input type="text" 
                                    value={data.color_hex}
                                    onChange={e => setData('color_hex', e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1 !mb-0"
                                    error={errors.color_hex} />
                            </div>
                        </div>

                        {editando && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">Estado</label>
                                <CustomSelect value={data.activo}
                                    onChange={(val) => setData('activo', val)}
                                    options={opcionesEstado} placeholder={null} />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                        <SecondaryButton type="button" onClick={() => setModalOpen(false)} disabled={processing}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Acción'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal Confirmación */}
            <ConfirmDialog show={confirmOpen} title="Desactivar Acción"
                message={`¿Estás seguro de desactivar "${itemAEliminar?.nombre}"?`}
                confirmText="Sí, desactivar" processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setItemAEliminar(null); }} />
        </AuthenticatedLayout>
    );
}