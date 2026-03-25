import { useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function TabNuevoMovimiento({
    expediente,
    etapas = [],
    tiposActor = [],
    usuariosAsignables = [],
    actoresNotificables = [],
    tiposDocumento = [],
}) {
    const form = useForm({
        etapa_id: expediente.etapa_actual_id ?? '',
        sub_etapa_id: '',
        tipo_actor_responsable_id: '',
        usuario_responsable_id: '',
        instruccion: '',
        observaciones: '',
        dias_plazo: '',
        tipo_documento_requerido_id: '',
        documentos: [],
        notificar_a: [],
    });

    const subEtapas = useMemo(() => {
        const etapa = etapas.find(e => String(e.id) === String(form.data.etapa_id));
        return etapa?.sub_etapas ?? [];
    }, [form.data.etapa_id, etapas]);

    // Filtrar usuarios por tipo de actor seleccionado
    const tipoActorSel = useMemo(() => {
        return tiposActor.find(t => String(t.id) === String(form.data.tipo_actor_responsable_id));
    }, [form.data.tipo_actor_responsable_id, tiposActor]);

    const usuariosFiltrados = useMemo(() => {
        if (!tipoActorSel?.rol_auto_slug) return usuariosAsignables;
        return usuariosAsignables.filter(u => u.rol?.slug === tipoActorSel.rol_auto_slug);
    }, [tipoActorSel, usuariosAsignables]);

    function handleSubmit(e) {
        e.preventDefault();
        form.post(route('expedientes.movimientos.store', expediente.id), {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#291136]">Crear Nuevo Movimiento</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Etapa */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Etapa *</label>
                    <select
                        value={form.data.etapa_id}
                        onChange={e => { form.setData(d => ({ ...d, etapa_id: e.target.value, sub_etapa_id: '' })); }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    >
                        <option value="">Seleccionar...</option>
                        {etapas.map(et => (
                            <option key={et.id} value={et.id}>{et.orden}. {et.nombre}</option>
                        ))}
                    </select>
                    {form.errors.etapa_id && <p className="text-xs text-red-500 mt-1">{form.errors.etapa_id}</p>}
                </div>

                {/* Sub-etapa */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-etapa</label>
                    <select
                        value={form.data.sub_etapa_id}
                        onChange={e => form.setData('sub_etapa_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    >
                        <option value="">Ninguna</option>
                        {subEtapas.map(se => (
                            <option key={se.id} value={se.id}>{se.orden}. {se.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Tipo Actor Responsable */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Actor Responsable</label>
                    <select
                        value={form.data.tipo_actor_responsable_id}
                        onChange={e => form.setData(d => ({ ...d, tipo_actor_responsable_id: e.target.value, usuario_responsable_id: '' }))}
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Usuario Responsable
                        {tipoActorSel?.rol_auto_slug && <span className="text-gray-400 font-normal ml-1">({tipoActorSel.rol_auto_slug})</span>}
                    </label>
                    <select
                        value={form.data.usuario_responsable_id}
                        onChange={e => form.setData('usuario_responsable_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    >
                        <option value="">Seleccionar...</option>
                        {usuariosFiltrados.map(u => (
                            <option key={u.id} value={u.id}>{u.name} — {u.rol?.nombre}</option>
                        ))}
                    </select>
                    {form.errors.usuario_responsable_id && <p className="text-xs text-red-500 mt-1">{form.errors.usuario_responsable_id}</p>}
                </div>

                {/* Plazo */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo (días hábiles)</label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={form.data.dias_plazo}
                        onChange={e => form.setData('dias_plazo', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        placeholder="Ej: 5"
                    />
                </div>

                {/* Tipo de documento requerido */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documento que debe presentar</label>
                    <select
                        value={form.data.tipo_documento_requerido_id}
                        onChange={e => form.setData('tipo_documento_requerido_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    >
                        <option value="">Ninguno</option>
                        {tiposDocumento.map(td => (
                            <option key={td.id} value={td.id}>{td.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Instrucción */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucción / Descripción *</label>
                <textarea
                    value={form.data.instruccion}
                    onChange={e => form.setData('instruccion', e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Describa la instrucción o acción a realizar..."
                />
                {form.errors.instruccion && <p className="text-xs text-red-500 mt-1">{form.errors.instruccion}</p>}
            </div>

            {/* Observaciones */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones</label>
                <textarea
                    value={form.data.observaciones}
                    onChange={e => form.setData('observaciones', e.target.value)}
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    placeholder="Observaciones adicionales (opcional)"
                />
            </div>

            {/* Documentos */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos adjuntos</label>
                <input
                    type="file"
                    multiple
                    onChange={e => form.setData('documentos', Array.from(e.target.files))}
                    className="text-xs"
                />
            </div>

            {/* Notificar a */}
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

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="px-5 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50"
                >
                    Registrar Movimiento
                </button>
            </div>
        </form>
    );
}
