import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center">
                                <span className="text-2xl font-bold text-[#BE0F4A]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    Ankawa Internacional
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/mesa-partes"
                                className="text-gray-700 hover:text-[#BE0F4A] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Mesa de Partes
                            </Link>
                            <Link
                                href="/login"
                                className="text-gray-700 hover:text-[#BE0F4A] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                href="/register"
                                className="bg-[#BE0F4A] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#BC1D35] transition-colors"
                            >
                                Registrarse
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-[#291136] text-white mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <p className="text-sm text-white/80">
                            © 2026 Centro de Arbitraje Ankawa Internacional. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}