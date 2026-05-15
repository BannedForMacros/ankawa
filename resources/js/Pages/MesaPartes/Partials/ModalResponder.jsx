import { useState, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { X, Paperclip, FileText, AlertTriangle, Clock, Download, CheckCircle2 } from 'lucide-react';
import AnkawaLoader from '@/Components/AnkawaLoader';
import ConfirmModal from '@/Components/ConfirmModal';
import PlazoUrgente from './PlazoUrgente';
import toast from 'react-hot-toast';

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ModalResponder({ mov, expediente, onClose, onRespondido }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');

    // Tipos pendientes que este actor debe presentar (filas del pivot con tipo_documento_id).
    // Si está vacío → movimiento legacy → se muestra un único upload genérico.
    const responsablesPendientes = Array.isArray(mov.responsables_pendientes) ? mov.responsables_pendientes : [];
    const esLegacy = responsablesPendientes.length === 0;

    const [respuesta,      setRespuesta]      = useState('');
    // Archivos por tipo: { [tipo_documento_id]: File[] } para flujo nuevo
    const [archivosPorTipo, setArchivosPorTipo] = useState({});
    // Archivos legacy (1 sola lista, para movimientos viejos)
    const [archivosLegacy,  setArchivosLegacy]  = useState([]);
    const [confirmEnvio,    setConfirmEnvio]    = useState(false);
    const [confirmParcial,  setConfirmParcial]  = useState(null); // { tiposVacios: [{nombre, fecha_limite}] }
    const [procesando,      setProcesando]      = useState(false);
    const [mostrarLoader,   setMostrarLoader]   = useState(false);
    const [previewFile,     setPreviewFile]     = useState(null);
    const loaderTimer                            = useRef(null);
    const fileInputsRef                          = useRef({}); // refs por tipo_id
    const legacyInputRef                         = useRef();

    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

    function agregarArchivosTipo(tipoId, fileList) {
        const nuevos = Array.from(fileList);
        setArchivosPorTipo(prev => {
            const actuales = prev[tipoId] ?? [];
            const sinDup = nuevos.filter(n => !actuales.some(a => a.name === n.name && a.size === n.size));
            return { ...prev, [tipoId]: [...actuales, ...sinDup] };
        });
    }

    function quitarArchivoTipo(tipoId, idx) {
        setArchivosPorTipo(prev => ({
            ...prev,
            [tipoId]: (prev[tipoId] ?? []).filter((_, j) => j !== idx),
        }));
    }

    function agregarArchivosLegacy(fileList) {
        const nuevos = Array.from(fileList).filter(
            n => !archivosLegacy.some(a => a.name === n.name && a.size === n.size)
        );
        setArchivosLegacy(prev => [...prev, ...nuevos]);
    }

    function quitarArchivoLegacy(idx) {
        setArchivosLegacy(prev => prev.filter((_, j) => j !== idx));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!respuesta.trim()) {
            toast.error('Ingresa tu respuesta antes de continuar.');
            return;
        }

        if (esLegacy) {
            if (archivosLegacy.length === 0) {
                toast.error('Adjunta al menos un archivo.');
                return;
            }
            setConfirmEnvio(true);
            return;
        }

        // Flujo nuevo: revisar qué tipos tienen archivos y cuáles no.
        const tiposConArchivos = responsablesPendientes.filter(r => (archivosPorTipo[r.tipo_documento_id] ?? []).length > 0);
        const tiposVacios      = responsablesPendientes.filter(r => (archivosPorTipo[r.tipo_documento_id] ?? []).length === 0);

        if (tiposConArchivos.length === 0) {
            toast.error('Debes adjuntar al menos un documento de los requeridos.');
            return;
        }

        if (tiposVacios.length > 0) {
            // Mostrar warning de respuesta parcial
            setConfirmParcial({ tiposVacios, tiposConArchivos });
            return;
        }

        // Todos los tipos tienen archivos → confirm directo
        setConfirmEnvio(true);
    }

    async function enviar() {
        setConfirmEnvio(false);
        setConfirmParcial(null);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('respuesta', respuesta);

        if (esLegacy) {
            archivosLegacy.forEach(f => fd.append('documentos[]', f));
        } else {
            Object.entries(archivosPorTipo).forEach(([tipoId, files]) => {
                (files ?? []).forEach(f => fd.append(`archivos[${tipoId}][]`, f));
            });
        }

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
            open={confirmEnvio}
            titulo="Confirmar envío de respuesta"
            resumen="Se registrará tu respuesta en el expediente y se generará UN cargo de recepción que llegará a tu correo, sin importar cuántos documentos incluya."
            detalles={(() => {
                const dets = [{ label: 'Expediente', value: expediente }];
                if (esLegacy && mov.tipo_documento_requerido) {
                    dets.push({ label: 'Doc. requerido', value: mov.tipo_documento_requerido });
                    dets.push({ label: 'Archivos adjuntos', value: `${archivosLegacy.length} archivo(s)` });
                } else if (!esLegacy) {
                    const entregando = responsablesPendientes.filter(r => (archivosPorTipo[r.tipo_documento_id] ?? []).length > 0);
                    entregando.forEach(r => {
                        const n = (archivosPorTipo[r.tipo_documento_id] ?? []).length;
                        dets.push({ label: r.tipo_documento_nombre, value: `${n} archivo(s)` });
                    });
                }
                return dets;
            })()}
            variant="warning"
            onConfirm={enviar}
            onCancel={() => setConfirmEnvio(false)}
            confirmando={procesando}
        />
        {/* Modal de advertencia: respuesta parcial.
            Cuando el usuario confirma acá ya sabe lo que hace → enviamos directo,
            sin abrir un segundo "Confirmar envío" encima (evita modales apilados). */}
        <ConfirmModal
            open={!!confirmParcial}
            titulo="¿Entregar solo parte de los documentos?"
            resumen="Los siguientes documentos NO se entregarán hoy y su plazo seguirá corriendo. Recibirás un solo cargo que cubre únicamente los documentos que sí estás entregando ahora."
            detalles={(confirmParcial?.tiposVacios ?? []).map(t => ({
                label: t.tipo_documento_nombre,
                value: t.fecha_limite ? `Sigue pendiente — vence ${t.fecha_limite}` : 'Sigue pendiente',
            }))}
            variant="danger"
            onConfirm={enviar}
            onCancel={() => setConfirmParcial(null)}
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
                    {/* Aviso legacy: solo si NO hay responsables_pendientes pero sí tipo_documento_requerido global */}
                    {esLegacy && mov.tipo_documento_requerido && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                            <p className="text-xs text-amber-800 font-semibold">
                                Documento solicitado: <span className="text-[#BE0F4A]">{mov.tipo_documento_requerido}</span>
                                <span className="block font-normal text-amber-700 mt-0.5">Asegúrate de adjuntarlo en tu respuesta.</span>
                            </p>
                        </div>
                    )}
                    {Array.isArray(mov.documentos) && mov.documentos.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
                            <p className="text-xs font-bold text-[#291136] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <FileText size={13} className="text-[#BE0F4A]"/>
                                Documentos del requerimiento ({mov.documentos.length})
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                                Estos archivos fueron adjuntados por quien creó el requerimiento. Haz clic para abrirlos en una nueva pestaña.
                            </p>
                            <div className="space-y-2">
                                {mov.documentos.map(doc => (
                                    <a
                                        key={doc.id}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:border-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors group"
                                    >
                                        <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                        <span className="text-sm text-gray-700 group-hover:text-[#BE0F4A] flex-1 truncate font-medium">
                                            {doc.nombre_original}
                                        </span>
                                        <span className="text-xs text-gray-400 shrink-0">{formatBytes(doc.peso_bytes)}</span>
                                        <Download size={14} className="text-gray-300 group-hover:text-[#BE0F4A] shrink-0"/>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Trazabilidad: docs que el actor YA entregó antes para este requerimiento ── */}
                    {Array.isArray(mov.responsables_entregados) && mov.responsables_entregados.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
                            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <CheckCircle2 size={13}/>
                                Ya entregaste anteriormente ({mov.responsables_entregados.length})
                            </p>
                            <p className="text-xs text-emerald-600 mb-3">
                                Estos tipos de documento ya fueron presentados en una respuesta previa. Haz clic en cada archivo para revisarlo.
                            </p>
                            <div className="space-y-3">
                                {mov.responsables_entregados.map(r => (
                                    <div key={r.responsable_id} className="bg-white border border-emerald-200 rounded-lg p-3">
                                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                                            <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                                                <FileText size={14}/>
                                                {r.tipo_documento_nombre}
                                            </p>
                                            {r.fecha_respuesta && (
                                                <span className="text-[11px] text-emerald-600">
                                                    Entregado el {r.fecha_respuesta}
                                                </span>
                                            )}
                                        </div>
                                        {Array.isArray(r.archivos) && r.archivos.length > 0 ? (
                                            <div className="space-y-1.5 pl-1">
                                                {r.archivos.map(a => (
                                                    <a
                                                        key={a.id}
                                                        href={a.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 p-1.5 rounded border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50 transition-colors group"
                                                    >
                                                        <FileText size={14} className="text-emerald-600 shrink-0"/>
                                                        <span className="text-xs text-emerald-800 group-hover:underline flex-1 truncate font-medium">
                                                            {a.nombre_original}
                                                        </span>
                                                        <span className="text-[11px] text-emerald-500 shrink-0">{formatBytes(a.peso_bytes)}</span>
                                                        <Download size={12} className="text-emerald-400 group-hover:text-emerald-600 shrink-0"/>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-emerald-600 italic pl-1">Sin archivos registrados.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                        {/* ── Flujo NUEVO: una sección por tipo de documento pendiente ── */}
                        {!esLegacy && (
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Documentos a presentar
                                </label>
                                <p className="text-xs text-gray-500 -mt-2">
                                    Adjunta cada tipo de documento en su propia sección. Si no entregas alguno, ese plazo seguirá corriendo.
                                </p>
                                {responsablesPendientes.map(r => {
                                    const files = archivosPorTipo[r.tipo_documento_id] ?? [];
                                    const tieneArchivos = files.length > 0;
                                    return (
                                        <div key={r.responsable_id} className={`rounded-xl border-2 ${tieneArchivos ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-200 bg-white'} p-3 transition-colors`}>
                                            <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[#291136] flex items-center gap-1.5">
                                                        <FileText size={14} className="text-[#BE0F4A] shrink-0"/>
                                                        {r.tipo_documento_nombre}
                                                    </p>
                                                    {r.fecha_limite && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <Clock size={10}/> Vence: <span className="font-bold text-[#BE0F4A]">{r.fecha_limite}</span>
                                                            <span className="ml-1">({r.dias_plazo} días {r.tipo_dias === 'habiles' ? 'hábiles' : 'cal.'})</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${tieneArchivos ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {tieneArchivos ? `Listo · ${files.length}` : 'Pendiente'}
                                                </span>
                                            </div>
                                            <button type="button"
                                                onClick={() => fileInputsRef.current[r.tipo_documento_id]?.click()}
                                                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-semibold border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors">
                                                <Paperclip size={13}/> {tieneArchivos ? 'Agregar más archivos' : 'Adjuntar archivo'}
                                            </button>
                                            <input
                                                ref={el => { fileInputsRef.current[r.tipo_documento_id] = el; }}
                                                type="file" multiple accept={upload_accept}
                                                onChange={e => { agregarArchivosTipo(r.tipo_documento_id, e.target.files); e.target.value = ''; }}
                                                className="hidden"/>
                                            {tieneArchivos && (
                                                <div className="mt-2 flex flex-col gap-1.5">
                                                    {files.map((f, i) => (
                                                        <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded px-2.5 py-1.5">
                                                            <FileText size={14} className="text-[#BE0F4A] shrink-0"/>
                                                            <button type="button" onClick={() => setPreviewFile(f)}
                                                                className="truncate flex-1 text-xs font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                                                {f.name}
                                                            </button>
                                                            <span className="text-[11px] text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                                            <button type="button" onClick={() => quitarArchivoTipo(r.tipo_documento_id, i)}
                                                                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={13}/></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <p className="text-[11px] text-gray-400 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                            </div>
                        )}

                        {/* ── Flujo LEGACY: un solo upload genérico ── */}
                        {esLegacy && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                    Documentos adjuntos (opcional)
                                </label>
                                <button type="button" onClick={() => legacyInputRef.current?.click()}
                                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                                    <Paperclip size={15}/> Seleccionar archivos
                                </button>
                                <input ref={legacyInputRef} type="file" multiple accept={upload_accept}
                                    onChange={e => { agregarArchivosLegacy(e.target.files); e.target.value = ''; }} className="hidden"/>
                                <p className="text-xs text-gray-400 mt-1.5 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                                {archivosLegacy.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-2">
                                        {archivosLegacy.map((f, i) => (
                                            <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                                <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                                <button type="button" onClick={() => setPreviewFile(f)}
                                                    className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                                    {f.name}
                                                </button>
                                                <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                                <button type="button" onClick={() => quitarArchivoLegacy(i)}
                                                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
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
