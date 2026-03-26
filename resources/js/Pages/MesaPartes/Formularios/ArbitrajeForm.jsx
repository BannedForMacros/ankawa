import { useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    User, Users, Scale, FileText, Paperclip,
    CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck,
    Loader2, X, Lock, Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Constantes ─── */
const TIPOS_PERSONA = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Jurídica' },
];
const OPCIONES_ARBITRO = [
    { id: 1, nombre: 'Sí, solicito designación por el Director' },
    { id: 0, nombre: 'No, propongo árbitro'                     },
];
const LONG_DOC = { dni: 8, ruc: 11, ce: null };

function docDefaultPorPersona(tipo) {
    return tipo === 'juridica' ? 'ruc' : 'dni';
}

/* ─── Sección visual ─── */
function Seccion({ icono: Icono, titulo, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={16} className="text-[#BE0F4A]" />
                </div>
                <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

/* ─── Multi-archivo con append/remove ─── */
function MultiArchivoInput({ label, value = [], onChange, accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png' }) {
    const inputRef = useRef();

    function agregar(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !value.some(a => a.name === n.name && a.size === n.size)
        );
        onChange([...value, ...nuevos]);
        e.target.value = '';
    }

    return (
        <div>
            {label && <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">{label}</label>}
            <button type="button" onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#291136] hover:text-[#291136] transition-colors w-full justify-center">
                <Paperclip size={15}/> Agregar archivos
            </button>
            <input ref={inputRef} type="file" multiple accept={accept} onChange={agregar} className="hidden" />
            {value.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {value.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                            <FileText size={14} className="text-[#BE0F4A] shrink-0"/>
                            <span className="truncate flex-1 text-[#291136] font-medium">{f.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">{(f.size/1024/1024).toFixed(2)} MB</span>
                            <button type="button" onClick={() => onChange(value.filter((_,j) => j !== i))}
                                className="text-gray-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─── Bloque de Persona (demandante o demandado) ─── */
function BloquePersona({ titulo, icono: Icono, campos, setCampos, errors, deshabilitado, conRepresentante }) {
    const [tipoPersona,   setTipoPersona]   = useState(campos.tipo_persona   || 'natural');
    const [tipoDoc,       setTipoDoc]       = useState(campos.tipo_documento  || 'dni');
    const [cargando,      setCargando]      = useState(false);
    const [bloqueado,     setBloqueado]     = useState(false);
    const [modoManual,    setModoManual]    = useState(false);
    const timerRef = useRef();

    const opcionesDoc = tipoPersona === 'juridica'
        ? [{ id: 'ruc', nombre: 'RUC (11 dígitos)' }]
        : [{ id: 'dni', nombre: 'DNI (8 dígitos)' }, { id: 'ce', nombre: 'Carné de Extranjería' }];

    function cambiarPersona(val) {
        const nuevoDoc = docDefaultPorPersona(val);
        setTipoPersona(val);
        setTipoDoc(nuevoDoc);
        setBloqueado(false); setModoManual(false);
        setCampos({ tipo_persona: val, tipo_documento: nuevoDoc, documento: '', nombre: '', domicilio: '' });
    }

    function cambiarTipoDoc(val) {
        setTipoDoc(val);
        setBloqueado(false); setModoManual(false);
        setCampos({ tipo_documento: val, documento: '', nombre: '', domicilio: '' });
    }

    function onDocChange(val) {
        const clean = val.replace(/\D/g, '');
        // Auto-detectar: 11 dígitos empezando con 2 = RUC
        if (clean.length === 11 && clean.startsWith('2') && tipoDoc !== 'ruc') {
            setTipoDoc('ruc'); setTipoPersona('juridica');
            setCampos({ tipo_persona: 'juridica', tipo_documento: 'ruc', documento: clean });
            consultarAPI('ruc', clean);
            return;
        }
        setCampos({ documento: clean });
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => consultarAPI(tipoDoc, clean), 500);
    }

    async function consultarAPI(tipo, numero) {
        const lon = LONG_DOC[tipo];
        if (lon && numero.length !== lon) return;
        if (tipo === 'ce' && numero.length < 6) return;

        setCargando(true); setModoManual(false);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo, numero } });
            // DNI/CE: RENIEC no devuelve domicilio → solo bloquear nombre
            const cambios = { nombre: data.nombre ?? '' };
            if (tipo === 'ruc' && data.domicilio) cambios.domicilio = data.domicilio;
            setCampos(cambios);
            setBloqueado(true);
        } catch (err) {
            if (err.response?.status === 404) {
                toast('Documento no encontrado. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
            } else {
                toast('Consulta no disponible. Complete manualmente.', { icon: '⚠️', duration: 3000 });
            }
            setModoManual(true); setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    function limpiarDoc() {
        setBloqueado(false); setModoManual(false);
        setCampos({ documento: '', nombre: '', domicilio: '' });
    }

    const lon              = LONG_DOC[tipoDoc];
    const docValido        = lon ? campos.documento?.length === lon : (campos.documento?.length ?? 0) >= 6;
    const esLocked         = bloqueado && !modoManual && !deshabilitado;
    // Domicilio solo se bloquea si la API lo devolvió (RUC); para DNI/CE siempre editable
    const domicilioLocked  = esLocked && tipoDoc === 'ruc';

    return (
        <Seccion icono={Icono} titulo={titulo}>
            <div className="space-y-4">
                {/* Tipo persona */}
                <div>
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Tipo de persona <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect value={tipoPersona} onChange={cambiarPersona}
                        options={TIPOS_PERSONA} placeholder={null} disabled={deshabilitado} />
                </div>

                {/* Tipo doc + Número */}
                <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                            Tipo doc. <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <CustomSelect value={tipoDoc} onChange={cambiarTipoDoc}
                            options={opcionesDoc} placeholder={null}
                            disabled={deshabilitado || tipoPersona === 'juridica'} />
                    </div>
                    <div className="col-span-3">
                        <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                            N° documento <span className="text-[#BE0F4A]">*</span>
                            {lon && <span className="text-gray-400 font-normal ml-1">({lon} díg.)</span>}
                        </label>
                        <div className="relative">
                            <input type="text" value={campos.documento ?? ''}
                                onChange={e => onDocChange(e.target.value)}
                                disabled={deshabilitado}
                                maxLength={lon ?? 20}
                                placeholder={tipoDoc === 'ruc' ? '20xxxxxxxxx' : tipoDoc === 'dni' ? '12345678' : ''}
                                className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 transition-colors ${
                                    errors?.documento ? 'border-red-400 bg-red-50' :
                                    docValido && bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                                }`}
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                                {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                                {!cargando && bloqueado && !deshabilitado &&
                                    <button type="button" onClick={limpiarDoc} title="Limpiar">
                                        <X size={14} className="text-gray-400 hover:text-red-500"/>
                                    </button>}
                                {!cargando && !bloqueado && docValido &&
                                    <CheckCircle2 size={14} className="text-emerald-500"/>}
                            </div>
                        </div>
                        {errors?.documento && <p className="text-xs text-red-500 mt-1">{errors.documento}</p>}
                    </div>
                </div>

                {bloqueado && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <Lock size={12}/> Datos verificados automáticamente vía RENIEC/SUNAT
                    </div>
                )}
                {modoManual && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Unlock size={12}/> Complete los datos manualmente
                    </div>
                )}

                {/* Nombre */}
                <Input label={tipoPersona === 'juridica' ? 'Razón Social' : 'Nombre completo'} required
                    type="text" value={campos.nombre ?? ''}
                    onChange={e => setCampos({ nombre: e.target.value })}
                    disabled={deshabilitado || esLocked}
                    placeholder={tipoPersona === 'juridica' ? 'Empresa S.A.C.' : 'Juan Pérez López'}
                    error={errors?.nombre} />

                {/* Representante legal */}
                {tipoPersona === 'juridica' && conRepresentante && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <Input label="Representante Legal" type="text"
                            value={campos.nombre_representante ?? ''}
                            onChange={e => setCampos({ nombre_representante: e.target.value })} />
                        <Input label="DNI del Representante" type="text"
                            value={campos.documento_representante ?? ''}
                            onChange={e => setCampos({ documento_representante: e.target.value })} />
                    </div>
                )}

                {/* Domicilio */}
                <Input label="Domicilio de notificación" required type="text"
                    value={campos.domicilio ?? ''}
                    onChange={e => setCampos({ domicilio: e.target.value })}
                    disabled={deshabilitado || domicilioLocked}
                    placeholder="Dirección completa"
                    error={errors?.domicilio} />
            </div>
        </Seccion>
    );
}

/* ─── Formulario principal ─── */
export default function ArbitrajeForm({ servicio }) {
    const { auth } = usePage().props;
    const isAuth = !!auth?.user;
    const user   = auth?.user;

    const tipoPersInicial = isAuth ? (user.tipo_persona || 'natural') : 'natural';

    const [aceptoLegal, setAceptoLegal] = useState(isAuth);
    const [modalLegal, setModalLegal]   = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        servicio_id:                   servicio.id,
        // Demandante
        tipo_persona:                  tipoPersInicial,
        tipo_documento:                docDefaultPorPersona(tipoPersInicial),
        nombre_demandante:             isAuth ? user.name : '',
        documento_demandante:          isAuth ? (user.numero_documento || '') : '',
        nombre_representante:          '',
        documento_representante:       '',
        domicilio_demandante:          isAuth ? (user.direccion || '') : '',
        email_demandante:              isAuth ? user.email : '',
        telefono_demandante:           isAuth ? (user.telefono || '') : '',
        // Demandado
        tipo_persona_demandado:        'natural',
        tipo_documento_demandado:      'dni',
        nombre_demandado:              '',
        documento_demandado:           '',
        domicilio_demandado:           '',
        email_demandado:               '',
        telefono_demandado:            '',
        // Controversia
        resumen_controversia:          '',
        pretensiones:                  '',
        monto_involucrado:             '',
        documentos_controversia:       [],
        // Árbitro
        solicita_designacion_director: 1,
        nombre_arbitro_propuesto:      '',
        email_arbitro_propuesto:       '',
        domicilio_arbitro_propuesto:   '',
        reglas_aplicables:             '',
        // Adjuntos
        documentos_anexos:             [],
    });

    // Helpers para sub-objetos de demandante/demandado
    const setCamposDem  = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona   !== undefined ? { tipo_persona:         cambios.tipo_persona }   : {}),
        ...(cambios.tipo_documento !== undefined ? { tipo_documento:        cambios.tipo_documento }  : {}),
        ...(cambios.documento      !== undefined ? { documento_demandante:  cambios.documento }       : {}),
        ...(cambios.nombre         !== undefined ? { nombre_demandante:     cambios.nombre }          : {}),
        ...(cambios.domicilio      !== undefined ? { domicilio_demandante:  cambios.domicilio }       : {}),
        ...(cambios.nombre_representante      !== undefined ? { nombre_representante:     cambios.nombre_representante }     : {}),
        ...(cambios.documento_representante   !== undefined ? { documento_representante:  cambios.documento_representante }  : {}),
    })), [setData]);

    const setCamposDado = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona   !== undefined ? { tipo_persona_demandado:   cambios.tipo_persona }   : {}),
        ...(cambios.tipo_documento !== undefined ? { tipo_documento_demandado: cambios.tipo_documento }  : {}),
        ...(cambios.documento      !== undefined ? { documento_demandado:      cambios.documento }       : {}),
        ...(cambios.nombre         !== undefined ? { nombre_demandado:         cambios.nombre }          : {}),
        ...(cambios.domicilio      !== undefined ? { domicilio_demandado:      cambios.domicilio }       : {}),
    })), [setData]);

    const prevErrors = useRef({});
    useEffect(() => {
        if (errors.general && errors.general !== prevErrors.current.general) {
            toast.error(errors.general, { position: 'top-center', duration: 6000 });
        }
        prevErrors.current = errors;
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!aceptoLegal) { setModalLegal(true); return; }

        const reqs = {
            nombre_demandante:    'Nombre del demandante',
            documento_demandante: 'Documento del demandante',
            domicilio_demandante: 'Domicilio del demandante',
            email_demandante:     'Correo del demandante',
            telefono_demandante:  'Teléfono del demandante',
            nombre_demandado:     'Nombre del demandado',
            domicilio_demandado:  'Domicilio del demandado',
            resumen_controversia: 'Resumen de la controversia',
            pretensiones:         'Pretensiones',
        };
        for (const [campo, label] of Object.entries(reqs)) {
            if (!data[campo]?.trim()) {
                toast.error(`"${label}" es obligatorio`, { position: 'top-center' });
                return;
            }
        }
        const lon = LONG_DOC[data.tipo_documento];
        if (lon && data.documento_demandante.length !== lon) {
            toast.error(`Documento del demandante debe tener ${lon} dígitos`, { position: 'top-center' });
            return;
        }

        post(route('solicitud.arbitraje.store'), {
            preserveScroll: true,
            forceFormData:  true,
            onError: (errs) => toast.error(Object.values(errs)[0] || 'Revise los campos', { position: 'top-center' }),
        });
    };

    return (
        <>
        <form onSubmit={handleSubmit} encType="multipart/form-data">

            <BloquePersona
                icono={User} titulo="Sus Datos (Demandante)"
                campos={{
                    tipo_persona: data.tipo_persona,
                    tipo_documento: data.tipo_documento,
                    documento: data.documento_demandante,
                    nombre: data.nombre_demandante,
                    domicilio: data.domicilio_demandante,
                    nombre_representante: data.nombre_representante,
                    documento_representante: data.documento_representante,
                }}
                setCampos={setCamposDem}
                errors={{ documento: errors.documento_demandante, nombre: errors.nombre_demandante, domicilio: errors.domicilio_demandante }}
                deshabilitado={isAuth}
                conRepresentante={true}
            >
                {isAuth && (
                    <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                        <CheckCircle2 size={14}/> Identidad verificada — datos cargados automáticamente
                    </div>
                )}
            </BloquePersona>

            {/* Email y teléfono del demandante fuera del bloque persona */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input id="email_demandante" label="Correo electrónico" required type="email"
                        value={data.email_demandante} onChange={e => setData('email_demandante', e.target.value)}
                        disabled={isAuth} placeholder="correo@ejemplo.com" error={errors.email_demandante} />
                    <Input id="telefono_demandante" label="Teléfono" required type="text"
                        value={data.telefono_demandante} onChange={e => setData('telefono_demandante', e.target.value)}
                        disabled={isAuth} placeholder="987654321" error={errors.telefono_demandante} />
                </div>
            </div>

            <BloquePersona
                icono={Users} titulo="Datos del Demandado"
                campos={{
                    tipo_persona: data.tipo_persona_demandado,
                    tipo_documento: data.tipo_documento_demandado,
                    documento: data.documento_demandado,
                    nombre: data.nombre_demandado,
                    domicilio: data.domicilio_demandado,
                }}
                setCampos={setCamposDado}
                errors={{ documento: errors.documento_demandado, nombre: errors.nombre_demandado, domicilio: errors.domicilio_demandado }}
                deshabilitado={false}
                conRepresentante={false}
            />

            {/* Email y teléfono del demandado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Correo electrónico del demandado" type="email"
                        value={data.email_demandado} onChange={e => setData('email_demandado', e.target.value)}
                        placeholder="correo@ejemplo.com" />
                    <Input label="Teléfono del demandado" type="text"
                        value={data.telefono_demandado} onChange={e => setData('telefono_demandado', e.target.value)}
                        placeholder="987654321" />
                </div>
            </div>

            {/* Controversia */}
            <Seccion icono={Scale} titulo="Materia de la Controversia">
                <Textarea id="resumen_controversia" label="Resumen de la controversia" required
                    value={data.resumen_controversia} onChange={e => setData('resumen_controversia', e.target.value)}
                    placeholder="Describa brevemente los hechos y el origen del conflicto..." rows={4}
                    error={errors.resumen_controversia} />
                <Textarea id="pretensiones" label="Pretensiones" required
                    value={data.pretensiones} onChange={e => setData('pretensiones', e.target.value)}
                    placeholder="Indique qué solicita al tribunal arbitral..." rows={4}
                    error={errors.pretensiones} />
                <Input label="Monto involucrado (S/)" type="number" min="0" step="0.01"
                    value={data.monto_involucrado} onChange={e => setData('monto_involucrado', e.target.value)}
                    placeholder="Ej: 50000.00" error={errors.monto_involucrado} />
                <div className="mt-4">
                    <MultiArchivoInput
                        label="Documentos de la Controversia (contratos, evidencias — opcional)"
                        value={data.documentos_controversia}
                        onChange={v => setData('documentos_controversia', v)} />
                </div>
            </Seccion>

            {/* Árbitro */}
            <Seccion icono={FileText} titulo="Conformación del Tribunal">
                <div className="mb-5">
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Designación de Árbitro <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect value={data.solicita_designacion_director}
                        onChange={val => setData('solicita_designacion_director', val)}
                        options={OPCIONES_ARBITRO} placeholder={null} />
                </div>
                {data.solicita_designacion_director === 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input label="Nombre del Árbitro Propuesto" type="text"
                                value={data.nombre_arbitro_propuesto}
                                onChange={e => setData('nombre_arbitro_propuesto', e.target.value)} />
                        </div>
                        <Input label="Correo del Árbitro Propuesto" type="email"
                            value={data.email_arbitro_propuesto}
                            onChange={e => setData('email_arbitro_propuesto', e.target.value)} />
                        <Input label="Domicilio del Árbitro Propuesto" type="text"
                            value={data.domicilio_arbitro_propuesto}
                            onChange={e => setData('domicilio_arbitro_propuesto', e.target.value)} />
                    </div>
                )}
                <Input label="Reglas aplicables" type="text"
                    value={data.reglas_aplicables} onChange={e => setData('reglas_aplicables', e.target.value)}
                    placeholder="Ej: Reglamento Ankawa, UNCITRAL..." />
            </Seccion>

            {/* Adjuntos */}
            <Seccion icono={Paperclip} titulo="Documentos Adjuntos (opcional)">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-blue-800">
                        Adjunte DNI, poderes notariales, comprobantes u otros documentos de respaldo.
                        Puede agregar varios archivos uno a uno.
                    </p>
                </div>
                <MultiArchivoInput value={data.documentos_anexos} onChange={v => setData('documentos_anexos', v)} />
            </Seccion>

            {/* Aviso legal */}
            {!aceptoLegal && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-800">
                    <ShieldCheck size={20} className="text-blue-500 shrink-0"/>
                    <span>Al enviar declara bajo juramento que la información es verídica (Ley N° 29733).</span>
                </div>
            )}
            {errors.general && (
                <div id="error-general" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800 font-medium">
                    <AlertTriangle size={18} className="text-red-500 shrink-0"/>{errors.general}
                </div>
            )}
            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base shadow-lg">
                    {processing ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </PrimaryButton>
            </div>
        </form>

        {/* Modal Legal */}
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
        </>
    );
}
