import toast from 'react-hot-toast';

/**
 * Filtra una lista de archivos contra los límites compartidos por el backend
 * (`upload_mimes` y `upload_max_mb` en props de Inertia), avisando con un toast
 * por cada archivo rechazado. Evita que el usuario espere todo el POST para
 * recibir un 413/422 por un archivo demasiado pesado o de tipo no permitido.
 */
export function filtrarArchivosValidos(files, { mimes, maxMb } = {}) {
    const permitidas = (mimes ?? []).map(m => String(m).toLowerCase());
    const maxBytes   = maxMb ? maxMb * 1024 * 1024 : null;

    return Array.from(files ?? []).filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';

        if (permitidas.length && !permitidas.includes(ext)) {
            toast.error(
                `"${f.name}" no es un formato permitido. Use: ${permitidas.map(e => e.toUpperCase()).join(', ')}.`,
                { duration: 5000 }
            );
            return false;
        }

        if (maxBytes && f.size > maxBytes) {
            toast.error(
                `"${f.name}" pesa ${(f.size / 1024 / 1024).toFixed(1)} MB y el máximo es ${maxMb} MB.`,
                { duration: 5000 }
            );
            return false;
        }

        return true;
    });
}
