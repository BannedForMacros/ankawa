import React, { useState, useMemo } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import {
    ArrowLeft, FileText, Download, User, Users, Scale,
    History, CheckCircle, AlertTriangle, XCircle, FilePlus, ChevronRight,
    UserPlus, Trash2, Clock, CalendarX, CalendarCheck, Pencil, Lock, Bell,
    Gavel, DollarSign, BookOpen, Upload, Paperclip, FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

function EstadoBadge({ estado }) {
    const map = {
        en_proceso: { color: 'bg-blue-100 text-blue-700 border-blue-200',   label: 'En Proceso' },
        resuelto:   { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Resuelto' },
        archivado:  { color: 'bg-gray-100 text-gray-600 border-gray-200',   label: 'Archivado'  },
    };
    const s = map[estado] ?? { color: 'bg-gray-100 text-gray-500 border-gray-200', label: estado };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.color}`}>
            {s.label}
        </span>
    );
}

// Zona de carga de archivo — clara, clicable, muestra el nombre seleccionado
function FileZone({ label, sublabel, required, multiple = false, accept = '.pdf,.doc,.docx', value, onChange }) {
    const hasFile = multiple ? (value && value.length > 0) : !!value;
    return (
        <div>
            {label && (
                <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">{label}</span>
                    {required
                        ? <span className="text-[10px] font-bold text-white bg-[#BE0F4A] px-1.5 py-0.5 rounded-md">Requerido</span>
                        : <span className="text-[10px] text-gray-400">(opcional)</span>
                    }
                </div>
            )}
            {sublabel && <p className="text-xs text-gray-500 mb-2">{sublabel}</p>}
            <label className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed cursor-pointer transition-all
                ${hasFile
                    ? 'border-[#291136]/40 bg-[#291136]/5 text-[#291136]'
                    : required
                        ? 'border-[#BE0F4A]/40 bg-[#BE0F4A]/5 hover:border-[#BE0F4A]/60 hover:bg-[#BE0F4A]/10'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 text-gray-400'
                }`}>
                <div className={`shrink-0 p-2 rounded-lg ${hasFile ? 'bg-[#291136]/10' : required ? 'bg-[#BE0F4A]/10' : 'bg-gray-200'}`}>
                    {hasFile
                        ? <CheckCircle size={16} className="text-[#291136]"/>
                        : <Upload size={16} className={required ? 'text-[#BE0F4A]' : 'text-gray-400'}/>
                    }
                </div>
                <div className="min-w-0 flex-1">
                    {hasFile ? (
                        <span className="text-sm font-semibold truncate block">
                            {multiple ? `${value.length} archivo(s) listo(s)` : value.name}
                        </span>
                    ) : (
                        <span className="text-sm">Haz clic para seleccionar archivo(s)</span>
                    )}
                    <span className="text-[10px] text-gray-400 block">{accept.replaceAll(',', ', ')}</span>
                </div>
                {hasFile && (
                    <Paperclip size={14} className="shrink-0 text-[#291136]/50"/>
                )}
                <input type="file" accept={accept} multiple={multiple} className="sr-only" onChange={onChange}/>
            </label>
        </div>
    );
}

const SLUGS_INMUTABLES = ['demandante', 'demandado'];

const TABS = [
    { id: 'historial', label: 'Historial',  Icon: History  },
    { id: 'partes',    label: 'Partes',     Icon: Users    },
    { id: 'docs',      label: 'Documentos', Icon: FileText },
];

