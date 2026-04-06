import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import {
    Bell, Clock, CheckCircle, FileText, X, Paperclip, LogOut,
    PlusCircle, Scale, Building2, Send, Gavel, ArrowRight, AlertTriangle
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

function PlazoUrgente({ mov }) {
    if (!mov?.fecha_limite) return null;
    const dias = mov.dias_restantes;
    const sufijo = mov.tipo_dias === 'habiles' ? ' días hábiles' : ' días';

    let config;
    if (dias === null || dias === undefined) {
        config = { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', icon: Clock, msg: `Vence el ${mov.fecha_limite}` };
    } else if (dias <= 0) {
        config = { bg: 'bg-red-50 border-red-300', text: 'text-red-700', icon: AlertTriangle,
            msg: dias === 0 ? '⚠ Vence HOY' : `⚠ Venció hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}` };
    } else if (dias <= 2) {
        config = { bg: 'bg-orange-50 border-orange-300', text: 'text-orange-700', icon: AlertTriangle,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    } else if (dias <= 5) {
        config = { bg: 'bg-amber-50 border-amber-300', text: 'text-amber-700', icon: Clock,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    } else {
        config = { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: Clock,
            msg: `Quedan ${dias}${sufijo} — vence el ${mov.fecha_limite}` };
    }

    const Icono = config.icon;
    return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${config.bg} ${config.text} ${dias !== null && dias <= 2 ? 'animate-pulse' : ''}`}>
            <Icono size={12} className="shrink-0"/>
            {config.msg}
        </div>
    );
}

/* ─── Modal de respuesta ─── */
function ModalResponder({ mov, expediente, onClose, onRespondido }) {
    const [respuesta,     setRespuesta]     = useState('');
    const [archivos,      setArchivos]      = useState([]);
    const [confirm,       setConfirm]       = useState(false);
    const [procesando,    setProcesando]    = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [previewFile,   setPreviewFile]   = useState(null);
    const loaderTimer                       = useRef(null);
    const inputRef                          = useRef();

    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

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
                onClose();
                onRespondido();
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
            titulo="Confirmar envío de respuesta"
            resumen="Se registrará tu respuesta en el expediente y se generará un cargo de recepción que llegará a tu correo."
            detalles={[
                { label: 'Expediente', value: expediente },
                mov.tipo_documento_requerido && { label: 'Doc. requerido', value: mov.tipo_documento_requerido },
                archivos.length > 0 && { label: 'Archivos adjuntos', value: `${archivos.length} archivo(s)` },
            ].filter(Boolean)}
            variant="warning"
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
                    {mov.tipo_documento_requerido && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                            <p className="text-xs text-amber-800 font-semibold">
                                Documento solicitado: <span className="text-[#BE0F4A]">{mov.tipo_documento_requerido}</span>
                                <span className="block font-normal text-amber-700 mt-0.5">Asegúrate de adjuntarlo en tu respuesta.</span>
                            </p>
                        </div>
                    )}
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
                                <Paperclip size={15}/> Seleccionar archivos
                            </button>
                            <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                onChange={agregarArchivos} className="hidden"/>
                            {archivos.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {archivos.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                            <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                            <button type="button" onClick={() => setPreviewFile(f)}
                                                className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                                {f.name}
                                            </button>
                                            <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                            <button type="button" onClick={() => quitarArchivo(i)}
                                                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"><X size={16}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                    {previewFile && (() => {
                        const url = URL.createObjectURL(previewFile);
                        const ext2 = previewFile.name.split('.').pop().toLowerCase();
                        const esImagen = ['jpg','jpeg','png','gif','webp'].includes(ext2);
                        const esPdf   = ext2 === 'pdf';
                        return (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                                <div className="absolute inset-0 bg-black/60"/>
                                <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                                    onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} className="text-[#BE0F4A]"/>
                                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[400px]">{previewFile.name}</span>
                                        </div>
                                        <button type="button" onClick={closePreview} className="text-gray-400 hover:text-gray-700 transition-colors">
                                            <X size={20}/>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                                        {esImagen && <img src={url} alt={previewFile.name} className="max-w-full max-h-[70vh] rounded object-contain"/>}
                                        {esPdf && <iframe src={url} title={previewFile.name} className="w-full h-[70vh] rounded border-0"/>}
                                        {!esImagen && !esPdf && (
                                            <div className="text-center">
                                                <FileText size={48} className="mx-auto mb-3 text-gray-300"/>
                                                <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                                                <p className="text-sm mt-1 text-gray-400">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
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
export default function Dashboard({ expedientes, servicios, portalUser, portalEmail }) {
    const [modalMov,       setModalMov]       = useState(null);
    const [modalServicios, setModalServicios] = useState(false);

    function onRespondido() {
        // Recarga los datos del servidor para mostrar el siguiente movimiento pendiente
        router.reload({ only: ['expedientes'] });
    }

    function irASolicitud(slug) {
        setModalServicios(false);
        router.get(route('mesa-partes.solicitud', { slug }));
    }

    const pendientes = (expedientes ?? []).filter(e => e.tiene_pendiente).length;
    const totalMovPendientes = (expedientes ?? []).reduce((s, e) => s + (e.movimientos_pendientes?.length ?? 0), 0);

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
                {totalMovPendientes > 0 && (
                    <div className="bg-[#BE0F4A]/10 border border-[#BE0F4A]/20 rounded-2xl px-5 py-4 flex items-center gap-3">
                        <Bell size={20} className="text-[#BE0F4A] shrink-0" />
                        <p className="text-sm font-semibold text-[#291136]">
                            Tienes <span className="text-[#BE0F4A]">{totalMovPendientes} requerimiento{totalMovPendientes > 1 ? 's' : ''} pendiente{totalMovPendientes > 1 ? 's' : ''}</span> de respuesta.
                        </p>
                    </div>
                )}

                {/* Expedientes */}
                <div>
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Mis expedientes</h2>

                    {(expedientes ?? []).length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                            <FileText size={40} className="text-gray-200 mx-auto mb-4"/>
                            <p className="text-gray-500 font-medium">No tienes expedientes registrados.</p>
                            <p className="text-gray-400 text-sm mt-1">Cuando presentes una solicitud, aparecerá aquí.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(expedientes ?? []).map(exp => (
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

                                    {(exp.movimientos_pendientes ?? []).length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {(exp.movimientos_pendientes ?? []).map((mov, idx) => (
                                                <div key={mov.id} className="bg-[#291136]/5 rounded-xl p-4 space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            {(exp.movimientos_pendientes ?? []).length > 1 && (
                                                                <p className="text-[10px] font-bold text-[#BE0F4A] uppercase tracking-widest mb-0.5">
                                                                    Requerimiento {idx + 1} de {(exp.movimientos_pendientes ?? []).length}
                                                                </p>
                                                            )}
                                                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-1">Requerimiento pendiente</p>
                                                            <p className="text-sm text-[#291136] line-clamp-2">{mov.instruccion}</p>
                                                        </div>
                                                    </div>
                                                    <PlazoUrgente mov={mov} />
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => setModalMov({ mov, expediente: exp.numero_expediente })}
                                                            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#BE0F4A] text-white text-xs font-bold rounded-xl hover:bg-[#9c0a3b] transition-colors"
                                                        >
                                                            Responder →
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(exp.movimientos_pendientes ?? []).length === 0 && (
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
