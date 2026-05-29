import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Navbar from '@/Components/Navbar';
import Sidebar from '@/Components/Sidebar';
import { Toaster } from 'react-hot-toast';

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
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#fff',
                        color: '#291136',
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '14px',
                        padding: '12px 16px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#BE0F4A',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#dc2626',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </div>
    );
}