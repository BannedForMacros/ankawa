import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    Inbox, Search, Eye, CheckCircle2,
    AlertTriangle, XCircle, Clock, Filter,
    ChevronRight, FileText, User, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Badge estado ──
function EstadoBadge({ estado }) {
    const map = {
        pendiente:   { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente'    },
        subsanacion: { color: 'bg-orange-100 text-orange-800', label: 'Subsanación'  },
        rechazada:   { color: 'bg-red-100 text-red-800',       label: 'Rechazada'    },
        admitida:    { color: 'bg-green-100 text-green-800',   label: 'Admitida'     },
    };
    const s = map[estado] ?? { color: 'bg-gray-100 text-gray-500', label: estado };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
            {s.label}
        </span>
    );
}

// ── Modal reutilizable ──
function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
                <div className="bg-[#291136] px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm">{title}</h3>
                    <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none">&times;</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

// ── Panel de detalle solicitud ──
function DetalleSolicitud({ solicitud }) {
    return (
        <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'N° Cargo',    value: solicitud.numero_cargo },
                    { label: 'Servicio',    value: solicitud.servicio },
                    { label: 'Demandante',  value: solicitud.nombre_demandante },
                    { label: 'Documento',   value: solicitud.documento_demandante },
                    { label: 'Email',       value: solicitud.email_demandante },
                    { label: 'Teléfono',    value: solicitud.telefono_demandante },
                    { label: 'Demandado',   value: solicitud.nombre_demandado },
                    { label: 'Email dem.',  value: solicitud.email_demandado },
                    { label: 'Monto (S/)', value: solicitud.monto_involucrado
                        ? Number(solicitud.monto_involucrado).toLocaleString('es-PE')
                        : '—' },
                    { label: 'Fecha',       value: solicitud.created_at },
                ].map((d, i) => (
                    <div key={i}>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{d.label}</div>
                        <div className="font-medium text-gray-800">{d.value ?? '—'}</div>
                    </div>
                ))}
            </div>
            <div>
                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Resumen de controversia</div>
                <div className="text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {solicitud.resumen_controversia}
                </div>
            </div>

            {/* Subsanación activa si existe */}
            {solicitud.subsanacion_activa && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <AlertTriangle size={12} />
                        Subsanación pendiente del cliente
                    </div>
                    <p className="text-sm text-orange-800">{solicitud.subsanacion_activa.observacion}</p>
                    <div className="text-xs text-orange-500 mt-2">
                        Registrado por: {solicitud.subsanacion_activa.registrado_por?.name}
                        — Vence: {solicitud.subsanacion_activa.fecha_limite}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Bandeja({ solicitudes, filtroActual, contadores }) {

    const [busqueda, setBusqueda]         = useState('');
    const [modal, setModal]               = useState(null); // 'detalle' | 'admitir' | 'observar' | 'rechazar'
    const [seleccionada, setSeleccionada] = useState(null);
    const [form, setForm]                 = useState({});
    const [procesando, setProcesando]     = useState(false);

    const abrirModal = (tipo, solicitud, formInicial = {}) => {
        setModal(tipo);
        setSeleccionada(solicitud);
        setForm(formInicial);
    };

    const cerrarModal = () => {
        setModal(null);
        setSeleccionada(null);
        setForm({});
    };

    const cambiarFiltro = (filtro) => {
        router.get(route('mesa-partes.bandeja'), { filtro }, {
            preserveState: true,
            replace: true,
        });
    };

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

    const solicitudesFiltradas = solicitudes.filter(s =>
        [s.numero_cargo, s.nombre_demandante, s.nombre_demandado, s.servicio]
            .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
    );

    // Filtros disponibles
    const filtros = [
        { key: 'todos',       label: 'Todos',       count: contadores.todos       },
        { key: 'pendiente',   label: 'Pendientes',  count: contadores.pendiente   },
        { key: 'subsanacion', label: 'Subsanación', count: contadores.subsanacion },
        { key: 'rechazada',   label: 'Rechazadas',  count: contadores.rechazada   },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Bandeja de Solicitudes" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#291136]"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Bandeja de Solicitudes
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm">
                                Solicitudes pendientes de revisión y admisión
                            </p>
                        </div>
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por número, nombre..."
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-64
                                    focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                            />
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                        {/* Filtros */}
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 flex-wrap">
                            <Filter size={14} className="text-gray-400 shrink-0" />
                            {filtros.map(f => (
                                <button key={f.key}
                                    onClick={() => cambiarFiltro(f.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                                        ${filtroActual === f.key
                                            ? 'bg-[#291136] text-white'
                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                    {f.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs
                                        ${filtroActual === f.key
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 text-gray-600'}`}>
                                        {f.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Tabla */}
                        {solicitudesFiltradas.length === 0 ? (
                            <div className="py-20 text-center text-gray-400">
                                <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No hay solicitudes en esta categoría</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs text-gray-400 uppercase tracking-wide bg-gray-50/60">
                                            <th className="px-6 py-3 text-left font-semibold">N° Cargo</th>
                                            <th className="px-6 py-3 text-left font-semibold">Servicio</th>
                                            <th className="px-6 py-3 text-left font-semibold">Demandante</th>
                                            <th className="px-6 py-3 text-left font-semibold">Demandado</th>
                                            <th className="px-6 py-3 text-left font-semibold">Monto</th>
                                            <th className="px-6 py-3 text-left font-semibold">Estado</th>
                                            <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                                            <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {solicitudesFiltradas.map(s => (
                                            <tr key={s.id}
                                                className={`hover:bg-gray-50/60 transition-colors
                                                    ${s.estado === 'subsanacion' ? 'bg-orange-50/20' : ''}
                                                    ${s.estado === 'rechazada'   ? 'bg-red-50/10 opacity-70' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono font-bold text-[#291136] text-xs">
                                                        {s.numero_cargo}
                                                    </span>
                                                    {s.subsanacion_activa && (
                                                        <div className="flex items-center gap-1 mt-0.5 text-xs text-orange-500 font-semibold">
                                                            <AlertTriangle size={10} />
                                                            Esperando subsanación
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{s.servicio}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">{s.nombre_demandante}</div>
                                                    <div className="text-xs text-gray-400">{s.email_demandante}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-gray-700">{s.nombre_demandado}</div>
                                                    <div className="text-xs text-gray-400">{s.email_demandado}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">
                                                    {s.monto_involucrado
                                                        ? 'S/ ' + Number(s.monto_involucrado).toLocaleString('es-PE')
                                                        : '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <EstadoBadge estado={s.estado} />
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400">{s.created_at}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1">

                                                        {/* Ver detalle — siempre */}
                                                        <button
                                                            onClick={() => abrirModal('detalle', s)}
                                                            title="Ver detalle"
                                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#291136] transition-colors">
                                                            <Eye size={16} />
                                                        </button>

                                                        {/* Admitir — solo pendiente */}
                                                        {s.estado === 'pendiente' && (
                                                            <button
                                                                onClick={() => abrirModal('admitir', s)}
                                                                title="Admitir solicitud"
                                                                className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                                                                <CheckCircle2 size={16} />
                                                            </button>
                                                        )}

                                                        {/* Observar — solo pendiente */}
                                                        {s.estado === 'pendiente' && (
                                                            <button
                                                                onClick={() => abrirModal('observar', s, { plazo_dias: 3 })}
                                                                title="Solicitar subsanación (3 días hábiles)"
                                                                className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-500 transition-colors">
                                                                <AlertTriangle size={16} />
                                                            </button>
                                                        )}

                                                        {/* Rechazar — solo pendiente */}
                                                        {s.estado === 'pendiente' && (
                                                            <button
                                                                onClick={() => abrirModal('rechazar', s)}
                                                                title="Rechazar solicitud"
                                                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                                                                <XCircle size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modal Detalle ── */}
            <Modal open={modal === 'detalle'} onClose={cerrarModal}
                title={`Solicitud ${seleccionada?.numero_cargo}`}>
                {seleccionada && <DetalleSolicitud solicitud={seleccionada} />}
                <div className="flex justify-end mt-6">
                    <button onClick={cerrarModal}
                        className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                        Cerrar
                    </button>
                </div>
            </Modal>

            {/* ── Modal Admitir ── */}
            <Modal open={modal === 'admitir'} onClose={cerrarModal} title="Admitir Solicitud">
                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                        Se generará el <strong>número de expediente</strong> y se notificará
                        al demandante. El demandado tendrá <strong>5 días hábiles</strong> para apersonarse.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                            Notas internas (opcional)
                        </label>
                        <textarea rows={3}
                            placeholder="Observaciones de la admisión..."
                            value={form.observacion ?? ''}
                            onChange={e => setForm({ ...form, observacion: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            onClick={() => enviar(route('expedientes.admitir', seleccionada?.id), form)}
                            disabled={procesando}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                            {procesando ? 'Procesando...' : 'Admitir y Generar Expediente'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal Observar ── */}
            <Modal open={modal === 'observar'} onClose={cerrarModal} title="Solicitar Subsanación">
                <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                        Según el reglamento, el demandante tiene <strong>3 días hábiles</strong> para subsanar.
                        La solicitud quedará en espera hasta que corrija.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                            Observación <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <textarea rows={4} required
                            placeholder="Detalle exactamente qué debe corregir o adjuntar el demandante..."
                            value={form.observacion ?? ''}
                            onChange={e => setForm({ ...form, observacion: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-[#291136] shrink-0">
                            Plazo (días hábiles):
                        </label>
                        <input type="number" min={1} max={10}
                            value={form.plazo_dias ?? 3}
                            onChange={e => setForm({ ...form, plazo_dias: parseInt(e.target.value) })}
                            className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                        <span className="text-xs text-gray-400">(Reglamento: 3 días)</span>
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            onClick={() => enviar(route('expedientes.observar', seleccionada?.id), form)}
                            disabled={procesando || !form.observacion}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50">
                            {procesando ? 'Enviando...' : 'Enviar Observación'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Modal Rechazar ── */}
            <Modal open={modal === 'rechazar'} onClose={cerrarModal} title="Rechazar Solicitud">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                        <strong>Acción irreversible.</strong> El demandante será notificado
                        por email con el motivo del rechazo.
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                            Motivo del rechazo <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <textarea rows={4} required
                            placeholder="Fundamente el motivo legal del rechazo..."
                            value={form.motivo ?? ''}
                            onChange={e => setForm({ ...form, motivo: e.target.value })}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button onClick={cerrarModal}
                            className="px-4 py-2 rounded-xl text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            onClick={() => enviar(route('expedientes.rechazar', seleccionada?.id), form)}
                            disabled={procesando || !form.motivo}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            {procesando ? 'Procesando...' : 'Rechazar Solicitud'}
                        </button>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}