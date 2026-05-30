import { useState, useEffect, useMemo } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import CustomSelect from '@/Components/CustomSelect';
import Table from '@/Components/Table';
import Badge from '@/Components/Badge';
import { confirmar, confirmarDesactivar, confirmarReactivar } from '@/lib/swalAnkawa';
import { validarZod, requeridos } from '@/lib/validar';

const rolSchema = requeridos({ nombre: 'El nombre del rol es obligatorio.' });
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck } from 'lucide-react';

export default function Index({ roles }) {
    const { flash } = usePage().props;

    // ── Filtro de estado (client-side) ──
    const [estado, setEstado] = useState(1);
    const rolesFiltrados = useMemo(() => (
        estado === '' ? roles : roles.filter(r => Number(r.activo) === Number(estado))
    ), [roles, estado]);
    const filtros = (
        <div className="w-44">
            <CustomSelect value={estado} onChange={setEstado}
                options={[{ id: 1, nombre: 'Activos' }, { id: 0, nombre: 'Inactivos' }]}
                placeholder="Todos los estados" />
        </div>
    );

    // Estados de Modales y Edición
    const [showModal, setShowModal] = useState(false);
    const [editando, setEditando]   = useState(null);

    const { data, setData, post, put, processing, errors, reset, setError, clearErrors } = useForm({
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarZod(rolSchema, data, { setError, clearErrors })) return;
        const ok = await confirmar({
            variant: editando ? 'info' : 'warning',
            titulo:  editando ? `¿Guardar cambios en "${data.nombre}"?` : `¿Crear rol "${data.nombre}"?`,
            mensaje: editando
                ? 'Se actualizará la configuración de este rol. Los permisos asignados se mantendrán.'
                : 'Se registrará como un nuevo rol disponible para asignar a usuarios.',
            detalles: [{ label: 'Rol', value: data.nombre }],
            confirmText: editando ? 'Sí, guardar' : 'Sí, crear',
        });
        if (ok) doSave();
    };

    const doSave = () => {
        const opts = {
            preserveScroll: true,
            onSuccess: (page) => {
                cerrarModal();
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => toast.error(editando ? 'Error al actualizar el rol.' : 'Error al crear el rol.'),
        };
        if (editando) put(route('configuracion.roles.update', editando.id), opts);
        else          post(route('configuracion.roles.store'), opts);
    };

    const pedirReactivar = async (rol) => {
        const ok = await confirmarReactivar({
            titulo: 'Reactivar Rol',
            mensaje: 'El rol volverá a estar disponible para asignar a usuarios.',
            detalle: { label: 'Rol', value: rol.nombre },
        });
        if (!ok) return;
        router.patch(route('configuracion.roles.reactivar', rol.id), {}, {
            preserveScroll: true,
            onSuccess: (page) => { const msg = page.props.flash?.success; if (msg) toast.success(msg); },
            onError: () => toast.error('Error al reactivar el rol.'),
        });
    };

    const pedirConfirmacion = async (rol) => {
        const ok = await confirmarDesactivar({
            titulo: 'Desactivar Rol',
            mensaje: 'Los usuarios vinculados a este rol podrían perder acceso al sistema.',
            detalle: { label: 'Rol', value: rol.nombre },
        });
        if (!ok) return;

        router.delete(route('configuracion.roles.destroy', rol.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => toast.error('Ocurrió un error al desactivar el rol.'),
        });
    };

    const columns = [
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
                    onDelete={row.activo ? () => pedirConfirmacion(row) : undefined}
                    onReactivar={!row.activo ? () => pedirReactivar(row) : undefined}
                />
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <ConfigHeader
                breadcrumb={[
                    { label: 'Inicio', href: route('dashboard') },
                    { label: 'Configuración' },
                    { label: 'Roles' },
                ]}
                title="Roles"
                description="Gestión de permisos y acceso al sistema."
                action={{ label: 'Nuevo Rol', onClick: abrirCrear, icon: Plus }}
            />
            <div className="p-6 max-w-6xl mx-auto">

                {/* Tabla */}
                <Table
                    columns={columns}
                    data={rolesFiltrados}
                    clientSide
                    perPage={15}
                    searchKeys={['nombre', 'descripcion']}
                    filters={filtros}
                    searchPlaceholder="Buscar por nombre o descripción..."
                />
            </div>

            {/* Modal Crear / Editar */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="md">
                <form onSubmit={handleSubmit} noValidate>
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

        </AuthenticatedLayout>
    );
}