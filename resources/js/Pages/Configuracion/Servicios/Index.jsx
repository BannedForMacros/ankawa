import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import Table from '@/Components/Table';
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { confirmar, confirmarDesactivar, confirmarReactivar } from '@/lib/swalAnkawa';
import { validarZod } from '@/lib/validar';
import { z } from 'zod';

// Esquema de validación (cliente). El servidor sigue siendo la verdad.
// Refleja ServicioController: nombre required|string|max:255,
// descripcion nullable|string, plazo_*_dias nullable|integer|min:1|max:365.
const servicioSchema = z.object({
    nombre:                    z.any(),
    descripcion:               z.any(),
    plazo_subsanacion_dias:    z.any(),
    plazo_apersonamiento_dias: z.any(),
}).superRefine((d, ctx) => {
    const nombre = String(d.nombre ?? '').trim();
    if (nombre === '')
        ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'El nombre del servicio es obligatorio.' });
    else if (nombre.length > 255)
        ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'No debe exceder los 255 caracteres.' });

    for (const campo of ['plazo_subsanacion_dias', 'plazo_apersonamiento_dias']) {
        const raw = d[campo];
        if (raw === '' || raw == null) continue; // nullable
        const n = Number(raw);
        if (!Number.isInteger(n))
            ctx.addIssue({ code: 'custom', path: [campo], message: 'Debe ser un número entero.' });
        else if (n < 1 || n > 365)
            ctx.addIssue({ code: 'custom', path: [campo], message: 'Debe estar entre 1 y 365 días.' });
    }
});
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

    // ── Filtro de estado (client-side) ──
    const [estado, setEstado] = useState(1);
    const serviciosFiltrados = useMemo(() => (
        estado === '' ? servicios : servicios.filter(s => Number(s.activo) === Number(estado))
    ), [servicios, estado]);
    const filtros = (
        <div className="w-44">
            <CustomSelect value={estado} onChange={setEstado}
                options={[{ id: 1, nombre: 'Activos' }, { id: 0, nombre: 'Inactivos' }]}
                placeholder="Todos los estados" />
        </div>
    );

    const [showModal, setShowModal]               = useState(false);
    const [editando, setEditando]                 = useState(null);

    const { data, setData, post, put, processing, errors, reset, setError, clearErrors } = useForm({
        nombre:                    '',
        descripcion:               '',
        activo:                    1,
        plazo_subsanacion_dias:    5,
        plazo_apersonamiento_dias: 5,
    });

    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (servicio) => {
        setData({
            nombre:                    servicio.nombre,
            descripcion:               servicio.descripcion ?? '',
            activo:                    servicio.activo,
            plazo_subsanacion_dias:    servicio.plazo_subsanacion_dias ?? 5,
            plazo_apersonamiento_dias: servicio.plazo_apersonamiento_dias ?? 5,
        });
        setEditando(servicio);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditando(null);
        reset();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarZod(servicioSchema, data, { setError, clearErrors })) return;
        const ok = await confirmar({
            variant: editando ? 'info' : 'warning',
            titulo:  editando ? `¿Guardar cambios en "${data.nombre}"?` : `¿Crear servicio "${data.nombre}"?`,
            mensaje: editando
                ? 'Se actualizarán los datos de este servicio.'
                : 'Se registrará como un nuevo servicio disponible en el sistema.',
            detalles: [{ label: 'Servicio', value: data.nombre }],
            confirmText: editando ? 'Sí, guardar' : 'Sí, crear',
        });
        if (!ok) return;

        const opts = {
            preserveScroll: true,
            onSuccess: (page) => {
                cerrarModal();
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => toast.error(editando ? 'Error al actualizar el servicio.' : 'Error al crear el servicio.'),
        };
        if (editando) put(route('configuracion.servicios.update', editando.id), opts);
        else          post(route('configuracion.servicios.store'), opts);
    };

    const pedirReactivar = async (servicio) => {
        const ok = await confirmarReactivar({
            titulo: 'Reactivar Servicio',
            mensaje: 'El servicio volverá a estar disponible en el sistema.',
            detalle: { label: 'Servicio', value: servicio.nombre },
        });
        if (!ok) return;
        router.patch(route('configuracion.servicios.reactivar', servicio.id), {}, {
            preserveScroll: true,
            onSuccess: (page) => { const msg = page.props.flash?.success; if (msg) toast.success(msg); },
            onError: () => toast.error('Error al reactivar el servicio.'),
        });
    };

    const pedirConfirmacion = async (servicio) => {
        const ok = await confirmarDesactivar({
            titulo: 'Desactivar Servicio',
            mensaje: 'No se podrá desactivar si tiene etapas configuradas. Podrás reactivarlo cuando quieras.',
            detalle: { label: 'Servicio', value: servicio.nombre },
        });
        if (!ok) return;

        router.delete(route('configuracion.servicios.destroy', servicio.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: (errors) => toast.error(errors?.message ?? 'Error al desactivar el servicio.'),
        });
    };

    const columns = [
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
                    { label: 'Servicios' },
                ]}
                title="Servicios"
                description="Tipos de proceso arbitral disponibles."
                action={{ label: 'Nuevo Servicio', onClick: abrirCrear, icon: Plus }}
            />
            <div className="p-6 max-w-6xl mx-auto">

                <Table
                    columns={columns}
                    data={serviciosFiltrados}
                    clientSide
                    perPage={15}
                    searchKeys={['nombre', 'descripcion']}
                    filters={filtros}
                    searchPlaceholder="Buscar por nombre o descripción..."
                />
            </div>

            {/* Modal */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="md">
                <form onSubmit={handleSubmit} noValidate>
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

                        {/* Plazos configurables */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Plazo subsanación (días)"
                                type="number"
                                min="1"
                                max="365"
                                value={data.plazo_subsanacion_dias}
                                onChange={e => setData('plazo_subsanacion_dias', e.target.value)}
                                error={errors.plazo_subsanacion_dias}
                            />
                            <Input
                                label="Plazo apersonamiento (días)"
                                type="number"
                                min="1"
                                max="365"
                                value={data.plazo_apersonamiento_dias}
                                onChange={e => setData('plazo_apersonamiento_dias', e.target.value)}
                                error={errors.plazo_apersonamiento_dias}
                            />
                        </div>

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

        </AuthenticatedLayout>
    );
}