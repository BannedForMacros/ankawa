import { router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect, Children } from 'react';
import ConfirmModal from '@/Components/ConfirmModal';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, ChevronUp, ChevronDown, KeyRound, Paperclip, X, FileText, Mail } from 'lucide-react';

export const movVacioBase = (expediente, notificarIds = []) => ({
    tipo:                        'requerimiento',
    etapa_id:                    String(expediente.etapa_actual_id ?? ''),
    sub_etapa_id:                '',
    instruccion:                 '',
    observaciones:               '',
    tipo_actor_responsable_id:   '',
    usuario_responsable_id:      '',
    dias_plazo:                  '',
    tipo_dias:                   'calendario',
    tipo_documento_requerido_id: '',
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
function AnkawaSelect({ value, onChange, disabled, children, className = '' }) {
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
                className={`w-full text-sm border rounded-xl px-3.5 py-2.5 pr-9 bg-white text-left focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 transition-colors ${
                    open ? 'border-[#BE0F4A]' : 'border-gray-200 hover:border-gray-300'
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

const inputCls   = "w-full text-sm border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] bg-white resize-none transition-colors";
const SectionLabel = ({ children }) => (
    <p className="text-xs font-black uppercase tracking-widest text-[#BE0F4A] mb-2">{children}</p>
);
const FieldLabel = ({ children }) => (
    <label className="block text-sm font-semibold text-gray-500 mb-1.5">{children}</label>
);

// ── Card de un movimiento individual (exportado para reutilización) ──────────
export function MovimientoCard({
    mov, idx, total,
    etapas, tiposActorEnExpediente, actoresExpediente,
    tiposDocumento, actoresSinMesaPartes, actoresSinExpElectronico, actoresNotificables,
    archivos, onArchivos, onChange, onMover, onQuitar,
}) {
    const tipo     = mov.tipo ?? 'requerimiento';
    const tipoInfo = TIPOS[tipo];
    const esPropia = tipo === 'propia';
    const esReq    = tipo === 'requerimiento';
    const esNotif  = tipo === 'notificacion';

    const subEtapas = useMemo(() => {
        const et = etapas.find(e => String(e.id) === String(mov.etapa_id));
        return et?.sub_etapas ?? [];
    }, [mov.etapa_id, etapas]);

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

    function removeFile(i) {
        onArchivos(archivos.filter((_, j) => j !== i));
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <FieldLabel>Etapa *</FieldLabel>
                            <AnkawaSelect value={mov.etapa_id}
                                onChange={e => { onChange('etapa_id', e.target.value); onChange('sub_etapa_id', ''); }}>
                                <option value="">Seleccionar...</option>
                                {etapas.map(et => <option key={et.id} value={et.id}>{et.orden}. {et.nombre}</option>)}
                            </AnkawaSelect>
                        </div>
                        <div>
                            <FieldLabel>Sub-etapa</FieldLabel>
                            <AnkawaSelect value={mov.sub_etapa_id}
                                onChange={e => onChange('sub_etapa_id', e.target.value)}
                                disabled={subEtapas.length === 0}>
                                <option value="">Ninguna</option>
                                {subEtapas.map(se => <option key={se.id} value={se.id}>{se.orden}. {se.nombre}</option>)}
                            </AnkawaSelect>
                        </div>
                    </div>
                </div>

                {/* ── SECCIÓN 2: Instrucción / Descripción / Acción realizada ── */}
                <div>
                    <SectionLabel>
                        {esPropia ? 'Acción realizada' : esNotif ? 'Descripción del traslado' : 'Instrucción'}
                    </SectionLabel>
                    <textarea value={mov.instruccion} onChange={e => onChange('instruccion', e.target.value)}
                        rows={3} className={inputCls}
                        placeholder={
                            esPropia ? 'Describa la acción realizada por el gestor...'
                            : esNotif ? 'Describa el contenido del traslado o notificación...'
                            : 'Describa la instrucción o acción a realizar...'
                        }
                    />
                </div>

                {/* ── SECCIÓN 3: Responsable + Plazo (solo requerimiento) ── */}
                {esReq && (
                    <div>
                        <SectionLabel>Responsable y Plazo</SectionLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <FieldLabel>Tipo Actor</FieldLabel>
                                <AnkawaSelect value={mov.tipo_actor_responsable_id}
                                    onChange={e => { onChange('tipo_actor_responsable_id', e.target.value); onChange('usuario_responsable_id', ''); }}>
                                    <option value="">— Ninguno —</option>
                                    {tiposActorConAcceso.map(ta => <option key={ta.id} value={ta.id}>{ta.nombre}</option>)}
                                </AnkawaSelect>
                            </div>
                            <div>
                                <FieldLabel>Usuario</FieldLabel>
                                <AnkawaSelect value={mov.usuario_responsable_id}
                                    onChange={e => onChange('usuario_responsable_id', e.target.value)}>
                                    <option value="">— Ninguno —</option>
                                    {usuariosFiltrados.map(a => (
                                        <option key={a.usuario.id} value={a.usuario.id}>{a.usuario.name} — {a.tipo_actor?.nombre}</option>
                                    ))}
                                </AnkawaSelect>
                            </div>
                            <div>
                                <FieldLabel>Plazo (días)</FieldLabel>
                                <div className="flex gap-2 items-stretch">
                                    <input type="number" min="1" max="365" value={mov.dias_plazo}
                                        onChange={e => onChange('dias_plazo', e.target.value)}
                                        className={`${inputCls} flex-1`} placeholder="Ej: 5"/>
                                    <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                        {[
                                            { v: 'calendario', label: 'Cal.' },
                                            { v: 'habiles',    label: 'Háb.' },
                                        ].map(opt => (
                                            <button key={opt.v} type="button"
                                                onClick={() => onChange('tipo_dias', opt.v)}
                                                title={opt.v === 'calendario' ? 'Días calendario (incluye fines de semana)' : 'Días hábiles (excluye sábados y domingos)'}
                                                className={`px-3 py-2 text-xs font-bold transition-colors ${
                                                    mov.tipo_dias === opt.v
                                                        ? 'bg-[#291136] text-white'
                                                        : 'bg-white text-gray-500 hover:bg-gray-50'
                                                }`}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SECCIÓN 4: Tipo documento requerido (solo requerimiento) ── */}
                {esReq && (
                    <div>
                        <SectionLabel>Documento requerido</SectionLabel>
                        {(() => {
                            const docsFiltered = mov.tipo_actor_responsable_id
                                ? tiposDocumento.filter(td =>
                                    td.permisos?.some(p =>
                                        String(p.tipo_actor_id) === String(mov.tipo_actor_responsable_id) && p.puede_subir
                                    )
                                  )
                                : tiposDocumento;
                            return docsFiltered.length === 0 && mov.tipo_actor_responsable_id ? (
                                <p className="text-xs text-gray-400 italic mt-1">
                                    Sin documentos configurados para requerir a este actor.
                                </p>
                            ) : (
                                <AnkawaSelect value={mov.tipo_documento_requerido_id}
                                    onChange={e => onChange('tipo_documento_requerido_id', e.target.value)}>
                                    <option value="">— Ninguno —</option>
                                    {docsFiltered.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                                </AnkawaSelect>
                            );
                        })()}
                    </div>
                )}

                {/* ── SECCIÓN 5: Documentos adjuntos ── */}
                <div>
                    <SectionLabel>Documentos adjuntos</SectionLabel>
                    <label className="flex items-center gap-2 cursor-pointer w-fit px-3 py-2 rounded-lg border border-dashed border-[#BE0F4A]/40 text-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors text-sm font-semibold">
                        <Paperclip size={13}/>
                        Adjuntar archivos
                        <input type="file" multiple className="sr-only"
                            onChange={e => onArchivos([...archivos, ...Array.from(e.target.files)])}/>
                    </label>
                    {archivos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {archivos.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs max-w-[220px]">
                                    <FileText size={11} className="text-[#BE0F4A] shrink-0"/>
                                    <span className="truncate font-medium text-gray-700">{f.name}</span>
                                    <span className="text-gray-400 shrink-0">{(f.size/1024).toFixed(0)}KB</span>
                                    <button type="button" onClick={() => removeFile(i)}
                                        className="text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-0.5">
                                        <X size={11}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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
                        <div className="border border-amber-200/60 rounded-xl overflow-hidden">
                            <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-amber-50/60 cursor-pointer select-none">
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
                                <div className="px-3.5 py-3 bg-white border-t border-amber-200/40 space-y-2">
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
    actoresNotificables = [], tiposDocumento = [],
}) {
    const defaultNotificarIds = actoresNotificables.map(a => a.id);

    const [movimientos, setMovimientos]      = useState([movVacio(expediente, defaultNotificarIds)]);
    const [archivosMovimientos, setArchivos] = useState({ 0: [] });
    const [procesando, setProcesando]        = useState(false);
    const [confirm, setConfirm] = useState(false);

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

    function handleSubmit(e) {
        e.preventDefault();
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
            form.append('sub_etapa_id',                mov.sub_etapa_id ?? '');
            form.append('instruccion',                 mov.instruccion);
            form.append('observaciones',               mov.observaciones ?? '');
            form.append('tipo_actor_responsable_id',   mov.tipo_actor_responsable_id ?? '');
            form.append('usuario_responsable_id',      mov.usuario_responsable_id ?? '');
            form.append('dias_plazo',                  mov.dias_plazo ?? '');
            form.append('tipo_dias',                   mov.tipo_dias ?? 'calendario');
            form.append('tipo_documento_requerido_id', mov.tipo_documento_requerido_id ?? '');
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
                },
                onError: () => toast.error('Error al crear el movimiento. Revise los campos.'),
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
                form.append(`movimientos[${i}][tipo_dias]`,                   mov.tipo_dias ?? 'calendario');
                form.append(`movimientos[${i}][tipo_documento_requerido_id]`, mov.tipo_documento_requerido_id ?? '');
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
                },
                onError: () => toast.error('Error al crear los movimientos. Revise los campos.'),
            });
        }
    }

    const esBatch = movimientos.length > 1;

    return (
        <>
        <ConfirmModal
            open={confirm}
            titulo="Confirmar movimiento"
            resumen={movimientos.length > 1
                ? `Se crearán ${movimientos.length} movimientos en secuencia para este expediente.`
                : 'Se creará el movimiento y se notificará a los actores seleccionados.'}
            onConfirm={doSubmit}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />
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
                        />
                    ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button type="button" onClick={agregar}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#291136] px-3 py-2 rounded-lg border border-dashed border-[#291136]/30 hover:bg-[#291136]/5 transition-colors">
                        <PlusCircle size={13}/> Agregar movimiento
                    </button>
                    <button type="submit" disabled={procesando}
                        className="px-5 py-2.5 text-sm font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#BE0F4A]/90 disabled:opacity-50 transition-colors">
                        {procesando ? 'Creando...' : esBatch ? `Crear ${movimientos.length} movimientos` : 'Crear Movimiento'}
                    </button>
                </div>
            </form>
        </div>
        </>
    );
}
