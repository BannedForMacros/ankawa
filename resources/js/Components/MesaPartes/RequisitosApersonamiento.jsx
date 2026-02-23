import { CheckCircle, FileText, Upload, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RequisitosApersonamiento({ onContinue }) {
    const requisitos = [
        {
            titulo: "Identificación del Demandado",
            items: [
                "Persona Jurídica: Razón social, datos registrales",
                "Nombre del representante y su DNI",
                "Copia de poderes correspondientes"
            ]
        },
        {
            titulo: "Domicilio y Datos de Contacto",
            items: [
                "Domicilio dentro del radio urbano de Cusco",
                "Teléfono/celular",
                "Correo electrónico u otros medios para notificación"
            ]
        },
        {
            titulo: "Posición sobre la Controversia",
            items: [
                "Resumen de su posición acerca de la controversia",
                "Posibles pretensiones",
                "Monto involucrado (si es cuantificable)"
            ]
        },
        {
            titulo: "Designación de Árbitro",
            items: [
                "Nombre, domicilio y correo del árbitro designado",
                "Forma de designación o pedido al Director"
            ]
        },
        {
            titulo: "Documentación Adicional",
            items: [
                "Precisión de reglas aplicables (si corresponde)",
                "Aceptación expresa del Reglamento CARD Ankawa",
                "Comprobante de pago por tasa de Respuesta/Apersonamiento"
            ]
        },
        {
            titulo: "Oposición al Inicio (Opcional)",
            items: [
                "Solo por: (a) Convenio no refiere administración por el Centro",
                "O (b) Ausencia absoluta de convenio arbitral"
            ]
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A153D] to-[#B23241] rounded-2xl p-8 text-white">
                <div className="flex items-start space-x-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                        <FileText className="w-8 h-8 text-[#BE0F4A]" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Requisitos para Respuesta - Apersonamiento
                        </h2>
                        <p className="text-white/80">
                            Documentos necesarios para responder a una solicitud de arbitraje
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-amber-800">
                        <strong>Plazo:</strong> Debe presentar su respuesta dentro de los 5 días de notificada la solicitud de arbitraje.
                    </p>
                </div>
            </div>

            {/* Requisitos */}
            <div className="grid gap-6">
                {requisitos.map((seccion, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
                    >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="bg-[#4A153D] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
                                {index + 1}
                            </span>
                            {seccion.titulo}
                        </h3>
                        <ul className="space-y-2">
                            {seccion.items.map((item, i) => (
                                <li key={i} className="flex items-start text-gray-700">
                                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Consecuencias */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">
                    Importante
                </h3>
                <div className="space-y-2 text-sm text-red-800">
                    <p>✓ Si no se apersona en el plazo, el arbitraje continuará de todas formas</p>
                    <p>✓ Si la respuesta no cumple requisitos: 3 días para subsanar</p>
                    <p>✓ Puede oponerse al inicio solo por las causales permitidas</p>
                </div>
            </div>

            {/* Botón */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={onContinue}
                    className="group px-8 py-4 bg-gradient-to-r from-[#4A153D] to-[#B23241] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
                >
                    <Upload className="w-5 h-5" />
                    <span>Iniciar Respuesta/Apersonamiento</span>
                </button>
            </div>
        </div>
    );
}