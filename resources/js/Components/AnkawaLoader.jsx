export default function AnkawaLoader({ visible }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#291136]/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-28 h-28 flex items-center justify-center">
                    <img src="/logo-white.png" alt="Ankawa" className="w-20 h-20 object-contain" />
                    {/* Punto orbitando */}
                    <div
                        className="absolute inset-0"
                        style={{ animation: 'spin 1.4s linear infinite' }}
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#BE0F4A] shadow-lg shadow-[#BE0F4A]/50" />
                    </div>
                </div>
                <p className="text-white/60 text-sm font-medium tracking-wide animate-pulse" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Procesando solicitud...
                </p>
            </div>
        </div>
    );
}
