import { useState } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    FileText, FolderOpen, AlertTriangle, Eye,
    CheckCircle2, XCircle, UserCheck, Bell, Search
} from 'lucide-react';
import toast from 'react-hot-toast';

function EstadoBadge({ estado }) {
    const map = {
        pendiente:   'bg-yellow-100 text-yellow-800',
        subsanacion: 'bg-orange-100 text-orange-800',
        admitida:    'bg-green-100 text-green-800',
        rechazada:   'bg-red-100 text-red-800',
        admitido:    'bg-green-100 text-green-800',
        en_proceso:  'bg-blue-100 text-blue-800',
        suspendido:  'bg-gray-100 text-gray-500',
        cerrado:     'bg-gray-100 text-gray-400',
    };
    const labels = {
        pendiente:   'Pendiente',
        subsanacion: 'Subsanación',
        admitida:    'Admitida',
        rechazada:   'Rechazada',
        admitido:    'Admitido',
        en_proceso:  'En proceso',
        suspendido:  'Suspendido',
        cerrado:     'Cerrado',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[estado] ?? 'bg-gray-100 text-gray-500'}`}>
            {labels[estado] ?? estado}
        </span>
    );
}

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="bg-[#291136] px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold">{title}</h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white text-xl">&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function Index({ expedientes, solicitudesPendientes, secretariosArbitrales, rolActual }) {

    const [tab, setTab]           = useState(
        solicitudesPendientes.length > 0 ? 'solicitudes' : 'expedientes'
    );
    const [busqueda, setBusqueda] = useState('');
    const [modal, setModal]       = useState(null);
    const [seleccionado, setSeleccionado] = useState(null);
    const [form, setForm]         = useState({});
    const [procesando, setProcesando] = useState(false);

    // Roles que pueden ver solicitudes pendientes
    const veeSolicitudes = ['secretaria_general_adjunta', 'secretario_general', 'director']
        .includes(rolActual);

    const abrirModal = (tipo, item) => {
        setModal(tipo);
        setSeleccionado(item);
        setForm(tipo === 'observar' ? { plazo_dias: 5 } : {});
    };

    const cerrarModal = () => { setModal(null); setSeleccionado(null); setForm({}); };

    const enviar = (url, data) => {
        setProcesando(true);
        router.post(url, data, {
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                cerrarModal();
            },
            onError: (errs) => toast.error(errs.general ?? 'Error al procesar.'),
            onFinish: () => setProcesando(false),
        });
    };

    const solicitudesFiltradas = solicitudesPendientes.filter(s =>
        [s.numero_cargo, s.nombre_demandante, s.nombre_demandado]
            .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
    );

    const expedientesFiltrados = expedientes.filter(e =>
        [e.numero_expediente, e.nombre_demandante, e.nombre_demandado]
            .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
    );

    return (
        <AuthenticatedLayout>
            <Head title="Expedientes" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#291136]"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Expedientes
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm">
                                Gestión de procesos arbitrales
                            </p>
                        </div>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                            />
                        </div>
                    </div>

                    {/* Tabs — solo si el rol ve solicitudes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {veeSolicitudes && (
                            <div className="flex gap-2 px-6 pt-4">
                                <button onClick={() => setTab('solicitudes')}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                        ${tab === 'solicitudes'
                                            ? 'bg-[#BE0F4A] text-white'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    Solicitudes pendientes
                                    {solicitudesPendientes.length > 0 && (
                                        <span className="ml-2 bg-white/30 text-white text-xs px-1.5 py-0.5 rounded-full">
                                            {solicitudesPendientes.length}
                                        </span>
                                    )}
                                </button>
                                <button onClick={() => setTab('expedientes')}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                                        ${tab === 'expedientes'
                                            ? 'bg-[#BE0F4A] text-white'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    Expedientes ({expedientes.length})
                                </button>
                            </div>
                        )}

                        <div className="p-6">

                            {/* ── Solicitudes pendientes ── */}
                            {tab === 'solicitudes' && veeSolicitudes && (
                                <div className="overflow-x-auto">
                                    {solicitudesFiltradas.length === 0 ? (
                                        <div className="py-16 text-center text-gray-400">
                                            <FileText size={36} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No hay solicitudes pendientes</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                                    <th className="pb-3 text-left font-semibold">N° Cargo</th>
                                                    <th className="pb-3 text-left font-semibold">Servicio</th>
                                                    <th className="pb-3 text-left font-semibold">Demandante</th>
                                                    <th className="pb-3 text-left font-semibold">Demandado</th>
                                                    <th className="pb-3 text-left font-semibold">Estado</th>
                                                    <th className="pb-3 text-left font-semibold">Fecha</th>
                                                    <th className="pb-3 text-center font-semibold">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {solicitudesFiltradas.map(s => (
                                                    <tr key={s.id} className={`hover:bg-gray-50 transition-colors
                                                        ${s.tiene_subsanacion ? 'bg-orange-50/40' : ''}`}>
                                                        <td className="py-3 pr-4">
                                                            <span className="font-mono font-bold text-[#291136]">
                                                                {s.numero_cargo}
                                                            </span>
                                                            {s.tiene_subsanacion && (
                                                                <div className="flex items-center gap-1 mt-0.5 text-xs text-orange-500 font-semibold">
                                                                    <AlertTriangle size={10} /> Subsanación pendiente
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-600">{s.servicio}</td>
                                                        <td className="py-3 pr-4">
                                                            <div className="font-semibold text-gray-800">{s.nombre_demandante}</div>
                                                            <div className="text-xs text-gray-400">{s.email_demandante}</div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-600">{s.nombre_demandado}</td>
                                                        <td className="py-3 pr-4"><EstadoBadge estado={s.estado} /></td>
                                                        <td className="py-3 pr-4 text-xs text-gray-400">{s.created_at}</td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {/* Secretaria Adjunta: admitir, observar, rechazar */}
                                                                {rolActual === 'secretaria_general_adjunta' && ['pendiente','en_revision'].includes(s.estado) && <>
                                                                    <button onClick={() => abrirModal('admitir', s)}
                                                                        title="Admitir"
                                                                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                                                                        <CheckCircle2 size={16} />
                                                                    </button>
                                                                    <button onClick={() => abrirModal('observar', s)}
                                                                        title="Observar"
                                                                        className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors">
                                                                        <AlertTriangle size={16} />
                                                                    </button>
                                                                    <button onClick={() => abrirModal('rechazar', s)}
                                                                        title="Rechazar"
                                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                                                                        <XCircle size={16} />
                                                                    </button>
                                                                </>}
                                                                {/* Ver detalle siempre disponible */}
                                                                <Link href={route('expedientes.show', s.id)}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#291136] transition-colors">
                                                                    <Eye size={16} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {/* ── Expedientes ── */}
                            {(tab === 'expedientes' || !veeSolicitudes) && (
                                <div className="overflow-x-auto">
                                    {expedientesFiltrados.length === 0 ? (
                                        <div className="py-16 text-center text-gray-400">
                                            <FolderOpen size={36} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">No hay expedientes</p>
                                        </div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                                                    <th className="pb-3 text-left font-semibold">N° Expediente</th>
                                                    <th className="pb-3 text-left font-semibold">Servicio</th>
                                                    <th className="pb-3 text-left font-semibold">Demandante</th>
                                                    <th className="pb-3 text-left font-semibold">Demandado</th>
                                                    <th className="pb-3 text-left font-semibold">Etapa actual</th>
                                                    <th className="pb-3 text-left font-semibold">Estado</th>
                                                    <th className="pb-3 text-center font-semibold">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {expedientesFiltrados.map(e => (
                                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 pr-4">
                                                            <span className="font-mono font-bold text-[#291136]">
                                                                {e.numero_expediente}
                                                            </span>
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                {e.dias_en_proceso}d en proceso
                                                            </div>
                                                        </td>
                                                        <td className="py-3 pr-4 text-gray-600">{e.servicio}</td>
                                                        <td className="py-3 pr-4 text-gray-800">{e.nombre_demandante}</td>
                                                        <td className="py-3 pr-4 text-gray-600">{e.nombre_demandado}</td>
                                                        <td className="py-3 pr-4">
                                                            <div className="text-xs font-semibold text-[#291136]">{e.etapa_actual ?? '—'}</div>
                                                            <div className="text-xs text-gray-400">{e.actividad_actual}</div>
                                                        </td>
                                                        <td className="py-3 pr-4"><EstadoBadge estado={e.estado} /></td>
                                                        <td className="py-3">
                                                            <div className="flex items-center justify-center gap-1">
                                                                {/* Secretario General: asignar secretario */}
                                                                {rolActual === 'secretario_general' && e.estado === 'admitido' && (
                                                                    <button onClick={() => abrirModal('asignar', e)}
                                                                        title="Asignar Secretario Arbitral"
                                                                        className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors">
                                                                        <UserCheck size={16} />
                                                                    </button>
                                                                )}
                                                                {/* Secretaria Adjunta: notificar demandado */}
                                                                {rolActual === 'secretaria_general_adjunta' && e.estado === 'en_proceso' && (
                                                                    <button onClick={() => abrirModal('notificar', e)}
                                                                        title="Notificar al demandado"
                                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                                                                        <Bell size={16} />
                                                                    </button>
                                                                )}
                                                                {/* Ver detalle — todos */}
                                                                <Link href={route('expedientes.show', e.id)}
                                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#291136] transition-colors">
                                                                    <Eye size={16} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <Modal open={modal === 'admitir'} onClose={cerrarModal} title="Admitir Solicitud">
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                        Se generará el número de expediente y se notificará al demandante.
                    </div>
                    <textarea rows={3} placeholder="Notas internas (opcional)..."
                        value={form.observacion ?? ''}
                        onChange={e => setForm({ ...form, observacion: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500">Cancelar</button>
                        <button onClick={() => enviar(route('expedientes.admitir', seleccionado?.id), form)}
                            disabled={procesando}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                            {procesando ? 'Procesando...' : 'Admitir'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={modal === 'observar'} onClose={cerrarModal} title="Solicitar Subsanación">
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                        El demandante recibirá un email con las observaciones y el plazo para corregir.
                    </div>
                    <textarea rows={4} placeholder="Detalle qué debe corregir el demandante..." required
                        value={form.observacion ?? ''}
                        onChange={e => setForm({ ...form, observacion: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-[#291136]">Plazo (días):</label>
                        <input type="number" min={1} max={30}
                            value={form.plazo_dias ?? 5}
                            onChange={e => setForm({ ...form, plazo_dias: parseInt(e.target.value) })}
                            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500">Cancelar</button>
                        <button onClick={() => enviar(route('expedientes.observar', seleccionado?.id), form)}
                            disabled={procesando || !form.observacion}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
                            {procesando ? 'Enviando...' : 'Enviar Observación'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={modal === 'rechazar'} onClose={cerrarModal} title="Rechazar Solicitud">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                        Acción irreversible. El demandante será notificado con el motivo.
                    </div>
                    <textarea rows={4} placeholder="Fundamente el motivo del rechazo..." required
                        value={form.motivo ?? ''}
                        onChange={e => setForm({ ...form, motivo: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500">Cancelar</button>
                        <button onClick={() => enviar(route('expedientes.rechazar', seleccionado?.id), form)}
                            disabled={procesando || !form.motivo}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            {procesando ? 'Procesando...' : 'Rechazar'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={modal === 'asignar'} onClose={cerrarModal} title="Asignar Secretario Arbitral">
                <div className="space-y-4">
                    <select value={form.secretario_id ?? ''}
                        onChange={e => setForm({ ...form, secretario_id: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]">
                        <option value="">Seleccionar secretario...</option>
                        {secretariosArbitrales.map(u => (
                            <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                        ))}
                    </select>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500">Cancelar</button>
                        <button onClick={() => enviar(route('expedientes.asignarSecretario', seleccionado?.id), form)}
                            disabled={procesando || !form.secretario_id}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50">
                            {procesando ? 'Asignando...' : 'Asignar'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal open={modal === 'notificar'} onClose={cerrarModal} title="Notificar al Demandado">
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        Tendrá 5 días para apersonarse al proceso.
                    </div>
                    <textarea rows={3} placeholder="Mensaje adicional (opcional)..."
                        value={form.mensaje_adicional ?? ''}
                        onChange={e => setForm({ ...form, mensaje_adicional: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500">Cancelar</button>
                        <button onClick={() => enviar(route('expedientes.notificarDemandado', seleccionado?.id), form)}
                            disabled={procesando}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                            {procesando ? 'Enviando...' : 'Notificar'}
                        </button>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}