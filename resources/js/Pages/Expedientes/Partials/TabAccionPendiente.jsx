import { useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, FileText, PlusCircle } from 'lucide-react';

export default function TabAccionPendiente({
    expediente,
    movimiento,
    actoresNotificables = [],
    esGestor = false,
    etapas = [],
    tiposActor = [],
    usuariosAsignables = [],
    tiposDocumento = [],
}) {
    const [crearSiguiente, setCrearSiguiente] = useState(false);

    const form = useForm({
        // Respuesta
        respuesta: '',
        documentos_respuesta: [],
        // Nuevo movimiento (solo si crearSiguiente)
        nuevo_etapa_id: expediente.etapa_actual_id ?? '',
        nuevo_sub_etapa_id: '',
        nuevo_tipo_actor_responsable_id: '',
        nuevo_usuario_responsable_id: '',
        nuevo_instruccion: '',
        nuevo_observaciones: '',
        nuevo_dias_plazo: '',
        nuevo_tipo_documento_requerido_id: '',
        documentos_nuevo: [],
        notificar_a: actoresNotificables.map(a => a.id),
    });

    // Sub-etapas del nuevo movimiento
    const subEtapasNuevo = useMemo(() => {
        const etapa = etapas.find(e => String(e.id) === String(form.data.nuevo_etapa_id));
        return etapa?.sub_etapas ?? [];
    }, [form.data.nuevo_etapa_id, etapas]);

    // Filtrar usuarios por tipo actor del nuevo movimiento
    const tipoActorNuevo = useMemo(() => {
        return tiposActor.find(t => String(t.id) === String(form.data.nuevo_tipo_actor_responsable_id));
    }, [form.data.nuevo_tipo_actor_responsable_id, tiposActor]);

    const usuariosFiltradosNuevo = useMemo(() => {
        if (!tipoActorNuevo?.rol_auto_slug) return usuariosAsignables;
        return usuariosAsignables.filter(u => u.rol?.slug === tipoActorNuevo.rol_auto_slug);
    }, [tipoActorNuevo, usuariosAsignables]);

    function handleSubmit(e) {
        e.preventDefault();
        const routeName = crearSiguiente
            ? 'expedientes.movimientos.responder-y-crear'
            : 'expedientes.movimientos.responder';

        // Para la ruta simple, solo enviar campos de respuesta
        const submitData = crearSiguiente ? form.data : {
            respuesta: form.data.respuesta,
            documentos: form.data.documentos_respuesta,
        };

        form.post(route(routeName, [expediente.id, movimiento.id]), {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <div className="space-y-4">
            {/* Detalle del movimiento pendiente */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-5">
                <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-500 mt-0.5 shrink-0"/>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-amber-800">Acción Requerida</h3>
                        <p className="text-sm text-amber-700 mt-1">{movimiento.instruccion}</p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
                            {movimiento.etapa && (
                                <div>
                                    <span className="text-amber-500 block">Etapa</span>
                                    <span className="font-semibold text-amber-800">{movimiento.etapa.nombre}</span>
                                </div>
                            )}
                            {movimiento.sub_etapa && (
                                <div>
                                    <span className="text-amber-500 block">Sub-etapa</span>
                                    <span className="font-semibold text-amber-800">{movimiento.sub_etapa.nombre}</span>
                                </div>
                            )}
                            {movimiento.fecha_limite && (
                                <div>
                                    <span className="text-amber-500 block">Fecha Límite</span>
                                    <span className="font-bold text-amber-800">
                                        {new Date(movimiento.fecha_limite).toLocaleDateString('es-PE')}
                                        {movimiento.dias_plazo && <span className="font-normal ml-1">({movimiento.dias_plazo} días)</span>}
                                    </span>
                                </div>
                            )}
                            {movimiento.tipo_documento_requerido && (
                                <div>
                                    <span className="text-amber-500 block">Documento Requerido</span>
                                    <span className="font-bold text-[#BE0F4A]">{movimiento.tipo_documento_requerido.nombre}</span>
                                </div>
                            )}
                        </div>

                        {movimiento.observaciones && (
                            <div className="mt-2 p-2 bg-white/50 rounded-lg">
                                <span className="text-[11px] text-amber-500">Observaciones:</span>
                                <p className="text-xs text-amber-800">{movimiento.observaciones}</p>
                            </div>
                        )}

                        {/* Documentos del movimiento */}
                        {movimiento.documentos?.filter(d => d.momento === 'creacion').length > 0 && (
                            <div className="mt-2">
                                <span className="text-[11px] text-amber-500 block mb-1">Documentos adjuntos</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {movimiento.documentos.filter(d => d.momento === 'creacion').map(doc => (
                                        <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/50 text-amber-700 border border-amber-200">
                                            <FileText size={10}/> {doc.nombre_original}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <p className="text-[11px] text-amber-400 mt-2">
                            Creado por {movimiento.creado_por?.name} el {new Date(movimiento.created_at).toLocaleDateString('es-PE')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulario de respuesta */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#291136]">Responder</h3>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Respuesta *</label>
                    <textarea
                        value={form.data.respuesta}
                        onChange={e => form.setData('respuesta', e.target.value)}
                        rows={4}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Escriba su respuesta o informe de la acción realizada..."
                    />
                    {form.errors.respuesta && <p className="text-xs text-red-500 mt-1">{form.errors.respuesta}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos de respuesta</label>
                    <input
                        type="file"
                        multiple
                        onChange={e => form.setData('documentos_respuesta', Array.from(e.target.files))}
                        className="text-xs"
                    />
                </div>

                {/* Toggle: Crear siguiente movimiento (solo gestor) */}
                {esGestor && (
                    <div className="border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setCrearSiguiente(!crearSiguiente)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                                crearSiguiente
                                    ? 'border-[#291136] bg-[#291136]/5'
                                    : 'border-dashed border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <PlusCircle size={16} className={crearSiguiente ? 'text-[#291136]' : 'text-gray-400'}/>
                                <span className={`text-sm font-bold ${crearSiguiente ? 'text-[#291136]' : 'text-gray-400'}`}>
                                    Definir siguiente movimiento
                                </span>
                            </div>
                            {crearSiguiente ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </button>

                        {crearSiguiente && (
                            <div className="mt-4 space-y-4 pl-4 border-l-2 border-[#291136]/20">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Etapa */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Etapa *</label>
                                        <select
                                            value={form.data.nuevo_etapa_id}
                                            onChange={e => form.setData(d => ({ ...d, nuevo_etapa_id: e.target.value, nuevo_sub_etapa_id: '' }))}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {etapas.map(et => (
                                                <option key={et.id} value={et.id}>{et.orden}. {et.nombre}</option>
                                            ))}
                                        </select>
                                        {form.errors.nuevo_etapa_id && <p className="text-xs text-red-500 mt-1">{form.errors.nuevo_etapa_id}</p>}
                                    </div>

                                    {/* Sub-etapa */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-etapa</label>
                                        <select
                                            value={form.data.nuevo_sub_etapa_id}
                                            onChange={e => form.setData('nuevo_sub_etapa_id', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Ninguna</option>
                                            {subEtapasNuevo.map(se => (
                                                <option key={se.id} value={se.id}>{se.orden}. {se.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tipo Actor */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Actor Responsable</label>
                                        <select
                                            value={form.data.nuevo_tipo_actor_responsable_id}
                                            onChange={e => form.setData(d => ({ ...d, nuevo_tipo_actor_responsable_id: e.target.value, nuevo_usuario_responsable_id: '' }))}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Ninguno (informativo)</option>
                                            {tiposActor.map(ta => (
                                                <option key={ta.id} value={ta.id}>{ta.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Usuario Responsable */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario Responsable</label>
                                        <select
                                            value={form.data.nuevo_usuario_responsable_id}
                                            onChange={e => form.setData('nuevo_usuario_responsable_id', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {usuariosFiltradosNuevo.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} — {u.rol?.nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Plazo */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo (días hábiles)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={form.data.nuevo_dias_plazo}
                                            onChange={e => form.setData('nuevo_dias_plazo', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="Ej: 5"
                                        />
                                    </div>

                                    {/* Tipo documento requerido */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Documento que debe presentar</label>
                                        <select
                                            value={form.data.nuevo_tipo_documento_requerido_id}
                                            onChange={e => form.setData('nuevo_tipo_documento_requerido_id', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        >
                                            <option value="">Ninguno</option>
                                            {tiposDocumento.map(td => (
                                                <option key={td.id} value={td.id}>{td.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Instrucción del nuevo */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucción del siguiente movimiento *</label>
                                    <textarea
                                        value={form.data.nuevo_instruccion}
                                        onChange={e => form.setData('nuevo_instruccion', e.target.value)}
                                        rows={3}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                        placeholder="Describa la siguiente acción a realizar..."
                                    />
                                    {form.errors.nuevo_instruccion && <p className="text-xs text-red-500 mt-1">{form.errors.nuevo_instruccion}</p>}
                                </div>

                                {/* Observaciones del nuevo */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                                    <textarea
                                        value={form.data.nuevo_observaciones}
                                        onChange={e => form.setData('nuevo_observaciones', e.target.value)}
                                        rows={2}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                </div>

                                {/* Documentos del nuevo */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos del nuevo movimiento</label>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={e => form.setData('documentos_nuevo', Array.from(e.target.files))}
                                        className="text-xs"
                                    />
                                </div>

                                {/* Notificar */}
                                {actoresNotificables.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Notificar a (email)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {actoresNotificables.map(actor => (
                                                <label key={actor.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                                                    <input
                                                        type="checkbox"
                                                        value={actor.id}
                                                        checked={form.data.notificar_a.includes(actor.id)}
                                                        onChange={e => {
                                                            const id = parseInt(e.target.value);
                                                            form.setData('notificar_a',
                                                                e.target.checked
                                                                    ? [...form.data.notificar_a, id]
                                                                    : form.data.notificar_a.filter(x => x !== id)
                                                            );
                                                        }}
                                                        className="rounded border-gray-300 text-[#291136]"
                                                    />
                                                    {actor.usuario?.name} ({actor.tipo_actor?.nombre})
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        type="submit"
                        disabled={form.processing}
                        className={`px-5 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-50 ${
                            crearSiguiente
                                ? 'bg-[#291136] hover:bg-[#3d1a52]'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                    >
                        {crearSiguiente ? 'Responder y Crear Siguiente' : 'Enviar Respuesta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
