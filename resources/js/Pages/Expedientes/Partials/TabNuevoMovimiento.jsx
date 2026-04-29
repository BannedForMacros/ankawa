import { router, usePage } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect, Children } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ChevronUp, ChevronDown, KeyRound, Paperclip, X, FileText, Mail, Layers, ArrowRight } from 'lucide-react';

export const movVacioBase = (expediente, notificarIds = []) => ({
    tipo:                        'requerimiento',
    etapa_id:                    String(expediente.etapa_actual_id ?? ''),
    instruccion:                 '',
    observaciones:               '',
    tipo_actor_responsable_id:   '',
    usuario_responsable_id:      '',
    responsables:                [{ tipo_actor_id: '', actor_ids: [], dias_plazo: '', tipo_dias: 'calendario' }],
    dias_plazo:                  '',
    tipo_dias:                   'calendario',
    tipo_documento_requerido_id: '',
    documento_tipo_id:           '',
    habilitar_mesa_partes:          false,
    actores_mesa_partes_ids:        [],
    enviar_credenciales_expediente: false,
    actor_credenciales_exp_id:      '',
    credenciales_email_destino:     '',
    notificar_a:                 notificarIds,
});

const TIPOS = {
    requerimiento: {
        label:  'Requerimiento',
        desc:   'Se asigna a un actor con plazo para responder. El movimiento queda pendiente hasta que sea respondido.',
        badge:  'bg-[#BE0F4A]/10 text-[#BE0F4A] border-[#BE0F4A]/30',
        header: 'border-l-[#BE0F4A]',
    },
    notificacion: {
        label:  'Traslado / Notificación',
        desc:   'Se comunica a los actores seleccionados. No genera pendiente ni requiere respuesta formal.',
        badge:  'bg-indigo-50 text-indigo-700 border-indigo-200',
        header: 'border-l-indigo-400',
    },
    propia: {
        label:  'Actuación Propia',
        desc:   'Registra una acción ejecutada por el gestor. Aparece en el historial identificada como acción del gestor.',
        badge:  'bg-gray-100 text-gray-600 border-gray-300',
        header: 'border-l-gray-400',
    },
};

