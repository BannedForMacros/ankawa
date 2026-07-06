import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import Sidebar from '@/Components/Sidebar';
import AnkawaToaster from '@/Components/AnkawaToaster';

export default function AuthenticatedLayout({ children }) {
    // Abierto por defecto en escritorio, cerrado en móvil
    const [sidebarOpen, setSidebarOpen] = useState(
        () => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
    );

    // Al navegar a cualquier ruta, el sidebar se colapsa
    useEffect(() => {
        const off = router.on('navigate', () => setSidebarOpen(false));
        return () => { if (typeof off === 'function') off(); };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)} />
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main
                    className="flex-1 overflow-y-auto"
                    style={{
                        backgroundColor: '#f5f3f6',
                        backgroundImage: 'url(/images/backgrounds/aguila-bg.png)',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed',
                        backgroundSize: 'auto 40vh',
                        backgroundPosition: 'center 66%',
                    }}
                >
                    {children}
                </main>
            </div>
            <AnkawaToaster position="top-right" />
        </div>
    );
}