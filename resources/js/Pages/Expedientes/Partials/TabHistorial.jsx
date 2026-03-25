import { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    FileText, Download, ChevronRight, ChevronDown, ChevronUp,
    Clock, CheckCircle, XCircle, AlertTriangle, SkipForward,
    Eye, CheckSquare
} from 'lucide-react';

const estadoConfig = {
    pendiente:  { Icon: Clock,          color: 'bg-blue-50 text-blue-600 border-blue-200',      label: 'Pendiente' },
    respondido: { Icon: CheckCircle,    color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Respondido' },
    vencido:    { Icon: AlertTriangle,  color: 'bg-red-50 text-red-600 border-red-200',          label: 'Vencido' },
    omitido:    { Icon: XCircle,        color: 'bg-gray-50 text-gray-400 border-gray-200',       label: 'Omitido' },
};

const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber:   'bg-amber-50 text-amber-700 border-amber-200',
    red:     'bg-red-50 text-red-700 border-red-200',
    blue:    'bg-blue-50 text-blue-700 border-blue-200',
    gray:    'bg-gray-50 text-gray-600 border-gray-200',
};

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
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors"
            >
                <CheckSquare size={12}/> Resolver
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="mt-2 p-3 bg-[#291136]/5 rounded-xl border border-[#291136]/10 space-y-3">
            <div className="flex flex-wrap gap-2">
                {tiposResolucion.map(tr => (
                    <button
                        key={tr.id}
                        type="button"
                        onClick={() => form.setData('resolucion_tipo_id', String(tr.id))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                            String(form.data.resolucion_tipo_id) === String(tr.id)
                                ? (colorMap[tr.color] ?? colorMap.gray) + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {tr.nombre}
                    </button>
                ))}
            </div>

            {tipoSel?.requiere_nota && (
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nota de resolución *</label>
                    <textarea
                        value={form.data.resolucion_nota}
                        onChange={e => form.setData('resolucion_nota', e.target.value)}
                        rows={2}
                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Describa las observaciones o motivo..."
                    />
                </div>
            )}

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!form.data.resolucion_tipo_id || form.processing}
                    className="px-4 py-1.5 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-40"
                >
                    Confirmar
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">
                    Cancelar
                </button>
            </div>
        </form>
    );
}

function OmitirPanel({ mov, expedienteId }) {
    const [open, setOpen] = useState(false);
    const [motivo, setMotivo] = useState('');

    function submit() {
        if (!motivo.trim()) return;
        router.post(route('expedientes.movimientos.omitir', [expedienteId, mov.id]), { motivo }, {
            onSuccess: () => { setOpen(false); setMotivo(''); },
        });
    }

    if (!open) {
        return (
            <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <SkipForward size={11}/> Omitir
            </button>
        );
    }

    return (
        <div className="flex items-end gap-2 mt-2">
            <div className="flex-1">
                <input
                    type="text"
                    value={motivo}
                    onChange={e => setMotivo(e.target.value)}
                    placeholder="Motivo de omisión..."
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5"
                />
            </div>
            <button onClick={submit} className="px-3 py-1.5 text-xs font-bold bg-gray-600 text-white rounded-lg">Confirmar</button>
            <button onClick={() => setOpen(false)} className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600">✕</button>
        </div>
    );
}

