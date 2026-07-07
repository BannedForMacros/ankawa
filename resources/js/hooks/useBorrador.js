import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { confirmar } from '@/lib/swalAnkawa';

/**
 * Borradores de solicitudes de Mesa de Partes (localStorage).
 *
 * Cada formulario arma un `datos` serializable (SIN objetos File — los archivos
 * no se pueden persistir en localStorage) y una función `aplicar(datos)` que
 * vuelca el borrador en sus estados. El hook:
 *
 *   1. Al montar: si hay borrador vigente, ofrece restaurarlo (confirmar() de marca).
 *      Si el usuario declina, el borrador viejo se irá sobreescribiendo al avanzar.
 *   2. Autoguarda con debounce mientras `hayAvance` sea true (evita guardar
 *      formularios vírgenes por auto-selecciones como tipoDocumentoId único).
 *   3. Publica su estado ("guardando" / "guardado HH:mm") al badge del layout
 *      vía BorradorEstadoContext.
 *   4. `limpiar()` borra el borrador — llamarlo en el onSuccess del envío.
 *
 * Los nombres de archivos adjuntos sí se guardan (solo metadatos) para avisar
 * al usuario qué debe volver a adjuntar al restaurar.
 *
 * NO guardar en `datos`: aceptaciones legales (deben re-marcarse), tokens de
 * captcha, ni estados de UI (loaders, errores).
 */

// El layout provee el setter; los formularios publican. Sin provider → no-op.
export const BorradorEstadoContext = createContext(null);

const VERSION       = 1;
const CADUCIDAD_MS  = 7 * 24 * 60 * 60 * 1000; // 7 días
const DEBOUNCE_MS   = 1200;

export function claveBorrador(servicioSlug, portalEmail) {
    return `borrador:${servicioSlug}:${(portalEmail || 'anon').toLowerCase()}`;
}

const horaCorta = (d = new Date()) =>
    d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export default function useBorrador({ clave, datos, aplicar, archivos = null, hayAvance = false }) {
    const publicar = useContext(BorradorEstadoContext) ?? (() => {});

    const decidido    = useRef(false); // ya se resolvió el diálogo de restauración
    const dirty       = useRef(false); // hubo avance real en algún momento → seguir guardando
    const preguntado  = useRef(false); // guard contra doble diálogo (re-mounts)
    const timer       = useRef(null);

    // Refs espejo para leer el último valor desde callbacks sin re-suscribir
    const datosRef    = useRef(datos);
    const archivosRef = useRef(archivos);
    const aplicarRef  = useRef(aplicar);
    datosRef.current    = datos;
    archivosRef.current = archivos;
    aplicarRef.current  = aplicar;

    const escribir = useCallback(() => {
        try {
            localStorage.setItem(clave, JSON.stringify({
                v:        VERSION,
                savedAt:  Date.now(),
                datos:    datosRef.current,
                archivos: archivosRef.current ?? {},
            }));
            publicar({ estado: 'guardado', hora: horaCorta() });
        } catch {
            // Cuota llena o modo privado: el borrador simplemente no se guarda
        }
    }, [clave, publicar]);

    const limpiar = useCallback(() => {
        clearTimeout(timer.current);
        dirty.current = false;
        try { localStorage.removeItem(clave); } catch { /* noop */ }
        publicar(null);
    }, [clave, publicar]);

    // ── Restauración al montar ───────────────────────────────────────────────
    useEffect(() => {
        if (preguntado.current) return;
        preguntado.current = true;
        let cancelado = false;

        (async () => {
            let guardado = null;
            try {
                const raw = localStorage.getItem(clave);
                if (raw) guardado = JSON.parse(raw);
            } catch { /* JSON corrupto → tratar como inexistente */ }

            const vencido = guardado && (Date.now() - (guardado.savedAt ?? 0)) > CADUCIDAD_MS;
            if (!guardado || guardado.v !== VERSION || !guardado.datos || vencido) {
                if (guardado) { try { localStorage.removeItem(clave); } catch { /* noop */ } }
                decidido.current = true;
                return;
            }

            const fecha = new Date(guardado.savedAt);
            const dd = fecha.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const hh = horaCorta(fecha);
            const seccionesConArchivos = Object.entries(guardado.archivos ?? {})
                .filter(([, nombres]) => (nombres ?? []).length > 0)
                .map(([seccion]) => seccion);

            const ok = await confirmar({
                variant:  'info',
                titulo:   'Usted tiene un borrador guardado',
                mensaje:  `Guardamos su avance del ${dd} a las ${hh}. ¿Desea continuar donde lo dejó?`,
                detalles: seccionesConArchivos.length
                    ? [{ label: 'Archivos adjuntos', value: 'Deberá volver a adjuntarlos' }]
                    : null,
                confirmText: 'Sí, continuar',
            });
            if (cancelado) return;

            if (ok) {
                try {
                    aplicarRef.current?.(guardado.datos);
                    dirty.current = true;
                    publicar({ estado: 'guardado', hora: hh });
                    if (seccionesConArchivos.length) {
                        toast(
                            `Por seguridad, los archivos no se guardan en el borrador. Vuelva a adjuntar: ${seccionesConArchivos.join(', ')}.`,
                            { icon: '📎', duration: 9000, position: 'top-center' }
                        );
                    }
                } catch (e) {
                    console.error('No se pudo restaurar el borrador', e);
                    try { localStorage.removeItem(clave); } catch { /* noop */ }
                }
            }
            // Si declina: no borramos — su avance nuevo lo irá sobreescribiendo.
            decidido.current = true;
        })();

        return () => { cancelado = true; };
    }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Autoguardado (debounced) ─────────────────────────────────────────────
    const json = JSON.stringify(datos);
    useEffect(() => {
        if (!decidido.current) return;          // esperar decisión de restauración
        if (hayAvance) dirty.current = true;    // latch: una vez con avance, siempre guardar
        if (!dirty.current) return;             // formulario virgen → no ensuciar storage

        // String primitivo a propósito: React ignora sets repetidos del mismo valor,
        // así el tecleo continuo no re-renderiza el layout en cada pulsación.
        publicar('guardando');
        clearTimeout(timer.current);
        timer.current = setTimeout(escribir, DEBOUNCE_MS);
        return () => clearTimeout(timer.current);
    }, [json, hayAvance, escribir]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Flush al salir (cierre de pestaña o navegación SPA) ─────────────────
    useEffect(() => {
        const flush = () => {
            if (dirty.current && decidido.current) escribir();
        };
        window.addEventListener('beforeunload', flush);
        return () => {
            flush();
            window.removeEventListener('beforeunload', flush);
            publicar(null); // el badge no debe quedar pegado al salir del formulario
        };
    }, [escribir]); // eslint-disable-line react-hooks/exhaustive-deps

    return { limpiar };
}
