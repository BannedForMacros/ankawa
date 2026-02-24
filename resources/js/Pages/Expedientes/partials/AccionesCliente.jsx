import { FolderOpen, Download, Clock } from 'lucide-react';

export default function AccionesCliente({ expediente }) {

    const plazoActivo = expediente.plazos?.find(p => p.estado === 'pendiente');

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[#291136] text-sm">Mi Expediente</h3>
            </div>
            <div className="p-4 space-y-3">

                {/* Estado actual */}
                <div className="bg-[#291136]/5 rounded-xl p-4">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estado actual</div>
                    <div className="font-bold text-[#291136]">
                        {expediente.etapa_actual?.nombre ?? 'Proceso iniciado'}
                    </div>
                    <div className="text-sm text-[#BE0F4A] font-medium mt-0.5">
                        {expediente.actividad_actual?.nombre ?? ''}
                    </div>
                </div>

                {/* Plazo activo si existe */}
                {plazoActivo && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
                        <Clock size={15} className="shrink-0" />
                        <span>
                            Plazo vence el <strong>{plazoActivo.fecha_vencimiento}</strong>
                        </span>
                    </div>
                )}

                {/* Descargar documentos */}
                {expediente.documentos?.length > 0 && (
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">Documentos</div>
                        <div className="space-y-1">
                            {expediente.documentos.map(doc => (
                                <a key={doc.id}
                                    href={`/storage/${doc.ruta_archivo}`}
                                    target="_blank"
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group text-sm text-gray-700 hover:text-[#BE0F4A]">
                                    <Download size={14} className="shrink-0" />
                                    <span className="truncate">{doc.nombre_original}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {!expediente.documentos?.length && (
                    <p className="text-xs text-gray-400 italic text-center py-2">
                        Sin documentos disponibles aún.
                    </p>
                )}
            </div>
        </div>
    );
}