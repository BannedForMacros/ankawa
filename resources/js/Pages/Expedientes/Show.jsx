import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { 
    ArrowLeft, FileText, Download, User, Users, Scale, 
    History, CheckCircle, AlertTriangle, XCircle, FilePlus, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Badge de Estado ──
function EstadoBadge({ estado }) {
    const map = {
        en_proceso: { color: 'bg-blue-100 text-blue-800',   label: 'En Proceso' },
        resuelto:   { color: 'bg-green-100 text-green-800', label: 'Resuelto'   },
        archivado:  { color: 'bg-gray-100 text-gray-800',   label: 'Archivado'  },
    };
    const s = map[estado] ?? { color: 'bg-gray-100 text-gray-500', label: estado };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
        </span>
    );
}

export default function Show({ expediente, puedeActuar, transiciones }) {
    const solicitud = expediente.solicitud;
    const actores = expediente.actores || [];
    
    // Extraer actores para mostrarlos fácil
    const demandante = actores.find(a => a.tipo_actor?.slug === 'demandante')?.usuario;
    const demandado = actores.find(a => a.tipo_actor?.slug === 'demandado')?.usuario;

    // ── ESTADOS DEL MODAL DINÁMICO ──
    const [modalAction, setModalAction] = useState(null); // Guarda la transición seleccionada
    
    const { data, setData, post, processing, errors, reset } = useForm({
        transicion_id: '',
        observaciones: '',
        numero_expediente: '', // Solo si no tiene número aún
        documentos_movimiento: []
    });

    const abrirModalAccion = (transicion) => {
        reset();
        setData('transicion_id', transicion.id);
        setModalAction(transicion);
    };

    const cerrarModal = () => {
        setModalAction(null);
        reset();
    };

    const ejecutarAccion = (e) => {
        e.preventDefault();
        // Usamos post hacia la ruta del motor
        post(route('expedientes.accion', expediente.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                cerrarModal();
            },
            onError: () => toast.error('Revise los campos requeridos.')
        });
    };
