// Variaciones del gradiente de marca (#291136 → #4A153D → #BE0F4A) con los mismos
// acentos por servicio que usa MisSolicitudes (SERVICIO_META) — todo dentro de paleta.
const SERVICIO_META_BY_SLUG = {
    arbitraje: {
        gradiente: 'from-black/80 via-[#291136]/70 to-[#BE0F4A]/40',
        acento:    '#BE0F4A',
        etiqueta:  'Resolución',
        imagen:    '/images/servicio-final/arbitraje.png',
    },
    jprd: {
        gradiente: 'from-black/80 via-[#3D1A52]/70 to-[#4A153D]/40',
        acento:    '#291136',
        etiqueta:  'Prevención',
        imagen:    '/images/servicio-final/jprd.png',
    },
    otros: {
        gradiente: 'from-black/80 via-[#4A153D]/70 to-[#9C0A3B]/40',
        acento:    '#4A153D',
        etiqueta:  'Comunicación',
        imagen:    '/images/servicio-final/otros.png',
    },
};

const SERVICIO_META_BY_ID = {
    3: {
        gradiente: 'from-black/80 via-[#9C0A3B]/70 to-[#BC1D35]/40',
        acento:    '#BC1D35',
        etiqueta:  'Urgente',
        imagen:    '/images/servicio-final/emergencia.png',
    },
};

const META_DEFAULT = {
    gradiente: 'from-black/80 via-[#291136]/70 to-[#BE0F4A]/40',
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
                {/* Header */}
                <div className="relative px-6 py-5 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-4">
                        <div className="border-l-4 border-[#BE0F4A] pl-4">
                            <p className="text-[10px] font-bold text-[#BE0F4A] uppercase tracking-[0.2em] mb-1">
                                Mesa de Partes
                            </p>
                            <h2 className="text-xl font-black text-[#291136] tracking-tight leading-none">
                                Nuevo trámite
                            </h2>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Seleccione el tipo de trámite que desea presentar
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            aria-label="Cerrar"
                            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-[#291136] text-2xl leading-none font-light transition-colors"
                        >
                            ×
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
                                    <div className="absolute bottom-4 left-4 right-4 z-10">
                                        <div className="w-8 h-0.5 bg-white/80 mb-2 group-hover:w-12 group-hover:bg-white transition-all duration-300" />
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-md">
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
