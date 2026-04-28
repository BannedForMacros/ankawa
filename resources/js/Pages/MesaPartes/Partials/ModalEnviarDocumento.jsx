import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { X, Paperclip, FileText, Send, AlertCircle } from 'lucide-react';
import AnkawaLoader from '@/Components/AnkawaLoader';
import ConfirmModal from '@/Components/ConfirmModal';
import toast from 'react-hot-toast';

export default function ModalEnviarDocumento({ expediente, onClose, onEnviado }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');

    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [cargandoTipos,  setCargandoTipos]  = useState(true);
    const [errorTipos,     setErrorTipos]     = useState(null);

    const [tipoDocumentoId, setTipoDocumentoId] = useState('');
    const [descripcion,     setDescripcion]     = useState('');
    const [archivos,        setArchivos]        = useState([]);

    const [confirm,        setConfirm]        = useState(false);
    const [procesando,     setProcesando]     = useState(false);
    const [mostrarLoader,  setMostrarLoader]  = useState(false);
    const [previewFile,    setPreviewFile]    = useState(null);

    const inputRef    = useRef();
    const loaderTimer = useRef(null);

    useEffect(() => {
        async function cargar() {
            try {
                const { data } = await window.axios.get(
                    route('mesa-partes.tipos-documento-envio', { expediente: expediente.id })
                );
                setTiposDocumento(data ?? []);
            } catch (e) {
                setErrorTipos(e.response?.data?.message ?? 'No se pudieron cargar los tipos de documento.');
            } finally {
                setCargandoTipos(false);
            }
        }
        cargar();
    }, [expediente.id]);

    function agregarArchivos(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
        setArchivos(prev => [...prev, ...nuevos]);
        e.target.value = '';
    }

    function quitarArchivo(i) {
        setArchivos(prev => prev.filter((_, idx) => idx !== i));
    }

    function openPreview(f) { setPreviewFile(f); }
    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!tipoDocumentoId) {
            toast.error('Selecciona el tipo de documento.');
            return;
        }
        if (!descripcion.trim()) {
            toast.error('Describe brevemente qué estás enviando.');
            return;
        }
        if (archivos.length === 0) {
            toast.error('Debes adjuntar al menos un documento.');
            return;
        }
        setConfirm(true);
    }

    async function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('tipo_documento_id', tipoDocumentoId);
        fd.append('descripcion', descripcion);
        archivos.forEach(f => fd.append('documentos[]', f));

        try {
            const { data } = await window.axios.post(
                route('mesa-partes.envios.store', { expediente: expediente.id }),
                fd
            );

            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);

            if (data.ok) {
                toast.success(data.mensaje ?? 'Envío registrado.');
                onEnviado?.();
                onClose();
            } else {
                toast.error(data.mensaje ?? 'No se pudo registrar el envío.');
            }
        } catch (e) {
            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);
            const msg = e.response?.data?.message
                ?? e.response?.data?.mensaje
                ?? Object.values(e.response?.data?.errors ?? {})[0]?.[0]
                ?? 'Error de conexión. Intenta nuevamente.';
            toast.error(msg);
        }
    }

    const tipoSeleccionado = tiposDocumento.find(t => String(t.id) === String(tipoDocumentoId));

    return (
        <>
            <AnkawaLoader visible={mostrarLoader} />

            <ConfirmModal
                open={confirm}
                titulo="Confirmar envío de documento"
                resumen="Tu envío se registrará y quedará pendiente de aceptación por el responsable del expediente. Solo aparecerá en el historial cuando sea aceptado."
                detalles={[
                    { label: 'Expediente',        value: expediente.numero_expediente },
                    { label: 'Tipo de documento', value: tipoSeleccionado?.nombre ?? '—' },
                    { label: 'Archivos',          value: `${archivos.length} archivo(s)` },
                ]}
                variant="warning"
                onConfirm={confirmar}
                onCancel={() => setConfirm(false)}
                confirmando={procesando}
            />

            <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4 flex items-center justify-between shrink-0">
                        <div>
                            <p className="text-white/60 text-xs">Expediente {expediente.numero_expediente}</p>
                            <h2 className="text-white font-bold">Enviar documento al expediente</h2>
                        </div>
                        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                            <X size={20}/>
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 flex gap-2.5">
                            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                Este envío quedará pendiente de aceptación por el responsable del expediente.
                                Solo aparecerá en el historial oficial cuando sea aceptado.
                            </p>
                        </div>

                        <form id="form-envio" onSubmit={handleSubmit} className="space-y-4">
                            {/* Tipo de documento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Tipo de documento *
                                </label>
                                {cargandoTipos ? (
                                    <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                                ) : errorTipos ? (
                                    <p className="text-sm text-red-600">{errorTipos}</p>
                                ) : (
                                    <select
                                        value={tipoDocumentoId}
                                        onChange={e => setTipoDocumentoId(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#BE0F4A] bg-white"
                                    >
                                        <option value="">— Selecciona un tipo —</option>
                                        {tiposDocumento.map(t => (
                                            <option key={t.id} value={t.id}>{t.nombre}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Descripción del envío *
                                </label>
                                <textarea
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                    rows={4}
                                    maxLength={2000}
                                    placeholder="Indica brevemente en qué consiste el documento que envías..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none"
                                />
                                <p className="text-xs text-gray-400 mt-1 text-right">{descripcion.length}/2000</p>
                            </div>

                            {/* Archivos */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Documentos adjuntos * (mínimo 1)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center"
                                >
                                    <Paperclip size={15}/> Seleccionar archivos
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    multiple
                                    accept={upload_accept}
                                    onChange={agregarArchivos}
                                    className="hidden"
                                />
                                <p className="text-xs text-gray-400 mt-1.5 text-center">
                                    {formatsLabel} — máx. {upload_max_mb} MB por archivo
                                </p>

                                {archivos.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        {archivos.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                                <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                                <button
                                                    type="button"
                                                    onClick={() => openPreview(f)}
                                                    className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors"
                                                >
                                                    {f.name}
                                                </button>
                                                <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                                <button
                                                    type="button"
                                                    onClick={() => quitarArchivo(i)}
                                                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                                                >
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Preview */}
                        {previewFile && (() => {
                            const url = URL.createObjectURL(previewFile);
                            const ext = previewFile.name.split('.').pop().toLowerCase();
                            const esImagen = ['jpg','jpeg','png','gif','webp'].includes(ext);
                            const esPdf    = ext === 'pdf';
                            return (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                    onClick={closePreview}
                                >
                                    <div className="absolute inset-0 bg-black/60"/>
                                    <div
                                        className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#BE0F4A]"/>
                                                <span className="text-sm font-semibold text-gray-800 truncate max-w-[400px]">{previewFile.name}</span>
                                            </div>
                                            <button type="button" onClick={closePreview} className="text-gray-400 hover:text-gray-700 transition-colors">
                                                <X size={20}/>
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                                            {esImagen && <img src={url} alt={previewFile.name} className="max-w-full max-h-[70vh] rounded object-contain"/>}
                                            {esPdf    && <iframe src={url} title={previewFile.name} className="w-full h-[70vh] rounded border-0"/>}
                                            {!esImagen && !esPdf && (
                                                <div className="text-center text-gray-400">
                                                    <FileText size={48} className="mx-auto mb-3 text-gray-300"/>
                                                    <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                                                    <p className="text-sm mt-1">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-envio"
                            disabled={procesando || cargandoTipos}
                            className="px-6 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors flex items-center gap-2"
                        >
                            <Send size={14}/> {procesando ? 'Enviando...' : 'Enviar al expediente'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
