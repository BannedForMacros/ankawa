import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    FileText, Download, ChevronRight, ChevronDown, ChevronUp,
    Clock, CheckCircle, AlertTriangle, Eye, CheckSquare,
    ArrowRight, CornerDownRight, Send, Bell, UserCheck
} from 'lucide-react';

const estadoConfig = {
    recibido:   { Icon: Eye,           color: 'bg-purple-50 text-purple-600 border-purple-200',   label: 'Recibido' },
    pendiente:  { Icon: Clock,         color: 'bg-blue-50 text-blue-600 border-blue-200',         label: 'Pendiente' },
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
    requerimiento: { label: 'Requerimiento', badge: 'bg-blue-50 text-blue-600 border-blue-200',     Icon: Send,      iconBg: 'bg-blue-100 text-blue-600' },
    notificacion:  { label: 'Notificación',  badge: 'bg-purple-50 text-purple-600 border-purple-200', Icon: Bell,      iconBg: 'bg-purple-100 text-purple-600' },
    propia:        { label: 'Act. Propia',   badge: 'bg-amber-50 text-amber-600 border-amber-200',   Icon: UserCheck, iconBg: 'bg-amber-100 text-amber-600' },
};

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
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors">
                <CheckSquare size={12}/> Resolver
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="mt-2 p-3 bg-[#291136]/5 rounded-xl border border-[#291136]/10 space-y-3">
            <div className="flex flex-wrap gap-2">
                {tiposResolucion.map(tr => (
                    <button key={tr.id} type="button"
                        onClick={() => form.setData('resolucion_tipo_id', String(tr.id))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nota de resolución *</label>
                    <textarea value={form.data.resolucion_nota} onChange={e => form.setData('resolucion_nota', e.target.value)}
                        rows={2} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2"/>
                </div>
            )}
            <div className="flex gap-2">
                <button type="submit" disabled={!form.data.resolucion_tipo_id || form.processing}
                    className="px-4 py-1.5 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-40">
                    Confirmar
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">
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
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                <ArrowRight size={12}/> Continuar proceso
            </button>
        );
    }

    return (
        <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
            <p className="text-xs text-amber-800 font-semibold">
                Este movimiento quedará <strong>pendiente</strong>. Puedes ampliar el plazo al actor si lo deseas.
            </p>
            <div className="flex items-center gap-3">
                <div>
                    <label className="block text-[11px] font-semibold text-amber-700 mb-1">Nuevo plazo (días)</label>
                    <input type="number" min="1" max="365" value={dias} onChange={e => setDias(e.target.value)}
                        placeholder="Ej: 5" className="w-24 text-xs border border-amber-300 rounded-lg px-2 py-1.5 bg-white"/>
                </div>
                <p className="text-[11px] text-amber-600 mt-4">
                    {dias ? `+${dias} días desde hoy` : 'Sin cambio de plazo'}
                </p>
            </div>
            <div className="flex gap-2">
                <button onClick={confirmar} disabled={procesando}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                    <ArrowRight size={12}/> Confirmar y crear siguiente
                </button>
                <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
            </div>
        </div>
    );
}

