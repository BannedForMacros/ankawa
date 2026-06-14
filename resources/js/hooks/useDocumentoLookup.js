import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { consultarDocumento } from '@/utils/consultaDocumento';

/**
 * Máquina de estado para un campo de documento con autocompletado RENIEC/SUNAT.
 *
 * Modela el contrato de "callback único" usado por los lookups de JPRD/Otros:
 * `onResuelto(doc, nombre)` donde `nombre === null` significa "no tocar el nombre
 * todavía" (mientras el usuario tipea) y `''`/texto significa fijarlo.
 *
 * Comportamiento (idéntico al de CampoRuc/CampoDni originales):
 * - Al tipear: limpia no-dígitos, recorta a `longitud`, desbloquea, y si alcanza
 *   la longitud exacta dispara la consulta tras 500 ms (debounce).
 * - Éxito: fija el nombre y bloquea el campo.
 * - Fallo: muestra un toast informativo y NO borra lo que el usuario haya escrito.
 *
 * @param {object}   opts
 * @param {'dni'|'ruc'} opts.tipo
 * @param {number}   opts.longitud           8 (DNI) | 11 (RUC)
 * @param {(doc: string, nombre: string|null) => void} opts.onResuelto
 * @param {string}   opts.mensajeNoEncontrado texto del toast cuando no se halla
 * @returns {{ cargando: boolean, bloqueado: boolean, onChange: (raw: string) => void, limpiar: () => void }}
 */
export default function useDocumentoLookup({ tipo, longitud, onResuelto, mensajeNoEncontrado }) {
    const [cargando, setCargando] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function onChange(raw) {
        const clean = raw.replace(/\D/g, '').slice(0, longitud);
        onResuelto(clean, bloqueado ? '' : null);
        setBloqueado(false);
        clearTimeout(timerRef.current);
        if (clean.length === longitud) {
            timerRef.current = setTimeout(() => buscar(clean), 500);
        }
    }

    async function buscar(num) {
        setCargando(true);
        try {
            const data = await consultarDocumento(tipo, num);
            onResuelto(num, data.nombre ?? '');
            setBloqueado(true);
        } catch {
            toast(mensajeNoEncontrado, { icon: 'ℹ️', duration: 3000 });
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onResuelto('', '');
    }

    return { cargando, bloqueado, onChange, limpiar };
}