console.log("TRANSICIONES RECIBIDAS DEL BACKEND:", transiciones);
    return (
        <AuthenticatedLayout>
            <Head title={`Expediente: ${expediente.numero_expediente || solicitud.numero_cargo}`} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* ── CABECERA ── */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <Link href={route('expedientes.index')} className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#BE0F4A] mb-2 transition-colors">
                                <ArrowLeft size={16} className="mr-1" /> Volver a Bandeja
                            </Link>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold text-[#291136] font-mono">
                                    {expediente.numero_expediente || solicitud.numero_cargo}
                                </h1>
                                <EstadoBadge estado={expediente.estado} />
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span><strong>Etapa:</strong> {expediente.etapa_actual?.nombre || 'Inicial'}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded">
                                    {expediente.actividad_actual?.nombre}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* ── COLUMNA IZQUIERDA: DATOS DEL CASO ── */}
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Panel Actores */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-[#291136] mb-4 flex items-center gap-2">
                                    <Users size={20} className="text-[#BE0F4A]" /> Partes Involucradas
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Demandante</div>
                                        <div className="font-semibold text-[#291136]">{demandante?.name || solicitud.nombre_demandante}</div>
                                        <div className="text-sm text-gray-500">{demandante?.email || solicitud.email_demandante}</div>
                                        <div className="text-sm text-gray-500">Doc: {demandante?.numero_documento || solicitud.documento_demandante}</div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Demandado</div>
                                        <div className="font-semibold text-[#291136]">{demandado?.name || solicitud.nombre_demandado}</div>
                                        <div className="text-sm text-gray-500">{demandado?.email || solicitud.email_demandado || 'No registrado'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Controversia */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-[#291136] mb-4 flex items-center gap-2">
                                    <Scale size={20} className="text-[#BE0F4A]" /> Resumen de la Controversia
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Hechos y Resumen</div>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">
                                            {solicitud.resumen_controversia}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Pretensiones</div>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl leading-relaxed">
                                            {solicitud.pretensiones}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-bold text-gray-400 uppercase tracking-wide">Monto Involucrado:</span>
                                        <span className="font-mono font-bold text-[#291136] bg-green-50 text-green-700 px-3 py-1 rounded-lg">
                                            S/ {solicitud.monto_involucrado ? Number(solicitud.monto_involucrado).toLocaleString('es-PE') : 'Indeterminado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Panel Documentos Iniciales */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-[#291136] mb-4 flex items-center gap-2">
                                    <FileText size={20} className="text-[#BE0F4A]" /> Anexos de la Solicitud
                                </h2>
                                {solicitud.documentos?.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {solicitud.documentos.map(doc => (
                                            <a key={doc.id} href={`/storage/${doc.ruta_archivo}`} target="_blank" rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-[#BE0F4A] transition-colors group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="p-2 bg-[#BE0F4A]/10 text-[#BE0F4A] rounded-lg shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-700 truncate">{doc.nombre_original}</span>
                                                </div>
                                                <Download size={16} className="text-gray-400 group-hover:text-[#BE0F4A] shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">No hay documentos adjuntos.</p>
                                )}
                            </div>

                        </div>

                        {/* ── COLUMNA DERECHA: MOTOR DE FLUJO Y TIMELINE ── */}
                        <div className="space-y-6">
                            
                            {/* PANEL DINÁMICO DE ACCIONES (EL MOTOR) */}
                            <div className="bg-[#291136] rounded-2xl shadow-lg border border-[#4A153D] p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#BE0F4A] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                                
                                <h2 className="text-lg font-bold mb-2 relative z-10">Acciones Requeridas</h2>
                                
                                {!puedeActuar ? (
                                    <p className="text-sm text-white/60 relative z-10">
                                        El expediente está en manos de otro actor o en espera. No tiene acciones pendientes en esta actividad.
                                    </p>
                                ) : (
                                    <div className="space-y-3 relative z-10 mt-4">
                                        {transiciones?.length > 0 ? transiciones.map(t => (
                                            <button key={t.id} onClick={() => abrirModalAccion(t)}
                                                className="w-full flex items-center justify-between bg-white text-[#291136] px-4 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 hover:scale-[1.02] transition-all shadow-md">
                                                {t.etiqueta_boton}
                                                <ChevronRight size={16} className="text-[#BE0F4A]"/>
                                            </button>
                                        )) : (
                                            <p className="text-sm text-white/60">No hay transiciones configuradas para esta actividad.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* HISTORIAL DE MOVIMIENTOS */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                    <History size={20} className="text-[#BE0F4A]" /> Historial del Caso
                                </h2>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    
                                    {expediente.movimientos?.map((mov, idx) => (
                                        <div key={mov.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icono central */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#BE0F4A] text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                {idx === 0 ? <CheckCircle size={16}/> : <FilePlus size={16}/>}
                                            </div>
                                            
                                            {/* Tarjeta de historial */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-[#291136] text-sm">{mov.actividad_destino?.nombre || 'Movimiento'}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mb-2">{new Date(mov.fecha_movimiento).toLocaleString()} por {mov.usuario?.name || 'Sistema'}</div>
                                                <p className="text-sm text-gray-700 leading-relaxed">{mov.observaciones}</p>
                                            </div>
                                        </div>
                                    ))}
                                    
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL DINÁMICO DEL MOTOR DE FLUJOS ── */}
            <Modal show={modalAction !== null} onClose={cerrarModal} maxWidth="lg">
                {modalAction && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-[#291136] flex items-center gap-2">
                                <AlertTriangle size={20} className="text-[#BE0F4A]"/>
                                {modalAction.etiqueta_boton}
                            </h2>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={ejecutarAccion} className="space-y-5">
                            
                            {/* Inyección de Número de Expediente si la transición avanza a una etapa oficial y aún no tiene N° */}
                            {!expediente.numero_expediente && (modalAction.etiqueta_boton.toLowerCase().includes('aceptar') || modalAction.etiqueta_boton.toLowerCase().includes('admitir')) && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                    <label className="block text-xs font-bold text-green-900 uppercase tracking-wide mb-2">
                                        N° Oficial de Expediente <span className="text-red-500">*</span>
                                    </label>
                                    <input type="text" required
                                        placeholder="Ej: EXP-001-2026-CARD"
                                        value={data.numero_expediente}
                                        onChange={e => setData('numero_expediente', e.target.value)}
                                        className="w-full border border-green-300 rounded-xl px-4 py-2 text-sm font-mono font-bold text-green-900 focus:ring-green-500" />
                                    <p className="text-[10px] text-green-700 mt-1">Requerido para hacer oficial el caso.</p>
                                </div>
                            )}

                            {/* Campo de Observaciones Dinámico */}
                            <div>
                                <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                    Observaciones / Motivo {modalAction.requiere_observacion && <span className="text-[#BE0F4A]">*</span>}
                                </label>
                                <textarea rows={4} required={modalAction.requiere_observacion}
                                    placeholder="Detalle sus notas, motivos o instrucciones..."
                                    value={data.observaciones}
                                    onChange={e => setData('observaciones', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[#BE0F4A] resize-none" />
                                {errors.observaciones && <p className="text-red-500 text-xs mt-1">{errors.observaciones}</p>}
                            </div>

                            {/* Carga de Documentos Dinámica */}
                            {(modalAction.requiere_documento || true) && ( // Muestro siempre pero el 'required' depende
                                <div>
                                    <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                        Adjuntar Documento/Resolución {modalAction.requiere_documento && <span className="text-[#BE0F4A]">*</span>}
                                    </label>
                                    <input type="file" multiple accept=".pdf,.doc,.docx"
                                        required={modalAction.requiere_documento}
                                        onChange={e => setData('documentos_movimiento', Array.from(e.target.files))}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#291136]/5 file:text-[#291136] hover:file:bg-[#291136]/10 cursor-pointer border border-gray-200 rounded-xl" />
                                    {errors.documentos_movimiento && <p className="text-red-500 text-xs mt-1">{errors.documentos_movimiento}</p>}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={cerrarModal} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] shadow-lg disabled:opacity-50 flex items-center gap-2">
                                    {processing ? 'Procesando...' : 'Confirmar Acción'} <CheckCircle size={16}/>
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}