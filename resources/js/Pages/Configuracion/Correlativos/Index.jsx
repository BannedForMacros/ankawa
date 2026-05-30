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
import { validarZod, requeridos } from '@/lib/validar';

const correlativoSchema = requeridos({
    tipo_correlativo_id: 'Selecciona un tipo de correlativo.',
    anio: 'El año es obligatorio.',
});
import Badge from '@/Components/Badge';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import toast from 'react-hot-toast';
import { Plus, Hash } from 'lucide-react';

// Helper: aplica el patrón configurable (tipos_correlativo.formato) a valores reales.
// Lo usa solo la columna "Próximo número" para mostrar exactamente lo que generará el backend.
function aplicarFormato(formato, { prefijo, anio, codigoServicio, ultimoNumero }) {
    if (!formato) return '';
    let resultado = formato.replace(/\{NUMERO(?::(\d+))?\}/g, (_, n) => {
        const pad = n ? parseInt(n, 10) : 1;
        return String(ultimoNumero ?? 1).padStart(pad, '0');
    });
    return resultado
        .replaceAll('{PREFIJO}',  (prefijo ?? '').trim())
        .replaceAll('{ANIO}',     String(anio ?? new Date().getFullYear()))
        .replaceAll('{SERVICIO}', codigoServicio ?? '')
        .replaceAll('{CENTRO}',   'CARD ANKAWA');
}

const anioActual = new Date().getFullYear();

const opcionesAnio = Array.from({ length: 6 }, (_, i) => ({
    id:     anioActual - 1 + i,
    nombre: String(anioActual - 1 + i),
}));

const opcionesEstado = [
    { id: true,  nombre: '✅ Activo'   },
    { id: false, nombre: '❌ Inactivo' },
];

