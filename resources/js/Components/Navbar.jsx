import { Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, LogOut } from 'lucide-react';

function NavDropdown({ item }) {
    const { url } = usePage();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const algunoActivo = item.hijos.some(h => url.startsWith(h.ruta));
    const IconoPadre = Icons[item.icono] ?? Icons.Folder;

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    if (!item.hijos || item.hijos.length === 0) {
        const activo = url.startsWith(item.ruta);
        return (
            <Link
                href={item.ruta}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    activo
                        ? 'bg-[#BE0F4A] text-white shadow-sm shadow-[#BE0F4A]/30'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
                <IconoPadre size={16} className="shrink-0" />
                <span>{item.nombre}</span>
            </Link>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    algunoActivo
                        ? 'bg-[#BE0F4A] text-white shadow-sm shadow-[#BE0F4A]/30'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
            >
                <IconoPadre size={16} className="shrink-0" />
                <span>{item.nombre}</span>
                <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 opacity-60 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50">
                    <div className="px-3 pb-1.5 mb-1 border-b border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {item.nombre}
                        </p>
                    </div>
                    {item.hijos.map(hijo => {
                        const IconoHijo = Icons[hijo.icono] ?? Icons.File;
                        const activo = url.startsWith(hijo.ruta);
                        return (
                            <Link
                                key={hijo.slug}
                                href={hijo.ruta}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                                    activo
                                        ? 'bg-[#BE0F4A]/10 text-[#BE0F4A] font-semibold'
                                        : 'text-[#291136]/75 hover:bg-gray-50 hover:text-[#291136] font-medium'
                                }`}
                            >
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                    activo ? 'bg-[#BE0F4A]/15' : 'bg-gray-100'
                                }`}>
                                    <IconoHijo size={14} />
                                </div>
                                <span>{hijo.nombre}</span>
                                {activo && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Navbar() {
    const { auth } = usePage().props;
    const [userOpen, setUserOpen] = useState(false);
    const userRef = useRef(null);

    const handleLogout = () => router.post(route('logout'));

    useEffect(() => {
        function handleClick(e) {
            if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const initiales = auth.user.name
        .split(' ')
        .slice(0, 2)
        .map(n => n.charAt(0).toUpperCase())
        .join('');

    return (
        <header
            className="w-full h-20 flex items-center px-6 gap-4 shrink-0 z-40 relative"
            style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 55%, #291136 100%)' }}
        >
            {/* Logo blanco */}
            <Link href="/dashboard" className="shrink-0 flex items-center">
                <img
                    src="/logo-white.png"
                    alt="Ankawa Global Group"
                    className="h-14 w-auto object-contain"
                />
            </Link>

            {/* Divisor */}
            <div className="w-px h-7 bg-white/20 shrink-0" />

            {/* Navegación */}
            <nav className="flex items-center gap-1 flex-1">
                {auth.menu.map(item => (
                    <NavDropdown key={item.slug} item={item} />
                ))}
            </nav>

            {/* Usuario */}
            <div ref={userRef} className="relative shrink-0">
                <button
                    onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/10 transition-colors duration-200 group"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                        {initiales}
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-white text-sm font-semibold leading-tight">
                            {auth.user.name.split(' ')[0]}
                        </p>
                        <p className="text-white/50 text-xs truncate max-w-[130px]">
                            {auth.user.email}
                        </p>
                    </div>
                    <ChevronDown
                        size={13}
                        className={`text-white/50 transition-transform duration-200 group-hover:text-white/80 ${userOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {userOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {initiales}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-[#291136] truncate">
                                        {auth.user.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{auth.user.email}</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-150"
                        >
                            <LogOut size={15} className="shrink-0" />
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
