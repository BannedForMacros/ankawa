import { router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download, PlusCircle } from 'lucide-react';
import { MovimientoCard, movVacioBase, GENERA_CARGO_DEFAULT } from './TabNuevoMovimiento';

const movVacio = movVacioBase;

export default function TabSolicitud({ expediente, solicitud, esGestor = false, etapas = [], actoresNotificables = [], tiposDocumento = [] }) {
    const [editando, setEditando]         = useState(false);
    const [paso, setPaso]                 = useState('idle');
    const [motivoNoConforme, setMotivo]   = useState('');
    const [movimientos, setMovimientos]   = useState([]);
    const [archivosMovimientos, setArchivos] = useState({});
    const [procesando, setProcesando]     = useState(false);
    const [errores, setErrores]           = useState({});

    const defaultNotificarIds = actoresNotificables.map(a => a.id);

    // Actores activos del expediente con cuenta de usuario
    const actoresExpediente = useMemo(() =>
        (expediente.actores ?? []).filter(a => a.activo && a.usuario),
    [expediente.actores]);

    // Tipos de actor presentes en el expediente
    const tiposActorEnExpediente = useMemo(() => {
        const idsPresentes = new Set(actoresExpediente.map(a => a.tipo_actor_id));
        return (expediente.actores ?? [])
            .filter(a => a.activo && a.tipo_actor && idsPresentes.has(a.tipo_actor_id))
            .map(a => a.tipo_actor)
            .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i);
    }, [actoresExpediente, expediente.actores]);

    function actualizar(idx, field, value) {
        setMovimientos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    }

    function quitar(idx) {
        setMovimientos(prev => prev.filter((_, i) => i !== idx));
        setArchivos(prev => {
            const next = {};
            Object.entries(prev)
                .filter(([k]) => Number(k) !== idx)
                .forEach(([, v], ni) => { next[ni] = v; });
            return next;
        });
    }

    function mover(idx, dir) {
        const swap = idx + dir;
        if (swap < 0 || swap >= movimientos.length) return;
        setMovimientos(prev => {
            const arr = [...prev];
            [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
            return arr;
        });
        setArchivos(prev => {
            const next = { ...prev };
            [next[idx], next[swap]] = [prev[swap], prev[idx]];
            return next;
        });
    }

    function iniciarConforme() {
        const demandante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandante');
        const demandado  = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandado');
        const plazoApers = expediente.servicio?.plazo_apersonamiento_dias ?? '';
        setMovimientos([
            {
                ...movVacio(expediente, defaultNotificarIds),
                tipo:                       'notificacion',
                instruccion:                'Conformidad de la solicitud: La solicitud ha sido declarada CONFORME.',
                tipo_actor_responsable_id:  String(demandante?.tipo_actor_id ?? ''),
                usuario_responsable_id:     String(demandante?.usuario?.id ?? ''),
            },
            {
                ...movVacio(expediente, defaultNotificarIds),
                tipo:                       'requerimiento',
                instruccion:                'Traslado al demandado: Debe apersonarse al proceso en el plazo indicado.',
                tipo_actor_responsable_id:  String(demandado?.tipo_actor_id ?? ''),
                usuario_responsable_id:     String(demandado?.usuario?.id ?? ''),
                dias_plazo:                 String(plazoApers),
                enviar_credenciales:        !!demandado?.id,
                actor_credenciales_id:      String(demandado?.id ?? ''),
            },
        ]);
        setArchivos({ 0: [], 1: [] });
        setPaso('conforme');
        setErrores({});
    }

    function iniciarNoConforme() {
        const demandante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === 'demandante');
        const plazo = expediente.servicio?.plazo_subsanacion_dias ?? '';
        setMovimientos([{
            ...movVacio(expediente, defaultNotificarIds),
            tipo:                      'requerimiento',
            tipo_actor_responsable_id: String(demandante?.tipo_actor_id ?? ''),
            usuario_responsable_id:    String(demandante?.usuario?.id ?? ''),
            dias_plazo:                String(plazo),
        }]);
        setArchivos({ 0: [] });
        setPaso('no_conforme');
        setErrores({});
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

        const form = new FormData();
        form.append('resultado', resultado);
        if (resultado === 'no_conforme') form.append('motivo_no_conformidad', motivoNoConforme);

        movimientos.forEach((mov, i) => {
            form.append(`movimientos[${i}][tipo]`,                        mov.tipo);
            form.append(`movimientos[${i}][etapa_id]`,                    mov.etapa_id ?? '');
            form.append(`movimientos[${i}][sub_etapa_id]`,                mov.sub_etapa_id ?? '');
            form.append(`movimientos[${i}][instruccion]`,                 mov.instruccion);
            form.append(`movimientos[${i}][observaciones]`,               mov.observaciones ?? '');
            form.append(`movimientos[${i}][tipo_actor_responsable_id]`,   mov.tipo_actor_responsable_id ?? '');
            form.append(`movimientos[${i}][usuario_responsable_id]`,      mov.usuario_responsable_id ?? '');
            form.append(`movimientos[${i}][dias_plazo]`,                  mov.dias_plazo ?? '');
            form.append(`movimientos[${i}][tipo_documento_requerido_id]`, mov.tipo_documento_requerido_id ?? '');
            form.append(`movimientos[${i}][enviar_credenciales]`,         mov.enviar_credenciales ? '1' : '0');
            form.append(`movimientos[${i}][actor_credenciales_id]`,       mov.actor_credenciales_id ?? '');
            form.append(`movimientos[${i}][genera_cargo]`,                mov.genera_cargo ? '1' : '0');
            mov.notificar_a.forEach(id => form.append(`movimientos[${i}][notificar_a][]`, id));
            (archivosMovimientos[i] ?? []).forEach(f => form.append(`documentos[${i}][]`, f));
        });

        router.post(route('expedientes.conformidad', expediente.id), form, {
            forceFormData: true,
            onFinish:  () => setProcesando(false),
            onError:   errs => setErrores(errs),
            onSuccess: () => setPaso('idle'),
        });
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
            <span className="text-sm text-gray-400 block mb-0.5">{label}</span>
            <span className="text-base font-semibold text-[#291136]">{value || '—'}</span>
        </div>
    );

    const inputField = (label, field, type = 'text', required = false) => (
        <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">{label} {required && '*'}</label>
            <input type={type} value={formEdit.data[field]}
                onChange={e => formEdit.setData(field, e.target.value)}
                className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"/>
            {formEdit.errors[field] && <p className="text-sm text-red-500 mt-1">{formEdit.errors[field]}</p>}
        </div>
    );

    // ── Panel de movimientos compartido (conforme / no_conforme) ─────────────
    function PanelMovimientos({ colorBtn, labelBtn, resultado }) {
        return (
            <div className="space-y-3">
                {movimientos.map((mov, idx) => (
                    <div key={idx}>
                        <MovimientoCard
                            mov={mov}
                            idx={idx}
                            total={movimientos.length}
                            etapas={etapas}
                            tiposActorEnExpediente={tiposActorEnExpediente}
                            actoresExpediente={actoresExpediente}
                            tiposDocumento={tiposDocumento}
                            actoresConCredenciales={actoresExpediente}
                            actoresNotificables={actoresNotificables}
                            archivos={archivosMovimientos[idx] ?? []}
                            onArchivos={files => setArchivos(prev => ({ ...prev, [idx]: files }))}
                            onChange={(field, value) => actualizar(idx, field, value)}
                            onMover={dir => mover(idx, dir)}
                            onQuitar={() => quitar(idx)}
                        />
                        {errores[`mov_${idx}_instruccion`] && <p className="text-xs text-red-500 mt-1">{errores[`mov_${idx}_instruccion`]}</p>}
                        {errores[`mov_${idx}_etapa`]       && <p className="text-xs text-red-500 mt-1">{errores[`mov_${idx}_etapa`]}</p>}
                    </div>
                ))}

                <button type="button"
                    onClick={() => {
                        const ni = movimientos.length;
                        setMovimientos(prev => [...prev, movVacio(expediente, defaultNotificarIds)]);
                        setArchivos(prev => ({ ...prev, [ni]: [] }));
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-[#291136] border-2 border-dashed border-[#291136]/20 rounded-xl hover:border-[#291136]/40 hover:bg-[#291136]/5 transition-colors"
                >
                    <PlusCircle size={14}/> Agregar otro movimiento
                </button>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => confirmar(resultado)} disabled={procesando}
                        className={`px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50 ${colorBtn}`}>
                        {procesando ? 'Procesando...' : `Confirmar${movimientos.length > 0 ? ` y crear ${movimientos.length} movimiento(s)` : ''}`}
                    </button>
                    <button onClick={() => setPaso('idle')} className="px-4 py-2 text-xs text-gray-400 hover:text-gray-600">
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* ── Datos de la Solicitud ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {solicitud.numero_cargo && (
                    <div className="flex items-center gap-3 mb-4 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">N° de Cargo</p>
                            <p className="text-xl font-black font-mono text-[#291136] tracking-wider">{solicitud.numero_cargo}</p>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#291136]">Datos de la Solicitud</h3>
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
                            <button onClick={() => setEditando(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors">
                                <Pencil size={12}/> Editar
                            </button>
                        )}
                    </div>
                </div>

                {editando ? (
                    <form onSubmit={guardarEdicion} className="space-y-6">
                        <div>
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
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
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inputField('Nombre completo', 'nombre_demandado', 'text', true)}
                                {inputField('Domicilio', 'domicilio_demandado', 'text', true)}
                                {inputField('Email', 'email_demandado', 'email')}
                                {inputField('Teléfono', 'telefono_demandado')}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Resumen *</label>
                                    <textarea value={formEdit.data.resumen_controversia} onChange={e => formEdit.setData('resumen_controversia', e.target.value)} rows={4} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Pretensiones *</label>
                                    <textarea value={formEdit.data.pretensiones} onChange={e => formEdit.setData('pretensiones', e.target.value)} rows={3} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"/>
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
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
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
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campo('Nombre', solicitud.nombre_demandado)}
                                {campo('Domicilio', solicitud.domicilio_demandado)}
                                {campo('Email', solicitud.email_demandado)}
                                {campo('Teléfono', solicitud.telefono_demandado)}
                            </div>
                        </div>
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia y Pretensiones</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-400 block mb-1">Resumen de la controversia</span>
                                    <p className="text-base text-[#291136] bg-gray-50 rounded-lg p-3 leading-relaxed">{solicitud.resumen_controversia || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-400 block mb-1">Pretensiones</span>
                                    <p className="text-base text-[#291136] bg-gray-50 rounded-lg p-3 leading-relaxed">{solicitud.pretensiones || '—'}</p>
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
                                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Documentos Adjuntos</h4>
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
                    <h3 className="text-base font-bold text-amber-700 mb-1">⏳ Esperando subsanación del demandante</h3>
                    <p className="text-sm text-amber-700">
                        Se declaró NO CONFORME. Una vez que el demandante responda, podrás volver a revisar la conformidad desde esta sección.
                    </p>
                </div>
            )}

            {/* ── Panel de conformidad ── */}
            {esGestor && solicitud.resultado_revision !== 'conforme' && solicitud.estado !== 'subsanacion' && !editando && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                    <h3 className="text-base font-bold text-amber-700 mb-1">Revisión de Conformidad</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Revise los datos y declare si la solicitud es conforme o requiere subsanación.
                    </p>

                    {paso === 'idle' && (
                        <div className="flex gap-3">
                            <button onClick={iniciarConforme}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                                <CheckCircle size={16}/> Declarar Conforme
                            </button>
                            <button onClick={iniciarNoConforme}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200">
                                <XCircle size={16}/> Declarar No Conforme
                            </button>
                        </div>
                    )}

                    {paso === 'conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <CheckCircle size={16} className="text-emerald-600 shrink-0"/>
                                <p className="text-sm font-bold text-emerald-700">
                                    Declarar solicitud como <strong>CONFORME</strong>. Se enviará email al demandado con credenciales de acceso.
                                </p>
                            </div>
                            <PanelMovimientos colorBtn="bg-emerald-600 hover:bg-emerald-700" labelBtn="Confirmar Conforme" resultado="conforme"/>
                        </div>
                    )}

                    {paso === 'no_conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                                <XCircle size={16} className="text-red-600 shrink-0"/>
                                <p className="text-sm font-bold text-red-700">
                                    Declarar solicitud como <strong>NO CONFORME</strong>. Se habilitará subsanación para el demandante.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Motivo de no conformidad *</label>
                                <textarea value={motivoNoConforme}
                                    onChange={e => {
                                        setMotivo(e.target.value);
                                        if (movimientos.length > 0) {
                                            actualizar(0, 'instruccion', `Subsanación requerida: ${e.target.value}`);
                                        }
                                    }}
                                    rows={3} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"
                                    placeholder="Indique los motivos por los que la solicitud no es conforme..."/>
                                {errores.motivo_no_conformidad && <p className="text-xs text-red-500 mt-1">{errores.motivo_no_conformidad}</p>}
                            </div>
                            <PanelMovimientos colorBtn="bg-red-600 hover:bg-red-700" labelBtn="Confirmar No Conforme" resultado="no_conforme"/>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
