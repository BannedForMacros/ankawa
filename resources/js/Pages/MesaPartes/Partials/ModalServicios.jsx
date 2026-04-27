const SERVICIO_META_BY_SLUG = {
    arbitraje: {
        gradiente: 'from-[#291136] via-[#4A153D] to-[#BE0F4A]',
        acento:    '#BE0F4A',
        etiqueta:  'Resolución',
    },
    jprd: {
        gradiente: 'from-[#1e3a5f] via-[#1d4ed8] to-[#3b82f6]',
        acento:    '#3b82f6',
        etiqueta:  'Prevención',
    },
    otros: {
        gradiente: 'from-[#1f2937] via-[#374151] to-[#6b7280]',
        acento:    '#6b7280',
        etiqueta:  'Comunicación',
    },
};

const SERVICIO_META_BY_ID = {
    3: {
        gradiente: 'from-[#7c1d1d] via-[#b91c1c] to-[#ef4444]',
        acento:    '#ef4444',
        etiqueta:  'Urgente',
    },
};

const META_DEFAULT = {
    gradiente: 'from-[#291136] via-[#4A153D] to-[#BE0F4A]',
    acento:    '#BE0F4A',
    etiqueta:  'Trámite',
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
                                Nueva solicitud
                            </h2>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Selecciona el tipo de trámite que deseas presentar
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
                                className="group relative text-left rounded-2xl overflow-hidden border border-gray-200 bg-white hover:border-transparent hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Cabecera: gradiente + tipografía */}
                                <div className={`relative h-44 bg-gradient-to-br ${meta.gradiente} overflow-hidden`}>
                                    {/* Decoración blur */}
                                    <div className="absolute inset-0 opacity-25">
                                        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/40 blur-3xl" />
                                        <div className="absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-white/20 blur-2xl" />
                                    </div>

                                    {/* Patrón diagonal sutil */}
                                    <div
                                        className="absolute inset-0 opacity-[0.06]"
                                        style={{
                                            backgroundImage: 'repeating-linear-gradient(135deg, white 0, white 1px, transparent 1px, transparent 16px)',
                                        }}
                                    />

                                    {/* Número display gigante - decorativo */}
                                    <span
                                        className="absolute -bottom-6 -right-2 text-[180px] font-black leading-none text-white/10 select-none tracking-tighter group-hover:text-white/15 group-hover:-translate-y-1 transition-all duration-500"
                                        aria-hidden="true"
                                    >
                                        {indice}
                                    </span>

                                    {/* Etiqueta superior */}
                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/95 text-[10px] font-bold uppercase tracking-[0.15em] border border-white/20">
                                            {meta.etiqueta}
                                        </span>
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">
                                            {indice}
                                        </span>
                                    </div>

                                    {/* Nombre del servicio - tipografía protagonista */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="w-8 h-0.5 bg-white/60 mb-2 group-hover:w-12 transition-all duration-300" />
                                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                                            {s.nombre}
                                        </h3>
                                    </div>
                                </div>

                                {/* Cuerpo */}
                                <div className="relative p-4 pt-3.5">
                                    {s.descripcion ? (
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
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
                                            Iniciar trámite
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
