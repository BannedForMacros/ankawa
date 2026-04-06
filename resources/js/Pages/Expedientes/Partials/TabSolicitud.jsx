import { router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download, PlusCircle, Mail, Plus, UserPlus } from 'lucide-react';
import { MovimientoCard, movVacioBase } from './TabNuevoMovimiento';
import toast from 'react-hot-toast';

const movVacio = movVacioBase;

export default function TabSolicitud({ expediente, solicitud, esGestor = false, etapas = [], tiposActor = [], actoresNotificables = [], tiposDocumento = [] }) {
    const [editando, setEditando]             = useState(false);
    const [paso, setPaso]                     = useState('idle');
    const [emailFormActorId, setEmailFormActorId] = useState(null);
    const [showFormDemandado, setShowFormDemandado] = useState(false);
    const [motivoNoConforme, setMotivo]   = useState('');
    const [movimientos, setMovimientos]   = useState([]);
    const [archivosMovimientos, setArchivos] = useState({});
    const [procesando, setProcesando]     = useState(false);
    const [errores, setErrores]           = useState({});
    const [erroresMov, setErroresMov]     = useState([]);

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
                habilitar_mesa_partes:          !!demandado?.id,
                actores_mesa_partes_ids:        demandado?.id ? [demandado.id] : [],
                enviar_credenciales_expediente: false,
                actor_credenciales_exp_id:      '',
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
        // Validar campos de cada movimiento
        const nuevosMov = movimientos.map((mov, i) => {
            const e = {};
            const instrEfectiva = mov.instruccion.trim() ||
                (resultado === 'no_conforme' ? `Subsanación requerida: ${motivoNoConforme}` : '');
            if (!instrEfectiva) e.instruccion = true;
            if (mov.tipo === 'requerimiento') {
                if (!mov.tipo_actor_responsable_id) e.tipo_actor_responsable_id = true;
                if (!mov.usuario_responsable_id)    e.usuario_responsable_id = true;
                if (!mov.dias_plazo || Number(mov.dias_plazo) < 1) e.dias_plazo = true;
            }
            return e;
        });
        if (nuevosMov.some(e => Object.keys(e).length > 0)) {
            setErroresMov(nuevosMov);
            setErrores({ general: 'Completa los campos requeridos en los movimientos.' });
            return;
        }
        setErroresMov([]);
        setProcesando(true);
        setErrores({});

        const form = new FormData();
        form.append('resultado', resultado);
        if (resultado === 'no_conforme') form.append('motivo_no_conformidad', motivoNoConforme);

        movimientos.forEach((mov, i) => {
            form.append(`movimientos[${i}][tipo]`,                        mov.tipo);
            form.append(`movimientos[${i}][etapa_id]`,                    mov.etapa_id ?? '');
            form.append(`movimientos[${i}][sub_etapa_id]`,                mov.sub_etapa_id ?? '');
            const instruccion = mov.instruccion.trim() || (resultado === 'no_conforme' ? `Subsanación requerida: ${motivoNoConforme}` : '');
            form.append(`movimientos[${i}][instruccion]`,                 instruccion);
            form.append(`movimientos[${i}][observaciones]`,               mov.observaciones ?? '');
            form.append(`movimientos[${i}][tipo_actor_responsable_id]`,   mov.tipo_actor_responsable_id ?? '');
            form.append(`movimientos[${i}][usuario_responsable_id]`,      mov.usuario_responsable_id ?? '');
            form.append(`movimientos[${i}][dias_plazo]`,                  mov.dias_plazo ?? '');
            form.append(`movimientos[${i}][tipo_dias]`,                   mov.tipo_dias ?? 'calendario');
            form.append(`movimientos[${i}][tipo_documento_requerido_id]`, mov.tipo_documento_requerido_id ?? '');
            form.append(`movimientos[${i}][habilitar_mesa_partes]`,          mov.habilitar_mesa_partes ? '1' : '0');
            (mov.actores_mesa_partes_ids ?? []).forEach(id => form.append(`movimientos[${i}][actores_mesa_partes_ids][]`, id));
            form.append(`movimientos[${i}][enviar_credenciales_expediente]`, mov.enviar_credenciales_expediente ? '1' : '0');
            form.append(`movimientos[${i}][actor_credenciales_exp_id]`,     mov.actor_credenciales_exp_id ?? '');
            form.append(`movimientos[${i}][credenciales_email_destino]`,    mov.credenciales_email_destino ?? '');
            mov.notificar_a.forEach(id => form.append(`movimientos[${i}][notificar_a][]`, id));
            (archivosMovimientos[i] ?? []).forEach(f => form.append(`documentos[${i}][]`, f));
        });

        router.post(route('expedientes.conformidad', expediente.id), form, {
            forceFormData: true,
            onFinish:  () => setProcesando(false),
            onError:   errs => { setErrores(errs); toast.error('Error al registrar la conformidad. Revise los campos.'); },
            onSuccess: () => { setPaso('idle'); toast.success('Conformidad registrada correctamente.'); },
        });
    }

    // ── Partes del proceso ──
    const demandantes = (expediente.actores ?? []).filter(a => a.activo && a.tipo_actor?.slug === 'demandante');
    const demandados  = (expediente.actores ?? []).filter(a => a.activo && a.tipo_actor?.slug === 'demandado');
    const tipoActorDemandado = tiposActor.find(t => t.slug === 'demandado');

    const formEmail = useForm({ email: '', label: '' });
    function abrirFormEmail(actorId) { formEmail.reset(); setEmailFormActorId(actorId); }
    function cerrarFormEmail() { formEmail.reset(); setEmailFormActorId(null); }
    function agregarEmail(e, actorId) {
        e.preventDefault();
        formEmail.post(route('expedientes.actores.emails.store', [expediente.id, actorId]), {
            onSuccess: () => cerrarFormEmail(),
        });
    }
    function eliminarEmail(actorId, emailId) {
        if (!confirm('¿Eliminar este correo?')) return;
        router.delete(route('expedientes.actores.emails.destroy', [expediente.id, actorId, emailId]));
    }

    const formDemandado = useForm({ tipo_actor_id: tipoActorDemandado?.id ?? '', modo: 'externo', nombre_externo: '', email_externo: '' });
    function agregarDemandado(e) {
        e.preventDefault();
        formDemandado.post(route('expedientes.actores.store', expediente.id), {
            onSuccess: () => { formDemandado.reset(); setShowFormDemandado(false); },
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
        resumen_controversia:                       solicitud.resumen_controversia ?? '',
        pretensiones:                               solicitud.pretensiones ?? '',
        monto_involucrado:                          solicitud.monto_involucrado ?? '',
        solicita_designacion_director_demandado:    solicitud.solicita_designacion_director_demandado ? true : false,
    });

    function guardarEdicion(e) {
        e.preventDefault();
        formEdit.put(route('expedientes.solicitud.update', expediente.id), {
            onSuccess: () => { setEditando(false); toast.success('Datos de solicitud actualizados.'); },
            onError: () => toast.error('Error al guardar los cambios.'),
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

    // Panel de movimientos como función que retorna JSX (no como componente)
    // para evitar desmontaje/remontaje en cada re-render del padre
    function panelMovimientosJSX(colorBtn, resultado) {
        return (
            <div className="space-y-3">
                {movimientos.map((mov, idx) => (
                    <div key={idx} className="space-y-1">
                        <MovimientoCard
                            key={idx}
                            mov={mov}
                            idx={idx}
                            total={movimientos.length}
                            etapas={etapas}
                            tiposActorEnExpediente={tiposActorEnExpediente}
                            actoresExpediente={actoresExpediente}
                            tiposDocumento={tiposDocumento}
                            actoresSinMesaPartes={actoresExpediente.filter(a => !a.acceso_mesa_partes)}
                            actoresSinExpElectronico={actoresExpediente.filter(a => !a.acceso_expediente_electronico)}
                            actoresNotificables={actoresNotificables}
                            archivos={archivosMovimientos[idx] ?? []}
                            onArchivos={files => setArchivos(prev => ({ ...prev, [idx]: files }))}
                            onChange={(field, value) => actualizar(idx, field, value)}
                            onMover={dir => mover(idx, dir)}
                            onQuitar={() => quitar(idx)}
                            errores={erroresMov[idx] ?? {}}
                            etapaActualId={expediente.etapa_actual_id}
                        />
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

                {errores.general && (
                    <p className="text-xs text-red-500 font-medium">{errores.general}</p>
                )}
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

    const inputSmCls = "w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]";

    // Render de una parte (demandante o demandado) con gestión de emails
    function renderParte(actor) {
        const emailPrincipal = actor.usuario?.email ?? actor.email_externo ?? null;
        const adicionales = (actor.emails_adicionales ?? []).filter(e => e.activo !== false);
        const mostrando = emailFormActorId === actor.id;
        return (
            <div key={actor.id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-sm font-bold text-[#291136]">{actor.usuario?.name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{actor.tipo_actor?.nombre}</p>
                    </div>
                    {esGestor && (
                        <button onClick={() => mostrando ? cerrarFormEmail() : abrirFormEmail(actor.id)}
                            className={`p-1.5 rounded-lg transition-colors ${mostrando ? 'bg-[#BE0F4A]/10 text-[#BE0F4A]' : 'text-gray-300 hover:text-[#BE0F4A] hover:bg-[#BE0F4A]/10'}`}
                            title="Gestionar correos">
                            <Mail size={14}/>
                        </button>
                    )}
                </div>
                {/* Lista de emails */}
                <div className="space-y-1">
                    {emailPrincipal && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] shrink-0"/>
                            <span className="font-medium">{emailPrincipal}</span>
                            <span className="text-gray-400 text-[10px]">(principal)</span>
                        </div>
                    )}
                    {adicionales.map(e => (
                        <div key={e.id} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0"/>
                            <span>{e.email}</span>
                            {e.label && <span className="text-gray-400 text-[10px]">({e.label})</span>}
                            {esGestor && (
                                <button onClick={() => eliminarEmail(actor.id, e.id)} className="ml-auto text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                                    <X size={11}/>
                                </button>
                            )}
                        </div>
                    ))}
                    {!emailPrincipal && adicionales.length === 0 && <p className="text-xs text-gray-400 italic">Sin correos registrados.</p>}
                </div>
                {/* Form agregar email inline */}
                {mostrando && (
                    <form onSubmit={e => agregarEmail(e, actor.id)} className="pt-2 border-t border-dashed border-gray-200 flex flex-wrap gap-2 items-end">
                        <input type="email" value={formEmail.data.email} onChange={e => formEmail.setData('email', e.target.value)}
                            placeholder="nuevo@correo.com" className="flex-1 min-w-[180px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"/>
                        <input type="text" value={formEmail.data.label} onChange={e => formEmail.setData('label', e.target.value)}
                            placeholder="Etiqueta (opc.)" className="w-28 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"/>
                        <button type="submit" disabled={formEmail.processing} className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BE0F4A] text-white hover:bg-[#BE0F4A]/90 disabled:opacity-50">
                            <Plus size={11}/> Agregar
                        </button>
                        <button type="button" onClick={cerrarFormEmail} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">Cancelar</button>
                        {formEmail.errors.email && <p className="w-full text-[10px] text-red-500">{formEmail.errors.email}</p>}
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* ── Partes del proceso ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Partes del Proceso</h3>
                    {esGestor && tipoActorDemandado && (
                        <button onClick={() => setShowFormDemandado(v => !v)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BE0F4A] text-white hover:bg-[#BE0F4A]/90 transition-colors">
                            <UserPlus size={12}/> Agregar demandado
                        </button>
                    )}
                </div>
                <div className="p-5 space-y-4">
                    {/* Demandantes */}
                    {demandantes.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-2">Demandante(s)</p>
                            <div className="space-y-2">{demandantes.map(a => renderParte(a))}</div>
                        </div>
                    )}
                    {/* Demandados */}
                    <div>
                        <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-2">Demandado(s)</p>
                        {demandados.length > 0
                            ? <div className="space-y-2">{demandados.map(a => renderParte(a))}</div>
                            : <p className="text-sm text-gray-400 italic">Sin demandados asignados.</p>
                        }
                    </div>
                    {/* Form nuevo demandado */}
                    {showFormDemandado && tipoActorDemandado && (
                        <form onSubmit={agregarDemandado} className="border border-[#BE0F4A]/20 rounded-xl p-4 bg-[#BE0F4A]/5 space-y-3">
                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide">Nuevo Demandado</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                                    <input type="text" value={formDemandado.data.nombre_externo}
                                        onChange={e => formDemandado.setData('nombre_externo', e.target.value)}
                                        placeholder="Nombre del demandado" className={inputSmCls}/>
                                    {formDemandado.errors.nombre_externo && <p className="text-xs text-red-500 mt-1">{formDemandado.errors.nombre_externo}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                                    <input type="email" value={formDemandado.data.email_externo}
                                        onChange={e => formDemandado.setData('email_externo', e.target.value)}
                                        placeholder="correo@ejemplo.com" className={inputSmCls}/>
                                    {formDemandado.errors.email_externo && <p className="text-xs text-red-500 mt-1">{formDemandado.errors.email_externo}</p>}
                                </div>
                            </div>
                            <p className="text-xs text-gray-400">Se creará una cuenta y se enviarán las credenciales automáticamente.</p>
                            <div className="flex gap-2">
                                <button type="submit" disabled={formDemandado.processing}
                                    className="px-4 py-2 text-xs font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#BE0F4A]/90 disabled:opacity-50">
                                    {formDemandado.processing ? 'Agregando...' : 'Agregar Demandado'}
                                </button>
                                <button type="button" onClick={() => { setShowFormDemandado(false); formDemandado.reset(); }}
                                    className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600">Cancelar</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* ── Panel de conformidad (PRIMERO, acción principal) ── */}
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
                            {panelMovimientosJSX('bg-emerald-600 hover:bg-emerald-700', 'conforme')}
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
                                    onChange={e => setMotivo(e.target.value)}
                                    rows={3} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"
                                    placeholder="Indique los motivos por los que la solicitud no es conforme..."/>
                                {errores.motivo_no_conformidad && <p className="text-xs text-red-500 mt-1">{errores.motivo_no_conformidad}</p>}
                            </div>
                            {panelMovimientosJSX('bg-red-600 hover:bg-red-700', 'no_conforme')}
                        </div>
                    )}
                </div>
            )}

            {/* ── Banner: esperando subsanación ── */}
            {esGestor && solicitud.estado === 'subsanacion' && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-amber-700 mb-1">⏳ Esperando subsanación del demandante</h3>
                    <p className="text-sm text-amber-700">
                        Se declaró NO CONFORME. Una vez que el demandante responda, podrás volver a revisar la conformidad desde esta sección.
                    </p>
                </div>
            )}

            {/* ── Datos de la Solicitud ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header de marca */}
                <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
                >
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Datos de la Solicitud</h3>
                        {solicitud.resultado_revision && (
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                solicitud.resultado_revision === 'conforme'
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                    : 'bg-red-100 text-red-700 border-red-300'
                            }`}>
                                {solicitud.resultado_revision === 'conforme' ? 'CONFORME' : 'NO CONFORME'}
                            </span>
                        )}
                    </div>
                    {esGestor && !editando && (
                        <button onClick={() => setEditando(true)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-colors">
                            <Pencil size={12} /> Editar
                        </button>
                    )}
                </div>
                <div
                    className="h-[2px]"
                    style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }}
                />

                <div className="p-5">
                {solicitud.numero_cargo && (
                    <div className="flex items-center gap-3 mb-4 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">N° de Cargo</p>
                            <p className="text-xl font-black font-mono text-[#291136] tracking-wider">{solicitud.numero_cargo}</p>
                        </div>
                    </div>
                )}

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
                                <div className="sm:col-span-2 flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox"
                                            checked={!!formEdit.data.solicita_designacion_director_demandado}
                                            onChange={e => formEdit.setData('solicita_designacion_director_demandado', e.target.checked)}
                                            className="w-4 h-4 accent-[#BE0F4A] rounded"/>
                                        <span className="text-sm font-semibold text-gray-700">Demandado solicita designación de árbitro por el Centro</span>
                                    </label>
                                </div>
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
                                    {campo('Demandante — Designación árbitro por Centro', solicitud.solicita_designacion_director ? 'Sí' : 'No')}
                                    {campo('Demandado — Designación árbitro por Centro', solicitud.solicita_designacion_director_demandado ? 'Sí' : 'No')}
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
                </div>{/* /p-5 */}
            </div>

        </div>
    );
}
