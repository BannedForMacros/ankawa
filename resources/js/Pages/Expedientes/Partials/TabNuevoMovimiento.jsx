import { router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { PlusCircle, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

const TIPOS = {
    requerimiento: {
        label: 'Requerimiento',
        desc: 'Se asigna a un actor para que responda. Queda como pendiente.',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    notificacion: {
        label: 'Traslado / Notificación',
        desc: 'Solo se notifica al actor. No requiere respuesta del sistema.',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    propia: {
        label: 'Actuación Propia',
        desc: 'Registro de una acción ya realizada por el Gestor. Queda completada.',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
};

// ── Formulario de un movimiento individual ───────────────────────────────────
function MovimientoCard({
    mov, idx, total, etapas, tiposActor, usuariosAsignables, tiposDocumento,
    onChange, onMover, onQuitar,
}) {
    const tipo = mov.tipo ?? 'requerimiento';
    const tipoInfo = TIPOS[tipo];
    const subEtapas = useMemo(() => {
        const et = etapas.find(e => String(e.id) === String(mov.etapa_id));
        return et?.sub_etapas ?? [];
    }, [mov.etapa_id, etapas]);

    const tipoActorSel = tiposActor.find(t => String(t.id) === String(mov.tipo_actor_responsable_id));
    const usuariosFiltrados = useMemo(() => {
        if (!tipoActorSel?.rol_auto_slug) return usuariosAsignables;
        return usuariosAsignables.filter(u => u.rol?.slug === tipoActorSel.rol_auto_slug);
    }, [tipoActorSel, usuariosAsignables]);

    const esPropia = tipo === 'propia';
    const esNotificacion = tipo === 'notificacion';

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
                {/* Tipo de movimiento */}
                <div className="flex flex-wrap gap-1.5">
                    {Object.entries(TIPOS).map(([key, info]) => (
                        <button key={key} type="button"
                            onClick={() => {
                                onChange('tipo', key);
                                if (key !== 'requerimiento') onChange('dias_plazo', '');
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

                {/* Actor + Plazo (no para actuación propia) */}
                {!esPropia && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo Actor Responsable</label>
                            <select value={mov.tipo_actor_responsable_id}
                                onChange={e => { onChange('tipo_actor_responsable_id', e.target.value); onChange('usuario_responsable_id', ''); }}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                <option value="">Seleccionar...</option>
                                {tiposActor.map(ta => <option key={ta.id} value={ta.id}>{ta.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                                {esNotificacion ? 'Actor a notificar' : 'Usuario Responsable'}
                            </label>
                            <select value={mov.usuario_responsable_id}
                                onChange={e => onChange('usuario_responsable_id', e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                                <option value="">Seleccionar...</option>
                                {usuariosFiltrados.map(u => <option key={u.id} value={u.id}>{u.name} — {u.rol?.nombre}</option>)}
                            </select>
                        </div>
                        {!esNotificacion && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo (días)</label>
                                <input type="number" min="1" max="365" value={mov.dias_plazo}
                                    onChange={e => onChange('dias_plazo', e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" placeholder="Ej: 5"/>
                            </div>
                        )}
                    </div>
                )}

                {/* Tipo documento requerido + Enviar credenciales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de documento requerido</label>
                        <select value={mov.tipo_documento_requerido_id}
                            onChange={e => onChange('tipo_documento_requerido_id', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                            <option value="">— Ninguno —</option>
                            {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                        </select>
                    </div>
                    {!esPropia && mov.usuario_responsable_id && (
                        <div className="flex items-end pb-1">
                            <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={!!mov.enviar_credenciales}
                                    onChange={e => onChange('enviar_credenciales', e.target.checked)}
                                    className="rounded border-gray-300 accent-[#291136]"/>
                                <span className="font-semibold text-gray-600">Enviar credenciales de acceso</span>
                            </label>
                        </div>
                    )}
                </div>

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

const movVacio = (expediente) => ({
    tipo: 'requerimiento',
    etapa_id: String(expediente.etapa_actual_id ?? ''),
    sub_etapa_id: '',
    instruccion: '',
    observaciones: '',
    tipo_actor_responsable_id: '',
    usuario_responsable_id: '',
    dias_plazo: '',
    tipo_documento_requerido_id: '',
    enviar_credenciales: false,
});

export default function TabNuevoMovimiento({
    expediente, etapas = [], tiposActor = [], usuariosAsignables = [],
    actoresNotificables = [], tiposDocumento = [],
}) {
    const [movimientos, setMovimientos] = useState([movVacio(expediente)]);
    const [notificarA, setNotificarA]   = useState(actoresNotificables.map(a => a.id));
    const [procesando, setProcesando]   = useState(false);
    // Archivo solo para el primer movimiento (single)
    const [archivos, setArchivos]       = useState([]);

    function actualizar(idx, field, value) {
        setMovimientos(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
    }

    function agregar() {
        setMovimientos(prev => [...prev, movVacio(expediente)]);
    }

    function quitar(idx) {
        setMovimientos(prev => prev.filter((_, i) => i !== idx));
    }

    function mover(idx, dir) {
        setMovimientos(prev => {
            const arr = [...prev];
            const swap = idx + dir;
            if (swap < 0 || swap >= arr.length) return prev;
            [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
            return arr;
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        setProcesando(true);

        if (movimientos.length === 1) {
            // Single movement → usa el endpoint simple con soporte de archivos
            const mov = movimientos[0];
            const form = new FormData();
            form.append('tipo', mov.tipo);
            form.append('etapa_id', mov.etapa_id ?? '');
            form.append('sub_etapa_id', mov.sub_etapa_id ?? '');
            form.append('instruccion', mov.instruccion);
            form.append('observaciones', mov.observaciones ?? '');
            form.append('tipo_actor_responsable_id', mov.tipo_actor_responsable_id ?? '');
            form.append('usuario_responsable_id', mov.usuario_responsable_id ?? '');
            form.append('dias_plazo', mov.dias_plazo ?? '');
            form.append('tipo_documento_requerido_id', mov.tipo_documento_requerido_id ?? '');
            form.append('enviar_credenciales', mov.enviar_credenciales ? '1' : '0');
            archivos.forEach(f => form.append('documentos[]', f));
            notificarA.forEach(id => form.append('notificar_a[]', id));

            router.post(route('expedientes.movimientos.store', expediente.id), form, {
                forceFormData: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => { setMovimientos([movVacio(expediente)]); setArchivos([]); },
            });
        } else {
            // Batch → usa el endpoint lote (sin archivos)
            router.post(route('expedientes.movimientos.lote', expediente.id), {
                movimientos: movimientos.map(m => ({
                    tipo:                       m.tipo,
                    etapa_id:                   m.etapa_id || null,
                    sub_etapa_id:               m.sub_etapa_id || null,
                    instruccion:                m.instruccion,
                    observaciones:              m.observaciones || null,
                    tipo_actor_responsable_id:  m.tipo_actor_responsable_id || null,
                    usuario_responsable_id:     m.usuario_responsable_id || null,
                    dias_plazo:                 m.dias_plazo || null,
                    tipo_documento_requerido_id: m.tipo_documento_requerido_id || null,
                    enviar_credenciales:         !!m.enviar_credenciales,
                })),
                notificar_a: notificarA,
            }, {
                onFinish: () => setProcesando(false),
                onSuccess: () => setMovimientos([movVacio(expediente)]),
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

            {/* Cards de movimientos */}
            <div className="space-y-3">
                {movimientos.map((mov, idx) => (
                    <MovimientoCard
                        key={idx}
                        mov={mov}
                        idx={idx}
                        total={movimientos.length}
                        etapas={etapas}
                        tiposActor={tiposActor}
                        usuariosAsignables={usuariosAsignables}
                        tiposDocumento={tiposDocumento}
                        onChange={(field, value) => actualizar(idx, field, value)}
                        onMover={dir => mover(idx, dir)}
                        onQuitar={() => quitar(idx)}
                    />
                ))}
            </div>

            {/* Documentos (solo single) */}
            {!esBatch && (
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos adjuntos</label>
                    <input type="file" multiple onChange={e => setArchivos(Array.from(e.target.files))} className="text-xs"/>
                </div>
            )}
            {esBatch && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    En modo lote, los documentos adjuntos no están disponibles. Puedes adjuntarlos editando cada movimiento después.
                </p>
            )}

            {/* Notificar a */}
            {actoresNotificables.length > 0 && (
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Notificar a (email)</label>
                    <div className="flex flex-wrap gap-2">
                        {actoresNotificables.map(actor => (
                            <label key={actor.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                                <input type="checkbox"
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

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button
                    type="button"
                    onClick={agregar}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#291136] px-3 py-1.5 rounded-lg border border-dashed border-[#291136]/30 hover:bg-[#291136]/5 transition-colors"
                >
                    <PlusCircle size={13}/> Agregar movimiento
                </button>

                <button
                    type="submit"
                    disabled={procesando}
                    className="px-5 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50"
                >
                    {procesando ? 'Creando...' : esBatch ? `Crear ${movimientos.length} movimientos` : 'Crear Movimiento'}
                </button>
            </div>
        </form>
    );
}
