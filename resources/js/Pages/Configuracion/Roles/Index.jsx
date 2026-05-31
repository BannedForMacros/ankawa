import { useState, useEffect, useMemo } from 'react';
import { useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import CustomSelect from '@/Components/CustomSelect';
import Table from '@/Components/Table';
import Badge from '@/Components/Badge';
import { confirmar, confirmarDesactivar, confirmarReactivar } from '@/lib/swalAnkawa';
import { validarZod } from '@/lib/validar';
import { z } from 'zod';

// Esquema de validación (cliente). El servidor sigue siendo la verdad.
// Refleja las reglas de RolController@store/@update: nombre required|string|max:255,
// descripcion nullable|string. La unicidad de 'nombre' la verifica el backend y
// llega vía errors de Inertia.
const rolSchema = z.object({
    nombre:      z.any(),
    descripcion: z.any(),
}).superRefine((d, ctx) => {
    const nombre = String(d.nombre ?? '').trim();
    if (nombre === '')
        ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'El nombre del rol es obligatorio.' });
    else if (nombre.length > 255)
        ctx.addIssue({ code: 'custom', path: ['nombre'], message: 'El nombre no puede superar los 255 caracteres.' });
});
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import toast from 'react-hot-toast';
import { Plus, ShieldCheck, KeyRound, Lock } from 'lucide-react';

const opcionesEstado = [
    { id: 1, nombre: '✅ Activo'   },
    { id: 0, nombre: '❌ Inactivo' },
];

const SLUG_ADMIN = 'administrador_ti';
const PERM_VACIO = { ver: false, crear: false, editar: false, eliminar: false };
const ACCIONES = [
    { key: 'ver',      label: 'Ver' },
    { key: 'crear',    label: 'Crear' },
    { key: 'editar',   label: 'Editar' },
    { key: 'eliminar', label: 'Eliminar' },
];