export default function Index({ correlativos, tiposCorrelativo = [], servicios = [] }) {

    const [showModal, setShowModal]                       = useState(false);
    const [editando, setEditando]                         = useState(null);

    const opcionesTipo     = tiposCorrelativo.map(t => ({ id: t.id, nombre: t.nombre }));
    const opcionesServicio = [
        { id: '', nombre: '— Global (sin servicio) —' },
        ...servicios.map(s => ({ id: s.id, nombre: s.nombre })),
    ];

    // ── Filtros (client-side): servicio + tipo ──
    const [estado, setEstado]                 = useState(1); // por defecto solo activos
    const [servicioFiltro, setServicioFiltro] = useState('');
    const [tipoFiltro, setTipoFiltro]         = useState('');
    const correlativosFiltrados = useMemo(() => {
        const sid = servicioFiltro !== '' ? Number(servicioFiltro) : null;
        const tid = tipoFiltro !== '' ? Number(tipoFiltro) : null;
        return correlativos
            .filter(c => {
                if (estado !== '' && Number(c.activo) !== Number(estado)) return false;
                if (sid !== null && c.servicio_id !== sid) return false;
                if (tid !== null && c.tipo_correlativo_id !== tid) return false;
                return true;
            })
            .map(c => ({
                ...c,
                _buscar: `${c.tipo_correlativo?.nombre ?? ''} ${c.servicio?.nombre ?? ''} ${c.codigo_servicio ?? ''} ${c.anio ?? ''}`,
            }));
    }, [correlativos, estado, servicioFiltro, tipoFiltro]);
    const filtros = (
        <>
            <div className="w-44">
                <CustomSelect value={estado} onChange={setEstado}
                    options={[{ id: 1, nombre: 'Activos' }, { id: 0, nombre: 'Inactivos' }]}
                    placeholder="Todos los estados" />
            </div>
            <div className="w-48">
                <CustomSelect value={servicioFiltro} onChange={setServicioFiltro}
                    options={servicios.map(s => ({ id: s.id, nombre: s.nombre }))}
                    placeholder="Todos los servicios" />
            </div>
            <div className="w-48">
                <CustomSelect value={tipoFiltro} onChange={setTipoFiltro}
                    options={opcionesTipo} placeholder="Todos los tipos" />
            </div>
        </>
    );

    const { data, setData, post, put, processing, errors, reset, setError, clearErrors } = useForm({
        tipo_correlativo_id: '',
        servicio_id:         '',
        codigo_servicio:     '',
        anio:                anioActual,
        ultimo_numero:       0,
        activo:              true,
    });

    const abrirCrear = () => {
        reset();
        setEditando(null);
        setShowModal(true);
    };

    const abrirEditar = (correlativo) => {
        setData({
            tipo_correlativo_id: correlativo.tipo_correlativo_id,
            servicio_id:         correlativo.servicio_id ?? '',
            codigo_servicio:     correlativo.codigo_servicio,
            anio:                correlativo.anio,
            ultimo_numero:       correlativo.ultimo_numero,
            activo:              correlativo.activo,
        });
        setEditando(correlativo);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        setEditando(null);
        reset();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarZod(correlativoSchema, data, { setError, clearErrors })) return;
        const nombreTipo = tiposCorrelativo.find(t => t.id === Number(data.tipo_correlativo_id))?.nombre ?? '—';
        const ok = await confirmar({
            variant: editando ? 'info' : 'warning',
            titulo:  editando ? '¿Guardar cambios en el correlativo?' : '¿Crear correlativo?',
            mensaje: editando
                ? 'Se actualizará la configuración de numeración de este correlativo.'
                : 'Se registrará un nuevo correlativo para la numeración automática.',
            detalles: [
                { label: 'Tipo', value: nombreTipo },
                { label: 'Año',  value: data.anio },
            ],
            confirmText: editando ? 'Sí, guardar' : 'Sí, crear',
        });
        if (!ok) return;

        const payload = { ...data, servicio_id: data.servicio_id || null };
        const opts = {
            data: payload,
            preserveScroll: true,
            onSuccess: (page) => {
                cerrarModal();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Revise los campos requeridos.'),
        };
        if (editando) put(route('configuracion.correlativos.update', editando.id), opts);
        else          post(route('configuracion.correlativos.store'), opts);
    };

    const pedirReactivar = async (correlativo) => {
        const ok = await confirmarReactivar({
            titulo: 'Reactivar Correlativo',
            mensaje: 'Volverá a usarse para generar nuevos números.',
            detalle: {
                label: 'Correlativo',
                value: `${correlativo.tipo_correlativo?.nombre ?? ''} · ${correlativo.codigo_servicio ?? ''} ${correlativo.anio ?? ''}`.trim(),
            },
        });
        if (!ok) return;
        router.patch(route('configuracion.correlativos.reactivar', correlativo.id), {}, {
            preserveScroll: true,
            onSuccess: (page) => { if (page.props.flash?.success) toast.success(page.props.flash.success); },
            onError: () => toast.error('Error al reactivar.'),
        });
    };

    const pedirConfirmacion = async (correlativo) => {
        const ok = await confirmarDesactivar({
            titulo: 'Desactivar Correlativo',
            mensaje: 'Dejará de usarse para generar nuevos números. Podrás reactivarlo cuando quieras.',
            detalle: {
                label: 'Correlativo',
                value: `${correlativo.tipo_correlativo?.nombre ?? ''} · ${correlativo.codigo_servicio ?? ''} ${correlativo.anio ?? ''}`.trim(),
            },
        });
        if (!ok) return;

        router.delete(route('configuracion.correlativos.destroy', correlativo.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Error al desactivar.'),
        });
    };

    const columns = [
        {
            key: 'tipo_correlativo',
            label: 'Tipo',
            sortable: false,
            render: (row) => (
                <div className="font-bold text-[#291136] text-sm">{row.tipo_correlativo?.nombre}</div>
            ),
        },
        {
            key: 'servicio',
            label: 'Servicio',
            sortable: false,
            render: (row) => (
                <span className="text-sm text-gray-600">
                    {row.servicio?.nombre ?? <span className="italic text-gray-400">Global</span>}
                </span>
            ),
        },
        {
            key: 'codigo_servicio',
            label: 'Código',
            sortable: false,
            render: (row) => (
                <span className="font-mono text-xs font-bold bg-[#291136]/5 text-[#291136] px-2 py-1 rounded-lg">
                    {row.codigo_servicio}
                </span>
            ),
        },
        { key: 'anio',          label: 'Año',           sortable: true },
        { key: 'ultimo_numero', label: 'Último N°',     sortable: true },
        {
            key: 'ejemplo',
            label: 'Próximo número',
            sortable: false,
            render: (row) => {
                const ejemplo = aplicarFormato(row.tipo_correlativo?.formato, {
                    prefijo:        row.tipo_correlativo?.prefijo,
                    anio:           row.anio,
                    codigoServicio: row.codigo_servicio,
                    ultimoNumero:   row.ultimo_numero + 1,
                });
                return (
                    <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        {ejemplo}
                    </span>
                );
            },
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
                    { label: 'Correlativos' },
                ]}
                title="Correlativos"
                description="Numeración automática por tipo, servicio y año."
                action={{ label: 'Nuevo Correlativo', onClick: abrirCrear, icon: Plus }}
            />
            <div className="p-6 max-w-7xl mx-auto">

                <Table
                    columns={columns}
                    data={correlativosFiltrados}
                    clientSide
                    perPage={15}
                    searchKeys={['_buscar']}
                    filters={filtros}
                    searchPlaceholder="Buscar por tipo, servicio o código..."
                />
            </div>

            {/* Modal Crear / Editar */}
            <Modal show={showModal} onClose={cerrarModal} maxWidth="md">
                <form onSubmit={handleSubmit} noValidate>
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

                        {/* Tipo de correlativo */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Tipo de Correlativo <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <CustomSelect
                                value={data.tipo_correlativo_id}
                                onChange={(val) => setData('tipo_correlativo_id', val)}
                                options={opcionesTipo}
                                placeholder="— Seleccione un tipo —"
                                error={errors.tipo_correlativo_id}
                            />
                            {errors.tipo_correlativo_id && (
                                <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.tipo_correlativo_id}</p>
                            )}
                        </div>

                        {/* Servicio (opcional) */}
                        <div className="mb-5">
                            <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                Servicio
                            </label>
                            <CustomSelect
                                value={data.servicio_id}
                                onChange={(val) => setData('servicio_id', val)}
                                options={opcionesServicio}
                                placeholder={null}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                Deja en "Global" si el correlativo aplica a todo el centro, no a un servicio específico.
                            </p>
                        </div>

                        {/* Código de servicio (opcional) */}
                        <Input
                            label="Código de Servicio (opcional)"
                            type="text"
                            value={data.codigo_servicio}
                            onChange={e => setData('codigo_servicio', e.target.value.toUpperCase())}
                            placeholder="Se autocompleta si lo dejas vacío"
                            error={errors.codigo_servicio}
                        />
                        <p className="text-xs text-gray-400 -mt-3 mb-5">
                            Si lo dejas vacío, se usa el código del servicio (ej: <strong>ARBITRAJE</strong>) o <strong>GEN</strong> si es global.
                        </p>

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
                            label="Último número emitido"
                            required
                            type="number"
                            min="0"
                            value={data.ultimo_numero}
                            onChange={e => setData('ultimo_numero', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            error={errors.ultimo_numero}
                        />
                        <p className="text-xs text-gray-400 -mt-3 mb-5">
                            El próximo número generado será el siguiente a este valor.
                        </p>

                        {/* Estado — solo en edición */}
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
        </AuthenticatedLayout>
    );
}

