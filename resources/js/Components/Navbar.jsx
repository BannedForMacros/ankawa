import { Link, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Menu, User, Search } from 'lucide-react';
import BellNotificaciones from '@/Components/BellNotificaciones';

export default function Navbar({ sidebarOpen = false, onToggleSidebar = () => {} }) {
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

    return (
        <header className="w-full h-20 flex items-center px-4 sm:px-6 gap-3 sm:gap-4 shrink-0 z-40 relative bg-white border-b-2 border-[#291136]">

            {/* Botón hamburguesa — abrirá el sidebar (pendiente) */}
            <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Abrir menú lateral"
                aria-expanded={sidebarOpen}
                className="shrink-0 w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#291136] hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30"
            >
                <Menu size={22} />
            </button>

            {/* Logo (a color) */}
            <Link href="/dashboard" className="shrink-0 flex items-center">
                <img
                    src="/logo.png"
                    alt="Ankawa Global Group"
                    className="h-[4.5rem] w-auto object-contain"
                />
            </Link>

            {/* Divisor */}
            <div className="w-px h-8 bg-gray-200 shrink-0 hidden sm:block" />

            {/* Título de la plataforma */}
            <div className="hidden sm:block leading-tight">
                <p className="text-[#291136] font-bold text-sm tracking-tight">Mesa de Partes Virtual</p>
                <p className="text-gray-400 text-xs">Expediente Electrónico</p>
            </div>

            {/* Espaciador */}
            <div className="flex-1" />

            {/* Acciones rápidas */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    title="Buscar expediente"
                    aria-label="Buscar expediente"
                    className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#291136]/70 hover:bg-gray-100 hover:text-[#291136] transition-colors focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30"
                >
                    <Search size={20} />
                </button>
                <BellNotificaciones />
            </div>

            {/* Divisor */}
            <div className="w-px h-8 bg-gray-200 shrink-0 mx-1.5 hidden sm:block" />

            {/* Usuario */}
            <div ref={userRef} className="relative shrink-0">
                <button
                    onClick={() => setUserOpen(!userOpen)}
                    className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors duration-200 group"
                >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#BE0F4A] to-[#BC1D35] flex items-center justify-center text-white shadow-sm shrink-0">
                        <User size={18} strokeWidth={2.2} />
                    </div>
                    <div className="text-left hidden md:block">
                        <p className="text-[#291136] text-sm font-semibold leading-tight">
                            {auth.user.name.split(' ')[0]}
                        </p>
                        <p className="text-gray-400 text-xs truncate max-w-[150px] leading-tight">
                            {auth.user.email}
                        </p>
                    </div>
                    <ChevronDown
                        size={14}
                        className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${userOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {userOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-1.5 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center text-white shrink-0">
                                    <User size={18} strokeWidth={2.2} />
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
