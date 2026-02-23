import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';

export default function FileCompressor({ file, onCompressed, onError }) {
    const [compressing, setCompressing] = useState(false);
    const [progress, setProgress] = useState(0);

    const compressFile = async (file) => {
        if (!file) return;

        const fileSizeMB = file.size / 1024 / 1024;
        
        // Si es menor a 100MB, no comprimir
        if (fileSizeMB <= 100) {
            onCompressed(file);
            return;
        }

        setCompressing(true);

        try {
            // Si es imagen
            if (file.type.startsWith('image/')) {
                const options = {
                    maxSizeMB: 90, // Comprimir a 90MB máximo
                    maxWidthOrHeight: 4096,
                    useWebWorker: true,
                    onProgress: (progress) => setProgress(progress),
                };

                const compressedFile = await imageCompression(file, options);
                const newFile = new File([compressedFile], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                });

                onCompressed(newFile);
            } 
            // Si es PDF
            else if (file.type === 'application/pdf') {
                // Para PDFs usaremos el backend
                await compressPDFBackend(file);
            }
            else {
                onError('Tipo de archivo no soportado para compresión');
            }
        } catch (error) {
            console.error('Error al comprimir:', error);
            onError('Error al comprimir el archivo');
        } finally {
            setCompressing(false);
            setProgress(0);
        }
    };

    const compressPDFBackend = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(route('mesa-partes.compress-files'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
            });

            if (!response.ok) {
                throw new Error('Error al comprimir PDF');
            }

            const blob = await response.blob();
            const compressedFile = new File([blob], file.name, {
                type: 'application/pdf',
                lastModified: Date.now(),
            });

            onCompressed(compressedFile);
        } catch (error) {
            throw error;
        }
    };

    // Auto-comprimir cuando se recibe el archivo
    useState(() => {
        if (file) {
            compressFile(file);
        }
    }, [file]);

    if (!compressing) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-[#BE0F4A] animate-spin mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Comprimiendo archivo...
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        El archivo supera los 100MB. Estamos comprimiéndolo automáticamente.
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-[#BE0F4A] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{progress}%</p>
                </div>
            </div>
        </div>
    );
}