export default function TabHistorial({ movimientos = [], solicitud, esGestor = false, expedienteId, tiposResolucion = [] }) {
    const [expandidos, setExpandidos] = useState(new Set());

    function toggleExpandir(id) {
        setExpandidos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    return (
        <div className="space-y-4">

            {/* Resumen solicitud */}
            {solicitud && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#291136] mb-3">Datos de la Solicitud</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-gray-400 block">Demandante</span><span className="font-semibold">{solicitud.nombre_demandante}</span></div>
                        <div><span className="text-gray-400 block">Demandado</span><span className="font-semibold">{solicitud.nombre_demandado}</span></div>
                        <div><span className="text-gray-400 block">N. Cargo</span><span className="font-mono font-semibold">{solicitud.numero_cargo}</span></div>
                        <div>
                            <span className="text-gray-400 block">Estado</span>
                            <span className={`font-bold ${solicitud.resultado_revision === 'conforme' ? 'text-emerald-600' : solicitud.resultado_revision === 'no_conforme' ? 'text-red-600' : 'text-amber-600'}`}>
                                {solicitud.resultado_revision === 'conforme' ? 'Conforme ✓' : solicitud.resultado_revision === 'no_conforme' ? 'No Conforme' : 'Pendiente revisión'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-4">
                            <span className="text-gray-400 block">Controversia</span>
                            <p className="font-semibold line-clamp-2">{solicitud.resumen_controversia}</p>
                        </div>
                    </div>
                    {solicitud.documentos?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                            {solicitud.documentos.map(doc => (
                                <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors">
                                    <FileText size={11}/>{doc.nombre_original}<Download size={10} className="text-gray-400"/>
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Timeline */}
            {movimientos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Clock size={32} className="mx-auto mb-2 text-gray-200"/>
                    <p className="text-sm text-gray-400">Aún no se han registrado movimientos.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200"/>
                    <div className="space-y-3">
                        {movimientos.map(mov => {
                            const cfg = estadoConfig[mov.estado] ?? estadoConfig.pendiente;
                            const expandido = expandidos.has(mov.id);
                            const resolucion = mov.resolucion_tipo;
                            const puedeResolver = esGestor && mov.estado === 'respondido' && mov.usuario_responsable_id && !mov.resolucion_tipo_id;
                            const puedeOmitir = esGestor && mov.estado === 'pendiente';

                            return (
                                <div key={mov.id} className="relative pl-12">
                                    <div className={`absolute left-3 top-3.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${cfg.color}`}>
                                        <cfg.Icon size={10}/>
                                    </div>

                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                        {/* Cabecera compacta */}
                                        <button onClick={() => toggleExpandir(mov.id)} className="w-full text-left p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <p className="text-sm font-bold text-[#291136] truncate">{mov.instruccion}</p>
                                                    </div>
                                                    {/* Etapa y sub-etapa visibles en compacto */}
                                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 flex-wrap">
                                                        {mov.etapa && (
                                                            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                                                {mov.etapa.nombre}
                                                            </span>
                                                        )}
                                                        {mov.sub_etapa && (
                                                            <>
                                                                <ChevronRight size={9}/>
                                                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                                    {mov.sub_etapa.nombre}
                                                                </span>
                                                            </>
                                                        )}
                                                        <span className="text-gray-300">·</span>
                                                        <span>{new Date(mov.created_at).toLocaleDateString('es-PE')}</span>
                                                        <span className="text-gray-300">·</span>
                                                        <span>{mov.creado_por?.name}</span>
                                                        {mov.usuario_responsable && (
                                                            <>
                                                                <span className="text-gray-300">·</span>
                                                                <span>→ <strong className="text-[#291136]">{mov.usuario_responsable.name}</strong></span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Badge resolución */}
                                                    {resolucion && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${colorMap[resolucion.color] ?? colorMap.gray}`}>
                                                            {resolucion.nombre}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className="text-gray-300 text-xs">{expandido ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
                                                </div>
                                            </div>
                                        </button>

                                        {/* Detalle expandido */}
                                        {expandido && (
                                            <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                                                {/* Grid de metadatos */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                                    {mov.fecha_limite && (
                                                        <div>
                                                            <span className="text-gray-400 block">Fecha límite</span>
                                                            <span className={`font-bold ${mov.estado === 'vencido' ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {new Date(mov.fecha_limite).toLocaleDateString('es-PE')}
                                                                {mov.dias_plazo && <span className="font-normal text-gray-400 ml-1">({mov.dias_plazo}d)</span>}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {mov.tipo_documento_requerido && (
                                                        <div className="col-span-2">
                                                            <span className="text-gray-400 block">Documento requerido</span>
                                                            <span className="font-bold text-[#BE0F4A]">{mov.tipo_documento_requerido.nombre}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {mov.observaciones && (
                                                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{mov.observaciones}</p>
                                                )}

                                                {/* Docs de creación */}
                                                {mov.documentos?.filter(d => d.momento === 'creacion').length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {mov.documentos.filter(d => d.momento === 'creacion').map(doc => (
                                                            <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
                                                                <FileText size={10}/> {doc.nombre_original}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Respuesta */}
                                                {mov.respuesta && (
                                                    <div className="bg-emerald-50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[11px] font-bold text-emerald-700">Respuesta</span>
                                                            <span className="text-[11px] text-gray-400">
                                                                {mov.respondido_por?.name} — {new Date(mov.fecha_respuesta).toLocaleDateString('es-PE')}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-700">{mov.respuesta}</p>
                                                        {mov.documentos?.filter(d => d.momento === 'respuesta').map(doc => (
                                                            <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 mt-2 rounded bg-emerald-100 text-emerald-700 border border-emerald-200 mr-1">
                                                                <FileText size={10}/> {doc.nombre_original}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Resolución existente */}
                                                {resolucion && (
                                                    <div className={`rounded-lg p-3 border ${colorMap[resolucion.color] ?? colorMap.gray}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <CheckSquare size={12}/>
                                                            <span className="text-[11px] font-bold">{resolucion.nombre}</span>
                                                            <span className="text-[11px] opacity-70">
                                                                {mov.resuelto_por?.name} — {new Date(mov.fecha_resolucion).toLocaleDateString('es-PE')}
                                                            </span>
                                                        </div>
                                                        {mov.resolucion_nota && <p className="text-xs">{mov.resolucion_nota}</p>}
                                                    </div>
                                                )}

                                                {/* Acciones del gestor */}
                                                {(puedeResolver || puedeOmitir) && (
                                                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
                                                        {puedeResolver && (
                                                            <ResolverPanel mov={mov} expedienteId={expedienteId} tiposResolucion={tiposResolucion}/>
                                                        )}
                                                        {puedeOmitir && <OmitirPanel mov={mov} expedienteId={expedienteId}/>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
