import { FileText, Download, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const estadoIcons = {
    pendiente:  { Icon: Clock,         color: 'bg-blue-50 text-blue-500 border-blue-200' },
    respondido: { Icon: CheckCircle,   color: 'bg-emerald-50 text-emerald-500 border-emerald-200' },
    vencido:    { Icon: AlertTriangle, color: 'bg-red-50 text-red-500 border-red-200' },
    omitido:    { Icon: XCircle,       color: 'bg-gray-50 text-gray-400 border-gray-200' },
};

export default function TabHistorial({ movimientos = [], solicitud }) {
    return (
        <div className="space-y-4">

            {/* ── Datos de la solicitud ── */}
            {solicitud && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-[#291136] mb-3">Datos de la Solicitud</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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
                        <div className="col-span-2 sm:col-span-3">
                            <span className="text-gray-400 block">Controversia</span>
                            <p className="font-semibold line-clamp-2">{solicitud.resumen_controversia}</p>
                        </div>
                    </div>

                    {/* Documentos de la solicitud */}
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
                            const { Icon, color } = estadoIcons[mov.estado] ?? estadoIcons.pendiente;
                            return (
                                <div key={mov.id} className="relative pl-12">
                                    <div className={`absolute left-3 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${color}`}>
                                        <Icon size={10}/>
                                    </div>
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-[#291136]">{mov.instruccion}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1 flex-wrap">
                                                    {mov.etapa && <span>{mov.etapa.nombre}</span>}
                                                    {mov.sub_etapa && (
                                                        <>
                                                            <ChevronRight size={9}/>
                                                            <span>{mov.sub_etapa.nombre}</span>
                                                        </>
                                                    )}
                                                    <span className="text-gray-200">•</span>
                                                    <span>por {mov.creado_por?.name}</span>
                                                    <span className="text-gray-200">•</span>
                                                    <span>{new Date(mov.created_at).toLocaleDateString('es-PE')}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
                                                {mov.estado}
                                            </span>
                                        </div>

                                        {mov.observaciones && (
                                            <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2">{mov.observaciones}</p>
                                        )}

                                        {mov.usuario_responsable && (
                                            <div className="text-xs text-gray-400 mt-2">
                                                Responsable: <span className="font-semibold text-[#291136]">{mov.usuario_responsable.name}</span>
                                                {mov.tipo_actor_responsable && (
                                                    <span className="ml-1 text-gray-300">({mov.tipo_actor_responsable.nombre})</span>
                                                )}
                                            </div>
                                        )}

                                        {mov.fecha_limite && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Plazo: <span className="font-semibold">{new Date(mov.fecha_limite).toLocaleDateString('es-PE')}</span>
                                                {mov.dias_plazo && <span className="ml-1">({mov.dias_plazo} días)</span>}
                                            </div>
                                        )}

                                        {/* Respuesta */}
                                        {mov.respuesta && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-[11px] font-bold text-emerald-600">Respuesta</span>
                                                {mov.respondido_por && (
                                                    <span className="text-[11px] text-gray-400 ml-2">
                                                        por {mov.respondido_por.name} — {new Date(mov.fecha_respuesta).toLocaleDateString('es-PE')}
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-600 mt-1 bg-emerald-50 rounded-lg p-2">{mov.respuesta}</p>
                                            </div>
                                        )}

                                        {/* Documentos del movimiento */}
                                        {mov.documentos?.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <span className="text-[11px] text-gray-400 block mb-1">Documentos</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {mov.documentos.map(doc => (
                                                        <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
                                                            <FileText size={10}/> {doc.nombre_original}
                                                        </span>
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
        </div>
    );
}
