import { useForm } from '@inertiajs/react';
import { Send, Clock, AlertTriangle } from 'lucide-react';

export default function TabAccionPendiente({ expediente, movimiento, actoresNotificables = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        respuesta: '',
        documentos: [],
        notificar_a: actoresNotificables.map(a => a.id),
    });

    const vencido = movimiento.fecha_limite && new Date(movimiento.fecha_limite) < new Date();

    function handleSubmit(e) {
        e.preventDefault();
        post(route('expedientes.movimientos.responder', [expediente.id, movimiento.id]), {
            forceFormData: true,
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
        <div className="space-y-4">
            {/* ── Detalle del movimiento pendiente ── */}
            <div className={`bg-white rounded-2xl border shadow-sm p-5 ${vencido ? 'border-red-200' : 'border-blue-200'}`}>
                <div className="flex items-start gap-3">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${vencido ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                        {vencido ? <AlertTriangle size={18}/> : <Clock size={18}/>}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-[#291136]">{movimiento.instruccion}</h3>
                        {movimiento.observaciones && (
                            <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg p-2">{movimiento.observaciones}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2 flex-wrap">
                            <span>Creado por: {movimiento.creado_por?.name}</span>
                            <span>el {new Date(movimiento.created_at).toLocaleDateString('es-PE')}</span>
                            {movimiento.fecha_limite && (
                                <span className={`font-bold ${vencido ? 'text-red-600' : 'text-amber-600'}`}>
                                    {vencido ? 'VENCIDO' : `Vence: ${new Date(movimiento.fecha_limite).toLocaleDateString('es-PE')}`}
                                </span>
                            )}
                        </div>

                        {/* Documentos adjuntos del movimiento */}
                        {movimiento.documentos?.filter(d => d.momento === 'creacion').length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {movimiento.documentos.filter(d => d.momento === 'creacion').map(doc => (
                                    <span key={doc.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-50 text-gray-600 border border-gray-200">
                                        {doc.nombre_original}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Formulario de respuesta ── */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h3 className="text-sm font-bold text-[#291136]">Mi Respuesta</h3>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Respuesta *</label>
                    <textarea
                        value={data.respuesta}
                        onChange={e => setData('respuesta', e.target.value)}
                        rows={4}
                        placeholder="Escriba su respuesta..."
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"
                    />
                    {errors.respuesta && <p className="text-xs text-red-500 mt-1">{errors.respuesta}</p>}
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Documentos de respuesta (opcional)</label>
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
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Notificar a</label>
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
                        {processing ? 'Enviando...' : 'Enviar Respuesta'}
                    </button>
                </div>
            </form>
        </div>
    );
}
