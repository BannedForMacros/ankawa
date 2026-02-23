import Sidebar from '@/Components/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AuthenticatedLayout({ children }) {
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
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