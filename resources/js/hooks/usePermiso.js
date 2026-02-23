import { usePage } from '@inertiajs/react';

export function usePermiso() {
    const { permisos } = usePage().props.auth;

    const puede = (moduloSlug, accion = 'ver') => {
        return permisos?.[moduloSlug]?.[accion] ?? false;
    };

    return { puede };
}