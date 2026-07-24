import { router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download, PlusCircle, Mail, Plus, UserPlus, Building2, Users, User, Landmark, AlertTriangle, ShieldCheck, ShieldAlert, Check, Scale, CreditCard, ClipboardList } from 'lucide-react';
import { MovimientoCard, movVacioBase } from './TabNuevoMovimiento';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// Constantes de etiquetas de documentos por servicio
// ─────────────────────────────────────────────────────────────────
const DOC_LABELS_ARB = {
    doc_controversia:                  { label: 'Convenio Arbitral',                seccion: 'Controversia' },
    solicitud_inicio_arbitraje:        { label: 'Solicitud de Inicio de Arbitraje', seccion: 'Controversia' },
    contra_cautela:                    { label: 'Contra Cautela',                   seccion: 'Controversia' },
    anexo_inicial:                     { label: 'Anexos',                           seccion: 'Controversia' },
    comprobante_pago_tasa:             { label: 'Comprobante de Pago de Tasa',      seccion: 'Pago' },
    comprobante_honorarios_emergencia:   { label: 'Comprobante de Honorarios (Emergencia)',    seccion: 'Pago' },
    comprobante_gastos_administrativos:  { label: 'Comprobante de Gastos Administrativos',     seccion: 'Pago' },
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

// Pill de acción (Partes del Proceso): visible, con etiqueta y micro-animación
// de elevación al hover + presión al click.
const BTN_PILL = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ' +
    'transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95';

// Animación estándar de botones grandes (CTA): elevación + sombra + presión
const BTN_CTA = 'transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.98]';

// Pill de acción con tooltip: al pasar el mouse aparece una descripción breve
// de lo que hace el botón (globo plum con flecha, sobre el botón).
function BotonPill({ tip, className = '', onClick, children }) {
    return (
        <button type="button" onClick={onClick} className={`relative group ${BTN_PILL} ${className}`}>
            {children}
            <span
                role="tooltip"
                className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-lg bg-[#291136] px-2.5 py-1.5 text-[10px] font-semibold normal-case tracking-normal text-white shadow-lg opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 z-20
                    after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#291136]"
            >
                {tip}
            </span>
        </button>
    );
}

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
    const slugDem   = esJPRD ? 'entidad_contratante' : 'demandante';
    const slugDado  = esJPRD ? 'contratista'         : 'demandado';

    // Roles procesales dinámicos (NO hardcodear quién emplaza a quién):
    //  - "solicitante" = parte que presentó la solicitud → recibe la notificación CONFORME / la subsanación.
    //  - "emplazado"   = la otra parte → recibe el traslado (emplazamiento) + apersonamiento.
    // Arbitraje: el solicitante siempre es el demandante. JPRD: puede ser cualquiera de las
    // dos partes según solicitud.rol_solicitante (entidad | contratista).
    const contratistaEsSolicitante = esJPRD && solicitud.rol_solicitante === 'contratista';
    const slugSolicitante  = contratistaEsSolicitante ? slugDado  : slugDem;
    const slugEmplazado    = contratistaEsSolicitante ? slugDem   : slugDado;
    const labelSolicitante = contratistaEsSolicitante ? labelDado : labelDem;
    const labelEmplazado   = contratistaEsSolicitante ? labelDem  : labelDado;

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
        setMovimientos(prev => prev.map((m, i) => {
            if (i !== idx) return m;
            const next = { ...m, [field]: value };
            // Sincronizar responsables[0].dias_plazo / tipo_dias al top-level
            // (el form submission solo envía top-level; sin esto el cal/háb del UI se pierde)
            if (field === 'responsables' && Array.isArray(value) && value[0]) {
                if (value[0].dias_plazo !== undefined) next.dias_plazo = value[0].dias_plazo;
                if (value[0].tipo_dias  !== undefined) next.tipo_dias  = value[0].tipo_dias;
            }
            return next;
        }));
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

    // Forma 2 — "Admitir a trámite" abre el editor de movimientos VACÍO.
    // El gestor arma lo que necesite; el traslado/emplazamiento es un atajo opcional
    // (ver agregarTrasladoEmplazamiento). Nada hardcodeado.
    function iniciarConforme() {
        setMovimientos([]);
        setArchivos({});
        setErroresMov([]);
        setPaso('conforme');
        setErrores({});
    }

    // Atajo opcional: arma el emplazamiento como DOS movimientos, cada uno con su propia
    // sumilla (un solo movimiento no puede tener dos textos para dos destinatarios):
    //   1) Notificación de ADMISIÓN al solicitante (su propia cédula).
    //   2) TRASLADO al emplazado + habilitar Mesa de Partes (su propia cédula).
    // Ambos editables y quitables. Mesa de Partes = la contraparte VE el expediente y puede
    // ENVIAR documentos (cualquiera de sus correos). NO son credenciales de Exp. Electrónico.
    function agregarTrasladoEmplazamiento() {
        const emplazado   = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === slugEmplazado);
        const solicitante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === slugSolicitante);
        if (!emplazado) {
            toast.error(`No se encontró al ${labelEmplazado.toLowerCase()} activo en el expediente.`);
            return;
        }
        if (!emplazado.validado_por_gestor || !emplazado.usuario?.id) {
            toast.error(`Primero valide el correo del ${labelEmplazado.toLowerCase()} en "Partes del Proceso" para poder emplazarlo y habilitar Mesa de Partes.`);
            return;
        }

        const nuevos = [];

        // 1) Notificación de admisión al solicitante (solo si ya tiene cuenta/acceso).
        //    notificar_a = [solicitante]; sin habilitar Mesa de Partes (ya la tiene).
        if (solicitante?.usuario?.id) {
            nuevos.push({
                ...movVacio(expediente, []),
                tipo:                       'notificacion',
                instruccion:                'Admisión a trámite: Se pone en su conocimiento que la solicitud ha sido admitida a trámite y se ha corrido traslado a la contraparte.',
                tipo_actor_responsable_id:  String(solicitante.tipo_actor_id ?? ''),
                usuario_responsable_id:     String(solicitante.usuario.id),
                notificar_a:                [solicitante.id],
            });
        }

        // 2) Traslado / emplazamiento al demandado: su propia sumilla + habilitar Mesa de Partes.
        //    notificar_a = [] porque el emplazado recibe su cédula vía el propio habilitar
        //    (el backend lo agrega a la notificación al concederle acceso en este mismo acto).
        nuevos.push({
            ...movVacio(expediente, []),
            tipo:                            'notificacion',
            instruccion:                     `Traslado de la solicitud al ${labelEmplazado.toLowerCase()}: Se le notifica que ha sido emplazado en el presente proceso. Se habilita Mesa de Partes para que pueda ver el expediente y presentar escritos.`,
            tipo_actor_responsable_id:       String(emplazado.tipo_actor_id ?? ''),
            usuario_responsable_id:          String(emplazado.usuario.id),
            habilitar_mesa_partes:           true,
            actores_mesa_partes_ids:         [emplazado.id],
            notificar_a:                     [],
            enviar_credenciales_expediente:  false,
            actor_credenciales_exp_id:       '',
        });

        const ni = movimientos.length;
        setMovimientos(prev => [...prev, ...nuevos]);
        setArchivos(prev => {
            const next = { ...prev };
            nuevos.forEach((_, k) => { next[ni + k] = []; });
            return next;
        });
    }

    function iniciarNoConforme() {
        const solicitante = expediente.actores?.find(a => a.activo && a.tipo_actor?.slug === slugSolicitante);
        const plazo = expediente.servicio?.plazo_subsanacion_dias ?? '';
        setMovimientos([{
            ...movVacio(expediente, defaultNotificarIds),
            tipo:                      'requerimiento',
            tipo_actor_responsable_id: String(solicitante?.tipo_actor_id ?? ''),
            usuario_responsable_id:    String(solicitante?.usuario?.id ?? ''),
            dias_plazo:                String(plazo),
            tipo_dias:                 'calendario',
            requerimientos: [{
                tipo_documento_id: '',
                responsables: [{
                    tipo_actor_id: String(solicitante?.tipo_actor_id ?? ''),
                    actor_ids:     solicitante?.id ? [String(solicitante.id)] : [],
                    dias_plazo:    String(plazo),
                    tipo_dias:     'calendario',
                }],
            }],
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
        // Aviso suave: admitir a trámite sin emplazar a la contraparte. No bloquea
        // (el gestor puede emplazar después con un movimiento de traslado), solo confirma.
        if (resultado === 'conforme' && !movimientos.some(m => m.habilitar_mesa_partes)) {
            const ok = window.confirm(
                `Vas a admitir a trámite sin emplazar al ${labelEmplazado.toLowerCase()} ` +
                `(no se habilitará Mesa de Partes a nadie). Podrás emplazar después con un ` +
                `movimiento de traslado. ¿Continuar?`
            );
            if (!ok) return;
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
    const demandantes = (expediente.actores ?? []).filter(a => a.activo && a.tipo_actor?.slug === slugDem);
    const demandados  = (expediente.actores ?? []).filter(a => a.activo && a.tipo_actor?.slug === slugDado);
    const tipoActorDemandado = tiposActor.find(t => t.slug === slugDado);

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
    const formEdit = useForm(esJPRD ? {
        nombre_entidad:                   solicitud.nombre_entidad ?? '',
        ruc_entidad:                      solicitud.ruc_entidad ?? '',
        telefono_entidad:                 solicitud.telefono_entidad ?? '',
        representante_entidad_nombre:     solicitud.representante_entidad_nombre ?? '',
        representante_entidad_dni:        solicitud.representante_entidad_dni ?? '',
        nombre_contratista:               solicitud.nombre_contratista ?? '',
        ruc_contratista:                  solicitud.ruc_contratista ?? '',
        telefono_contratista:             solicitud.telefono_contratista ?? '',
        representante_contratista_nombre: solicitud.representante_contratista_nombre ?? '',
        representante_contratista_dni:    solicitud.representante_contratista_dni ?? '',
        observacion:                      solicitud.observacion ?? '',
    } : {
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
        <div className="border-l-2 border-[#BE0F4A]/25 pl-3 transition-colors duration-200 hover:border-[#BE0F4A]">
            <span className="text-[10px] text-[#291136]/45 uppercase tracking-[0.14em] font-bold block mb-1">{label}</span>
            <span className="text-[15px] font-semibold text-[#291136] break-words leading-snug">{value || '—'}</span>
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
                            actoresSinMesaPartes={actoresExpediente.filter(a => !a.acceso_mesa_partes && !a.es_gestor)}
                            actoresSinExpElectronico={actoresExpediente.filter(a => !a.acceso_expediente_electronico && !a.es_gestor)}
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

                {resultado === 'conforme' && !movimientos.some(m => m.habilitar_mesa_partes) && (
                    <button type="button" onClick={agregarTrasladoEmplazamiento}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-white bg-[#BE0F4A] rounded-xl hover:bg-[#9C0A3B] hover:shadow-[#BE0F4A]/40 ${BTN_CTA}`}
                    >
                        <PlusCircle size={14}/> Agregar traslado de emplazamiento (recomendado)
                    </button>
                )}

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
        // La validación solo aplica a partes en disputa (demandante/demandado o entidad/contratista);
        // los demás actores internos no la requieren para declarar conforme.
        const requiereValidacion = [slugDem, slugDado].includes(actor.tipo_actor?.slug);
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
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            {requiereValidacion && (
                                validado ? (
                                    <BotonPill onClick={() => revocarValidacion(actor)}
                                        tip="Anula la validación del correo de esta parte"
                                        className="border border-gray-200 bg-white text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50">
                                        <ShieldAlert size={13}/> Revocar
                                    </BotonPill>
                                ) : (
                                    <BotonPill onClick={() => setConfirmarValidarActor(actor)}
                                        tip="Confirma que este correo pertenece realmente a la parte"
                                        className="bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow-emerald-600/30">
                                        <ShieldCheck size={13}/> Validar
                                    </BotonPill>
                                )
                            )}
                            <BotonPill onClick={() => editandoEmail ? cerrarEditarEmailPrincipal() : abrirEditarEmailPrincipal(actor)}
                                tip="Cambia el correo principal de esta parte"
                                className={editandoEmail
                                    ? 'bg-[#291136] text-white shadow-md'
                                    : 'border border-[#291136]/15 bg-[#291136]/5 text-[#291136] hover:bg-[#291136] hover:text-white hover:shadow-[#291136]/30'}>
                                <Pencil size={13}/> Corregir
                            </BotonPill>
                            <BotonPill onClick={() => mostrando ? cerrarFormEmail() : abrirFormEmail(actor.id)}
                                tip="Agrega o elimina correos adicionales de notificación"
                                className={mostrando
                                    ? 'bg-[#BE0F4A] text-white shadow-md'
                                    : 'border border-[#BE0F4A]/20 bg-[#BE0F4A]/5 text-[#BE0F4A] hover:bg-[#BE0F4A] hover:text-white hover:shadow-[#BE0F4A]/30'}>
                                <Mail size={13}/> Correos
                            </BotonPill>
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
                        <button type="submit" disabled={formEmail.processing} className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BE0F4A] text-white hover:bg-[#9C0A3B] disabled:opacity-50 ${BTN_CTA}`}>
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
                                className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136] text-white hover:bg-[#3d1a52] disabled:opacity-50 ${BTN_CTA}`}>
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
                            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BE0F4A] text-white hover:bg-[#9C0A3B] hover:shadow-[#BE0F4A]/40 ${BTN_CTA}`}>
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
                                        placeholder={`Nombre del ${labelDado.toLowerCase()}`} className={inputSmCls}/>
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
                                    className={`px-4 py-2 text-xs font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#9C0A3B] disabled:opacity-50 ${BTN_CTA}`}>
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
                        const emplazadoActor = (expediente.actores ?? []).find(a => a.activo && a.tipo_actor?.slug === slugEmplazado);
                        const emplazadoValidado = !!emplazadoActor?.validado_por_gestor && !!emplazadoActor?.usuario?.id;
                        return (
                            <div>
                                <div className="flex gap-3 flex-wrap">
                                    <button onClick={iniciarConforme}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-600/30 ${BTN_CTA}`}>
                                        <CheckCircle size={16}/> Admitir a Trámite
                                    </button>
                                    <button onClick={iniciarNoConforme}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 hover:shadow-red-600/20 ${BTN_CTA}`}>
                                        <XCircle size={16}/> Observado
                                    </button>
                                </div>
                                {!emplazadoValidado && (
                                    <p className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-start gap-2">
                                        <ShieldAlert size={14} className="shrink-0 mt-0.5 text-amber-500"/>
                                        <span>Puede admitir a trámite ahora. Para <strong>emplazar al {labelEmplazado.toLowerCase()}</strong> y habilitar Mesa de Partes, primero valide su correo en "Partes del Proceso".</span>
                                    </p>
                                )}
                            </div>
                        );
                    })()}

                    {paso === 'conforme' && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5"/>
                                <p className="text-sm font-medium text-emerald-800">
                                    Admitir la solicitud a <strong>trámite</strong>. Agregue los movimientos que correspondan.
                                    Para emplazar al {labelEmplazado.toLowerCase()} y habilitar Mesa de Partes, use el botón
                                    <strong> "Agregar traslado de emplazamiento"</strong>. Puede admitir sin movimientos y emplazar después.
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
                                    Declarar solicitud como <strong>NO CONFORME</strong>. Se habilitará subsanación para el {labelSolicitante.toLowerCase()}.
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
                    <h3 className="text-base font-bold text-amber-700 mb-1">⏳ Esperando subsanación de {labelSolicitante.toLowerCase()}</h3>
                    <p className="text-sm text-amber-700">
                        Se declaró NO CONFORME. Una vez que {labelSolicitante.toLowerCase()} responda, podrás volver a revisar la conformidad desde esta sección.
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
                                <p className="text-base text-[#BE0F4A] break-all">
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

    // Arbitraje (y Emergencia) y JPRD tienen endpoint de edición implementado
    const puedeEditar = esGestor && (esArb || esJPRD);

    const labelMap     = esJPRD ? DOC_LABELS_JPRD : DOC_LABELS_ARB;
    const docsActivos  = (solicitud.documentos ?? []).filter(d => d.activo !== false);
    // Las vistas colocan cada documento en la sección del formulario donde se pidió;
    // los tipos no contemplados caen en un bloque final "Otros Documentos".
    const docsRestantes = docsActivos.filter(d => !(d.tipo_documento in labelMap));
    const docsAgrupados = agruparDocumentos(solicitud.documentos, labelMap);

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
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 border border-white/20 ${BTN_CTA}`}>
                        <Pencil size={12} /> Editar
                    </button>
                )}
            </div>
            <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #BE0F4A 40%, #BC1D35 60%, transparent 100%)' }} />

            <div className={`p-4 sm:p-5 space-y-4 ${!editando ? 'bg-gray-100/70' : ''}`}>
                {/* N° de Cargo */}
                {solicitud.numero_cargo && (
                    <div className={`rounded-2xl px-4 sm:px-5 py-4 motion-safe:animate-fade-up-blur transition-all duration-300 ${
                        editando ? 'bg-[#291136]/5 border border-[#291136]/10' : 'bg-white border border-gray-200 shadow-sm hover:shadow-md'
                    }`}>
                        <div className="border-l-2 border-[#BE0F4A]/25 pl-3">
                            <p className="text-[10px] text-[#291136]/45 uppercase tracking-[0.14em] font-bold mb-1">N° de Cargo</p>
                            <p className="text-lg font-black tabular-nums text-[#291136] tracking-wider">{solicitud.numero_cargo}</p>
                        </div>
                    </div>
                )}

                {editando && esArb ? (
                    <FormEditArbitraje formEdit={formEdit} guardarEdicion={guardarEdicion} setEditando={setEditando} inputField={inputField} />
                ) : editando && esJPRD ? (
                    <FormEditJPRD formEdit={formEdit} guardarEdicion={guardarEdicion} setEditando={setEditando} inputField={inputField} />
                ) : esJPRD ? (
                    <VistaJPRD solicitud={solicitud} docs={docsActivos} />
                ) : (
                    <VistaArbitraje solicitud={solicitud} campo={campo} docs={docsActivos} />
                )}

                {/* Documentos: en modo edición se listan todos agrupados; en vista solo
                    los tipos que ninguna sección del formulario contempla */}
                {editando ? (
                    <SeccionDocumentos grupos={docsAgrupados} />
                ) : docsRestantes.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 motion-safe:animate-fade-up-blur">
                        <SeccionDocumentos titulo="Otros Documentos" grupos={agruparDocumentos(docsRestantes, labelMap)} sinBorde />
                    </div>
                )}

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

// ─── Helpers de vista espejo del formulario ─────────────────────
const fmtSoles = v => `S/ ${Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const docsDe = (docs, tipos) => (docs ?? []).filter(d => tipos.includes(d.tipo_documento));

// Sección de la vista: card con el MISMO lenguaje visual que <Seccion> del
// formulario público (header con tile de icono, cuerpo blanco), numerada para
// leer la solicitud en la misma secuencia en que se llenó. Entra con fade-up
// escalonado (motion-safe). Variantes:
//   hero      → banda de gradiente canónico plum→rose (card de apertura)
//   destacado → acentos rose (sección principal de documentos, como en el form)
//   normal    → header plomito
function SeccionVista({ icono: Icono, titulo, chip, numero, delay = 0, variant = 'normal', children }) {
    const esDest = variant === 'destacado';
    return (
        <section
            className="motion-safe:animate-fade-up-blur rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md"
            style={{ animationDelay: `${delay}ms` }}
        >
            <header className="flex items-center gap-3 px-4 sm:px-5 pt-4 sm:pt-5 pb-0">
                <div className={`rounded-lg flex items-center justify-center shrink-0 w-8 h-8 ${
                    esDest ? 'bg-[#BE0F4A] text-white' : 'bg-[#BE0F4A]/10 text-[#BE0F4A]'
                }`}>
                    <Icono size={15} />
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h4 className="font-black uppercase tracking-wide text-sm text-[#291136]">
                        {titulo}
                    </h4>
                    {chip}
                </div>
                {numero && (
                    <span className="ml-auto text-lg font-black tabular-nums select-none shrink-0 text-[#291136]/10" aria-hidden="true">
                        {numero}
                    </span>
                )}
            </header>
            <div className="p-4 sm:p-5">{children}</div>
        </section>
    );
}

// Badge de subtipo (empresa / consorcio / entidad pública) para el header de sección
function BadgeSubtipo({ subtipo }) {
    const meta = subtipo ? SUBTIPO_META[subtipo] : null;
    if (!meta) return null;
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}>
            <meta.Icono size={9} /> {meta.label}
        </span>
    );
}

const BADGE_SOLICITANTE = (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#BE0F4A]/10 text-[#BE0F4A] border border-[#BE0F4A]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse" /> SOLICITANTE
    </span>
);

// Bloque de texto largo (pretensiones, observaciones…). Los textos pegados desde
// PDF/Word traen saltos de línea duros a mitad de párrafo (\r\n): se refluyen —
// un salto simple se vuelve espacio y solo la línea en blanco separa párrafos,
// para que el texto ocupe todo el ancho disponible.
function TextoLargo({ label, value }) {
    if (!value) return null;
    const texto = String(value)
        .replace(/\r\n?/g, '\n')
        .split(/\n\s*\n/)
        .map(p => p.replace(/\s*\n\s*/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n');
    return (
        <div>
            <span className="text-[10px] text-[#291136]/45 uppercase tracking-[0.14em] font-bold block mb-1.5">{label}</span>
            <p className="text-sm text-[#291136] bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed whitespace-pre-line">{texto}</p>
        </div>
    );
}

// Lista plana de documentos descargables (fila con tile rose + hover de marca)
function ListaDocs({ docs, labelMap = {}, vacio = null }) {
    if (!docs || docs.length === 0) {
        return vacio ? <p className="text-xs text-gray-400 italic">{vacio}</p> : null;
    }
    return (
        <div className="space-y-2">
            {docs.map(doc => (
                <a key={doc.id} href={route('documentos.descargar', `d-${doc.id}`)}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-[#BE0F4A]/40 hover:bg-white hover:shadow-md transition-all duration-200 motion-safe:hover:translate-x-1 group">
                    <div className="w-9 h-9 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center shrink-0 group-hover:bg-[#BE0F4A] transition-colors">
                        <FileText size={16} className="text-[#BE0F4A] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#291136] truncate block">{doc.nombre_original}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wide">{labelMap[doc.tipo_documento]?.label ?? doc.tipo_documento}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-[#291136] transition-colors shrink-0">
                        <Download size={13} />
                    </div>
                </a>
            ))}
        </div>
    );
}

// Sub-grupo de documentos con el mismo título que el campo del formulario
function GrupoDocs({ titulo, docs, labelMap, vacio = null }) {
    if ((!docs || docs.length === 0) && !vacio) return null;
    return (
        <div>
            <p className="text-[10px] font-bold text-[#291136]/60 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-[#BE0F4A] inline-block rounded-full" />
                {titulo}
                {docs?.length > 1 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#291136]/10 text-[#291136] text-[9px] font-black tabular-nums">{docs.length}</span>
                )}
            </p>
            <ListaDocs docs={docs} labelMap={labelMap} vacio={vacio} />
        </div>
    );
}

// ─── Vista Arbitraje — espejo del formulario de solicitud ───────
// Orden del formulario: Tipo de solicitud → Solicitud de Inicio → Demandante →
// Demandado → Aspectos Controvertidos → Conformación del Tribunal →
// Medida Cautelar → Tasa de Solicitud.
function VistaArbitraje({ solicitud, campo, docs }) {
    const conformacionLabel = {
        arbitro_unico:     'Árbitro Único',
        tribunal_arbitral: 'Tribunal Arbitral',
    }[solicitud.conformacion_tribunal];
    const proponeArbitro = Number(solicitud.solicita_designacion_director) === 0;

    const docsDemandante = docsDe(docs, ['vigencia_poder_demandante', 'contrato_consorcio_demandante', 'resolucion_facultades_demandante']);
    const docsDemandado  = docsDe(docs, ['vigencia_poder_demandado', 'contrato_consorcio_demandado', 'resolucion_facultades_demandado']);
    const docsTasa       = docsDe(docs, ['comprobante_pago_tasa', 'comprobante_honorarios_emergencia', 'comprobante_gastos_administrativos']);
    const docsCautelar   = docsDe(docs, ['medida_cautelar', 'contra_cautela']);
    const hayTasa        = docsTasa.length > 0 || solicitud.factura_ruc || solicitud.factura_razon_social;

    return (
        <div className="space-y-4">
            {/* 1. Tipo de solicitud */}
            <SeccionVista icono={ClipboardList} titulo="Tipo de Solicitud" numero="01" delay={0}>
                <p className="border-l-2 border-[#BE0F4A]/25 pl-3 text-base font-bold text-[#291136] leading-snug">
                    {solicitud.tipo_documento?.nombre ?? 'Solicitud de Inicio de Arbitraje'}
                </p>
            </SeccionVista>

            {/* 2. Solicitud de Inicio de Arbitraje (documento principal) */}
            <SeccionVista icono={FileText} titulo="Solicitud de Inicio de Arbitraje" variant="destacado" numero="02" delay={60}>
                <ListaDocs
                    docs={docsDe(docs, ['solicitud_inicio_arbitraje', 'anexo_inicial'])}
                    labelMap={DOC_LABELS_ARB}
                    vacio="Sin documento de solicitud adjunto." />
            </SeccionVista>

            {/* 3. Datos del Demandante */}
            <SeccionVista icono={User} titulo="Datos del Demandante" numero="03" delay={120}
                chip={<><BadgeSubtipo subtipo={solicitud.subtipo_juridico_demandante} />{BADGE_SOLICITANTE}</>}>
                <SeccionPersona
                    nombre={solicitud.nombre_demandante}
                    documento={solicitud.documento_demandante}
                    tipoPersona={solicitud.tipo_persona}
                    subtipo={solicitud.subtipo_juridico_demandante}
                    representante={solicitud.nombre_representante}
                    docRepresentante={solicitud.documento_representante}
                    domicilio={solicitud.domicilio_demandante}
                    email={solicitud.email_demandante}
                    telefono={solicitud.telefono_demandante}
                    mesaPartes={solicitud.mesa_partes_url_demandante}
                    empresas={solicitud.empresas_consorcio_demandante}
                />
                {docsDemandante.length > 0 && (
                    <div className="mt-3"><ListaDocs docs={docsDemandante} labelMap={DOC_LABELS_ARB} /></div>
                )}
            </SeccionVista>

            {/* 4. Datos del Demandado */}
            <SeccionVista icono={Users} titulo="Datos del Demandado" numero="04" delay={180}
                chip={<BadgeSubtipo subtipo={solicitud.subtipo_juridico_demandado} />}>
                <SeccionPersona
                    nombre={solicitud.nombre_demandado}
                    documento={solicitud.documento_demandado}
                    tipoPersona={solicitud.tipo_persona_demandado}
                    subtipo={solicitud.subtipo_juridico_demandado}
                    representante={solicitud.nombre_representante_demandado}
                    docRepresentante={solicitud.documento_representante_demandado}
                    domicilio={solicitud.domicilio_demandado}
                    email={solicitud.email_demandado}
                    telefono={solicitud.telefono_demandado}
                    mesaPartes={solicitud.mesa_partes_url_demandado}
                    empresas={solicitud.empresas_consorcio_demandado}
                />
                {docsDemandado.length > 0 && (
                    <div className="mt-3"><ListaDocs docs={docsDemandado} labelMap={DOC_LABELS_ARB} /></div>
                )}
            </SeccionVista>

            {/* 5. Aspectos Controvertidos Sometidos a Arbitraje */}
            <SeccionVista icono={Scale} titulo="Aspectos Controvertidos Sometidos a Arbitraje" numero="05" delay={240}>
                <div className="space-y-3">
                    <TextoLargo label="Pretensiones" value={solicitud.pretensiones} />
                    {solicitud.resumen_controversia && (
                        <TextoLargo label="Resumen de la controversia" value={solicitud.resumen_controversia} />
                    )}
                    {(solicitud.suma_monto_pretensiones_determinadas || solicitud.pretensiones_indeterminadas || solicitud.monto_involucrado) && (
                        <div>
                            <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-2">Cuantía de la controversia</span>
                            <div className="pl-4 border-l-2 border-[#BE0F4A]/30 space-y-3">
                                {solicitud.suma_monto_pretensiones_determinadas && campo('Suma de pretensiones determinadas', fmtSoles(solicitud.suma_monto_pretensiones_determinadas))}
                                {solicitud.pretensiones_indeterminadas && (
                                    <TextoLargo label="Pretensiones indeterminadas" value={solicitud.pretensiones_indeterminadas} />
                                )}
                                {solicitud.monto_involucrado && campo('Monto involucrado', fmtSoles(solicitud.monto_involucrado))}
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        {solicitud.reglas_aplicables && campo('Reglas aplicables', solicitud.reglas_aplicables)}
                        {solicitud.precision_reglas  && campo('Precisión', solicitud.precision_reglas)}
                    </div>
                    <GrupoDocs titulo="Convenio Arbitral" docs={docsDe(docs, ['doc_controversia'])}
                        labelMap={DOC_LABELS_ARB} vacio="Sin convenio arbitral adjunto." />
                </div>
            </SeccionVista>

            {/* 6. Conformación del Tribunal */}
            <SeccionVista icono={Scale} titulo="Conformación del Tribunal" numero="06" delay={300}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campo('Conformación del tribunal', conformacionLabel)}
                    {campo('Mecanismo de designación del árbitro', proponeArbitro
                        ? 'Propone árbitro, conforme al convenio arbitral y el Reglamento'
                        : 'Designación por el Centro, de conformidad con el Reglamento')}
                    {proponeArbitro && solicitud.nombre_arbitro_propuesto && campo('Árbitro propuesto', solicitud.nombre_arbitro_propuesto)}
                    {proponeArbitro && solicitud.email_arbitro_propuesto  && campo('Correo del árbitro propuesto', solicitud.email_arbitro_propuesto)}
                    {solicitud.solicita_designacion_director_demandado ? campo('El demandado solicita designación por el Centro', 'Sí') : null}
                </div>
            </SeccionVista>

            {/* 7. Medida Cautelar */}
            <SeccionVista icono={ShieldAlert} titulo="Medida Cautelar" numero="07" delay={360}>
                {solicitud.tiene_medida_cautelar ? (
                    <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <AlertTriangle size={12} /> Se ha ejecutado una medida cautelar
                        </span>
                        <ListaDocs docs={docsCautelar} labelMap={DOC_LABELS_ARB}
                            vacio="Sin resolución de la medida cautelar adjunta." />
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No se ha ejecutado ninguna medida cautelar.</p>
                )}
            </SeccionVista>

            {/* 8. Tasa de Solicitud de Arbitraje */}
            {hayTasa && (
                <SeccionVista icono={CreditCard} titulo="Tasa de Solicitud de Arbitraje" numero="08" delay={420}>
                    <div className="space-y-3">
                        <GrupoDocs titulo="Comprobante de pago" docs={docsTasa} labelMap={DOC_LABELS_ARB}
                            vacio="Sin comprobante de pago adjunto." />
                        {(solicitud.factura_ruc || solicitud.factura_razon_social) && (
                            <div>
                                <span className="text-xs text-gray-400 uppercase tracking-wide font-semibold block mb-2">Datos para la emisión de factura</span>
                                <div className="grid grid-cols-2 gap-4">
                                    {campo('RUC', solicitud.factura_ruc)}
                                    {campo('Razón social', solicitud.factura_razon_social)}
                                </div>
                            </div>
                        )}
                    </div>
                </SeccionVista>
            )}
        </div>
    );
}

// ─── Vista JPRD — espejo del formulario de solicitud ────────────
// Orden del formulario: Tipo de solicitud (+ rol del solicitante) → datos del
// solicitante → datos de la otra parte → Documentos → Petición de Decisión Vinculante.
function VistaJPRD({ solicitud, docs }) {
    const solicitaEntidad = solicitud.rol_solicitante !== 'contratista';

    const seccionEntidad = (numero, delay) => (
        <SeccionVista key="entidad" icono={Landmark} titulo="Entidad Contratante" numero={numero} delay={delay}
            chip={<><BadgeSubtipo subtipo={solicitud.subtipo_entidad} />{solicitaEntidad && BADGE_SOLICITANTE}</>}>
            <SeccionPersona
                nombre={solicitud.nombre_entidad}
                ruc={solicitud.ruc_entidad}
                telefono={solicitud.telefono_entidad}
                tipoPersona={solicitud.tipo_persona_entidad}
                subtipo={solicitud.subtipo_entidad}
                representante={solicitud.representante_entidad_nombre}
                docRepresentante={solicitud.representante_entidad_dni}
                emails={(solicitud.emails_entidad ?? []).map(e => e.email)}
                mesaPartes={solicitud.mesa_partes_url_entidad}
                empresas={solicitud.empresas_entidad}
            />
        </SeccionVista>
    );

    const seccionContratista = (numero, delay) => (
        <SeccionVista key="contratista" icono={Building2} titulo="Contratista" numero={numero} delay={delay}
            chip={<><BadgeSubtipo subtipo={solicitud.subtipo_contratista} />{!solicitaEntidad && BADGE_SOLICITANTE}</>}>
            <SeccionPersona
                nombre={solicitud.nombre_contratista}
                ruc={solicitud.ruc_contratista}
                telefono={solicitud.telefono_contratista}
                tipoPersona={solicitud.tipo_persona_contratista}
                subtipo={solicitud.subtipo_contratista}
                representante={solicitud.representante_contratista_nombre}
                docRepresentante={solicitud.representante_contratista_dni}
                emails={(solicitud.emails_contratista ?? []).map(e => e.email)}
                empresas={solicitud.empresas_contratista}
            />
        </SeccionVista>
    );

    return (
        <div className="space-y-4">
            {/* 1. Tipo de solicitud + quién la presenta */}
            <SeccionVista icono={ClipboardList} titulo="Tipo de Solicitud" numero="01" delay={0}>
                <div className="space-y-4">
                    <p className="border-l-2 border-[#BE0F4A]/25 pl-3 text-base font-bold text-[#291136] leading-snug">
                        {solicitud.tipo_documento?.nombre ?? 'Solicitud de JPRD'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                        <Dato label="Presentada por" value={solicitud.nombre_solicitante} />
                        {solicitud.documento_solicitante && <Dato label="Documento" value={solicitud.documento_solicitante} />}
                        <Dato label="En calidad de" value={solicitaEntidad ? 'Entidad Contratante' : 'Contratista'} />
                    </div>
                </div>
            </SeccionVista>

            {/* 2-3. Partes: primero el solicitante, como en el formulario */}
            {solicitaEntidad
                ? [seccionEntidad('02', 60), seccionContratista('03', 120)]
                : [seccionContratista('02', 60), seccionEntidad('03', 120)]}

            {/* 4. Documentos — mismos títulos que el formulario */}
            <SeccionVista icono={FileText} titulo="Documentos" variant="destacado" numero="04" delay={180}>
                <div className="space-y-4">
                    <GrupoDocs titulo="Solicitud de Conformación de JPRD"
                        docs={docsDe(docs, ['solicitud_conformacion'])} labelMap={DOC_LABELS_JPRD}
                        vacio="Sin documento de solicitud adjunto." />
                    <GrupoDocs titulo="Contrato de Obra"
                        docs={docsDe(docs, ['contrato_obra'])} labelMap={DOC_LABELS_JPRD} />
                    <GrupoDocs titulo="Adendas"
                        docs={docsDe(docs, ['adenda'])} labelMap={DOC_LABELS_JPRD} />
                    <GrupoDocs titulo="Anexos / Otros documentos"
                        docs={docsDe(docs, ['anexo'])} labelMap={DOC_LABELS_JPRD} />
                </div>
            </SeccionVista>

            {/* 5. Petición de Decisión Vinculante */}
            <SeccionVista icono={FileText} titulo="Petición de Decisión Vinculante" numero="05" delay={240}>
                {solicitud.tiene_peticion_previa ? (
                    <div className="space-y-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Existe petición previa
                        </span>
                        {solicitud.observacion && <TextoLargo label="Observación" value={solicitud.observacion} />}
                        <ListaDocs docs={docsDe(docs, ['peticion_decision_vinculante'])} labelMap={DOC_LABELS_JPRD}
                            vacio="Sin documento de petición adjunto." />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">No se registró una petición de decisión vinculante previa.</p>
                        {solicitud.observacion && <TextoLargo label="Observación" value={solicitud.observacion} />}
                    </div>
                )}
            </SeccionVista>
        </div>
    );
}

// ─── Sección persona (natural / empresa / consorcio / entidad) ──
// El título y el badge de subtipo los pinta SeccionVista; aquí solo el cuerpo.
function SeccionPersona({ nombre, documento, ruc, tipoPersona, subtipo, representante, docRepresentante, domicilio, email, telefono, emails, mesaPartes, empresas }) {
    const esConsorcio = subtipo === 'consorcio';
    const empresasArr = Array.isArray(empresas) ? empresas : [];
    const emailsArr   = (emails ?? []).filter(Boolean);

    return (
        <div>
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                            {nombre    && <Dato label="Nombre del representante" value={nombre} />}
                            {documento && <Dato label="DNI" value={documento} />}
                            {email     && <Dato label="Correo" value={email} />}
                            {emailsArr.length > 0 && <Dato label="Correos para notificaciones" value={emailsArr.join(', ')} />}
                            {telefono  && <Dato label="Teléfono" value={telefono} />}
                            {domicilio && <Dato label="Domicilio de notificación" value={domicilio} />}
                            {mesaPartes && <Dato label="Mesa de Partes Virtual" value={mesaPartes} />}
                        </div>
                    </div>

                    {/* Bloque 2: Empresas que conforman el consorcio */}
                    <div className="bg-[#291136]/[0.04] rounded-xl border border-[#291136]/15 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#291136]/10 flex items-center justify-center">
                                    <Building2 size={14} className="text-[#291136]" />
                                </div>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Empresas que conforman el consorcio</span>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#291136]/10 text-[#291136]">
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
                                                <p className="text-[11px] text-gray-500 tabular-nums mt-0.5">RUC: {emp.ruc}</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                    {nombre     && <Dato label={tipoPersona === 'juridica' ? 'Razón Social / Nombre' : 'Nombre completo'} value={nombre} />}
                    {documento  && <Dato label="Documento" value={documento} />}
                    {ruc        && <Dato label="RUC" value={ruc} />}
                    {domicilio  && <Dato label="Domicilio" value={domicilio} />}
                    {email      && <Dato label="Correo electrónico" value={email} />}
                    {emailsArr.length > 0 && <Dato label="Correos para notificaciones" value={emailsArr.join(', ')} />}
                    {telefono   && <Dato label="Teléfono" value={telefono} />}
                    {representante && (
                        <>
                            <Dato label="Representante legal" value={representante} />
                            {docRepresentante && <Dato label="Doc. Representante" value={docRepresentante} />}
                        </>
                    )}
                    {mesaPartes && <Dato label="Mesa de Partes Virtual" value={mesaPartes} />}
                </div>
            )}
        </div>
    );
}

function Dato({ label, value }) {
    if (!value && value !== 0) return null;
    return (
        <div className="border-l-2 border-[#BE0F4A]/25 pl-3 transition-colors duration-200 hover:border-[#BE0F4A]">
            <span className="text-[10px] text-[#291136]/45 uppercase tracking-[0.14em] font-bold block mb-1">{label}</span>
            <span className="text-[15px] font-semibold text-[#291136] break-words leading-snug">{value}</span>
        </div>
    );
}

// ─── Documentos agrupados por sección ──────────────────────────
function SeccionDocumentos({ grupos, titulo = 'Documentos Adjuntos', sinBorde = false }) {
    const secciones = Object.entries(grupos);
    if (secciones.length === 0) return null;

    return (
        <div className={sinBorde ? '' : 'border-t border-gray-100 pt-4'}>
            <h4 className="text-sm font-bold text-[#BE0F4A] mb-4 uppercase tracking-wide">{titulo}</h4>
            <div className="space-y-4">
                {secciones.map(([seccion, docs]) => (
                    <div key={seccion}>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span className="w-3 h-[2px] bg-[#BE0F4A] inline-block rounded-full" />
                            {seccion}
                        </p>
                        <div className="space-y-1.5">
                            {docs.map(doc => (
                                <a key={doc.id} href={route('documentos.descargar', `d-${doc.id}`)}
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

// ─── Form edición JPRD (entidad / contratista) ──────────────────
function FormEditJPRD({ formEdit, guardarEdicion, setEditando, inputField }) {
    return (
        <form onSubmit={guardarEdicion} className="space-y-6">
            <div>
                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Entidad</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inputField('Nombre / Razón Social', 'nombre_entidad', 'text', true)}
                    {inputField('RUC', 'ruc_entidad')}
                    {inputField('Teléfono', 'telefono_entidad')}
                    {inputField('Representante', 'representante_entidad_nombre')}
                    {inputField('DNI Representante', 'representante_entidad_dni')}
                </div>
            </div>
            <div>
                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Contratista</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {inputField('Nombre / Razón Social', 'nombre_contratista', 'text', true)}
                    {inputField('RUC', 'ruc_contratista')}
                    {inputField('Teléfono', 'telefono_contratista')}
                    {inputField('Representante', 'representante_contratista_nombre')}
                    {inputField('DNI Representante', 'representante_contratista_dni')}
                </div>
            </div>
            <div>
                <h4 className="text-sm font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Observación</h4>
                <textarea value={formEdit.data.observacion}
                    onChange={e => formEdit.setData('observacion', e.target.value)}
                    rows={3} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5"/>
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
