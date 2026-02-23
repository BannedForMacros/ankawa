import { CheckCircle, FileText, Upload, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RequisitosArbitraje({ onContinue }) {
    const requisitos = [
        {
            titulo: "Identificación del Demandante",
            items: [
                "Persona Natural: Nombre completo + DNI",
                "Persona Jurídica: Razón social, RUC, datos registrales, nombre del representante + DNI",
                "Copia del poder (si actúa por representante)"
            ]
        },
        {
            titulo: "Domicilio y Datos de Contacto",
            items: [
                "Domicilio dentro del radio urbano de Perú",
                "Correo electrónico",
                "Teléfono/celular",
                "Si domicilia fuera del Perú: solo correo electrónico"
            ]
        },
        {
            titulo: "Identificación del Demandado",
            items: [
                "Datos completos del demandado",
                "Dirección, teléfono y/o correo electrónico para notificaciones"
            ]
        },
        {
            titulo: "Convenio Arbitral",
            items: [
                "Copia del documento donde conste el convenio arbitral",
                "Evidencia del compromiso escrito de someter la controversia al arbitraje"
            ]
        },
        {
            titulo: "Materia de la Demanda",
            items: [
                "Descripción/resumen de la controversia",
                "Posibles pretensiones",
                "Monto involucrado (si es cuantificable)"
            ]
        },
        {
            titulo: "Árbitro Propuesto",
            items: [
                "Nombre del árbitro propuesto (de la nómina del Centro), O",
                "Solicitud para que el Centro realice la designación",
                "Nota: La designación formal se realizará posteriormente"
            ]
        },
        {
            titulo: "Documentación Adicional",
            items: [
                "Precisiones sobre reglas aplicables al arbitraje",
                "Medida cautelar judicial previa (si existe) + copia de actuados",
                "Aceptación expresa del Reglamento CARD Ankawa",
                "Comprobante de pago por tasa de solicitud de arbitraje"
            ]
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] rounded-2xl p-8 text-white">
                <div className="flex items-start space-x-4">
                    <div className="bg-white/10 p-3 rounded-xl">
                        <FileText className="w-8 h-8 text-[#BE0F4A]" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            Requisitos para Solicitud de Arbitraje
                        </h2>
                        <p className="text-white/80">
                            Revise cuidadosamente los requisitos antes de iniciar su trámite
                        </p>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm text-amber-800">
                        <strong>Importante:</strong> Todos los documentos deben estar firmados por la parte o su representante. 
                        No se requiere firma de abogado.
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
                            <span className="bg-[#BE0F4A] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm mr-3">
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

            {/* Proceso de Admisión */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                    Proceso de Admisión
                </h3>
                <div className="space-y-3 text-sm text-blue-800">
                    <p>✓ La Secretaría General verificará que la solicitud cumpla todos los requisitos</p>
                    <p>✓ Si está conforme: se comunicará al demandado (5 días para apersonarse)</p>
                    <p>✓ Si falta algo: se otorgarán 3 días para subsanar(modificable)</p>
                    <p>✓ La decisión de admisión es inimpugnable</p>
                </div>
            </div>

            {/* Botón para continuar */}
            <div className="flex justify-center pt-4">
                <button
                    onClick={onContinue}
                    className="group px-8 py-4 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center space-x-2"
                >
                    <Upload className="w-5 h-5" />
                    <span>Iniciar Trámite de Arbitraje</span>
                </button>
            </div>
        </div>
    );
}