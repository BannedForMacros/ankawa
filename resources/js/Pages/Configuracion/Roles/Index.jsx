import { useState, useEffect } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Badge from '@/Components/Badge';
import ConfirmDialog from '@/Components/ConfirmDialog'; // 1. Importación del diálogo
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck } from 'lucide-react';

export default function Index({ roles }) {
    const { flash } = usePage().props;

    // Estados de Modales y Edición
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando]   = useState(null);

    // 2. Estados para la eliminación confirmada
    const [confirmOpen, setConfirmOpen]   = useState(false);
    const [rolAEliminar, setRolAEliminar] = useState(null);
    const [deleting, setDeleting]         = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:      '',
        descripcion: '',
        activo:      1,
    });


    // Lógica de Modal Crear/Editar
    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (rol) => {
        setData({
            nombre:      rol.nombre,
            descripcion: rol.descripcion ?? '',
            activo:      rol.activo,
        });
        setEditando(rol);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditando(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editando) {
            put(route('configuracion.roles.update', editando.id), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al actualizar el rol.'),
            });
        } else {
            post(route('configuracion.roles.store'), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al crear el rol.'),
            });
        }
    };

    // 3. Métodos de eliminación con confirmación estética
    const pedirConfirmacion = (rol) => {
        setRolAEliminar(rol);
        setConfirmOpen(true);
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.roles.destroy', rolAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setRolAEliminar(null);
                setDeleting(false);
                // Leer el flash directamente de la respuesta
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => {
                setDeleting(false);
                toast.error('Ocurrió un error al desactivar el rol.');
            },
        });
    };

    const columns = [
        { key: 'id',     label: '#',           sortable: true  },
        { key: 'nombre', label: 'Nombre',      sortable: true  },
        { key: 'descripcion', label: 'Descripción', sortable: false },
        {
            key: 'activo',
            label: 'Estado',
            sortable: true,
            render: (row) => (
                <Badge 
                    status={row.activo ? 'activo' : 'inactivo'} 
                    text={row.activo ? 'Activo' : 'Inactivo'} 
                />
            ),
        },
        {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
                <ActionButtons
                    onEdit={() => abrirEditar(row)}
                    onDelete={() => pedirConfirmacion(row)} // 4. Cambio a confirmación
                />
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-6xl mx-auto">

                {/* Header Principal */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: '#291136' }}>
                            <ShieldCheck size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">Roles</h1>
                            <p className="text-sm text-gray-400 font-medium">Gestión de permisos y acceso al sistema</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={abrirCrear} className="gap-2 shadow-md">
                        <Plus size={18} strokeWidth={2.5} />
                        Nuevo Rol
                    </PrimaryButton>
                </div>

                {/* Tabla */}
                <Table
                    columns={columns}
                    data={roles.data}
                    meta={roles.meta}
                    routeName="configuracion.roles.index"
                    searchPlaceholder="Buscar por nombre o descripción..."
                />
            </div>

            {/* Modal Crear / Editar */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="md">
                <form onSubmit={handleSubmit}>
                    <div className="p-7">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#BE0F4A' }}>
                                <ShieldCheck size={20} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editando ? 'Editar Rol' : 'Nuevo Rol'}
                            </h2>
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Nombre del Rol <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A] transition-all text-[#291136]
                                    ${errors.nombre ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                            />
                            {errors.nombre && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.nombre}</p>}
                        </div>

                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Descripción
                            </label>
                            <textarea
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A] transition-all text-[#291136] resize-none"
                            />
                        </div>

                        {editando && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                    Estado del Registro
                                </label>
                                <select
                                    value={data.activo}
                                    onChange={e => setData('activo', parseInt(e.target.value))}
                                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A] transition-all text-[#291136] cursor-pointer"
                                >
                                    <option value={1}>✅ Activo</option>
                                    <option value={0}>❌ Inactivo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                        <SecondaryButton type="button" onClick={cerrarModal} disabled={processing}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'Procesando...' : editando ? 'Guardar Cambios' : 'Crear Rol'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* 5. Componente ConfirmDialog (Antes del cierre del Layout) */}
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Rol"
                message={`¿Está seguro de desactivar el rol "${rolAEliminar?.nombre}"? Los usuarios vinculados podrían perder acceso.`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setRolAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}