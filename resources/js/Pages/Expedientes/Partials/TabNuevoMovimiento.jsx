import { router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { PlusCircle, Trash2, ChevronUp, ChevronDown, KeyRound, Paperclip } from 'lucide-react';

const TIPOS = {
    requerimiento: {
        label: 'Requerimiento',
        desc: 'Se asigna a un actor para que responda. Queda como pendiente.',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    notificacion: {
        label: 'Traslado / Notificación',
        desc: 'Se notifica a los actores seleccionados. No requiere respuesta.',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    propia: {
        label: 'Actuación Propia',
        desc: 'Registro de una acción ya realizada por el Gestor. Queda completada.',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
};

// ── Card de un movimiento individual (exportado para reutilización) ──────────
export function MovimientoCard({
    mov, idx, total,
    etapas,
    tiposActorEnExpediente,
    actoresExpediente,
    tiposDocumento,
    actoresConCredenciales,
    actoresNotificables,
    archivos, onArchivos,
    onChange, onMover, onQuitar,
}) {
    const tipo      = mov.tipo ?? 'requerimiento';
    const tipoInfo  = TIPOS[tipo];
    const esPropia       = tipo === 'propia';
    const esNotificacion = tipo === 'notificacion';

    const subEtapas = useMemo(() => {
        const et = etapas.find(e => String(e.id) === String(mov.etapa_id));
        return et?.sub_etapas ?? [];
    }, [mov.etapa_id, etapas]);

    // Usuarios del expediente filtrados por tipo actor seleccionado
    const usuariosFiltrados = useMemo(() => {
        if (!mov.tipo_actor_responsable_id) return actoresExpediente;
        return actoresExpediente.filter(
            a => String(a.tipo_actor_id) === String(mov.tipo_actor_responsable_id)
        );
    }, [mov.tipo_actor_responsable_id, actoresExpediente]);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#291136]">#{idx + 1}</span>
                    {total > 1 && (
                        <div className="flex gap-0.5">
                            <button type="button" onClick={() => onMover(-1)} disabled={idx === 0}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                <ChevronUp size={12}/>
                            </button>
                            <button type="button" onClick={() => onMover(1)} disabled={idx === total - 1}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
                                <ChevronDown size={12}/>
                            </button>
                        </div>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipoInfo.badge}`}>
                        {tipoInfo.label}
                    </span>
                </div>
                {total > 1 && (
                    <button type="button" onClick={onQuitar} className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={13}/>
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {/* Selector de tipo */}
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(TIPOS).map(([key, info]) => (
                        <button key={key} type="button"
                            onClick={() => {
                                onChange('tipo', key);
                                onChange('genera_cargo', GENERA_CARGO_DEFAULT[key] ?? false);
                                if (key !== 'requerimiento') onChange('dias_plazo', '');
                                if (key === 'notificacion' || key === 'propia') {
                                    onChange('tipo_actor_responsable_id', '');
                                    onChange('usuario_responsable_id', '');
                                }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                tipo === key ? info.badge + ' ring-1 ring-current' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {info.label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400">{tipoInfo.desc}</p>

                {/* Etapa + Sub-etapa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Etapa *</label>
                        <select value={mov.etapa_id}
                            onChange={e => { onChange('etapa_id', e.target.value); onChange('sub_etapa_id', ''); }}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                            <option value="">Seleccionar...</option>
                            {etapas.map(et => <option key={et.id} value={et.id}>{et.orden}. {et.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-etapa</label>
                        <select value={mov.sub_etapa_id} onChange={e => onChange('sub_etapa_id', e.target.value)}
                            disabled={subEtapas.length === 0}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400">
                            <option value="">Ninguna</option>
                            {subEtapas.map(se => <option key={se.id} value={se.id}>{se.orden}. {se.nombre}</option>)}
                        </select>
                    </div>
                </div>

                {/* Instrucción */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {esPropia ? '¿Qué se realizó? *' : 'Instrucción *'}
                    </label>
                    <textarea value={mov.instruccion} onChange={e => onChange('instruccion', e.target.value)}
                        rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        placeholder={esPropia ? 'Describa la acción realizada...' : 'Describa la instrucción o acción a realizar...'}
                    />
                </div>

                {/* Actor + Plazo (solo para requerimiento) */}
                {!esPropia && !esNotificacion && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                Tipo Actor Responsable <span className="text-gray-400 font-normal">(opcional)</span>
                            </label>
                            <select value={mov.tipo_actor_responsable_id}
                                onChange={e => { onChange('tipo_actor_responsable_id', e.target.value); onChange('usuario_responsable_id', ''); }}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                <option value="">— Ninguno —</option>
                                {tiposActorEnExpediente.map(ta => (
                                    <option key={ta.id} value={ta.id}>{ta.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario Responsable</label>
                            <select value={mov.usuario_responsable_id}
                                onChange={e => onChange('usuario_responsable_id', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                <option value="">— Ninguno —</option>
                                {usuariosFiltrados.map(a => (
                                    <option key={a.usuario.id} value={a.usuario.id}>
                                        {a.usuario.name} — {a.tipo_actor?.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo (días)</label>
                            <input type="number" min="1" max="365" value={mov.dias_plazo}
                                onChange={e => onChange('dias_plazo', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Ej: 5"/>
                        </div>
                    </div>
                )}

                {/* Tipo documento requerido */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de documento requerido</label>
                    <select value={mov.tipo_documento_requerido_id}
                        onChange={e => onChange('tipo_documento_requerido_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                        <option value="">— Ninguno —</option>
                        {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                    </select>
                </div>

                {/* Documentos adjuntos */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 inline-flex items-center gap-1">
                        <Paperclip size={11}/> Documentos adjuntos
                    </label>
                    <input type="file" multiple onChange={e => onArchivos(Array.from(e.target.files))}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#291136]/5 file:text-[#291136] hover:file:bg-[#291136]/10"/>
                    {archivos.length > 0 && (
                        <p className="text-[11px] text-gray-400 mt-1">{archivos.length} archivo(s) seleccionado(s)</p>
                    )}
                </div>

                {/* Notificar a (por movimiento) */}
                {actoresNotificables.length > 0 && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notificar a (email)</label>
                        <div className="flex flex-wrap gap-2">
                            {actoresNotificables.map(actor => (
                                <label key={actor.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox"
                                        checked={mov.notificar_a.includes(actor.id)}
                                        onChange={e => {
                                            const next = e.target.checked
                                                ? [...mov.notificar_a, actor.id]
                                                : mov.notificar_a.filter(x => x !== actor.id);
                                            onChange('notificar_a', next);
                                        }}
                                        className="rounded border-gray-300 accent-[#291136]"
                                    />
                                    {actor.usuario?.name} ({actor.tipo_actor?.nombre})
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Enviar credenciales: selector de actor */}
                {actoresConCredenciales.length > 0 && (
                    <div className="border border-dashed border-amber-300 rounded-xl p-3 bg-amber-50/50 space-y-2">
                        <div className="flex items-center gap-2">
                            <KeyRound size={13} className="text-amber-600 shrink-0"/>
                            <span className="text-xs font-bold text-amber-700">Enviar credenciales de acceso</span>
                        </div>
                        <select
                            value={mov.actor_credenciales_id}
                            onChange={e => {
                                onChange('actor_credenciales_id', e.target.value);
                                onChange('enviar_credenciales', !!e.target.value);
                            }}
                            className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white"
                        >
                            <option value="">— No enviar credenciales en este movimiento —</option>
                            {actoresConCredenciales.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.usuario?.name ?? a.nombre_externo ?? 'Sin nombre'} — {a.tipo_actor?.nombre}
                                    {a.credenciales_enviadas ? ' (ya recibió credenciales)' : ' ⚠ pendiente'}
                                </option>
                            ))}
                        </select>
                        {mov.actor_credenciales_id && (
                            <p className="text-[11px] text-amber-600">
                                Se generará una nueva contraseña temporal y se enviará por correo al actor seleccionado.
                            </p>
                        )}
                    </div>
                )}

                {/* Genera cargo */}
                {tipo !== 'notificacion' && (
                    <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                        <input type="checkbox" checked={!!mov.genera_cargo}
                            onChange={e => onChange('genera_cargo', e.target.checked)}
                            className="w-4 h-4 accent-[#BE0F4A] rounded"/>
                        <span className="text-sm font-semibold text-[#291136]">Generar cargo al responder</span>
                        <span className="text-xs text-gray-400">(acuse de recibo para el actor)</span>
                    </label>
                )}

                {/* Observaciones */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                    <textarea value={mov.observaciones} onChange={e => onChange('observaciones', e.target.value)}
                        rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Observaciones adicionales (opcional)"/>
                </div>
            </div>
        </div>
    );
}

const GENERA_CARGO_DEFAULT = { requerimiento: true, notificacion: false, propia: false };

const movVacio = (expediente, notificarIds = []) => ({
    tipo:                        'requerimiento',
    etapa_id:                    String(expediente.etapa_actual_id ?? ''),
    sub_etapa_id:                '',
    instruccion:                 '',
    observaciones:               '',
    tipo_actor_responsable_id:   '',
    usuario_responsable_id:      '',
    dias_plazo:                  '',
    tipo_documento_requerido_id: '',
    enviar_credenciales:         false,
    actor_credenciales_id:       '',
    notificar_a:                 notificarIds,
    genera_cargo:                true,
});

export default function TabNuevoMovimiento({
    expediente, etapas = [], tiposActor = [], usuariosAsignables = [],
    actoresNotificables = [], tiposDocumento = [],
}) {
    const defaultNotificarIds = actoresNotificables.map(a => a.id);

    const [movimientos, setMovimientos]      = useState([movVacio(expediente, defaultNotificarIds)]);
    const [archivosMovimientos, setArchivos] = useState({ 0: [] });
    const [procesando, setProcesando]        = useState(false);

    // Solo actores activos del expediente con cuenta de usuario
    const actoresExpediente = useMemo(() =>
        (expediente.actores ?? []).filter(a => a.activo && a.usuario),
    [expediente.actores]);

    // Tipos de actor que tienen al menos un actor activo en el expediente
    const tiposActorEnExpediente = useMemo(() => {
        const idsPresentes = new Set(actoresExpediente.map(a => a.tipo_actor_id));
        return tiposActor.filter(t => idsPresentes.has(t.id));
    }, [actoresExpediente, tiposActor]);

    // Actores con credenciales pendientes (para el selector de envío)
    const actoresConCredenciales = useMemo(() => actoresExpediente, [actoresExpediente]);

    function actualizar(idx, field, value) {
        setMovimientos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    }

    function setArchivosIdx(idx, files) {
        setArchivos(prev => ({ ...prev, [idx]: files }));
    }

    function agregar() {
        setMovimientos(prev => {
            const newIdx = prev.length;
            setArchivos(a => ({ ...a, [newIdx]: [] }));
            return [...prev, movVacio(expediente, defaultNotificarIds)];
        });
    }

    function quitar(idx) {
        setMovimientos(prev => prev.filter((_, i) => i !== idx));
        setArchivos(prev => {
            const next = {};
            Object.entries(prev)
                .filter(([k]) => Number(k) !== idx)
                .forEach(([, v], newIdx) => { next[newIdx] = v; });
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

    function handleSubmit(e) {
        e.preventDefault();
        setProcesando(true);

        if (movimientos.length === 1) {
            const mov = movimientos[0];
            const form = new FormData();
            form.append('tipo',                        mov.tipo);
            form.append('etapa_id',                    mov.etapa_id ?? '');
            form.append('sub_etapa_id',                mov.sub_etapa_id ?? '');
            form.append('instruccion',                 mov.instruccion);
            form.append('observaciones',               mov.observaciones ?? '');
            form.append('tipo_actor_responsable_id',   mov.tipo_actor_responsable_id ?? '');
            form.append('usuario_responsable_id',      mov.usuario_responsable_id ?? '');
            form.append('dias_plazo',                  mov.dias_plazo ?? '');
            form.append('tipo_documento_requerido_id', mov.tipo_documento_requerido_id ?? '');
            form.append('enviar_credenciales',         mov.enviar_credenciales ? '1' : '0');
            form.append('actor_credenciales_id',       mov.actor_credenciales_id ?? '');
            form.append('genera_cargo',                mov.genera_cargo ? '1' : '0');
            (archivosMovimientos[0] ?? []).forEach(f => form.append('documentos[]', f));
            mov.notificar_a.forEach(id => form.append('notificar_a[]', id));

            router.post(route('expedientes.movimientos.store', expediente.id), form, {
                forceFormData: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => { setMovimientos([movVacio(expediente, defaultNotificarIds)]); setArchivos({ 0: [] }); },
            });
        } else {
            const form = new FormData();
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

            router.post(route('expedientes.movimientos.lote', expediente.id), form, {
                forceFormData: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => { setMovimientos([movVacio(expediente, defaultNotificarIds)]); setArchivos({ 0: [] }); },
            });
        }
    }

    const esBatch = movimientos.length > 1;

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#291136]">
                    {esBatch ? `Crear ${movimientos.length} movimientos en secuencia` : 'Crear Nuevo Movimiento'}
                </h3>
                {esBatch && (
                    <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                        Se crearán en el orden mostrado (#1 primero)
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {movimientos.map((mov, idx) => (
                    <MovimientoCard
                        key={idx}
                        mov={mov}
                        idx={idx}
                        total={movimientos.length}
                        etapas={etapas}
                        tiposActorEnExpediente={tiposActorEnExpediente}
                        actoresExpediente={actoresExpediente}
                        tiposDocumento={tiposDocumento}
                        actoresConCredenciales={actoresConCredenciales}
                        actoresNotificables={actoresNotificables}
                        archivos={archivosMovimientos[idx] ?? []}
                        onArchivos={files => setArchivosIdx(idx, files)}
                        onChange={(field, value) => actualizar(idx, field, value)}
                        onMover={dir => mover(idx, dir)}
                        onQuitar={() => quitar(idx)}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={agregar}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#291136] px-3 py-1.5 rounded-lg border border-dashed border-[#291136]/30 hover:bg-[#291136]/5 transition-colors">
                    <PlusCircle size={13}/> Agregar movimiento
                </button>
                <button type="submit" disabled={procesando}
                    className="px-5 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50">
                    {procesando ? 'Creando...' : esBatch ? `Crear ${movimientos.length} movimientos` : 'Crear Movimiento'}
                </button>
            </div>
        </form>
    );
}
