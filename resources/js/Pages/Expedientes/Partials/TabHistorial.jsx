import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    FileText, Download, ChevronDown, ChevronUp,
    Clock, CheckCircle, AlertTriangle, Eye, CheckSquare,
    ArrowRight, Send, Bell, UserCheck, CalendarDays, Mail, Inbox, Timer
} from 'lucide-react';

const estadoConfig = {
    recibido:   { Icon: Eye,           color: 'bg-purple-50 text-purple-600 border-purple-200',    label: 'Recibido' },
    pendiente:  { Icon: Clock,         color: 'bg-blue-50 text-blue-600 border-blue-200',          label: 'Pendiente' },
    respondido: { Icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Respondido' },
    vencido:    { Icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-200',             label: 'Vencido' },
};

const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    gray:    'bg-gray-50 text-gray-600 border-gray-200',
};

const TIPO_LABELS = {
    requerimiento: { label: 'Requerimiento',     badge: 'bg-blue-50 text-blue-600 border-blue-200',         Icon: Send,      iconBg: 'bg-blue-100 text-blue-600' },
    notificacion:  { label: 'Notificación',      badge: 'bg-purple-50 text-purple-600 border-purple-200',   Icon: Bell,      iconBg: 'bg-purple-100 text-purple-600' },
    propia:        { label: 'Act. Propia',       badge: 'bg-amber-50 text-amber-600 border-amber-200',      Icon: UserCheck, iconBg: 'bg-amber-100 text-amber-600' },
    envio_externo: { label: 'Envío externo',     badge: 'bg-[#4A153D]/5 text-[#4A153D] border-[#4A153D]/20', Icon: Inbox,     iconBg: 'bg-[#4A153D]/10 text-[#4A153D]' },
};

function formatFecha(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const fecha = d.toLocaleDateString('es-PE', {
        day:   '2-digit',
        month: 'short',
        year:  'numeric',
    });
    const hora = d.toLocaleTimeString('es-PE', {
        hour:   '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    return `${fecha} · ${hora}`;
}

// ── Resolver Panel ───────────────────────────────────────────────────────────
function ResolverPanel({ mov, expedienteId, tiposResolucion }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ resolucion_tipo_id: '', resolucion_nota: '' });
    const tipoSel = tiposResolucion.find(t => String(t.id) === String(form.data.resolucion_tipo_id));

    function submit(e) {
        e.preventDefault();
        form.post(route('expedientes.movimientos.resolver', [expedienteId, mov.id]), {
            onSuccess: () => setOpen(false),
        });
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors">
                <CheckSquare size={14}/> Resolver
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="mt-2 p-3 bg-[#291136]/5 rounded-xl border border-[#291136]/10 space-y-3">
            <div className="flex flex-wrap gap-2">
                {tiposResolucion.map(tr => (
                    <button key={tr.id} type="button"
                        onClick={() => form.setData('resolucion_tipo_id', String(tr.id))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${
                            String(form.data.resolucion_tipo_id) === String(tr.id)
                                ? (colorMap[tr.color] ?? colorMap.gray) + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}>
                        {tr.nombre}
                    </button>
                ))}
            </div>
            {tipoSel?.requiere_nota && (
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Nota de resolución *</label>
                    <textarea value={form.data.resolucion_nota} onChange={e => form.setData('resolucion_nota', e.target.value)}
                        rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"/>
                </div>
            )}
            <div className="flex gap-2">
                <button type="submit" disabled={!form.data.resolucion_tipo_id || form.processing}
                    className="px-4 py-1.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-40">
                    Confirmar
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600">
                    Cancelar
                </button>
            </div>
        </form>
    );
}

// ── Continuar Panel ──────────────────────────────────────────────────────────
function ContinuarPanel({ mov, expedienteId, onContinuar }) {
    const [open, setOpen] = useState(false);
    const [dias, setDias] = useState('');
    const [procesando, setProcesando] = useState(false);

    function confirmar() {
        setProcesando(true);
        router.post(
            route('expedientes.movimientos.extender-plazo', [expedienteId, mov.id]),
            { dias_plazo: dias || null },
            {
                preserveScroll: true,
                onSuccess: () => { setOpen(false); setProcesando(false); onContinuar?.(); },
                onError: () => setProcesando(false),
            }
        );
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                <ArrowRight size={14}/> Continuar proceso
            </button>
        );
    }

    return (
        <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <p className="text-sm text-amber-800 font-semibold">
                Este movimiento quedará <strong>pendiente</strong>. Puedes ampliar el plazo al actor si lo deseas.
            </p>
            <div className="flex items-center gap-3">
                <div>
                    <label className="block text-sm font-semibold text-amber-700 mb-1">Nuevo plazo (días)</label>
                    <input type="number" min="1" max="365" value={dias} onChange={e => setDias(e.target.value)}
                        placeholder="Ej: 5" className="w-24 text-sm border border-amber-300 rounded-lg px-2 py-1.5 bg-white"/>
                </div>
                <p className="text-sm text-amber-600 mt-4">
                    {dias ? `+${dias} días desde hoy` : 'Sin cambio de plazo'}
                </p>
            </div>
            <div className="flex gap-2">
                <button onClick={confirmar} disabled={procesando}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                    <ArrowRight size={13}/> Confirmar y crear siguiente
                </button>
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
        </div>
    );
}

// ── Tarjeta de respuesta ─────────────────────────────────────────────────────
function RespuestaCard({ mov }) {
    const [verDocs, setVerDocs] = useState(false);
    const docsRespuesta = mov.documentos?.filter(d => d.momento === 'respuesta') ?? [];

    return (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3 shadow-sm">
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Respuesta</span>
                        {mov.fecha_respuesta && (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                                <CalendarDays size={13}/> {formatFecha(mov.fecha_respuesta)}
                            </span>
                        )}
                        {mov.respondido_por?.name && (
                            <span className="text-sm text-gray-500">{mov.respondido_por.name}</span>
                        )}
                        {mov.cargo?.numero_cargo && (
                            <span className="text-xs font-mono font-bold text-[#291136] bg-[#291136]/5 px-2 py-0.5 rounded border border-[#291136]/10">
                                {mov.cargo.numero_cargo}
                            </span>
                        )}
                        {docsRespuesta.length > 0 && (
                            <button onClick={() => setVerDocs(v => !v)}
                                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-bold">
                                <FileText size={11}/> {docsRespuesta.length} doc(s) {verDocs ? '▲' : '▼'}
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{mov.respuesta}</p>

                    {verDocs && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {docsRespuesta.map(doc => (
                                <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                    <FileText size={11}/> {doc.nombre_original} <Download size={10}/>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Tarjeta de movimiento ────────────────────────────────────────────────────
function MovimientoCard({ mov, esGestor, expedienteId, tiposResolucion, onIrANuevo, expandidos, toggleExpandir, docsSolicitud, esUltimo, actores = [] }) {
    const cfg = estadoConfig[mov.estado] ?? estadoConfig.pendiente;
    const expandido = expandidos.has(mov.id);
    const resolucion = mov.resolucion_tipo;
    const tieneRespuesta = !!mov.respuesta;
    const docsCreacion = mov.documentos?.filter(d => d.momento === 'creacion') ?? [];
    const todosDocsMov = [...docsCreacion, ...(docsSolicitud ?? [])];
    const pivotRows = mov.responsables ?? [];
    const extensiones = mov.extensiones ?? [];
    const tieneExtras = todosDocsMov.length > 0 || mov.observaciones || resolucion || pivotRows.length > 0 || extensiones.length > 0;
    const tieneResponsable = !!mov.usuario_responsable_id || pivotRows.length > 0;
    const puedeResolver  = esGestor && mov.estado === 'respondido' && tieneResponsable && !mov.resolucion_tipo_id;
    const puedeContinuar = esGestor && mov.estado === 'pendiente'  && tieneResponsable && onIrANuevo;
    let responsablesDisplay = mov.usuario_responsable?.name ?? null;
    const tipoMov = TIPO_LABELS[mov.tipo] ?? TIPO_LABELS.requerimiento;

    return (
        <div className="relative flex gap-3 pb-4">

            {/* 1. COLUMNA TIMELINE */}
            <div className="flex flex-col items-center shrink-0 relative" style={{ width: '28px' }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 relative ${tipoMov.iconBg}`}>
                    <tipoMov.Icon size={14}/>
                </div>
                {!esUltimo && (
                    <div className="flex-1 w-px bg-gray-200 mt-1" />
                )}
            </div>

            {/* 2. COLUMNA CONTENIDO */}
            <div className="flex-1 min-w-0">

                {/* Tarjeta principal */}
                <div className={`bg-white rounded-xl border border-gray-100 border-l-4 shadow-sm overflow-hidden z-10 relative transition-shadow duration-200 hover:shadow-md ${{
                        requerimiento: 'border-l-[#BE0F4A]',
                        notificacion:  'border-l-indigo-400',
                        propia:        'border-l-gray-400',
                    }[mov.tipo] ?? 'border-l-[#BE0F4A]/50'}`}>
                    <div className="p-3.5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                {/* Instrucción */}
                                <p className="text-base font-bold text-[#291136] mb-2 leading-snug">{mov.instruccion}</p>

                                {/* Fecha — prominente */}
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <CalendarDays size={14} className="text-[#BE0F4A] shrink-0"/>
                                    <span className="text-sm font-semibold text-[#291136]">
                                        {formatFecha(mov.created_at)}
                                    </span>
                                </div>

                                {/* Meta info */}
                                <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                                    {mov.tipo === 'envio_externo' && mov.portal_email_envio ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Mail size={12} className="text-[#4A153D]"/>
                                            <span>Enviado por <strong className="text-[#291136] font-semibold">{mov.portal_email_envio}</strong></span>
                                        </span>
                                    ) : mov.creado_por?.name && (
                                        <span>{mov.creado_por.name}</span>
                                    )}
                                    {pivotRows.length > 0 ? (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-gray-400 text-xs">→</span>
                                            <div className="flex flex-wrap gap-1">
                                                {pivotRows.map(r => {
                                                    const nombre = r.actor?.usuario?.name ?? r.actor?.nombre_externo ?? 'Actor';
                                                    const tipo   = r.tipo_actor?.nombre ?? r.actor?.tipo_actor?.nombre;
                                                    const est    = r.estado ?? 'pendiente';
                                                    const chipCls = est === 'respondido'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : est === 'vencido'
                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200';
                                                    return (
                                                        <span key={r.id} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${chipCls}`}>
                                                            {nombre}{tipo ? ` (${tipo})` : ''}
                                                            {est === 'respondido' ? ' ✓' : est === 'vencido' ? ' ✗' : ' ⏳'}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : responsablesDisplay ? (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span>→ <strong className="text-[#291136] font-semibold">{responsablesDisplay}</strong></span>
                                        </>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                {extensiones.length > 0 && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1">
                                        <Timer size={11}/> {extensiones.length === 1 ? 'Plazo extendido' : `${extensiones.length} extensiones`}
                                    </span>
                                )}
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tipoMov.badge}`}>
                                    {tipoMov.label}
                                </span>
                                {resolucion && (
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorMap[resolucion.color] ?? colorMap.gray}`}>
                                        {resolucion.nombre}
                                    </span>
                                )}
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                                {(tieneExtras || puedeResolver || puedeContinuar) && (
                                    <button onClick={() => toggleExpandir(mov.id)}
                                        className="text-[#BE0F4A]/50 hover:text-[#BE0F4A] transition-colors">
                                        {expandido ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contenido Expandido */}
                    {expandido && (
                        <div className="px-3.5 pb-3.5 border-t border-gray-50 space-y-3 pt-3">
                            {mov.observaciones && (
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">{mov.observaciones}</p>
                            )}
                            {pivotRows.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Responsables del requerimiento</p>
                                    <div className="space-y-1.5">
                                        {pivotRows.map(r => {
                                            const nombre = r.actor?.usuario?.name ?? r.actor?.nombre_externo ?? 'Actor';
                                            const tipo   = r.tipo_actor?.nombre ?? r.actor?.tipo_actor?.nombre;
                                            const est    = r.estado ?? 'pendiente';
                                            const chipCls = est === 'respondido'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : est === 'vencido'
                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200';
                                            return (
                                                <div key={r.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${chipCls}`}>
                                                    <span className="font-semibold">
                                                        {nombre}{tipo ? ` — ${tipo}` : ''}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {r.dias_plazo && (
                                                            <span className="text-[10px] font-medium opacity-70">
                                                                {r.dias_plazo} días {r.tipo_dias === 'habiles' ? 'háb.' : 'cal.'}
                                                            </span>
                                                        )}
                                                        <span className="font-bold uppercase tracking-wide text-[10px]">
                                                            {est === 'respondido' ? '✓ Respondido' : est === 'vencido' ? '✗ Vencido' : '⏳ Pendiente'}
                                                        </span>
                                                        {est === 'respondido' && r.respondido_por?.name && (
                                                            <span className="opacity-70">{r.respondido_por.name}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {todosDocsMov.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-400 mb-1.5">Documentos adjuntos</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {todosDocsMov.map(doc => (
                                            <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                                                <FileText size={11}/> {doc.nombre_original} <Download size={10}/>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {mov.notificaciones?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                                        <Mail size={11} className="text-[#BE0F4A]" /> Notificado a
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {mov.notificaciones.map(n => (
                                            <span key={n.id} className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                                                n.estado_envio === 'enviado'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : n.estado_envio === 'fallido' ? 'bg-red-50 text-red-600 border-red-200'
                                                : 'bg-gray-50 text-gray-500 border-gray-200'
                                            }`}>
                                                {n.email_destino}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {extensiones.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                                        <Timer size={11}/> Extensiones de plazo
                                    </p>
                                    <div className="space-y-1.5">
                                        {extensiones.map(ext => {
                                            const sufijoDias = ext.tipo_dias === 'habiles' ? 'háb.' : 'cal.';
                                            return (
                                                <div key={ext.id} className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-xs">
                                                    <Timer size={13} className="text-amber-600 mt-0.5 shrink-0"/>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-amber-800">
                                                            Plazo extendido a <strong>{ext.dias_plazo_nuevo} días {sufijoDias}</strong>
                                                            {ext.dias_plazo_anterior && (
                                                                <span className="font-normal text-amber-700"> (antes: {ext.dias_plazo_anterior} días {sufijoDias})</span>
                                                            )}
                                                        </p>
                                                        <p className="text-amber-700 mt-0.5">
                                                            Nueva fecha límite: <strong>{formatFecha(ext.fecha_limite_nueva)}</strong>
                                                            {ext.fecha_limite_anterior && (
                                                                <span className="font-normal"> · antes: {formatFecha(ext.fecha_limite_anterior)}</span>
                                                            )}
                                                        </p>
                                                        <p className="text-amber-600 mt-1 flex items-center gap-2 flex-wrap">
                                                            <span className="inline-flex items-center gap-1">
                                                                <CalendarDays size={10}/> {formatFecha(ext.created_at)}
                                                            </span>
                                                            {ext.extendido_por?.name && (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <UserCheck size={10}/> {ext.extendido_por.name}
                                                                </span>
                                                            )}
                                                            {ext.estado_anterior === 'vencido' && (
                                                                <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase">Estaba vencido</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {(puedeResolver || puedeContinuar) && (
                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                    {puedeResolver && <ResolverPanel mov={mov} expedienteId={expedienteId} tiposResolucion={tiposResolucion}/>}
                                    {puedeContinuar && <ContinuarPanel mov={mov} expedienteId={expedienteId} onContinuar={onIrANuevo}/>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sub-nodo de respuesta */}
                {tieneRespuesta && (
                    <div className="relative mt-2 pl-8">
                        <div
                            className="absolute border-l-2 border-b-2 border-gray-200 rounded-bl-xl pointer-events-none"
                            style={{ left: '16px', top: '-8px', width: '16px', height: '24px', zIndex: 0 }}
                        />
                        <div className="relative z-10">
                            <RespuestaCard mov={mov} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Agrupar movimientos por etapa ────────────────────────────────────────────
function agruparPorEtapa(movimientos) {
    const cronologico = [...movimientos].reverse();
    const grupos = [];
    let grupoActual = null;

    for (const mov of cronologico) {
        const etapaId = mov.etapa_id;
        const etapaNombre = mov.etapa?.nombre ?? 'Sin etapa';

        if (!grupoActual || grupoActual.etapaId !== etapaId) {
            grupoActual = {
                etapaId,
                etapaNombre,
                movimientos: [],
                esTransicion: grupos.length > 0,
            };
            grupos.push(grupoActual);
        }

        grupoActual.movimientos.push(mov);
    }

    return grupos;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabHistorial({ movimientos = [], solicitud, esGestor = false, expedienteId, tiposResolucion = [], onIrANuevo = null, actores = [] }) {
    const [expandidos, setExpandidos] = useState(new Set());

    function toggleExpandir(id) {
        setExpandidos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    // Excluir envíos espontáneos pendientes de aceptación o rechazados.
    // Los envíos aceptados (estado 'recibido') sí aparecen en el historial con la fecha de envío del externo.
    const movimientosVisibles = movimientos.filter(m =>
        m.tipo !== 'envio_externo' || m.estado === 'recibido'
    );
    const grupos = agruparPorEtapa(movimientosVisibles);

    return (
        <div className="space-y-4">

            {/* ── Resumen del expediente ── */}
            {solicitud && (
                <div className="bg-white rounded-2xl border border-[#BE0F4A]/20 shadow-sm overflow-hidden">
                    <div
                        className="px-5 py-3"
                        style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
                    >
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Resumen del Expediente</h3>
                    </div>
                    <div
                        className="h-[2px]"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }}
                    />
                    <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                            <span className="text-sm text-gray-400 block mb-0.5">Demandante</span>
                            <span className="text-base font-semibold text-[#291136]">{solicitud.nombre_demandante}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-400 block mb-0.5">Demandado</span>
                            <span className="text-base font-semibold text-[#291136]">{solicitud.nombre_demandado}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-400 block mb-0.5">N. Cargo</span>
                            <span className="text-base font-mono font-semibold text-[#291136]">{solicitud.numero_cargo}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-400 block mb-0.5">Solicitud</span>
                            <span className={`text-base font-bold ${
                                solicitud.resultado_revision === 'conforme' ? 'text-emerald-600'
                                : solicitud.resultado_revision === 'no_conforme' ? 'text-red-600'
                                : 'text-amber-600'
                            }`}>
                                {solicitud.resultado_revision === 'conforme' ? 'Admitida'
                                : solicitud.resultado_revision === 'no_conforme' ? 'No Conforme'
                                : 'Pendiente de revisión'}
                            </span>
                        </div>
                    </div>
                    {solicitud.resumen_controversia && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-400 block mb-1">Controversia</span>
                            <p className="text-sm font-semibold text-[#291136] line-clamp-2">{solicitud.resumen_controversia}</p>
                        </div>
                    )}
                    </div>{/* /p-5 */}
                </div>
            )}

            {/* ── Timeline agrupado por etapa ── */}
            {movimientosVisibles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Clock size={32} className="mx-auto mb-2 text-gray-200"/>
                    <p className="text-sm text-gray-400">Aún no se han registrado movimientos.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {grupos.map((grupo, gi) => (
                        <div key={`${grupo.etapaId}-${gi}`} className="flex animate-fade-in-up" style={{ animationDelay: `${gi * 60}ms` }}>
                            {/* Header vertical de etapa */}
                            <div className="relative shrink-0 flex items-stretch" style={{ width: '32px' }}>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-full w-px bg-[#BE0F4A]/20"/>
                                </div>
                                <div className="relative flex items-center justify-center w-full">
                                    <span
                                        className="text-[10px] font-bold text-[#BE0F4A] uppercase tracking-widest whitespace-nowrap bg-white px-1"
                                        style={{ transform: 'rotate(-90deg)' }}
                                    >
                                        {grupo.etapaNombre}
                                    </span>
                                </div>
                            </div>

                            {/* Movimientos de esta etapa */}
                            <div className="flex-1 space-y-2 py-2 min-w-0 border-l-2 border-[#BE0F4A]/20 pl-3">
                                {grupo.movimientos.map((mov, mi) => {
                                    const esPrimerMov = gi === 0 && mi === 0;
                                    const esUltimoMov = mi === grupo.movimientos.length - 1;
                                    return (
                                        <MovimientoCard
                                            key={mov.id}
                                            mov={mov}
                                            esGestor={esGestor}
                                            expedienteId={expedienteId}
                                            tiposResolucion={tiposResolucion}
                                            onIrANuevo={onIrANuevo}
                                            expandidos={expandidos}
                                            toggleExpandir={toggleExpandir}
                                            docsSolicitud={esPrimerMov ? (solicitud?.documentos ?? []) : []}
                                            esUltimo={esUltimoMov}
                                            actores={actores}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
