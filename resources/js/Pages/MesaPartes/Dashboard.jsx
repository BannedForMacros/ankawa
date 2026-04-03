import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import {
    Bell, Clock, CheckCircle, FileText, X, Paperclip, LogOut,
    PlusCircle, Scale, Building2, Send, Gavel, ArrowRight
} from 'lucide-react';
import AnkawaLoader from '@/Components/AnkawaLoader';
import ConfirmModal from '@/Components/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

/* ─── Metadatos hardcodeados por slug (y overrides por id) ─── */
// fitMode: 'cover' para fotos que llenan el borde | 'contain' para ilustraciones/logos con márgenes
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

// Override por id para servicios con mismo slug pero distinta imagen
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

/* ─── Modal selector de servicio ─── */
function ModalServicios({ servicios, onSeleccionar, onClose }) {
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
                                    {/* Overlay sutil solo en la base */}
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
                                    {/* Ícono esquina superior izquierda */}
                                    <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/20 flex items-center justify-center">
                                        <Icono size={16} className="text-white"/>
                                    </div>
                                    {/* Flecha en hover */}
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

const BADGE_ESTADO = {
    activo:     'bg-emerald-100 text-emerald-700',
    suspendido: 'bg-amber-100 text-amber-700',
    concluido:  'bg-gray-100 text-gray-600',
};

/* ─── Modal de respuesta ─── */
function ModalResponder({ mov, expediente, onClose, onRespondido }) {
    const [respuesta,     setRespuesta]     = useState('');
    const [archivos,      setArchivos]      = useState([]);
    const [confirm,       setConfirm]       = useState(false);
    const [procesando,    setProcesando]    = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const loaderTimer                       = useRef(null);
    const inputRef                          = useRef();

    function agregarArchivos(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
        setArchivos(prev => [...prev, ...nuevos]);
        e.target.value = '';
    }

    function quitarArchivo(i) {
        setArchivos(prev => prev.filter((_, idx) => idx !== i));
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!respuesta.trim()) {
            toast.error('Ingresa tu respuesta antes de continuar.');
            return;
        }
        setConfirm(true);
    }

    async function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('respuesta', respuesta);
        archivos.forEach(f => fd.append('documentos[]', f));

        try {
            const res = await fetch(route('mesa-partes.responder', { movimiento: mov.id }), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
                body: fd,
            });
            const data = await res.json();
            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);
            if (data.ok) {
                toast.success('Respuesta enviada correctamente. Recibirás un cargo en tu correo.');
                onRespondido(mov.id);
                onClose();
            } else {
                toast.error(data.mensaje ?? 'Error al enviar la respuesta.');
            }
        } catch {
            clearTimeout(loaderTimer.current);
            setMostrarLoader(false);
            setProcesando(false);
            toast.error('Error de conexión. Intente nuevamente.');
        }
    }

    const ICONOS_EXT = { pdf: '📄', doc: '📝', docx: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' };
    const ext = n => n.split('.').pop().toLowerCase();

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar respuesta"
            resumen={`Enviarás tu respuesta al expediente ${expediente}. Se generará un cargo de recepción y se enviará a tu correo.`}
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <p className="text-white/60 text-xs">Expediente {expediente}</p>
                        <h2 className="text-white font-bold">Responder Requerimiento</h2>
                    </div>
                    <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                    <div className="bg-[#291136]/5 border border-[#291136]/10 rounded-xl p-4 mb-5">
                        <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-1">Instrucción</p>
                        <p className="text-sm text-[#291136]">{mov.instruccion}</p>
                        {mov.fecha_limite && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Clock size={11}/> Plazo límite: {mov.fecha_limite}
                            </p>
                        )}
                    </div>
                    <form id="form-respuesta" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Tu respuesta *
                            </label>
                            <textarea value={respuesta} onChange={e => setRespuesta(e.target.value)}
                                rows={5} placeholder="Escribe tu respuesta detallada aquí..."
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                Documentos adjuntos (opcional)
                            </label>
                            <button type="button" onClick={() => inputRef.current?.click()}
                                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                                <Paperclip size={14}/> Seleccionar archivos
                            </button>
                            <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={agregarArchivos} className="hidden"/>
                            {archivos.length > 0 && (
                                <ul className="mt-2 space-y-1.5">
                                    {archivos.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
                                            <span>{ICONOS_EXT[ext(f.name)] ?? '📎'}</span>
                                            <span className="truncate flex-1 font-medium">{f.name}</span>
                                            <span className="text-gray-400">{(f.size/1024/1024).toFixed(2)} MB</span>
                                            <button type="button" onClick={() => quitarArchivo(i)}
                                                className="text-gray-300 hover:text-red-500"><X size={12}/></button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </form>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button type="submit" form="form-respuesta" disabled={procesando}
                        className="px-6 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors">
                        {procesando ? 'Enviando...' : 'Enviar respuesta'}
                    </button>
                </div>
            </div>
        </div>
        </>
    );
}

/* ─── Página principal ─── */
export default function Dashboard({ expedientes: expedientesIniciales, servicios, portalUser, portalEmail }) {
    const [expedientes,      setExpedientes]      = useState(expedientesIniciales);
    const [modalMov,         setModalMov]         = useState(null);
    const [modalServicios,   setModalServicios]   = useState(false);

    function onRespondido(movId) {
        setExpedientes(prev => prev.map(exp => {
            if (exp.movimiento_pendiente?.id === movId) {
                return { ...exp, tiene_pendiente: false, movimiento_pendiente: null };
            }
            return exp;
        }));
    }

    function irASolicitud(slug) {
        setModalServicios(false);
        router.get(route('mesa-partes.solicitud', { slug }));
    }

    const pendientes = expedientes.filter(e => e.tiene_pendiente).length;

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Head title="Mesa de Partes — Ankawa" />
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Ankawa" className="h-8 object-contain" />
                        <div>
                            <h1 className="text-sm font-black text-[#291136]">Mesa de Partes</h1>
                            <p className="text-xs text-gray-400">{portalEmail}</p>
                        </div>
                    </div>
                    <a href={route('mesa-partes.logout')}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors">
                        <LogOut size={14}/> Salir
                    </a>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                {/* Nueva solicitud */}
                <div>
                    <button
                        onClick={() => setModalServicios(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] transition-colors shadow-sm"
                    >
                        <PlusCircle size={16}/> Nueva solicitud
                    </button>
                </div>

                {/* Alerta pendientes */}
                {pendientes > 0 && (
                    <div className="bg-[#BE0F4A]/10 border border-[#BE0F4A]/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                        <Bell size={20} className="text-[#BE0F4A] shrink-0" />
                        <p className="text-sm font-semibold text-[#291136]">
                            Tienes <span className="text-[#BE0F4A]">{pendientes} expediente{pendientes > 1 ? 's' : ''}</span> con acción pendiente.
                        </p>
                    </div>
                )}

                {/* Expedientes */}
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mis expedientes</h2>

                    {expedientes.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <FileText size={40} className="text-gray-200 mx-auto mb-4"/>
                            <p className="text-gray-500 font-medium">No tienes expedientes registrados.</p>
                            <p className="text-gray-400 text-sm mt-1">Cuando presentes una solicitud, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {expedientes.map(exp => (
                                <div key={exp.id}
                                    className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
                                        exp.tiene_pendiente
                                            ? 'border-[#BE0F4A]/30 border-l-4 border-l-[#BE0F4A]'
                                            : 'border-gray-100 border-l-4 border-l-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-[#291136] text-lg">{exp.numero_expediente}</span>
                                                {exp.tiene_pendiente && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-[#BE0F4A] bg-[#BE0F4A]/10 px-2 py-0.5 rounded-full">
                                                        <Bell size={10} className="animate-pulse"/> Acción requerida
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">{exp.servicio}</p>
                                            {exp.etapa_actual && (
                                                <p className="text-xs text-gray-400 mt-0.5">Etapa: {exp.etapa_actual}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE_ESTADO[exp.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                                            {exp.estado}
                                        </span>
                                    </div>

                                    {exp.movimiento_pendiente && (
                                        <div className="mt-4 bg-[#291136]/5 rounded-xl p-4">
                                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-1">Requerimiento pendiente</p>
                                            <p className="text-sm text-[#291136] line-clamp-2">{exp.movimiento_pendiente.instruccion}</p>
                                            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                                {exp.movimiento_pendiente.fecha_limite && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock size={11}/> Plazo: {exp.movimiento_pendiente.fecha_limite}
                                                    </p>
                                                )}
                                                <button
                                                    onClick={() => setModalMov({ mov: exp.movimiento_pendiente, expediente: exp.numero_expediente })}
                                                    className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-[#BE0F4A] text-white text-xs font-bold rounded-xl hover:bg-[#9c0a3b] transition-colors"
                                                >
                                                    Responder →
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!exp.tiene_pendiente && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                                            <CheckCircle size={13}/> Sin acciones pendientes
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {modalServicios && (
                <ModalServicios
                    servicios={servicios}
                    onSeleccionar={irASolicitud}
                    onClose={() => setModalServicios(false)}
                />
            )}

            {modalMov && (
                <ModalResponder
                    mov={modalMov.mov}
                    expediente={modalMov.expediente}
                    onClose={() => setModalMov(null)}
                    onRespondido={onRespondido}
                />
            )}
        </div>
    );
}
