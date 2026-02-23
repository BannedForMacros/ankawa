import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight, LogOut, Menu } from 'lucide-react';

function SidebarItem({ item, collapsed }) {
    const { url } = usePage();
    const algunoActivo = item.hijos.some(h => url.startsWith(h.ruta));
    const [abierto, setAbierto] = useState(algunoActivo);

    const IconoPadre = Icons[item.icono] ?? Icons.Folder;

    return (
        <div>
            <button
                onClick={() => setAbierto(!abierto)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${algunoActivo
                        ? 'text-[#BE0F4A] bg-[#BE0F4A]/10'
                        : 'text-[#291136] hover:bg-[#291136]/5 hover:text-[#BE0F4A]'
                    }`}
            >
                <IconoPadre size={18} className="shrink-0" />
                {!collapsed && (
                    <>
                        <span className="flex-1 text-left">{item.nombre}</span>
                        {abierto
                            ? <ChevronDown size={14} className="shrink-0 opacity-60" />
                            : <ChevronRight size={14} className="shrink-0 opacity-60" />
                        }
                    </>
                )}
            </button>

            {abierto && !collapsed && (
                <div className="mt-1 ml-4 pl-3 border-l-2 border-[#BE0F4A]/30 space-y-0.5">
                    {item.hijos.map(hijo => {
                        const IconoHijo = Icons[hijo.icono] ?? Icons.File;
                        const activo = url.startsWith(hijo.ruta);

                        return (
                            <Link
                                key={hijo.slug}
                                href={hijo.ruta}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                                    ${activo
                                        ? 'bg-[#BE0F4A] text-white font-semibold shadow-sm'
                                        : 'text-[#291136]/70 hover:bg-[#291136]/5 hover:text-[#BE0F4A]'
                                    }`}
                            >
                                <IconoHijo size={15} className="shrink-0" />
                                <span>{hijo.nombre}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const { auth } = usePage().props;
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => router.post(route('logout'));

    return (
        <aside className={`flex flex-col h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>

            {/* ── LOGO ── */}
            <div className={`flex items-center border-b border-gray-100 ${collapsed ? 'justify-center px-3 py-4' : 'px-5 py-4'}`}>
                {!collapsed && (
                    <img
                        src="/logo.png"
                        alt="Ankawa Internacional"
                        className="h-14 w-auto object-contain"
                    />
                )}
                {collapsed && (
                    <img
                        src="/logo.png"
                        alt="Ankawa"
                        className="h-8 w-8 object-contain"
                    />
                )}
                {!collapsed && (
                    <button
                        onClick={() => setCollapsed(true)}
                        className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#291136] transition-colors"
                    >
                        <Menu size={16} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={() => setCollapsed(false)}
                    className="mx-auto mt-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#291136] transition-colors"
                >
                    <Menu size={16} />
                </button>
            )}

            {/* ── MENÚ ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {auth.menu.map(item => (
                    <SidebarItem key={item.slug} item={item} collapsed={collapsed} />
                ))}
            </nav>

            {/* ── FOOTER ── */}
            <div className="border-t border-gray-100 px-3 py-4">
                {!collapsed && (
                    <div className="flex items-center gap-3 px-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 bg-[#291136]">
                            {auth.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#291136] truncate">
                                {auth.user.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {auth.user.email}
                            </p>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
                >
                    <LogOut size={17} className="shrink-0" />
                    {!collapsed && <span>Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}