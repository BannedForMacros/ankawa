import { useState, useEffect } from 'react';
import { X, Zap, AlertTriangle, FileText, Users, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Modal para configurar el "traslado automático al responder" de un tipo de documento.
 *
 * Props:
 * - open: boolean
 * - tipoDocumentoNombre: nombre del tipo de doc (cabecera del modal)
 * - responsablesDelTipo: [{ actor_id, nombre }]  ← se generan a partir del bloque de responsables del req
 * - actoresEmailValidado: [{ id, nombre, tipo_actor: { nombre } }]
 * - tiposDocumento: [{ id, nombre }] (para auto-requerimiento)
 * - initial: config previa (o null) → { sumilla, disparadores_actor_ids[], destinatarios_actor_ids[], genera_requerimiento_auto, requerimiento_auto_config{...} }
 * - onSave(config)
 * - onCancel()
 */
export default function ModalTrasladoAuto({
    open, tipoDocumentoNombre, responsablesDelTipo = [], actoresEmailValidado = [],
    tiposDocumento = [], initial = null, onSave, onCancel,
}) {
    const [sumilla, setSumilla] = useState('');
    const [disparadores, setDisparadores] = useState([]);
    const [destinatarios, setDestinatarios] = useState([]);
    const [generaReq, setGeneraReq] = useState(false);
    const [reqTipoDocId, setReqTipoDocId] = useState('');
    const [reqDiasPlazo, setReqDiasPlazo] = useState('');
    const [reqTipoDias, setReqTipoDias] = useState('calendario');
    const [reqResponsableId, setReqResponsableId] = useState('');

    // Cuando se abre, rehidrato desde initial (o limpio si es null).
    useEffect(() => {
        if (!open) return;
        if (initial) {
            setSumilla(initial.sumilla ?? '');
            setDisparadores(initial.disparadores_actor_ids ?? []);
            setDestinatarios(initial.destinatarios_actor_ids ?? []);
            setGeneraReq(!!initial.genera_requerimiento_auto);
            const cfg = initial.requerimiento_auto_config ?? {};
            setReqTipoDocId(cfg.tipo_documento_id ?? '');
            setReqDiasPlazo(cfg.dias_plazo ?? '');
            setReqTipoDias(cfg.tipo_dias ?? 'calendario');
            setReqResponsableId(cfg.responsable_actor_id ?? '');
        } else {
            // Default: todos los responsables del tipo son disparadores.
            setSumilla('');
            setDisparadores(responsablesDelTipo.map(r => r.actor_id));
            setDestinatarios([]);
            setGeneraReq(false);
            setReqTipoDocId('');
            setReqDiasPlazo('');
            setReqTipoDias('calendario');
            setReqResponsableId('');
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!open) return null;

    function toggleEnLista(lista, setter, id) {
        const idStr = String(id);
        setter(lista.map(String).includes(idStr)
            ? lista.filter(x => String(x) !== idStr)
            : [...lista, id]);
    }

    function guardar() {
        if (!sumilla.trim()) {
            toast.error('La sumilla del traslado es obligatoria.');
            return;
        }
        if (disparadores.length === 0) {
            toast.error('Selecciona al menos un responsable que dispare el traslado.');
            return;
        }
        if (destinatarios.length === 0) {
            toast.error('Selecciona al menos un destinatario de la notificación.');
            return;
        }
        if (generaReq) {
            if (!reqTipoDocId) {
                toast.error('Selecciona el tipo de documento del requerimiento automático.');
                return;
            }
            if (!reqDiasPlazo || Number(reqDiasPlazo) < 1) {
                toast.error('Indica el plazo del requerimiento automático.');
                return;
            }
            if (!reqResponsableId) {
                toast.error('Selecciona el responsable del requerimiento automático.');
                return;
            }
        }
        onSave({
            sumilla: sumilla.trim(),
            disparadores_actor_ids: disparadores.map(Number),
            destinatarios_actor_ids: destinatarios.map(Number),
            genera_requerimiento_auto: generaReq,
            requerimiento_auto_config: generaReq ? {
                tipo_documento_id:    Number(reqTipoDocId),
                dias_plazo:           Number(reqDiasPlazo),
                tipo_dias:            reqTipoDias,
                responsable_actor_id: Number(reqResponsableId),
            } : null,
        });
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#291136] to-[#4A153D] px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-amber-300"/>
                        <div>
                            <h3 className="text-white font-bold">Traslado automático</h3>
                            <p className="text-white/60 text-xs mt-0.5">Tipo de documento: <strong className="text-white/90">{tipoDocumentoNombre || '— sin nombre —'}</strong></p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Aviso */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0"/>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Cuando alguno de los <strong>responsables seleccionados</strong> entregue este tipo de documento, el sistema enviará automáticamente una notificación a los <strong>destinatarios</strong> con la sumilla configurada. Opcionalmente puede crear un nuevo requerimiento.
                        </p>
                    </div>

                    {/* Sumilla */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                            Sumilla del traslado *
                        </label>
                        <textarea
                            value={sumilla}
                            onChange={e => setSumilla(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder="Ej. Se corre traslado de la demanda presentada por el demandante a fin de que se pronuncie..."
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BE0F4A] resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{sumilla.length}/2000</p>
                    </div>

                    {/* Disparadores */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                            <ChevronRight size={12} className="text-[#BE0F4A]"/>
                            ¿Quién dispara el traslado al responder? *
                        </label>
                        <p className="text-[11px] text-gray-500 mb-2">
                            De los responsables que asignaste a este tipo, seleccioná cuáles disparan la cascada. Si elegís varios, cada uno disparará por su lado al responder.
                        </p>
                        {responsablesDelTipo.length === 0 ? (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                Primero asignaste responsables a este tipo de documento.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {responsablesDelTipo.map(r => {
                                    const seleccionado = disparadores.map(String).includes(String(r.actor_id));
                                    return (
                                        <button
                                            key={r.actor_id}
                                            type="button"
                                            onClick={() => toggleEnLista(disparadores, setDisparadores, r.actor_id)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                                seleccionado
                                                    ? 'bg-[#BE0F4A] text-white border-[#BE0F4A]'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#BE0F4A]/40'
                                            }`}
                                        >
                                            {r.nombre}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Destinatarios */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                            <Users size={12} className="text-[#BE0F4A]"/>
                            ¿Quién recibe la notificación? *
                        </label>
                        <p className="text-[11px] text-gray-500 mb-2">
                            Solo se listan actores del expediente con email previamente validado.
                        </p>
                        {actoresEmailValidado.length === 0 ? (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                No hay actores con email validado en este expediente.
                            </p>
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {actoresEmailValidado.map(a => {
                                    const seleccionado = destinatarios.map(String).includes(String(a.id));
                                    return (
                                        <button
                                            key={a.id}
                                            type="button"
                                            onClick={() => toggleEnLista(destinatarios, setDestinatarios, a.id)}
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                                seleccionado
                                                    ? 'bg-[#291136] text-white border-[#291136]'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#291136]/40'
                                            }`}
                                        >
                                            {a.nombre}{a.tipo_actor?.nombre ? ` (${a.tipo_actor.nombre})` : ''}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Toggle: genera requerimiento automático */}
                    <div className="border-t border-gray-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setGeneraReq(!generaReq)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                                generaReq ? 'border-[#291136] bg-[#291136]/5' : 'border-dashed border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText size={16} className={generaReq ? 'text-[#291136]' : 'text-gray-400'}/>
                                <span className={`text-sm font-bold ${generaReq ? 'text-[#291136]' : 'text-gray-500'}`}>
                                    Generar requerimiento automático al disparar
                                </span>
                            </div>
                            <span className={`text-xs ${generaReq ? 'text-[#BE0F4A]' : 'text-gray-400'}`}>
                                {generaReq ? 'Activado' : 'Opcional'}
                            </span>
                        </button>

                        {generaReq && (
                            <div className="mt-3 space-y-3 pl-4 border-l-2 border-[#291136]/20">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Tipo de documento solicitado *
                                    </label>
                                    <select
                                        value={reqTipoDocId}
                                        onChange={e => setReqTipoDocId(e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A]"
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Plazo *
                                        </label>
                                        <input
                                            type="number" min="1" max="365"
                                            value={reqDiasPlazo}
                                            onChange={e => setReqDiasPlazo(e.target.value)}
                                            placeholder="Días"
                                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Tipo de días
                                        </label>
                                        <div className="flex rounded-xl overflow-hidden border border-gray-200">
                                            {[
                                                { v: 'calendario', label: 'Calendario' },
                                                { v: 'habiles',    label: 'Hábiles' },
                                            ].map(opt => (
                                                <button key={opt.v} type="button"
                                                    onClick={() => setReqTipoDias(opt.v)}
                                                    className={`flex-1 px-3 py-2 text-xs font-bold transition-colors ${
                                                        reqTipoDias === opt.v
                                                            ? 'bg-[#291136] text-white'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                        Responsable del nuevo requerimiento *
                                    </label>
                                    <select
                                        value={reqResponsableId}
                                        onChange={e => setReqResponsableId(e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A]"
                                    >
                                        <option value="">— Seleccionar —</option>
                                        {actoresEmailValidado.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.nombre}{a.tipo_actor?.nombre ? ` (${a.tipo_actor.nombre})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end gap-3">
                    <button type="button" onClick={onCancel}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors">
                        Cancelar
                    </button>
                    <button type="button" onClick={guardar}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] transition-colors">
                        Guardar configuración
                    </button>
                </div>
            </div>
        </div>
    );
}
