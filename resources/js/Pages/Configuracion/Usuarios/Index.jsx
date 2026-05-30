import { useState, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import Table from '@/Components/Table';
import { ActionButtons } from '@/Components/ActionButtons';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Modal from '@/Components/Modal';
import { confirmar, confirmarDesactivar } from '@/lib/swalAnkawa';
import { validarZod } from '@/lib/validar';
import { z } from 'zod';
import Badge from '@/Components/Badge';
import CustomSelect from '@/Components/CustomSelect';
import PasswordInput from '@/Components/PasswordInput';
import Input from '@/Components/Input';
import toast from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';

// Esquema de validación (cliente). El servidor sigue siendo la verdad.
const usuarioSchema = (editando) => z.object({
    name:                  z.string(),
    email:                 z.string(),
    rol_id:                z.any(),
    password:              z.string().optional(),
    password_confirmation: z.string().optional(),
}).superRefine((d, ctx) => {
    if (d.name.trim() === '')
        ctx.addIssue({ code: 'custom', path: ['name'], message: 'El nombre es obligatorio.' });

    if (d.email.trim() === '')
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'El correo es obligatorio.' });
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'Ingresa un correo válido.' });

    if (d.rol_id === '' || d.rol_id == null)
        ctx.addIssue({ code: 'custom', path: ['rol_id'], message: 'Selecciona un rol.' });

    const pwd  = String(d.password ?? '');
    const conf = String(d.password_confirmation ?? '');
    if (!editando || pwd) {
        if (!editando && pwd === '')
            ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña es obligatoria.' });
        else if (pwd.length < 8)
            ctx.addIssue({ code: 'custom', path: ['password'], message: 'Debe tener al menos 8 caracteres.' });
        if (pwd !== conf)
            ctx.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'Las contraseñas no coinciden.' });
    }
});

export default function Index({ usuarios, roles }) {

    const [showModal, setShowModal]               = useState(false);
    const [editando, setEditando]                 = useState(null);

    // ── Filtros (client-side) ──
    const [estado, setEstado] = useState('');
    const [rolId,  setRolId]  = useState('');

    const usuariosFiltrados = useMemo(() => {
        const r = rolId ? Number(rolId) : null;
        return usuarios.filter(u => {
            if (estado !== '' && Number(u.activo) !== Number(estado)) return false;
            if (r && u.rol_id !== r) return false;
            return true;
        });
    }, [usuarios, estado, rolId]);

    const filtros = (
        <>
            <div className="w-44">
                <CustomSelect value={estado} onChange={setEstado}
                    options={[{ id: 1, nombre: 'Activos' }, { id: 0, nombre: 'Inactivos' }]}
                    placeholder="Todos los estados" />
            </div>
            <div className="w-48">
                <CustomSelect value={rolId} onChange={setRolId}
                    options={roles} placeholder="Todos los roles" />
            </div>
        </>
    );

    const { data, setData, post, put, processing, errors, reset, setError, clearErrors } = useForm({
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarZod(usuarioSchema(editando), data, { setError, clearErrors })) return;
        const ok = await confirmar({
            variant: editando ? 'info' : 'warning',
            titulo:  editando ? `¿Guardar cambios en "${data.name}"?` : `¿Crear usuario "${data.name}"?`,
            mensaje: editando
                ? 'Se actualizarán los datos del usuario. Si se ingresó una nueva contraseña, será reemplazada.'
                : 'Se creará el usuario y se le asignará el rol seleccionado.',
            detalles: [
                { label: 'Usuario', value: data.name },
                data.email ? { label: 'Correo', value: data.email } : null,
            ].filter(Boolean),
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
            onError: () => toast.error(editando ? 'Error al actualizar el usuario.' : 'Error al crear el usuario.'),
        };
        if (editando) put(route('configuracion.usuarios.update', editando.id), opts);
        else          post(route('configuracion.usuarios.store'), opts);
    };

    const pedirConfirmacion = async (usuario) => {
        const ok = await confirmarDesactivar({
            titulo: 'Desactivar Usuario',
            mensaje: 'El usuario no podrá ingresar al sistema. Puedes reactivarlo en cualquier momento.',
            detalle: { label: 'Usuario', value: usuario.name },
        });
        if (!ok) return;

        router.delete(route('configuracion.usuarios.destroy', usuario.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
            },
            onError: () => {
                toast.error('Error al desactivar el usuario.');
            },
        });
    };

    const opcionesEstado = [
        { id: 1, nombre: '✅ Activo'   },
        { id: 0, nombre: '❌ Inactivo' },
    ];

    const columns = [
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
            <ConfigHeader
                breadcrumb={[
                    { label: 'Inicio', href: route('dashboard') },
                    { label: 'Configuración' },
                    { label: 'Usuarios' },
                ]}
                title="Usuarios"
                description="Gestión de accesos al sistema."
                action={{ label: 'Nuevo Usuario', onClick: abrirCrear, icon: Plus }}
            />
            <div className="p-6 max-w-6xl mx-auto">

                <Table
                    columns={columns}
                    data={usuariosFiltrados}
                    clientSide
                    perPage={15}
                    searchKeys={['name', 'email']}
                    filters={filtros}
                    searchPlaceholder="Buscar por nombre o correo..."
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

        </AuthenticatedLayout>
    );
}