export default function Show({
    expediente,
    puedeActuar,
    transiciones,
    requisitosConArchivos = [],
    puedeGestionarActores,
    tiposActor = [],
    usuariosAsignables = [],
    plazo = null,
}) {
    const { auth }  = usePage().props;
    const solicitud = expediente.solicitud;
    const actores   = expediente.actores || [];

    const [activeTab,    setActiveTab]    = useState('historial');
    const [modalAction,  setModalAction]  = useState(null);
    const [modalActores, setModalActores] = useState(false);
    const [modalPlazo,   setModalPlazo]   = useState(false);

    const actoresNotificables = useMemo(() =>
        actores.filter(a => a.activo && (a.usuario?.email || a.email_externo)),
    [actores]);

    const { data, setData, post, processing, errors, reset } = useForm({
        transicion_id:         '',
        observaciones:         '',
        numero_expediente:     '',
        documentos_movimiento: [],
        documentos_requisito:  {},
        notificar_a:           [],
    });

    const { data: actorData, setData: setActorData, post: postActor, processing: actorProcessing, errors: actorErrors, reset: resetActor } = useForm({
        tipo_actor_id: '',
        usuario_id:    '',
    });

    const { data: plazoData, setData: setPlazoData, post: postPlazo, delete: deletePlazo, processing: plazoProcessing, errors: plazoErrors, reset: resetPlazo } = useForm({
        dias_plazo: plazo?.override_dias ?? plazo?.dias_default ?? '',
        motivo:     '',
    });

    const abrirModalAccion = (transicion) => {
        const preseleccionados = transicion.permite_notificar
            ? actoresNotificables.filter(a => a.usuario?.id !== auth?.user?.id).map(a => a.id)
            : [];
        reset();
        setData({
            transicion_id:         transicion.id,
            observaciones:         '',
            numero_expediente:     '',
            documentos_movimiento: [],
            documentos_requisito:  {},
            notificar_a:           preseleccionados,
        });
        setModalAction(transicion);
    };
    const cerrarModal = () => { setModalAction(null); reset(); };

    const abrirModalActores  = () => { resetActor(); setModalActores(true); };
    const cerrarModalActores = () => { setModalActores(false); resetActor(); };

    const handleAgregarActor = (e) => {
        e.preventDefault();
        postActor(route('expedientes.actores.store', expediente.id), {
            preserveScroll: true,
            onSuccess: (page) => { cerrarModalActores(); const msg = page.props.flash?.success; if (msg) toast.success(msg); },
            onError: () => toast.error('Revise los campos del formulario.'),
        });
    };

    const handleRemoverActor = (actorId) => {
        router.delete(route('expedientes.actores.destroy', [expediente.id, actorId]), {
            preserveScroll: true,
            onSuccess: (page) => { const msg = page.props.flash?.success; if (msg) toast.success(msg); },
            onError: () => toast.error('No se pudo remover el actor.'),
        });
    };

    const abrirModalPlazo  = () => {
        resetPlazo();
        setPlazoData('dias_plazo', plazo?.override_dias ?? plazo?.dias_default ?? '');
        setModalPlazo(true);
    };
    const cerrarModalPlazo = () => { setModalPlazo(false); resetPlazo(); };

    const handleGuardarPlazo = (e) => {
        e.preventDefault();
        postPlazo(route('expedientes.plazo.store', expediente.id), {
            preserveScroll: true,
            onSuccess: (page) => { cerrarModalPlazo(); const msg = page.props.flash?.success; if (msg) toast.success(msg); },
            onError: () => toast.error('Revise los campos del formulario.'),
        });
    };

    const handleEliminarOverride = () => {
        deletePlazo(route('expedientes.plazo.destroy', expediente.id), {
            preserveScroll: true,
            onSuccess: (page) => { cerrarModalPlazo(); const msg = page.props.flash?.success; if (msg) toast.success(msg); },
        });
    };

    const ejecutarAccion = (e) => {
        e.preventDefault();
        post(route('expedientes.accion', expediente.id), {
            preserveScroll: true,
            forceFormData:  true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                cerrarModal();
            },
            onError: () => toast.error('Revise los campos requeridos e inténtelo de nuevo.'),
        });
    };

    // ── Sub-secciones ────────────────────────────────────────────────────────

    const PlazoWidget = plazo?.dias ? (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
            plazo.vencido ? 'bg-red-50 border-red-200' :
            plazo.dias_restantes <= 3 ? 'bg-amber-50 border-amber-200' :
            'bg-emerald-50 border-emerald-200'
        }`}>
            <div className={`mt-0.5 shrink-0 ${plazo.vencido ? 'text-red-500' : plazo.dias_restantes <= 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {plazo.vencido ? <CalendarX size={20}/> : plazo.dias_restantes <= 3 ? <Clock size={20}/> : <CalendarCheck size={20}/>}
            </div>
            <div className="flex-1 min-w-0">
                <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${plazo.vencido ? 'text-red-600' : plazo.dias_restantes <= 3 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {plazo.vencido ? 'Plazo vencido' : 'Plazo de actividad'}
                </div>
                <div className={`text-sm font-semibold ${plazo.vencido ? 'text-red-800' : 'text-gray-700'}`}>
                    {plazo.vencido
                        ? `Venció hace ${Math.abs(plazo.dias_restantes)} día(s)`
                        : `${plazo.dias_restantes} día(s) restantes`}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    Vence: {plazo.vencimiento ? new Date(plazo.vencimiento).toLocaleDateString('es-PE') : '—'}
                    {plazo.tiene_override && (
                        <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold text-[10px]">Override</span>
                    )}
                </div>
                {plazo.fecha_inicio && (
                    <div className="text-[10px] text-gray-400 mt-0.5">
                        En actividad desde: {new Date(plazo.fecha_inicio).toLocaleDateString('es-PE')}
                    </div>
                )}
            </div>
            {puedeGestionarActores && (
                <button onClick={abrirModalPlazo}
                    className="shrink-0 p-1.5 rounded-lg hover:bg-black/5 transition-colors text-gray-400 hover:text-gray-600">
                    <Pencil size={14}/>
                </button>
            )}
        </div>
    ) : (plazo && !plazo.dias && puedeGestionarActores) ? (
        <button onClick={abrirModalPlazo}
            className="w-full flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-[#291136] hover:text-[#291136] transition-colors">
            <Clock size={14}/> Configurar plazo para esta actividad
        </button>
    ) : null;

    const AccionesPanel = (
        <div className="bg-[#291136] rounded-2xl shadow-lg p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-[#BE0F4A] rounded-full blur-3xl opacity-20 -mr-8 -mt-8 pointer-events-none"/>
            <h2 className="text-sm font-bold mb-1 relative z-10 uppercase tracking-wide opacity-70">Acciones Disponibles</h2>
            <p className="text-xs text-white/50 mb-4 relative z-10">{expediente.actividad_actual?.nombre}</p>

            {!puedeActuar ? (
                <p className="text-sm text-white/50 relative z-10 italic">
                    No tiene acciones pendientes en esta actividad.
                </p>
            ) : (
                <div className="space-y-2.5 relative z-10">
                    {transiciones?.length > 0 ? transiciones.map(t => {
                        const necesitaDoc = t.slot_cubierto === false;
                        return necesitaDoc ? (
                            // Botón con documento pendiente — abre el modal igualmente para que el usuario lo suba ahí
                            <button key={t.id} onClick={() => abrirModalAccion(t)}
                                title={`Suba el documento "${t.requisito_nombre}" para continuar`}
                                className="w-full flex items-center justify-between bg-amber-400/20 border border-amber-400/40 text-white/80 px-4 py-3 rounded-xl text-sm font-bold hover:bg-amber-400/30 transition-all group">
                                <span className="flex items-center gap-2">
                                    <Upload size={13} className="text-amber-300"/> {t.etiqueta_boton}
                                </span>
                                <span className="text-[10px] font-semibold bg-amber-300/20 text-amber-300 px-2 py-1 rounded-lg whitespace-nowrap">
                                    Subir doc.
                                </span>
                            </button>
                        ) : (
                            <button key={t.id} onClick={() => abrirModalAccion(t)}
                                className="w-full flex items-center justify-between bg-white text-[#291136] px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 hover:scale-[1.01] transition-all shadow-md group">
                                {t.etiqueta_boton}
                                <ChevronRight size={15} className="text-[#BE0F4A] group-hover:translate-x-0.5 transition-transform"/>
                            </button>
                        );
                    }) : (
                        <p className="text-sm text-white/50 italic">Sin transiciones configuradas.</p>
                    )}
                </div>
            )}
        </div>
    );

    // ── Panel Historial con documentos por movimiento ──
    const HistorialPanel = (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-[#291136] mb-6 flex items-center gap-2">
                <History size={17} className="text-[#BE0F4A]"/> Historial del Caso
            </h2>

            {expediente.movimientos?.length > 0 ? (
                <div className="relative">
                    {/* Línea vertical */}
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#BE0F4A]/60 via-gray-200 to-transparent"/>

                    <div className="space-y-6">
                        {expediente.movimientos.map((mov, idx) => {
                            const docsMov  = mov.documentos ?? [];
                            const docsSlot = mov.requisitos_documento ?? [];
                            const totalDocs = docsMov.length + docsSlot.length;

                            return (
                                <div key={mov.id} className="flex gap-4 items-start">
                                    {/* Nodo */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white shadow-sm ${
                                        idx === 0 ? 'bg-[#BE0F4A] text-white' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {idx === 0 ? <CheckCircle size={14}/> : <FilePlus size={13}/>}
                                    </div>

                                    {/* Tarjeta */}
                                    <div className="flex-1 min-w-0 pb-1">
                                        {/* Etapa de origen → destino */}
                                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                            {mov.actividad_origen && (
                                                <>
                                                    <span className="text-xs text-gray-400 font-medium">{mov.actividad_origen.nombre}</span>
                                                    <ChevronRight size={11} className="text-gray-300 shrink-0"/>
                                                </>
                                            )}
                                            <span className={`text-sm font-bold ${idx === 0 ? 'text-[#BE0F4A]' : 'text-[#291136]'}`}>
                                                {mov.actividad_destino?.nombre || 'Presentación Inicial'}
                                            </span>
                                        </div>

                                        {/* Meta */}
                                        <div className="text-xs text-gray-400 mt-0.5 mb-2">
                                            {new Date(mov.fecha_movimiento).toLocaleString('es-PE', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                            {' · '}
                                            <span className="font-semibold text-gray-500">{mov.usuario?.name || 'Sistema'}</span>
                                        </div>

                                        {/* Observaciones */}
                                        {mov.observaciones && (
                                            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed border border-gray-100 mb-3">
                                                {mov.observaciones}
                                            </p>
                                        )}

                                        {/* Documentos adjuntos */}
                                        {totalDocs > 0 && (
                                            <div className="mt-2 space-y-1.5">
                                                {/* Slots de requisito */}
                                                {docsSlot.map(d => (
                                                    <a key={d.id}
                                                        href={`/storage/${d.ruta_archivo}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 hover:border-purple-200 transition-colors group text-xs">
                                                        <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shrink-0 group-hover:bg-purple-200">
                                                            <FolderOpen size={12}/>
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-semibold text-purple-800 truncate">{d.nombre_original}</div>
                                                            {d.requisito?.nombre && (
                                                                <div className="text-purple-500 text-[10px]">{d.requisito.nombre}</div>
                                                            )}
                                                        </div>
                                                        <Download size={11} className="text-purple-400 group-hover:text-purple-600 shrink-0"/>
                                                    </a>
                                                ))}

                                                {/* Anexos del movimiento */}
                                                {docsMov.map(d => (
                                                    <a key={d.id}
                                                        href={`/storage/${d.ruta_archivo}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-[#BE0F4A]/5 border border-[#BE0F4A]/10 rounded-xl hover:bg-[#BE0F4A]/10 transition-colors group text-xs">
                                                        <div className="p-1.5 bg-[#BE0F4A]/10 text-[#BE0F4A] rounded-lg shrink-0">
                                                            <FileText size={12}/>
                                                        </div>
                                                        <span className="font-semibold text-[#291136] truncate flex-1">{d.nombre_original}</span>
                                                        <Download size={11} className="text-[#BE0F4A]/40 group-hover:text-[#BE0F4A] shrink-0"/>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-400 text-center py-8">Sin movimientos registrados.</p>
            )}
        </div>
    );

    const PartesPanel = (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-[#291136] flex items-center gap-2">
                    <Users size={17} className="text-[#BE0F4A]"/> Partes y Actores
                </h2>
                {puedeGestionarActores && (
                    <button onClick={abrirModalActores}
                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 transition-colors">
                        <UserPlus size={13}/> Agregar
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {actores.filter(a => a.activo).map(actor => {
                    const nombre      = actor.usuario?.name  ?? actor.nombre_externo ?? '—';
                    const email       = actor.usuario?.email ?? actor.email_externo  ?? '';
                    const esInmutable = SLUGS_INMUTABLES.includes(actor.tipo_actor?.slug);
                    return (
                        <div key={actor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#291136]/10 flex items-center justify-center shrink-0">
                                    <User size={13} className="text-[#291136]"/>
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm text-[#291136] truncate">{nombre}</div>
                                    {email && <div className="text-xs text-gray-400 truncate">{email}</div>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-[#BE0F4A]/10 text-[#BE0F4A] whitespace-nowrap">
                                    {actor.tipo_actor?.nombre}
                                </span>
                                {puedeGestionarActores && !esInmutable && (
                                    <button onClick={() => handleRemoverActor(actor.id)}
                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                        <Trash2 size={12}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {actores.filter(a => a.activo).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">No hay actores asignados.</p>
                )}
            </div>
        </div>
    );

    const DocsPanel = (
        <div className="space-y-5">
            {/* Documentos de la solicitud original */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-bold text-[#291136] mb-4 flex items-center gap-2">
                    <FileText size={17} className="text-[#BE0F4A]"/> Anexos de la Solicitud
                </h2>
                {solicitud?.documentos?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {solicitud.documentos.map(doc => (
                            <a key={doc.id} href={`/storage/${doc.ruta_archivo}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#BE0F4A] transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-[#BE0F4A]/10 text-[#BE0F4A] rounded-lg shrink-0">
                                        <FileText size={14}/>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 truncate">{doc.nombre_original}</span>
                                </div>
                                <Download size={14} className="text-gray-400 group-hover:text-[#BE0F4A] shrink-0"/>
                            </a>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-6">No hay documentos adjuntos.</p>
                )}
            </div>

            {/* Slots de documentos de la actividad actual */}
            {requisitosConArchivos?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-base font-bold text-[#291136] mb-1 flex items-center gap-2">
                        <FolderOpen size={17} className="text-purple-500"/> Documentos de la Actividad Actual
                    </h2>
                    <p className="text-xs text-gray-400 mb-4">Documentos requeridos en la etapa actual del expediente.</p>
                    <div className="space-y-3">
                        {requisitosConArchivos.map(req => (
                            <div key={req.id} className={`p-4 rounded-xl border ${req.archivo_actual ? 'bg-purple-50 border-purple-100' : req.es_obligatorio ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold text-[#291136]">{req.nombre}</span>
                                            {req.es_obligatorio && !req.archivo_actual && (
                                                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-md">Pendiente</span>
                                            )}
                                            {req.archivo_actual && (
                                                <span className="text-[10px] font-bold text-white bg-purple-500 px-1.5 py-0.5 rounded-md">Subido</span>
                                            )}
                                        </div>
                                        {req.descripcion && (
                                            <p className="text-xs text-gray-500">{req.descripcion}</p>
                                        )}
                                    </div>
                                    {req.archivo_actual && (
                                        <a href={`/storage/${req.archivo_actual.ruta_archivo}`} target="_blank" rel="noopener noreferrer"
                                            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                                            <Download size={12}/> Ver
                                        </a>
                                    )}
                                </div>
                                {req.archivo_actual && (
                                    <p className="text-[11px] text-purple-500 mt-1.5 truncate">
                                        {req.archivo_actual.nombre_original}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-3 italic">
                        Los documentos de slot se suben al ejecutar una acción desde el panel de acciones.
                    </p>
                </div>
            )}
        </div>
    );

    // Mini timeline para la columna derecha (desktop)
    const MiniTimeline = expediente.movimientos?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <History size={12}/> Últimos movimientos
            </h3>
            <div className="space-y-3">
                {expediente.movimientos.slice(0, 3).map((mov, idx) => (
                    <div key={mov.id} className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            idx === 0 ? 'bg-[#BE0F4A]/10 text-[#BE0F4A]' : 'bg-gray-100 text-gray-400'
                        }`}>
                            {idx === 0 ? <CheckCircle size={12}/> : <FilePlus size={11}/>}
                        </div>
                        <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#291136] truncate">
                                {mov.actividad_destino?.nombre || 'Inicio'}
                            </div>
                            <div className="text-[10px] text-gray-400">
                                {new Date(mov.fecha_movimiento).toLocaleDateString('es-PE')}
                                {' · '}{mov.usuario?.name || 'Sistema'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Slot de documento requerido para la transición actual (si está pendiente)
    const slotGate = modalAction?.requisito_documento_id
        ? requisitosConArchivos.find(r => r.id === modalAction.requisito_documento_id)
        : null;
    const slotGatePendiente = modalAction?.slot_cubierto === false;

    // Otros slots de la actividad (excluyendo el gate si ya lo mostramos arriba)
    const otrosSlots = requisitosConArchivos.filter(r =>
        r.id !== modalAction?.requisito_documento_id
    );

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <AuthenticatedLayout>
            <Head title={`Expediente: ${expediente.numero_expediente || solicitud?.numero_cargo}`} />

            {/* ── CABECERA STICKY ── */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
                    <Link href={route('expedientes.index')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-[#BE0F4A] transition-colors mb-1.5">
                        <ArrowLeft size={13}/> Bandeja de Expedientes
                    </Link>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-[#291136] font-mono tracking-tight leading-none">
                                    {expediente.numero_expediente || solicitud?.numero_cargo}
                                </h1>
                                <EstadoBadge estado={expediente.estado} />
                            </div>
                            <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500 flex-wrap">
                                <span className="text-gray-400">{expediente.etapa_actual?.nombre || 'Inicial'}</span>
                                <ChevronRight size={11} className="text-gray-300"/>
                                <span className="font-bold text-[#BE0F4A] bg-[#BE0F4A]/5 px-2 py-0.5 rounded-md">
                                    {expediente.actividad_actual?.nombre}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* ── Mobile: Acciones primero ── */}
                <div className="lg:hidden space-y-3 mb-6">
                    {PlazoWidget}
                    {AccionesPanel}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── COLUMNA PRINCIPAL: Tabs ── */}
                    <div className="lg:col-span-2">

                        {/* Tab Bar */}
                        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
                            {TABS.map(({ id, label, Icon }) => (
                                <button key={id} onClick={() => setActiveTab(id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-2 rounded-xl transition-all
                                        ${activeTab === id
                                            ? 'bg-white text-[#291136] shadow-sm'
                                            : 'text-gray-400 hover:text-gray-600'}`}>
                                    <Icon size={13}/>
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'historial' && HistorialPanel}
                        {activeTab === 'partes'    && PartesPanel}
                        {activeTab === 'docs'      && DocsPanel}
                    </div>

                    {/* ── COLUMNA DERECHA (desktop): Sticky ── */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[73px] space-y-4">
                            {PlazoWidget}
                            {AccionesPanel}
                            {MiniTimeline}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                MODAL DINÁMICO DEL MOTOR DE FLUJOS
            ══════════════════════════════════════════════════════════ */}
            <Modal show={modalAction !== null} onClose={cerrarModal} maxWidth="lg">
                {modalAction && (
                    <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-lg font-bold text-[#291136]">{modalAction.etiqueta_boton}</h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Confirme los datos antes de continuar. Esta acción avanzará el expediente.
                                </p>
                            </div>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                                <XCircle size={20}/>
                            </button>
                        </div>

                        <form onSubmit={ejecutarAccion} className="space-y-5">

                            {/* ① Número oficial (solo cuando aplica) */}
                            {!expediente.numero_expediente && (
                                modalAction.etiqueta_boton.toLowerCase().includes('aceptar') ||
                                modalAction.etiqueta_boton.toLowerCase().includes('admitir')
                            ) && (
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                                    <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wide mb-2">
                                        N° Oficial de Expediente <span className="text-[#BE0F4A]">*</span>
                                    </label>
                                    <input type="text" required placeholder="Ej: EXP-001-2026-CARD"
                                        value={data.numero_expediente}
                                        onChange={e => setData('numero_expediente', e.target.value)}
                                        className="w-full border border-emerald-300 rounded-xl px-4 py-2 text-sm font-mono font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"/>
                                    <p className="text-[10px] text-emerald-700 mt-1">Este número será el identificador oficial del caso.</p>
                                </div>
                            )}

                            {/* ② Documento de slot requerido para ESTA acción */}
                            {slotGate && (
                                <div className={`rounded-xl border p-4 ${slotGatePendiente ? 'bg-amber-50 border-amber-300' : 'bg-purple-50 border-purple-200'}`}>
                                    <div className={`flex items-center gap-2 mb-3 font-bold text-sm ${slotGatePendiente ? 'text-amber-800' : 'text-purple-800'}`}>
                                        {slotGatePendiente
                                            ? <><AlertTriangle size={16}/> Documento necesario para ejecutar esta acción</>
                                            : <><CheckCircle size={16}/> Documento ya adjunto (puede actualizarlo)</>
                                        }
                                    </div>
                                    <FileZone
                                        label={slotGate.nombre}
                                        sublabel={slotGate.descripcion ?? undefined}
                                        required={slotGatePendiente}
                                        value={data.documentos_requisito[slotGate.id] ?? null}
                                        onChange={e => {
                                            const f = e.target.files[0] ?? null;
                                            setData('documentos_requisito', { ...data.documentos_requisito, [slotGate.id]: f });
                                        }}
                                    />
                                    {slotGate.archivo_actual && !data.documentos_requisito[slotGate.id] && (
                                        <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                                            <Paperclip size={11}/> Archivo actual: {slotGate.archivo_actual.nombre_original}
                                        </p>
                                    )}
                                    {errors[`documentos_requisito.${slotGate.id}`] && (
                                        <p className="text-red-500 text-xs mt-1">{errors[`documentos_requisito.${slotGate.id}`]}</p>
                                    )}
                                </div>
                            )}

                            {/* ③ Otros slots de la actividad (actualización opcional) */}
                            {otrosSlots.length > 0 && (
                                <details className="group">
                                    <summary className="cursor-pointer text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wide flex items-center gap-1.5 list-none select-none">
                                        <FolderOpen size={12}/> Actualizar otros documentos del expediente
                                        <span className="font-normal normal-case">(opcional)</span>
                                    </summary>
                                    <div className="mt-3 space-y-3 pl-1">
                                        {otrosSlots.map(req => (
                                            <div key={req.id}>
                                                <FileZone
                                                    label={req.nombre}
                                                    sublabel={req.archivo_actual ? `Archivo actual: ${req.archivo_actual.nombre_original}` : undefined}
                                                    required={false}
                                                    value={data.documentos_requisito[req.id] ?? null}
                                                    onChange={e => {
                                                        const f = e.target.files[0] ?? null;
                                                        setData('documentos_requisito', { ...data.documentos_requisito, [req.id]: f });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            )}

                            {/* ④ Documentos del movimiento (anexos generales) */}
                            {modalAction.permite_documento !== 0 && (
                                <FileZone
                                    label="Adjuntar documentos a esta acción"
                                    required={!!modalAction.requiere_documento}
                                    multiple
                                    value={data.documentos_movimiento?.length ? data.documentos_movimiento : null}
                                    onChange={e => setData('documentos_movimiento', Array.from(e.target.files))}
                                />
                            )}
                            {errors.documentos_movimiento && (
                                <p className="text-red-500 text-xs -mt-3">{errors.documentos_movimiento}</p>
                            )}

                            {/* ⑤ Observaciones */}
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Observaciones / Motivo{' '}
                                    {modalAction.requiere_observacion
                                        ? <span className="text-[10px] font-bold text-white bg-[#BE0F4A] px-1.5 py-0.5 rounded-md ml-1">Requerido</span>
                                        : <span className="text-gray-400 font-normal normal-case">(opcional)</span>
                                    }
                                </label>
                                <textarea rows={3} required={!!modalAction.requiere_observacion}
                                    placeholder="Detalle sus notas, instrucciones o el motivo de esta acción..."
                                    value={data.observaciones}
                                    onChange={e => setData('observaciones', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136] resize-none"/>
                                {errors.observaciones && <p className="text-red-500 text-xs mt-1">{errors.observaciones}</p>}
                            </div>

                            {/* ⑥ Notificaciones */}
                            {modalAction.permite_notificar && actoresNotificables.length > 0 && (
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                        <Bell size={12} className="text-[#BE0F4A]"/> Notificar por correo
                                        <span className="font-normal text-gray-400 normal-case">(opcional)</span>
                                    </label>
                                    <div className="space-y-1.5 bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        {actoresNotificables.map(actor => {
                                            const esSelf  = actor.usuario?.id === auth?.user?.id;
                                            const nombre  = actor.usuario?.name  ?? actor.nombre_externo ?? '—';
                                            const email   = actor.usuario?.email ?? actor.email_externo  ?? '';
                                            const checked = data.notificar_a.includes(actor.id);
                                            return (
                                                <label key={actor.id}
                                                    className={`flex items-start gap-3 cursor-pointer rounded-lg px-2 py-1.5 transition-colors ${esSelf ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}>
                                                    <input type="checkbox"
                                                        checked={checked && !esSelf}
                                                        disabled={esSelf}
                                                        onChange={e => setData('notificar_a', e.target.checked
                                                            ? [...data.notificar_a, actor.id]
                                                            : data.notificar_a.filter(id => id !== actor.id)
                                                        )}
                                                        className="mt-0.5 w-4 h-4 rounded accent-[#291136] shrink-0"/>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-[#291136] leading-tight">
                                                            {nombre}{esSelf && <span className="ml-1 text-xs text-gray-400 font-normal">(Usted)</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-400 truncate">{email} — {actor.tipo_actor?.nombre}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {errors.general && (
                                <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{errors.general}</p>
                            )}

                            <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
                                <button type="button" onClick={cerrarModal}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] shadow-lg disabled:opacity-50 flex items-center gap-2 transition-colors">
                                    {processing ? 'Procesando...' : 'Confirmar'} <CheckCircle size={15}/>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>

            {/* ── MODAL OVERRIDE DE PLAZO ── */}
            <Modal show={modalPlazo} onClose={cerrarModalPlazo} maxWidth="sm">
                <form onSubmit={handleGuardarPlazo}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#291136]">
                                <Clock size={18} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#291136]">Ajustar Plazo</h3>
                                {plazo?.dias_default && (
                                    <p className="text-xs text-gray-400">Por defecto: <strong>{plazo.dias_default} día(s)</strong></p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Nuevo plazo (días) <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <input type="number" required min={1} max={3650}
                                    value={plazoData.dias_plazo}
                                    onChange={e => setPlazoData('dias_plazo', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"/>
                                {plazoErrors.dias_plazo && <p className="text-red-500 text-xs mt-1">{plazoErrors.dias_plazo}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Motivo <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <textarea required rows={3} placeholder="Razón del ajuste..."
                                    value={plazoData.motivo}
                                    onChange={e => setPlazoData('motivo', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136] resize-none"/>
                                {plazoErrors.motivo && <p className="text-red-500 text-xs mt-1">{plazoErrors.motivo}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                        <div>
                            {plazo?.tiene_override && (
                                <button type="button" onClick={handleEliminarOverride} disabled={plazoProcessing}
                                    className="text-xs font-semibold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50">
                                    Restaurar por defecto
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={cerrarModalPlazo} disabled={plazoProcessing}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                Cancelar
                            </button>
                            <button type="submit" disabled={plazoProcessing}
                                className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg disabled:opacity-50 transition-colors">
                                {plazoProcessing ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* ── MODAL AGREGAR ACTOR ── */}
            <Modal show={modalActores} onClose={cerrarModalActores} maxWidth="sm">
                <form onSubmit={handleAgregarActor}>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#BE0F4A]">
                                <UserPlus size={18} className="text-white"/>
                            </div>
                            <h3 className="text-lg font-bold text-[#291136]">Agregar Actor al Expediente</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Tipo de Actor <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <select required value={actorData.tipo_actor_id}
                                    onChange={e => setActorData('tipo_actor_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A]">
                                    <option value="">— Seleccione un tipo —</option>
                                    {tiposActor.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                </select>
                                {actorErrors.tipo_actor_id && <p className="text-red-500 text-xs mt-1 font-semibold">{actorErrors.tipo_actor_id}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Usuario <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <select required value={actorData.usuario_id}
                                    onChange={e => setActorData('usuario_id', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A]">
                                    <option value="">— Seleccione un usuario —</option>
                                    {usuariosAsignables.map(u => <option key={u.id} value={u.id}>{u.name} — {u.email}</option>)}
                                </select>
                                {actorErrors.usuario_id && <p className="text-red-500 text-xs mt-1 font-semibold">{actorErrors.usuario_id}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                        <button type="button" onClick={cerrarModalActores} disabled={actorProcessing}
                            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={actorProcessing}
                            className="px-5 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] shadow-lg disabled:opacity-50 transition-colors">
                            {actorProcessing ? 'Guardando...' : 'Asignar Actor'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
