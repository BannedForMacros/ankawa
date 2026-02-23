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
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import { Plus, Briefcase } from 'lucide-react';

const opcionesEstado = [
    { id: 1, nombre: '✅ Activo'   },
    { id: 0, nombre: '❌ Inactivo' },
];

export default function Index({ servicios }) {

    const [showModal, setShowModal]               = useState(false);
    const [editando, setEditando]                 = useState(null);
    const [confirmOpen, setConfirmOpen]           = useState(false);
    const [servicioAEliminar, setServicioAEliminar] = useState(null);
    const [deleting, setDeleting]                 = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:      '',
        descripcion: '',
        activo:      1,
    });

    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (servicio) => {
        setData({
            nombre:      servicio.nombre,
            descripcion: servicio.descripcion ?? '',
            activo:      servicio.activo,
        });
        setEditando(servicio);
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
            put(route('configuracion.servicios.update', editando.id), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al actualizar el servicio.'),
            });
        } else {
            post(route('configuracion.servicios.store'), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al crear el servicio.'),
            });
        }
    };

    const pedirConfirmacion = (servicio) => {
        setServicioAEliminar(servicio);
        setConfirmOpen(true);
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.servicios.destroy', servicioAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setServicioAEliminar(null);
                setDeleting(false);
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: (errors) => {
                setDeleting(false);
                const msg = errors?.message ?? 'Error al desactivar el servicio.';
                toast.error(msg);
            },
        });
    };

    const columns = [
        { key: 'id',          label: '#',           sortable: true  },
        { key: 'nombre',      label: 'Nombre',      sortable: true  },
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
                            <Briefcase size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">Servicios</h1>
                            <p className="text-sm text-gray-400 font-medium">Tipos de proceso arbitral disponibles</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={abrirCrear}>
                        <Plus size={18} strokeWidth={2.5} />
                        Nuevo Servicio
                    </PrimaryButton>
                </div>

                <Table
                    columns={columns}
                    data={servicios.data}
                    meta={servicios.meta}
                    routeName="configuracion.servicios.index"
                    searchPlaceholder="Buscar por nombre o descripción..."
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
                                <Briefcase size={20} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editando ? 'Editar Servicio' : 'Nuevo Servicio'}
                            </h2>
                        </div>

                        {/* Nombre */}
                        <Input
                            label="Nombre del servicio"
                            required
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej: Arbitraje de Derecho, Conciliación..."
                            error={errors.nombre}
                        />

                        {/* Descripción */}
                        <Textarea
                            label="Descripción"
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                            placeholder="Describe brevemente este tipo de servicio..."
                            rows={3}
                            error={errors.descripcion}
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
                            {processing ? 'Procesando...' : editando ? 'Guardar Cambios' : 'Crear Servicio'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Servicio"
                message={`¿Desactivar el servicio "${servicioAEliminar?.nombre}"? Verificar que no tenga etapas configuradas.`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setServicioAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}