import { useState } from 'react';
import { router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    ChevronDown, ChevronUp, FileText, Upload, Clock,
    CheckCircle2, AlertTriangle, User, Download, ArrowRight,
    Lock, CircleDot
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Upload reutilizable ───
function UploadZona({ id, archivo, setArchivo }) {
    const [drag, setDrag] = useState(false);
    return (
        <div
            onDrop={e => { e.preventDefault(); setDrag(false); setArchivo(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onClick={() => document.getElementById(id).click()}
            className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors
                ${drag ? 'border-[#BE0F4A] bg-[#BE0F4A]/5' : 'border-gray-200 hover:border-[#BE0F4A]/40'}`}>
            <input id={id} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden"
                onChange={e => setArchivo(e.target.files[0])} />
            <Upload size={15} className="mx-auto mb-1 text-gray-400" />
            {archivo
                ? <p className="text-xs text-green-600 font-semibold truncate px-2">{archivo.name}</p>
                : <p className="text-xs text-gray-400">Arrastra o <span className="text-[#BE0F4A] font-semibold">selecciona</span> (PDF, Word, imagen)</p>
            }
        </div>
    );
}

// ─── Línea de tiempo de movimientos ───
function Movimientos({ movimientos }) {
    if (!movimientos?.length) return (
        <p className="text-xs text-gray-400 italic py-2">Sin movimientos registrados.</p>
    );
    return (
        <div className="space-y-3">
            {movimientos.map((m, i) => (
                <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-[#BE0F4A] mt-1.5 shrink-0" />
                        {i < movimientos.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400">{m.created_at}</span>
                            {m.autor && <span className="text-xs text-gray-500">· {m.autor}</span>}
                            {m.actividad_destino && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                    → {m.actividad_destino}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{m.descripcion}</p>
                        {m.documento && (
                            <a href={`/storage/${m.documento.ruta}`} target="_blank"
                                className="inline-flex items-center gap-1 mt-1 text-xs text-[#BE0F4A] hover:underline">
                                <FileText size={11} /> {m.documento.nombre}
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Formulario de acción (solo si puedeActuar en esa actividad) ───
function FormAccion({ expedienteId, actividadActualId, siguienteActividad, onSuccess }) {
    const [descripcion, setDescripcion]   = useState('');
    const [archivo, setArchivo]           = useState(null);
    const [avanzar, setAvanzar]           = useState(false);
    const [crearSubsanacion, setCrearSub] = useState(false);
    const [plazoDias, setPlazoDias]       = useState(3);
    const [procesando, setProcesando]     = useState(false);

    const handleSubmit = () => {
        if (!descripcion.trim()) return toast.error('Ingrese una descripción.');
        if (!archivo)            return toast.error('Adjunte un documento.');
        if (avanzar && !siguienteActividad) return toast.error('No hay actividad siguiente configurada.');

        const fd = new FormData();
        fd.append('descripcion', descripcion);
        fd.append('documento', archivo);
        fd.append('avanzar', avanzar ? '1' : '0');
        if (avanzar && siguienteActividad) fd.append('actividad_destino_id', siguienteActividad.id);
        fd.append('crear_subsanacion', crearSubsanacion ? '1' : '0');
        if (crearSubsanacion) fd.append('plazo_dias', plazoDias);

        setProcesando(true);
        router.post(route('expedientes.accion', expedienteId), fd, {
            forceFormData: true,
            onSuccess: p => { toast.success(p.props.flash?.success ?? 'Registrado'); onSuccess?.(); },
            onError:   e => toast.error(e.general ?? 'Error al registrar.'),
            onFinish:  () => setProcesando(false),
        });
    };

    return (
        <div className="border border-[#BE0F4A]/20 rounded-xl overflow-hidden mt-3">
            <div className="bg-[#291136]/5 px-4 py-2.5 text-xs font-bold text-[#291136] uppercase tracking-wide">
                Registrar acción
            </div>
            <div className="p-4 space-y-3">
                {/* Descripción */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Descripción / Observación <span className="text-[#BE0F4A]">*</span></label>
                    <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)}
                        placeholder="Detalle la acción realizada..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none
                            focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                </div>

                {/* Documento */}
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Documento adjunto <span className="text-[#BE0F4A]">*</span></label>
                    <UploadZona id={`accion-${expedienteId}`} archivo={archivo} setArchivo={setArchivo} />
                </div>

                {/* Opciones */}
                <div className="space-y-2 pt-1">
                    {/* Subsanación */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={crearSubsanacion} onChange={e => setCrearSub(e.target.checked)}
                            className="rounded border-gray-300 text-[#BE0F4A] focus:ring-[#BE0F4A]" />
                        <span className="text-xs text-gray-600">Requiere subsanación de la otra parte</span>
                    </label>
                    {crearSubsanacion && (
                        <div className="flex items-center gap-2 ml-5">
                            <span className="text-xs text-gray-500">Plazo:</span>
                            <input type="number" min={1} max={60} value={plazoDias}
                                onChange={e => setPlazoDias(parseInt(e.target.value))}
                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-xs
                                    focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20" />
                            <span className="text-xs text-gray-400">días hábiles</span>
                        </div>
                    )}

                    {/* Avanzar */}
                    {siguienteActividad && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={avanzar} onChange={e => setAvanzar(e.target.checked)}
                                className="rounded border-gray-300 text-[#BE0F4A] focus:ring-[#BE0F4A]" />
                            <span className="text-xs text-gray-600">
                                Pasar a: <span className="font-semibold text-[#291136]">{siguienteActividad.nombre}</span>
                                {siguienteActividad.etapa_nombre && (
                                    <span className="text-gray-400"> ({siguienteActividad.etapa_nombre})</span>
                                )}
                            </span>
                        </label>
                    )}
                </div>

                <button onClick={handleSubmit} disabled={procesando}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold
                        bg-[#BE0F4A] text-white hover:bg-[#BC1D35] disabled:opacity-50 transition-colors">
                    {procesando ? 'Registrando...' : 'Registrar acción'}
                    {!procesando && <ArrowRight size={14} />}
                </button>
            </div>
        </div>
    );
}

// ─── Acordeón de etapa ───
function EtapaAcordeon({ etapa, actividadActualId, puedeActuar, expedienteId, siguienteActividad, movimientosPorActividad }) {
    const [abierto, setAbierto] = useState(
        etapa.actividades?.some(a => a.id === actividadActualId)
    );

    const esEtapaActual = etapa.actividades?.some(a => a.id === actividadActualId);

    return (
        <div className={`border rounded-2xl overflow-hidden transition-all
            ${esEtapaActual ? 'border-[#BE0F4A]/30' : 'border-gray-100'}`}>

            {/* Header etapa */}
            <button onClick={() => setAbierto(!abierto)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors
                    ${esEtapaActual ? 'bg-[#291136]/5' : 'bg-gray-50/80 hover:bg-gray-100/60'}`}>
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${esEtapaActual ? 'bg-[#BE0F4A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {etapa.orden}
                    </div>
                    <div>
                        <p className="font-semibold text-sm text-[#291136]">{etapa.nombre}</p>
                        <p className="text-xs text-gray-400">
                            {etapa.actividades?.length ?? 0} actividades
                            {esEtapaActual && <span className="ml-2 text-[#BE0F4A] font-semibold">· Etapa actual</span>}
                        </p>
                    </div>
                </div>
                {abierto ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
            </button>

            {/* Actividades */}
            {abierto && (
                <div className="divide-y divide-gray-50">
                    {etapa.actividades?.map(actividad => {
                        const esActual  = actividad.id === actividadActualId;
                        const movs      = movimientosPorActividad[actividad.id] ?? [];
                        const rolesNombres = actividad.roles?.map(r => r.nombre).join(', ') ?? '—';

                        return (
                            <div key={actividad.id}
                                className={`px-5 py-4 ${esActual ? 'bg-white' : 'bg-gray-50/40'}`}>

                                <div className="flex items-start gap-3">
                                    {/* Indicador */}
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                                        ${esActual
                                            ? 'border-[#BE0F4A] bg-[#BE0F4A]/10'
                                            : movs.length > 0
                                                ? 'border-green-400 bg-green-50'
                                                : 'border-gray-200 bg-white'}`}>
                                        {movs.length > 0 && !esActual && (
                                            <CheckCircle2 size={11} className="text-green-500" />
                                        )}
                                        {esActual && <div className="w-2 h-2 rounded-full bg-[#BE0F4A]" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`text-sm font-semibold ${esActual ? 'text-[#291136]' : 'text-gray-600'}`}>
                                                {actividad.nombre}
                                            </p>
                                            {esActual && (
                                                <span className="text-xs bg-[#BE0F4A]/10 text-[#BE0F4A] px-2 py-0.5 rounded-full font-semibold">
                                                    Actual
                                                </span>
                                            )}
                                            {!puedeActuar && esActual && (
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Lock size={10} /> Solo lectura
                                                </span>
                                            )}
                                        </div>

                                        {/* Roles y plazo */}
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                            <span className="text-xs text-gray-400">
                                                Rol(es): <span className="text-gray-600">{rolesNombres}</span>
                                            </span>
                                            {actividad.dias_plazo > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    Plazo: <span className="text-gray-600">{actividad.dias_plazo} días hábiles</span>
                                                </span>
                                            )}
                                        </div>

                                        {/* Movimientos de esta actividad */}
                                        {movs.length > 0 && (
                                            <div className="mt-3">
                                                <Movimientos movimientos={movs} />
                                            </div>
                                        )}

                                        {/* Formulario — solo actividad actual y si puede actuar */}
                                        {esActual && puedeActuar && (
                                            <FormAccion
                                                expedienteId={expedienteId}
                                                actividadActualId={actividad.id}
                                                siguienteActividad={siguienteActividad}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Sidebar: partes ───
function SidebarPartes({ solicitud }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
                <p className="text-xs font-bold text-[#291136] uppercase tracking-wide">Partes</p>
            </div>
            <div className="p-5 space-y-4">
                {[
                    { label: 'Demandante', nombre: solicitud.nombre_demandante, email: solicitud.email_demandante, color: 'bg-[#291136]' },
                    { label: 'Demandado',  nombre: solicitud.nombre_demandado,  email: solicitud.email_demandado,  color: 'bg-[#BE0F4A]' },
                ].map(p => (
                    <div key={p.label}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-4 h-4 rounded-full ${p.color} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
                                {p.label[0]}
                            </span>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{p.label}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 pl-6">{p.nombre}</p>
                        <p className="text-xs text-gray-400 pl-6">{p.email}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Sidebar: plazo actual ───
function SidebarPlazo({ plazo }) {
    if (!plazo) return null;
    const vence    = new Date(plazo.fecha_vencimiento);
    const hoy      = new Date();
    const diasRest = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    const urgente  = diasRest <= 2;

    return (
        <div className={`rounded-2xl border shadow-sm overflow-hidden
            ${urgente ? 'border-red-200' : 'border-gray-100'}`}>
            <div className={`px-5 py-3.5 border-b ${urgente ? 'bg-red-50 border-red-100' : 'bg-gray-50/80 border-gray-100'}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Plazo activo</p>
            </div>
            <div className="p-5 bg-white">
                <p className="text-sm font-semibold text-gray-800">{plazo.actividad?.nombre}</p>
                <div className="flex items-center gap-2 mt-2">
                    <Clock size={13} className={urgente ? 'text-red-500' : 'text-gray-400'} />
                    <span className={`text-xs font-semibold ${urgente ? 'text-red-600' : 'text-gray-600'}`}>
                        Vence: {new Date(plazo.fecha_vencimiento).toLocaleDateString('es-PE')}
                    </span>
                </div>
                <div className={`mt-2 text-xs px-2 py-1 rounded-lg inline-block font-semibold
                    ${urgente ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {diasRest > 0 ? `${diasRest} días restantes` : 'Vencido'}
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar: árbitros ───
function SidebarArbitros({ arbitros, puedeDesignar, expedienteId, arbitrosDisponibles }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm]         = useState({ tipo_designacion: 'unico', nombre_arbitro: '', email_arbitro: '', usuario_id: '' });
    const [procesando, setProcesando] = useState(false);

    const handleDesignar = () => {
        if (!form.nombre_arbitro || !form.email_arbitro) return toast.error('Complete nombre y email del árbitro.');
        setProcesando(true);
        router.post(route('expedientes.designarArbitro', expedienteId), form, {
            onSuccess: p => { toast.success(p.props.flash?.success ?? 'Árbitro designado'); setShowForm(false); },
            onError:   e => toast.error(e.general ?? 'Error'),
            onFinish:  () => setProcesando(false),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <p className="text-xs font-bold text-[#291136] uppercase tracking-wide">Árbitros</p>
                {puedeDesignar && (
                    <button onClick={() => setShowForm(!showForm)}
                        className="text-xs text-[#BE0F4A] font-semibold hover:underline">
                        + Designar
                    </button>
                )}
            </div>
            <div className="p-5">
                {arbitros?.length === 0 && !showForm && (
                    <p className="text-xs text-gray-400 italic">Sin árbitros designados.</p>
                )}
                <div className="space-y-3">
                    {arbitros?.map(a => (
                        <div key={a.id}>
                            <p className="text-sm font-semibold text-gray-800">{a.nombre_arbitro}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{a.tipo_designacion}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                                    ${a.estado_aceptacion === 'aceptado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {a.estado_aceptacion}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Formulario designar */}
                {showForm && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                            <select value={form.tipo_designacion} onChange={e => setForm(p => ({ ...p, tipo_designacion: e.target.value }))}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20">
                                <option value="unico">Árbitro único</option>
                                <option value="presidente">Presidente del tribunal</option>
                                <option value="coarbitro">Coárbitro</option>
                            </select>
                        </div>

                        {/* Si hay usuarios árbitros en el sistema */}
                        {arbitrosDisponibles?.length > 0 ? (
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Seleccionar del sistema</label>
                                <select onChange={e => {
                                    const u = arbitrosDisponibles.find(a => a.id == e.target.value);
                                    if (u) setForm(p => ({ ...p, usuario_id: u.id, nombre_arbitro: u.name, email_arbitro: u.email }));
                                }} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20">
                                    <option value="">— Seleccionar —</option>
                                    {arbitrosDisponibles.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Nombre del árbitro</label>
                                    <input type="text" value={form.nombre_arbitro} onChange={e => setForm(p => ({ ...p, nombre_arbitro: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                                    <input type="email" value={form.email_arbitro} onChange={e => setForm(p => ({ ...p, email_arbitro: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20" />
                                </div>
                            </>
                        )}

                        <div className="flex gap-2">
                            <button onClick={() => setShowForm(false)}
                                className="flex-1 py-2 rounded-xl text-xs border border-gray-200 text-gray-500 hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={handleDesignar} disabled={procesando}
                                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#291136] text-white hover:bg-[#BE0F4A] disabled:opacity-50 transition-colors">
                                {procesando ? 'Guardando...' : 'Designar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────
// PÁGINA PRINCIPAL
// ─────────────────────────────────

export default function Show({
    expediente,
    etapas,           // ← ahora viene separado
    puedeActuar,
    siguienteActividad,
    arbitrosDisponibles,
    plazoActual,
    rolActual,
}) {
    const solicitud = expediente.solicitud;

    // Agrupar movimientos por actividad_id
    const movimientosPorActividad = {};
    expediente.movimientos?.forEach(m => {
        const key = m.actividad_id ?? 'sin_actividad';
        if (!movimientosPorActividad[key]) movimientosPorActividad[key] = [];
        movimientosPorActividad[key].push({
            id:               m.id,
            tipo:             m.tipo,
            descripcion:      m.descripcion,
            autor:            m.registradoPor?.name,
            actividad_destino:m.actividadDestino?.nombre,
            created_at:       m.created_at,
            documento:        m.documentos?.[0]
                ? { nombre: m.documentos[0].nombre_original, ruta: m.documentos[0].ruta_archivo }
                : null,
        });
    });

    // Movimientos de Etapa 1 (de la solicitud)
    const movsSolicitud = solicitud.movimientos?.map(m => ({
        id:          m.id,
        descripcion: m.descripcion,
        autor:       m.registradoPor?.name,
        created_at:  m.created_at,
        documento:   m.documentos?.[0]
            ? { nombre: m.documentos[0].nombre_original, ruta: m.documentos[0].ruta_archivo }
            : null,
    })) ?? [];

    // Etapas del servicio con actividades

    const puedeDesignarArbitro = ['director', 'secretario_general'].includes(rolActual);

    return (
        <AuthenticatedLayout>
            <Head title={`Expediente ${expediente.numero_expediente ?? solicitud.numero_cargo}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── Header ── */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold text-[#291136]"
                                    style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    {expediente.numero_expediente ?? (
                                        <span className="text-gray-400">Solicitud {solicitud.numero_cargo}</span>
                                    )}
                                </h1>
                                {/* Estado */}
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full border
                                    ${expediente.estado === 'admitido'   ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                      expediente.estado === 'en_proceso' ? 'bg-blue-50 text-blue-700 border-blue-200'   :
                                      expediente.estado === 'resuelto'   ? 'bg-green-50 text-green-700 border-green-200' :
                                      'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {expediente.estado}
                                </span>
                                {expediente.tiene_subsanacion && (
                                    <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-full font-semibold">
                                        <AlertTriangle size={11} /> Subsanación pendiente
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {solicitud.servicio?.nombre} ·{' '}
                                {expediente.etapaActual?.nombre ?? 'Sin etapa asignada'} ·{' '}
                                {expediente.actividadActual?.nombre ?? '—'}
                            </p>
                        </div>

                        <Link href={route('expedientes.index')}
                            className="text-xs text-gray-400 hover:text-[#BE0F4A] transition-colors">
                            ← Volver a expedientes
                        </Link>
                    </div>

                    {/* ── Layout dos columnas ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Columna principal (izquierda) ── */}
                        <div className="lg:col-span-2 space-y-4">

                            {/* Historial Etapa 1 — siempre visible */}
                            {movsSolicitud.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
                                        <p className="text-xs font-bold text-[#291136] uppercase tracking-wide">
                                            Etapa Inicial — Solicitud
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Cargo: {solicitud.numero_cargo}
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <Movimientos movimientos={movsSolicitud} />
                                    </div>
                                </div>
                            )}

                            {/* Etapas configuradas en el servicio */}
                            {etapas.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
                                    <p className="text-sm">No hay etapas configuradas para este servicio.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {etapas.map(etapa => (
                                        <EtapaAcordeon
                                            key={etapa.id}
                                            etapa={etapa}
                                            actividadActualId={expediente.actividad_actual_id}
                                            puedeActuar={puedeActuar}
                                            expedienteId={expediente.id}
                                            siguienteActividad={siguienteActividad}
                                            movimientosPorActividad={movimientosPorActividad}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Sidebar (derecha) ── */}
                        <div className="space-y-4">

                            {/* Partes */}
                            <SidebarPartes solicitud={solicitud} />

                            {/* Plazo activo */}
                            {plazoActual && <SidebarPlazo plazo={plazoActual} />}

                            {/* Árbitros */}
                            <SidebarArbitros
                                arbitros={expediente.arbitros}
                                puedeDesignar={puedeDesignarArbitro}
                                expedienteId={expediente.id}
                                arbitrosDisponibles={arbitrosDisponibles}
                            />

                            {/* Info del expediente */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/80">
                                    <p className="text-xs font-bold text-[#291136] uppercase tracking-wide">Información</p>
                                </div>
                                <div className="p-5 space-y-3">
                                    {[
                                        { l: 'Servicio',     v: solicitud.servicio?.nombre },
                                        { l: 'Monto',        v: solicitud.monto_involucrado ? 'S/ ' + Number(solicitud.monto_involucrado).toLocaleString('es-PE') : '—' },
                                        { l: 'Inicio',       v: expediente.fecha_inicio },
                                        { l: 'Tu rol',       v: rolActual },
                                    ].map((d, i) => (
                                        <div key={i}>
                                            <p className="text-xs text-gray-400 uppercase tracking-wide">{d.l}</p>
                                            <p className="text-sm font-medium text-gray-800">{d.v ?? '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}