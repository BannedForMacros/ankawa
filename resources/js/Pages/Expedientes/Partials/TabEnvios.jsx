import { useEffect, useState } from 'react';
import {
    Inbox, FileText, Clock, CheckCircle2, XCircle, Mail,
    ChevronDown, ChevronUp, AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/Components/ConfirmModal';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EstadoChip({ estado }) {
    const map = {
        pendiente_aceptacion: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pendiente de aceptación', Icon: Clock },
        recibido:             { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Aceptado', Icon: CheckCircle2 },
        rechazado:            { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Rechazado', Icon: XCircle },
    };
    const it = map[estado] ?? map.pendiente_aceptacion;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${it.cls}`}>
            <it.Icon size={12} /> {it.label}
        </span>
    );
}

function EnvioCard({ envio, onAceptar, onRechazar, accionable }) {
    const [open, setOpen] = useState(accionable);
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#4A153D]/10 flex items-center justify-center shrink-0">
                        <Inbox size={18} className="text-[#4A153D]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-bold text-[#291136]">
                                {envio.tipo_documento ?? 'Documento'}
                            </span>
                            <EstadoChip estado={envio.estado} />
                            {envio.etapa && (
                                <span className="text-xs text-gray-400">· {envio.etapa}</span>
                            )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{envio.descripcion}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1"><Mail size={11} /> {envio.portal_email}</span>
                            <span className="flex items-center gap-1"><Clock size={11} /> Enviado: {envio.fecha_envio}</span>
                            {envio.fecha_aceptacion && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 size={11} /> Aceptado: {envio.fecha_aceptacion} ({envio.aceptado_por})
                                </span>
                            )}
                            {envio.fecha_rechazo && (
                                <span className="flex items-center gap-1 text-red-600">
                                    <XCircle size={11} /> Rechazado: {envio.fecha_rechazo} ({envio.rechazado_por})
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="shrink-0 text-gray-400">
                    {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                </div>
            </button>

            {open && (
                <div className="border-t border-gray-100 px-5 py-4 space-y-4">
                    {envio.descripcion && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Descripción del remitente</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{envio.descripcion}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
                            Documentos adjuntos ({envio.documentos?.length ?? 0})
                        </p>
                        {envio.documentos && envio.documentos.length > 0 ? (
                            <div className="space-y-2">
                                {envio.documentos.map(doc => (
                                    <a
                                        key={doc.id}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors group"
                                    >
                                        <FileText size={18} className="text-[#BE0F4A] shrink-0" />
                                        <span className="text-sm text-gray-700 group-hover:text-[#BE0F4A] flex-1 truncate font-medium">
                                            {doc.nombre_original}
                                        </span>
                                        <span className="text-xs text-gray-400 shrink-0">{formatBytes(doc.peso_bytes)}</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Sin adjuntos.</p>
                        )}
                    </div>

                    {envio.motivo_rechazo && (
                        <div className="p-3 rounded-lg border border-red-200 bg-red-50">
                            <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-1">Motivo de rechazo</p>
                            <p className="text-sm text-red-700 whitespace-pre-wrap">{envio.motivo_rechazo}</p>
                        </div>
                    )}

                    {accionable && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                                onClick={() => onRechazar(envio)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <XCircle size={15}/> Rechazar
                            </button>
                            <button
                                onClick={() => onAceptar(envio)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                                <CheckCircle2 size={15}/> Aceptar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function ModalRechazar({ envio, onCancelar, onConfirmar, procesando }) {
    const [motivo, setMotivo] = useState('');

    function submit() {
        if (!motivo.trim()) {
            toast.error('Debes indicar el motivo del rechazo.');
            return;
        }
        onConfirmar(motivo);
    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4">
                    <h3 className="text-white font-bold">Rechazar envío</h3>
                    <p className="text-white/60 text-xs mt-0.5">{envio.tipo_documento}</p>
                </div>
                <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-600">
                        El envío se marcará como rechazado y no aparecerá en el historial del expediente. El motivo quedará auditado.
                    </p>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Motivo del rechazo *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            rows={4}
                            placeholder="Indica brevemente por qué se rechaza el envío..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none"
                            maxLength={2000}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{motivo.length}/2000</p>
                    </div>
                </div>
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onCancelar}
                        disabled={procesando}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={submit}
                        disabled={procesando || !motivo.trim()}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                        {procesando ? 'Procesando...' : 'Rechazar envío'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function TabEnvios({ expedienteId, onCambio = null }) {
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [pendientes, setPend]     = useState([]);
    const [procesados, setProces]   = useState([]);
    const [mostrarProc, setMostrarProc] = useState(false);

    const [confirmAceptar, setConfirmAceptar] = useState(null);
    const [modalRechazar, setModalRechazar]   = useState(null);
    const [procesando, setProcesando]         = useState(false);

    async function cargar() {
        setLoading(true);
        setError(null);
        try {
            const { data } = await window.axios.get(route('expedientes.envios.index', expedienteId));
            setPend(data.pendientes ?? []);
            setProces(data.procesados ?? []);
        } catch (e) {
            setError(e.response?.data?.mensaje ?? e.message ?? 'Error de conexión');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { cargar(); }, [expedienteId]);

    async function aceptarConfirmado() {
        if (!confirmAceptar) return;
        setProcesando(true);
        try {
            const { data } = await window.axios.post(
                route('expedientes.envios.aceptar', [expedienteId, confirmAceptar.id])
            );
            if (data.ok) {
                toast.success(data.mensaje ?? 'Envío aceptado');
                setConfirmAceptar(null);
                await cargar();
                onCambio?.();
            } else {
                toast.error(data.mensaje ?? 'No se pudo aceptar el envío');
            }
        } catch (e) {
            toast.error(e.response?.data?.message ?? e.response?.data?.mensaje ?? 'Error de conexión');
        } finally {
            setProcesando(false);
        }
    }

    async function rechazarConfirmado(motivo) {
        if (!modalRechazar) return;
        setProcesando(true);
        try {
            const { data } = await window.axios.post(
                route('expedientes.envios.rechazar', [expedienteId, modalRechazar.id]),
                { motivo }
            );
            if (data.ok) {
                toast.success(data.mensaje ?? 'Envío rechazado');
                setModalRechazar(null);
                await cargar();
                onCambio?.();
            } else {
                toast.error(data.mensaje ?? 'No se pudo rechazar');
            }
        } catch (e) {
            toast.error(e.response?.data?.message ?? e.response?.data?.mensaje ?? 'Error de conexión');
        } finally {
            setProcesando(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/3" />
                                <div className="h-3 bg-gray-100 rounded w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
                <AlertCircle size={32} className="text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-semibold">{error}</p>
                <button
                    onClick={cargar}
                    className="mt-3 px-4 py-1.5 text-sm font-bold rounded-xl bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <ConfirmModal
                open={!!confirmAceptar}
                titulo="Aceptar envío"
                resumen="El envío quedará incorporado al expediente y aparecerá en el historial con la fecha en que el remitente lo envió."
                detalles={confirmAceptar ? [
                    { label: 'Tipo de documento', value: confirmAceptar.tipo_documento ?? '—' },
                    { label: 'Remitente',         value: confirmAceptar.portal_email },
                    { label: 'Fecha de envío',    value: confirmAceptar.fecha_envio },
                    { label: 'Documentos',        value: `${confirmAceptar.documentos?.length ?? 0} archivo(s)` },
                ] : []}
                variant="info"
                onConfirm={aceptarConfirmado}
                onCancel={() => !procesando && setConfirmAceptar(null)}
                confirmando={procesando}
            />

            {modalRechazar && (
                <ModalRechazar
                    envio={modalRechazar}
                    procesando={procesando}
                    onCancelar={() => !procesando && setModalRechazar(null)}
                    onConfirmar={rechazarConfirmado}
                />
            )}

            {/* Header */}
            <div className="bg-white rounded-2xl border border-[#BE0F4A]/20 shadow-sm overflow-hidden">
                <div
                    className="px-5 py-3 border-l-4 border-[#BE0F4A] flex items-center justify-between gap-3 flex-wrap"
                    style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
                >
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Inbox size={15}/> Envíos del Portal Externo
                        </h3>
                        <p className="text-white/60 text-xs mt-0.5">
                            Documentos enviados por las partes a este expediente sin requerimiento previo.
                        </p>
                    </div>
                    {pendientes.length > 0 && (
                        <span className="px-3 py-1 rounded-full bg-amber-300 text-[#291136] text-xs font-black flex items-center gap-1.5 shadow">
                            <Clock size={11}/> {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Pendientes */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-[#291136] uppercase tracking-wide flex items-center gap-2">
                        <Clock size={14} className="text-amber-600"/> Pendientes de aceptación
                    </h4>
                    <span className="text-xs text-gray-400">{pendientes.length}</span>
                </div>
                {pendientes.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <CheckCircle2 size={28} className="text-emerald-300 mx-auto mb-2"/>
                        <p className="text-sm text-gray-500 font-medium">Sin envíos pendientes.</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cuando una parte envíe un documento desde el portal, aparecerá aquí.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendientes.map(envio => (
                            <EnvioCard
                                key={envio.id}
                                envio={envio}
                                accionable
                                onAceptar={() => setConfirmAceptar(envio)}
                                onRechazar={() => setModalRechazar(envio)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Procesados */}
            <div>
                <button
                    onClick={() => setMostrarProc(p => !p)}
                    className="w-full flex items-center justify-between mb-2 text-left"
                >
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        {mostrarProc ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        Procesados (aceptados / rechazados)
                    </h4>
                    <span className="text-xs text-gray-400">{procesados.length}</span>
                </button>
                {mostrarProc && (
                    procesados.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Aún no hay envíos procesados.</p>
                    ) : (
                        <div className="space-y-3">
                            {procesados.map(envio => (
                                <EnvioCard key={envio.id} envio={envio} accionable={false} />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
