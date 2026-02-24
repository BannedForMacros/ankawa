import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    FileText, Clock, CheckCircle2, XCircle,
    AlertTriangle, FolderOpen, Upload, ChevronRight,
    Download, ArrowRight, User, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Formulario edición + subsanación ──
function FormSubsanacion({ solicitud }) {
    const [tab, setTab]           = useState('datos');
    const [procesando, setProcesando] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [archivosNuevos, setArchivosNuevos] = useState([]);
    const [eliminar, setEliminar] = useState([]);

    const [form, setForm] = useState({
        domicilio_demandante:  solicitud.domicilio_demandante ?? '',
        nombre_demandado:      solicitud.nombre_demandado ?? '',
        documento_demandado:   solicitud.documento_demandado ?? '',
        email_demandado:       solicitud.email_demandado ?? '',
        telefono_demandado:    solicitud.telefono_demandado ?? '',
        domicilio_demandado:   solicitud.domicilio_demandado ?? '',
        resumen_controversia:  solicitud.resumen_controversia ?? '',
        pretensiones:          solicitud.pretensiones ?? '',
        monto_involucrado:     solicitud.monto_involucrado ?? '',
    });

    const campo = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const toggleEliminar = (id) => {
        setEliminar(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined) formData.append(k, v);
        });
        archivosNuevos.forEach((archivo, i) => {
            formData.append(`documentos_nuevos[${i}]`, archivo);
        });
        eliminar.forEach((id, i) => {
            formData.append(`documentos_eliminar[${i}]`, id);
        });

        setProcesando(true);
        router.post(route('mesa-partes.actualizar-solicitud', solicitud.id), formData, {
            forceFormData: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                setArchivosNuevos([]);
                setEliminar([]);
            },
            onError: (errs) => toast.error(errs.general ?? 'Error al guardar.'),
            onFinish: () => setProcesando(false),
        });
    };

    return (
        <div className="border border-[#BE0F4A]/20 rounded-xl overflow-hidden bg-white">

            {/* Tabs */}
            <div className="flex border-b border-gray-100 bg-gray-50/80">
                {[
                    { key: 'datos',      label: 'Corregir datos',   icon: <Edit3 size={13} />    },
                    { key: 'documentos', label: 'Documentos',        icon: <FileText size={13} /> },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-all
                            ${tab === t.key
                                ? 'border-b-2 border-[#BE0F4A] text-[#BE0F4A] bg-white'
                                : 'text-gray-400 hover:text-gray-600'}`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            <div className="p-5 space-y-4">

                {/* ── Tab Datos ── */}
                {tab === 'datos' && (
                    <div className="space-y-5">

                        {/* Demandante — solo domicilio */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-[#291136] text-white text-xs font-bold flex items-center justify-center shrink-0">D</span>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Demandante</span>
                                <span className="text-xs text-gray-400">(solo domicilio editable)</span>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Domicilio procesal</label>
                                <input type="text"
                                    value={form.domicilio_demandante}
                                    onChange={e => campo('domicilio_demandante', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                        focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Demandado */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-[#BE0F4A] text-white text-xs font-bold flex items-center justify-center shrink-0">D</span>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Demandado</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { key: 'nombre_demandado',    label: 'Nombre completo',    type: 'text'  },
                                    { key: 'documento_demandado', label: 'N° Documento',        type: 'text'  },
                                    { key: 'email_demandado',     label: 'Correo electrónico',  type: 'email' },
                                    { key: 'telefono_demandado',  label: 'Teléfono',            type: 'text'  },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                                        <input type={f.type}
                                            value={form[f.key]}
                                            onChange={e => campo(f.key, e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                                    </div>
                                ))}
                                <div className="md:col-span-2">
                                    <label className="block text-xs text-gray-500 mb-1">Domicilio</label>
                                    <input type="text"
                                        value={form.domicilio_demandado}
                                        onChange={e => campo('domicilio_demandado', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        {/* Controversia */}
                        <div>
                            <div className="text-xs font-bold text-[#291136] uppercase tracking-wide mb-3">
                                Controversia y Pretensiones
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Resumen de la controversia</label>
                                    <textarea rows={3}
                                        value={form.resumen_controversia}
                                        onChange={e => campo('resumen_controversia', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Pretensiones</label>
                                    <textarea rows={3}
                                        value={form.pretensiones}
                                        onChange={e => campo('pretensiones', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Monto involucrado (S/)</label>
                                    <input type="number" min={0}
                                        value={form.monto_involucrado}
                                        onChange={e => campo('monto_involucrado', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                                            focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab Documentos ── */}
                {tab === 'documentos' && (
                    <div className="space-y-4">

                        {/* Documentos existentes */}
                        {solicitud.documentos?.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                    Documentos actuales
                                </div>
                                <div className="space-y-1.5">
                                    {solicitud.documentos.map(doc => (
                                        <div key={doc.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                                                ${eliminar.includes(doc.id)
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-gray-50 border-gray-100'}`}>
                                            <FileText size={14} className="text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-700 truncate">{doc.nombre_original}</div>
                                                <div className="text-xs text-gray-400">{doc.created_at}</div>
                                            </div>
                                            <button onClick={() => toggleEliminar(doc.id)}
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors
                                                    ${eliminar.includes(doc.id)
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        : 'bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}>
                                                {eliminar.includes(doc.id) ? 'Deshacer' : 'Eliminar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upload nuevos */}
                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Agregar documentos nuevos
                            </div>
                            <div
                                onDrop={e => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    setArchivosNuevos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                }}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => document.getElementById(`upload-edit-${solicitud.id}`).click()}
                                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                                    ${dragOver ? 'border-[#BE0F4A] bg-[#BE0F4A]/5' : 'border-gray-200 hover:border-[#BE0F4A]/40'}`}>
                                <input
                                    id={`upload-edit-${solicitud.id}`}
                                    type="file" multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    className="hidden"
                                    onChange={e => setArchivosNuevos(prev => [...prev, ...Array.from(e.target.files)])}
                                />
                                <Upload size={18} className="mx-auto mb-2 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                    Arrastra o <span className="text-[#BE0F4A] font-semibold">selecciona archivos</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">PDF, Word, imágenes — máx. 10MB</p>
                            </div>

                            {archivosNuevos.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {archivosNuevos.map((archivo, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-green-50 rounded-lg px-3 py-2 border border-green-100">
                                            <FileText size={13} className="text-green-500 shrink-0" />
                                            <span className="text-xs text-gray-700 flex-1 truncate">{archivo.name}</span>
                                            <span className="text-xs text-gray-400">{(archivo.size/1024/1024).toFixed(1)}MB</span>
                                            <button onClick={() => setArchivosNuevos(prev => prev.filter((_, j) => j !== i))}
                                                className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Botón guardar — siempre visible */}
                <button
                    onClick={handleSubmit}
                    disabled={procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                        bg-[#BE0F4A] text-white hover:bg-[#BC1D35] disabled:opacity-50 transition-colors">
                    {procesando ? 'Guardando...' : 'Guardar cambios'}
                    {!procesando && <ArrowRight size={16} />}
                </button>
            </div>
        </div>
    );
}

// ── Card solicitud ──
function CardSolicitud({ solicitud }) {

    const estadoConfig = {
        pendiente: {
            icon:   <Clock size={20} className="text-yellow-500" />,
            bg:     'bg-yellow-50 border-yellow-200',
            titulo: 'En revisión',
            desc:   'Su solicitud está siendo revisada por la Secretaría General Adjunta.',
        },
        subsanacion: {
            icon:   <AlertTriangle size={20} className="text-orange-500" />,
            bg:     'bg-orange-50 border-orange-200',
            titulo: 'Acción requerida — Subsanación',
            desc:   'La Secretaría ha encontrado observaciones. Corrija los datos y/o documentos indicados.',
        },
        admitida: {
            icon:   <CheckCircle2 size={20} className="text-green-500" />,
            bg:     'bg-green-50 border-green-200',
            titulo: 'Admitida — Expediente generado',
            desc:   'Su solicitud fue admitida y ya tiene un expediente activo.',
        },
        rechazada: {
            icon:   <XCircle size={20} className="text-red-500" />,
            bg:     'bg-red-50 border-red-200',
            titulo: 'No admitida',
            desc:   'Su solicitud no fue admitida a trámite.',
        },
    };

    const config = estadoConfig[solicitud.estado] ?? estadoConfig.pendiente;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Header */}
            <div className={`px-6 py-4 border-b flex items-start gap-4 ${config.bg}`}>
                <div className="shrink-0 mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-[#291136] text-sm">{solicitud.numero_cargo}</span>
                        <span className="text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full border">{solicitud.servicio}</span>
                        <span className="text-xs text-gray-400">{solicitud.created_at}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{config.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{config.desc}</p>
                </div>
                {solicitud.estado === 'admitida' && solicitud.expediente_id && (
                    <Link href={route('expedientes.show', solicitud.expediente_id)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                            bg-green-600 text-white hover:bg-green-700 transition-colors">
                        <FolderOpen size={14} />
                        Ver expediente
                        <ChevronRight size={12} />
                    </Link>
                )}
            </div>

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

                {/* Observación de secretaría */}
                {solicitud.estado === 'subsanacion' && solicitud.subsanacion_activa && (
                    <div className="space-y-4">
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

                        {/* Formulario edición */}
                        <FormSubsanacion solicitud={solicitud} />
                    </div>
                )}

                {/* Documentos — solo lectura si no está en subsanación */}
                {solicitud.estado !== 'subsanacion' && solicitud.documentos?.length > 0 && (
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

export default function MisSolicitudes({ solicitudes }) {

    const ordenadas = [...solicitudes].sort((a, b) => {
        const prioridad = { subsanacion: 0, pendiente: 1, admitida: 2, rechazada: 3 };
        return (prioridad[a.estado] ?? 4) - (prioridad[b.estado] ?? 4);
    });

    return (
        <AuthenticatedLayout>
            <Head title="Mis Solicitudes" />
            <div className="py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

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

                    {ordenadas.length === 0 ? (
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
                                <CardSolicitud key={s.id} solicitud={s} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}