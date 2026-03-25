import { useState } from 'react';
import { router } from '@inertiajs/react';
import { FileText, Download, ChevronRight, ChevronDown, Clock, CheckCircle, XCircle, AlertTriangle, SkipForward } from 'lucide-react';

const estadoIcons = {
    pendiente:  { Icon: Clock,         color: 'bg-blue-50 text-blue-500 border-blue-200',    label: 'Pendiente' },
    respondido: { Icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-500 border-emerald-200', label: 'Respondido' },
    vencido:    { Icon: AlertTriangle, color: 'bg-red-50 text-red-500 border-red-200',       label: 'Vencido' },
    omitido:    { Icon: XCircle,       color: 'bg-gray-50 text-gray-400 border-gray-200',    label: 'Omitido' },
};

export default function TabHistorial({ movimientos = [], solicitud, esGestor = false, expedienteId }) {
    const [expandidos, setExpandidos] = useState(new Set());
    const [omitirId, setOmitirId] = useState(null);
    const [motivoOmitir, setMotivoOmitir] = useState('');

    function toggleExpandir(id) {
        setExpandidos(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function handleOmitir(movId) {
        if (!motivoOmitir.trim()) return;
        router.post(route('expedientes.movimientos.omitir', [expedienteId, movId]), {
            motivo: motivoOmitir,
        }, {
            onSuccess: () => { setOmitirId(null); setMotivoOmitir(''); },
        });
    }

    return (
        <div className="space-y-4">

            {/* ── Resumen de la solicitud (compacto) ── */}
            {solicitud && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#291136] mb-3">Datos de la Solicitud</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                            <span className="text-gray-400 block">Demandante</span>
                            <span className="font-semibold">{solicitud.nombre_demandante}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Demandado</span>
                            <span className="font-semibold">{solicitud.nombre_demandado}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">N. Cargo</span>
                            <span className="font-mono font-semibold">{solicitud.numero_cargo}</span>
                        </div>
                        <div>
                            <span className="text-gray-400 block">Estado</span>
                            <span className={`font-bold ${
                                solicitud.resultado_revision === 'conforme' ? 'text-emerald-600' :
                                solicitud.resultado_revision === 'no_conforme' ? 'text-red-600' :
                                'text-amber-600'
                            }`}>
                                {solicitud.resultado_revision === 'conforme' ? 'Conforme' :
                                 solicitud.resultado_revision === 'no_conforme' ? 'No Conforme' :
                                 'Pendiente de revisión'}
                            </span>
                        </div>
                        <div className="col-span-2 sm:col-span-4">
                            <span className="text-gray-400 block">Controversia</span>
                            <p className="font-semibold line-clamp-2">{solicitud.resumen_controversia}</p>
                        </div>
                    </div>

                    {solicitud.documentos?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400 block mb-2">Documentos adjuntos</span>
                            <div className="flex flex-wrap gap-2">
                                {solicitud.documentos.map(doc => (
                                    <a
                                        key={doc.id}
                                        href={route('documentos.descargar', doc.id)}
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200"
                                    >
                                        <FileText size={12}/>
                                        {doc.nombre_original}
                                        <Download size={10} className="text-gray-400"/>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Timeline de movimientos ── */}
            {movimientos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Clock size={32} className="mx-auto mb-2 text-gray-200"/>
                    <p className="text-sm text-gray-400">Aún no se han registrado movimientos.</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200"/>
                    <div className="space-y-4">
                        {movimientos.map(mov => {
                            const { Icon, color, label } = estadoIcons[mov.estado] ?? estadoIcons.pendiente;
                            const expandido = expandidos.has(mov.id);
                            return (
                                <div key={mov.id} className="relative pl-12">
                                    <div className={`absolute left-3 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${color}`}>
                                        <Icon size={10}/>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                                        {/* Cabecera compacta - click para expandir */}
                                        <button
                                            onClick={() => toggleExpandir(mov.id)}
                                            className="w-full text-left p-4 flex items-start justify-between gap-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-[#291136] truncate">{mov.instruccion}</p>
                                                    {expandido ? <ChevronDown size={14} className="text-gray-300 shrink-0"/> : <ChevronRight size={14} className="text-gray-300 shrink-0"/>}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap">
                                                    <span>por {mov.creado_por?.name}</span>
                                                    <span className="text-gray-200">|</span>
                                                    <span>{new Date(mov.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    {mov.usuario_responsable && (
                                                        <>
                                                            <span className="text-gray-200">|</span>
                                                            <span>Responsable: <strong className="text-[#291136]">{mov.usuario_responsable.name}</strong></span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${color}`}>
                                                {label}
                                            </span>
                                        </button>

                                        {/* Detalle expandido */}
                                        {expandido && (
                                            <div className="px-4 pb-4 space-y-3 border-t border-gray-50">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3">
                                                    {mov.etapa && (
                                                        <div>
                                                            <span className="text-gray-400 block">Etapa</span>
                                                            <span className="font-semibold">{mov.etapa.nombre}</span>
                                                        </div>
                                                    )}
                                                    {mov.sub_etapa && (
                                                        <div>
                                                            <span className="text-gray-400 block">Sub-etapa</span>
                                                            <span className="font-semibold">{mov.sub_etapa.nombre}</span>
                                                        </div>
                                                    )}
                                                    {mov.tipo_actor_responsable && (
                                                        <div>
                                                            <span className="text-gray-400 block">Tipo Actor</span>
                                                            <span className="font-semibold">{mov.tipo_actor_responsable.nombre}</span>
                                                        </div>
                                                    )}
                                                    {mov.fecha_limite && (
                                                        <div>
                                                            <span className="text-gray-400 block">Fecha Límite</span>
                                                            <span className={`font-bold ${mov.estado === 'vencido' ? 'text-red-600' : 'text-gray-700'}`}>
                                                                {new Date(mov.fecha_limite).toLocaleDateString('es-PE')}
                                                                {mov.dias_plazo && <span className="font-normal text-gray-400 ml-1">({mov.dias_plazo} días)</span>}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {mov.tipo_documento_requerido && (
                                                        <div className="col-span-2">
                                                            <span className="text-gray-400 block">Documento Requerido</span>
                                                            <span className="font-semibold text-[#BE0F4A]">{mov.tipo_documento_requerido.nombre}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {mov.observaciones && (
                                                    <div>
                                                        <span className="text-[11px] text-gray-400 block mb-1">Observaciones</span>
                                                        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{mov.observaciones}</p>
                                                    </div>
                                                )}

                                                {/* Documentos de creación */}
                                                {mov.documentos?.filter(d => d.momento === 'creacion').length > 0 && (
                                                    <div>
                                                        <span className="text-[11px] text-gray-400 block mb-1">Documentos adjuntos</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {mov.documentos.filter(d => d.momento === 'creacion').map(doc => (
                                                                <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
                                                                    <FileText size={10}/> {doc.nombre_original}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Respuesta */}
                                                {mov.respuesta && (
                                                    <div className="bg-emerald-50 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[11px] font-bold text-emerald-600">Respuesta</span>
                                                            {mov.respondido_por && (
                                                                <span className="text-[11px] text-gray-400">
                                                                    por {mov.respondido_por.name} — {new Date(mov.fecha_respuesta).toLocaleDateString('es-PE')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-700">{mov.respuesta}</p>
                                                    </div>
                                                )}

                                                {/* Documentos de respuesta */}
                                                {mov.documentos?.filter(d => d.momento === 'respuesta').length > 0 && (
                                                    <div>
                                                        <span className="text-[11px] text-gray-400 block mb-1">Documentos de respuesta</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {mov.documentos.filter(d => d.momento === 'respuesta').map(doc => (
                                                                <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <FileText size={10}/> {doc.nombre_original}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Botón omitir para gestor */}
                                                {esGestor && mov.estado === 'pendiente' && (
                                                    <div className="pt-2 border-t border-gray-100">
                                                        {omitirId === mov.id ? (
                                                            <div className="flex items-end gap-2">
                                                                <div className="flex-1">
                                                                    <label className="block text-xs font-semibold text-gray-500 mb-1">Motivo de omisión *</label>
                                                                    <input
                                                                        type="text"
                                                                        value={motivoOmitir}
                                                                        onChange={e => setMotivoOmitir(e.target.value)}
                                                                        placeholder="Indique el motivo..."
                                                                        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5"
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => handleOmitir(mov.id)}
                                                                    className="px-3 py-1.5 text-xs font-bold bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                                                >
                                                                    Confirmar
                                                                </button>
                                                                <button
                                                                    onClick={() => { setOmitirId(null); setMotivoOmitir(''); }}
                                                                    className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600"
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setOmitirId(mov.id)}
                                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                <SkipForward size={12}/> Omitir este movimiento
                                                            </button>
                                                        )}
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
