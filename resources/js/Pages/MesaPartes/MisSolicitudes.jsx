import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    FileText, Clock, CheckCircle2, XCircle,
    AlertTriangle, FolderOpen, Upload, ChevronRight,
    Eye, Download, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Card de solicitud según estado ──
function CardSolicitud({ solicitud, onSubsanar }) {

    const estadoConfig = {
        pendiente: {
            icon:    <Clock size={20} className="text-yellow-500" />,
            bg:      'bg-yellow-50 border-yellow-200',
            titulo:  'En revisión',
            desc:    'Su solicitud está siendo revisada por la Secretaría General Adjunta.',
        },
        subsanacion: {
            icon:    <AlertTriangle size={20} className="text-orange-500" />,
            bg:      'bg-orange-50 border-orange-200',
            titulo:  'Acción requerida — Subsanación',
            desc:    'La Secretaría ha encontrado observaciones. Debe corregirlas en el plazo indicado.',
        },
        admitida: {
            icon:    <CheckCircle2 size={20} className="text-green-500" />,
            bg:      'bg-green-50 border-green-200',
            titulo:  'Admitida — Expediente generado',
            desc:    'Su solicitud fue admitida y ya tiene un expediente activo.',
        },
        rechazada: {
            icon:    <XCircle size={20} className="text-red-500" />,
            bg:      'bg-red-50 border-red-200',
            titulo:  'No admitida',
            desc:    'Su solicitud no fue admitida a trámite.',
        },
    };

    const config = estadoConfig[solicitud.estado] ?? estadoConfig.pendiente;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header card */}
            <div className={`px-6 py-4 border-b flex items-start gap-4 ${config.bg}`}>
                <div className="shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-[#291136] text-sm">
                            {solicitud.numero_cargo}
                        </span>
                        <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full border">
                            {solicitud.servicio}
                        </span>
                        <span className="text-xs text-gray-400">{solicitud.created_at}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{config.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{config.desc}</p>
                </div>

                {/* Link al expediente si ya fue admitida */}
                {solicitud.estado === 'admitida' && solicitud.expediente_id && (
                    <Link
                        href={route('expedientes.show', solicitud.expediente_id)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                            bg-green-600 text-white hover:bg-green-700 transition-colors">
                        <FolderOpen size={14} />
                        Ver expediente
                        <ChevronRight size={12} />
                    </Link>
                )}
            </div>

            {/* Contenido según estado */}
            <div className="p-6 space-y-4">

                {/* Info básica */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Demandado</div>
                        <div className="font-medium text-gray-800">{solicitud.nombre_demandado}</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Monto</div>
                        <div className="font-medium text-gray-800">
                            {solicitud.monto_involucrado
                                ? 'S/ ' + Number(solicitud.monto_involucrado).toLocaleString('es-PE')
                                : '—'}
                        </div>
                    </div>
                    {solicitud.numero_expediente && (
                        <div>
                            <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">N° Expediente</div>
                            <div className="font-mono font-bold text-[#291136]">{solicitud.numero_expediente}</div>
                        </div>
                    )}
                </div>

                {/* ── SUBSANACIÓN PENDIENTE ── */}
                {solicitud.estado === 'subsanacion' && solicitud.subsanacion_activa && (
                    <div className="space-y-4">
                        {/* Qué debe corregir */}
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                            <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <AlertTriangle size={12} />
                                Observación de Secretaría
                            </div>
                            <p className="text-sm text-orange-800 leading-relaxed">
                                {solicitud.subsanacion_activa.observacion}
                            </p>
                            <div className="flex items-center gap-2 mt-3 text-xs text-orange-600 font-semibold">
                                <Clock size={12} />
                                Plazo límite: {solicitud.subsanacion_activa.fecha_limite}
                                ({solicitud.subsanacion_activa.plazo_dias} días hábiles)
                            </div>
                        </div>

                        {/* Formulario de subsanación */}
                        <FormSubsanacion
                            solicitud={solicitud}
                            onSubmit={onSubsanar}
                        />
                    </div>
                )}

                {/* Documentos adjuntos */}
                {solicitud.documentos?.length > 0 && (
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-2 font-semibold">
                            Documentos adjuntos
                        </div>
                        <div className="space-y-1.5">
                            {solicitud.documentos.map(doc => (
                                <a key={doc.id}
                                    href={`/storage/${doc.ruta_archivo}`}
                                    target="_blank"
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group border border-gray-100">
                                    <FileText size={15} className="text-gray-400 group-hover:text-[#BE0F4A] shrink-0 transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-gray-700 truncate font-medium">{doc.nombre_original}</div>
                                        <div className="text-xs text-gray-400">{doc.tipo_documento} — {doc.created_at}</div>
                                    </div>
                                    <Download size={14} className="text-gray-300 group-hover:text-[#BE0F4A] shrink-0 transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Formulario de subsanación ──
function FormSubsanacion({ solicitud, onSubmit }) {
    const [respuesta, setRespuesta]       = useState('');
    const [archivos, setArchivos]         = useState([]);
    const [procesando, setProcesando]     = useState(false);
    const [dragOver, setDragOver]         = useState(false);

    const handleSubmit = () => {
        if (!respuesta.trim()) {
            toast.error('Debe escribir una respuesta.');
            return;
        }

        const formData = new FormData();
        formData.append('respuesta', respuesta);
        archivos.forEach((archivo, i) => {
            formData.append(`documentos[${i}]`, archivo);
        });

        setProcesando(true);
        router.post(route('mesa-partes.subsanar', solicitud.id), formData, {
            forceFormData: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                setRespuesta('');
                setArchivos([]);
            },
            onError: (errs) => toast.error(errs.general ?? errs.respuesta ?? 'Error al enviar.'),
            onFinish: () => setProcesando(false),
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const nuevos = Array.from(e.dataTransfer.files);
        setArchivos(prev => [...prev, ...nuevos]);
    };

    const removerArchivo = (index) => {
        setArchivos(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="border border-dashed border-[#BE0F4A]/30 rounded-xl p-5 space-y-4 bg-[#BE0F4A]/2">
            <div className="text-sm font-bold text-[#291136]">
                Su respuesta a la observación
            </div>

            {/* Textarea respuesta */}
            <textarea rows={4}
                placeholder="Explique cómo ha corregido las observaciones indicadas..."
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                    focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />

            {/* Upload documentos */}
            <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer
                    ${dragOver
                        ? 'border-[#BE0F4A] bg-[#BE0F4A]/5'
                        : 'border-gray-200 hover:border-[#BE0F4A]/40'}`}
                onClick={() => document.getElementById(`upload-${solicitud.id}`).click()}>
                <input
                    id={`upload-${solicitud.id}`}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={e => setArchivos(prev => [...prev, ...Array.from(e.target.files)])}
                />
                <Upload size={20} className="mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-500">
                    Arrastra documentos aquí o <span className="text-[#BE0F4A] font-semibold">haz clic para seleccionar</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, Word, imágenes — máx. 10MB por archivo</p>
            </div>

            {/* Archivos seleccionados */}
            {archivos.length > 0 && (
                <div className="space-y-1.5">
                    {archivos.map((archivo, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                            <FileText size={14} className="text-[#BE0F4A] shrink-0" />
                            <span className="text-xs text-gray-700 flex-1 truncate">{archivo.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">
                                {(archivo.size / 1024 / 1024).toFixed(1)}MB
                            </span>
                            <button onClick={() => removerArchivo(i)}
                                className="text-gray-400 hover:text-red-500 transition-colors shrink-0 text-lg leading-none">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Botón enviar */}
            <button
                onClick={handleSubmit}
                disabled={procesando || !respuesta.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                    bg-[#BE0F4A] text-white hover:bg-[#BC1D35] disabled:opacity-50 transition-colors">
                {procesando ? 'Enviando...' : 'Enviar subsanación'}
                {!procesando && <ArrowRight size={16} />}
            </button>
        </div>
    );
}

export default function MisSolicitudes({ solicitudes }) {

    const sinSolicitudes = solicitudes.length === 0;

    // Separar por prioridad: subsanaciones primero, luego pendientes, luego admitidas, luego rechazadas
    const ordenadas = [...solicitudes].sort((a, b) => {
        const prioridad = { subsanacion: 0, pendiente: 1, admitida: 2, rechazada: 3 };
        return (prioridad[a.estado] ?? 4) - (prioridad[b.estado] ?? 4);
    });

    return (
        <AuthenticatedLayout>
            <Head title="Mis Solicitudes" />

            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#291136]"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Mis Solicitudes
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm">
                                Seguimiento de sus solicitudes de arbitraje
                            </p>
                        </div>
                        <a href="/mesa-partes"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-colors">
                            Nueva solicitud
                            <ChevronRight size={15} />
                        </a>
                    </div>

                    {/* Lista */}
                    {sinSolicitudes ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center text-gray-400">
                            <FileText size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-600">Aún no tiene solicitudes registradas</p>
                            <p className="text-sm mt-1 mb-6">Presente su primera solicitud desde la Mesa de Partes Virtual.</p>
                            <a href="/mesa-partes"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                                    bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-colors">
                                Ir a Mesa de Partes
                                <ArrowRight size={15} />
                            </a>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {ordenadas.map(s => (
                                <CardSolicitud
                                    key={s.id}
                                    solicitud={s}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
