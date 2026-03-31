import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-center h-20">
                        <Link href="/" className="flex items-center gap-4">
                            <img src="/logo.png" alt="CARD Ankawa" className="h-14 w-auto" />
                            <div className="hidden sm:block border-l border-gray-200 pl-4">
                                <p className="text-xs font-bold text-[#291136] uppercase tracking-widest leading-tight">
                                    Centro de Arbitraje y
                                </p>
                                <p className="text-xs font-bold text-[#291136] uppercase tracking-widest leading-tight">
                                    Resolución de Disputas
                                </p>
                                <p className="text-xs font-semibold text-[#BE0F4A] uppercase tracking-wider mt-0.5">
                                    Ankawa Internacional
                                </p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link href="/"
                                className="text-gray-500 hover:text-[#291136] text-sm font-medium transition-colors hidden md:block">
                                Inicio
                            </Link>
                            <Link href="/mesa-partes"
                                className="text-gray-500 hover:text-[#291136] text-sm font-medium transition-colors hidden md:block">
                                Mesa de Partes
                            </Link>
                            <Link href="/login"
                                className="bg-[#BE0F4A] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#BC1D35] transition-colors shadow-sm shadow-[#BE0F4A]/20">
                                Iniciar Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">{children}</main>

            <footer className="bg-[#291136] text-white">
                <div className="max-w-7xl mx-auto px-6 py-8 text-center">
                    <img src="/logo-white.png" alt="CARD Ankawa" className="h-10 w-auto mx-auto mb-4 opacity-70" />
                    <p className="text-sm text-white/50">
                        © {new Date().getFullYear()} The Ankawa Global Group SAC — CARD ANKAWA INTL. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
