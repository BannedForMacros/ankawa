import { useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { X, Paperclip, FileText, AlertTriangle, Clock } from 'lucide-react';
import AnkawaLoader from '@/Components/AnkawaLoader';
import ConfirmModal from '@/Components/ConfirmModal';
import PlazoUrgente from './PlazoUrgente';
import toast from 'react-hot-toast';

export default function ModalResponder({ mov, expediente, onClose, onRespondido }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const [respuesta,     setRespuesta]     = useState('');
    const [archivos,      setArchivos]      = useState([]);
    const [confirm,       setConfirm]       = useState(false);
    const [procesando,    setProcesando]    = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [previewFile,   setPreviewFile]   = useState(null);
    const loaderTimer                       = useRef(null);
    const inputRef                          = useRef();

    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

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

    function handleSubmit(e) {
        e.preventDefault();
        if (!respuesta.trim()) {
            toast.error('Ingresa tu respuesta antes de continuar.');
            return;
        }
        setConfirm(true);
    }

    async function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('respuesta', respuesta);
        archivos.forEach(f => fd.append('documentos[]', f));

        try {
            const res = await fetch(route('mesa-partes.responder', { movimiento: mov.id }), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                body: fd,
            });
            const data = await res.json();
            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);
            if (data.ok) {
                toast.success('Respuesta enviada correctamente. Recibirás un cargo en tu correo.');
                onClose();
                onRespondido();
            } else {
                toast.error(data.mensaje ?? 'Error al enviar la respuesta.');
            }
        } catch {
            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);
            toast.error('Error de conexión. Intente nuevamente.');
        }
    }

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar envío de respuesta"
            resumen="Se registrará tu respuesta en el expediente y se generará un cargo de recepción que llegará a tu correo."
            detalles={[
                { label: 'Expediente', value: expediente },
                mov.tipo_documento_requerido && { label: 'Doc. requerido', value: mov.tipo_documento_requerido },
                archivos.length > 0 && { label: 'Archivos adjuntos', value: `${archivos.length} archivo(s)` },
            ].filter(Boolean)}
            variant="warning"
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-white/60 text-xs">Expediente {expediente}</p>
                        <h2 className="text-white font-bold">Responder Requerimiento</h2>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="bg-[#291136]/5 border border-[#291136]/10 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-1">Instrucción</p>
                        <p className="text-sm text-[#291136]">{mov.instruccion}</p>
                        {mov.fecha_limite && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Clock size={11}/> Plazo límite: {mov.fecha_limite}
                            </p>
                        )}
                    </div>
                    {mov.tipo_documento_requerido && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                            <p className="text-xs text-amber-800 font-semibold">
                                Documento solicitado: <span className="text-[#BE0F4A]">{mov.tipo_documento_requerido}</span>
                                <span className="block font-normal text-amber-700 mt-0.5">Asegúrate de adjuntarlo en tu respuesta.</span>
                            </p>
                        </div>
                    )}
                    <PlazoUrgente mov={mov} />
                    <form id="form-respuesta" onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Tu respuesta *
                            </label>
                            <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)}
                                rows={5} placeholder="Escribe tu respuesta detallada aquí..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Documentos adjuntos (opcional)
                            </label>
                            <button type="button" onClick={() => inputRef.current?.click()}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                                <Paperclip size={15}/> Seleccionar archivos
                            </button>
                            <input ref={inputRef} type="file" multiple accept={upload_accept}
                                onChange={agregarArchivos} className="hidden"/>
                            <p className="text-xs text-gray-400 mt-1.5 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                            {archivos.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {archivos.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                            <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                            <button type="button" onClick={() => setPreviewFile(f)}
                                                className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                                {f.name}
                                            </button>
                                            <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                            <button type="button" onClick={() => quitarArchivo(i)}
                                                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                    {previewFile && (() => {
                        const url  = URL.createObjectURL(previewFile);
                        const ext2 = previewFile.name.split('.').pop().toLowerCase();
                        const esImagen = ['jpg','jpeg','png','gif','webp'].includes(ext2);
                        const esPdf   = ext2 === 'pdf';
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                                <div className="absolute inset-0 bg-black/60"/>
                                <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                                    onClick={e => e.stopPropagation()}>
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
                                        {esPdf && <iframe src={url} title={previewFile.name} className="w-full h-[70vh] rounded border-0"/>}
                                        {!esImagen && !esPdf && (
                                            <div className="text-center">
                                                <FileText size={48} className="mx-auto mb-3 text-gray-300"/>
                                                <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                                                <p className="text-sm mt-1 text-gray-400">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="form-respuesta" disabled={procesando}
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors">
                        {procesando ? 'Enviando...' : 'Enviar respuesta'}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}
