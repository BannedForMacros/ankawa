import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import FileCompressor from './FileCompressor';

export default function FormularioArbitraje({ onBack }) {
    const { data, setData, post, processing, errors } = useForm({
        tipo_persona: 'natural',
        // Demandante
        nombre_demandante: '',
        dni_demandante: '',
        razon_social: '',
        ruc: '',
        nombre_representante: '',
        dni_representante: '',
        // Domicilio
        domicilio: '',
        email: '',
        telefono: '',
        celular: '',
        // Demandado
        nombre_demandado: '',
        datos_notificacion_demandado: '',
        // Documentos
        convenio_arbitral: null,
        poder_representante: null,
        resumen_controversia: '',
        pretensiones: '',
        monto: '',
        // Árbitro - SOLO PROPUESTA O PEDIDO
        arbitro_propuesto: '',
        solicitar_designacion_director: false,
        // Adicionales
        reglas_aplicables: '',
        medida_cautelar: null,
        aceptacion_reglamento: false,
        comprobante_pago: null,
    });

    const [archivos, setArchivos] = useState({
        convenio_arbitral: null,
        poder_representante: null,
        medida_cautelar: null,
        comprobante_pago: null,
    });

    const [compressingFile, setCompressingFile] = useState(null);
    const [compressionError, setCompressionError] = useState(null);

    const handleFileChange = (e, campo) => {
        const file = e.target.files[0];
        if (file) {
            const fileSizeMB = file.size / 1024 / 1024;
            
            if (fileSizeMB > 100) {
                setCompressingFile({ file, campo });
            } else {
                setArchivos(prev => ({ ...prev, [campo]: file }));
                setData(campo, file);
            }
        }
    };

    const handleCompressed = (compressedFile, campo) => {
        setArchivos(prev => ({ ...prev, [campo]: compressedFile }));
        setData(campo, compressedFile);
        setCompressingFile(null);
    };

    const handleCompressionError = (error) => {
        setCompressionError(error);
        setCompressingFile(null);
        setTimeout(() => setCompressionError(null), 5000);
    };

    const removeFile = (campo) => {
        setArchivos(prev => ({ ...prev, [campo]: null }));
        setData(campo, null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('mesa-partes.solicitud-arbitraje'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Compresor Modal */}
            {compressingFile && (
                <FileCompressor
                    file={compressingFile.file}
                    onCompressed={(file) => handleCompressed(file, compressingFile.campo)}
                    onError={handleCompressionError}
                />
            )}

            {/* Error de compresión */}
            {compressionError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{compressionError}</p>
                </div>
            )}

            {/* Botón volver */}
            <button
                type="button"
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-[#BE0F4A] transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Requisitos
            </button>

            {/* Header */}
            <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Formulario de Solicitud de Arbitraje
                </h2>
                <p className="text-white/80">
                    Complete todos los campos requeridos y adjunte la documentación necesaria
                </p>
            </div>

            {/* 1. Tipo de Persona */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    1. Tipo de Solicitante
                </h3>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="natural"
                            checked={data.tipo_persona === 'natural'}
                            onChange={e => setData('tipo_persona', e.target.value)}
                            className="mr-2"
                        />
                        <span>Persona Natural</span>
                    </label>
                    <label className="flex items-center">
                        <input
                            type="radio"
                            value="juridica"
                            checked={data.tipo_persona === 'juridica'}
                            onChange={e => setData('tipo_persona', e.target.value)}
                            className="mr-2"
                        />
                        <span>Persona Jurídica</span>
                    </label>
                </div>
            </div>

            {/* 2. Datos del Demandante */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    2. Identificación del Demandante
                </h3>
                
                {data.tipo_persona === 'natural' ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                value={data.nombre_demandante}
                                onChange={e => setData('nombre_demandante', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                            {errors.nombre_demandante && (
                                <p className="text-red-600 text-sm mt-1">{errors.nombre_demandante}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                DNI *
                            </label>
                            <input
                                type="text"
                                value={data.dni_demandante}
                                onChange={e => setData('dni_demandante', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                            {errors.dni_demandante && (
                                <p className="text-red-600 text-sm mt-1">{errors.dni_demandante}</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Razón Social *
                            </label>
                            <input
                                type="text"
                                value={data.razon_social}
                                onChange={e => setData('razon_social', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                RUC *
                            </label>
                            <input
                                type="text"
                                value={data.ruc}
                                onChange={e => setData('ruc', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Representante *
                            </label>
                            <input
                                type="text"
                                value={data.nombre_representante}
                                onChange={e => setData('nombre_representante', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                DNI del Representante *
                            </label>
                            <input
                                type="text"
                                value={data.dni_representante}
                                onChange={e => setData('dni_representante', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FileUpload
                                file={archivos.poder_representante}
                                onChange={(e) => handleFileChange(e, 'poder_representante')}
                                onRemove={() => removeFile('poder_representante')}
                                accept=".pdf"
                                label="Poder del Representante *"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Domicilio y Contacto */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    3. Domicilio y Datos de Contacto
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domicilio*
                        </label>
                        <input
                            type="text"
                            value={data.domicilio}
                            onChange={e => setData('domicilio', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="Dirección completa en Cusco"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Celular *
                        </label>
                        <input
                            type="tel"
                            value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono
                        </label>
                        <input
                            type="tel"
                            value={data.celular}
                            onChange={e => setData('celular', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* 4. Datos del Demandado */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    4. Identificación del Demandado
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre/Razón Social del Demandado *
                        </label>
                        <input
                            type="text"
                            value={data.nombre_demandado}
                            onChange={e => setData('nombre_demandado', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Datos para Notificación *
                        </label>
                        <input
                            type="text"
                            value={data.datos_notificacion_demandado}
                            onChange={e => setData('datos_notificacion_demandado', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="Dirección, teléfono y/o email"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 5. Convenio Arbitral */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    5. Convenio Arbitral
                </h3>
                <FileUpload
                    file={archivos.convenio_arbitral}
                    onChange={(e) => handleFileChange(e, 'convenio_arbitral')}
                    onRemove={() => removeFile('convenio_arbitral')}
                    accept=".pdf"
                    label="Documento del Convenio Arbitral *"
                />
            </div>

            {/* 6. Materia de la Demanda */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    6. Materia de la Demanda
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resumen de la Controversia *
                        </label>
                        <textarea
                            value={data.resumen_controversia}
                            onChange={e => setData('resumen_controversia', e.target.value)}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="Describa brevemente la controversia"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Posibles Pretensiones *
                        </label>
                        <textarea
                            value={data.pretensiones}
                            onChange={e => setData('pretensiones', e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="Indique sus posibles pretensiones"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Monto Involucrado (si es cuantificable)
                        </label>
                        <input
                            type="text"
                            value={data.monto}
                            onChange={e => setData('monto', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="S/. 0.00"
                        />
                    </div>
                </div>
            </div>

            {/* 7. Propuesta de Árbitro - CORREGIDO */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    7. Árbitro Propuesto
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                        <strong>Nota:</strong> Puede proponer un árbitro de la nómina del Centro o solicitar que el Centro realice la designación. La designación formal se realizará en una etapa posterior del proceso.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="flex items-center mb-3">
                            <input
                                type="checkbox"
                                checked={data.solicitar_designacion_director}
                                onChange={e => {
                                    setData('solicitar_designacion_director', e.target.checked);
                                    if (e.target.checked) {
                                        setData('arbitro_propuesto', '');
                                    }
                                }}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Solicitar que el Director del Centro realice la designación
                            </span>
                        </label>
                    </div>

                    {!data.solicitar_designacion_director && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre del Árbitro Propuesto (de la nómina del Centro)
                            </label>
                            <input
                                type="text"
                                value={data.arbitro_propuesto}
                                onChange={e => setData('arbitro_propuesto', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                                placeholder="Ingrese el nombre del árbitro propuesto"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Debe ser un árbitro inscrito en la nómina del Centro Ankawa
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 8. Documentación Adicional */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    8. Documentación Adicional
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precisiones sobre Reglas Aplicables al Arbitraje
                        </label>
                        <textarea
                            value={data.reglas_aplicables}
                            onChange={e => setData('reglas_aplicables', e.target.value)}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE0F4A] focus:border-transparent"
                            placeholder="Cualquier precisión relativa a las reglas aplicables (opcional)"
                        />
                    </div>
                    <div>
                        <FileUpload
                            file={archivos.medida_cautelar}
                            onChange={(e) => handleFileChange(e, 'medida_cautelar')}
                            onRemove={() => removeFile('medida_cautelar')}
                            accept=".pdf"
                            label="Medida Cautelar Judicial Previa (si existe)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Solo si se ejecutó una medida cautelar por autoridad judicial
                        </p>
                    </div>
                    <div>
                        <FileUpload
                            file={archivos.comprobante_pago}
                            onChange={(e) => handleFileChange(e, 'comprobante_pago')}
                            onRemove={() => removeFile('comprobante_pago')}
                            accept=".pdf,.jpg,.jpeg,.png"
                            label="Comprobante de Pago de Tasa de Solicitud *"
                        />
                    </div>
                </div>
            </div>

            {/* 9. Aceptación */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <label className="flex items-start">
                    <input
                        type="checkbox"
                        checked={data.aceptacion_reglamento}
                        onChange={e => setData('aceptacion_reglamento', e.target.checked)}
                        className="mt-1 mr-3"
                        required
                    />
                    <span className="text-sm text-gray-700">
                        Acepto expresamente someterme al Reglamento Procesal de Arbitraje del 
                        Centro de Arbitraje y Resolución de Disputas ANKAWA INTERNACIONAL *
                    </span>
                </label>
            </div>

            {/* Botones */}
            <div className="flex justify-between items-center pt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                    Volver
                </button>
                <button
                    type="submit"
                    disabled={processing}
                    className="px-8 py-3 bg-gradient-to-r from-[#BE0F4A] to-[#BC1D35] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
            </div>
        </form>
    );
}

// Componente auxiliar para subida de archivos
function FileUpload({ file, onChange, onRemove, accept, label }) {
    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}
            {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click para subir</span> o arrastre aquí
                        </p>
                        <p className="text-xs text-gray-500">
                            Archivos hasta 100MB (se comprimirán automáticamente si son mayores)
                        </p>
                    </div>
                    <input
                        type="file"
                        className="hidden"
                        onChange={onChange}
                        accept={accept}
                    />
                </label>
            ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-[#BE0F4A]" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-red-600" />
                    </button>
                </div>
            )}
        </div>
    );
}