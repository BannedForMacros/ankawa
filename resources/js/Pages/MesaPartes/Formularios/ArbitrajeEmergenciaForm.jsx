import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import EmailsInput from '@/Components/EmailsInput';
import AnkawaLoader from '@/Components/AnkawaLoader';
import Checkbox from '@/Components/Checkbox';
import AceptacionReglamento from '@/Components/AceptacionReglamento';
import HCaptchaWidget from '@/Components/HCaptchaWidget';
import InfoPago from '@/Components/InfoPago';
import {
    User, Users, FileText, Paperclip,
    CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck,
    CreditCard, ShieldAlert, Zap, Scale, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import useBorrador, { claveBorrador } from '@/hooks/useBorrador';
import { validarZod, validarCampo } from '@/lib/validar';
import { confirmar } from '@/lib/swalAnkawa';

import {
    Seccion,
    MultiArchivoInput,
    BloquePersona,
    DatosProcuraduria,
    RucBuscador,
    LONG_DOC,
    docDefaultPorPersona,
    empresasPayload,
} from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';
import { componerDomicilio } from '@/Components/DomicilioFields';

/* ─── Esquema de validación (espeja handleSubmit; sin los montos de controversia) ─── */
const emergenciaSchema = z.object({
    documentos_solicitud_inicio: z.any(), documentos_controversia: z.any(), documentos_contra_cautela: z.any(),
    tipo_persona: z.any(), subtipo_dem: z.any(), nombre_demandante: z.any(), documento_demandante: z.any(),
    tipo_documento: z.any(), domicilio_demandante: z.any(), telefono_demandante: z.any(),
    empresas_dem: z.any(), rep_dem_dni: z.any(), rep_dem_nombre: z.any(),
    nombre_demandado: z.any(), domicilio_demandado: z.any(), tipo_persona_demandado: z.any(), subtipo_dado: z.any(),
    empresas_dado: z.any(), rep_dado_dni: z.any(), rep_dado_nombre: z.any(), email_demandado: z.any(),
    mesa_partes_url_demandante: z.any(), mesa_partes_url_demandado: z.any(),
    acepta_reglamento_card: z.any(), email_principal_dem: z.any(),
}).superRefine((d, ctx) => {
    const add = (k, m) => ctx.addIssue({ code: 'custom', path: [k], message: m });
    const req = (k, val, m = 'Campo obligatorio') => { if (!String(val ?? '').trim()) add(k, m); };

    if (d.documentos_solicitud_inicio === 0) add('documentos_solicitud_inicio', 'Adjunte la solicitud de inicio de arbitraje de emergencia');
    if (d.documentos_controversia === 0) add('documentos_controversia', 'Adjunte el convenio arbitral');
    if (d.documentos_contra_cautela === 0) add('documentos_contra_cautela', 'Adjunte la contra cautela');

    if (!(d.tipo_persona === 'juridica' && d.subtipo_dem === 'consorcio')) {
        req('nombre_demandante', d.nombre_demandante);
        req('documento_demandante', d.documento_demandante);
        const lon = LONG_DOC[d.tipo_documento];
        if (lon && d.documento_demandante && d.documento_demandante.length !== lon) add('documento_demandante', `Debe tener ${lon} dígitos`);
    }
    req('domicilio_demandante', d.domicilio_demandante);
    // Entidad pública: teléfono opcional, mesa de partes virtual obligatoria
    const demEntidadPublica = d.tipo_persona === 'juridica' && d.subtipo_dem === 'entidad_publica';
    if (!demEntidadPublica) req('telefono_demandante', d.telefono_demandante);
    if (demEntidadPublica) req('mesa_partes_url_demandante', d.mesa_partes_url_demandante, 'Indique la mesa de partes virtual de la entidad');

    if (d.tipo_persona === 'juridica') {
        if (!d.subtipo_dem) add('subtipo_juridico_demandante', 'Seleccione el tipo');
        if (d.subtipo_dem === 'consorcio') {
            if (d.empresas_dem === 0) add('empresas_consorcio_demandante', 'Agregue al menos una empresa');
            if (!d.rep_dem_dni || d.rep_dem_dni.length !== 8) add('rep_consorcio_demandante_dni', 'DNI obligatorio (8 dígitos)');
            if (!String(d.rep_dem_nombre ?? '').trim()) add('rep_consorcio_demandante_nombre', 'Nombre obligatorio');
        }
    }

    req('nombre_demandado', d.nombre_demandado);
    req('domicilio_demandado', d.domicilio_demandado);
    req('email_demandado', d.email_demandado, 'Ingrese el correo del demandado (canal de comunicación)');
    if (d.tipo_persona_demandado === 'juridica' && d.subtipo_dado === 'entidad_publica')
        req('mesa_partes_url_demandado', d.mesa_partes_url_demandado, 'Indique la mesa de partes virtual de la entidad');

    if (d.tipo_persona_demandado === 'juridica') {
        if (!d.subtipo_dado) add('subtipo_juridico_demandado', 'Seleccione el tipo');
        if (d.subtipo_dado === 'consorcio') {
            if (d.empresas_dado === 0) add('empresas_consorcio_demandado', 'Agregue al menos una empresa');
            if (!d.rep_dado_dni || d.rep_dado_dni.length !== 8) add('rep_consorcio_demandado_dni', 'DNI obligatorio (8 dígitos)');
            if (!String(d.rep_dado_nombre ?? '').trim()) add('rep_consorcio_demandado_nombre', 'Nombre obligatorio');
            if (!String(d.email_demandado ?? '').trim()) add('email_demandado', 'Email del representante del consorcio');
        }
    }

    if (!d.acepta_reglamento_card) add('acepta_reglamento_card', 'Debe aceptar la declaración para enviar la solicitud');
    if (!d.email_principal_dem) add('emails_demandante', 'Ingrese al menos un correo');
});

export default function ArbitrajeEmergenciaForm({ servicio, portalEmail, portalUser, hcaptchaSiteKey }) {
    const [captchaToken, setCaptchaToken] = useState('');
    const { auth } = usePage().props;
    const isPortal = !!portalEmail;
    const isAuth   = !!auth?.user && !isPortal;
    const user     = isPortal ? portalUser : auth?.user;

    const [aceptoLegal, setAceptoLegal]     = useState(isAuth || isPortal);
    const [modalLegal, setModalLegal]       = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [missingFields, setMissingFields]     = useState({});
    const [showErrorModal, setShowErrorModal]   = useState(false);
    const [demandanteBloqueado, setDemandanteBloqueado] = useState(false);
    const emailInicial = isPortal ? portalEmail : '';
    const [emailsDem, setEmailsDem]         = useState(emailInicial ? [{ email: emailInicial, label: '' }] : [{ email: '', label: '' }]);
    const [emailsDemAdic, setEmailsDemAdic] = useState([]);
    const [emailsDado, setEmailsDado]       = useState([]);
    const loaderTimer                       = useRef(null);

    // Sub-tipos jurídicos
    const [subtipoJuridicoDem,  setSubtipoJuridicoDem]  = useState('');
    const [subtipoJuridicoDado, setSubtipoJuridicoDado] = useState('');

    // Empresas de consorcio
    const [empresasConsorcioDem,  setEmpresasConsorcioDem]  = useState([]);
    const [empresasConsorcioDado, setEmpresasConsorcioDado] = useState([]);

    // Representante de consorcio
    const [repConsorcioDem,  setRepConsorcioDem]  = useState({ dni: '', nombre: '' });
    const [repConsorcioDado, setRepConsorcioDado] = useState({ dni: '', nombre: '' });

    // Documentos de sub-tipo jurídico
    const [docVigenciaPoderDem,         setDocVigenciaPoderDem]         = useState([]);
    const [docContratoConsorcioDem,     setDocContratoConsorcioDem]     = useState([]);
    const [docResolucionFacultadesDem,  setDocResolucionFacultadesDem]  = useState([]);
    const [docVigenciaPoderDado,        setDocVigenciaPoderDado]        = useState([]);
    const [docContratoConsorcioDado,    setDocContratoConsorcioDado]    = useState([]);
    const [docResolucionFacultadesDado, setDocResolucionFacultadesDado] = useState([]);

    const { data, setData } = useForm({
        servicio_id:                   servicio.id,
        // Demandante — NO se pre-cargan datos personales: quien presenta puede estar
        // redactando para otra persona. Solo el correo OTP del portal se conserva (canal verificado).
        tipo_persona:                  'natural',
        tipo_documento:                docDefaultPorPersona('natural'),
        nombre_demandante:             '',
        documento_demandante:          '',
        nombre_representante:          '',
        documento_representante:       '',
        domicilio_demandante:          '',
        email_demandante:              emailInicial ?? '',
        telefono_demandante:           '',
        mesa_partes_url_demandante:    '',
        // Demandado
        tipo_persona_demandado:        'natural',
        tipo_documento_demandado:      'dni',
        nombre_demandado:              '',
        documento_demandado:           '',
        domicilio_demandado:           '',
        email_demandado:               '',
        telefono_demandado:            '',
        mesa_partes_url_demandado:     '',
        nombre_representante_dem:      '',
        documento_representante_dem:   '',
        // Documentos principales
        documentos_solicitud_inicio:   [],
        documentos_controversia:       [], // Convenio Arbitral
        documentos_contra_cautela:     [],
        // Tasa — dos comprobantes (honorarios de árbitro de emergencia + gastos administrativos)
        comprobante_honorarios_emergencia: [],
        comprobante_gastos_administrativos: [],
        factura_ruc:                   '',
        factura_razon_social:          '',
        // Adjuntos
        documentos_anexos:             [],
        // Declaración
        acepta_reglamento_card:        false,
    });

    // El envío usa router.post con FormData manual, que NO alimenta el `errors`/`processing`
    // de useForm: los errores 422 del backend llegan como prop de página (usePage) y el
    // estado de envío se controla aquí para deshabilitar el botón y evitar doble submit.
    const errors = usePage().props.errors ?? {};
    const [enviando, setEnviando] = useState(false);

    const setCamposDem = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona              !== undefined ? { tipo_persona:              cambios.tipo_persona }              : {}),
        ...(cambios.tipo_documento            !== undefined ? { tipo_documento:             cambios.tipo_documento }            : {}),
        ...(cambios.documento                 !== undefined ? { documento_demandante:       cambios.documento }                 : {}),
        ...(cambios.nombre                    !== undefined ? { nombre_demandante:          cambios.nombre }                    : {}),
        ...(cambios.domicilio                 !== undefined ? { domicilio_demandante:       cambios.domicilio }                 : {}),
        ...(cambios.nombre_representante      !== undefined ? { nombre_representante:       cambios.nombre_representante }      : {}),
        ...(cambios.documento_representante   !== undefined ? { documento_representante:    cambios.documento_representante }   : {}),
    })), [setData]);

    const setCamposDado = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona           !== undefined ? { tipo_persona_demandado:        cambios.tipo_persona }           : {}),
        ...(cambios.tipo_documento         !== undefined ? { tipo_documento_demandado:       cambios.tipo_documento }         : {}),
        ...(cambios.documento              !== undefined ? { documento_demandado:            cambios.documento }              : {}),
        ...(cambios.nombre                 !== undefined ? { nombre_demandado:               cambios.nombre }                 : {}),
        ...(cambios.domicilio              !== undefined ? { domicilio_demandado:            cambios.domicilio }              : {}),
        ...(cambios.nombre_representante   !== undefined ? { nombre_representante_dem:       cambios.nombre_representante }   : {}),
        ...(cambios.documento_representante!== undefined ? { documento_representante_dem:    cambios.documento_representante }: {}),
    })), [setData]);

    const prevErrors = useRef({});
    useEffect(() => {
        if (errors.general && errors.general !== prevErrors.current.general) {
            toast.error(errors.general, { position: 'top-center', duration: 6000 });
        }
        prevErrors.current = errors;
    }, [errors]);

    const [tiposDocumento,  setTiposDocumento]  = useState([]);
    const [cargandoTipos,   setCargandoTipos]   = useState(true);
    const [tipoDocumentoId, setTipoDocumentoId] = useState('');

    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(tiposData => {
                setTiposDocumento(tiposData);
                if (tiposData.length === 1) setTipoDocumentoId(String(tiposData[0].id));
                setCargandoTipos(false);
            })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    /* ── Borrador (autoguardado en localStorage) ── */
    // Se excluyen del snapshot los arrays de File (no serializables) y la aceptación legal
    // (debe volver a marcarse). Los nombres de los archivos sí se guardan para avisar
    // qué hay que volver a adjuntar al restaurar.
    const {
        documentos_solicitud_inicio: _dsi, documentos_controversia: _dc,
        documentos_contra_cautela: _dcc, comprobante_honorarios_emergencia: _che,
        comprobante_gastos_administrativos: _cga, documentos_anexos: _da,
        acepta_reglamento_card: _arc,
        ...dataBorrador
    } = data;
    const { limpiar: limpiarBorrador } = useBorrador({
        clave: claveBorrador(servicio.slug, portalEmail),
        datos: {
            data: dataBorrador,
            emailsDem, emailsDemAdic, emailsDado,
            subtipoJuridicoDem, subtipoJuridicoDado,
            empresasConsorcioDem, empresasConsorcioDado,
            repConsorcioDem, repConsorcioDado,
            tipoDocumentoId,
        },
        archivos: {
            'Solicitud de Inicio de Arbitraje':        (data.documentos_solicitud_inicio ?? []).map(f => f.name),
            'Convenio Arbitral':                       (data.documentos_controversia ?? []).map(f => f.name),
            'Contra Cautela':                          (data.documentos_contra_cautela ?? []).map(f => f.name),
            'Comprobante de Honorarios de Emergencia': (data.comprobante_honorarios_emergencia ?? []).map(f => f.name),
            'Comprobante de Gastos Administrativos':   (data.comprobante_gastos_administrativos ?? []).map(f => f.name),
            'Anexos':                                  (data.documentos_anexos ?? []).map(f => f.name),
            'Vigencia de Poder (demandante)':          docVigenciaPoderDem.map(f => f.name),
            'Contrato de Consorcio (demandante)':      docContratoConsorcioDem.map(f => f.name),
            'Resolución de Facultades (demandante)':   docResolucionFacultadesDem.map(f => f.name),
            'Vigencia de Poder (demandado)':           docVigenciaPoderDado.map(f => f.name),
            'Contrato de Consorcio (demandado)':       docContratoConsorcioDado.map(f => f.name),
            'Resolución de Facultades (demandado)':    docResolucionFacultadesDado.map(f => f.name),
        },
        hayAvance:
            [data.nombre_demandante, data.documento_demandante, data.nombre_demandado,
             data.documento_demandado]
                .some(v => String(v ?? '').trim() !== '')
            || empresasConsorcioDem.length > 0
            || empresasConsorcioDado.length > 0
            || (data.documentos_solicitud_inicio ?? []).length > 0,
        aplicar: s => {
            if (s.data) setData(d => ({ ...d, ...s.data }));
            if (s.emailsDem)     setEmailsDem(s.emailsDem);
            if (s.emailsDemAdic) setEmailsDemAdic(s.emailsDemAdic);
            if (s.emailsDado)    setEmailsDado(s.emailsDado);
            if (s.subtipoJuridicoDem  !== undefined) setSubtipoJuridicoDem(s.subtipoJuridicoDem);
            if (s.subtipoJuridicoDado !== undefined) setSubtipoJuridicoDado(s.subtipoJuridicoDado);
            if (s.empresasConsorcioDem)  setEmpresasConsorcioDem(s.empresasConsorcioDem);
            if (s.empresasConsorcioDado) setEmpresasConsorcioDado(s.empresasConsorcioDado);
            if (s.repConsorcioDem)  setRepConsorcioDem(s.repConsorcioDem);
            if (s.repConsorcioDado) setRepConsorcioDado(s.repConsorcioDado);
            if (s.tipoDocumentoId)  setTipoDocumentoId(String(s.tipoDocumentoId));
        },
    });

    // Datos planos para el esquema Zod (mismas claves que las marcas de error del render)
    function datosValidables() {
        const emailPrincipal = isPortal ? { email: portalEmail } : emailsDem.find(e => e.email.trim());
        return {
            documentos_solicitud_inicio: (data.documentos_solicitud_inicio ?? []).length,
            documentos_controversia: (data.documentos_controversia ?? []).length,
            documentos_contra_cautela: (data.documentos_contra_cautela ?? []).length,
            tipo_persona: data.tipo_persona,
            subtipo_dem: subtipoJuridicoDem,
            nombre_demandante: data.nombre_demandante,
            documento_demandante: data.documento_demandante,
            tipo_documento: data.tipo_documento,
            domicilio_demandante: componerDomicilio(data.domicilio_demandante),
            telefono_demandante: data.telefono_demandante,
            mesa_partes_url_demandante: data.mesa_partes_url_demandante,
            empresas_dem: empresasConsorcioDem.length,
            rep_dem_dni: repConsorcioDem.dni,
            rep_dem_nombre: repConsorcioDem.nombre,
            nombre_demandado: data.nombre_demandado,
            domicilio_demandado: componerDomicilio(data.domicilio_demandado),
            tipo_persona_demandado: data.tipo_persona_demandado,
            subtipo_dado: subtipoJuridicoDado,
            empresas_dado: empresasConsorcioDado.length,
            rep_dado_dni: repConsorcioDado.dni,
            rep_dado_nombre: repConsorcioDado.nombre,
            email_demandado: data.email_demandado,
            mesa_partes_url_demandado: data.mesa_partes_url_demandado,
            acepta_reglamento_card: data.acepta_reglamento_card,
            email_principal_dem: !!emailPrincipal,
        };
    }

    // onBlur por campo: valida el esquema completo pero marca/limpia solo ese campo
    const validarBlur = (campo) => validarCampo(emergenciaSchema, datosValidables(), campo, setMissingFields);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!aceptoLegal) { setModalLegal(true); return; }

        if (!validarZod(emergenciaSchema, datosValidables(), { setError: setMissingFields, clearErrors: () => setMissingFields({}) })) {
            setShowErrorModal(true);
            return;
        }

        const ok = await confirmar({
            variant: 'warning',
            titulo:  'Confirmar solicitud de arbitraje de emergencia',
            mensaje: `Se enviará la solicitud de arbitraje de emergencia del servicio "${servicio.nombre}". Se generará un cargo y se enviarán credenciales de acceso al correo registrado.`,
            detalles: [
                { label: 'Demandante', value: data.nombre_demandante || (empresasConsorcioDem[0]?.nombre ? 'Consorcio: ' + empresasConsorcioDem[0].nombre : '—') },
                { label: 'Demandado', value: data.nombre_demandado || '—' },
            ],
            confirmText: 'Sí, enviar',
        });
        if (ok) enviarFormulario();
    };

    const FIELD_LABELS = {
        documentos_solicitud_inicio:        'Solicitud de Inicio de Arbitraje de Emergencia',
        documentos_controversia:            'Convenio Arbitral',
        documentos_contra_cautela:          'Contra Cautela',
        nombre_demandante:                  'Nombre del demandante',
        documento_demandante:               'Documento del demandante',
        domicilio_demandante:               'Domicilio del demandante',
        mesa_partes_url_demandante:         'Mesa de partes virtual del demandante',
        mesa_partes_url_demandado:          'Mesa de partes virtual del demandado',
        telefono_demandante:                'Teléfono del demandante',
        emails_demandante:                  'Correo del demandante',
        subtipo_juridico_demandante:        'Tipo de persona jurídica del demandante',
        empresas_consorcio_demandante:      'Empresas del consorcio (demandante)',
        rep_consorcio_demandante_dni:       'DNI del representante del consorcio (demandante)',
        rep_consorcio_demandante_nombre:    'Nombre del representante del consorcio (demandante)',
        nombre_demandado:                   'Nombre del demandado',
        domicilio_demandado:                'Domicilio del demandado',
        email_demandado:                    'Correo electrónico del demandado',
        subtipo_juridico_demandado:         'Tipo de persona jurídica del demandado',
        empresas_consorcio_demandado:       'Empresas del consorcio (demandado)',
        rep_consorcio_demandado_dni:        'DNI del representante del consorcio (demandado)',
        rep_consorcio_demandado_nombre:     'Nombre del representante del consorcio (demandado)',
        acepta_reglamento_card:             'Declaración y aceptación final',
    };

    useEffect(() => {
        if (Object.keys(missingFields).length === 0) return;
        const filled = {};
        if (Array.isArray(data.documentos_solicitud_inicio) && data.documentos_solicitud_inicio.length > 0)
            filled.documentos_solicitud_inicio = true;
        if (Array.isArray(data.documentos_controversia) && data.documentos_controversia.length > 0)
            filled.documentos_controversia = true;
        if (Array.isArray(data.documentos_contra_cautela) && data.documentos_contra_cautela.length > 0)
            filled.documentos_contra_cautela = true;
        if (data.nombre_demandante?.trim())    filled.nombre_demandante    = true;
        if (data.documento_demandante?.trim() && (!LONG_DOC[data.tipo_documento] || data.documento_demandante.length === LONG_DOC[data.tipo_documento])) filled.documento_demandante = true;
        if (componerDomicilio(data.domicilio_demandante).trim()) filled.domicilio_demandante = true;
        if (data.telefono_demandante?.trim())  filled.telefono_demandante  = true;
        if (data.mesa_partes_url_demandante?.trim()) filled.mesa_partes_url_demandante = true;
        if (data.nombre_demandado?.trim())     filled.nombre_demandado     = true;
        if (componerDomicilio(data.domicilio_demandado).trim())  filled.domicilio_demandado  = true;
        if (data.email_demandado?.trim())      filled.email_demandado      = true;
        if (data.mesa_partes_url_demandado?.trim()) filled.mesa_partes_url_demandado = true;
        if (subtipoJuridicoDem)                filled.subtipo_juridico_demandante = true;
        if (subtipoJuridicoDado)               filled.subtipo_juridico_demandado  = true;
        if (empresasConsorcioDem.length > 0)   filled.empresas_consorcio_demandante = true;
        if (empresasConsorcioDado.length > 0)  filled.empresas_consorcio_demandado  = true;
        if (repConsorcioDem.dni?.length === 8) filled.rep_consorcio_demandante_dni = true;
        if (repConsorcioDem.nombre?.trim())    filled.rep_consorcio_demandante_nombre = true;
        if (repConsorcioDado.dni?.length === 8) filled.rep_consorcio_demandado_dni = true;
        if (repConsorcioDado.nombre?.trim())    filled.rep_consorcio_demandado_nombre = true;
        if (data.acepta_reglamento_card)       filled.acepta_reglamento_card = true;
        if (emailsDem.some(e => e.email?.trim())) filled.emails_demandante = true;
        const next = { ...missingFields };
        let cambios = false;
        Object.keys(filled).forEach(k => {
            if (next[k]) { delete next[k]; cambios = true; }
        });
        if (cambios) setMissingFields(next);
    }, [data, subtipoJuridicoDem, subtipoJuridicoDado, empresasConsorcioDem, empresasConsorcioDado, repConsorcioDem, repConsorcioDado, emailsDem]);

    const enviarFormulario = () => {
        if (enviando) return;
        setEnviando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            if (Array.isArray(v)) {
                v.forEach(f => fd.append(k + '[]', f instanceof File ? f : String(f)));
            } else if (typeof v === 'boolean') {
                fd.append(k, v ? '1' : '0');
            } else {
                fd.append(k, v);
            }
        });

        // Domicilios desglosados → una sola línea legible para el backend
        fd.set('domicilio_demandante', componerDomicilio(data.domicilio_demandante));
        fd.set('domicilio_demandado',  componerDomicilio(data.domicilio_demandado));

        if (tipoDocumentoId) fd.append('tipo_documento_id', tipoDocumentoId);

        fd.set('email_demandante', isPortal ? portalEmail : (emailsDem[0]?.email ?? ''));
        fd.append('emails_demandante', JSON.stringify(
            isPortal
                ? [
                    { email: portalEmail, label: '' },
                    ...emailsDemAdic
                        .filter(e => e.email.trim() && e.email.trim().toLowerCase() !== portalEmail.toLowerCase()),
                  ]
                : emailsDem.filter(e => e.email.trim())
        ));
        fd.append('emails_demandado',  JSON.stringify(emailsDado.filter(e => e.email.trim())));

        fd.append('subtipo_juridico_demandante', subtipoJuridicoDem);
        fd.append('subtipo_juridico_demandado',  subtipoJuridicoDado);

        fd.append('empresas_consorcio_demandante', JSON.stringify(empresasPayload(empresasConsorcioDem)));
        if (subtipoJuridicoDem === 'consorcio') {
            fd.set('nombre_representante',    repConsorcioDem.nombre ?? '');
            fd.set('documento_representante', repConsorcioDem.dni ?? '');
            if (!fd.get('nombre_demandante')) {
                fd.set('nombre_demandante',    repConsorcioDem.nombre ?? '');
                fd.set('documento_demandante', repConsorcioDem.dni ?? '');
            }
        }

        fd.append('empresas_consorcio_demandado',            JSON.stringify(empresasPayload(empresasConsorcioDado)));
        fd.append('nombre_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.nombre ?? '') : (data.nombre_representante_dem ?? ''));
        fd.append('documento_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.dni ?? '') : (data.documento_representante_dem ?? ''));

        const gruposArchivos = {
            doc_vigencia_poder_dem:         docVigenciaPoderDem,
            doc_contrato_consorcio_dem:     docContratoConsorcioDem,
            doc_resolucion_facultades_dem:  docResolucionFacultadesDem,
            doc_vigencia_poder_dado:        docVigenciaPoderDado,
            doc_contrato_consorcio_dado:    docContratoConsorcioDado,
            doc_resolucion_facultades_dado: docResolucionFacultadesDado,
        };
        Object.entries(gruposArchivos).forEach(([key, files]) => {
            files.forEach(f => fd.append(key + '[]', f));
        });

        if (captchaToken) fd.append('captcha_token', captchaToken);

        router.post(route('solicitud.arbitraje.store'), fd, {
            forceFormData: true,
            onSuccess: () => limpiarBorrador(),
            onFinish: () => {
                setEnviando(false);
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
            },
            onError: (errs) => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                toast.error(Object.values(errs)[0] || 'Revise los campos marcados en rojo', { position: 'top-center' });
            },
        });
    };

    // Entidad pública → bloque "Datos de la Procuraduría" en lugar del correo/teléfono genérico
    const demEsEntidadPublica  = data.tipo_persona === 'juridica'           && subtipoJuridicoDem  === 'entidad_publica';
    const dadoEsEntidadPublica = data.tipo_persona_demandado === 'juridica' && subtipoJuridicoDado === 'entidad_publica';

    // Control de correo del demandante (OTP verificado en portal, o EmailsInput)
    const correoDemandante = (etiqueta) => isPortal ? (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    {etiqueta} <span className="text-[#BE0F4A]">*</span>
                </label>
                <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-medium">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>
                    {portalEmail}
                </div>
                <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no puede modificarse</p>
            </div>
            <EmailsInput
                label="Correos adicionales del demandante (para notificaciones)"
                value={emailsDemAdic}
                onChange={setEmailsDemAdic}
                required={false}
                placeholder="correo@ejemplo.com"
            />
        </div>
    ) : (
        <EmailsInput
            label={etiqueta}
            value={emailsDem}
            onChange={setEmailsDem}
            required
            placeholder="correo@ejemplo.com"
            error={errors.email_demandante || missingFields.emails_demandante}
        />
    );

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* Aviso normativo — Directiva de Arbitraje de Emergencia con link al PDF */}
            <div className="mb-5 relative overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-sm">
                <div className="absolute left-0 top-0 w-1.5 h-full bg-[#BE0F4A]" />
                <div className="p-4 sm:p-5 flex gap-4 items-start">
                    <div className="w-10 h-10 shrink-0 rounded-full bg-[#291136]/5 flex items-center justify-center">
                        <Scale size={20} className="text-[#291136]" strokeWidth={2} />
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-[#BE0F4A] tracking-[0.15em] uppercase mb-1">
                            Aviso Importante
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            Este servicio se presta de conformidad con lo regulado en la <strong className="text-[#291136] font-bold">Directiva de Arbitraje de Emergencia</strong> del CARD ANKAWA INTL.
                        </p>
                        <a
                            href="https://www.ankawainternacional.org/wp-content/uploads/DIRECTIVA-ARBITRO-DE-EMERGENCIA-.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#BE0F4A]/5 border border-[#BE0F4A]/20 text-[#BE0F4A] text-xs font-semibold hover:bg-[#BE0F4A]/10 transition-colors shadow-sm"
                        >
                            <FileText size={13} />
                            Directiva de Arbitraje de Emergencia (PDF)
                            <ExternalLink size={12} className="opacity-70" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="mb-5 px-4 py-3 bg-[#291136]/5 border border-[#291136]/15 rounded-xl flex items-center gap-3">
                <span className="text-[#BE0F4A] text-lg font-black leading-none">*</span>
                <p className="text-sm text-[#291136]">
                    Los campos marcados con <span className="text-[#BE0F4A] font-bold">*</span> son obligatorios.
                </p>
            </div>

            {cargandoTipos ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3 mb-2"/>
                    <div className="h-9 bg-gray-100 animate-pulse rounded-xl"/>
                </div>
            ) : tiposDocumento.length === 1 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]"/>
                        </div>
                        <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Tipo de solicitud</h2>
                    </div>
                    <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-4 p-4 sm:px-5 bg-[#291136]/5 border border-[#291136]/10 rounded-xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 h-full w-1.5 bg-[#BE0F4A]" />
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 border border-gray-200">
                                <CheckCircle2 size={20} className="text-[#BE0F4A]" />
                            </div>
                            <div>
                                <h3 className="text-sm sm:text-base font-black text-[#291136] tracking-tight">{tiposDocumento[0].nombre}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            ) : tiposDocumento.length > 1 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]"/>
                        </div>
                        <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Tipo de solicitud</h2>
                    </div>
                    <div className="px-6 py-4">
                        <CustomSelect
                            value={tipoDocumentoId}
                            onChange={val => setTipoDocumentoId(String(val))}
                            options={tiposDocumento}
                            placeholder="Seleccionar tipo..."
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 mb-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0"/>
                    <p className="text-sm text-amber-700 font-semibold">
                        No hay tipos de documento configurados para este servicio.
                    </p>
                </div>
            )}

            {/* Bloque Demandante */}
            <BloquePersona
                icono={User} titulo="Datos del Demandante"
                descripcion="El demandante es la persona natural, jurídica o entidad pública que presenta la solicitud de arbitraje de emergencia."
                campos={{
                    tipo_persona:            data.tipo_persona,
                    tipo_documento:          data.tipo_documento,
                    documento:               data.documento_demandante,
                    nombre:                  data.nombre_demandante,
                    domicilio:               data.domicilio_demandante,
                    nombre_representante:    data.nombre_representante,
                    documento_representante: data.documento_representante,
                }}
                setCampos={setCamposDem}
                errors={{
                    documento: errors.documento_demandante || missingFields.documento_demandante,
                    nombre:    errors.nombre_demandante    || missingFields.nombre_demandante,
                    domicilio: errors.domicilio_demandante || missingFields.domicilio_demandante,
                    subtipo:   missingFields.subtipo_juridico_demandante,
                    empresas:  missingFields.empresas_consorcio_demandante,
                    repDni:    missingFields.rep_consorcio_demandante_dni,
                    repNombre: missingFields.rep_consorcio_demandante_nombre,
                }}
                onBlurCampo={campo => validarBlur(`${campo}_demandante`)}
                bloquearTipoPersona={demandanteBloqueado}
                conRepresentante={true}
                esDemandante={true}
                portalEmail={portalEmail}
                subtipoJuridico={subtipoJuridicoDem}
                onSubtipoChange={setSubtipoJuridicoDem}
                docVigenciaPoder={docVigenciaPoderDem}
                onDocVigenciaPoderChange={setDocVigenciaPoderDem}
                docContratoConsorcio={docContratoConsorcioDem}
                onDocContratoConsorcioChange={setDocContratoConsorcioDem}
                docResolucionFacultades={docResolucionFacultadesDem}
                onDocResolucionFacultadesChange={setDocResolucionFacultadesDem}
                empresasConsorcio={empresasConsorcioDem}
                onEmpresasConsorcioChange={setEmpresasConsorcioDem}
                representanteConsorcio={repConsorcioDem}
                onRepresentanteConsorcioChange={cambios => setRepConsorcioDem(r => ({ ...r, ...cambios }))}
                procuraduriaSlot={demEsEntidadPublica && (
                    <DatosProcuraduria
                        correoSlot={correoDemandante('Correo electrónico (para notificaciones)')}
                        mesaPartesValue={data.mesa_partes_url_demandante}
                        onMesaPartesChange={v => setData('mesa_partes_url_demandante', v)}
                        mesaPartesError={errors.mesa_partes_url_demandante || missingFields.mesa_partes_url_demandante}
                        telefonoValue={data.telefono_demandante}
                        onTelefonoChange={v => setData('telefono_demandante', v)}
                        telefonoError={errors.telefono_demandante}
                    />
                )}
                contactoSlot={
                    <>
                        {correoDemandante('Correos del demandante (para notificaciones)')}
                        <Input id="telefono_demandante" label="Teléfono o Celular de Contacto" required type="text"
                            value={data.telefono_demandante} onChange={e => setData('telefono_demandante', e.target.value)}
                            placeholder="987654321"
                            error={errors.telefono_demandante || missingFields.telefono_demandante} />
                    </>
                }
            />

            {/* Bloque Demandado */}
            <BloquePersona
                icono={Users} titulo="Datos del Demandado"
                descripcion="El demandado es la persona natural, jurídica o entidad pública contra la cual se dirige la solicitud de arbitraje de emergencia."
                campos={{
                    tipo_persona:            data.tipo_persona_demandado,
                    tipo_documento:          data.tipo_documento_demandado,
                    documento:               data.documento_demandado,
                    nombre:                  data.nombre_demandado,
                    domicilio:               data.domicilio_demandado,
                    nombre_representante:    data.nombre_representante_dem,
                    documento_representante: data.documento_representante_dem,
                }}
                setCampos={setCamposDado}
                errors={{
                    documento: errors.documento_demandado,
                    nombre:    errors.nombre_demandado    || missingFields.nombre_demandado,
                    domicilio: errors.domicilio_demandado || missingFields.domicilio_demandado,
                    subtipo:   missingFields.subtipo_juridico_demandado,
                    empresas:  missingFields.empresas_consorcio_demandado,
                    repDni:    missingFields.rep_consorcio_demandado_dni,
                    repNombre: missingFields.rep_consorcio_demandado_nombre,
                }}
                onBlurCampo={campo => validarBlur(`${campo}_demandado`)}
                bloquearTipoPersona={false}
                conRepresentante={false}
                esDemandante={false}
                portalEmail={null}
                subtipoJuridico={subtipoJuridicoDado}
                onSubtipoChange={setSubtipoJuridicoDado}
                docVigenciaPoder={docVigenciaPoderDado}
                onDocVigenciaPoderChange={setDocVigenciaPoderDado}
                docContratoConsorcio={docContratoConsorcioDado}
                onDocContratoConsorcioChange={setDocContratoConsorcioDado}
                docResolucionFacultades={docResolucionFacultadesDado}
                onDocResolucionFacultadesChange={setDocResolucionFacultadesDado}
                empresasConsorcio={empresasConsorcioDado}
                onEmpresasConsorcioChange={setEmpresasConsorcioDado}
                representanteConsorcio={repConsorcioDado}
                onRepresentanteConsorcioChange={cambios => setRepConsorcioDado(r => ({ ...r, ...cambios }))}
                procuraduriaSlot={dadoEsEntidadPublica && (
                    <DatosProcuraduria
                        correoSlot={
                            <div className="space-y-3">
                                <Input label="Correo electrónico" required type="email"
                                    value={data.email_demandado} onChange={e => setData('email_demandado', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    error={errors.email_demandado || missingFields.email_demandado} />
                                <EmailsInput
                                    label="Correos adicionales del demandado (para notificaciones)"
                                    value={emailsDado}
                                    onChange={setEmailsDado}
                                    required={false}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        }
                        mesaPartesValue={data.mesa_partes_url_demandado}
                        onMesaPartesChange={v => setData('mesa_partes_url_demandado', v)}
                        mesaPartesError={errors.mesa_partes_url_demandado || missingFields.mesa_partes_url_demandado}
                        telefonoValue={data.telefono_demandado}
                        onTelefonoChange={v => setData('telefono_demandado', v)}
                        telefonoError={errors.telefono_demandado}
                    />
                )}
                contactoSlot={
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Correo electrónico del demandado" required type="email"
                                value={data.email_demandado} onChange={e => setData('email_demandado', e.target.value)}
                                placeholder="correo@ejemplo.com"
                                error={errors.email_demandado || missingFields.email_demandado} />
                            <Input label="Teléfono o Celular de Contacto" type="text"
                                value={data.telefono_demandado} onChange={e => setData('telefono_demandado', e.target.value)}
                                placeholder="987654321" error={errors.telefono_demandado} />
                        </div>
                        <EmailsInput
                            label="Correos adicionales del demandado (para notificaciones)"
                            value={emailsDado}
                            onChange={setEmailsDado}
                            required={false}
                            placeholder="correo@ejemplo.com"
                        />
                    </>
                }
            />

            {/* Documentos del Procedimiento de Emergencia */}
            <Seccion icono={FileText} destacado
                titulo={<>Documentos del Arbitraje de Emergencia <span className="text-[#BE0F4A]">*</span></>}>
                <div className="mb-5">
                    <MultiArchivoInput
                        label={<>Solicitud de Inicio de Arbitraje de Emergencia <span className="text-[#BE0F4A]">*</span></>}
                        value={data.documentos_solicitud_inicio}
                        onChange={v => setData('documentos_solicitud_inicio', v)} />
                    {(errors.documentos_solicitud_inicio || missingFields.documentos_solicitud_inicio) && (
                        <p className="mt-1.5 text-xs font-semibold text-red-500">
                            {errors.documentos_solicitud_inicio || missingFields.documentos_solicitud_inicio}
                        </p>
                    )}
                </div>

                <div className="mb-5">
                    <MultiArchivoInput
                        label={<>Convenio Arbitral <span className="text-[#BE0F4A]">*</span></>}
                        hint="Contrato donde figura la cláusula arbitral, orden de servicio u orden de compra."
                        value={data.documentos_controversia}
                        onChange={v => setData('documentos_controversia', v)} />
                    {(errors.documentos_controversia || missingFields.documentos_controversia) && (
                        <p className="mt-1.5 text-xs font-semibold text-red-500">
                            {errors.documentos_controversia || missingFields.documentos_controversia}
                        </p>
                    )}
                </div>

                <div>
                    <MultiArchivoInput
                        label={<>Contra Cautela <span className="text-[#BE0F4A]">*</span></>}
                        hint="Garantía o documento que respalde la medida solicitada."
                        value={data.documentos_contra_cautela}
                        onChange={v => setData('documentos_contra_cautela', v)} />
                    {(errors.documentos_contra_cautela || missingFields.documentos_contra_cautela) && (
                        <p className="mt-1.5 text-xs font-semibold text-red-500">
                            {errors.documentos_contra_cautela || missingFields.documentos_contra_cautela}
                        </p>
                    )}
                </div>
            </Seccion>

            {/* Tasa de Solicitud */}
            <Seccion icono={CreditCard} titulo="Tasa de Solicitud de Arbitraje de Emergencia"
                descripcion="De acuerdo a lo regulado en el artículo 11 de la Directiva de Arbitraje de Emergencia del CARD ANKAWA INTL.">
                <InfoPago />
                <div className="mb-5">
                    <MultiArchivoInput
                        label="Comprobante de pago de honorarios del Árbitro de Emergencia"
                        value={data.comprobante_honorarios_emergencia}
                        onChange={v => setData('comprobante_honorarios_emergencia', v)} />
                </div>
                <MultiArchivoInput
                    label="Comprobante de pago de gastos administrativos"
                    value={data.comprobante_gastos_administrativos}
                    onChange={v => setData('comprobante_gastos_administrativos', v)} />

                <div className="mt-6">
                    <h3 className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70 mb-3">
                        Datos para la Emisión de Factura
                    </h3>
                    <RucBuscador
                        label="Usuario"
                        rucValue={data.factura_ruc}
                        razonSocialValue={data.factura_razon_social}
                        onRucChange={val => setData('factura_ruc', val)}
                        onRazonSocialChange={val => setData('factura_razon_social', val)}
                    />
                </div>
            </Seccion>


            {/* Declaración y Aceptación final */}
            <AceptacionReglamento
                checked={data.acepta_reglamento_card}
                onChange={v => setData('acepta_reglamento_card', v)}
                error={missingFields.acepta_reglamento_card}
                contexto="al presente procedimiento de arbitraje de emergencia"
                finalidad="arbitraje de emergencia"
                primerBullet={<><strong className="text-[#291136]">Conozco y me someto a los Reglamentos y Directivas de Arbitraje de Emergencia del CARD ANKAWA INTL aplicables al presente procedimiento de arbitraje de emergencia.</strong></>}
                bulletsExtra={[
                    <>Confirmo que los <strong className="text-[#291136]">datos del demandante</strong> consignados en este formulario son verídicos y han sido validados previamente a través del correo electrónico registrado.</>,
                    <>Soy consciente de que los <strong className="text-[#291136]">datos del demandado</strong> aquí declarados serán utilizados para las notificaciones del proceso, asumiendo plena responsabilidad sobre su exactitud.</>,
                ]}
            />

            {hcaptchaSiteKey && (
                <div className="flex justify-center pb-2">
                    <HCaptchaWidget siteKey={hcaptchaSiteKey} onToken={setCaptchaToken} />
                </div>
            )}

            <div className="flex justify-end">
                <PrimaryButton
                    type="submit"
                    disabled={enviando || (hcaptchaSiteKey && !captchaToken)}
                    className="px-8 py-3 text-base shadow-lg"
                >
                    {enviando ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </PrimaryButton>
            </div>
        </form>

        {modalLegal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                    <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                        <ShieldCheck size={22} className="text-[#BE0F4A]"/>
                        <h3 className="text-white font-bold">Declaración Jurada y Protección de Datos</h3>
                    </div>
                    <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                        <p>De conformidad con la <strong>Ley N° 29733</strong> y D.S. 003-2013-JUS:</p>
                        <ul className="space-y-2 pl-4">
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>Sus datos serán usados exclusivamente para la gestión del proceso arbitral.</li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>No serán transferidos a terceros sin su consentimiento, salvo mandato legal.</li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>Tiene derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).</li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                            <p className="font-bold text-amber-800 mb-1">Declaración Jurada</p>
                            <p className="text-amber-700">Declaro bajo juramento que la información es verídica conforme al D.L. 1071.</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={() => setModalLegal(false)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button onClick={() => { setAceptoLegal(true); setModalLegal(false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50); }}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b]">
                            <CheckCircle2 size={16}/> Acepto y Envío
                        </button>
                    </div>
                </div>
            </div>
        )}

        {showErrorModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowErrorModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150"
                    onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <AlertTriangle size={22} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg leading-tight">No se pudo enviar la solicitud</h3>
                            <p className="text-white/90 text-xs mt-0.5">
                                {Object.keys(missingFields).length === 1
                                    ? 'Falta 1 campo obligatorio'
                                    : `Faltan ${Object.keys(missingFields).length} campos obligatorios`}
                            </p>
                        </div>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-600 mb-3">Complete los siguientes campos antes de enviar:</p>
                        <ul className="space-y-2">
                            {Object.entries(missingFields).map(([k, msg]) => (
                                <li key={k} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50 border border-red-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2"/>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[#291136]">
                                            {FIELD_LABELS[k] ?? msg}
                                        </p>
                                        {FIELD_LABELS[k] && msg !== 'Campo obligatorio' && (
                                            <p className="text-xs text-red-600 mt-0.5">{msg}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button type="button" onClick={() => setShowErrorModal(false)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] transition-colors shadow-sm">
                            <CheckCircle2 size={16}/> Entendido, voy a corregir
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
