import { Toaster, ToastBar, useToasterStore } from 'react-hot-toast';

/**
 * Toaster de marca CARD ANKAWA — centraliza el estilo de todos los avisos.
 *
 * Mejoras sobre el <Toaster> base:
 *  - Barra de progreso inferior que se reduce aludiendo al tiempo restante
 *    antes de que el toast se cierre (se pausa al pasar el mouse, en sync con
 *    la pausa nativa de react-hot-toast).
 *  - Éxito en verde (success = verde), error en rojo, resto en rose de marca.
 *
 * Mantiene la API estándar: seguir usando toast.success() / toast.error().
 */

// Color de acento por tipo de toast (borde izquierdo + barra de progreso).
const ACENTO = {
    success: '#16a34a', // emerald-600 — éxito en verde
    error: '#dc2626',   // red-600
    loading: '#BE0F4A', // rose de marca
    blank: '#BE0F4A',
    custom: '#BE0F4A',
};

function ToastConProgreso({ t }) {
    // pausedAt se setea cuando el cursor entra al área de toasts (pausa nativa);
    // así la barra se pausa exactamente igual que el temporizador de cierre.
    const { pausedAt } = useToasterStore();
    const acento = ACENTO[t.type] ?? ACENTO.blank;

    // Sin barra para loading (duración infinita) ni mientras sale (exit).
    const duracion = t.duration;
    const mostrarBarra =
        t.type !== 'loading' && Number.isFinite(duracion) && duracion > 0;

    return (
        <ToastBar
            toast={t}
            style={{
                position: 'relative',
                overflow: 'hidden',
                borderLeft: `4px solid ${acento}`,
            }}
        >
            {({ icon, message }) => (
                <>
                    {icon}
                    {message}
                    {mostrarBarra && (
                        <span
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                height: '3px',
                                width: '100%',
                                background: acento,
                                transformOrigin: 'left',
                                opacity: 0.85,
                                animation: `ankawa-toast-shrink ${duracion}ms linear forwards`,
                                animationPlayState:
                                    pausedAt || !t.visible ? 'paused' : 'running',
                            }}
                        />
                    )}
                </>
            )}
        </ToastBar>
    );
}

export default function AnkawaToaster({
    position = 'top-right',
    duration = 4000,
    toastOptions = {},
    ...props
}) {
    return (
        <Toaster
            position={position}
            toastOptions={{
                duration,
                ...toastOptions,
                style: {
                    background: '#fff',
                    color: '#291136',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                    padding: '12px 16px',
                    ...toastOptions.style,
                },
                success: {
                    iconTheme: { primary: '#16a34a', secondary: '#fff' },
                    ...toastOptions.success,
                },
                error: {
                    iconTheme: { primary: '#dc2626', secondary: '#fff' },
                    ...toastOptions.error,
                },
            }}
            {...props}
        >
            {(t) => <ToastConProgreso t={t} />}
        </Toaster>
    );
}
