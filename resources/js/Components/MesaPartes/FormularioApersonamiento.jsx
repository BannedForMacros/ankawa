import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Upload, X, FileText, AlertCircle, ArrowLeft } from 'lucide-react';
import FileCompressor from './FileCompressor';

export default function FormularioApersonamiento({ onBack }) {
    const { data, setData, post, processing, errors } = useForm({
        // Número de expediente al que responde
        numero_expediente: '',
        
        // Identificación
        razon_social: '',
        ruc: '',
        datos_registrales: '',
        nombre_representante: '',
        dni_representante: '',
        
        // Domicilio
        domicilio: '',
        telefono: '',
        celular: '',
        email: '',
        
        // Posición
        resumen_posicion: '',
        pretensiones: '',
        monto: '',
        
        // Árbitro
        nombre_arbitro: '',
        domicilio_arbitro: '',
        email_arbitro: '',
        forma_designacion: '',
        
        // Adicionales
        reglas_aplicables: '',
        oposicion_inicio: false,
        motivo_oposicion: '',
        aceptacion_reglamento: false,
        
        // Archivos
        poder_representante: null,
        comprobante_pago: null,
    });

    const [archivos, setArchivos] = useState({
        poder_representante: null,
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
        post(route('mesa-partes.apersonamiento'));
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
            <div className="bg-gradient-to-r from-[#4A153D] to-[#B23241] rounded-2xl p-8 text-white">
                <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Formulario de Respuesta - Apersonamiento
                </h2>
                <p className="text-white/80">
                    Complete su respuesta a la solicitud de arbitraje
                </p>
            </div>

            {/* 1. Número de Expediente */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    1. Expediente al que Responde
                </h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Expediente *
                    </label>
                    <input
                        type="text"
                        value={data.numero_expediente}
                        onChange={e => setData('numero_expediente', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                        placeholder="Ej: ARB-2024-001"
                        required
                    />
                    {errors.numero_expediente && (
                        <p className="text-red-600 text-sm mt-1">{errors.numero_expediente}</p>
                    )}
                </div>
            </div>

            {/* 2. Identificación del Demandado */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    2. Identificación del Demandado
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Razón Social *
                        </label>
                        <input
                            type="text"
                            value={data.razon_social}
                            onChange={e => setData('razon_social', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Datos de Inscripción Registral *
                        </label>
                        <input
                            type="text"
                            value={data.datos_registrales}
                            onChange={e => setData('datos_registrales', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            placeholder="Partida registral, oficina registral, etc."
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
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
            </div>

            {/* 3. Domicilio */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    3. Domicilio y Contacto
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            value={data.telefono}
                            onChange={e => setData('telefono', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Celular
                        </label>
                        <input
                            type="tel"
                            value={data.celular}
                            onChange={e => setData('celular', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 4. Posición sobre la Controversia */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    4. Posición sobre la Controversia
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resumen de su Posición *
                        </label>
                        <textarea
                            value={data.resumen_posicion}
                            onChange={e => setData('resumen_posicion', e.target.value)}
                            rows="4"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Posibles Pretensiones
                        </label>
                        <textarea
                            value={data.pretensiones}
                            onChange={e => setData('pretensiones', e.target.value)}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            placeholder="S/. 0.00"
                        />
                    </div>
                </div>
            </div>

            {/* 5. Árbitro */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    5. Designación de Árbitro
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Árbitro *
                        </label>
                        <input
                            type="text"
                            value={data.nombre_arbitro}
                            onChange={e => setData('nombre_arbitro', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Correo del Árbitro *
                        </label>
                        <input
                            type="email"
                            value={data.email_arbitro}
                            onChange={e => setData('email_arbitro', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Domicilio del Árbitro *
                        </label>
                        <input
                            type="text"
                            value={data.domicilio_arbitro}
                            onChange={e => setData('domicilio_arbitro', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Forma de Designación *
                        </label>
                        <textarea
                            value={data.forma_designacion}
                            onChange={e => setData('forma_designacion', e.target.value)}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                            required
                        />
                    </div>
                </div>
            </div>

            {/* 6. Oposición (Opcional) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    6. Oposición al Inicio (Opcional)
                </h3>
                <label className="flex items-start mb-4">
                    <input
                        type="checkbox"
                        checked={data.oposicion_inicio}
                        onChange={e => setData('oposicion_inicio', e.target.checked)}
                        className="mt-1 mr-3"
                    />
                    <span className="text-sm text-gray-700">
                        Me opongo al inicio del arbitraje
                    </span>
                </label>

                {data.oposicion_inicio && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo de Oposición *
                        </label>
                        <select
                            value={data.motivo_oposicion}
                            onChange={e => setData('motivo_oposicion', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent mb-2"
                            required={data.oposicion_inicio}
                        >
                            <option value="">Seleccione un motivo</option>
                            <option value="convenio_no_refiere">
                                El convenio arbitral no hace referencia a la administración por el Centro
                            </option>
                            <option value="ausencia_convenio">
                                Ausencia absoluta de convenio arbitral
                            </option>
                        </select>
                        <p className="text-xs text-gray-500">
                            Solo puede oponerse por estas causales específicas
                        </p>
                    </div>
                )}
            </div>

            {/* 7. Documentos */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    7. Documentación
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reglas Aplicables
                        </label>
                        <textarea
                            value={data.reglas_aplicables}
                            onChange={e => setData('reglas_aplicables', e.target.value)}
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A153D] focus:border-transparent"
                        />
                    </div>
                    <FileUpload
                        file={archivos.comprobante_pago}
                        onChange={(e) => handleFileChange(e, 'comprobante_pago')}
                        onRemove={() => removeFile('comprobante_pago')}
                        accept=".pdf,.jpg,.jpeg,.png"
                        label="Comprobante de Pago *"
                    />
                </div>
            </div>

            {/* 8. Aceptación */}
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
                    className="px-8 py-3 bg-gradient-to-r from-[#4A153D] to-[#B23241] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Enviando...' : 'Enviar Respuesta'}
                </button>
            </div>
        </form>
    );
}

// Componente auxiliar reutilizable
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