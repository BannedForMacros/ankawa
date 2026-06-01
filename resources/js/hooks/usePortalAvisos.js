/**
 * usePortalAvisos — avisos en vivo para la parte externa (portal Mesa de Partes).
 *
 * Se suscribe a los canales privados portal.actor.{id} de los actores de la
 * sesión OTP. Al recibir un aviso: toast + recarga parcial de la bandeja.
 */
import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { getPortalEcho } from '@/lib/echo';

export default function usePortalAvisos(actorIds = [], recargar = ['expedientes', 'pendientesAceptacion']) {
    const clave = JSON.stringify(actorIds ?? []);

    useEffect(() => {
        const ids = actorIds ?? [];
        if (ids.length === 0) return;
        const echo = getPortalEcho();
        if (!echo) return;

        const canales = ids.map((id) => `portal.actor.${id}`);
        canales.forEach((nombre) => {
            echo.private(nombre).listen('.aviso', (e) => {
                toast.success(e?.titulo ?? 'Tienes una nueva notificación');
                router.reload({ only: recargar });
            });
        });

        return () => { canales.forEach((n) => echo.leave(n)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clave]);
}
