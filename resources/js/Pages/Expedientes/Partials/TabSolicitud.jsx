import { router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download, PlusCircle, Mail, Plus, UserPlus, Building2, Users, Landmark, AlertTriangle, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import { MovimientoCard, movVacioBase } from './TabNuevoMovimiento';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// Constantes de etiquetas de documentos por servicio
// ─────────────────────────────────────────────────────────────────
const DOC_LABELS_ARB = {
    doc_controversia:                  { label: 'Documentos de la Controversia',   seccion: 'Controversia' },
    anexo_inicial:                     { label: 'Anexos',                           seccion: 'Controversia' },
    comprobante_pago_tasa:             { label: 'Comprobante de Pago de Tasa',      seccion: 'Pago' },
    medida_cautelar:                   { label: 'Medida Cautelar',                  seccion: 'Controversia' },
    vigencia_poder_demandante:         { label: 'Vigencia de Poder',                seccion: 'Demandante' },
    contrato_consorcio_demandante:     { label: 'Contrato de Consorcio',            seccion: 'Demandante' },
    resolucion_facultades_demandante:  { label: 'Resolución de Facultades',         seccion: 'Demandante' },
    vigencia_poder_demandado:          { label: 'Vigencia de Poder',                seccion: 'Demandado' },
    contrato_consorcio_demandado:      { label: 'Contrato de Consorcio',            seccion: 'Demandado' },
    resolucion_facultades_demandado:   { label: 'Resolución de Facultades',         seccion: 'Demandado' },
};

const DOC_LABELS_JPRD = {
    solicitud_conformacion:        { label: 'Solicitud de Conformación',           seccion: 'Documentos' },
    contrato_obra:                 { label: 'Contrato de Obra',                    seccion: 'Documentos' },
    adenda:                        { label: 'Adenda',                              seccion: 'Documentos' },
    anexo:                         { label: 'Anexos',                              seccion: 'Documentos' },
    peticion_decision_vinculante:  { label: 'Petición de Decisión Vinculante',     seccion: 'Petición Previa' },
};

// Agrupa documentos por sección para mostrarlos organizados
function agruparDocumentos(docs, labelMap) {
    const grupos = {};
    (docs ?? []).filter(d => d.activo !== false).forEach(doc => {
        const info = labelMap[doc.tipo_documento] ?? { label: doc.tipo_documento ?? 'Otros', seccion: 'Otros' };
        const key  = info.seccion;
        if (!grupos[key]) grupos[key] = [];
        grupos[key].push({ ...doc, _label: info.label });
    });
    return grupos;
}

// Subtipo jurídico: badge + info de una persona jurídica
const SUBTIPO_META = {
    empresa:         { label: 'EMPRESA',         color: 'bg-violet-100 text-violet-700', Icono: Building2 },
    consorcio:       { label: 'CONSORCIO',        color: 'bg-blue-100 text-blue-700',    Icono: Users     },
    entidad_publica: { label: 'ENTIDAD PÚBLICA',  color: 'bg-teal-100 text-teal-700',    Icono: Landmark  },
};

const movVacio = movVacioBase;

export default function TabSolicitud({ expediente, solicitud, esGestor = false, etapas = [], tiposActor = [], actoresNotificables = [], tiposDocumento = [], miTipoActorId = null }) {
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
    // Edición de correo principal y validación manual del actor
    const [editandoEmailActorId, setEditandoEmailActorId] = useState(null);
    const [confirmarValidarActor, setConfirmarValidarActor] = useState(null); // actor en modal
    const formEmailPrincipal = useForm({ email: '' });

    const defaultNotificarIds = actoresNotificables.map(a => a.id);
    const esJPRD = (expediente.solicitud_type ?? '').includes('JPRD');

    // Labels según servicio: JPRD usa Entidad/Contratista en lugar de Demandante/Demandado
    const labelDem  = esJPRD ? 'Entidad'      : 'Demandante';
    const labelDado = esJPRD ? 'Contratista'  : 'Demandado';

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

        if (!demandante) {
            toast.error('No se encontró al demandante activo en el expediente.');
            return;
        }
        if (!demandado) {
            toast.error(`No se encontró al ${labelDado.toLowerCase()} activo. Verifique los actores antes de declarar conforme.`);
            return;
        }
        if (!demandado.validado_por_gestor) {
            toast.error(`El correo del ${labelDado.toLowerCase()} no ha sido validado. Use el botón "Validar correo" en "Partes del Proceso" antes de declarar conforme.`);
            return;
        }
        if (!demandado.usuario?.id) {
            toast.error(`Inconsistencia: el ${labelDado.toLowerCase()} figura validado pero no tiene cuenta interna. Re-valide el correo.`);
            return;
        }

        setMovimientos([
            // 1. Notificación al demandante: CONFORME
            {
                ...movVacio(expediente, defaultNotificarIds),
                tipo:                       'notificacion',
                instruccion:                'Conformidad de la solicitud: La solicitud ha sido declarada CONFORME.',
                tipo_actor_responsable_id:  String(demandante.tipo_actor_id ?? ''),
                usuario_responsable_id:     String(demandante.usuario?.id ?? ''),
            },
            // 2. Notificación al demandado: TRASLADO + habilitar Mesa de Partes
            {
                ...movVacio(expediente, defaultNotificarIds),
                tipo:                            'notificacion',
                instruccion:                     `Traslado de la solicitud al ${labelDado.toLowerCase()}: Se le notifica que ha sido emplazado en el presente proceso. Se le otorga acceso a Mesa de Partes para presentar escritos y recibir notificaciones.`,
                tipo_actor_responsable_id:       String(demandado.tipo_actor_id ?? ''),
                usuario_responsable_id:          String(demandado.usuario.id),
                habilitar_mesa_partes:           true,
                actores_mesa_partes_ids:         [demandado.id],
                enviar_credenciales_expediente:  false,
                actor_credenciales_exp_id:       '',
            },
            // 3. Requerimiento al demandado: APERSONAMIENTO con plazo
            {
                ...movVacio(expediente, defaultNotificarIds),
                tipo:                            'requerimiento',
                instruccion:                     `Requerimiento de apersonamiento: Se requiere al ${labelDado.toLowerCase()} apersonarse al presente proceso en el plazo indicado, designando árbitro y/o presentando contestación según corresponda.`,
                tipo_actor_responsable_id:       String(demandado.tipo_actor_id ?? ''),
                usuario_responsable_id:          String(demandado.usuario.id),
                dias_plazo:                      String(plazoApers),
                habilitar_mesa_partes:           false,
                actores_mesa_partes_ids:         [],
                enviar_credenciales_expediente:  false,
                actor_credenciales_exp_id:       '',
            },
        ]);
        setArchivos({ 0: [], 1: [], 2: [] });
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
            const instruccion = mov.instruccion.trim() || (resultado === 'no_conforme' ? `Subsanación requerida: ${motivoNoConforme}` : '');
            form.append(`movimientos[${i}][instruccion]`,                 instruccion);
            form.append(`movimientos[${i}][observaciones]`,               mov.observaciones ?? '');
            form.append(`movimientos[${i}][tipo_actor_responsable_id]`,   mov.tipo_actor_responsable_id ?? '');
            form.append(`movimientos[${i}][usuario_responsable_id]`,      mov.usuario_responsable_id ?? '');
            form.append(`movimientos[${i}][dias_plazo]`,                  mov.dias_plazo ?? '');
            form.append(`movimientos[${i}][tipo_dias]`,                   mov.tipo_dias ?? 'calendario');
            form.append(`movimientos[${i}][tipo_documento_requerido_id]`, mov.tipo_documento_requerido_id ?? '');
            form.append(`movimientos[${i}][documento_tipo_id]`,           mov.documento_tipo_id ?? '');
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

    // ── Edición de correo principal del actor ──
    function abrirEditarEmailPrincipal(actor) {
        formEmailPrincipal.setData('email', actor.usuario?.email ?? actor.email_externo ?? '');
        setEditandoEmailActorId(actor.id);
    }
    function cerrarEditarEmailPrincipal() {
        formEmailPrincipal.reset();
        setEditandoEmailActorId(null);
    }
    function guardarEmailPrincipal(e, actorId) {
        e.preventDefault();
        formEmailPrincipal.put(route('expedientes.actores.email-principal.update', [expediente.id, actorId]), {
            preserveScroll: true,
            onSuccess: () => { cerrarEditarEmailPrincipal(); toast.success('Correo actualizado.'); },
            onError: errs => toast.error(errs.email ?? 'No se pudo actualizar el correo.'),
        });
    }

    // ── Validación manual del actor ──
    function confirmarValidacion() {
        if (!confirmarValidarActor) return;
        router.post(route('expedientes.actores.validar', [expediente.id, confirmarValidarActor.id]), {}, {
            preserveScroll: true,
            onSuccess: () => { setConfirmarValidarActor(null); toast.success('Correo validado correctamente.'); },
            onError: errs => toast.error(Object.values(errs)[0] ?? 'No se pudo validar el correo.'),
        });
    }
    function revocarValidacion(actor) {
        if (!confirm(`¿Revocar la validación del correo de ${actor.usuario?.name ?? actor.nombre_externo ?? 'este actor'}? Tendrá que volver a validarlo antes de declarar conforme.`)) return;
        router.delete(route('expedientes.actores.invalidar', [expediente.id, actor.id]), {
            preserveScroll: true,
            onSuccess: () => toast.success('Validación revocada.'),
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
                            miTipoActorId={miTipoActorId}
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
        const editandoEmail = editandoEmailActorId === actor.id;
        const validado = !!actor.validado_por_gestor;
        // La validación solo aplica a partes en disputa (demandante/demandado);
        // los demás actores internos no la requieren para declarar conforme.
        const requiereValidacion = ['demandante', 'demandado'].includes(actor.tipo_actor?.slug);
        return (
            <div key={actor.id} className={`bg-gray-50 rounded-xl border p-3 space-y-2 ${requiereValidacion && !validado ? 'border-amber-300 bg-amber-50/30' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#291136]">{actor.usuario?.name ?? actor.nombre_externo ?? '—'}</p>
                        <p className="text-xs text-gray-400">{actor.tipo_actor?.nombre}</p>
                        {requiereValidacion && (
                            <span className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                validado
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                            }`}>
                                {validado ? <ShieldCheck size={10}/> : <ShieldAlert size={10}/>}
                                {validado ? 'Correo validado' : 'Sin validar'}
                            </span>
                        )}
                    </div>
                    {esGestor && (
                        <div className="flex items-center gap-1 shrink-0">
                            {requiereValidacion && (
                                validado ? (
                                    <button onClick={() => revocarValidacion(actor)}
                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        title="Revocar validación">
                                        <ShieldAlert size={14}/>
                                    </button>
                                ) : (
                                    <button onClick={() => setConfirmarValidarActor(actor)}
                                        className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                        title="Validar correo">
                                        <ShieldCheck size={14}/>
                                    </button>
                                )
                            )}
                            <button onClick={() => editandoEmail ? cerrarEditarEmailPrincipal() : abrirEditarEmailPrincipal(actor)}
                                className={`p-1.5 rounded-lg transition-colors ${editandoEmail ? 'bg-[#291136]/10 text-[#291136]' : 'text-gray-300 hover:text-[#291136] hover:bg-[#291136]/10'}`}
                                title="Corregir correo principal">
                                <Pencil size={14}/>
                            </button>
                            <button onClick={() => mostrando ? cerrarFormEmail() : abrirFormEmail(actor.id)}
                                className={`p-1.5 rounded-lg transition-colors ${mostrando ? 'bg-[#BE0F4A]/10 text-[#BE0F4A]' : 'text-gray-300 hover:text-[#BE0F4A] hover:bg-[#BE0F4A]/10'}`}
                                title="Gestionar correos adicionales">
                                <Mail size={14}/>
                            </button>
                        </div>
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
                {/* Form corregir correo principal inline */}
                {editandoEmail && (
                    <form onSubmit={e => guardarEmailPrincipal(e, actor.id)} className="pt-2 border-t border-dashed border-gray-200 space-y-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide">Corregir correo principal</label>
                        <div className="flex flex-wrap gap-2 items-end">
                            <input type="email" required
                                value={formEmailPrincipal.data.email}
                                onChange={e => formEmailPrincipal.setData('email', e.target.value)}
                                placeholder="correo@ejemplo.com"
                                className="flex-1 min-w-[180px] text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]"/>
                            <button type="submit" disabled={formEmailPrincipal.processing}
                                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136] text-white hover:bg-[#3d1a52] disabled:opacity-50">
                                {formEmailPrincipal.processing ? 'Guardando…' : 'Guardar'}
                            </button>
                            <button type="button" onClick={cerrarEditarEmailPrincipal}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">Cancelar</button>
                        </div>
                        {requiereValidacion && validado && (
                            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
                                Cambiar el correo invalidará la validación previa. Tendrá que volver a validarlo.
                            </p>
                        )}
                        {formEmailPrincipal.errors.email && <p className="text-[10px] text-red-500">{formEmailPrincipal.errors.email}</p>}
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
                            <UserPlus size={12}/> Agregar {labelDado.toLowerCase()}
                        </button>
                    )}
                </div>
                <div className="p-5 space-y-4">
                    {/* Parte 1: Demandante / Entidad */}
                    {demandantes.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-2">{labelDem}</p>
                            <div className="space-y-2">{demandantes.map(a => renderParte(a))}</div>
                        </div>
                    )}
                    {/* Parte 2: Demandado / Contratista */}
                    <div>
                        <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide mb-2">{labelDado}</p>
                        {demandados.length > 0
                            ? <div className="space-y-2">{demandados.map(a => renderParte(a))}</div>
                            : <p className="text-sm text-gray-400 italic">Sin {labelDado.toLowerCase()} asignado.</p>
                        }
                    </div>
                    {/* Form nuevo demandado */}
                    {showFormDemandado && tipoActorDemandado && (
                        <form onSubmit={agregarDemandado} className="border border-[#BE0F4A]/20 rounded-xl p-4 bg-[#BE0F4A]/5 space-y-3">
                            <p className="text-xs font-bold text-[#BE0F4A] uppercase tracking-wide">Nuevo {labelDado}</p>
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
                            <p className="text-xs text-gray-400">Se registrará al {labelDado.toLowerCase()} con este correo. La cuenta de usuario se creará cuando valide el correo desde "Partes del Proceso".</p>
                            <div className="flex gap-2">
                                <button type="submit" disabled={formDemandado.processing}
                                    className="px-4 py-2 text-xs font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#BE0F4A]/90 disabled:opacity-50">
                                    {formDemandado.processing ? 'Agregando...' : `Agregar ${labelDado}`}
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

                    {paso === 'idle' && (() => {
                        const demandadoActor = (expediente.actores ?? []).find(a => a.activo && a.tipo_actor?.slug === 'demandado');
                        const puedeDeclarar = !!demandadoActor?.validado_por_gestor && !!demandadoActor?.usuario?.id;
                        return (
                            <div>
                                <div className="flex gap-3 flex-wrap">
                                    <button onClick={iniciarConforme}
                                        disabled={!puedeDeclarar}
                                        title={!puedeDeclarar ? `Primero valide el correo del ${labelDado.toLowerCase()} en "Partes del Proceso"` : ''}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg ${
                                            puedeDeclarar
                                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}>
                                        <CheckCircle size={16}/> Declarar Conforme
                                    </button>
                                    <button onClick={iniciarNoConforme}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200">
                                        <XCircle size={16}/> Declarar No Conforme
                                    </button>
                                </div>
                                {!puedeDeclarar && (
                                    <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
                                        <ShieldAlert size={14} className="shrink-0 mt-0.5"/>
                                        <span>El correo del {labelDado.toLowerCase()} debe estar validado antes de declarar conforme. Use el botón de validación junto al actor en "Partes del Proceso".</span>
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {paso === 'conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <CheckCircle size={16} className="text-emerald-600 shrink-0"/>
                                <p className="text-sm font-bold text-emerald-700">
                                    Declarar solicitud como <strong>CONFORME</strong>. Se generarán 3 movimientos: notificación al {labelDem.toLowerCase()}, traslado al {labelDado.toLowerCase()} (con habilitación de Mesa de Partes) y requerimiento de apersonamiento.
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
            <DatosSolicitud
                expediente={expediente}
                solicitud={solicitud}
                esGestor={esGestor}
                editando={editando}
                setEditando={setEditando}
                formEdit={formEdit}
                guardarEdicion={guardarEdicion}
                campo={campo}
                inputField={inputField}
            />

            {/* ── Modal de confirmación de validación de correo ── */}
            {confirmarValidarActor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setConfirmarValidarActor(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <ShieldCheck size={22} className="text-white"/>
                            </div>
                            <div>
                                <h3 className="text-white font-black text-lg leading-tight">Validar correo del actor</h3>
                                <p className="text-white/90 text-xs mt-0.5">Esta acción quedará registrada en el historial.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-3 text-sm text-gray-700">
                            <p>
                                ¿Confirma que ha verificado por medios externos (llamada, oficio, búsqueda RUC, etc.) que el siguiente correo corresponde efectivamente al actor?
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Actor</p>
                                <p className="text-base font-bold text-[#291136]">
                                    {confirmarValidarActor.usuario?.name ?? confirmarValidarActor.nombre_externo ?? '—'}
                                </p>
                                <p className="text-xs text-gray-500">{confirmarValidarActor.tipo_actor?.nombre}</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mt-2">Correo a validar</p>
                                <p className="text-base font-mono text-[#BE0F4A] break-all">
                                    {confirmarValidarActor.usuario?.email ?? confirmarValidarActor.email_externo ?? '(sin correo)'}
                                </p>
                            </div>
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                                Una vez validado: se creará la cuenta interna del actor (si no existe), se marcará su correo como verificado y quedará habilitada la opción de declarar conforme.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={() => setConfirmarValidarActor(null)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100">
                                Cancelar
                            </button>
                            <button onClick={confirmarValidacion}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700">
                                <Check size={16}/> Confirmar validación
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componente: muestra los datos de la solicitud según el tipo
// de servicio (arbitraje / jprd) con documentos agrupados
// ─────────────────────────────────────────────────────────────────
function DatosSolicitud({ expediente, solicitud, esGestor, editando, setEditando, formEdit, guardarEdicion, campo, inputField }) {
    const tipoClass = expediente.solicitud_type ?? '';
    const esJPRD    = tipoClass.includes('JPRD');
    const esArb     = tipoClass.includes('SolicitudArbitraje');

    // Solo arbitraje tiene endpoint de edición implementado
    const puedeEditar = esGestor && esArb;

    const docsAgrupados = esJPRD
        ? agruparDocumentos(solicitud.documentos, DOC_LABELS_JPRD)
        : agruparDocumentos(solicitud.documentos, DOC_LABELS_ARB);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
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
                {puedeEditar && !editando && (
                    <button onClick={() => setEditando(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-colors">
                        <Pencil size={12} /> Editar
                    </button>
                )}
            </div>
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }} />

            <div className="p-5 space-y-6">
                {/* N° de Cargo */}
                {solicitud.numero_cargo && (
                    <div className="flex items-center gap-3 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-0.5">N° de Cargo</p>
                            <p className="text-xl font-black font-mono text-[#291136] tracking-wider">{solicitud.numero_cargo}</p>
                        </div>
                    </div>
                )}

                {editando && esArb ? (
                    <FormEditArbitraje formEdit={formEdit} guardarEdicion={guardarEdicion} setEditando={setEditando} inputField={inputField} />
                ) : esJPRD ? (
                    <VistaJPRD solicitud={solicitud} campo={campo} />
                ) : (
                    <VistaArbitraje solicitud={solicitud} campo={campo} />
                )}

                {/* Documentos agrupados */}
                <SeccionDocumentos grupos={docsAgrupados} />

                {/* Motivo no conformidad */}
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
        </div>
    );
}

// ─── Vista Arbitraje ────────────────────────────────────────────
function VistaArbitraje({ solicitud, campo }) {
    return (
        <div className="space-y-6">
            {/* Demandante */}
            <SeccionPersona
                titulo="Demandante"
                nombre={solicitud.nombre_demandante}
                documento={solicitud.documento_demandante}
                tipoPersona={solicitud.tipo_persona}
                subtipo={solicitud.subtipo_juridico_demandante}
                representante={solicitud.nombre_representante}
                docRepresentante={solicitud.documento_representante}
                domicilio={solicitud.domicilio_demandante}
                email={solicitud.email_demandante}
                telefono={solicitud.telefono_demandante}
                empresas={solicitud.empresas_consorcio_demandante}
            />

            {/* Demandado */}
            <div className="border-t border-gray-100 pt-4">
                <SeccionPersona
                    titulo="Demandado"
                    nombre={solicitud.nombre_demandado}
                    documento={solicitud.documento_demandado}
                    tipoPersona={solicitud.tipo_persona_demandado}
                    subtipo={solicitud.subtipo_juridico_demandado}
                    representante={solicitud.nombre_representante_demandado}
                    docRepresentante={solicitud.documento_representante_demandado}
                    domicilio={solicitud.domicilio_demandado}
                    email={solicitud.email_demandado}
                    telefono={solicitud.telefono_demandado}
                    empresas={solicitud.empresas_consorcio_demandado}
                />
            </div>

            {/* Controversia */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia y Pretensiones</h4>
                <div className="space-y-3">
                    {solicitud.resumen_controversia && (
                        <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-1">Resumen de la controversia</span>
                            <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3 leading-relaxed">{solicitud.resumen_controversia}</p>
                        </div>
                    )}
                    {solicitud.pretensiones && (
                        <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-1">Pretensiones</span>
                            <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3 leading-relaxed">{solicitud.pretensiones}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                        {solicitud.monto_involucrado && campo('Monto involucrado', `S/ ${Number(solicitud.monto_involucrado).toLocaleString()}`)}
                        {campo('Dem. solicita designación árbitro', solicitud.solicita_designacion_director ? 'Sí' : 'No')}
                        {campo('Dado. solicita designación árbitro', solicitud.solicita_designacion_director_demandado ? 'Sí' : 'No')}
                        {solicitud.nombre_arbitro_propuesto && campo('Árbitro propuesto', solicitud.nombre_arbitro_propuesto)}
                        {solicitud.email_arbitro_propuesto  && campo('Email árbitro', solicitud.email_arbitro_propuesto)}
                        {solicitud.reglas_aplicables        && campo('Reglas aplicables', solicitud.reglas_aplicables)}
                        {solicitud.precision_reglas         && campo('Precisión', solicitud.precision_reglas)}
                    </div>
                    {solicitud.tiene_medida_cautelar ? (
                        <div className="flex items-center gap-2 mt-1">
                            <AlertTriangle size={14} className="text-amber-500" />
                            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Solicita medida cautelar</span>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ─── Vista JPRD ─────────────────────────────────────────────────
function VistaJPRD({ solicitud, campo }) {
    return (
        <div className="space-y-6">
            {/* Solicitante */}
            <div>
                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Solicitante</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {campo('Nombre', solicitud.nombre_solicitante)}
                    {campo('Documento', solicitud.documento_solicitante)}
                    {solicitud.rol_solicitante && campo('Rol', solicitud.rol_solicitante === 'entidad' ? 'Entidad' : 'Contratista')}
                </div>
            </div>

            {/* Entidad */}
            <div className="border-t border-gray-100 pt-4">
                <SeccionPersona
                    titulo="Entidad"
                    nombre={solicitud.nombre_entidad}
                    ruc={solicitud.ruc_entidad}
                    telefono={solicitud.telefono_entidad}
                    tipoPersona={solicitud.tipo_persona_entidad}
                    subtipo={solicitud.subtipo_entidad}
                    representante={solicitud.representante_entidad_nombre}
                    docRepresentante={solicitud.representante_entidad_dni}
                    empresas={solicitud.empresas_entidad}
                />
            </div>

            {/* Contratista */}
            <div className="border-t border-gray-100 pt-4">
                <SeccionPersona
                    titulo="Contratista"
                    nombre={solicitud.nombre_contratista}
                    ruc={solicitud.ruc_contratista}
                    telefono={solicitud.telefono_contratista}
                    tipoPersona={solicitud.tipo_persona_contratista}
                    subtipo={solicitud.subtipo_contratista}
                    representante={solicitud.representante_contratista_nombre}
                    docRepresentante={solicitud.representante_contratista_dni}
                    empresas={solicitud.empresas_contratista}
                />
            </div>

            {/* Petición de Decisión Vinculante */}
            {(solicitud.tiene_peticion_previa || solicitud.observacion) && (
                <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">
                        Petición de Decisión Vinculante
                    </h4>
                    <div className="space-y-3">
                        {solicitud.tiene_peticion_previa && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                                Existe petición previa
                            </span>
                        )}
                        {solicitud.observacion && (
                            <div>
                                <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-1">Observación</span>
                                <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3 leading-relaxed">{solicitud.observacion}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sección persona (natural / empresa / consorcio / entidad) ──
function SeccionPersona({ titulo, nombre, documento, ruc, tipoPersona, subtipo, representante, docRepresentante, domicilio, email, telefono, empresas }) {
    const meta = subtipo ? SUBTIPO_META[subtipo] : null;
    const esConsorcio = subtipo === 'consorcio';
    const empresasArr = Array.isArray(empresas) ? empresas : [];

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <h4 className="text-sm font-bold text-[#BE0F4A] uppercase tracking-wide">{titulo}</h4>
                {meta && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
                        <meta.Icono size={9} /> {meta.label}
                    </span>
                )}
            </div>

            {/* Caso CONSORCIO: estructura clara con dos sub-bloques */}
            {esConsorcio ? (
                <div className="space-y-4">
                    {/* Bloque 1: Representante Legal del Consorcio */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center">
                                <Users size={14} className="text-[#BE0F4A]" />
                            </div>
                            <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Representante Legal del Consorcio</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {nombre    && <Dato label="Nombre del representante" value={nombre} />}
                            {documento && <Dato label="DNI" value={documento} />}
                            {email     && <Dato label="Correo" value={email} />}
                            {telefono  && <Dato label="Teléfono" value={telefono} />}
                            {domicilio && <Dato label="Domicilio de notificación" value={domicilio} />}
                        </div>
                    </div>

                    {/* Bloque 2: Empresas que conforman el consorcio */}
                    <div className="bg-blue-50/40 rounded-xl border border-blue-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Building2 size={14} className="text-blue-700" />
                                </div>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Empresas que conforman el consorcio</span>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                {empresasArr.length} {empresasArr.length === 1 ? 'empresa' : 'empresas'}
                            </span>
                        </div>
                        {empresasArr.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No se registraron empresas conformantes.</p>
                        ) : (
                            <div className="space-y-2">
                                {empresasArr.map((emp, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-blue-200/60">
                                        <div className="w-8 h-8 rounded-full bg-[#291136] text-white font-black text-sm flex items-center justify-center shrink-0">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-[#291136] truncate">
                                                {emp.nombre?.trim() || <span className="text-gray-400 italic font-normal">Sin nombre registrado</span>}
                                            </p>
                                            {emp.ruc && (
                                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">RUC: {emp.ruc}</p>
                                            )}
                                        </div>
                                        <Building2 size={14} className="text-blue-400 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Caso NO consorcio (natural / empresa / entidad pública) */
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {nombre     && <Dato label={tipoPersona === 'juridica' ? 'Razón Social / Nombre' : 'Nombre completo'} value={nombre} />}
                    {documento  && <Dato label="Documento" value={documento} />}
                    {ruc        && <Dato label="RUC" value={ruc} />}
                    {domicilio  && <Dato label="Domicilio" value={domicilio} />}
                    {email      && <Dato label="Email" value={email} />}
                    {telefono   && <Dato label="Teléfono" value={telefono} />}
                    {representante && (
                        <>
                            <Dato label="Representante legal" value={representante} />
                            {docRepresentante && <Dato label="Doc. Representante" value={docRepresentante} />}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function Dato({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-0.5">{label}</span>
            <span className="text-sm font-semibold text-[#291136]">{value}</span>
        </div>
    );
}

// ─── Documentos agrupados por sección ──────────────────────────
function SeccionDocumentos({ grupos }) {
    const secciones = Object.entries(grupos);
    if (secciones.length === 0) return null;

    return (
        <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-bold text-[#BE0F4A] mb-4 uppercase tracking-wide">Documentos Adjuntos</h4>
            <div className="space-y-4">
                {secciones.map(([seccion, docs]) => (
                    <div key={seccion}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="w-3 h-[2px] bg-[#BE0F4A] inline-block rounded-full" />
                            {seccion}
                        </p>
                        <div className="space-y-1.5">
                            {docs.map(doc => (
                                <a key={doc.id} href={route('documentos.descargar', doc.id)}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group">
                                    <FileText size={15} className="text-[#BE0F4A]/60 group-hover:text-[#BE0F4A] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-semibold text-[#291136] truncate block">{doc.nombre_original}</span>
                                        <span className="text-[10px] text-gray-400">{doc._label}</span>
                                    </div>
                                    <Download size={13} className="text-gray-300 group-hover:text-[#291136] shrink-0" />
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Form edición arbitraje ─────────────────────────────────────
function FormEditArbitraje({ formEdit, guardarEdicion, setEditando, inputField }) {
    return (
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
                        <textarea value={formEdit.data.resumen_controversia}
                            onChange={e => formEdit.setData('resumen_controversia', e.target.value)}
                            rows={4} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Pretensiones *</label>
                        <textarea value={formEdit.data.pretensiones}
                            onChange={e => formEdit.setData('pretensiones', e.target.value)}
                            rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5"/>
                    </div>
                    {inputField('Monto involucrado (S/)', 'monto_involucrado', 'number')}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox"
                            checked={!!formEdit.data.solicita_designacion_director_demandado}
                            onChange={e => formEdit.setData('solicita_designacion_director_demandado', e.target.checked)}
                            className="w-4 h-4 accent-[#BE0F4A] rounded"/>
                        <span className="text-sm font-semibold text-gray-700">Demandado solicita designación de árbitro por el Centro</span>
                    </label>
                </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button type="button" onClick={() => { setEditando(false); formEdit.reset(); }}
                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                    <X size={12} className="inline mr-1"/> Cancelar
                </button>
                <button type="submit" disabled={formEdit.processing}
                    className="px-5 py-2 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50">
                    Guardar Cambios
                </button>
            </div>
        </form>
    );
}
