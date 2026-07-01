// Variaciones del gradiente de marca (#291136 → #4A153D → #BE0F4A) con los mismos
// acentos por servicio que usa MisSolicitudes (SERVICIO_META) — todo dentro de paleta.
const SERVICIO_META_BY_SLUG = {
    arbitraje: {
        gradiente: 'from-[#1A0B22]/90 via-[#1A0B22]/30 to-transparent',
        acento:    '#BE0F4A',
        etiqueta:  'Resolución',
        imagen:    '/images/servicio-final/arbitraje.png',
    },
    jprd: {
        gradiente: 'from-[#1A0B22]/90 via-[#1A0B22]/30 to-transparent',
        acento:    '#BE0F4A',
        etiqueta:  'Prevención',
        imagen:    '/images/servicio-final/jprd.png',
    },
    otros: {
        gradiente: 'from-[#1A0B22]/90 via-[#1A0B22]/30 to-transparent',
        acento:    '#BE0F4A',
        etiqueta:  'Comunicación',
        imagen:    '/images/servicio-final/otros.png',
    },
};

const SERVICIO_META_BY_ID = {
    3: {
        gradiente: 'from-[#1A0B22]/90 via-[#1A0B22]/30 to-transparent',
        acento:    '#BC1D35',
        etiqueta:  'Urgente',
        imagen:    '/images/servicio-final/emergencia.png',
    },
};

const META_DEFAULT = {
    gradiente: 'from-[#1A0B22]/90 via-[#1A0B22]/30 to-transparent',
    acento:    '#BE0F4A',
    etiqueta:  'Trámite',
    imagen:    '/images/servicio-final/otros.png',
};

function getServicioMeta(s) {
    return SERVICIO_META_BY_ID[s.id] ?? SERVICIO_META_BY_SLUG[s.slug] ?? META_DEFAULT;
}

export default function ModalServicios({ servicios, onSeleccionar, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                {/* Premium Header */}
                <div className="relative px-8 py-8 overflow-hidden bg-white border-b border-gray-100">
                    {/* Decoraciones sutiles de fondo */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#291136]/[0.05] via-[#BE0F4A]/[0.03] to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-transparent" />
                    
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#BE0F4A] opacity-30"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#BE0F4A]"></span>
                                </span>
                                <p className="text-[11px] font-black text-[#BE0F4A] uppercase tracking-[0.2em]">
                                    Mesa de Partes Virtual
                                </p>
                            </div>
                            <h2 className="text-3xl font-black text-[#291136] tracking-tighter uppercase leading-none mb-2">
                                Iniciar Nuevo Trámite
                            </h2>
                            <p className="text-sm text-gray-500 font-medium max-w-lg">
                                Seleccione el servicio correspondiente para comenzar su proceso de manera digital y oficial.
                            </p>
                        </div>
                        
                        <button
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-400 hover:text-[#BE0F4A] hover:bg-white hover:border-[#BE0F4A]/30 hover:shadow-lg hover:shadow-[#BE0F4A]/10 transition-all duration-300 group z-10"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Grid de servicios */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-gray-50/40 to-white">
                    {servicios.map((s, idx) => {
                        const meta    = getServicioMeta(s);
                        const indice  = String(idx + 1).padStart(2, '0');

                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onSeleccionar(s.slug)}
                                className="group relative flex flex-col w-full p-0 text-left rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Cabecera: Imagen + gradiente + tipografía */}
                                <div className="relative h-44 overflow-hidden bg-black">
                                    <img 
                                        src={meta.imagen} 
                                        alt={s.nombre} 
                                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" 
                                    />
                                    <div className={`absolute inset-0 bg-gradient-to-t ${meta.gradiente} group-hover:opacity-80 transition-opacity duration-500`} />
                                    
                                    {/* Decoración blur */}
                                    <div className="absolute inset-0 opacity-25">
                                        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/40 blur-3xl" />
                                        <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-white/20 blur-2xl" />
                                    </div>



                                    {/* Etiqueta superior */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/95 text-[10px] font-bold uppercase tracking-[0.15em] border border-white/20 shadow-sm">
                                            {meta.etiqueta}
                                        </span>
                                    </div>

                                    {/* Nombre del servicio - tipografía protagonista */}
                                    <div className="absolute bottom-0 left-0 right-0 p-5 z-10 bg-gradient-to-t from-[#1A0B22]/90 via-[#1A0B22]/40 to-transparent flex flex-col justify-end">
                                        <div 
                                            className="w-10 h-[3px] rounded-full bg-white/90 mb-2 group-hover:w-20 transition-all duration-500 ease-out shadow-sm" 
                                            style={{ backgroundColor: meta.acento }}
                                        />
                                        <h3 className="text-[26px] sm:text-[30px] font-black text-white tracking-tighter leading-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] group-hover:scale-[1.02] origin-left transition-transform duration-300">
                                            {s.nombre}
                                        </h3>
                                    </div>
                                </div>

                                {/* Cuerpo */}
                                <div className="relative p-4 pt-3.5 z-20 bg-white">
                                    {s.descripcion ? (
                                        <p className="text-xs text-gray-500 leading-relaxed mb-3">
                                            {s.descripcion}
                                        </p>
                                    ) : (
                                        <div className="mb-3 h-8" />
                                    )}

                                    <div className="flex items-center justify-between">
                                        <span
                                            className="text-[11px] font-bold uppercase tracking-widest transition-colors"
                                            style={{ color: meta.acento }}
                                        >
                                            Iniciar solicitud
                                        </span>
                                        <span
                                            className="text-xs font-bold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                            style={{ color: meta.acento }}
                                            aria-hidden="true"
                                        >
                                            ───
                                        </span>
                                    </div>

                                    {/* Borde inferior animado */}
                                    <div
                                        className="absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-500"
                                        style={{ backgroundColor: meta.acento }}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
