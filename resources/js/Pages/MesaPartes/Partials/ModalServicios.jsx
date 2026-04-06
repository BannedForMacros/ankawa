import { X, FileText, Scale, Building2, Send, Gavel, ArrowRight } from 'lucide-react';

const SERVICIO_META_BY_SLUG = {
    arbitraje: {
        imagen:    '/images/servicios/arbitraje.webp',
        icono:     Scale,
        gradiente: 'from-[#291136] via-[#4A153D] to-[#BE0F4A]',
        fitMode:   'cover',
    },
    jprd: {
        imagen:    '/images/servicios/jprd.webp',
        icono:     Building2,
        gradiente: 'from-[#1e3a5f] via-[#1d4ed8] to-[#3b82f6]',
        fitMode:   'cover',
    },
    otros: {
        imagen:    '/images/servicios/otros.webp',
        icono:     Send,
        gradiente: 'from-[#1f2937] via-[#374151] to-[#6b7280]',
        fitMode:   'cover',
    },
};

const SERVICIO_META_BY_ID = {
    3: {
        imagen:    '/images/servicios/emergencia.webp',
        icono:     Gavel,
        gradiente: 'from-[#7c1d1d] via-[#b91c1c] to-[#ef4444]',
        fitMode:   'cover',
    },
};

const META_DEFAULT = {
    imagen:    null,
    icono:     FileText,
    gradiente: 'from-[#291136] via-[#4A153D] to-[#BE0F4A]',
    fitMode:   'cover',
};

function getServicioMeta(s) {
    return SERVICIO_META_BY_ID[s.id] ?? SERVICIO_META_BY_SLUG[s.slug] ?? META_DEFAULT;
}

export default function ModalServicios({ servicios, onSeleccionar, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-black text-[#291136]">Nueva solicitud</h2>
                        <p className="text-sm text-gray-400 mt-0.5">Selecciona el tipo de trámite que deseas presentar</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <X size={18}/>
                    </button>
                </div>

                {/* Grid de servicios */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                    {servicios.map(s => {
                        const meta  = getServicioMeta(s);
                        const Icono = meta.icono;

                        return (
                            <button key={s.id} type="button" onClick={() => onSeleccionar(s.slug)}
                                className="group text-left rounded-2xl overflow-hidden border border-gray-200 hover:border-[#BE0F4A]/50 hover:shadow-lg transition-all duration-200">

                                {/* Cabecera: imagen o gradiente */}
                                <div className={`relative h-72 bg-gradient-to-br ${meta.gradiente} overflow-hidden`}>
                                    {meta.imagen && (
                                        <img
                                            src={meta.imagen}
                                            alt={s.nombre}
                                            className="absolute inset-0 w-full h-full object-cover object-center"
                                            onError={e => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                                    <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                                        <Icono size={16} className="text-white"/>
                                    </div>
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <ArrowRight size={16} className="text-white drop-shadow"/>
                                    </div>
                                </div>

                                {/* Cuerpo */}
                                <div className="p-4">
                                    <h3 className="font-bold text-[#291136] text-sm mb-1 group-hover:text-[#BE0F4A] transition-colors">
                                        {s.nombre}
                                    </h3>
                                    {s.descripcion && (
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                            {s.descripcion}
                                        </p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
