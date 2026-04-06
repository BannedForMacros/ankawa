import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import toast from 'react-hot-toast';
import { LayoutGrid, Plus, Pencil, Trash2 } from 'lucide-react';

// ── Modal Crear / Editar ──────────────────────────────────────────────────────

function ModalModulo({ show, onClose, editando, padres }) {
    const [confirming, setConfirming] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        nombre:    '',
        slug:      '',
        icono:     '',
        ruta:      '',
        parent_id: '',
        orden:     0,
        activo:    1,
    });

    useEffect(() => {
        if (show) {
            setData({
                nombre:    editando?.nombre    ?? '',
                slug:      editando?.slug      ?? '',
                icono:     editando?.icono     ?? '',
                ruta:      editando?.ruta      ?? '',
                parent_id: editando?.parent_id ?? '',
                orden:     editando?.orden     ?? 0,
                activo:    editando?.activo    ?? 1,
            });
        } else {
            reset();
        }
    }, [show, editando]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setConfirming(true);
    };

    const doSave = () => {
        const opts = {
            onSuccess: (page) => {
                setConfirming(false);
                onClose();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error)   toast.error(page.props.flash.error);
            },
            onError: () => { setConfirming(false); toast.error('Revisa los errores del formulario.'); },
        };
        editando
            ? put(route('configuracion.modulos.update', editando.id), opts)
            : post(route('configuracion.modulos.store'), opts);
    };

    const field = (label, key, type = 'text', required = false) => (
        <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {label}{required && <span className="text-[#BE0F4A] ml-0.5">*</span>}
            </label>
            <input
                type={type}
                value={data[key]}
                onChange={e => setData(key, e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A]"
            />
            {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
        </div>
    );

    return (
        <>
        <ConfirmDialog
            show={confirming}
            title={editando ? `¿Guardar cambios en "${data.nombre}"?` : `¿Crear módulo "${data.nombre}"?`}
            message={editando
                ? 'Se actualizará la configuración de este módulo del sistema.'
                : 'Se registrará como un nuevo módulo de navegación del sistema.'}
            confirmText={editando ? 'Sí, guardar' : 'Sí, crear'}
            processing={processing}
            onConfirm={doSave}
            onCancel={() => setConfirming(false)}
            detalles={[{ label: 'Módulo', value: data.nombre }, data.slug && { label: 'Slug', value: data.slug }].filter(Boolean)}
            variant={editando ? 'info' : 'warning'}
        />
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <h2 className="text-lg font-black text-[#291136] uppercase tracking-tight">
                    {editando ? 'Editar Módulo' : 'Nuevo Módulo'}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                    {field('Nombre', 'nombre', 'text', true)}
                    {field('Slug', 'slug', 'text', true)}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {field('Ícono (Lucide)', 'icono')}
                    {field('Ruta', 'ruta')}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Módulo padre
                        </label>
                        <select
                            value={data.parent_id}
                            onChange={e => setData('parent_id', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A]"
                        >
                            <option value="">— Raíz —</option>
                            {padres.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {field('Orden', 'orden', 'number')}
                </div>

                {editando && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado</label>
                        <select
                            value={data.activo}
                            onChange={e => setData('activo', Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A]"
                        >
                            <option value={1}>Activo</option>
                            <option value={0}>Inactivo</option>
                        </select>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800">
                        Cancelar
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-4 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-xl hover:bg-[#4A153D] disabled:opacity-60 transition-colors">
                        {processing ? 'Guardando...' : (editando ? 'Guardar cambios' : 'Crear módulo')}
                    </button>
                </div>
            </form>
        </Modal>
        </>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ModulosIndex({ modulos }) {
    const [modal, setModal]           = useState(false);
    const [editando, setEditando]     = useState(null);
    const [confirmOpen, setConfirm]   = useState(false);
    const [aEliminar, setAEliminar]   = useState(null);
    const [deleting, setDeleting]     = useState(false);

    const padres = (modulos?.data ?? []).filter(m => !m.parent_id);

    const abrirCrear = () => { setEditando(null); setModal(true); };
    const abrirEditar = (row) => { setEditando(row); setModal(true); };

    const handleDelete = () => {
        setDeleting(true);
        router.delete(route('configuracion.modulos.destroy', aEliminar.id), {
            onSuccess: (page) => {
                setConfirm(false); setAEliminar(null); setDeleting(false);
                if (page.props.flash?.success) toast.success(page.props.flash.success);
                if (page.props.flash?.error)   toast.error(page.props.flash.error);
            },
            onError: () => { setDeleting(false); toast.error('Error al eliminar.'); },
        });
    };

    const columns = [
        {
            key: 'nombre',
            label: 'Módulo',
            render: (row) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                        {row.padre && (
                            <span className="text-[10px] text-gray-400">
                                {row.padre.nombre} /
                            </span>
                        )}
                        <span className="font-semibold text-[#291136]">{row.nombre}</span>
                        {!row.activo && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400">
                                Inactivo
                            </span>
                        )}
                    </div>
                    <code className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md w-fit">
                        {row.slug}
                    </code>
                </div>
            ),
        },
        {
            key: 'icono',
            label: 'Ícono',
            sortable: false,
            render: (row) => (
                <code className="text-[11px] font-mono text-gray-500">{row.icono || '—'}</code>
            ),
        },
        {
            key: 'ruta',
            label: 'Ruta',
            sortable: false,
            render: (row) => (
                <code className="text-[11px] font-mono text-[#BE0F4A]">{row.ruta || '—'}</code>
            ),
        },
        {
            key: 'orden',
            label: 'Orden',
            render: (row) => (
                <span className="text-sm text-gray-500">{row.orden}</span>
            ),
        },
        {
            key: 'acciones',
            label: '',
            sortable: false,
            render: (row) => (
                <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => abrirEditar(row)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#291136] hover:bg-gray-100 transition-colors">
                        <Pencil size={14} />
                    </button>
                    <button onClick={() => { setAEliminar(row); setConfirm(true); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <div className="p-6">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-6">
                    <div className="px-6 py-6 border-l-4 border-[#BE0F4A]">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase">
                                    Módulos
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Estructura del menú y control de acceso por módulo
                                </p>
                            </div>
                            <button onClick={abrirCrear}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg transition-colors">
                                <Plus size={16} /> Nuevo Módulo
                            </button>
                        </div>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={modulos.data}
                    meta={modulos.meta}
                    routeName="configuracion.modulos.index"
                    searchPlaceholder="Buscar módulo..."
                />
            </div>

            <ModalModulo
                show={modal}
                onClose={() => setModal(false)}
                editando={editando}
                padres={padres}
            />
            <ConfirmDialog
                show={confirmOpen}
                title="Eliminar Módulo"
                message="Se eliminarán también todos los permisos asignados a este módulo. Esta acción no se puede deshacer."
                confirmText="Sí, eliminar"
                processing={deleting}
                onConfirm={handleDelete}
                onCancel={() => { setConfirm(false); setAEliminar(null); }}
                detalles={[{ label: 'Módulo', value: aEliminar?.nombre }]}
                variant="danger"
            />
        </AuthenticatedLayout>
    );
}
