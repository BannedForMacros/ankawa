import { useState } from 'react';
import { router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { Eye, CheckCircle2, AlertTriangle, XCircle, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

// ── IMPORTACIÓN DE TUS COMPONENTES ──
import Table from '@/Components/Table';
import Modal from '@/Components/Modal';

// ── Badge de Estado ──
function EstadoBadge({ estado }) {
    const map = {
        pendiente:   { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente'   },
        subsanacion: { color: 'bg-orange-100 text-orange-800', label: 'Subsanación' },
        rechazada:   { color: 'bg-red-100 text-red-800',       label: 'Rechazada'   },
        admitida:    { color: 'bg-green-100 text-green-800',   label: 'Admitida'    },
    };
    const s = map[estado] ?? { color: 'bg-gray-100 text-gray-500', label: estado };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
        </span>
    );
}

// ── Panel de detalle solicitud (dentro del Modal) ──
function DetalleSolicitud({ solicitud }) {
    return (
        <div className="space-y-4 text-sm mt-4">
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: 'N° Cargo',    value: <span className="font-mono font-bold text-[#291136]">{solicitud.numero_cargo}</span> },
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{d.label}</div>
                        <div className="font-medium text-gray-800">{d.value ?? '—'}</div>
                    </div>
                ))}
            </div>
            <div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Resumen de controversia</div>
                <div className="text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed border border-gray-100 text-sm">
                    {solicitud.resumen_controversia}
                </div>
            </div>

            {/* Subsanación activa si existe */}
            {solicitud.subsanacion_activa && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-4">
                    <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Subsanación pendiente del cliente
                    </div>
                    <p className="text-sm text-orange-800 leading-relaxed mb-2">{solicitud.subsanacion_activa.observacion}</p>
                    <div className="text-[10px] text-orange-600 font-semibold flex items-center justify-between border-t border-orange-200/50 pt-2 mt-2">
                        <span>Registrado por: {solicitud.subsanacion_activa.registrado_por?.name}</span>
                        <span>Vence: {solicitud.subsanacion_activa.fecha_limite}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Bandeja({ solicitudes, filtroActual, contadores }) {

    // Estados para Modales
    const [modal, setModal]               = useState(null); // 'detalle' | 'admitir' | 'observar' | 'rechazar'
    const [seleccionada, setSeleccionada] = useState(null);
    const [form, setForm]                 = useState({});
    const [procesando, setProcesando]     = useState(false);

    // Funciones de Modal
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

    // Cambio de Filtro
    const cambiarFiltro = (filtro) => {
        router.get(route('mesa-partes.bandeja'), { filtro }, {
            preserveState: true,
            replace: true,
        });
    };

    // Envío de Formularios (Admitir, Observar, Rechazar)
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

    const filtros = [
        { key: 'todos',       label: 'Todos',       count: contadores.todos       },
        { key: 'pendiente',   label: 'Pendientes',  count: contadores.pendiente   },
        { key: 'subsanacion', label: 'Subsanación', count: contadores.subsanacion },
        { key: 'rechazada',   label: 'Rechazadas',  count: contadores.rechazada   },
    ];

    // ── CONFIGURACIÓN DE COLUMNAS PARA TU COMPONENTE TABLE ──
    const columnas = [
        { 
            key: 'numero_cargo', 
            label: 'N° Cargo', 
            sortable: false, // Como estamos filtrando en front, desactivamos sort de backend
            render: (s) => (
                <div>
                    <span className="font-mono font-bold text-[#291136] text-xs">
                        {s.numero_cargo}
                    </span>
                    {s.subsanacion_activa && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-orange-500 font-semibold">
                            <AlertTriangle size={10} /> Subsanando
                        </div>
                    )}
                </div>
            )
        },
        { key: 'servicio', label: 'Servicio', sortable: false },
        { 
            key: 'nombre_demandante', 
            label: 'Demandante', 
            sortable: false,
            render: (s) => (
                <div>
                    <div className="font-semibold text-gray-800">{s.nombre_demandante}</div>
                    <div className="text-xs text-gray-400">{s.email_demandante}</div>
                </div>
            )
        },
        { 
            key: 'nombre_demandado', 
            label: 'Demandado', 
            sortable: false,
            render: (s) => (
                <div>
                    <div className="text-gray-700">{s.nombre_demandado}</div>
                    <div className="text-xs text-gray-400">{s.email_demandado || '—'}</div>
                </div>
            )
        },
        { 
            key: 'estado', 
            label: 'Estado', 
            sortable: false,
            render: (s) => <EstadoBadge estado={s.estado} />
        },
        { 
            key: 'created_at', 
            label: 'Fecha', 
            sortable: false,
            render: (s) => <span className="text-xs text-gray-500">{s.created_at}</span>
        },
        { 
            key: 'acciones', 
            label: 'Acciones', 
            sortable: false,
            render: (s) => (
                <div className="flex items-center gap-1">
                    <button onClick={() => abrirModal('detalle', s)} title="Ver detalle"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#291136] hover:bg-gray-100 transition-colors">
                        <Eye size={16} />
                    </button>

                    {s.estado === 'pendiente' && (
                        <>
                            <button onClick={() => abrirModal('admitir', s)} title="Admitir solicitud"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
                                <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => abrirModal('observar', s, { plazo_dias: 3 })} title="Solicitar subsanación"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                                <AlertTriangle size={16} />
                            </button>
                            <button onClick={() => abrirModal('rechazar', s)} title="Rechazar solicitud"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                <XCircle size={16} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Bandeja de Solicitudes" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Cabecera Principal */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[#291136]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Bandeja de Solicitudes
                        </h1>
                        <p className="text-gray-500 mt-1 text-sm">
                            Solicitudes pendientes de revisión y admisión
                        </p>
                    </div>

                    {/* Contenedor Principal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        
                        {/* Filtros (Pestañas) */}
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100 flex-wrap bg-gray-50/50">
                            <Filter size={14} className="text-gray-400 shrink-0" />
                            {filtros.map(f => (
                                <button key={f.key} onClick={() => cambiarFiltro(f.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                                        ${filtroActual === f.key ? 'bg-[#291136] text-white shadow-md' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                                    {f.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                                        ${filtroActual === f.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {f.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Tu Componente Table */}
                        <div className="p-4">
                            <Table 
                                columns={columnas} 
                                data={solicitudes} 
                                routeName="mesa-partes.bandeja" 
                                searchPlaceholder="Buscar por número o demandante..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Detalle ── */}
            <Modal show={modal === 'detalle'} onClose={cerrarModal} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-[#291136]">
                            Detalle de Solicitud: {seleccionada?.numero_cargo}
                        </h2>
                        <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <XCircle size={20} />
                        </button>
                    </div>
                    {seleccionada && <DetalleSolicitud solicitud={seleccionada} />}
                </div>
            </Modal>

            {/* ── Modal Admitir ── */}
            <Modal show={modal === 'admitir'} onClose={cerrarModal} maxWidth="lg">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-[#291136] mb-4">Admitir Solicitud</h2>
                    <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 leading-relaxed">
                            Se generará automáticamente el <strong>número de expediente</strong> y se notificará
                            por correo al demandante.
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
                        <div className="flex gap-3 justify-end pt-4">
                            <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={() => enviar(route('expedientes.admitir', seleccionada?.id), form)} disabled={procesando}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
                                {procesando ? 'Procesando...' : 'Admitir a Trámite'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Modal Observar ── */}
            <Modal show={modal === 'observar'} onClose={cerrarModal} maxWidth="lg">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-[#291136] mb-4">Solicitar Subsanación</h2>
                    <div className="space-y-4">
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 leading-relaxed">
                            El demandante tendrá <strong>{form.plazo_dias || 3} días hábiles</strong> para subsanar y corregir su solicitud.
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Detalle de Observación <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <textarea rows={4} required
                                placeholder="Indique qué documentos faltan o qué datos debe corregir..."
                                value={form.observacion ?? ''}
                                onChange={e => setForm({ ...form, observacion: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                    focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-[#291136] shrink-0">Plazo otorgado:</label>
                            <input type="number" min={1} max={10} value={form.plazo_dias ?? 3}
                                onChange={e => setForm({ ...form, plazo_dias: parseInt(e.target.value) })}
                                className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center
                                    focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                            <span className="text-xs text-gray-400">días hábiles</span>
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={() => enviar(route('expedientes.observar', seleccionada?.id), form)} disabled={procesando || !form.observacion}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 shadow-md">
                                {procesando ? 'Enviando...' : 'Notificar Observación'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Modal Rechazar ── */}
            <Modal show={modal === 'rechazar'} onClose={cerrarModal} maxWidth="lg">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-red-600 mb-4">Rechazar Solicitud</h2>
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 leading-relaxed">
                            <strong>Atención: Esta acción es irreversible.</strong> La solicitud será archivada y el demandante notificado del rechazo definitivo.
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Motivo Legal del Rechazo <span className="text-red-500">*</span>
                            </label>
                            <textarea rows={4} required
                                placeholder="Fundamente por qué no procede..."
                                value={form.motivo ?? ''}
                                onChange={e => setForm({ ...form, motivo: e.target.value })}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                    focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none" />
                        </div>
                        <div className="flex gap-3 justify-end pt-4">
                            <button onClick={cerrarModal} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={() => enviar(route('expedientes.rechazar', seleccionada?.id), form)} disabled={procesando || !form.motivo}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 shadow-md">
                                {procesando ? 'Procesando...' : 'Rechazar Definitivamente'}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

        </AuthenticatedLayout>
    );
}