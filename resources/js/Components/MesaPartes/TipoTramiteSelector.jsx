import { motion } from 'framer-motion';
import { FileText, Reply, Scale } from 'lucide-react';

export default function TipoTramiteSelector({ onSelect }) {
    const tramites = [
        {
            id: 'solicitud',
            titulo: 'Nueva Solicitud de Arbitraje',
            descripcion: 'Iniciar un nuevo proceso arbitral',
            icon: FileText,
            color: 'from-[#BE0F4A] to-[#BC1D35]',
        },
        {
            id: 'apersonamiento',
            titulo: 'Respuesta - Apersonamiento',
            descripcion: 'Responder a una solicitud de arbitraje existente',
            icon: Reply,
            color: 'from-[#4A153D] to-[#B23241]',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] rounded-full mb-4">
                    <Scale className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Servicio de Arbitraje
                </h2>
                <p className="text-lg text-gray-600">
                    Seleccione el tipo de trámite que desea realizar
                </p>
            </div>

            {/* Opciones */}
            <div className="grid md:grid-cols-2 gap-6">
                {tramites.map((tramite, index) => {
                    const Icon = tramite.icon;
                    return (
                        <motion.button
                            key={tramite.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelect(tramite.id)}
                            className="group relative bg-white border-2 border-gray-200 rounded-2xl p-8 text-left hover:border-[#BE0F4A] transition-all duration-300 hover:shadow-xl"
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${tramite.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                            
                            <div className="relative">
                                <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${tramite.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#BE0F4A] transition-colors">
                                    {tramite.titulo}
                                </h3>
                                
                                <p className="text-gray-600">
                                    {tramite.descripcion}
                                </p>

                                <div className="mt-4 flex items-center text-[#BE0F4A] opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-sm font-semibold">Seleccionar</span>
                                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Info adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold text-blue-900 mb-1">
                            ¿Necesita ayuda para decidir?
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Seleccione "Nueva Solicitud" si está iniciando un proceso de arbitraje</li>
                            <li>• Seleccione "Apersonamiento" si está respondiendo a una solicitud que le han notificado</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}