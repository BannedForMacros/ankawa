import { usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    ChevronRight, FolderOpen, Clock, AlertTriangle,
    CheckCircle2, FileText, ArrowLeft
} from 'lucide-react';
import AccionesSecretariaAdjunta  from './partials/AccionesSecretariaAdjunta';
import AccionesSecretarioGeneral  from './partials/AccionesSecretarioGeneral';
import AccionesSecretarioArbitral from './partials/AccionesSecretarioArbitral';
import AccionesDirector           from './partials/AccionesDirector';
import AccionesCliente            from './partials/AccionesCliente';

// ── Badge estado ──
function EstadoBadge({ estado }) {
    const map = {
        admitido:   'bg-green-100 text-green-800',
        en_proceso: 'bg-blue-100 text-blue-800',
        suspendido: 'bg-gray-100 text-gray-500',
        cerrado:    'bg-gray-200 text-gray-500',
    };
    const labels = {
        admitido:   'Admitido',
        en_proceso: 'En proceso',
        suspendido: 'Suspendido',
        cerrado:    'Cerrado',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[estado] ?? 'bg-gray-100 text-gray-500'}`}>
            {labels[estado] ?? estado}
        </span>
    );
}

// ── Timeline de movimientos ──
function Timeline({ movimientos }) {
    if (!movimientos?.length) return (
        <p className="text-sm text-gray-400 italic">Sin movimientos registrados.</p>
    );
    return (
        <div className="space-y-4">
            {movimientos.map((m, i) => (
                <div key={m.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-[#291136]/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={14} className="text-[#291136]" />
                        </div>
                        {i < movimientos.length - 1 && (
                            <div className="w-px flex-1 bg-gray-200 mt-1" />
                        )}
                    </div>
                    <div className="pb-4 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">
                                {m.accion}
                            </span>
                            {m.etapa_destino && (
                                <>
                                    <ChevronRight size={12} className="text-gray-400" />
                                    <span className="text-xs text-gray-500">{m.etapa_destino.nombre}</span>
                                </>
                            )}
                            {m.actividad_destino && (
                                <>
                                    <ChevronRight size={12} className="text-gray-400" />
                                    <span className="text-xs text-[#BE0F4A] font-medium">{m.actividad_destino.nombre}</span>
                                </>
                            )}
                        </div>
                        {m.observacion && (
                            <p className="text-sm text-gray-600 leading-relaxed">{m.observacion}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                            {m.usuario?.name} — {m.created_at}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Panel info solicitud ──
function InfoSolicitud({ solicitud }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <FileText size={16} className="text-[#BE0F4A]" />
                <h3 className="font-bold text-[#291136] text-sm">Datos de la Solicitud</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {[
                    { label: 'N° Cargo',    value: solicitud.numero_cargo },
                    { label: 'Servicio',    value: solicitud.servicio?.nombre },
                    { label: 'Demandante',  value: solicitud.nombre_demandante },
                    { label: 'Documento',   value: solicitud.documento_demandante },
                    { label: 'Email',       value: solicitud.email_demandante },
                    { label: 'Teléfono',    value: solicitud.telefono_demandante },
                    { label: 'Domicilio',   value: solicitud.domicilio_demandante },
                    { label: 'Demandado',   value: solicitud.nombre_demandado },
                    { label: 'Dom. Demandado', value: solicitud.domicilio_demandado },
                    { label: 'Monto (S/)', value: solicitud.monto_involucrado
                        ? Number(solicitud.monto_involucrado).toLocaleString('es-PE')
                        : '—' },
                ].map((d, i) => (
                    <div key={i}>
                        <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{d.label}</div>
                        <div className="font-medium text-gray-800">{d.value ?? '—'}</div>
                    </div>
                ))}
                <div className="md:col-span-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Resumen de controversia</div>
                    <div className="text-gray-700 leading-relaxed">{solicitud.resumen_controversia}</div>
                </div>
                <div className="md:col-span-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Pretensiones</div>
                    <div className="text-gray-700 leading-relaxed">{solicitud.pretensiones}</div>
                </div>
            </div>
        </div>
    );
}

// ── Panel plazo actual ──
function PanelPlazo({ plazos }) {
    const plazoActivo = plazos?.find(p => p.estado === 'pendiente');
    if (!plazoActivo) return null;

    const hoy             = new Date();
    const vencimiento     = new Date(plazoActivo.fecha_vencimiento);
    const diasRestantes   = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
    const esCritico       = diasRestantes <= 2;
    const estaVencido     = diasRestantes < 0;

    return (
        <div className={`rounded-xl p-4 border flex items-start gap-3
            ${estaVencido ? 'bg-red-50 border-red-200' :
              esCritico   ? 'bg-orange-50 border-orange-200' :
                            'bg-blue-50 border-blue-200'}`}>
            <Clock size={18} className={
                estaVencido ? 'text-red-500 shrink-0 mt-0.5' :
                esCritico   ? 'text-orange-500 shrink-0 mt-0.5' :
                              'text-blue-500 shrink-0 mt-0.5'
            } />
            <div>
                <div className="text-sm font-bold text-gray-800">
                    Plazo: {plazoActivo.actividad?.nombre}
                </div>
                <div className={`text-xs mt-0.5 font-semibold
                    ${estaVencido ? 'text-red-600' : esCritico ? 'text-orange-600' : 'text-blue-600'}`}>
                    {estaVencido
                        ? `Vencido hace ${Math.abs(diasRestantes)} días`
                        : `Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''} — ${plazoActivo.fecha_vencimiento}`}
                </div>
            </div>
        </div>
    );
}

export default function Show({ expediente, siguienteActividad, arbitrosDisponibles, rolActual }) {

    const accionesProps = {
        expediente,
        siguienteActividad,
        arbitrosDisponibles,
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Expediente ${expediente.numero_expediente}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link href={route('expedientes.index')}
                            className="hover:text-[#BE0F4A] flex items-center gap-1 transition-colors">
                            <ArrowLeft size={14} />
                            Expedientes
                        </Link>
                        <ChevronRight size={14} />
                        <span className="font-mono font-bold text-[#291136]">
                            {expediente.numero_expediente}
                        </span>
                    </div>

                    {/* Header expediente */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#291136] flex items-center justify-center shrink-0">
                                    <FolderOpen size={24} className="text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold text-[#291136] font-mono">
                                            {expediente.numero_expediente}
                                        </h1>
                                        <EstadoBadge estado={expediente.estado} />
                                        {expediente.tiene_subsanacion && (
                                            <span className="flex items-center gap-1 text-xs text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                                                <AlertTriangle size={11} />
                                                Subsanación pendiente
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {expediente.servicio?.nombre} —
                                        Iniciado el {expediente.fecha_inicio}
                                    </div>
                                </div>
                            </div>

                            {/* Etapa y actividad actual */}
                            <div className="text-right">
                                <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Etapa actual</div>
                                <div className="font-bold text-[#291136] text-sm">
                                    {expediente.etapa_actual?.nombre ?? '—'}
                                </div>
                                <div className="text-xs text-[#BE0F4A] font-medium mt-0.5">
                                    {expediente.actividad_actual?.nombre ?? ''}
                                </div>
                            </div>
                        </div>

                        {/* Plazo activo */}
                        {expediente.plazos?.length > 0 && (
                            <div className="mt-4">
                                <PanelPlazo plazos={expediente.plazos} />
                            </div>
                        )}
                    </div>

                    {/* Contenido principal — 2 columnas */}
                    <div className="grid lg:grid-cols-3 gap-6">

                        {/* Columna izquierda — acciones del rol */}
                        <div className="lg:col-span-1 space-y-6">

                            {/* Acciones según rol */}
                            {rolActual === 'secretaria_general_adjunta' && (
                                <AccionesSecretariaAdjunta {...accionesProps} />
                            )}
                            {rolActual === 'secretario_general' && (
                                <AccionesSecretarioGeneral {...accionesProps} />
                            )}
                            {rolActual === 'secretario_arbitral' && (
                                <AccionesSecretarioArbitral {...accionesProps} />
                            )}
                            {rolActual === 'director' && (
                                <AccionesDirector {...accionesProps} />
                            )}
                            {rolActual === 'cliente' && (
                                <AccionesCliente {...accionesProps} />
                            )}

                            {/* Personas del expediente */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-[#291136] text-sm">Participantes</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {expediente.usuarios?.map(eu => (
                                        <div key={eu.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#291136]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#291136]">
                                                {eu.usuario?.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{eu.usuario?.name}</div>
                                                <div className="text-xs text-gray-400 capitalize">{eu.rol_en_expediente.replace('_', ' ')}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {expediente.arbitros?.filter(a => a.estado_aceptacion === 'aceptado').map(a => (
                                        <div key={a.id} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#BE0F4A]">
                                                {a.nombre_arbitro?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{a.nombre_arbitro}</div>
                                                <div className="text-xs text-[#BE0F4A] font-medium capitalize">{a.tipo_designacion}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {!expediente.usuarios?.length && !expediente.arbitros?.length && (
                                        <p className="text-xs text-gray-400 italic">Sin participantes asignados.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Columna derecha — info + historial */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Info de la solicitud */}
                            <InfoSolicitud solicitud={expediente.solicitud} />

                            {/* Documentos */}
                            {expediente.documentos?.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                                        <FileText size={16} className="text-[#BE0F4A]" />
                                        <h3 className="font-bold text-[#291136] text-sm">Documentos</h3>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {expediente.documentos.map(doc => (
                                            <a key={doc.id}
                                                href={`/storage/${doc.ruta_archivo}`}
                                                target="_blank"
                                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                                <FileText size={16} className="text-gray-400 group-hover:text-[#BE0F4A] transition-colors shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-800 truncate">{doc.nombre_original}</div>
                                                    <div className="text-xs text-gray-400">{doc.tipo_documento}</div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Historial de movimientos */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h3 className="font-bold text-[#291136] text-sm">Historial del Proceso</h3>
                                </div>
                                <div className="p-6">
                                    <Timeline movimientos={expediente.movimientos} />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}