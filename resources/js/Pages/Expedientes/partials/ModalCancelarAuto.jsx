import { useState, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { X, Zap, AlertTriangle, Paperclip, FileText, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Modal para que el GESTOR cancele un movimiento auto-generado por un traslado automático.
 *
 * Reglas:
 *  - Motivo es obligatorio (texto).
 *  - Tipo de documento obligatorio (el sustento legal de la cancelación).
 *  - Archivo obligatorio (la resolución/acta firmada que sustenta la decisión).
 *
 * Props:
 *  - open
 *  - expedienteId
 *  - movimiento (que se va a cancelar)
 *  - tiposDocumento (lista para el select)
 *  - onCancelado()  → callback de éxito
 *  - onClose()
 */
export default function ModalCancelarAuto({ open, expedienteId, movimiento, tiposDocumento = [], onCancelado, onClose }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');

    const [motivo, setMotivo] = useState('');
    const [tipoDocId, setTipoDocId] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [procesando, setProcesando] = useState(false);
    const fileInputRef = useRef();

    if (!open || !movimiento) return null;

    function pickFile(e) {
        const f = e.target.files?.[0];
        setArchivo(f ?? null);
    }

    function submit() {
        if (!motivo.trim()) {
            toast.error('Indicá el motivo de la cancelación.');
            return;
        }
        if (!tipoDocId) {
            toast.error('Seleccioná el tipo del documento de sustento.');
            return;
        }
        if (!archivo) {
            toast.error('Adjuntá el documento que sustenta la cancelación.');
            return;
        }

        const fd = new FormData();
        fd.append('motivo', motivo);
        fd.append('tipo_documento_id', tipoDocId);
        fd.append('archivo', archivo);

        setProcesando(true);
        router.post(
            route('expedientes.movimientos.cancelar-auto', [expedienteId, movimiento.id]),
            fd,
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Movimiento automático cancelado. El plazo se detuvo.');
                    onCancelado?.();
                    onClose?.();
                },
                onError: (err) => {
                    const msg = Object.values(err ?? {})[0];
                    toast.error(msg ?? 'No se pudo cancelar. Revisá los campos.');
                },
                onFinish: () => setProcesando(false),
            }
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap size={18} className="text-amber-300"/>
                        <div>
                            <h3 className="text-white font-bold">Cancelar movimiento automático</h3>
                            <p className="text-white/60 text-xs mt-0.5">Mov. #{movimiento.id} · {movimiento.instruccion?.substring(0, 60)}{movimiento.instruccion?.length > 60 ? '…' : ''}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Estás cancelando un movimiento creado automáticamente por la cascada de un traslado.
                            Al confirmar: el plazo se detiene, la fila del movimiento padre vuelve a estar pendiente
                            (permitirá resubmisión) y queda registrado en el historial. La cancelación se sustenta con el documento que adjuntes.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Motivo de la cancelación *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder="Ej. La parte presentó un documento incorrecto. Se anula el requerimiento generado..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 text-right">{motivo.length}/2000</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Tipo de documento de sustento *
                        </label>
                        <select
                            value={tipoDocId}
                            onChange={e => setTipoDocId(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A]"
                        >
                            <option value="">— Seleccioná tipo —</option>
                            {tiposDocumento.map(td => (
                                <option key={td.id} value={td.id}>{td.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Documento de sustento *
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={upload_accept}
                            onChange={pickFile}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors"
                        >
                            <Upload size={14} className="text-[#BE0F4A]"/>
                            {archivo ? 'Cambiar archivo' : 'Adjuntar resolución / acta'}
                        </button>
                        {archivo && (
                            <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
                                <Paperclip size={13} className="text-[#BE0F4A] shrink-0"/>
                                <span className="text-xs text-gray-700 flex-1 truncate">{archivo.name}</span>
                                <button type="button"
                                    onClick={() => { setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    className="text-xs text-red-600 hover:text-red-700 font-semibold">
                                    Quitar
                                </button>
                            </div>
                        )}
                        <p className="text-[11px] text-gray-400 mt-1">{formatsLabel} — máx. {upload_max_mb} MB</p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={procesando}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-60">
                        Cancelar
                    </button>
                    <button type="button" onClick={submit} disabled={procesando}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors">
                        {procesando ? 'Procesando...' : 'Cancelar movimiento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
