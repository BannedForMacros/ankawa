import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download, PlusCircle, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const TIPO_LABELS = {
    requerimiento: { label: 'Requerimiento', desc: 'Requiere respuesta del actor asignado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    notificacion:  { label: 'Traslado / Notificación', desc: 'Solo se notifica, no requiere respuesta', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    propia:        { label: 'Actuación Propia', desc: 'Registra acción del gestor, se marca completada', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ── Formulario de movimiento de seguimiento (inline) ────────────────────────
function MovimientoSeguimientoForm({ expediente, etapas, sugerencia, onChange }) {
    const actoresActivos = expediente.actores?.filter(a => a.activo && a.usuario) ?? [];
    const etapaSel = etapas.find(e => String(e.id) === String(sugerencia.etapa_id));
    const subEtapas = etapaSel?.sub_etapas ?? [];
    const tipo = sugerencia.tipo ?? 'requerimiento';
    const tipoInfo = TIPO_LABELS[tipo];
    const esPropia = tipo === 'propia';

    return (
        <div className="space-y-3 pt-3 border-t border-dashed border-gray-200">

            {/* Tipo de movimiento */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo de movimiento</label>
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(TIPO_LABELS).map(([key, info]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange('tipo', key)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                tipo === key ? info.color + ' ring-1 ring-current' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {info.label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">{tipoInfo.desc}</p>
            </div>

            {/* Etapa + Sub-etapa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Etapa *</label>
                    <select
                        value={sugerencia.etapa_id}
                        onChange={e => { onChange('etapa_id', e.target.value); onChange('sub_etapa_id', ''); }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    >
                        <option value="">— Seleccione etapa —</option>
                        {etapas.map(et => (
                            <option key={et.id} value={et.id}>{et.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-etapa</label>
                    <select
                        value={sugerencia.sub_etapa_id}
                        onChange={e => onChange('sub_etapa_id', e.target.value)}
                        disabled={subEtapas.length === 0}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        <option value="">— Sin sub-etapa —</option>
                        {subEtapas.map(se => (
                            <option key={se.id} value={se.id}>{se.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Instrucción */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucción / Descripción *</label>
                <textarea
                    value={sugerencia.instruccion}
                    onChange={e => onChange('instruccion', e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Ej: Apersonamiento requerido..."
                />
            </div>

            {/* Actor responsable + Días plazo (solo para requerimiento y notificacion) */}
            {!esPropia && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                            {tipo === 'notificacion' ? 'Actor a notificar' : 'Actor responsable'}
                        </label>
                        <select
                            value={sugerencia.usuario_responsable_id}
                            onChange={e => {
                                const actor = actoresActivos.find(a => String(a.usuario_id) === e.target.value);
                                onChange('usuario_responsable_id', e.target.value);
                                onChange('tipo_actor_responsable_id', actor?.tipo_actor_id ?? '');
                            }}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="">— Seleccionar actor —</option>
                            {actoresActivos.map(a => (
                                <option key={a.usuario_id} value={a.usuario_id}>
                                    {a.usuario.name} ({a.tipo_actor?.nombre ?? '?'})
                                </option>
                            ))}
                        </select>
                    </div>
                    {tipo === 'requerimiento' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Días plazo</label>
                            <input
                                type="number" min="1" max="365"
                                value={sugerencia.dias_plazo}
                                onChange={e => onChange('dias_plazo', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                placeholder="Ej: 5"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const movDataVacio = (expediente) => ({
    tipo:                      'requerimiento',
    etapa_id:                  String(expediente.etapa_actual_id ?? ''),
    sub_etapa_id:              '',
    instruccion:               '',
    tipo_actor_responsable_id: '',
    usuario_responsable_id:    '',
    dias_plazo:                '',
});

export default function TabSolicitud({ expediente, solicitud, esGestor = false, etapas = [], actoresNotificables = [] }) {
    const [editando, setEditando]           = useState(false);
    const [paso, setPaso]                   = useState('idle'); // idle | conforme | no_conforme
    const [motivoNoConforme, setMotivoNoConforme] = useState('');
    const [movimientos, setMovimientos]     = useState([]);  // lista de movimientos a crear
    const [notificarA, setNotificarA]       = useState(actoresNotificables.map(a => a.id));
    const [procesando, setProcesando]       = useState(false);
    const [errores, setErrores]             = useState({});

    function agregarMovimiento(sugerencia = {}) {
        setMovimientos(prev => [...prev, { ...movDataVacio(expediente), ...sugerencia }]);
    }

    function actualizarMovimiento(idx, field, value) {
        setMovimientos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    }

    function quitarMovimiento(idx) {
        setMovimientos(prev => prev.filter((_, i) => i !== idx));
    }

    function moverMovimiento(idx, dir) {
        setMovimientos(prev => {
            const arr = [...prev];
            const swap = idx + dir;
            if (swap < 0 || swap >= arr.length) return prev;
            [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
            return arr;
        });
    }

    function iniciarConforme() {
        const demandante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandante');
        const demandado  = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandado');
        const plazoApers = expediente.servicio?.plazo_apersonamiento_dias ?? '';
        setMovimientos([
            {
                tipo:                      'notificacion',
                etapa_id:                  String(expediente.etapa_actual_id ?? ''),
                sub_etapa_id:              '',
                instruccion:               'Conformidad de la solicitud: La solicitud ha sido declarada CONFORME.',
                tipo_actor_responsable_id: String(demandante?.tipo_actor_id ?? ''),
                usuario_responsable_id:    String(demandante?.usuario_id ?? ''),
                dias_plazo:                '',
            },
            {
                tipo:                      'requerimiento',
                etapa_id:                  String(expediente.etapa_actual_id ?? ''),
                sub_etapa_id:              '',
                instruccion:               'Traslado al demandado: Debe apersonarse al proceso en el plazo indicado.',
                tipo_actor_responsable_id: String(demandado?.tipo_actor_id ?? ''),
                usuario_responsable_id:    String(demandado?.usuario_id ?? ''),
                dias_plazo:                String(plazoApers),
            },
        ]);
        setNotificarA(actoresNotificables.map(a => a.id));
        setPaso('conforme');
        setErrores({});
    }

    function iniciarNoConforme() {
        const demandante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandante');
        const plazo = expediente.servicio?.plazo_subsanacion_dias ?? '';
        setMovimientos([
            {
                tipo:                      'requerimiento',
                etapa_id:                  String(expediente.etapa_actual_id ?? ''),
                sub_etapa_id:              '',
                instruccion:               '',
                tipo_actor_responsable_id: String(demandante?.tipo_actor_id ?? ''),
                usuario_responsable_id:    String(demandante?.usuario_id ?? ''),
                dias_plazo:                String(plazo),
            },
        ]);
        setNotificarA(actoresNotificables.map(a => a.id));
        setPaso('no_conforme');
        setErrores({});
    }

    function buildPayload(resultado) {
        const payload = { resultado, notificar_a: notificarA };
        if (resultado === 'no_conforme') {
            payload.motivo_no_conformidad = motivoNoConforme;
        }
        payload.movimientos = movimientos.map(m => ({
            tipo:                       m.tipo || 'requerimiento',
            etapa_id:                   m.etapa_id || null,
            sub_etapa_id:               m.sub_etapa_id || null,
            instruccion:                m.instruccion,
            tipo_actor_responsable_id:  m.tipo_actor_responsable_id || null,
            usuario_responsable_id:     m.usuario_responsable_id || null,
            dias_plazo:                 m.dias_plazo || null,
        }));
        return payload;
    }

    function confirmar(resultado) {
        if (resultado === 'no_conforme' && !motivoNoConforme.trim()) {
            setErrores({ motivo_no_conformidad: 'El motivo es obligatorio.' });
            return;
        }
        for (let i = 0; i < movimientos.length; i++) {
            if (!movimientos[i].instruccion.trim()) {
                setErrores({ [`mov_${i}_instruccion`]: `Movimiento ${i + 1}: La instrucción es obligatoria.` });
                return;
            }
            if (!movimientos[i].etapa_id) {
                setErrores({ [`mov_${i}_etapa`]: `Movimiento ${i + 1}: Selecciona una etapa.` });
                return;
            }
        }
        setProcesando(true);
        setErrores({});
        router.post(
            route('expedientes.conformidad', expediente.id),
            buildPayload(resultado),
            {
                onFinish:  () => setProcesando(false),
                onError:   errs => setErrores(errs),
                onSuccess: () => setPaso('idle'),
            }
        );
    }

    // ── Form edición ──
    const formEdit = useForm({
        nombre_demandante:       solicitud.nombre_demandante ?? '',
        documento_demandante:    solicitud.documento_demandante ?? '',
        nombre_representante:    solicitud.nombre_representante ?? '',
        documento_representante: solicitud.documento_representante ?? '',
        domicilio_demandante:    solicitud.domicilio_demandante ?? '',
        email_demandante:        solicitud.email_demandante ?? '',
        telefono_demandante:     solicitud.telefono_demandante ?? '',
        nombre_demandado:        solicitud.nombre_demandado ?? '',
        domicilio_demandado:     solicitud.domicilio_demandado ?? '',
        email_demandado:         solicitud.email_demandado ?? '',
        telefono_demandado:      solicitud.telefono_demandado ?? '',
        resumen_controversia:    solicitud.resumen_controversia ?? '',
        pretensiones:            solicitud.pretensiones ?? '',
        monto_involucrado:       solicitud.monto_involucrado ?? '',
    });

    function guardarEdicion(e) {
        e.preventDefault();
        formEdit.put(route('expedientes.solicitud.update', expediente.id), {
            onSuccess: () => setEditando(false),
        });
    }

    const campo = (label, value) => (
        <div>
            <span className="text-xs text-gray-400 block">{label}</span>
            <span className="text-sm font-semibold text-[#291136]">{value || '—'}</span>
        </div>
    );

    const inputField = (label, field, type = 'text', required = false) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label} {required && '*'}</label>
            <input
                type={type}
                value={formEdit.data[field]}
                onChange={e => formEdit.setData(field, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
            {formEdit.errors[field] && <p className="text-xs text-red-500 mt-1">{formEdit.errors[field]}</p>}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* ── Cabecera con botón editar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#291136]">Datos de la Solicitud</h3>
                    <div className="flex items-center gap-2">
                        {solicitud.resultado_revision && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                solicitud.resultado_revision === 'conforme'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                                {solicitud.resultado_revision === 'conforme' ? 'CONFORME' : 'NO CONFORME'}
                            </span>
                        )}
                        {esGestor && !editando && (
                            <button
                                onClick={() => setEditando(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors"
                            >
                                <Pencil size={12}/> Editar
                            </button>
                        )}
                    </div>
                </div>

                {editando ? (
                    <form onSubmit={guardarEdicion} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inputField('Nombre completo', 'nombre_demandante', 'text', true)}
                                {inputField('Documento de identidad', 'documento_demandante', 'text', true)}
                                {inputField('Representante', 'nombre_representante')}
                                {inputField('Doc. Representante', 'documento_representante')}
                                {inputField('Domicilio', 'domicilio_demandante', 'text', true)}
                                {inputField('Email', 'email_demandante', 'email', true)}
                                {inputField('Teléfono', 'telefono_demandante', 'text', true)}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inputField('Nombre completo', 'nombre_demandado', 'text', true)}
                                {inputField('Domicilio', 'domicilio_demandado', 'text', true)}
                                {inputField('Email', 'email_demandado', 'email')}
                                {inputField('Teléfono', 'telefono_demandado')}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Resumen *</label>
                                    <textarea value={formEdit.data.resumen_controversia} onChange={e => formEdit.setData('resumen_controversia', e.target.value)} rows={4} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pretensiones *</label>
                                    <textarea value={formEdit.data.pretensiones} onChange={e => formEdit.setData('pretensiones', e.target.value)} rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"/>
                                </div>
                                {inputField('Monto involucrado (S/)', 'monto_involucrado', 'number')}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                            <button type="button" onClick={() => { setEditando(false); formEdit.reset(); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                                <X size={12} className="inline mr-1"/> Cancelar
                            </button>
                            <button type="submit" disabled={formEdit.processing} className="px-5 py-2 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campo('Nombre', solicitud.nombre_demandante)}
                                {campo('Documento', solicitud.documento_demandante)}
                                {campo('Tipo de persona', solicitud.tipo_persona)}
                                {campo('Representante', solicitud.nombre_representante)}
                                {campo('Doc. Representante', solicitud.documento_representante)}
                                {campo('Domicilio', solicitud.domicilio_demandante)}
                                {campo('Email', solicitud.email_demandante)}
                                {campo('Teléfono', solicitud.telefono_demandante)}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campo('Nombre', solicitud.nombre_demandado)}
                                {campo('Domicilio', solicitud.domicilio_demandado)}
                                {campo('Email', solicitud.email_demandado)}
                                {campo('Teléfono', solicitud.telefono_demandado)}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia y Pretensiones</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Resumen de la controversia</span>
                                    <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3">{solicitud.resumen_controversia || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Pretensiones</span>
                                    <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3">{solicitud.pretensiones || '—'}</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {campo('Monto involucrado', solicitud.monto_involucrado ? `S/ ${Number(solicitud.monto_involucrado).toLocaleString()}` : '—')}
                                    {campo('Solicita designación por Director', solicitud.solicita_designacion_director ? 'Sí' : 'No')}
                                    {campo('Árbitro propuesto', solicitud.nombre_arbitro_propuesto)}
                                    {campo('Reglas aplicables', solicitud.reglas_aplicables)}
                                </div>
                            </div>
                        </div>
                        {solicitud.documentos?.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Documentos Adjuntos</h4>
                                <div className="space-y-1.5">
                                    {solicitud.documentos.map(doc => (
                                        <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group">
                                            <FileText size={16} className="text-gray-400 group-hover:text-[#291136]"/>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-semibold text-[#291136] truncate block">{doc.nombre_original}</span>
                                                {doc.tipo_documento && <span className="text-[10px] text-gray-400">{doc.tipo_documento.nombre}</span>}
                                            </div>
                                            <Download size={14} className="text-gray-300 group-hover:text-[#291136]"/>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                        {solicitud.resultado_revision === 'no_conforme' && solicitud.motivo_no_conformidad && (
                            <div className="border-t border-gray-100 pt-4">
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                    <h4 className="text-xs font-bold text-red-600 mb-2">Motivo de No Conformidad</h4>
                                    <p className="text-sm text-red-800">{solicitud.motivo_no_conformidad}</p>
                                    {solicitud.fecha_revision && (
                                        <p className="text-[11px] text-red-400 mt-2">
                                            Registrado el {new Date(solicitud.fecha_revision).toLocaleDateString('es-PE')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Banner: esperando subsanación ── */}
            {esGestor && solicitud.estado === 'subsanacion' && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-amber-700 mb-1">⏳ Esperando subsanación del demandante</h3>
                    <p className="text-xs text-amber-700">
                        Se declaró NO CONFORME. Una vez que el demandante responda, podrás volver a revisar la conformidad desde esta sección.
                    </p>
                </div>
            )}

            {/* ── Panel de conformidad ── */}
            {esGestor && solicitud.resultado_revision !== 'conforme' && solicitud.estado !== 'subsanacion' && !editando && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-amber-700 mb-1">Revisión de Conformidad</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Revise los datos y declare si la solicitud es conforme o requiere subsanación.
                    </p>

                    {/* ── Estado idle: botones de elección ── */}
                    {paso === 'idle' && (
                        <div className="flex gap-3">
                            <button
                                onClick={iniciarConforme}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                <CheckCircle size={16}/> Declarar Conforme
                            </button>
                            <button
                                onClick={iniciarNoConforme}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                            >
                                <XCircle size={16}/> Declarar No Conforme
                            </button>
                        </div>
                    )}

                    {/* ── Panel CONFORME ── */}
                    {paso === 'conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <CheckCircle size={16} className="text-emerald-600 shrink-0"/>
                                <p className="text-sm font-bold text-emerald-700">
                                    Declarar solicitud como <strong>CONFORME</strong>. Se enviará email al demandado con credenciales de acceso.
                                </p>
                            </div>

                            {/* Lista de movimientos */}
                            {movimientos.map((mov, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-1 relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#291136] bg-[#291136]/5 px-2 py-0.5 rounded-full">
                                                #{idx + 1}
                                            </span>
                                            {movimientos.length > 1 && (
                                                <div className="flex gap-0.5">
                                                    <button type="button" onClick={() => moverMovimiento(idx, -1)} disabled={idx === 0}
                                                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                                        <ChevronUp size={12}/>
                                                    </button>
                                                    <button type="button" onClick={() => moverMovimiento(idx, 1)} disabled={idx === movimientos.length - 1}
                                                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                                        <ChevronDown size={12}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {movimientos.length > 1 && (
                                            <button type="button" onClick={() => quitarMovimiento(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                                                <Trash2 size={13}/>
                                            </button>
                                        )}
                                    </div>
                                    <MovimientoSeguimientoForm
                                        expediente={expediente}
                                        etapas={etapas}
                                        sugerencia={mov}
                                        onChange={(field, value) => actualizarMovimiento(idx, field, value)}
                                    />
                                    {errores[`mov_${idx}_instruccion`] && <p className="text-xs text-red-500">{errores[`mov_${idx}_instruccion`]}</p>}
                                    {errores[`mov_${idx}_etapa`]       && <p className="text-xs text-red-500">{errores[`mov_${idx}_etapa`]}</p>}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => agregarMovimiento()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#291136] border-2 border-dashed border-[#291136]/20 rounded-xl hover:border-[#291136]/40 hover:bg-[#291136]/5 transition-colors"
                            >
                                <PlusCircle size={14}/> Agregar otro movimiento
                            </button>

                            {actoresNotificables.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notificar a (email)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {actoresNotificables.map(actor => (
                                            <label key={actor.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={notificarA.includes(actor.id)}
                                                    onChange={e => setNotificarA(prev =>
                                                        e.target.checked ? [...prev, actor.id] : prev.filter(x => x !== actor.id)
                                                    )}
                                                    className="rounded border-gray-300 accent-[#291136]"
                                                />
                                                {actor.usuario?.name} ({actor.tipo_actor?.nombre})
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => confirmar('conforme')}
                                    disabled={procesando}
                                    className="px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {procesando ? 'Procesando...' : `Confirmar${movimientos.length > 0 ? ` y crear ${movimientos.length} movimiento(s)` : ''}`}
                                </button>
                                <button onClick={() => setPaso('idle')} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Panel NO CONFORME ── */}
                    {paso === 'no_conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                <XCircle size={16} className="text-red-600 shrink-0"/>
                                <p className="text-sm font-bold text-red-700">
                                    Declarar solicitud como <strong>NO CONFORME</strong>. Se habilitará subsanación para el demandante.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo de no conformidad *</label>
                                <textarea
                                    value={motivoNoConforme}
                                    onChange={e => {
                                        setMotivoNoConforme(e.target.value);
                                        if (movimientos.length > 0) {
                                            actualizarMovimiento(0, 'instruccion', `Subsanación requerida: ${e.target.value}`);
                                        }
                                    }}
                                    rows={3}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    placeholder="Indique los motivos por los que la solicitud no es conforme..."
                                />
                                {errores.motivo_no_conformidad && <p className="text-xs text-red-500 mt-1">{errores.motivo_no_conformidad}</p>}
                            </div>

                            {movimientos.map((mov, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-xl p-4 space-y-1 relative">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-[#291136] bg-[#291136]/5 px-2 py-0.5 rounded-full">
                                                #{idx + 1}
                                            </span>
                                            {movimientos.length > 1 && (
                                                <div className="flex gap-0.5">
                                                    <button type="button" onClick={() => moverMovimiento(idx, -1)} disabled={idx === 0}
                                                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                                        <ChevronUp size={12}/>
                                                    </button>
                                                    <button type="button" onClick={() => moverMovimiento(idx, 1)} disabled={idx === movimientos.length - 1}
                                                        className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                                        <ChevronDown size={12}/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {movimientos.length > 1 && (
                                            <button type="button" onClick={() => quitarMovimiento(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                                                <Trash2 size={13}/>
                                            </button>
                                        )}
                                    </div>
                                    <MovimientoSeguimientoForm
                                        expediente={expediente}
                                        etapas={etapas}
                                        sugerencia={mov}
                                        onChange={(field, value) => actualizarMovimiento(idx, field, value)}
                                    />
                                    {errores[`mov_${idx}_instruccion`] && <p className="text-xs text-red-500">{errores[`mov_${idx}_instruccion`]}</p>}
                                    {errores[`mov_${idx}_etapa`]       && <p className="text-xs text-red-500">{errores[`mov_${idx}_etapa`]}</p>}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => agregarMovimiento()}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#291136] border-2 border-dashed border-[#291136]/20 rounded-xl hover:border-[#291136]/40 hover:bg-[#291136]/5 transition-colors"
                            >
                                <PlusCircle size={14}/> Agregar otro movimiento
                            </button>

                            {actoresNotificables.length > 0 && (
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notificar a (email)</label>
                                    <div className="flex flex-wrap gap-2">
                                        {actoresNotificables.map(actor => (
                                            <label key={actor.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                                                <input
                                                    type="checkbox"
                                                    checked={notificarA.includes(actor.id)}
                                                    onChange={e => setNotificarA(prev =>
                                                        e.target.checked ? [...prev, actor.id] : prev.filter(x => x !== actor.id)
                                                    )}
                                                    className="rounded border-gray-300 accent-[#291136]"
                                                />
                                                {actor.usuario?.name} ({actor.tipo_actor?.nombre})
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => confirmar('no_conforme')}
                                    disabled={procesando}
                                    className="px-5 py-2 text-sm font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {procesando ? 'Procesando...' : `Confirmar No Conforme${movimientos.length > 0 ? ` y crear ${movimientos.length} movimiento(s)` : ''}`}
                                </button>
                                <button onClick={() => setPaso('idle')} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
