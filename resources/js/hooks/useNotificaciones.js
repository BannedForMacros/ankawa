/**
 * useNotificaciones — estado de la campana del staff interno.
 *
 * Estado inicial desde auth.notificaciones (Inertia share). Se suscribe al
 * canal privado App.Models.User.{id} por Reverb y agrega en vivo lo que llega,
 * con un toast. Marcar leído actualiza optimista + persiste en backend.
 */
import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import toast from 'react-hot-toast';
import { getEcho } from '@/lib/echo';

export default function useNotificaciones() {
    const { auth } = usePage().props;
    const inicial = auth?.notificaciones ?? { no_leidas: 0, recientes: [] };
    const userId = auth?.user?.id;

    const [items, setItems] = useState(inicial.recientes ?? []);
    const [noLeidas, setNoLeidas] = useState(inicial.no_leidas ?? 0);

    useEffect(() => {
        if (!userId) return;
        const echo = getEcho();
        if (!echo) return;

        const nombreCanal = `App.Models.User.${userId}`;
        echo.private(nombreCanal).notification((n) => {
            setItems((prev) => [
                { id: n.id, leida: false, created_at: new Date().toISOString(), ...n },
                ...prev.filter((x) => x.id !== n.id),
            ].slice(0, 25));
            setNoLeidas((c) => c + 1);
            toast.success(n.titulo ?? 'Nueva notificación');
        });

        return () => { echo.leave(nombreCanal); };
    }, [userId]);

    const marcarLeida = useCallback((id) => {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
        setNoLeidas((c) => Math.max(0, c - 1));
        window.axios.post(`/notificaciones/${id}/leida`).catch(() => {});
    }, []);

    const marcarTodas = useCallback(() => {
        setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
        setNoLeidas(0);
        window.axios.post('/notificaciones/leer-todas').catch(() => {});
    }, []);

    return { items, noLeidas, marcarLeida, marcarTodas };
}
