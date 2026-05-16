import { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    FileText, Download, ChevronDown, ChevronUp, ChevronRight,
    Clock, CheckCircle, AlertTriangle, Eye, CheckSquare,
    ArrowRight, Send, Bell, UserCheck, CalendarDays, Mail, Inbox, Timer, Zap
} from 'lucide-react';
import ModalCancelarAuto from './ModalCancelarAuto';

const estadoConfig = {
    recibido:   { Icon: Eye,           color: 'bg-purple-50 text-purple-600 border-purple-200',    label: 'Recibido' },
    pendiente:  { Icon: Clock,         color: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Pendiente' },
    respondido: { Icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Respondido' },
    vencido:    { Icon: AlertTriangle, color: 'bg-red-50 text-red-600 border-red-200',             label: 'Vencido' },
    cancelado:  { Icon: Zap,           color: 'bg-gray-100 text-gray-600 border-gray-300',         label: 'Cancelado' },
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
    propia:        { label: 'Act. Propia',       badge: 'bg-gray-50 text-gray-600 border-gray-200',         Icon: UserCheck, iconBg: 'bg-gray-100 text-gray-600' },
    envio_externo: { label: 'Envío externo',     badge: 'bg-[#4A153D]/5 text-[#4A153D] border-[#4A153D]/20', Icon: Inbox,     iconBg: 'bg-[#4A153D]/10 text-[#4A153D]' },
};

// Badges reutilizables del historial
function Badge({ className = '', children }) {
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${className}`}>
            {children}
        </span>
    );
}

function EstadoBadge({ estado }) {
    const cfg = estadoConfig[estado] ?? estadoConfig.pendiente;
    return <Badge className={cfg.color}>{cfg.label}</Badge>;
}

function TipoBadge({ tipo }) {
    const cfg = TIPO_LABELS[tipo] ?? TIPO_LABELS.requerimiento;
    return <Badge className={cfg.badge}>{cfg.label}</Badge>;
}

function ResolucionBadge({ resolucion }) {
    return (
        <Badge className={colorMap[resolucion.color] ?? colorMap.gray}>
            {resolucion.nombre}
        </Badge>
    );
}

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
                                    target="_blank" rel="noopener noreferrer"
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
function MovimientoCard({ mov, esGestor, expedienteId, tiposResolucion, onIrANuevo, expandidos, toggleExpandir, docsSolicitud, esUltimo, actores = [], tiposDocumento = [], onAbrirCancelarAuto }) {
    const expandido = expandidos.has(mov.id);
    const resolucion = mov.resolucion_tipo;
    const tieneRespuesta = !!mov.respuesta;
    const docsCreacion = mov.documentos?.filter(d => d.momento === 'creacion') ?? [];
    const docsRespuesta = mov.documentos?.filter(d => d.momento === 'respuesta') ?? [];
    const todosDocsMov = [...docsCreacion, ...(docsSolicitud ?? [])];
    const pivotRows = mov.responsables ?? [];
    const extensiones = mov.extensiones ?? [];
    const tieneExtras = todosDocsMov.length > 0 || docsRespuesta.length > 0 || mov.observaciones || resolucion || pivotRows.length > 0 || extensiones.length > 0;
    const tieneResponsable = !!mov.usuario_responsable_id || pivotRows.length > 0;
    const puedeResolver  = esGestor && mov.estado === 'respondido' && tieneResponsable && !mov.resolucion_tipo_id;
    const puedeContinuar = esGestor && mov.estado === 'pendiente'  && tieneResponsable && onIrANuevo;
    // Cancelación de auto: solo gestor, solo si el mov fue creado por la cascada y aún no fue cancelado.
    const puedeCancelarAuto = esGestor && mov.creado_por_auto && mov.estado !== 'cancelado';
    const docsCancelacion = mov.documentos?.filter(d => d.momento === 'cancelacion') ?? [];
    let responsablesDisplay = mov.usuario_responsable?.name ?? null;
    const tipoMov = TIPO_LABELS[mov.tipo] ?? TIPO_LABELS.requerimiento;

    // ── Helpers para multi-doc ──────────────────────────────────────────────────
    // ¿Este requerimiento usa el sistema nuevo (cada fila tiene tipo_documento_id)?
    const tieneTipoDocumento = pivotRows.some(r => r.tipo_documento_id);

    // Chips deduplicados por actor (estado combinado): para el top de la tarjeta no expandida.
    const actoresAgrupados = (() => {
        const groups = new Map();
        for (const r of pivotRows) {
            const key = r.actor?.id ?? r.expediente_actor_id ?? r.id;
            if (!groups.has(key)) {
                groups.set(key, {
                    nombre: r.actor?.usuario?.name ?? r.actor?.nombre_externo ?? 'Actor',
                    tipo:   r.tipo_actor?.nombre ?? r.actor?.tipo_actor?.nombre,
                    rows:   [],
                });
            }
            groups.get(key).rows.push(r);
        }
        return Array.from(groups.values()).map(g => ({
            ...g,
            estado: g.rows.every(r => r.estado === 'respondido') ? 'respondido'
                  : g.rows.some(r => r.estado === 'vencido')    ? 'vencido'
                  : 'pendiente',
        }));
    })();

    // Agrupado por tipo de documento: para vista expandida cuando es multi-doc.
    const trasladosAuto = mov.traslados_auto ?? [];
    const tiposAgrupados = (() => {
        if (!tieneTipoDocumento) return [];
        const groups = new Map();
        for (const r of pivotRows) {
            const key = r.tipo_documento_id ?? 0;
            if (!groups.has(key)) {
                groups.set(key, {
                    tipo_documento_id:     r.tipo_documento_id,
                    tipo_documento_nombre: r.tipo_documento?.nombre ?? 'Sin tipo asignado',
                    rows:                  [],
                });
            }
            groups.get(key).rows.push(r);
        }
        // Adjunto los archivos de respuesta + traslado_auto por tipo.
        return Array.from(groups.values()).map(g => ({
            ...g,
            archivos: docsRespuesta.filter(d => d.tipo_documento_id === g.tipo_documento_id),
            traslado_auto: trasladosAuto.find(t => t.tipo_documento_id === g.tipo_documento_id) ?? null,
        }));
    })();

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
                                    {actoresAgrupados.length > 0 ? (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-gray-400 text-xs">→</span>
                                            <div className="flex flex-wrap gap-1">
                                                {actoresAgrupados.map((g, idx) => {
                                                    const chipCls = g.estado === 'respondido'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : g.estado === 'vencido'
                                                        ? 'bg-red-50 text-red-600 border-red-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200';
                                                    // Si hay multi-doc: mostrar progreso "X/Y docs".
                                                    const respondidas = g.rows.filter(r => r.estado === 'respondido').length;
                                                    const totalDocs   = g.rows.length;
                                                    return (
                                                        <span key={idx} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${chipCls}`}>
                                                            {g.nombre}{g.tipo ? ` (${g.tipo})` : ''}
                                                            {tieneTipoDocumento && totalDocs > 1 && (
                                                                <span className="ml-1 opacity-80">{respondidas}/{totalDocs}</span>
                                                            )}
                                                            {g.estado === 'respondido' ? ' ✓' : g.estado === 'vencido' ? ' ✗' : ' ⏳'}
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
                                {mov.creado_por_auto && (
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 inline-flex items-center gap-1" title="Movimiento creado automáticamente por un traslado">
                                        <Zap size={11}/> Auto
                                    </span>
                                )}
                                <TipoBadge tipo={mov.tipo} />
                                {resolucion && <ResolucionBadge resolucion={resolucion} />}
                                <EstadoBadge estado={mov.estado} />
                                {(tieneExtras || puedeResolver || puedeContinuar || puedeCancelarAuto) && (
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
                            {/* Vista MULTI-DOC: agrupado por tipo de documento, cada tipo con sus actores + archivos entregados */}
                            {tieneTipoDocumento && tiposAgrupados.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 mb-1.5">Documentos pedidos en este requerimiento</p>
                                    <div className="space-y-3">
                                        {tiposAgrupados.map(grupo => {
                                            const totalDocs    = grupo.rows.length;
                                            const respondidas  = grupo.rows.filter(r => r.estado === 'respondido').length;
                                            // Una fila "omitida" ya tiene decisión tomada → cuenta como cerrada para el conteo del tipo.
                                            const cerradas     = grupo.rows.filter(r => r.estado === 'respondido' || r.estado === 'omitido').length;
                                            const completo     = cerradas === totalDocs;
                                            const todasOmitidas = completo && respondidas === 0;
                                            // Badge del header:
                                            //   - 1 sola fila: "Entregado" / "Omitido" / "Pendiente"
                                            //   - 2+ filas: "X/Y entregados" (los omitidos no suman al numerador, pero el badge verde se activa cuando cerradas===totalDocs)
                                            const badgeText = totalDocs === 1
                                                ? (grupo.rows[0]?.estado === 'respondido' ? 'Entregado'
                                                   : grupo.rows[0]?.estado === 'omitido' ? 'No presentado (opcional)'
                                                   : 'Pendiente')
                                                : (todasOmitidas ? 'No presentados (opcional)' : `${respondidas}/${totalDocs} entregados`);
                                            return (
                                                <div key={grupo.tipo_documento_id ?? 'sin'} className="border border-gray-200 rounded-xl overflow-hidden">
                                                    <div className={`px-3 py-2 flex items-center justify-between gap-2 border-b ${completo ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <FileText size={13} className={completo ? 'text-emerald-600' : 'text-[#BE0F4A]'}/>
                                                            <span className="text-sm font-bold text-[#291136] truncate">{grupo.tipo_documento_nombre}</span>
                                                            {grupo.traslado_auto && (() => {
                                                                const yaDisparado = (grupo.traslado_auto.disparos ?? []).length > 0;
                                                                return (
                                                                    <span title={grupo.traslado_auto.sumilla}
                                                                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${
                                                                            yaDisparado
                                                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                                : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                        <Zap size={9} className={yaDisparado ? 'text-emerald-600 fill-emerald-500' : 'text-amber-600 fill-amber-400'}/>
                                                                        {yaDisparado ? `Traslado ejecutado ×${grupo.traslado_auto.disparos.length}` : 'Traslado auto pendiente'}
                                                                    </span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${completo ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                                                            {badgeText}
                                                        </span>
                                                    </div>
                                                    <div className="px-3 py-2 space-y-1.5">
                                                        {grupo.rows.map(r => {
                                                            const nombre = r.actor?.usuario?.name ?? r.actor?.nombre_externo ?? 'Actor';
                                                            const tipo   = r.tipo_actor?.nombre ?? r.actor?.tipo_actor?.nombre;
                                                            const est    = r.estado ?? 'pendiente';
                                                            const chipCls = est === 'respondido'
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : est === 'vencido'
                                                                ? 'bg-red-50 text-red-600 border-red-200'
                                                                : est === 'omitido'
                                                                ? 'bg-gray-100 text-gray-600 border-gray-300'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200';
                                                            const estadoLabel = est === 'respondido' ? '✓'
                                                                : est === 'vencido' ? '✗'
                                                                : est === 'omitido' ? '∅'
                                                                : '⏳';
                                                            return (
                                                                <div key={r.id} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${chipCls}`}>
                                                                    <span className="font-semibold truncate flex items-center gap-1.5">
                                                                        {nombre}{tipo ? ` — ${tipo}` : ''}
                                                                        {r.es_opcional && (
                                                                            <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-white/60 border border-current/20 uppercase">Opcional</span>
                                                                        )}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {r.dias_plazo && (
                                                                            <span className="text-[10px] font-medium opacity-70">
                                                                                {r.dias_plazo} días {r.tipo_dias === 'habiles' ? 'háb.' : 'cal.'}
                                                                            </span>
                                                                        )}
                                                                        <span className="font-bold uppercase tracking-wide text-[10px]" title={est}>
                                                                            {estadoLabel}
                                                                        </span>
                                                                        {(est === 'respondido' || est === 'omitido') && r.respondido_por?.name && (
                                                                            <span className="opacity-70 truncate max-w-[100px]">{r.respondido_por.name}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {grupo.archivos.length > 0 && (
                                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                                                                    Archivos entregados ({grupo.archivos.length})
                                                                </p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {grupo.archivos.map(doc => (
                                                                        <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                                                            target="_blank" rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                                            <FileText size={10}/> {doc.nombre_original} <Download size={9}/>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Vista LEGACY: lista plana de responsables (cuando ninguna fila tiene tipo_documento_id) */}
                            {!tieneTipoDocumento && pivotRows.length > 0 && (
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
                                                target="_blank" rel="noopener noreferrer"
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
                            {/* Panel informativo si el movimiento ya fue cancelado por el gestor */}
                            {mov.estado === 'cancelado' && (
                                <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Zap size={13} className="text-gray-500"/>
                                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Movimiento cancelado por el gestor</p>
                                    </div>
                                    {mov.motivo_cancelacion && (
                                        <p className="text-xs text-gray-600 italic">"{mov.motivo_cancelacion}"</p>
                                    )}
                                    {mov.cancelado_at && (
                                        <p className="text-[11px] text-gray-500">
                                            {formatFecha(mov.cancelado_at)}{mov.cancelado_por?.name ? ` · por ${mov.cancelado_por.name}` : ''}
                                        </p>
                                    )}
                                    {docsCancelacion.length > 0 && (
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                                                Sustento ({docsCancelacion.length})
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {docsCancelacion.map(doc => (
                                                    <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
                                                        <FileText size={10}/> {doc.nombre_original} <Download size={9}/>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {(puedeResolver || puedeContinuar || puedeCancelarAuto) && (
                                <div className="pt-2 border-t border-gray-100 space-y-2">
                                    {puedeResolver && <ResolverPanel mov={mov} expedienteId={expedienteId} tiposResolucion={tiposResolucion}/>}
                                    {puedeContinuar && <ContinuarPanel mov={mov} expedienteId={expedienteId} onContinuar={onIrANuevo}/>}
                                    {puedeCancelarAuto && (
                                        <button type="button"
                                            onClick={() => onAbrirCancelarAuto?.(mov)}
                                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                            <Zap size={13}/> Cancelar movimiento automático
                                        </button>
                                    )}
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
export default function TabHistorial({ movimientos = [], solicitud, esGestor = false, expedienteId, etapaActualId = null, tiposResolucion = [], tiposDocumento = [], onIrANuevo = null, actores = [] }) {
    const [expandidos, setExpandidos] = useState(new Set());
    // Etapas expandidas a nivel de grupo (estilo "carpeta VS Code"). Por defecto solo la etapa actual.
    const [etapasExpandidas, setEtapasExpandidas] = useState(new Set());
    // Movimiento que el gestor está por cancelar (o null si modal cerrado).
    const [movCancelar, setMovCancelar] = useState(null);

    function toggleExpandir(id) {
        setExpandidos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleEtapa(etapaKey) {
        setEtapasExpandidas(prev => {
            const next = new Set(prev);
            next.has(etapaKey) ? next.delete(etapaKey) : next.add(etapaKey);
            return next;
        });
    }

    // Excluir envíos espontáneos pendientes de aceptación o rechazados.
    // Los envíos aceptados (estado 'recibido') sí aparecen en el historial con la fecha de envío del externo.
    const movimientosVisibles = movimientos.filter(m =>
        m.tipo !== 'envio_externo' || m.estado === 'recibido'
    );
    const grupos = agruparPorEtapa(movimientosVisibles);

    // Inicializar: expandir SOLO la etapa actual del expediente al primer render.
    // Si no hay etapaActualId definido, expandir el último grupo (más reciente cronológicamente).
    useEffect(() => {
        if (etapasExpandidas.size > 0 || grupos.length === 0) return;
        const inicial = new Set();
        if (etapaActualId != null) {
            // Buscar todos los grupos con esta etapa (puede haber varios si el expediente reentró a la etapa).
            grupos.forEach((g, i) => {
                if (String(g.etapaId) === String(etapaActualId)) inicial.add(`${g.etapaId}-${i}`);
            });
        }
        if (inicial.size === 0) {
            // Fallback: último grupo cronológicamente
            const ultimo = grupos[grupos.length - 1];
            if (ultimo) inicial.add(`${ultimo.etapaId}-${grupos.length - 1}`);
        }
        setEtapasExpandidas(inicial);
    }, [grupos.length, etapaActualId]); // eslint-disable-line react-hooks/exhaustive-deps

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

            {/* ── Timeline agrupado por etapa (carpetas colapsables) ── */}
            {movimientosVisibles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Clock size={32} className="mx-auto mb-2 text-gray-200"/>
                    <p className="text-sm text-gray-400">Aún no se han registrado movimientos.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {(() => {
                        // Control para expandir / colapsar todas con un click
                        const allKeys = grupos.map((g, i) => `${g.etapaId}-${i}`);
                        const todasExpandidas = allKeys.every(k => etapasExpandidas.has(k));
                        return (
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Línea de tiempo · {grupos.length} etapa{grupos.length !== 1 ? 's' : ''}
                                </p>
                                <button type="button"
                                    onClick={() => setEtapasExpandidas(todasExpandidas ? new Set() : new Set(allKeys))}
                                    className="text-[11px] font-semibold text-[#BE0F4A] hover:text-[#291136] transition-colors">
                                    {todasExpandidas ? 'Colapsar todas' : 'Expandir todas'}
                                </button>
                            </div>
                        );
                    })()}
                    {grupos.map((grupo, gi) => {
                        const etapaKey = `${grupo.etapaId}-${gi}`;
                        const abierta = etapasExpandidas.has(etapaKey);
                        const esEtapaActual = String(grupo.etapaId) === String(etapaActualId);
                        const fechaPrimera = grupo.movimientos[0]?.created_at;
                        const fechaUltima  = grupo.movimientos[grupo.movimientos.length - 1]?.created_at;
                        // Cuántos pendientes hay en esta etapa (informativo para colapsada)
                        const pendientes = grupo.movimientos.filter(m => m.estado === 'pendiente').length;
                        return (
                            <div key={etapaKey} className={`bg-white rounded-xl border overflow-hidden animate-fade-in-up ${
                                esEtapaActual ? 'border-[#BE0F4A]/40 shadow-sm' : 'border-gray-200'
                            }`} style={{ animationDelay: `${gi * 50}ms` }}>
                                {/* Header colapsable de etapa */}
                                <button type="button"
                                    onClick={() => toggleEtapa(etapaKey)}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                                        esEtapaActual ? 'bg-[#BE0F4A]/5 hover:bg-[#BE0F4A]/10' : 'hover:bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {abierta
                                            ? <ChevronDown size={14} className="text-[#BE0F4A] shrink-0"/>
                                            : <ChevronRight size={14} className="text-gray-400 shrink-0"/>}
                                        <span className={`text-xs font-black uppercase tracking-widest truncate ${esEtapaActual ? 'text-[#BE0F4A]' : 'text-[#291136]'}`}>
                                            {grupo.etapaNombre}
                                        </span>
                                        {esEtapaActual && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#BE0F4A] text-white shrink-0">
                                                Etapa actual
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 text-[11px]">
                                        <span className="text-gray-400 font-semibold">
                                            {grupo.movimientos.length} mov{grupo.movimientos.length !== 1 ? 's' : ''}
                                        </span>
                                        {pendientes > 0 && (
                                            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                                                {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {!abierta && fechaPrimera && (
                                            <span className="text-gray-300 hidden sm:inline">{formatFecha(fechaPrimera)}{fechaUltima && fechaUltima !== fechaPrimera ? ` – ${formatFecha(fechaUltima)}` : ''}</span>
                                        )}
                                    </div>
                                </button>

                                {/* Contenido: movimientos de la etapa, solo si está abierta */}
                                {abierta && (
                                    <div className="border-t border-gray-100 px-3 py-3 bg-gray-50/30">
                                        <div className="flex">
                                            <div className="border-l-2 border-[#BE0F4A]/20 pl-3 flex-1 min-w-0 space-y-2">
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
                                                            tiposDocumento={tiposDocumento}
                                                            onIrANuevo={onIrANuevo}
                                                            expandidos={expandidos}
                                                            toggleExpandir={toggleExpandir}
                                                            docsSolicitud={esPrimerMov ? (solicitud?.documentos ?? []) : []}
                                                            esUltimo={esUltimoMov}
                                                            actores={actores}
                                                            onAbrirCancelarAuto={setMovCancelar}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de cancelación de auto-movimiento (solo gestor) */}
            <ModalCancelarAuto
                open={!!movCancelar}
                expedienteId={expedienteId}
                movimiento={movCancelar}
                tiposDocumento={tiposDocumento}
                onClose={() => setMovCancelar(null)}
                onCancelado={() => {}}
            />
        </div>
    );
}
