import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import Badge from '@/Components/Badge';
import CustomSelect from '@/Components/CustomSelect';
import PasswordInput from '@/Components/PasswordInput';
import Input from '@/Components/Input';
import toast from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';

export default function Index({ usuarios, roles }) {

    const [showModal, setShowModal]               = useState(false);
    const [editando, setEditando]                 = useState(null);
    const [confirmOpen, setConfirmOpen]           = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
    const [deleting, setDeleting]                 = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        rol_id:                '',
        activo:                1,
    });

    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (usuario) => {
        setData({
            name:                  usuario.name,
            email:                 usuario.email,
            password:              '',
            password_confirmation: '',
            rol_id:                usuario.rol_id,
            activo:                usuario.activo,
        });
        setEditando(usuario);
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
            put(route('configuracion.usuarios.update', editando.id), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al actualizar el usuario.'),
            });
        } else {
            post(route('configuracion.usuarios.store'), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al crear el usuario.'),
            });
        }
    };

    const pedirConfirmacion = (usuario) => {
        setUsuarioAEliminar(usuario);
        setConfirmOpen(true);
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.usuarios.destroy', usuarioAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setUsuarioAEliminar(null);
                setDeleting(false);
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => {
                setDeleting(false);
                toast.error('Error al desactivar el usuario.');
            },
        });
    };

    const opcionesEstado = [
        { id: 1, nombre: '✅ Activo'   },
        { id: 0, nombre: '❌ Inactivo' },
    ];

    const columns = [
        { key: 'id',    label: '#',      sortable: true },
        { key: 'name',  label: 'Nombre', sortable: true },
        { key: 'email', label: 'Correo', sortable: true },
        {
            key: 'rol',
            label: 'Rol',
            sortable: false,
            render: (row) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#291136]/10 text-[#291136]">
                    {row.rol?.nombre ?? '—'}
                </span>
            ),
        },
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
                    onDelete={() => pedirConfirmacion(row)}
                />
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="p-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: '#291136' }}>
                            <Users size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">Usuarios</h1>
                            <p className="text-sm text-gray-400 font-medium">Gestión de accesos al sistema</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={abrirCrear}>
                        <Plus size={18} strokeWidth={2.5} />
                        Nuevo Usuario
                    </PrimaryButton>
                </div>

                <Table
                    columns={columns}
                    data={usuarios.data}
                    meta={usuarios.meta}
                    routeName="configuracion.usuarios.index"
                    searchPlaceholder="Buscar por nombre o correo..."
                />
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="md">
                <form onSubmit={handleSubmit}>
                    <div className="p-7">

                        {/* Header modal */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#BE0F4A' }}>
                                <Users size={20} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                        </div>

                        {/* Nombre */}
                        <Input
                            label="Nombre completo"
                            required
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="Ej: Juan Pérez"
                            error={errors.name}
                        />

                        {/* Email */}
                        <Input
                            label="Correo electrónico"
                            required
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="correo@ejemplo.com"
                            error={errors.email}
                        />

                        {/* Rol */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Rol <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <CustomSelect
                                value={data.rol_id}
                                onChange={(val) => setData('rol_id', val)}
                                options={roles}
                                placeholder="-- Selecciona un rol --"
                                error={errors.rol_id}
                            />
                            {errors.rol_id && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.rol_id}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <PasswordInput
                            label={editando ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
                            required={!editando}
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            error={errors.password}
                        />

                        {/* Confirmar contraseña */}
                        <PasswordInput
                            label="Confirmar contraseña"
                            required={!editando}
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            placeholder="Repite la contraseña"
                            error={errors.password_confirmation}
                        />

                        {/* Estado — solo editar */}
                        {editando && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                    Estado
                                </label>
                                <CustomSelect
                                    value={data.activo}
                                    onChange={(val) => setData('activo', val)}
                                    options={opcionesEstado}
                                    placeholder={null}
                                />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                        <SecondaryButton type="button" onClick={cerrarModal} disabled={processing}>
                            Cancelar
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            {processing ? 'Procesando...' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Usuario"
                message={`¿Desactivar al usuario "${usuarioAEliminar?.name}"? No podrá ingresar al sistema.`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setUsuarioAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}