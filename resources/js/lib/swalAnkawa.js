import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Confirmaciones tematizadas Ankawa con SweetAlert2.
 * Tres variantes según lo que se hará, y SIEMPRE un breve resumen abajo:
 *   - danger  → desactivar / acción destructiva (rose, ícono alerta)
 *   - warning → crear algo nuevo (rose, ícono pregunta)
 *   - info    → guardar cambios / editar (plum, ícono info)
 */

const VARIANTES = {
    danger:  { icon: 'warning',  color: '#BE0F4A', confirmCls: 'bg-[#BE0F4A] hover:bg-[#9C0A3B] shadow-[#BE0F4A]/25', confirmText: 'Sí, continuar' },
    warning: { icon: 'question', color: '#BE0F4A', confirmCls: 'bg-[#BE0F4A] hover:bg-[#9C0A3B] shadow-[#BE0F4A]/25', confirmText: 'Sí, confirmar' },
    info:    { icon: 'info',     color: '#291136', confirmCls: 'bg-[#291136] hover:bg-[#3D1A52] shadow-[#291136]/25', confirmText: 'Sí, guardar' },
};

// Resumen "de lo que se hará": caja con pares etiqueta/valor
function resumenHtml(detalles) {
    const items = (detalles ?? []).filter(d => d && d.value != null && d.value !== '');
    if (items.length === 0) return '';
    const filas = items.map(d => `
        <div class="flex items-center justify-between gap-3 py-0.5">
            <span class="text-gray-400 text-xs font-semibold uppercase tracking-wide">${d.label}</span>
            <span class="text-[#291136] font-bold text-sm text-right">${d.value}</span>
        </div>`).join('');
    return `<div class="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-left">${filas}</div>`;
}

/**
 * Muestra la confirmación. Devuelve true si el usuario confirma.
 *   const ok = await confirmar({ variant, titulo, mensaje, detalles, confirmText });
 */
export async function confirmar({ variant = 'warning', titulo, mensaje, detalles, confirmText } = {}) {
    const v = VARIANTES[variant] ?? VARIANTES.warning;
    const html = `${mensaje ? `<p>${mensaje}</p>` : ''}${resumenHtml(detalles)}`;

    // Si hay un modal (Headless UI Dialog, id="modal") abierto, renderizar el SweetAlert
    // DENTRO de él para no pelear con su focus-trap (causa de que se reabriera al cancelar).
    const modalAbierto = (typeof document !== 'undefined') ? document.getElementById('modal') : null;

    const res = await Swal.fire({
        target: modalAbierto || 'body',
        heightAuto: false,
        icon: v.icon,
        iconColor: v.color,
        title: titulo,
        html,
        showCancelButton: true,
        reverseButtons: true,
        focusCancel: variant === 'danger',
        confirmButtonText: confirmText ?? v.confirmText,
        cancelButtonText: 'Cancelar',
        buttonsStyling: false,
        customClass: {
            popup:         'rounded-2xl !pb-5',
            title:         '!text-[#291136] !font-bold !text-lg',
            htmlContainer: '!text-gray-500 !text-sm !mt-2',
            actions:       '!gap-2 !mt-2',
            confirmButton: `px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-colors focus:outline-none ${v.confirmCls}`,
            cancelButton:  'px-5 py-2.5 rounded-xl text-sm font-semibold text-[#291136]/70 border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus:outline-none',
        },
    });
    return res.isConfirmed;
}

/** Atajo para "desactivar" (acción destructiva). */
export function confirmarDesactivar({ titulo, mensaje, detalle, detalles, confirmText = 'Sí, desactivar' }) {
    return confirmar({
        variant: 'danger',
        titulo,
        mensaje,
        detalles: detalles ?? (detalle ? [detalle] : null),
        confirmText,
    });
}

/** Atajo para "reactivar" (volver a activo). */
export function confirmarReactivar({ titulo, mensaje, detalle, detalles, confirmText = 'Sí, reactivar' }) {
    return confirmar({
        variant: 'info',
        titulo,
        mensaje,
        detalles: detalles ?? (detalle ? [detalle] : null),
        confirmText,
    });
}