// ── Tarjeta de respuesta (sub-nodo visible) ──────────────────────────────────
function RespuestaCard({ mov }) {
    const [verDocs, setVerDocs] = useState(false);
    const docsRespuesta = mov.documentos?.filter(d => d.momento === 'respuesta') ?? [];

    return (
        <div className="ml-4 mt-1.5 relative">
            <div className="absolute -left-3 top-3 w-3 h-px bg-emerald-300"/>
            <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-3.5">
                <div className="flex items-start gap-2">
                    <CornerDownRight size={13} className="text-emerald-500 mt-0.5 shrink-0"/>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[11px] font-bold text-emerald-700">Respuesta</span>
                            <span className="text-[11px] text-gray-400">
                                {mov.respondido_por?.name}
                                {mov.fecha_respuesta && ` · ${new Date(mov.fecha_respuesta).toLocaleDateString('es-PE')}`}
                            </span>
                            {docsRespuesta.length > 0 && (
                                <button onClick={() => setVerDocs(v => !v)}
                                    className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-800">
                                    <FileText size={10}/> {docsRespuesta.length} doc(s) {verDocs ? '▲' : '▼'}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{mov.respuesta}</p>
                        {verDocs && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {docsRespuesta.map(doc => (
                                    <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                        className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-colors">
                                        <FileText size={10}/> {doc.nombre_original} <Download size={9}/>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Tarjeta de movimiento ────────────────────────────────────────────────────
function MovimientoCard({ mov, esGestor, expedienteId, tiposResolucion, onIrANuevo, expandidos, toggleExpandir, docsSolicitud, esUltimo }) {
    const cfg = estadoConfig[mov.estado] ?? estadoConfig.pendiente;
    const expandido = expandidos.has(mov.id);
    const resolucion = mov.resolucion_tipo;
    const tieneRespuesta = !!mov.respuesta;
    const docsCreacion = mov.documentos?.filter(d => d.momento === 'creacion') ?? [];
    const todosDocsMov = [...docsCreacion, ...(docsSolicitud ?? [])];
    const tieneExtras = todosDocsMov.length > 0 || mov.observaciones || resolucion;
    const puedeResolver = esGestor && mov.estado === 'respondido' && mov.usuario_responsable_id && !mov.resolucion_tipo_id;
    const puedeContinuar = esGestor && mov.estado === 'pendiente' && mov.usuario_responsable_id && onIrANuevo;
    const tipoMov = TIPO_LABELS[mov.tipo] ?? TIPO_LABELS.requerimiento;

    return (
        <div className="relative flex gap-3">
            {/* Línea de timeline */}
            <div className="flex flex-col items-center shrink-0" style={{ width: '28px' }}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center z-10 ${tipoMov.iconBg}`}>
                    <tipoMov.Icon size={14}/>
                </div>
                {!esUltimo && (
                    <div className="flex-1 w-px bg-gray-200 mt-1"/>
                )}
            </div>

            {/* Tarjeta del movimiento */}
            <div className="flex-1 min-w-0 pb-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#291136] mb-1.5">{mov.instruccion}</p>
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
                                {mov.sub_etapa && (
                                    <span className="bg-[#291136]/5 text-[#291136] px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                        {mov.sub_etapa.nombre}
                                    </span>
                                )}
                                <span>{new Date(mov.created_at).toLocaleDateString('es-PE')}</span>
                                <span className="text-gray-300">·</span>
                                <span>{mov.creado_por?.name}</span>
                                {mov.usuario_responsable && (
                                    <>
                                        <span className="text-gray-300">·</span>
                                        <span>→ <strong className="text-[#291136]">{mov.usuario_responsable.name}</strong></span>
                                    </>
                                )}
                                {mov.fecha_limite && (
                                    <>
                                        <span className="text-gray-300">·</span>
                                        <span className={mov.estado === 'vencido' ? 'text-red-500 font-bold' : 'text-amber-500'}>
                                            límite: {new Date(mov.fecha_limite).toLocaleDateString('es-PE')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipoMov.badge}`}>
                                {tipoMov.label}
                            </span>
                            {resolucion && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorMap[resolucion.color] ?? colorMap.gray}`}>
                                    {resolucion.nombre}
                                </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                {cfg.label}
                            </span>
                            {(tieneExtras || puedeResolver || puedeContinuar) && (
                                <button onClick={() => toggleExpandir(mov.id)}
                                    className="text-gray-300 hover:text-gray-500 transition-colors">
                                    {expandido ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                            )}
                        </div>
                    </div>

                    {mov.tipo_documento_requerido && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#BE0F4A] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                            <FileText size={11}/> Requiere: {mov.tipo_documento_requerido.nombre}
                        </div>
                    )}
                </div>

                {expandido && (
                    <div className="px-3.5 pb-3.5 border-t border-gray-50 space-y-3 pt-3">
                        {mov.observaciones && (
                            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{mov.observaciones}</p>
                        )}
                        {todosDocsMov.length > 0 && (
                            <div>
                                <p className="text-[11px] font-semibold text-gray-400 mb-1.5">Documentos adjuntos</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {todosDocsMov.map(doc => (
                                        <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <FileText size={10}/> {doc.nombre_original} <Download size={9}/>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {resolucion && (
                            <div className={`rounded-lg p-3 border ${colorMap[resolucion.color] ?? colorMap.gray}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckSquare size={12}/>
                                    <span className="text-[11px] font-bold">{resolucion.nombre}</span>
                                    <span className="text-[11px] opacity-70">
                                        {mov.resuelto_por?.name} · {mov.fecha_resolucion && new Date(mov.fecha_resolucion).toLocaleDateString('es-PE')}
                                    </span>
                                </div>
                                {mov.resolucion_nota && <p className="text-xs">{mov.resolucion_nota}</p>}
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

            {tieneRespuesta && <RespuestaCard mov={mov}/>}
            </div>
        </div>
    );
}

// ── Agrupar movimientos por etapa (orden cronológico) ────────────────────────
function agruparPorEtapa(movimientos) {
    // Los movimientos vienen DESC, invertimos para cronológico
    const cronologico = [...movimientos].reverse();
    const grupos = [];
    let grupoActual = null;

    for (const mov of cronologico) {
        const etapaId = mov.etapa_id;
        const etapaNombre = mov.etapa?.nombre ?? 'Sin etapa';

        if (!grupoActual || grupoActual.etapaId !== etapaId) {
            // Guardar la última sub-etapa del grupo anterior para la transición
            const subEtapaAnterior = grupoActual
                ? grupoActual.movimientos[grupoActual.movimientos.length - 1]?.sub_etapa?.nombre
                : null;

            grupoActual = {
                etapaId,
                etapaNombre,
                movimientos: [],
                subEtapaAnterior,  // última sub-etapa del grupo anterior
                primeraSubEtapa: mov.sub_etapa?.nombre ?? null,
                esTransicion: grupos.length > 0,  // no es el primer grupo
            };
            grupos.push(grupoActual);
        }

        grupoActual.movimientos.push(mov);
    }

    return grupos;
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabHistorial({ movimientos = [], solicitud, esGestor = false, expedienteId, tiposResolucion = [], onIrANuevo = null }) {
    const [expandidos, setExpandidos] = useState(new Set());

    function toggleExpandir(id) {
        setExpandidos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    const grupos = agruparPorEtapa(movimientos);

    return (
        <div className="space-y-4">

            {/* ── Resumen del expediente ── */}
            {solicitud && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#291136] mb-3">Resumen del Expediente</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                            <span className="text-gray-400 block">Demandante</span>
                            <span className="font-semibold text-[#291136]">{solicitud.nombre_demandante}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Demandado</span>
                            <span className="font-semibold text-[#291136]">{solicitud.nombre_demandado}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">N. Cargo</span>
                            <span className="font-mono font-semibold text-[#291136]">{solicitud.numero_cargo}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Solicitud</span>
                            <span className={`font-bold ${
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
                        <div className="col-span-2 sm:col-span-4 mt-1">
                            <span className="text-gray-400 block text-xs">Controversia</span>
                            <p className="text-xs font-semibold text-[#291136] line-clamp-2">{solicitud.resumen_controversia}</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Timeline agrupado por etapa ── */}
            {movimientos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Clock size={32} className="mx-auto mb-2 text-gray-200"/>
                    <p className="text-sm text-gray-400">Aún no se han registrado movimientos.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {grupos.map((grupo, gi) => (
                        <div key={`${grupo.etapaId}-${gi}`} className="flex">
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
                                    // El primer mov del primer grupo es el envío de solicitud → le pasamos los docs
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
