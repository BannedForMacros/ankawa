/**
 * Echo / Reverb — conexión WebSocket nativa de Laravel (sin Pusher de pago).
 *
 * Dos instancias singleton perezosas:
 *   - getEcho()       → staff interno; autoriza canales por /broadcasting/auth (guard web).
 *   - getPortalEcho() → portal externo; autoriza por /mesa-partes/broadcasting/auth (sesión OTP).
 *
 * Ambas usan window.axios como authorizer → la cookie XSRF viaja sola (sin
 * problemas de CSRF). Si no hay VITE_REVERB_APP_KEY, devuelven null y todo
 * degrada con gracia (la campana sigue mostrando lo persistido, sin vivo).
 */
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY;

function configBase(authEndpoint) {
    return {
        broadcaster: 'reverb',
        key: REVERB_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel) => ({
            authorize: (socketId, callback) => {
                window.axios
                    .post(authEndpoint, { socket_id: socketId, channel_name: channel.name })
                    .then((r) => callback(null, r.data))
                    .catch((e) => callback(true, e));
            },
        }),
    };
}

let staffEcho = null;
export function getEcho() {
    if (!REVERB_KEY) return null;
    if (!staffEcho) staffEcho = new Echo(configBase('/broadcasting/auth'));
    return staffEcho;
}

let portalEcho = null;
export function getPortalEcho() {
    if (!REVERB_KEY) return null;
    if (!portalEcho) portalEcho = new Echo(configBase('/mesa-partes/broadcasting/auth'));
    return portalEcho;
}
