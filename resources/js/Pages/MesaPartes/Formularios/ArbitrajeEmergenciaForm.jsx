import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import EmailsInput from '@/Components/EmailsInput';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';
import Checkbox from '@/Components/Checkbox';
import {
    User, Users, FileText, Paperclip,
    CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck,
    CreditCard, ShieldAlert, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
    Seccion,
    MultiArchivoInput,
    BloquePersona,
    RucBuscador,
    LONG_DOC,
    docDefaultPorPersona,
} from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';

export default function ArbitrajeEmergenciaForm({ servicio, portalEmail, portalUser }) {
    const { auth } = usePage().props;
    const isPortal = !!portalEmail;
    const isAuth   = !!auth?.user && !isPortal;
    const user     = isPortal ? portalUser : auth?.user;

    const tipoPersInicial = user ? (user.tipo_persona || 'natural') : 'natural';

    const [aceptoLegal, setAceptoLegal]     = useState(isAuth || isPortal);
    const [modalLegal, setModalLegal]       = useState(false);
    const [confirm, setConfirm]             = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [missingFields, setMissingFields]     = useState({});
    const [showErrorModal, setShowErrorModal]   = useState(false);
    const [demandanteBloqueado, setDemandanteBloqueado] = useState(isAuth || isPortal);
    const emailInicial = isPortal ? portalEmail : (isAuth ? user?.email : '');
    const [emailsDem, setEmailsDem]         = useState(emailInicial ? [{ email: emailInicial, label: '' }] : [{ email: '', label: '' }]);
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

    const { data, setData, processing, errors } = useForm({
        servicio_id:                   servicio.id,
        // Demandante
        tipo_persona:                  tipoPersInicial,
        tipo_documento:                docDefaultPorPersona(tipoPersInicial),
        nombre_demandante:             user?.name ?? '',
        documento_demandante:          user?.numero_documento ?? '',
        nombre_representante:          '',
        documento_representante:       '',
        domicilio_demandante:          user?.direccion ?? '',
        email_demandante:              emailInicial ?? '',
        telefono_demandante:           user?.telefono ?? '',
        // Demandado
        tipo_persona_demandado:        'natural',
        tipo_documento_demandado:      'dni',
        nombre_demandado:              '',
        documento_demandado:           '',
        domicilio_demandado:           '',
        email_demandado:               '',
        telefono_demandado:            '',
        nombre_representante_dem:      '',
        documento_representante_dem:   '',
        // Documentos principales
        documentos_solicitud_inicio:   [],
        documentos_controversia:       [], // Convenio Arbitral
        documentos_contra_cautela:     [],
        // Tasa
        comprobante_pago_tasa:         [],
        factura_ruc:                   '',
        factura_razon_social:          '',
        // Adjuntos
        documentos_anexos:             [],
        // Declaración
        acepta_reglamento_card:        false,
    });

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!aceptoLegal) { setModalLegal(true); return; }

        const missing = {};

        // Documento principal: Solicitud de Inicio de Arbitraje de Emergencia
        if (!Array.isArray(data.documentos_solicitud_inicio) || data.documentos_solicitud_inicio.length === 0)
            missing.documentos_solicitud_inicio = 'Adjunte la solicitud de inicio de arbitraje de emergencia';

        // Demandante: solo si no es consorcio
        if (data.tipo_persona !== 'juridica' || subtipoJuridicoDem !== 'consorcio') {
            if (!data.nombre_demandante?.toString().trim())    missing.nombre_demandante    = 'Campo obligatorio';
            if (!data.documento_demandante?.toString().trim()) missing.documento_demandante = 'Campo obligatorio';
            const lon = LONG_DOC[data.tipo_documento];
            if (lon && data.documento_demandante && data.documento_demandante.length !== lon) {
                missing.documento_demandante = `Debe tener ${lon} dígitos`;
            }
        }
        if (!data.domicilio_demandante?.toString().trim()) missing.domicilio_demandante = 'Campo obligatorio';
        if (!data.telefono_demandante?.toString().trim())  missing.telefono_demandante  = 'Campo obligatorio';

        if (data.tipo_persona === 'juridica') {
            if (!subtipoJuridicoDem) missing.subtipo_juridico_demandante = 'Seleccione el tipo';
            if (subtipoJuridicoDem === 'consorcio') {
                if (empresasConsorcioDem.length === 0) missing.empresas_consorcio_demandante = 'Agregue al menos una empresa';
                if (!repConsorcioDem.dni || repConsorcioDem.dni.length !== 8) missing.rep_consorcio_demandante_dni = 'DNI obligatorio (8 dígitos)';
                if (!repConsorcioDem.nombre?.trim()) missing.rep_consorcio_demandante_nombre = 'Nombre obligatorio';
            }
        }

        if (!data.nombre_demandado?.toString().trim())    missing.nombre_demandado    = 'Campo obligatorio';
        if (!data.domicilio_demandado?.toString().trim()) missing.domicilio_demandado = 'Campo obligatorio';

        if (data.tipo_persona_demandado === 'juridica') {
            if (!subtipoJuridicoDado) missing.subtipo_juridico_demandado = 'Seleccione el tipo';
            if (subtipoJuridicoDado === 'consorcio') {
                if (empresasConsorcioDado.length === 0) missing.empresas_consorcio_demandado = 'Agregue al menos una empresa';
                if (!repConsorcioDado.dni || repConsorcioDado.dni.length !== 8) missing.rep_consorcio_demandado_dni = 'DNI obligatorio (8 dígitos)';
                if (!repConsorcioDado.nombre?.trim()) missing.rep_consorcio_demandado_nombre = 'Nombre obligatorio';
                if (!data.email_demandado?.trim()) missing.email_demandado = 'Email del representante del consorcio';
            }
        }

        if (!data.acepta_reglamento_card) {
            missing.acepta_reglamento_card = 'Debe aceptar la declaración para enviar la solicitud';
        }

        const emailPrincipal = isPortal ? { email: portalEmail } : emailsDem.find(e => e.email.trim());
        if (!emailPrincipal) missing.emails_demandante = 'Ingrese al menos un correo';

        if (Object.keys(missing).length > 0) {
            setMissingFields(missing);
            setShowErrorModal(true);
            return;
        }

        setMissingFields({});
        setConfirm(true);
    };

    const FIELD_LABELS = {
        documentos_solicitud_inicio:        'Solicitud de Inicio de Arbitraje de Emergencia',
        nombre_demandante:                  'Nombre del demandante',
        documento_demandante:               'Documento del demandante',
        domicilio_demandante:               'Domicilio del demandante',
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
        if (data.nombre_demandante?.trim())    filled.nombre_demandante    = true;
        if (data.documento_demandante?.trim() && (!LONG_DOC[data.tipo_documento] || data.documento_demandante.length === LONG_DOC[data.tipo_documento])) filled.documento_demandante = true;
        if (data.domicilio_demandante?.trim()) filled.domicilio_demandante = true;
        if (data.telefono_demandante?.trim())  filled.telefono_demandante  = true;
        if (data.nombre_demandado?.trim())     filled.nombre_demandado     = true;
        if (data.domicilio_demandado?.trim())  filled.domicilio_demandado  = true;
        if (data.email_demandado?.trim())      filled.email_demandado      = true;
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
        setConfirm(false);
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

        if (tipoDocumentoId) fd.append('tipo_documento_id', tipoDocumentoId);

        fd.set('email_demandante', isPortal ? portalEmail : (emailsDem[0]?.email ?? ''));
        fd.append('emails_demandante', JSON.stringify(
            isPortal ? [{ email: portalEmail, label: '' }] : emailsDem.filter(e => e.email.trim())
        ));
        fd.append('emails_demandado',  JSON.stringify(emailsDado.filter(e => e.email.trim())));

        fd.append('subtipo_juridico_demandante', subtipoJuridicoDem);
        fd.append('subtipo_juridico_demandado',  subtipoJuridicoDado);

        fd.append('empresas_consorcio_demandante', JSON.stringify(empresasConsorcioDem));
        if (subtipoJuridicoDem === 'consorcio') {
            fd.set('nombre_representante',    repConsorcioDem.nombre ?? '');
            fd.set('documento_representante', repConsorcioDem.dni ?? '');
            if (!fd.get('nombre_demandante')) {
                fd.set('nombre_demandante',    repConsorcioDem.nombre ?? '');
                fd.set('documento_demandante', repConsorcioDem.dni ?? '');
            }
        }

        fd.append('empresas_consorcio_demandado',            JSON.stringify(empresasConsorcioDado));
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

        router.post(route('solicitud.arbitraje.store'), fd, {
            forceFormData: true,
            onFinish: () => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
            },
            onError: (errs) => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                toast.error(Object.values(errs)[0] || 'Revise los campos', { position: 'top-center' });
            },
        });
    };

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar solicitud de arbitraje de emergencia"
            resumen={`Se enviará la solicitud de arbitraje de emergencia del servicio "${servicio.nombre}" a nombre de ${data.nombre_demandante || (empresasConsorcioDem[0]?.nombre ? 'Consorcio: ' + empresasConsorcioDem[0].nombre : '—')}. Se generará un cargo y se enviarán credenciales de acceso al correo registrado.`}
            onConfirm={enviarFormulario}
            onCancel={() => setConfirm(false)}
            confirmando={processing}
        />
        <form onSubmit={handleSubmit} encType="multipart/form-data">

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
                    <div className="px-6 py-4 flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#291136]/10 text-[#291136]">
                            {tiposDocumento[0].nombre}
                        </span>
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
            {demandanteBloqueado ? (
                <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={14}/> Identidad verificada — datos cargados automáticamente
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setDemandanteBloqueado(false);
                            setCamposDem({ tipo_persona: 'natural', tipo_documento: 'dni', documento: '', nombre: '', domicilio: '', nombre_representante: '', documento_representante: '' });
                            if (!isPortal) setEmailsDem([{ email: '', label: '' }]);
                            setSubtipoJuridicoDem('');
                            setEmpresasConsorcioDem([]);
                            setRepConsorcioDem({ dni: '', nombre: '' });
                        }}
                        className="text-xs font-semibold text-green-600 hover:text-red-600 underline underline-offset-2 transition-colors shrink-0"
                    >
                        Cambiar persona
                    </button>
                </div>
            ) : (isAuth || isPortal) ? (
                <div className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/> Ingresando datos de otra persona
                </div>
            ) : null}

            <BloquePersona
                icono={User} titulo="Sus Datos (Demandante)"
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
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                        {isPortal ? (
                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                                    Correo del demandante <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-medium">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>
                                    {portalEmail}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no puede modificarse</p>
                            </div>
                        ) : (
                            <EmailsInput
                                label="Correos del demandante (para notificaciones)"
                                value={emailsDem}
                                onChange={setEmailsDem}
                                required
                                placeholder="correo@ejemplo.com"
                                error={errors.email_demandante || missingFields.emails_demandante}
                            />
                        )}
                    </div>
                </div>
                <Input id="telefono_demandante" label="Teléfono" required type="text"
                    value={data.telefono_demandante} onChange={e => setData('telefono_demandante', e.target.value)}
                    disabled={isAuth || (isPortal && !!user?.telefono)} placeholder="987654321"
                    error={errors.telefono_demandante || missingFields.telefono_demandante} />
            </div>

            {/* Bloque Demandado */}
            <BloquePersona
                icono={Users} titulo="Datos del Demandado"
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
            />

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Input label="Correo electrónico del demandado" type="email"
                        value={data.email_demandado} onChange={e => setData('email_demandado', e.target.value)}
                        placeholder="correo@ejemplo.com"
                        error={errors.email_demandado || missingFields.email_demandado} />
                    <Input label="Teléfono del demandado" type="text"
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
            </div>

            {/* Documentos del Procedimiento de Emergencia */}
            <Seccion icono={Zap} titulo="Documentos del Arbitraje de Emergencia">
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
                        label={<>Convenio Arbitral <span className="font-normal opacity-80">(Contrato donde figura la cláusula arbitral, orden de servicio u orden de compra, si existe — opcional)</span></>}
                        value={data.documentos_controversia}
                        onChange={v => setData('documentos_controversia', v)} />
                </div>

                <div>
                    <MultiArchivoInput
                        label={<>Contra Cautela <span className="font-normal opacity-80">(Garantía o documento que respalde la medida solicitada — opcional)</span></>}
                        value={data.documentos_contra_cautela}
                        onChange={v => setData('documentos_contra_cautela', v)} />
                </div>
            </Seccion>

            {/* Tasa de Solicitud */}
            <Seccion icono={CreditCard} titulo="Tasa de Solicitud de Arbitraje de Emergencia">
                <MultiArchivoInput
                    label="Copia del comprobante de pago (opcional)"
                    value={data.comprobante_pago_tasa}
                    onChange={v => setData('comprobante_pago_tasa', v)} />

                <div className="mt-6">
                    <h3 className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70 mb-3">
                        Datos de la Emisión de Factura
                    </h3>
                    <RucBuscador
                        label="Cliente"
                        rucValue={data.factura_ruc}
                        razonSocialValue={data.factura_razon_social}
                        onRucChange={val => setData('factura_ruc', val)}
                        onRazonSocialChange={val => setData('factura_razon_social', val)}
                    />
                </div>
            </Seccion>

            {/* Adjuntos */}
            <Seccion icono={Paperclip} titulo="Documentos Adjuntos (Anexos)">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Recomendación</p>
                    <p className="text-sm text-blue-700">
                        Antes de adjuntar, <strong>renombre cada archivo</strong> con el tipo de documento que representa
                        (ej: <em>DNI_representante.pdf</em>, <em>Poder_notarial.pdf</em>, <em>Contrato_principal.pdf</em>).
                        Esto facilita la revisión del expediente.
                    </p>
                </div>
                <MultiArchivoInput value={data.documentos_anexos} onChange={v => setData('documentos_anexos', v)} />
            </Seccion>

            {/* Declaración y Aceptación final */}
            <Seccion icono={ShieldCheck} titulo="Declaración y Aceptación">
                <div className={`rounded-xl p-5 transition-all ${
                    missingFields.acepta_reglamento_card
                        ? 'bg-red-50 border-2 border-red-400 ring-4 ring-red-100'
                        : data.acepta_reglamento_card
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-gray-50 border border-gray-200'
                }`}>
                    <Checkbox
                        checked={!!data.acepta_reglamento_card}
                        onChange={e => setData('acepta_reglamento_card', e.target.checked)}
                        required
                        error={missingFields.acepta_reglamento_card}
                        label="Declaro bajo juramento y acepto expresamente lo siguiente"
                    >
                        <ul className="mt-2 space-y-2 text-xs text-gray-600 leading-relaxed font-normal">
                            <li className="flex gap-2">
                                <ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>
                                <span>Conozco y me someto a los <strong className="text-[#291136]">reglamentos del CARD ANKAWA INT</strong> aplicables al presente procedimiento de arbitraje de emergencia.</span>
                            </li>
                            <li className="flex gap-2">
                                <ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>
                                <span>Confirmo que los <strong className="text-[#291136]">datos del demandante</strong> consignados en este formulario son verídicos y han sido validados previamente a través del correo electrónico registrado.</span>
                            </li>
                            <li className="flex gap-2">
                                <ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>
                                <span>Soy consciente de que los <strong className="text-[#291136]">datos del demandado</strong> aquí declarados serán utilizados para las notificaciones del proceso, asumiendo plena responsabilidad sobre su exactitud.</span>
                            </li>
                            <li className="flex gap-2">
                                <ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>
                                <span>Autorizo el tratamiento de los datos personales conforme a la <strong className="text-[#291136]">Ley N° 29733</strong> y al D.S. 003-2013-JUS, exclusivamente para los fines del presente arbitraje.</span>
                            </li>
                        </ul>
                    </Checkbox>
                </div>
            </Seccion>

            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base shadow-lg">
                    {processing ? 'Enviando solicitud...' : 'Enviar Solicitud'}
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