/* ── Select estilizado propio ─────────────────────────────────────────────── */
function AnkawaSelect({ value, onChange, disabled, children, className = '', hasError = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const options = useMemo(() => {
        const opts = [];
        Children.forEach(children, child => {
            if (child?.type === 'option') {
                opts.push({ value: String(child.props.value ?? ''), label: child.props.children });
            }
        });
        return opts;
    }, [children]);

    const selected = options.find(o => o.value === String(value ?? ''));

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (disabled) return (
        <div className={`relative ${className}`}>
            <div className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 pr-9 bg-gray-50 text-gray-400 font-medium flex items-center">
                <span className="truncate">{selected?.label ?? '—'}</span>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            </div>
        </div>
    );

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button type="button" onClick={() => setOpen(o => !o)}
                className={`w-full text-sm border rounded-xl px-3.5 py-2.5 pr-9 bg-white text-left focus:outline-none focus:ring-2 transition-colors ${
                    hasError
                        ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                        : open ? 'border-[#BE0F4A] focus:ring-[#BE0F4A]/20' : 'border-gray-200 hover:border-gray-300 focus:ring-[#BE0F4A]/20'
                }`}>
                <span className={`block truncate font-medium ${!selected || selected.value === '' ? 'text-gray-400' : 'text-gray-800'}`}>
                    {selected?.label ?? 'Seleccionar...'}
                </span>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto py-1">
                        {options.map(opt => (
                            <button key={opt.value} type="button"
                                onClick={() => { onChange({ target: { value: opt.value } }); setOpen(false); }}
                                className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                                    opt.value === String(value ?? '')
                                        ? 'bg-[#BE0F4A] text-white font-semibold'
                                        : opt.value === ''
                                        ? 'text-gray-400 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A]'
                                        : 'text-gray-800 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A]'
                                }`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Multi-select con checkboxes (lista plana, ya filtrada externamente) ───── */
function MultiActorSelect({ value = [], onChange, actores, hasError, disabled = false }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const strValue = value.map(String);
    const todosSeleccionados = actores.length > 0 && actores.every(a => strValue.includes(String(a.id)));

    function toggleActor(id) {
        const s = String(id);
        onChange(strValue.includes(s) ? strValue.filter(x => x !== s) : [...strValue, s]);
    }

    function toggleTodos() {
        if (todosSeleccionados) {
            onChange([]);
        } else {
            onChange(actores.map(a => String(a.id)));
        }
    }

    const selectedCount = strValue.length;
    let displayText = '— Seleccionar usuarios —';
    if (disabled || actores.length === 0) {
        displayText = '— Selecciona un tipo primero —';
    } else if (selectedCount === 1) {
        const a = actores.find(a => String(a.id) === strValue[0]);
        displayText = a?.usuario?.name ?? a?.nombre_externo ?? '1 usuario';
    } else if (selectedCount > 1) {
        displayText = `${selectedCount} de ${actores.length} seleccionados`;
    }

    if (disabled) return (
        <div className="relative flex-1 min-w-[180px]">
            <div className="w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 pr-9 bg-gray-50 text-gray-400 font-medium flex items-center">
                <span className="truncate">{displayText}</span>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"/>
            </div>
        </div>
    );

    return (
        <div ref={ref} className="relative flex-1 min-w-[180px]">
            <button type="button" onClick={() => setOpen(o => !o)}
                className={`w-full text-sm border rounded-xl px-3.5 py-2.5 pr-9 bg-white text-left focus:outline-none focus:ring-2 transition-colors ${
                    hasError
                        ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
                        : open ? 'border-[#BE0F4A] focus:ring-[#BE0F4A]/20' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <span className={`block truncate font-medium ${selectedCount === 0 ? 'text-gray-400' : 'text-gray-800'}`}>
                    {displayText}
                </span>
                <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}/>
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Header: seleccionar / deseleccionar todos */}
                    <label className="flex items-center gap-2.5 px-3.5 py-2 bg-[#BE0F4A]/5 border-b border-[#BE0F4A]/10 cursor-pointer select-none hover:bg-[#BE0F4A]/10 transition-colors">
                        <input
                            type="checkbox"
                            checked={todosSeleccionados}
                            onChange={toggleTodos}
                            className="w-3.5 h-3.5 accent-[#BE0F4A] rounded shrink-0"/>
                        <span className="text-xs font-black uppercase tracking-widest text-[#BE0F4A]">
                            Todos
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-[#BE0F4A]/60 shrink-0">
                            {selectedCount}/{actores.length}
                        </span>
                    </label>
                    <div className="max-h-52 overflow-y-auto py-1">
                        {actores.map(actor => {
                            const sel = strValue.includes(String(actor.id));
                            return (
                                <label key={actor.id}
                                    className={`flex items-center gap-2.5 px-3.5 py-2 cursor-pointer select-none transition-colors ${
                                        sel ? 'bg-[#BE0F4A]/5' : 'hover:bg-gray-50'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={sel}
                                        onChange={() => toggleActor(actor.id)}
                                        className="w-3.5 h-3.5 accent-[#BE0F4A] rounded shrink-0"/>
                                    <span className={`text-sm font-medium ${sel ? 'text-[#291136] font-semibold' : 'text-gray-700'}`}>
                                        {actor.usuario?.name ?? actor.nombre_externo ?? 'Sin nombre'}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

const inputCls   = "w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] bg-white resize-none transition-colors";
const inputClsErr = "w-full text-sm border border-red-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-500 bg-white resize-none transition-colors";
const SectionLabel = ({ children }) => (
    <p className="text-xs font-black uppercase tracking-widest text-[#BE0F4A] mb-2">{children}</p>
);
const FieldLabel = ({ children }) => (
    <label className="block text-sm font-semibold text-gray-500 mb-1.5">{children}</label>
);
const FieldError = ({ msg }) => msg ? (
    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
        <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0"/>
        {msg}
    </p>
) : null;

// ── Card de un movimiento individual (exportado para reutilización) ──────────
export function MovimientoCard({
    mov, idx, total,
    etapas, tiposActorEnExpediente, actoresExpediente,
    tiposDocumento, actoresSinMesaPartes, actoresSinExpElectronico, actoresNotificables,
    archivos, onArchivos, onChange, onMover, onQuitar,
    errores = {}, etapaActualId = null, solicitudEsConforme = true,
    miTipoActorId = null,
}) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const tipo     = mov.tipo ?? 'requerimiento';
    const tipoInfo = TIPOS[tipo];
    const esPropia = tipo === 'propia';
    const esReq    = tipo === 'requerimiento';
    const esNotif  = tipo === 'notificacion';

    // ── Lógica de avance de etapa ──────────────────────────────────────────
    const etapaActual = useMemo(() =>
        etapas.find(e => String(e.id) === String(etapaActualId)),
    [etapas, etapaActualId]);

    const siguienteEtapa = useMemo(() => {
        const ordenActual = etapaActual?.orden ?? 0;
        return etapas
            .filter(e => e.orden > ordenActual)
            .sort((a, b) => a.orden - b.orden)[0] ?? null;
    }, [etapas, etapaActual]);

    const avanzandoEtapa = !!(siguienteEtapa && String(mov.etapa_id) === String(siguienteEtapa.id));

    // Bloqueo de conformidad: la etapa actual requiere conformidad y la solicitud no está conforme
    const bloqueadaPorConformidad = !!(etapaActual?.requiere_conformidad && !solicitudEsConforme);

    function toggleAvanzarEtapa(checked) {
        if (bloqueadaPorConformidad) return;
        const nuevoId = checked && siguienteEtapa ? String(siguienteEtapa.id) : String(etapaActualId ?? '');
        onChange('etapa_id', nuevoId);
    }

    // Solo actores con acceso a Mesa de Partes (pueden recibir requerimientos y responder)
    const actoresConAcceso = useMemo(() =>
        actoresExpediente.filter(a => a.acceso_mesa_partes),
    [actoresExpediente]);

    // Tipos de actor donde al menos uno tiene acceso (para el select de Responsable)
    const tiposActorConAcceso = useMemo(() => {
        const ids = new Set(actoresConAcceso.map(a => a.tipo_actor_id));
        return tiposActorEnExpediente.filter(t => ids.has(t.id));
    }, [actoresConAcceso, tiposActorEnExpediente]);

    const usuariosFiltrados = useMemo(() => {
        const base = actoresConAcceso;
        if (!mov.tipo_actor_responsable_id) return base;
        return base.filter(a => String(a.tipo_actor_id) === String(mov.tipo_actor_responsable_id));
    }, [mov.tipo_actor_responsable_id, actoresConAcceso]);

    // Tipos de documento que el usuario logueado (según su tipo de actor en el servicio)
    // tiene permiso de SUBIR. Si no tiene tipo de actor o no hay permisos, no puede adjuntar.
    const tiposDocumentoSubibles = useMemo(() => {
        if (!miTipoActorId) return [];
        return tiposDocumento.filter(td =>
            (td.permisos ?? []).some(p =>
                String(p.tipo_actor_id) === String(miTipoActorId) && p.puede_subir
            )
        );
    }, [tiposDocumento, miTipoActorId]);

    // Auto-seleccionar cuando solo hay 1 tipo disponible.
    useEffect(() => {
        if (tiposDocumentoSubibles.length === 1 && !mov.documento_tipo_id) {
            onChange('documento_tipo_id', String(tiposDocumentoSubibles[0].id));
        }
    }, [tiposDocumentoSubibles, mov.documento_tipo_id]);

    const [previewFile, setPreviewFile] = useState(null);

    function removeFile(i) {
        onArchivos(archivos.filter((_, j) => j !== i));
    }

    function openPreview(f) {
        setPreviewFile(f);
    }

    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

    return (
        <div className={`border border-gray-200 border-l-4 ${tipoInfo.header} rounded-xl bg-white`}>

            {/* ── Header de la card ── */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 rounded-t-xl">
                <div className="flex items-center gap-2">
                    {total > 1 && (
                        <span className="text-xs font-black text-[#291136] bg-white border border-gray-200 rounded px-1.5">#{idx + 1}</span>
                    )}
                    {/* Selector tipo */}
                    <div className="flex gap-1">
                        {Object.entries(TIPOS).map(([key, info]) => (
                            <button key={key} type="button"
                                onClick={() => {
                                    onChange('tipo', key);
                                    if (key !== 'requerimiento') { onChange('dias_plazo', ''); onChange('tipo_actor_responsable_id', ''); onChange('usuario_responsable_id', ''); }
                                }}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors ${
                                    tipo === key ? info.badge : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                }`}
                            >
                                {info.label}
                            </button>
                        ))}
                    </div>
                    {total > 1 && (
                        <div className="flex gap-0.5 ml-1">
                            <button type="button" onClick={() => onMover(-1)} disabled={idx === 0}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"><ChevronUp size={12}/></button>
                            <button type="button" onClick={() => onMover(1)} disabled={idx === total - 1}
                                className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors"><ChevronDown size={12}/></button>
                        </div>
                    )}
                </div>
                {total > 1 && (
                    <button type="button" onClick={onQuitar} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={13}/>
                    </button>
                )}
            </div>

            <div className="p-4 space-y-4">

                {/* Descripción del tipo */}
                <p className="text-xs text-gray-400 -mt-1 leading-relaxed">{tipoInfo.desc}</p>

                {/* ── SECCIÓN 1: Etapa ── */}
                <div>
                    <SectionLabel>Etapa</SectionLabel>
                    <div className="space-y-2">
                        {/* Etapa actual — no editable */}
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#291136]/5 rounded-xl border border-[#291136]/10">
                            <Layers size={13} className="text-[#291136] shrink-0"/>
                            <span className="text-xs text-gray-500 font-medium">Etapa actual:</span>
                            <span className="text-xs font-bold text-[#291136]">{etapaActual?.nombre ?? '—'}</span>
                        </div>

                        {/* Banner de bloqueo por conformidad */}
                        {bloqueadaPorConformidad && (
                            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-300 rounded-xl">
                                <ArrowRight size={14} className="text-red-500 shrink-0 mt-0.5"/>
                                <div>
                                    <p className="text-sm font-bold text-red-700">Conformidad requerida</p>
                                    <p className="text-xs text-red-600 mt-0.5">
                                        Esta etapa requiere que la solicitud esté declarada <strong>CONFORME</strong> antes de avanzar a otra etapa. Ve a la pestaña <strong>Solicitud</strong> para registrar la conformidad.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Avanzar a la siguiente etapa */}
                        {siguienteEtapa ? (
                            <label className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border select-none transition-colors ${
                                bloqueadaPorConformidad
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                    : avanzandoEtapa
                                    ? 'cursor-pointer bg-amber-50 border-amber-300'
                                    : 'cursor-pointer bg-white border-gray-200 hover:border-gray-300'
                            }`}>
                                <input type="checkbox" checked={avanzandoEtapa}
                                    disabled={bloqueadaPorConformidad}
                                    onChange={e => toggleAvanzarEtapa(e.target.checked)}
                                    className="w-4 h-4 accent-amber-500 rounded shrink-0"/>
                                <ArrowRight size={13} className={avanzandoEtapa ? 'text-amber-500' : 'text-gray-400'}/>
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-semibold ${avanzandoEtapa ? 'text-amber-800' : 'text-gray-600'}`}>
                                        Avanzar a siguiente etapa
                                    </span>
                                    <span className={`block text-xs ${avanzandoEtapa ? 'text-amber-700 font-bold' : 'text-gray-400'}`}>
                                        {siguienteEtapa.orden}. {siguienteEtapa.nombre}
                                    </span>
                                </div>
                                {avanzandoEtapa && (
                                    <span className="text-[10px] font-black uppercase tracking-wide text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0 border border-amber-200">
                                        Avance de etapa
                                    </span>
                                )}
                            </label>
                        ) : (
                            <p className="text-xs text-gray-400 italic px-1">Esta es la última etapa del proceso.</p>
                        )}
                    </div>
                </div>

                {/* ── SECCIÓN 2: Instrucción / Descripción / Acción realizada ── */}
                <div>
                    <SectionLabel>
                        {esPropia ? 'Acción realizada' : esNotif ? 'Descripción del traslado' : 'Instrucción'}
                    </SectionLabel>
                    <textarea value={mov.instruccion} onChange={e => onChange('instruccion', e.target.value)}
                        rows={3} className={errores.instruccion ? inputClsErr : inputCls}
                        placeholder={
                            esPropia ? 'Describa la acción realizada por el gestor...'
                            : esNotif ? 'Describa el contenido del traslado o notificación...'
                            : 'Describa la instrucción o acción a realizar...'
                        }
                    />
                    <FieldError msg={errores.instruccion ? 'Este campo es obligatorio.' : null}/>
                </div>

                {/* ── SECCIÓN 3: Responsables (solo requerimiento) ── */}
                {esReq && (
                    <div>
                        <SectionLabel>Responsables *</SectionLabel>
                        <div className={`border rounded-xl ${errores.responsables ? 'border-red-300' : 'border-[#BE0F4A]/20'}`}>
                            <div className="px-3.5 py-2.5 bg-[#BE0F4A]/5 border-b border-[#BE0F4A]/10 flex items-center justify-between">
                                <p className="text-xs font-black text-[#BE0F4A] uppercase tracking-widest">
                                    Actores responsables
                                </p>
                                {mov.responsables.reduce((acc, r) => acc + (r.actor_ids?.length ?? 0), 0) > 0 && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#BE0F4A] text-white">
                                        {mov.responsables.reduce((acc, r) => acc + (r.actor_ids?.length ?? 0), 0)} actor(es)
                                    </span>
                                )}
                            </div>
                            <div className="p-3 space-y-2">
                                {mov.responsables.map((fila, ri) => {
                                    // Actores del tipo seleccionado para esta fila
                                    const actoresDeFila = fila.tipo_actor_id
                                        ? actoresConAcceso.filter(a => String(a.tipo_actor_id) === String(fila.tipo_actor_id))
                                        : [];

                                    return (
                                    <div key={ri} className="flex flex-wrap items-start gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                                        {/* Select 1: tipo de actor */}
                                        <div className="flex-1 min-w-[140px]">
                                            <AnkawaSelect
                                                value={String(fila.tipo_actor_id ?? '')}
                                                hasError={!!errores[`responsables_${ri}_tipo`]}
                                                onChange={e => {
                                                    const nuevoTipoId = e.target.value;
                                                    const actoresDelTipo = actoresConAcceso
                                                        .filter(a => String(a.tipo_actor_id) === String(nuevoTipoId))
                                                        .map(a => String(a.id));
                                                    onChange('responsables', mov.responsables.map((r, j) =>
                                                        j === ri ? { ...r, tipo_actor_id: nuevoTipoId, actor_ids: actoresDelTipo } : r
                                                    ));
                                                }}>
                                                <option value="">— Tipo de actor —</option>
                                                {tiposActorConAcceso.map(ta => (
                                                    <option key={ta.id} value={String(ta.id)}>{ta.nombre}</option>
                                                ))}
                                            </AnkawaSelect>
                                        </div>
                                        {/* Select 2: usuarios de ese tipo (multi-checkbox) */}
                                        <MultiActorSelect
                                            value={fila.actor_ids ?? []}
                                            hasError={!!errores[`responsables_${ri}_actor`]}
                                            actores={actoresDeFila}
                                            disabled={!fila.tipo_actor_id}
                                            onChange={ids => {
                                                const updated = mov.responsables.map((r, j) =>
                                                    j === ri ? { ...r, actor_ids: ids } : r
                                                );
                                                onChange('responsables', updated);
                                            }}
                                        />
                                        {/* Plazo input */}
                                        <input
                                            type="number" min="1" max="365"
                                            value={fila.dias_plazo ?? ''}
                                            placeholder="Días"
                                            onChange={e => {
                                                const updated = mov.responsables.map((r, j) =>
                                                    j === ri ? { ...r, dias_plazo: e.target.value } : r
                                                );
                                                onChange('responsables', updated);
                                            }}
                                            className={`w-20 text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] bg-white transition-colors shrink-0 ${
                                                errores[`responsables_${ri}_plazo`] ? 'border-red-400' : 'border-gray-200'
                                            }`}
                                        />
                                        {/* Cal/Háb toggle */}
                                        <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                            {[
                                                { v: 'calendario', label: 'Cal.' },
                                                { v: 'habiles',    label: 'Háb.' },
                                            ].map(opt => (
                                                <button key={opt.v} type="button"
                                                    onClick={() => {
                                                        const updated = mov.responsables.map((r, j) =>
                                                            j === ri ? { ...r, tipo_dias: opt.v } : r
                                                        );
                                                        onChange('responsables', updated);
                                                    }}
                                                    title={opt.v === 'calendario' ? 'Días calendario' : 'Días hábiles (excluye sábados y domingos)'}
                                                    className={`px-3 py-2 text-xs font-bold transition-colors ${
                                                        (fila.tipo_dias ?? 'calendario') === opt.v
                                                            ? 'bg-[#291136] text-white'
                                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Remove button */}
                                        {mov.responsables.length > 1 && (
                                            <button type="button"
                                                onClick={() => onChange('responsables', mov.responsables.filter((_, j) => j !== ri))}
                                                className="p-2 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                                <X size={15}/>
                                            </button>
                                        )}
                                    </div>
                                    );
                                })}
                                <button type="button"
                                    onClick={() => onChange('responsables', [
                                        ...mov.responsables,
                                        { tipo_actor_id: '', actor_ids: [], dias_plazo: '', tipo_dias: 'calendario' },
                                    ])}
                                    className="flex items-center gap-1.5 text-xs font-bold text-[#BE0F4A] hover:text-[#291136] transition-colors mt-1">
                                    <PlusCircle size={13}/>
                                    Agregar grupo de responsables
                                </button>
                            </div>
                        </div>
                        <FieldError msg={errores.responsables ? errores.responsables : null}/>
                    </div>
                )}

                {/* ── SECCIÓN 4: Tipo documento requerido (solo requerimiento) ── */}
                {esReq && (
                    <div>
                        <SectionLabel>Documento requerido *</SectionLabel>
                        {tiposDocumento.length === 0 ? (
                            <p className="text-xs text-gray-400 italic mt-1">
                                Sin documentos configurados para este servicio.
                            </p>
                        ) : (
                            <>
                            <AnkawaSelect value={mov.tipo_documento_requerido_id}
                                hasError={!!errores.tipo_documento_requerido}
                                onChange={e => onChange('tipo_documento_requerido_id', e.target.value)}>
                                <option value="">— Seleccionar —</option>
                                {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                            </AnkawaSelect>
                            <FieldError msg={errores.tipo_documento_requerido ? 'Selecciona el tipo de documento requerido.' : null}/>
                            </>
                        )}
                    </div>
                )}

                {/* ── SECCIÓN 5: Documentos adjuntos ── */}
                <div>
                    <SectionLabel>Documentos adjuntos</SectionLabel>
                    {tiposDocumentoSubibles.length === 0 ? (
                        <p className="text-xs text-gray-400 italic mt-1">
                            Tu rol no tiene permiso para subir documentos en este servicio.
                        </p>
                    ) : (
                        <>
                            <FieldLabel>Tipo de documento *</FieldLabel>
                            <AnkawaSelect
                                value={mov.documento_tipo_id}
                                disabled={tiposDocumentoSubibles.length === 1}
                                hasError={!!errores.documento_tipo_id}
                                onChange={e => onChange('documento_tipo_id', e.target.value)}
                            >
                                {tiposDocumentoSubibles.length > 1 && <option value="">— Seleccionar —</option>}
                                {tiposDocumentoSubibles.map(td => (
                                    <option key={td.id} value={td.id}>{td.nombre}</option>
                                ))}
                            </AnkawaSelect>
                            <FieldError msg={errores.documento_tipo_id ? 'Selecciona el tipo de documento.' : null}/>

                            <label className="mt-3 flex items-center gap-2 cursor-pointer w-fit px-4 py-2.5 rounded-lg border border-dashed border-[#BE0F4A]/40 text-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors text-sm font-semibold">
                                <Paperclip size={15}/>
                                Adjuntar archivos
                                <input type="file" multiple accept={upload_accept} className="sr-only"
                                    onChange={e => onArchivos([...archivos, ...Array.from(e.target.files)])}/>
                            </label>
                            <p className="text-xs text-gray-400 mt-1">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                            {archivos.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {archivos.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                                            <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                                            <button type="button" onClick={() => openPreview(f)}
                                                className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                                {f.name}
                                            </button>
                                            <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                            <button type="button" onClick={() => removeFile(i)}
                                                className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Modal de previsualización ── */}
                {previewFile && (() => {
                    const url = URL.createObjectURL(previewFile);
                    const ext = previewFile.name.split('.').pop().toLowerCase();
                    const esImagen = ['jpg','jpeg','png','gif','webp'].includes(ext);
                    const esPdf   = ext === 'pdf';
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            onClick={closePreview}>
                            <div className="absolute inset-0 bg-black/60"/>
                            <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                                onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-[#BE0F4A]"/>
                                        <span className="text-sm font-semibold text-gray-800 truncate max-w-[400px]">{previewFile.name}</span>
                                    </div>
                                    <button type="button" onClick={closePreview}
                                        className="text-gray-400 hover:text-gray-700 transition-colors">
                                        <X size={20}/>
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                                    {esImagen && (
                                        <img src={url} alt={previewFile.name}
                                            className="max-w-full max-h-[70vh] rounded object-contain"/>
                                    )}
                                    {esPdf && (
                                        <iframe src={url} title={previewFile.name}
                                            className="w-full h-[70vh] rounded border-0"/>
                                    )}
                                    {!esImagen && !esPdf && (
                                        <div className="text-center text-gray-400">
                                            <FileText size={48} className="mx-auto mb-3 text-gray-300"/>
                                            <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                                            <p className="text-sm mt-1">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ── SEPARADOR: Opciones adicionales ── */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Opciones adicionales</p>

                    {/* Habilitar acceso a Mesa de Partes — solo notificacion/propia, actores sin acceso */}
                    {!esReq && actoresSinMesaPartes.length > 0 && (
                        <div className="border border-emerald-200/60 rounded-xl overflow-hidden">
                            <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50/60 cursor-pointer select-none">
                                <input type="checkbox"
                                    checked={!!mov.habilitar_mesa_partes}
                                    onChange={e => {
                                        onChange('habilitar_mesa_partes', e.target.checked);
                                        if (!e.target.checked) onChange('actores_mesa_partes_ids', []);
                                    }}
                                    className="w-4 h-4 accent-emerald-600 rounded"/>
                                <Mail size={13} className="text-emerald-600 shrink-0"/>
                                <span className="text-sm font-bold text-emerald-700">Habilitar acceso a Mesa de Partes</span>
                            </label>
                            {mov.habilitar_mesa_partes && (
                                <div className="px-3.5 py-3 bg-white border-t border-emerald-200/40 space-y-1.5">
                                    <p className="text-xs text-emerald-600 leading-relaxed mb-2">
                                        Los actores seleccionados podrán ver este expediente en el portal, responder requerimientos y enviar documentos. Se notificará por email.
                                    </p>
                                    {actoresSinMesaPartes.map(actor => {
                                        const sel = mov.actores_mesa_partes_ids.includes(actor.id);
                                        return (
                                            <label key={actor.id}
                                                className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                                                    sel ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:border-gray-200'
                                                }`}>
                                                <input type="checkbox" checked={sel}
                                                    onChange={e => onChange('actores_mesa_partes_ids', e.target.checked
                                                        ? [...mov.actores_mesa_partes_ids, actor.id]
                                                        : mov.actores_mesa_partes_ids.filter(x => x !== actor.id))}
                                                    className="w-3.5 h-3.5 accent-emerald-600 rounded shrink-0"/>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-sm font-semibold ${sel ? 'text-emerald-800' : 'text-gray-700'}`}>
                                                        {actor.usuario?.name ?? actor.nombre_externo ?? 'Sin nombre'}
                                                    </span>
                                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 ml-1.5">
                                                        {actor.tipo_actor?.nombre}
                                                    </span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enviar credenciales de Expediente Electrónico — solo notificacion/propia */}
                    {!esReq && actoresSinExpElectronico.length > 0 && (
                        <div className="border border-amber-200/60 rounded-xl">
                            <label className={`flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-50/60 cursor-pointer select-none ${mov.enviar_credenciales_expediente ? 'rounded-t-xl' : 'rounded-xl'}`}>
                                <input type="checkbox"
                                    checked={!!mov.enviar_credenciales_expediente}
                                    onChange={e => {
                                        onChange('enviar_credenciales_expediente', e.target.checked);
                                        if (!e.target.checked) { onChange('actor_credenciales_exp_id', ''); onChange('credenciales_email_destino', ''); }
                                    }}
                                    className="w-4 h-4 accent-amber-500 rounded"/>
                                <KeyRound size={13} className="text-amber-600 shrink-0"/>
                                <span className="text-sm font-bold text-amber-700">Enviar credenciales de Expediente Electrónico</span>
                            </label>
                            {mov.enviar_credenciales_expediente && (
                                <div className="px-3.5 py-3 bg-white border-t border-amber-200/40 rounded-b-xl space-y-2">
                                    <p className="text-xs text-amber-600 leading-relaxed mb-1">
                                        El actor recibirá credenciales (email + contraseña) para acceder al historial completo del expediente en la plataforma interna.
                                    </p>
                                    <FieldLabel>Actor que recibirá credenciales</FieldLabel>
                                    <AnkawaSelect
                                        value={mov.actor_credenciales_exp_id}
                                        onChange={e => {
                                            onChange('actor_credenciales_exp_id', e.target.value);
                                            onChange('credenciales_email_destino', '');
                                        }}>
                                        <option value="">— Seleccionar actor —</option>
                                        {actoresSinExpElectronico.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.usuario?.name ?? a.nombre_externo ?? 'Sin nombre'} — {a.tipo_actor?.nombre}
                                            </option>
                                        ))}
                                    </AnkawaSelect>
                                    {mov.actor_credenciales_exp_id && (() => {
                                        const actorSel = actoresExpediente.find(a => String(a.id) === String(mov.actor_credenciales_exp_id));
                                        if (!actorSel) return null;
                                        const emailPrincipal = actorSel.usuario?.email ?? actorSel.email_externo ?? '';
                                        const adicionales = (actorSel.emails_adicionales ?? []).filter(e => e.activo !== false);
                                        const todosEmails = [
                                            emailPrincipal ? { email: emailPrincipal, label: 'Principal' } : null,
                                            ...adicionales,
                                        ].filter(Boolean);

                                        if (todosEmails.length <= 1) {
                                            return (
                                                <p className="text-xs text-amber-600 leading-relaxed">
                                                    Las credenciales se enviarán a <strong>{emailPrincipal}</strong>.
                                                </p>
                                            );
                                        }

                                        return (
                                            <div>
                                                <FieldLabel>Correo destino para las credenciales</FieldLabel>
                                                <AnkawaSelect
                                                    value={mov.credenciales_email_destino || emailPrincipal}
                                                    onChange={e => onChange('credenciales_email_destino', e.target.value)}>
                                                    {todosEmails.map(e => (
                                                        <option key={e.email} value={e.email}>
                                                            {e.email}{e.label ? ` (${e.label})` : ''}
                                                        </option>
                                                    ))}
                                                </AnkawaSelect>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Observaciones */}
                    <div>
                        <FieldLabel>Observaciones <span className="font-normal text-gray-400">(opcional)</span></FieldLabel>
                        <textarea value={mov.observaciones} onChange={e => onChange('observaciones', e.target.value)}
                            rows={2} className={inputCls}
                            placeholder="Observaciones adicionales..."/>
                    </div>

                    {/* Notificación por email — solo actores con acceso_mesa_partes, no en propia */}
                    {!esPropia && actoresNotificables.length > 0 && (
                        <div className="border border-gray-100 rounded-xl overflow-hidden">
                            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border-b border-gray-100">
                                <Mail size={13} className="text-gray-400"/>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Notificación por email</p>
                                <span className="ml-auto text-[11px] text-gray-400">
                                    {mov.notificar_a.length} / {actoresNotificables.length} seleccionados
                                </span>
                            </div>
                            <div className="p-3 space-y-1.5">
                                {actoresNotificables.map(actor => {
                                    const seleccionado = mov.notificar_a.includes(actor.id);
                                    const emails = actor.emails ?? [];
                                    return (
                                        <label key={actor.id}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                                                seleccionado
                                                    ? 'bg-[#291136]/5 border-[#291136]/20'
                                                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                            }`}>
                                            <input type="checkbox"
                                                checked={seleccionado}
                                                onChange={e => onChange('notificar_a', e.target.checked
                                                    ? [...mov.notificar_a, actor.id]
                                                    : mov.notificar_a.filter(x => x !== actor.id))}
                                                className="mt-0.5 w-3.5 h-3.5 accent-[#291136] rounded shrink-0"/>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`text-sm font-semibold ${seleccionado ? 'text-[#291136]' : 'text-gray-700'}`}>
                                                        {actor.nombre}
                                                    </span>
                                                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                                        {actor.tipo_actor?.nombre}
                                                    </span>
                                                    {emails.length > 1 && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A]">
                                                            {emails.length} emails
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                    {emails.map((em, i) => (
                                                        <span key={i} className="text-[11px] text-gray-400 font-mono">
                                                            {em}{i < emails.length - 1 ? ',' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const movVacio = movVacioBase;

export default function TabNuevoMovimiento({
    expediente, etapas = [], tiposActor = [], usuariosAsignables = [],
    actoresNotificables = [], tiposDocumento = [], miTipoActorId = null,
}) {
    const defaultNotificarIds = actoresNotificables.map(a => a.id);

    const [movimientos, setMovimientos]      = useState([movVacio(expediente, defaultNotificarIds)]);
    const [archivosMovimientos, setArchivos] = useState({ 0: [] });
    const [procesando, setProcesando]        = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [errores, setErrores]  = useState([{}]);

    const actoresExpediente = useMemo(() =>
        (expediente.actores ?? []).filter(a => a.activo && a.usuario),
    [expediente.actores]);

    const tiposActorEnExpediente = useMemo(() => {
        const idsPresentes = new Set(actoresExpediente.map(a => a.tipo_actor_id));
        return tiposActor.filter(t => idsPresentes.has(t.id));
    }, [actoresExpediente, tiposActor]);

    // Actores sin acceso a Mesa de Partes
    const actoresSinMesaPartes = useMemo(() =>
        actoresExpediente.filter(a => !a.acceso_mesa_partes),
    [actoresExpediente]);

    // Actores sin acceso a Expediente Electrónico
    const actoresSinExpElectronico = useMemo(() =>
        actoresExpediente.filter(a => !a.acceso_expediente_electronico),
    [actoresExpediente]);

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

    function validarMovimientos() {
        return movimientos.map(mov => {
            const e = {};
            if (!mov.instruccion?.trim()) e.instruccion = true;
            if (mov.tipo === 'requerimiento') {
                const totalActores = (mov.responsables ?? []).reduce((acc, r) => acc + (r.actor_ids?.length ?? 0), 0);
                if (!mov.responsables || mov.responsables.length === 0 || totalActores === 0) {
                    e.responsables = 'Selecciona al menos un actor responsable.';
                } else {
                    mov.responsables.forEach((r, ri) => {
                        if (!r.tipo_actor_id) e[`responsables_${ri}_tipo`] = true;
                        if (!r.actor_ids || r.actor_ids.length === 0) e[`responsables_${ri}_actor`] = true;
                        if (!r.dias_plazo || Number(r.dias_plazo) < 1) e[`responsables_${ri}_plazo`] = true;
                    });
                }
                if (tiposDocumento.length > 0 && !mov.tipo_documento_requerido_id) e.tipo_documento_requerido = true;
            }
            // Si adjuntó archivos, debe haber elegido tipo de documento.
            if ((archivosMovimientos[movimientos.indexOf(mov)] ?? []).length > 0 && !mov.documento_tipo_id) {
                e.documento_tipo_id = true;
            }
            return e;
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validarMovimientos();
        if (errs.some(e => Object.keys(e).length > 0)) {
            setErrores(errs);
            toast.error('Completa los campos requeridos antes de continuar.');
            return;
        }
        setErrores(movimientos.map(() => ({})));
        setConfirm(true);
    }

    function doSubmit() {
        setConfirm(false);
        setProcesando(true);

        if (movimientos.length === 1) {
            const mov = movimientos[0];
            const form = new FormData();
            form.append('tipo',                        mov.tipo);
            form.append('etapa_id',                    mov.etapa_id ?? '');
            form.append('instruccion',                 mov.instruccion);
            form.append('observaciones',               mov.observaciones ?? '');
            form.append('tipo_actor_responsable_id',   mov.tipo_actor_responsable_id ?? '');
            (mov.responsables ?? []).filter(r => (r.actor_ids ?? []).length > 0).forEach((r, ri) => {
                (r.actor_ids ?? []).forEach(id => form.append(`responsables[${ri}][actor_ids][]`, id));
                if (r.dias_plazo) form.append(`responsables[${ri}][dias_plazo]`, r.dias_plazo);
                form.append(`responsables[${ri}][tipo_dias]`,  r.tipo_dias ?? 'calendario');
            });
            form.append('dias_plazo',                  mov.dias_plazo ?? '');
            form.append('tipo_dias',                   mov.tipo_dias ?? 'calendario');
            form.append('tipo_documento_requerido_id', mov.tipo_documento_requerido_id ?? '');
            form.append('documento_tipo_id',           mov.documento_tipo_id ?? '');
            form.append('habilitar_mesa_partes',          mov.habilitar_mesa_partes ? '1' : '0');
            mov.actores_mesa_partes_ids.forEach(id => form.append('actores_mesa_partes_ids[]', id));
            form.append('enviar_credenciales_expediente', mov.enviar_credenciales_expediente ? '1' : '0');
            form.append('actor_credenciales_exp_id',     mov.actor_credenciales_exp_id ?? '');
            form.append('credenciales_email_destino',    mov.credenciales_email_destino ?? '');
            (archivosMovimientos[0] ?? []).forEach(f => form.append('documentos[]', f));
            mov.notificar_a.forEach(id => form.append('notificar_a[]', id));

            router.post(route('expedientes.movimientos.store', expediente.id), form, {
                forceFormData: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => {
                    toast.success('Movimiento creado correctamente.');
                    setMovimientos([movVacio(expediente, defaultNotificarIds)]);
                    setArchivos({ 0: [] });
                    setErrores([{}]);
                },
                onError: () => toast.error('Error al crear el movimiento. Revise los campos.'),
            });
        } else {
            const form = new FormData();
            movimientos.forEach((mov, i) => {
                form.append(`movimientos[${i}][tipo]`,                        mov.tipo);
                form.append(`movimientos[${i}][etapa_id]`,                    mov.etapa_id ?? '');
                form.append(`movimientos[${i}][instruccion]`,                 mov.instruccion);
                form.append(`movimientos[${i}][observaciones]`,               mov.observaciones ?? '');
                form.append(`movimientos[${i}][tipo_actor_responsable_id]`,   mov.tipo_actor_responsable_id ?? '');
                (mov.responsables ?? []).filter(r => (r.actor_ids ?? []).length > 0).forEach((r, ri) => {
                    (r.actor_ids ?? []).forEach(id => form.append(`movimientos[${i}][responsables][${ri}][actor_ids][]`, id));
                    if (r.dias_plazo) form.append(`movimientos[${i}][responsables][${ri}][dias_plazo]`, r.dias_plazo);
                    form.append(`movimientos[${i}][responsables][${ri}][tipo_dias]`,  r.tipo_dias ?? 'calendario');
                });
                form.append(`movimientos[${i}][dias_plazo]`,                  mov.dias_plazo ?? '');
                form.append(`movimientos[${i}][tipo_dias]`,                   mov.tipo_dias ?? 'calendario');
                form.append(`movimientos[${i}][tipo_documento_requerido_id]`, mov.tipo_documento_requerido_id ?? '');
                form.append(`movimientos[${i}][documento_tipo_id]`,           mov.documento_tipo_id ?? '');
                form.append(`movimientos[${i}][habilitar_mesa_partes]`,          mov.habilitar_mesa_partes ? '1' : '0');
                mov.actores_mesa_partes_ids.forEach(id => form.append(`movimientos[${i}][actores_mesa_partes_ids][]`, id));
                form.append(`movimientos[${i}][enviar_credenciales_expediente]`, mov.enviar_credenciales_expediente ? '1' : '0');
                form.append(`movimientos[${i}][actor_credenciales_exp_id]`,     mov.actor_credenciales_exp_id ?? '');
                form.append(`movimientos[${i}][credenciales_email_destino]`,    mov.credenciales_email_destino ?? '');
                mov.notificar_a.forEach(id => form.append(`movimientos[${i}][notificar_a][]`, id));
                (archivosMovimientos[i] ?? []).forEach(f => form.append(`documentos[${i}][]`, f));
            });

            router.post(route('expedientes.movimientos.lote', expediente.id), form, {
                forceFormData: true,
                onFinish: () => setProcesando(false),
                onSuccess: () => {
                    toast.success(`${movimientos.length} movimientos creados correctamente.`);
                    setMovimientos([movVacio(expediente, defaultNotificarIds)]);
                    setArchivos({ 0: [] });
                    setErrores([{}]);
                },
                onError: () => toast.error('Error al crear los movimientos. Revise los campos.'),
            });
        }
    }

    const esBatch = movimientos.length > 1;

    // Bloqueo global: etapa actual requiere conformidad y la solicitud no está conforme y se intenta avanzar
    const etapaActualObj = etapas.find(e => String(e.id) === String(expediente.etapa_actual_id));
    const solicitudEsConforme = expediente.solicitud?.resultado_revision === 'conforme';
    const bloqueadoPorConformidad = !!(etapaActualObj?.requiere_conformidad && !solicitudEsConforme &&
        movimientos.some(m => String(m.etapa_id) !== String(expediente.etapa_actual_id)));

    return (
        <>
        {confirm && (() => {
            const mov   = movimientos[0];
            const tipo  = mov?.tipo ?? 'requerimiento';
            const esBatch = movimientos.length > 1;

            const tipoActorNombre   = tiposActorEnExpediente.find(t => String(t.id) === String(mov?.tipo_actor_responsable_id))?.nombre;
            const responsablesNombres = (() => {
                const nombres = (mov?.responsables ?? []).flatMap(r =>
                    (r.actor_ids ?? [])
                        .map(id => actoresExpediente.find(a => String(a.id) === String(id)))
                        .filter(Boolean)
                        .map(a => a.usuario?.name ?? a.nombre_externo ?? 'Sin nombre')
                );
                return nombres.length > 0 ? nombres.join(', ') : null;
            })();
            const docNombre         = tiposDocumento.find(d => String(d.id) === String(mov?.tipo_documento_requerido_id))?.nombre;
            const expNumero         = expediente.numero_expediente ?? `EXP-${expediente.id}`;

            // Detectar avance de etapa
            const etapaActualNombre = etapas.find(e => String(e.id) === String(expediente.etapa_actual_id))?.nombre;
            const etapaNuevaNombre  = etapas.find(e => String(e.id) === String(mov?.etapa_id))?.nombre;
            const hayAvanceEtapa    = !esBatch && String(mov?.etapa_id) !== String(expediente.etapa_actual_id);
            // En batch, detectar si alguno cambia de etapa
            const batchAvanceEtapa  = esBatch && movimientos.some(m => String(m.etapa_id) !== String(expediente.etapa_actual_id));

            let titulo, resumen, detalles, variant;

            if (esBatch) {
                titulo   = `Confirmar ${movimientos.length} movimientos`;
                resumen  = batchAvanceEtapa
                    ? `⚠ Uno o más movimientos incluyen un avance de etapa. Al confirmar, la etapa del expediente se actualizará. Esta acción no se puede deshacer.`
                    : 'Se crearán en secuencia para este expediente. Esta acción no se puede deshacer.';
                detalles = [
                    { label: 'Expediente', value: expNumero },
                    ...movimientos.map((m, i) => {
                        const avanza = String(m.etapa_id) !== String(expediente.etapa_actual_id);
                        const eNueva = etapas.find(e => String(e.id) === String(m.etapa_id))?.nombre;
                        return {
                            label: `Mov. ${i + 1}`,
                            value: `${{ requerimiento: 'Requerimiento', notificacion: 'Traslado', propia: 'Actuación Propia' }[m.tipo] ?? m.tipo}${avanza && eNueva ? ` → avanza a "${eNueva}"` : ''}`,
                        };
                    }),
                ];
                variant  = batchAvanceEtapa ? 'danger' : 'warning';
            } else if (tipo === 'requerimiento') {
                titulo   = 'Confirmar requerimiento';
                resumen  = hayAvanceEtapa
                    ? `⚠ Al crear este movimiento se cerrará la etapa "${etapaActualNombre}" y el expediente avanzará a "${etapaNuevaNombre}". Esta acción no se puede deshacer.`
                    : 'Se asignará al actor responsable con un plazo para responder. El movimiento quedará pendiente hasta ser respondido.';
                detalles = [
                    { label: 'Expediente',          value: expNumero },
                    hayAvanceEtapa && { label: '⚠ Cierra etapa', value: etapaActualNombre },
                    hayAvanceEtapa && { label: '→ Nueva etapa',  value: etapaNuevaNombre },
                    tipoActorNombre    && { label: 'Tipo actor',      value: tipoActorNombre },
                    responsablesNombres && { label: 'Responsable(s)', value: responsablesNombres },
                    (mov?.responsables ?? []).some(r => r.actor_ids?.length > 0) && {
                        label: 'Plazos',
                        value: (mov.responsables ?? [])
                            .filter(r => r.actor_ids?.length > 0)
                            .map(r => `${r.dias_plazo} días ${r.tipo_dias === 'habiles' ? 'hábiles' : 'cal.'}`)
                            .join(' / '),
                    },
                    docNombre         && { label: 'Documento requerido', value: docNombre },
                ].filter(Boolean);
                variant  = hayAvanceEtapa ? 'danger' : 'warning';
            } else if (tipo === 'notificacion') {
                titulo   = 'Confirmar traslado / notificación';
                resumen  = hayAvanceEtapa
                    ? `⚠ Al crear este movimiento se cerrará la etapa "${etapaActualNombre}" y el expediente avanzará a "${etapaNuevaNombre}".`
                    : 'Se comunicará a los actores seleccionados. No genera pendiente ni requiere respuesta formal.';
                detalles = [
                    { label: 'Expediente', value: expNumero },
                    hayAvanceEtapa && { label: '⚠ Cierra etapa', value: etapaActualNombre },
                    hayAvanceEtapa && { label: '→ Nueva etapa',  value: etapaNuevaNombre },
                    mov?.actores_mesa_partes_ids?.length > 0 && { label: 'Notificar a', value: `${mov.actores_mesa_partes_ids.length} actor(es)` },
                ].filter(Boolean);
                variant  = hayAvanceEtapa ? 'danger' : 'info';
            } else {
                titulo   = 'Confirmar actuación propia';
                resumen  = hayAvanceEtapa
                    ? `⚠ Al crear este movimiento se cerrará la etapa "${etapaActualNombre}" y el expediente avanzará a "${etapaNuevaNombre}".`
                    : 'Se registrará como acción ejecutada por el gestor y aparecerá en el historial del expediente.';
                detalles = [
                    { label: 'Expediente', value: expNumero },
                    hayAvanceEtapa && { label: '⚠ Cierra etapa', value: etapaActualNombre },
                    hayAvanceEtapa && { label: '→ Nueva etapa',  value: etapaNuevaNombre },
                    mov?.instruccion && { label: 'Acción', value: mov.instruccion.length > 60 ? mov.instruccion.substring(0, 60) + '…' : mov.instruccion },
                ].filter(Boolean);
                variant  = 'info';
            }

            return (
                <ConfirmModal
                    open={confirm}
                    titulo={titulo}
                    resumen={resumen}
                    detalles={detalles}
                    variant={variant}
                    onConfirm={doSubmit}
                    onCancel={() => setConfirm(false)}
                    confirmando={procesando}
                />
            );
        })()}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div
                className="px-5 py-3 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
            >
                <h3 className="text-sm font-black text-white uppercase tracking-widest">
                    {esBatch ? `Crear ${movimientos.length} movimientos en secuencia` : 'Nuevo Movimiento'}
                </h3>
                {esBatch && (
                    <span className="text-[11px] text-white/60">Se crean en orden (#1 primero)</span>
                )}
            </div>
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }}/>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="space-y-3">
                    {movimientos.map((mov, idx) => (
                        <MovimientoCard
                            key={idx}
                            mov={mov} idx={idx} total={movimientos.length}
                            etapas={etapas}
                            tiposActorEnExpediente={tiposActorEnExpediente}
                            actoresExpediente={actoresExpediente}
                            tiposDocumento={tiposDocumento}
                            actoresSinMesaPartes={actoresSinMesaPartes}
                            actoresSinExpElectronico={actoresSinExpElectronico}
                            actoresNotificables={actoresNotificables}
                            archivos={archivosMovimientos[idx] ?? []}
                            onArchivos={files => setArchivosIdx(idx, files)}
                            onChange={(field, value) => actualizar(idx, field, value)}
                            onMover={dir => mover(idx, dir)}
                            onQuitar={() => quitar(idx)}
                            errores={errores[idx] ?? {}}
                            etapaActualId={expediente.etapa_actual_id}
                            solicitudEsConforme={expediente.solicitud?.resultado_revision === 'conforme'}
                            miTipoActorId={miTipoActorId}
                        />
                    ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button type="button" onClick={agregar}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#291136] px-3 py-2 rounded-lg border border-dashed border-[#291136]/30 hover:bg-[#291136]/5 transition-colors">
                        <PlusCircle size={13}/> Agregar movimiento
                    </button>
                    <button type="submit" disabled={procesando || bloqueadoPorConformidad}
                        className="px-5 py-2.5 text-sm font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#BE0F4A]/90 disabled:opacity-50 transition-colors">
                        {procesando ? 'Creando...' : esBatch ? `Crear ${movimientos.length} movimientos` : 'Crear Movimiento'}
                    </button>
                </div>
            </form>
        </div>
        </>
    );
}