export default function Index({ roles, modulos = [], permisos = {} }) {
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

    // Árbol de módulos (padre → hijos) para la matriz
    const modulosTree = useMemo(() => {
        const padres = modulos.filter(m => !m.parent_id);
        return padres.map(p => ({
            ...p,
            hijos: modulos.filter(c => c.parent_id === p.id),
        }));
    }, [modulos]);

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

    // ── Matriz de permisos ──
    const [showPermisos, setShowPermisos] = useState(false);
    const [rolPermisos, setRolPermisos]   = useState(null);
    const [permState, setPermState]       = useState({});
    const [savingPerms, setSavingPerms]   = useState(false);

    const abrirPermisos = (rol) => {
        const previos = permisos[rol.id] ?? {};
        const inicial = {};
        modulos.forEach(m => {
            inicial[m.id] = { ...PERM_VACIO, ...(previos[m.id] ?? {}) };
        });
        setPermState(inicial);
        setRolPermisos(rol);
        setShowPermisos(true);
    };

    const cerrarPermisos = () => {
        setShowPermisos(false);
        setRolPermisos(null);
        setPermState({});
    };

    // 'ver' es la puerta: sin ver no hay acción. Activar otra acción implica ver;
    // quitar ver limpia toda la fila.
    const togglePermiso = (moduloId, accion, value) => {
        setPermState(prev => {
            const cur = prev[moduloId] ?? PERM_VACIO;
            let next = { ...cur, [accion]: value };
            if (accion === 'ver' && !value) next = { ...PERM_VACIO };
            if (accion !== 'ver' && value)  next.ver = true;
            return { ...prev, [moduloId]: next };
        });
    };

    const toggleFila = (moduloId, value) => {
        setPermState(prev => ({
            ...prev,
            [moduloId]: value
                ? { ver: true, crear: true, editar: true, eliminar: true }
                : { ...PERM_VACIO },
        }));
    };

    const filaCompleta = (p) => p && p.ver && p.crear && p.editar && p.eliminar;

    const marcarTodo = (value) => {
        setPermState(() => {
            const next = {};
            modulos.forEach(m => {
                next[m.id] = value
                    ? { ver: true, crear: true, editar: true, eliminar: true }
                    : { ...PERM_VACIO };
            });
            return next;
        });
    };

    const guardarPermisos = async () => {
        const ok = await confirmar({
            variant: 'info',
            titulo: `¿Guardar permisos de "${rolPermisos.nombre}"?`,
            mensaje: 'Se actualizará qué puede ver y hacer este rol en cada módulo del sistema.',
            detalles: [{ label: 'Rol', value: rolPermisos.nombre }],
            confirmText: 'Sí, guardar',
        });
        if (!ok) return;

        const payload = modulos.map(m => ({
            modulo_id: m.id,
            ...(permState[m.id] ?? PERM_VACIO),
        }));

        setSavingPerms(true);
        router.post(route('configuracion.roles.permisos', rolPermisos.id), { permisos: payload }, {
            preserveScroll: true,
            onSuccess: (page) => {
                const ok2 = page.props.flash?.success;
                const err = page.props.flash?.error;
                if (err) toast.error(err);
                else {
                    if (ok2) toast.success(ok2);
                    cerrarPermisos();
                }
            },
            onError: () => toast.error('Error al guardar los permisos.'),
            onFinish: () => setSavingPerms(false),
        });
    };

    const FilaPermiso = ({ modulo, esHijo }) => {
        const p = permState[modulo.id] ?? PERM_VACIO;
        return (
            <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className={`py-2.5 pr-3 ${esHijo ? 'pl-8' : 'pl-3'}`}>
                    <span className={`text-sm ${esHijo ? 'text-gray-700' : 'font-semibold text-[#291136]'}`}>
                        {modulo.nombre}
                    </span>
                    <span className="block text-[11px] text-gray-400">{modulo.slug}</span>
                </td>
                {ACCIONES.map(a => (
                    <td key={a.key} className="py-2.5 px-2 text-center">
                        <input
                            type="checkbox"
                            checked={!!p[a.key]}
                            onChange={e => togglePermiso(modulo.id, a.key, e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 accent-[#BE0F4A] cursor-pointer"
                        />
                    </td>
                ))}
                <td className="py-2.5 px-2 text-center">
                    <input
                        type="checkbox"
                        title="Marcar/limpiar toda la fila"
                        checked={filaCompleta(p)}
                        onChange={e => toggleFila(modulo.id, e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 accent-[#291136] cursor-pointer"
                    />
                </td>
            </tr>
        );
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
                <div className="flex items-center gap-1">
                    {row.slug === SLUG_ADMIN ? (
                        <button
                            type="button"
                            disabled
                            title="Administrador TI conserva acceso total (no editable)"
                            className="p-1.5 rounded-lg text-gray-300 cursor-not-allowed"
                        >
                            <Lock size={16} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => abrirPermisos(row)}
                            title="Permisos del rol"
                            className="p-1.5 rounded-lg text-[#291136]/60 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors"
                        >
                            <KeyRound size={16} />
                        </button>
                    )}
                    <ActionButtons
                        onEdit={() => abrirEditar(row)}
                        onDelete={row.activo ? () => pedirConfirmacion(row) : undefined}
                        onReactivar={!row.activo ? () => pedirReactivar(row) : undefined}
                    />
                </div>
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

                        <Input
                            label="Nombre del Rol"
                            required
                            type="text"
                            value={data.nombre}
                            onChange={e => setData('nombre', e.target.value)}
                            placeholder="Ej: Secretario Arbitral, Mesa de Partes..."
                            error={errors.nombre}
                        />

                        <Textarea
                            label="Descripción"
                            value={data.descripcion}
                            onChange={e => setData('descripcion', e.target.value)}
                            placeholder="Describe brevemente la función de este rol..."
                            rows={3}
                            error={errors.descripcion}
                        />

                        {editando && (
                            <div className="mb-2">
                                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                    Estado del Registro
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

            {/* Modal Matriz de Permisos */}
            <Modal show={showPermisos} onClose={cerrarPermisos} maxWidth="2xl">
                <div className="p-7">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#291136]">
                                <KeyRound size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[#291136]">Permisos del Rol</h2>
                                <p className="text-sm text-gray-500">{rolPermisos?.nombre}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => marcarTodo(true)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#BE0F4A]/10 text-[#BE0F4A] hover:bg-[#BE0F4A]/20 transition-colors">
                                Marcar todo
                            </button>
                            <button type="button" onClick={() => marcarTodo(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                        <span className="font-semibold text-[#291136]">Ver</span> habilita el acceso al módulo en el menú.
                        Activar Crear, Editar o Eliminar implica Ver automáticamente.
                    </p>

                    <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr className="border-b border-gray-200">
                                    <th className="py-2.5 pl-3 pr-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Módulo</th>
                                    {ACCIONES.map(a => (
                                        <th key={a.key} className="py-2.5 px-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-16">{a.label}</th>
                                    ))}
                                    <th className="py-2.5 px-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide w-16">Todo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modulosTree.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                                            No hay módulos activos para configurar.
                                        </td>
                                    </tr>
                                )}
                                {modulosTree.map(padre => (
                                    <FilaGrupo key={padre.id} padre={padre} FilaPermiso={FilaPermiso} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-7 py-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl">
                    <SecondaryButton type="button" onClick={cerrarPermisos} disabled={savingPerms}>
                        Cancelar
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={guardarPermisos} disabled={savingPerms}>
                        {savingPerms ? 'Guardando...' : 'Guardar Permisos'}
                    </PrimaryButton>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}

// Render del módulo padre + sus hijos como filas de la matriz.
function FilaGrupo({ padre, FilaPermiso }) {
    return (
        <>
            <FilaPermiso modulo={padre} esHijo={false} />
            {padre.hijos.map(hijo => (
                <FilaPermiso key={hijo.id} modulo={hijo} esHijo={true} />
            ))}
        </>
    );
}
