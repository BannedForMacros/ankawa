import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AnkawaModal({ open, onClose, title, children, size = 'md' }) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    // Montar antes de animar entrada; desanimar antes de desmontar
    useEffect(() => {
        if (open) {
            setMounted(true);
            const t = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
            return () => cancelAnimationFrame(t);
        } else {
            setVisible(false);
            const t = setTimeout(() => setMounted(false), 200);
            return () => clearTimeout(t);
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!mounted) return null;

    const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative w-full ${widths[size]} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]
                transition-all duration-200 ease-out
                ${visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-3'}`}
            >
                {/* Header Ankawa */}
                <div
                    className="px-6 py-4 flex items-center justify-between shrink-0"
                    style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
                >
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <X size={16} />
                    </button>
                </div>
                <div
                    className="h-[2px] shrink-0"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }}
                />

                {/* Cuerpo */}
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
