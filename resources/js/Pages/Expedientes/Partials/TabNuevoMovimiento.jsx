import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

export default function TabNuevoMovimiento({
    expediente,
    etapas = [],
    tiposActor = [],
    usuariosAsignables = [],
    actoresNotificables = [],
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        etapa_id: expediente.etapa_actual_id ?? '',
        sub_etapa_id: '',
        tipo_actor_responsable_id: '',
        usuario_responsable_id: '',
        instruccion: '',
        observaciones: '',
        dias_plazo: '',
        documentos: [],
        notificar_a: actoresNotificables.map(a => a.id), // todos preseleccionados
    });

    const etapaSeleccionada = etapas.find(e => e.id == data.etapa_id);
    const subEtapas = etapaSeleccionada?.sub_etapas ?? [];

    // Filtrar usuarios por tipo de actor si se seleccionó uno
    const actorConfig = tiposActor.find(t => t.id == data.tipo_actor_responsable_id);
    const actoresDelExpediente = expediente.actores?.filter(a =>
        a.activo && a.tipo_actor_id == data.tipo_actor_responsable_id
    ) ?? [];

    function handleSubmit(e) {
        e.preventDefault();
        post(route('expedientes.movimientos.store', expediente.id), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    }

    function toggleNotificar(actorId) {
        setData('notificar_a',
            data.notificar_a.includes(actorId)
                ? data.notificar_a.filter(id => id !== actorId)
                : [...data.notificar_a, actorId]
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="text-sm font-bold text-[#291136]">Crear Nuevo Movimiento</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Etapa */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Etapa</label>
                    <select
                        value={data.etapa_id}
                        onChange={e => { setData('etapa_id', e.target.value); setData('sub_etapa_id', ''); }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                    >
                        <option value="">Seleccionar etapa</option>
                        {etapas.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                    </select>
                    {errors.etapa_id && <p className="text-xs text-red-500 mt-1">{errors.etapa_id}</p>}
                </div>

                {/* Sub-etapa */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sub-etapa (opcional)</label>
                    <select
                        value={data.sub_etapa_id}
                        onChange={e => setData('sub_etapa_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                        disabled={subEtapas.length === 0}
                    >
                        <option value="">Sin sub-etapa</option>
                        {subEtapas.map(se => (
                            <option key={se.id} value={se.id}>{se.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Tipo Actor Responsable */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Actor Responsable</label>
                    <select
                        value={data.tipo_actor_responsable_id}
                        onChange={e => { setData('tipo_actor_responsable_id', e.target.value); setData('usuario_responsable_id', ''); }}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                    >
                        <option value="">Sin responsable específico</option>
                        {tiposActor.map(t => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Usuario Responsable */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Usuario Responsable</label>
                    <select
                        value={data.usuario_responsable_id}
                        onChange={e => setData('usuario_responsable_id', e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                    >
                        <option value="">Seleccionar usuario</option>
                        {(actoresDelExpediente.length > 0
                            ? actoresDelExpediente.map(a => ({ id: a.usuario_id, name: a.usuario?.name }))
                            : usuariosAsignables
                        ).map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                    {errors.usuario_responsable_id && <p className="text-xs text-red-500 mt-1">{errors.usuario_responsable_id}</p>}
                </div>

                {/* Plazo */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Plazo (días)</label>
                    <input
                        type="number"
                        value={data.dias_plazo}
                        onChange={e => setData('dias_plazo', e.target.value)}
                        min="1"
                        max="365"
                        placeholder="Sin plazo"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                    />
                </div>
            </div>

            {/* Instrucción */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Instrucción *</label>
                <textarea
                    value={data.instruccion}
                    onChange={e => setData('instruccion', e.target.value)}
                    rows={3}
                    placeholder="Describa la instrucción o acción a realizar..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                />
                {errors.instruccion && <p className="text-xs text-red-500 mt-1">{errors.instruccion}</p>}
            </div>

            {/* Observaciones */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observaciones (opcional)</label>
                <textarea
                    value={data.observaciones}
                    onChange={e => setData('observaciones', e.target.value)}
                    rows={2}
                    placeholder="Observaciones adicionales..."
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                />
            </div>

            {/* Documentos */}
            <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos (opcional)</label>
                <input
                    type="file"
                    multiple
                    onChange={e => setData('documentos', Array.from(e.target.files))}
                    className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gray-200 file:text-xs file:font-semibold file:bg-gray-50 hover:file:bg-gray-100"
                />
            </div>

            {/* Notificaciones */}
            {actoresNotificables.length > 0 && (
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">Notificar a (todos preseleccionados)</label>
                    <div className="flex flex-wrap gap-2">
                        {actoresNotificables.map(actor => {
                            const nombre = actor.usuario?.name ?? actor.nombre_externo ?? 'Actor';
                            const checked = data.notificar_a.includes(actor.id);
                            return (
                                <label
                                    key={actor.id}
                                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                                        checked
                                            ? 'bg-[#291136]/5 border-[#291136]/20 text-[#291136]'
                                            : 'bg-gray-50 border-gray-200 text-gray-400'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleNotificar(actor.id)}
                                        className="sr-only"
                                    />
                                    {checked ? <span className="w-3 h-3 rounded-sm bg-[#291136] flex items-center justify-center"><span className="text-white text-[8px]">✓</span></span> : <span className="w-3 h-3 rounded-sm border border-gray-300"/>}
                                    {nombre}
                                    {actor.tipo_actor && <span className="text-gray-300">({actor.tipo_actor.nombre})</span>}
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {errors.general && <p className="text-xs text-red-500">{errors.general}</p>}

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#291136] text-white text-sm font-bold rounded-xl hover:bg-[#3d1a52] transition-colors disabled:opacity-50"
                >
                    <Send size={14}/>
                    {processing ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
            </div>
        </form>
    );
}
