import { useEffect, useState } from 'react';
import { X, FileText } from 'lucide-react';

/**
 * Previsualización de un File local (imagen / PDF / fallback) en un overlay.
 *
 * Crea el object URL UNA sola vez por archivo (useEffect) y lo libera en el cleanup.
 * Antes esto estaba copiado en 4 lugares con una fuga: se llamaba
 * `URL.createObjectURL` en cada render y se intentaba revocar `file._objectUrl`,
 * una propiedad que nunca se asignaba → los object URLs nunca se liberaban.
 *
 * @param {File|null} file  Archivo a previsualizar; si es null/undefined no renderiza nada.
 * @param {() => void} onClose
 */
export default function FilePreviewModal({ file, onClose }) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!file) { setUrl(null); return; }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!file || !url) return null;

    const ext = file.name.split('.').pop().toLowerCase();
    const esImagen = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const esPdf = ext === 'pdf';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60" />
            <div
                className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <FileText size={16} className="text-[#BE0F4A]" />
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[400px]">{file.name}</span>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                    {esImagen && <img src={url} alt={file.name} className="max-w-full max-h-[70vh] rounded object-contain" />}
                    {esPdf && <iframe src={url} title={file.name} className="w-full h-[70vh] rounded border-0" />}
                    {!esImagen && !esPdf && (
                        <div className="text-center">
                            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                            <p className="text-sm mt-1 text-gray-400">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
