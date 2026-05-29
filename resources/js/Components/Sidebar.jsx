import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';

// ── Item del menú: enlace directo o grupo acordeón ────────────────────────────
function SidebarItem({ item, onNavigate }) {
    const { url } = usePage();
    const Icono = Icons[item.icono] ?? Icons.Folder;
    const tieneHijos = Array.isArray(item.hijos) && item.hijos.length > 0;
    const algunoActivo = tieneHijos && item.hijos.some(h => url.startsWith(h.ruta));
    const [abierto, setAbierto] = useState(algunoActivo);

    // Mantener expandido el grupo cuyo hijo está activo
    useEffect(() => { if (algunoActivo) setAbierto(true); }, [algunoActivo]);

    // Enlace directo (sin hijos)
    if (!tieneHijos) {
        const activo = url.startsWith(item.ruta);
        return (
            <Link
                href={item.ruta}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    activo
                        ? 'bg-[#BE0F4A] text-white shadow-sm shadow-[#BE0F4A]/30'
                        : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
            >
                <Icono size={18} className="shrink-0" />
                <span className="truncate">{item.nombre}</span>
            </Link>
        );
    }

    // Grupo con hijos (acordeón)
    return (
        <div>
            <button
                type="button"
                onClick={() => setAbierto(o => !o)}
                aria-expanded={abierto}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    algunoActivo ? 'text-white bg-white/10' : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
            >
                <Icono size={18} className="shrink-0" />
                <span className="flex-1 text-left truncate">{item.nombre}</span>
                <ChevronDown size={15} className={`shrink-0 opacity-60 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`} />
            </button>

            {/* Acordeón animado: grid-rows 0fr→1fr anima la altura (CSS puro) + fade */}
            <div
                aria-hidden={!abierto}
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${abierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className={`mt-1 ml-4 pl-3 border-l border-white/15 flex flex-col gap-0.5 transition-opacity duration-200 ${abierto ? 'opacity-100' : 'opacity-0'}`}>
                        {item.hijos.map(hijo => {
                            const IconoHijo = Icons[hijo.icono] ?? Icons.Dot;
                            const activo = url.startsWith(hijo.ruta);
                            return (
                                <Link
                                    key={hijo.slug}
                                    href={hijo.ruta}
                                    onClick={onNavigate}
                                    tabIndex={abierto ? 0 : -1}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        activo
                                            ? 'bg-[#BE0F4A] text-white font-semibold'
                                            : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    <IconoHijo size={15} className="shrink-0" />
                                    <span className="truncate">{hijo.nombre}</span>
                                    {activo && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Sidebar de navegación. Controlado por el header (hamburguesa).
 * - Escritorio (lg+): forma parte del flujo; al cerrar colapsa su ancho a 0.
 * - Móvil: se desliza como drawer con backdrop.
 *
 * Identidad Ankawa: degradado oscuro de marca + acento rose en el activo y un
 * pie discreto con la firma de la empresa (presencia sin saturar).
 */
export default function Sidebar({ open, onClose }) {
    const { auth } = usePage().props;

    // En móvil, cerrar el drawer al navegar; en escritorio se mantiene.
    const onNavigate = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
    };

    return (
        <>
            {/* Backdrop (solo móvil) */}
            <div
                onClick={onClose}
                aria-hidden="true"
                className={`absolute inset-0 bg-black/40 z-30 lg:hidden transition-opacity duration-300 ${
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />

            <aside
                className={`absolute lg:relative inset-y-0 left-0 z-40 w-72 shrink-0 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
                    open ? 'translate-x-0 lg:w-72' : '-translate-x-full lg:translate-x-0 lg:w-0'
                }`}
                style={{ background: 'linear-gradient(180deg, #291136 0%, #4A153D 100%)' }}
            >
                {/* Navegación */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1 w-72">
                    {auth.menu.map(item => (
                        <SidebarItem key={item.slug} item={item} onNavigate={onNavigate} />
                    ))}
                </nav>

                {/* Pie de marca — presencia discreta */}
                <div className="shrink-0 px-5 py-4 border-t border-white/10 w-72">
                    <img
                        src="/logo-white.png"
                        alt="The Ankawa Global Group"
                        className="h-7 w-auto object-contain opacity-90"
                    />
                    <p className="text-white/40 text-[10px] mt-2 leading-snug">
                        The Ankawa Global Group SAC<br />
                        Plataforma de Expediente Electrónico
                    </p>
                </div>
            </aside>
        </>
    );
}
