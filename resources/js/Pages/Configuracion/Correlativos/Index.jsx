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
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import { Plus, Hash } from 'lucide-react';

const anioActual = new Date().getFullYear();

const opcionesAnio = Array.from({ length: 6 }, (_, i) => ({
    id:     anioActual - 1 + i,
    nombre: String(anioActual - 1 + i),
}));

const opcionesEstado = [
    { id: 1, nombre: '✅ Activo'   },
    { id: 0, nombre: '❌ Inactivo' },
];

export default function Index({ correlativos }) {

    const [showModal, setShowModal]                   = useState(false);
    const [editando, setEditando]                     = useState(null);
    const [confirmOpen, setConfirmOpen]               = useState(false);
    const [correlativoAEliminar, setCorrelativoAEliminar] = useState(null);
    const [deleting, setDeleting]                     = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        tipo:          '',
        anio:          anioActual,
        ultimo_numero: 0,
        activo:        1,
    });

    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (correlativo) => {
        setData({
            tipo:          correlativo.tipo,
            anio:          correlativo.anio,
            ultimo_numero: correlativo.ultimo_numero,
            activo:        correlativo.activo,
        });
        setEditando(correlativo);
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
            put(route('configuracion.correlativos.update', editando.id), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al actualizar el correlativo.'),
            });
        } else {
            post(route('configuracion.correlativos.store'), {
                preserveScroll: true,
                onSuccess: (page) => {
                    cerrarModal();
                    const msg = page.props.flash?.success;
                    if (msg) toast.success(msg);
                },
                onError: () => toast.error('Error al crear el correlativo.'),
            });
        }
    };

    const pedirConfirmacion = (correlativo) => {
        setCorrelativoAEliminar(correlativo);
        setConfirmOpen(true);
    };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.correlativos.destroy', correlativoAEliminar.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                setConfirmOpen(false);
                setCorrelativoAEliminar(null);
                setDeleting(false);
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => {
                setDeleting(false);
                toast.error('Error al desactivar el correlativo.');
            },
        });
    };

    const columns = [
        { key: 'id',            label: '#',             sortable: true  },
        { key: 'tipo',          label: 'Tipo',          sortable: true  },
        { key: 'anio',          label: 'Año',           sortable: true  },
        { key: 'ultimo_numero', label: 'Último Número', sortable: true  },
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
            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: '#291136' }}>
                            <Hash size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-[#291136] tracking-tight">Correlativos</h1>
                            <p className="text-sm text-gray-400 font-medium">Numeración automática por tipo y año</p>
                        </div>
                    </div>
                    <PrimaryButton onClick={abrirCrear}>
                        <Plus size={18} strokeWidth={2.5} />
                        Nuevo Correlativo
                    </PrimaryButton>
                </div>

                <Table
                    columns={columns}
                    data={correlativos.data}
                    meta={correlativos.meta}
                    routeName="configuracion.correlativos.index"
                    searchPlaceholder="Buscar por tipo o año..."
                />
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="sm">
                <form onSubmit={handleSubmit}>
                    <div className="p-7">

                        {/* Header modal */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: '#BE0F4A' }}>
                                <Hash size={20} className="text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-[#291136]">
                                {editando ? 'Editar Correlativo' : 'Nuevo Correlativo'}
                            </h2>
                        </div>

                        {/* Tipo */}
                        <Input
                            label="Tipo"
                            required
                            type="text"
                            value={data.tipo}
                            onChange={e => setData('tipo', e.target.value.toUpperCase())}
                            placeholder="Ej: EXP, SOL, LAUDO"
                            error={errors.tipo}
                        />

                        {/* Año */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Año <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <CustomSelect
                                value={data.anio}
                                onChange={(val) => setData('anio', val)}
                                options={opcionesAnio}
                                placeholder={null}
                                error={errors.anio}
                            />
                            {errors.anio && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.anio}</p>
                            )}
                        </div>

                        {/* Último número */}
                        <Input
                            label="Último número"
                            required
                            type="number"
                            min="0"
                            value={data.ultimo_numero}
                            onChange={e => setData('ultimo_numero', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            error={errors.ultimo_numero}
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
                            {processing ? 'Procesando...' : editando ? 'Guardar Cambios' : 'Crear Correlativo'}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Confirm Dialog */}
            <ConfirmDialog
                show={confirmOpen}
                title="Desactivar Correlativo"
                message={`¿Desactivar el correlativo "${correlativoAEliminar?.tipo} - ${correlativoAEliminar?.anio}"?`}
                confirmText="Sí, desactivar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirmOpen(false); setCorrelativoAEliminar(null); }}
            />
        </AuthenticatedLayout>
    );
}