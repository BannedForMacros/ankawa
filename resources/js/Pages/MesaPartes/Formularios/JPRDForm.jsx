import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Building2, HardHat, User, Paperclip, FileText, X, Send,
    Loader2, CheckCircle2, Lock, ChevronRight, AlertCircle, Plus, Trash2
} from 'lucide-react';
import EmailsInput from '@/Components/EmailsInput';
import AnkawaLoader from '@/Components/AnkawaLoader';
import CustomSelect from '@/Components/CustomSelect';
import AceptacionReglamento from '@/Components/AceptacionReglamento';
import HCaptchaWidget from '@/Components/HCaptchaWidget';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { validarZod, validarCampo } from '@/lib/validar';
import { confirmar } from '@/lib/swalAnkawa';
import { filtrarArchivosValidos } from '@/utils/archivos';
import useDocumentoLookup from '@/hooks/useDocumentoLookup';
import useBorrador, { claveBorrador } from '@/hooks/useBorrador';
import { Seccion } from '@/Pages/MesaPartes/Formularios/ArbitrajeForm';

/* ─── Constantes ─── */
const SUBTIPOS_JURIDICA = [
    { id: 'empresa',         nombre: 'Empresa'          },
    { id: 'consorcio',       nombre: 'Consorcio'        },
    { id: 'entidad_publica', nombre: 'Entidad Pública'  },
];
const SUBTIPOS_ENTIDAD     = SUBTIPOS_JURIDICA.filter(s => s.id === 'entidad_publica');
const SUBTIPOS_CONTRATISTA = SUBTIPOS_JURIDICA.filter(s => s.id !== 'entidad_publica');

/* ─── Sección visual (importada de ArbitrajeForm) ─── */

function Campo({ label, required, error, children }) {
    return (
        <div>
            <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                {label} {required && <span className="text-[#BE0F4A]">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function InputBase({ error, className = '', ...props }) {
    return (
        <input {...props}
            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 ${error ? 'border-red-300' : 'border-gray-200'} ${className}`} />
    );
}

/* ─── Lookup de documento (RUC/DNI) con autocompletado ─── */
// onResuelto(doc, nombre) → actualiza ambos campos juntos en el parent (sin stale closure).
// La máquina de estado (debounce, lock, fallo) vive en useDocumentoLookup; aquí solo el markup.
const LOOKUP_CFG = {
    ruc: { longitud: 11, placeholder: '20xxxxxxxxx', fuente: 'Verificado vía SUNAT',  mensaje: 'RUC no encontrado en SUNAT. Complete manualmente.' },
    dni: { longitud: 8,  placeholder: '12345678',    fuente: 'Verificado vía RENIEC', mensaje: 'DNI no encontrado en RENIEC. Complete manualmente.' },
};

function CampoDocLookup({ tipo, value, onResuelto, onVerificado, error, disabled, onBlur }) {
    const cfg = LOOKUP_CFG[tipo];
    const { cargando, bloqueado, onChange, limpiar } = useDocumentoLookup({
        tipo,
        longitud: cfg.longitud,
        onResuelto,
        mensajeNoEncontrado: cfg.mensaje,
    });

    // Avisar al padre cuando cambia el estado "verificado" para que pueda bloquear
    // el campo de nombre/razón social hermano (coherente con el resto de la app).
    useEffect(() => { onVerificado?.(bloqueado); }, [bloqueado]);

    return (
        <div>
            <div className="relative">
                <input type="text" value={value} onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    disabled={disabled}
                    placeholder={cfg.placeholder} maxLength={cfg.longitud}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 ${
                        bloqueado ? 'border-emerald-400 bg-emerald-50' : error ? 'border-red-300' : 'border-gray-200'
                    } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`} />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                    {!cargando && bloqueado && (
                        <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
                    )}
                    {!cargando && !bloqueado && value.length === cfg.longitud && (
                        <CheckCircle2 size={14} className="text-emerald-500"/>
                    )}
                </div>
            </div>
            {bloqueado && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> {cfg.fuente}</p>
            )}
        </div>
    );
}

const CampoRuc = (props) => <CampoDocLookup tipo="ruc" {...props} />;
const CampoDni = (props) => <CampoDocLookup tipo="dni" {...props} />;

/* ─── Representante legal (DNI lookup) ─── */
// onResuelto(dni, nombre) — callback único para evitar stale closure
function BloqueRepresentante({ dni, nombre, onResuelto, label = 'Representante Legal' }) {
    const { cargando, bloqueado, onChange, limpiar } = useDocumentoLookup({
        tipo: 'dni',
        longitud: 8,
        onResuelto,
        mensajeNoEncontrado: 'DNI no encontrado. Complete el nombre manualmente.',
    });

    return (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    DNI del {label} <span className="text-[#BE0F4A]">*</span>
                </label>
                <div className="relative">
                    <input type="text" value={dni} onChange={e => onChange(e.target.value)}
                        maxLength={8} placeholder="12345678"
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 ${
                            bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado && (
                            <button type="button" onClick={limpiar}>
                                <X size={13} className="text-gray-400 hover:text-red-500"/>
                            </button>
                        )}
                    </div>
                </div>
                {bloqueado && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> RENIEC</p>}
            </div>
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    Nombre del {label} <span className="text-[#BE0F4A]">*</span>
                </label>
                <input type="text" value={nombre}
                    onChange={e => onResuelto(dni, e.target.value)}
                    disabled={bloqueado} placeholder="Nombre completo"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 ${bloqueado ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-gray-200'}`} />
            </div>
        </div>
    );
}

/* ─── Fila individual de empresa en consorcio (estado propio → sin stale closure) ─── */
function FilaEmpresaConsorcio({ empresa, onUpdate, onRemove }) {
    // onUpdate ya hace merge en el padre, así que basta enviar los campos que cambian.
    // nom === null = el usuario está tipeando → no tocar la razón social todavía.
    const { cargando, bloqueado, onChange: handleRuc, limpiar } = useDocumentoLookup({
        tipo: 'ruc',
        longitud: 11,
        onResuelto: (doc, nom) => onUpdate(nom === null ? { ruc: doc } : { ruc: doc, nombre: nom }),
        mensajeNoEncontrado: 'RUC no encontrado. Complete manualmente.',
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">RUC</label>
                <div className="relative">
                    <input type="text" value={empresa.ruc} onChange={e => handleRuc(e.target.value)}
                        maxLength={11} placeholder="20xxxxxxxxx"
                        className={`w-full text-sm border rounded-xl px-3 py-2 pr-8 ${
                            bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={12} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado && (
                            <button type="button" onClick={limpiar}><X size={12} className="text-gray-400 hover:text-red-500"/></button>
                        )}
                    </div>
                </div>
                {bloqueado && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={9}/> SUNAT</p>}
            </div>
            <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Razón Social</label>
                <input type="text" value={empresa.nombre}
                    onChange={e => onUpdate({ ...empresa, nombre: e.target.value })}
                    disabled={bloqueado}
                    placeholder="Nombre de la empresa"
                    className={`w-full text-sm border rounded-xl px-3 py-2 ${
                        bloqueado ? 'bg-emerald-50 border-emerald-400 text-gray-600' : 'border-gray-200'
                    }`} />
            </div>
            <div>
                <button type="button" onClick={onRemove}
                    className="w-full py-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center">
                    <Trash2 size={14}/>
                </button>
            </div>
        </div>
    );
}

/* ─── Contenedor de empresas del consorcio ─── */
// _key: clave estable de React — con key={i}, al eliminar una fila se reutiliza la
// instancia y el candado SUNAT queda pegado a la empresa equivocada. Se quita del payload.
const sinKeyUI = (empresas) => (empresas ?? []).map(({ _key, ...e }) => e);

function EmpresasConsorcio({ empresas, onChange, error }) {
    function agregar() { onChange([...empresas, { ruc: '', nombre: '', _key: crypto.randomUUID() }]); }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70">
                    Empresas del consorcio <span className="text-[#BE0F4A]">*</span>
                </label>
                <button type="button" onClick={agregar}
                    className="flex items-center gap-1 text-xs font-semibold text-[#BE0F4A] hover:text-[#9c0a3b]">
                    <Plus size={12}/> Agregar empresa
                </button>
            </div>
            {empresas.length === 0 && !error && (
                <p className="text-xs text-gray-400 italic">Agrega al menos una empresa.</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
            {empresas.map((emp, i) => (
                <FilaEmpresaConsorcio
                    key={emp._key ?? i}
                    empresa={emp}
                    onUpdate={nuevaEmp => onChange(empresas.map((e, j) => j === i ? { ...e, ...nuevaEmp } : e))}
                    onRemove={() => onChange(empresas.filter((_, j) => j !== i))}
                />
            ))}
        </div>
    );
}

/* ─── Bloque de datos de un actor (entidad o contratista) ─── */
function BloqueActor({
    titulo, icono: Icono,
    datos, onChange,
    emailBloqueado, emailFijo,
    errors = {},
    isSolicitante = false,
    subtiposPermitidos = SUBTIPOS_JURIDICA,
    onBlurCampo, onClearError,
}) {
    function set(campo, val) { onChange({ ...datos, [campo]: val }); onClearError?.(campo); }

    // Razón social bloqueada cuando el RUC quedó verificado por SUNAT (el botón X del
    // RUC la libera al limpiar). Coherente con RucBuscador y las filas de consorcio.
    const [rucVerificado, setRucVerificado] = useState(false);

    const esConsorcio  = datos.subtipo === 'consorcio';
    const subtipoFijo  = subtiposPermitidos.length === 1;
    const subtipoLabel = subtipoFijo ? subtiposPermitidos[0].nombre : null;

    return (
        <Seccion icono={Icono} titulo={titulo} destacado={isSolicitante}>
            {isSolicitante && (
                <div className="flex items-center gap-2 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#291136] mb-2">
                    <CheckCircle2 size={14} className="text-[#BE0F4A]"/>
                    Estos son tus datos como solicitante
                </div>
            )}

            {/* Tipo de persona (fijo) + subtipo */}
            <div className="grid grid-cols-2 gap-4">
                <Campo label="Tipo de persona">
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50">
                        <Building2 size={14} className="text-[#BE0F4A]"/>
                        <span className="text-sm font-semibold text-[#291136]">Persona Jurídica</span>
                    </div>
                </Campo>

                {subtipoFijo ? (
                    <Campo label="Tipo de entidad jurídica">
                        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 rounded-xl px-3 py-2.5">
                            <Lock size={13} className="text-emerald-700"/>
                            <span className="text-sm font-semibold text-emerald-800">{subtipoLabel}</span>
                        </div>
                    </Campo>
                ) : (
                    <Campo label="Tipo de entidad jurídica" required error={errors.subtipo}>
                        <CustomSelect
                            value={datos.subtipo}
                            onChange={val => { onChange({ ...datos, subtipo: val, empresas: val === 'consorcio' ? [{ ruc: '', nombre: '' }] : [] }); onClearError?.('subtipo'); }}
                            options={subtiposPermitidos}
                            placeholder="Selecciona..."
                            error={errors.subtipo}
                        />
                    </Campo>
                )}
            </div>

            {/* Documento y nombre / Consorcio */}
            {!esConsorcio ? (
                <div className="grid grid-cols-2 gap-4">
                    <Campo label="RUC" required error={errors.documento}>
                        <CampoRuc
                            value={datos.documento ?? ''}
                            onResuelto={(doc, nom) => { onChange({ ...datos, documento: doc, ...(nom !== null && { nombre: nom }) }); onClearError?.('documento'); }}
                            onVerificado={setRucVerificado}
                            onBlur={() => onBlurCampo?.('documento')}
                            error={errors.documento}
                        />
                    </Campo>
                    <Campo label="Razón Social" required error={errors.nombre}>
                        <InputBase value={datos.nombre ?? ''} onChange={e => set('nombre', e.target.value)}
                            onBlur={() => onBlurCampo?.('nombre')}
                            disabled={rucVerificado}
                            placeholder="Nombre / Razón Social" error={errors.nombre}
                            className={rucVerificado ? 'bg-gray-50 text-gray-500' : ''} />
                    </Campo>
                </div>
            ) : (
                <EmpresasConsorcio
                    empresas={datos.empresas ?? []}
                    onChange={emps => onChange({ ...datos, empresas: emps })}
                    error={errors.empresas}
                />
            )}

            {/* Representante legal */}
            {datos.subtipo && (
                <BloqueRepresentante
                    dni={datos.representante?.dni ?? ''}
                    nombre={datos.representante?.nombre ?? ''}
                    onResuelto={(d, n) => onChange({
                        ...datos,
                        representante: {
                            dni: d,
                            nombre: n !== null ? n : (datos.representante?.nombre ?? ''),
                        },
                    })}
                    label={datos.subtipo === 'consorcio' ? 'Representante del Consorcio' : 'Representante Legal'}
                />
            )}

            {/* Teléfono */}
            <Campo label="Teléfono o Celular de Contacto">
                <InputBase value={datos.telefono ?? ''} onChange={e => set('telefono', e.target.value)}
                    placeholder="01-234-5678 / 987654321" />
            </Campo>

            {/* Mesa de Partes Virtual — solo entidad pública (donde se le notificará) */}
            {datos.subtipo === 'entidad_publica' && (
                <Campo label="Dirección de la Mesa de Partes Virtual" required error={errors.mesa_partes}>
                    <InputBase value={datos.mesa_partes_url ?? ''} onChange={e => set('mesa_partes_url', e.target.value)}
                        onBlur={() => onBlurCampo?.('mesa_partes')}
                        placeholder="https://mesadepartes.entidad.gob.pe" error={errors.mesa_partes} />
                    <p className="text-xs text-gray-400 mt-1">
                        Enlace o dirección de la mesa de partes virtual de la entidad (donde se le notificará).
                    </p>
                </Campo>
            )}

            {/* Email */}
            {emailBloqueado ? (
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                            Correo principal <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-3 py-2.5 text-sm text-emerald-800 font-medium">
                            <Lock size={13}/> {emailFijo}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no editable</p>
                    </div>
                    <EmailsInput
                        label="Correos adicionales para notificación"
                        value={(datos.emails ?? []).slice(1)}
                        onChange={adicionales => set('emails', [
                            (datos.emails?.[0] ?? { email: emailFijo, label: '' }),
                            ...adicionales,
                        ])}
                        required={false}
                        placeholder="correo@ejemplo.com"
                    />
                </div>
            ) : (
                <EmailsInput
                    label="Correos para notificación"
                    value={datos.emails ?? []}
                    onChange={emails => set('emails', emails)}
                    required={isSolicitante}
                    placeholder="correo@ejemplo.com"
                    error={errors.emails}
                />
            )}
        </Seccion>
    );
}

/* ─── Sección de documentos con upload ─── */
function SeccionDoc({ icono: Icono, titulo, descripcion, archivos, onChange, required, error }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const inputRef = useRef();

    function agregar(e) {
        const nuevos = filtrarArchivosValidos(e.target.files, { mimes: upload_mimes, maxMb: upload_max_mb })
            .filter(n => !archivos.some(a => a.name === n.name && a.size === n.size));
        onChange([...archivos, ...nuevos]);
        e.target.value = '';
    }

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden mb-4 ${error ? 'border-red-300' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/60">
                <div className="w-7 h-7 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={14} className="text-[#BE0F4A]" />
                </div>
                <div className="flex-1">
                    <span className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</span>
                    {required && <span className="ml-2 text-xs text-[#BE0F4A] font-semibold">(obligatorio)</span>}
                </div>
                {archivos.length > 0 && (
                    <span className="text-xs font-semibold bg-[#291136]/10 text-[#291136] px-2 py-0.5 rounded-full">
                        {archivos.length} archivo{archivos.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div className="p-4">
                {descripcion && (
                    <p className="text-xs text-gray-500 mb-3">{descripcion}</p>
                )}
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                    <Paperclip size={14}/> Seleccionar archivos
                </button>
                <input ref={inputRef} type="file" multiple accept={upload_accept} onChange={agregar} className="hidden"/>
                <p className="text-xs text-gray-400 mt-1.5 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                {archivos.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                        {archivos.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                                <FileText size={14} className="text-[#BE0F4A] shrink-0"/>
                                <span className="truncate flex-1 text-[#291136] font-medium text-xs">{f.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                                <button type="button" onClick={() => onChange(archivos.filter((_, j) => j !== i))}
                                    className="text-gray-300 hover:text-red-500 transition-colors"><X size={13}/></button>
                            </li>
                        ))}
                    </ul>
                )}
                {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>
        </div>
    );
}

/* ─── Estado inicial de un actor ─── */
function actorVacio(emailFijo = null, subtipoInicial = '') {
    return {
        tipo_persona: 'juridica',
        subtipo: subtipoInicial,
        documento: '',
        nombre: '',
        telefono: '',
        mesa_partes_url: '',
        emails: emailFijo ? [{ email: emailFijo, label: '' }] : [{ email: '', label: '' }],
        representante: { dni: '', nombre: '' },
        empresas: [],
    };
}

/* ─── Esquema de validación (espeja la antigua validar()) ─── */
const jprdSchema = z.object({
    rol: z.any(), ent_nombre: z.any(), ent_documento: z.any(), ent_mesa_partes: z.any(),
    con_subtipo: z.any(), con_nombre: z.any(), con_documento: z.any(), con_empresas: z.any(),
    sol_email_has: z.any(), doc_solicitud: z.any(), doc_contrato: z.any(),
    tiene_peticion: z.any(), doc_peticion: z.any(), acepta_reglamento: z.any(),
}).superRefine((d, ctx) => {
    const add = (campo, msg) => ctx.addIssue({ code: 'custom', path: [campo], message: msg });
    if (!d.rol) { add('rol', 'Debes seleccionar tu rol'); return; }
    if (String(d.ent_nombre ?? '').trim() === '')    add('ent_nombre', 'Requerido');
    if (String(d.ent_documento ?? '').trim() === '') add('ent_documento', 'Requerido');
    if (String(d.ent_mesa_partes ?? '').trim() === '') add('ent_mesa_partes', 'Indique la mesa de partes virtual de la entidad');
    const conConsorcio = d.con_subtipo === 'consorcio';
    if (!d.con_subtipo) add('con_subtipo', 'Selecciona el tipo de entidad jurídica');
    if (!conConsorcio) {
        if (String(d.con_nombre ?? '').trim() === '')    add('con_nombre', 'Requerido');
        if (String(d.con_documento ?? '').trim() === '') add('con_documento', 'Requerido');
    } else if (d.con_empresas === 0) {
        add('con_empresas', 'Agrega al menos una empresa del consorcio');
    }
    if (!d.sol_email_has) add('sol_email', 'Ingresa al menos un correo');
    if (d.doc_solicitud === 0) add('doc_solicitud', 'Adjunta la solicitud de conformación de JPRD');
    if (d.doc_contrato === 0)  add('doc_contrato', 'Adjunta el contrato de obra');
    if (d.tiene_peticion && d.doc_peticion === 0) add('doc_peticion', 'Adjunta el documento de la petición de decisión vinculante');
    if (!d.acepta_reglamento) add('acepta_reglamento', 'Debes aceptar la declaración para enviar la solicitud');
});

/* ─── Formulario JPRD ─── */
export default function JPRDForm({ servicio, portalEmail, portalUser, hcaptchaSiteKey }) {
    const [captchaToken, setCaptchaToken] = useState('');
    const isPortal = !!portalEmail;

    const [procesando,    setProcesando]    = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [errores,       setErrores]       = useState({});
    const loaderTimer                       = useRef(null);

    // Paso 1: selección de rol
    const [rolSolicitante, setRolSolicitante] = useState(null); // 'entidad' | 'contratista'

    // Solo pre-llena el correo del portal (el autenticador es el email OTP)
    function datosDesdePortal() {
        return actorVacio(portalEmail);
    }

    const [entidad,     setEntidad]     = useState(actorVacio(null, 'entidad_publica'));
    const [contratista, setContratista] = useState(actorVacio());

    // Cuando el usuario elige rol, pre-llena sus datos
    function elegirRol(rol) {
        setRolSolicitante(rol);
        const datosMios = datosDesdePortal();
        if (rol === 'entidad') {
            setEntidad({ ...datosMios, subtipo: 'entidad_publica' });
            setContratista(actorVacio());
        } else {
            setContratista({ ...datosMios, subtipo: '' });
            setEntidad(actorVacio(null, 'entidad_publica'));
        }
        setErrores({});
    }

    const [observacion,         setObservacion]         = useState('');
    const [tienePeticionPrevia, setTienePeticionPrevia] = useState(false);
    const [aceptaReglamento,    setAceptaReglamento]    = useState(false);
    const [docPeticionPrevia,   setDocPeticionPrevia]   = useState([]);

    const [docSolicitudConformacion, setDocSolicitudConformacion] = useState([]);
    const [docContratoObra,          setDocContratoObra]          = useState([]);
    const [docAdendas,               setDocAdendas]               = useState([]);
    const [docAnexos,                setDocAnexos]                = useState([]);

    const [tiposDocumento,  setTiposDocumento]  = useState([]);
    const [cargandoTipos,   setCargandoTipos]   = useState(true);
    const [tipoDocumentoId, setTipoDocumentoId] = useState('');

    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(data => {
                setTiposDocumento(data);
                if (data.length === 1) setTipoDocumentoId(String(data[0].id));
                setCargandoTipos(false);
            })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    /* ── Borrador (autoguardado en localStorage; la aceptación legal no se restaura) ── */
    const { limpiar: limpiarBorrador } = useBorrador({
        clave: claveBorrador(servicio.slug, portalEmail),
        datos: { rolSolicitante, entidad, contratista, observacion, tienePeticionPrevia, tipoDocumentoId },
        archivos: {
            'Solicitud de Conformación de JPRD': docSolicitudConformacion.map(f => f.name),
            'Contrato de Obra':                  docContratoObra.map(f => f.name),
            'Adendas':                           docAdendas.map(f => f.name),
            'Anexos':                            docAnexos.map(f => f.name),
            'Petición de Decisión Vinculante':   docPeticionPrevia.map(f => f.name),
        },
        hayAvance: !!rolSolicitante && (
            [entidad.nombre, entidad.documento, contratista.nombre, contratista.documento, observacion]
                .some(v => String(v ?? '').trim() !== '')
            || (entidad.empresas ?? []).length > 0
            || (contratista.empresas ?? []).length > 0
            || docSolicitudConformacion.length > 0
            || docContratoObra.length > 0
        ),
        aplicar: s => {
            if (s.rolSolicitante) setRolSolicitante(s.rolSolicitante);
            if (s.entidad)        setEntidad(prev => ({ ...prev, ...s.entidad }));
            if (s.contratista)    setContratista(prev => ({ ...prev, ...s.contratista }));
            if (s.observacion !== undefined)         setObservacion(s.observacion);
            if (s.tienePeticionPrevia !== undefined) setTienePeticionPrevia(!!s.tienePeticionPrevia);
            if (s.tipoDocumentoId)                   setTipoDocumentoId(String(s.tipoDocumentoId));
        },
    });

    // Datos planos para el esquema Zod (mismas claves que las marcas de error del render)
    function datosValidables() {
        const emailsSol = rolSolicitante === 'entidad' ? entidad.emails : contratista.emails;
        return {
            rol:             rolSolicitante ?? '',
            ent_nombre:      entidad.nombre ?? '',
            ent_documento:   entidad.documento ?? '',
            ent_mesa_partes: entidad.mesa_partes_url ?? '',
            con_subtipo:     contratista.subtipo ?? '',
            con_nombre:      contratista.nombre ?? '',
            con_documento:   contratista.documento ?? '',
            con_empresas:    (contratista.empresas ?? []).length,
            sol_email_has:   isPortal ? true : (emailsSol ?? []).some(em => em.email?.trim()),
            doc_solicitud:   docSolicitudConformacion.length,
            doc_contrato:    docContratoObra.length,
            tiene_peticion:  tienePeticionPrevia,
            doc_peticion:    docPeticionPrevia.length,
            acepta_reglamento: aceptaReglamento,
        };
    }

    const validarBlur = (campo) => validarCampo(jprdSchema, datosValidables(), campo, setErrores);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validarZod(jprdSchema, datosValidables(), { setError: setErrores, clearErrors: () => setErrores({}) })) {
            // Toast con el primer faltante (más útil que un genérico en un form largo)
            const r = jprdSchema.safeParse(datosValidables());
            toast.error(r.success ? 'Revise los campos marcados en rojo' : r.error.issues[0].message,
                { position: 'top-center', duration: 4000 });
            return;
        }
        const ok = await confirmar({
            variant: 'warning',
            titulo:  'Confirmar solicitud JPRD',
            mensaje: `Se enviará la solicitud de constitución de JPRD del servicio "${servicio.nombre}". Recibirá un cargo de recepción en el correo registrado.`,
            detalles: [
                { label: 'Presenta como', value: rolSolicitante === 'entidad' ? 'Entidad Contratante' : 'Contratista' },
                tipoActivo ? { label: 'Tipo', value: tipoActivo.nombre } : null,
            ].filter(Boolean),
            confirmText: 'Sí, enviar',
        });
        if (ok) enviar();
    }

    function enviar() {
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('servicio_id',        servicio.id);
        fd.append('rol_solicitante',    rolSolicitante);

        // Email principal del solicitante (del portal o ingresado).
        // En modo portal, el primer email del actor solicitante es el OTP (bloqueado)
        // y el resto son adicionales agregados por el usuario.
        const emailsSolFinal = (rolSolicitante === 'entidad' ? entidad.emails : contratista.emails)
            .filter(em => em.email.trim());

        // Entidad
        const emailsEntFinal = isPortal && rolSolicitante === 'entidad'
            ? emailsSolFinal
            : entidad.emails.filter(em => em.email.trim());

        fd.append('nombre_entidad',                 entidad.nombre ?? '');
        fd.append('ruc_entidad',                    entidad.documento ?? '');
        fd.append('telefono_entidad',               entidad.telefono ?? '');
        fd.append('mesa_partes_url_entidad',        entidad.mesa_partes_url ?? '');
        fd.append('tipo_persona_entidad',           entidad.tipo_persona);
        fd.append('subtipo_entidad',                entidad.subtipo ?? '');
        fd.append('representante_entidad_dni',      entidad.representante?.dni ?? '');
        fd.append('representante_entidad_nombre',   entidad.representante?.nombre ?? '');
        fd.append('empresas_entidad',               JSON.stringify(sinKeyUI(entidad.empresas)));
        fd.append('emails_entidad',                 JSON.stringify(emailsEntFinal));

        // Contratista
        const emailsConFinal = isPortal && rolSolicitante === 'contratista'
            ? emailsSolFinal
            : contratista.emails.filter(em => em.email.trim());

        fd.append('nombre_contratista',               contratista.nombre ?? '');
        fd.append('ruc_contratista',                  contratista.documento ?? '');
        fd.append('telefono_contratista',             contratista.telefono ?? '');
        fd.append('tipo_persona_contratista',         contratista.tipo_persona);
        fd.append('subtipo_contratista',              contratista.subtipo ?? '');
        fd.append('representante_contratista_dni',    contratista.representante?.dni ?? '');
        fd.append('representante_contratista_nombre', contratista.representante?.nombre ?? '');
        fd.append('empresas_contratista',             JSON.stringify(sinKeyUI(contratista.empresas)));
        fd.append('emails_contratista',               JSON.stringify(emailsConFinal));

        fd.append('acepta_reglamento_card', aceptaReglamento ? '1' : '0');

        if (tipoDocumentoId) fd.append('tipo_documento_id', tipoDocumentoId);

        // Petición de Decisión Vinculante
        fd.append('tiene_peticion_previa', tienePeticionPrevia ? '1' : '0');
        if (tienePeticionPrevia && observacion.trim()) {
            fd.append('observacion', observacion);
        }

        // Documentos
        docSolicitudConformacion.forEach(f => fd.append('doc_solicitud_conformacion[]', f));
        docContratoObra.forEach(f => fd.append('doc_contrato_obra[]', f));
        docAdendas.forEach(f  => fd.append('doc_adendas[]', f));
        docAnexos.forEach(f   => fd.append('doc_anexos[]', f));
        if (tienePeticionPrevia) {
            docPeticionPrevia.forEach(f => fd.append('doc_peticion_previa[]', f));
        }

        if (captchaToken) fd.append('captcha_token', captchaToken);

        router.post(route('solicitud.jprd.store'), fd, {
            forceFormData: true,
            onSuccess: () => limpiarBorrador(),
            onFinish: () => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                setProcesando(false);
            },
            onError: errs => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                setProcesando(false);
                setErrores(errs);
                toast.error(Object.values(errs)[0] || 'Revise los campos', { position: 'top-center' });
            },
        });
    }

    /* ─── Selector de rol ─── */
    if (!rolSolicitante) {
        return (
            <div className="max-w-lg mx-auto">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/60">
                        <h2 className="text-base font-bold text-[#291136] uppercase tracking-wide">
                            ¿En qué calidad presentas esta solicitud?
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Selecciona el rol que cumples en esta controversia JPRD.
                        </p>
                    </div>
                    <div className="p-6 space-y-3">
                        <button type="button" onClick={() => elegirRol('entidad')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-all group text-left">
                            <div className="w-12 h-12 rounded-xl bg-[#291136]/10 flex items-center justify-center shrink-0 group-hover:bg-[#BE0F4A]/10">
                                <Building2 size={22} className="text-[#291136] group-hover:text-[#BE0F4A]"/>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#291136]">Soy la Entidad Contratante</p>
                                <p className="text-xs text-gray-500 mt-0.5">Presento la solicitud en nombre de la entidad pública o empresa contratante.</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[#BE0F4A] shrink-0"/>
                        </button>

                        <button type="button" onClick={() => elegirRol('contratista')}
                            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-all group text-left">
                            <div className="w-12 h-12 rounded-xl bg-[#291136]/10 flex items-center justify-center shrink-0 group-hover:bg-[#BE0F4A]/10">
                                <HardHat size={22} className="text-[#291136] group-hover:text-[#BE0F4A]"/>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#291136]">Soy el Contratista</p>
                                <p className="text-xs text-gray-500 mt-0.5">Presento la solicitud en calidad de contratista ejecutor de la obra.</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[#BE0F4A] shrink-0"/>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const nombreOtraParte = rolSolicitante === 'entidad' ? `'El Contratista'` : `'La Entidad Contratante'`;
    const tipoActivo = tiposDocumento.find(t => String(t.id) === tipoDocumentoId);

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />

        <form onSubmit={handleSubmit}>
            {/* Leyenda de campos obligatorios */}
            <div className="mb-5 px-4 py-3 bg-[#291136]/5 border border-[#291136]/15 rounded-xl flex items-center gap-3">
                <span className="text-[#BE0F4A] text-lg font-black leading-none">*</span>
                <p className="text-sm text-[#291136]">
                    Los campos marcados con <span className="text-[#BE0F4A] font-bold">*</span> son obligatorios.
                </p>
            </div>

            {/* Indicador de rol elegido */}
            <div className="flex items-center justify-between mb-4 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#291136]">
                    {rolSolicitante === 'entidad'
                        ? <><Building2 size={15} className="text-[#BE0F4A]"/> Presentas como: Entidad Contratante</>
                        : <><HardHat size={15} className="text-[#BE0F4A]"/> Presentas como: Contratista</>
                    }
                </div>
                <button type="button" onClick={() => setRolSolicitante(null)}
                    className="text-xs text-gray-400 hover:text-[#BE0F4A] font-semibold transition-colors">
                    Cambiar rol
                </button>
            </div>

            {/* Tipo de solicitud */}
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
                    <AlertCircle size={18} className="text-amber-500 shrink-0"/>
                    <p className="text-sm text-amber-700 font-semibold">
                        No hay tipos de documento configurados para este servicio.
                    </p>
                </div>
            )}

            {/* Mis datos (el solicitante) */}
            <BloqueActor
                titulo={rolSolicitante === 'entidad' ? 'Mis datos — Entidad Contratante' : 'Mis datos — Contratista'}
                icono={rolSolicitante === 'entidad' ? Building2 : HardHat}
                datos={rolSolicitante === 'entidad' ? entidad : contratista}
                onChange={rolSolicitante === 'entidad' ? setEntidad : setContratista}
                emailBloqueado={isPortal}
                emailFijo={portalEmail}
                subtiposPermitidos={rolSolicitante === 'entidad' ? SUBTIPOS_ENTIDAD : SUBTIPOS_CONTRATISTA}
                errors={rolSolicitante === 'entidad'
                    ? { documento: errores.ent_documento, nombre: errores.ent_nombre, subtipo: errores.ent_subtipo, empresas: errores.ent_empresas, mesa_partes: errores.ent_mesa_partes }
                    : { documento: errores.con_documento, nombre: errores.con_nombre, subtipo: errores.con_subtipo, empresas: errores.con_empresas }}
                onBlurCampo={campo => validarBlur((rolSolicitante === 'entidad' ? 'ent_' : 'con_') + campo)}
                onClearError={campo => setErrores(p => ({ ...p, [(rolSolicitante === 'entidad' ? 'ent_' : 'con_') + campo]: undefined }))}
                isSolicitante
            />

            {/* Datos de la otra parte */}
            <BloqueActor
                titulo={`Datos de ${nombreOtraParte}`}
                icono={rolSolicitante === 'entidad' ? HardHat : Building2}
                datos={rolSolicitante === 'entidad' ? contratista : entidad}
                onChange={rolSolicitante === 'entidad' ? setContratista : setEntidad}
                emailBloqueado={false}
                subtiposPermitidos={rolSolicitante === 'entidad' ? SUBTIPOS_CONTRATISTA : SUBTIPOS_ENTIDAD}
                errors={rolSolicitante === 'entidad'
                    ? { documento: errores.con_documento, nombre: errores.con_nombre, subtipo: errores.con_subtipo, empresas: errores.con_empresas }
                    : { documento: errores.ent_documento, nombre: errores.ent_nombre, subtipo: errores.ent_subtipo, empresas: errores.ent_empresas, mesa_partes: errores.ent_mesa_partes }}
                onBlurCampo={campo => validarBlur((rolSolicitante === 'entidad' ? 'con_' : 'ent_') + campo)}
                onClearError={campo => setErrores(p => ({ ...p, [(rolSolicitante === 'entidad' ? 'con_' : 'ent_') + campo]: undefined }))}
                isSolicitante={false}
            />

            {/* Documentos */}
            <Seccion icono={FileText} destacado titulo="Documentos">
                <div className="space-y-3">
                    <SeccionDoc
                        icono={FileText}
                        titulo="Solicitud de Conformación de JPRD"
                        descripcion="Documento formal de solicitud de constitución de la Junta de Prevención y Resolución de Disputas."
                        archivos={docSolicitudConformacion}
                        onChange={a => { setDocSolicitudConformacion(a); setErrores(p => ({ ...p, doc_solicitud: undefined })); }}
                        required
                        error={errores.doc_solicitud}
                    />
                    <SeccionDoc
                        icono={FileText}
                        titulo="Contrato de Obra"
                        descripcion="Contrato principal de obra materia de la controversia."
                        archivos={docContratoObra}
                        onChange={a => { setDocContratoObra(a); setErrores(p => ({ ...p, doc_contrato: undefined })); }}
                        required
                        error={errores.doc_contrato}
                    />
                    <SeccionDoc
                        icono={FileText}
                        titulo="Adendas"
                        descripcion="Adendas o modificaciones al contrato de obra (opcional)."
                        archivos={docAdendas}
                        onChange={setDocAdendas}
                        required={false}
                    />
                    <SeccionDoc
                        icono={Paperclip}
                        titulo="Anexos / Otros documentos"
                        descripcion="Documentación adicional de respaldo (opcional)."
                        archivos={docAnexos}
                        onChange={setDocAnexos}
                        required={false}
                    />
                </div>
            </Seccion>

            {/* Petición de Decisión Vinculante */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]"/>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">
                                ¿Existe previamente una Petición de Decisión Vinculante?
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">Activa esta opción si ya se presentó una petición previa</p>
                        </div>
                    </div>
                    <button type="button" role="switch" aria-checked={tienePeticionPrevia}
                        onClick={() => setTienePeticionPrevia(v => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${tienePeticionPrevia ? 'bg-[#BE0F4A]' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${tienePeticionPrevia ? 'translate-x-5' : ''}`} />
                    </button>
                </div>

                {tienePeticionPrevia && (
                    <div className="p-6 space-y-4">
                        <Campo label="Observación (opcional)">
                            <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
                                rows={3} placeholder="Agrega contexto adicional sobre la petición previa..."
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]" />
                        </Campo>

                        <SeccionDoc
                            icono={FileText}
                            titulo="Documento de Petición de Decisión Vinculante"
                            descripcion="Adjunta el documento formal de la petición previa."
                            archivos={docPeticionPrevia}
                            onChange={a => { setDocPeticionPrevia(a); setErrores(p => ({ ...p, doc_peticion: undefined })); }}
                            required
                            error={errores.doc_peticion}
                        />
                    </div>
                )}
            </div>

            <AceptacionReglamento
                checked={aceptaReglamento}
                onChange={v => { setAceptaReglamento(v); setErrores(p => ({ ...p, acepta_reglamento: undefined })); }}
                error={errores.acepta_reglamento}
                contexto="al presente procedimiento de Junta de Prevención y Resolución de Disputas (JPRD)"
                finalidad="procedimiento de JPRD"
                bulletsExtra={[
                    <>Confirmo que los <strong className="text-[#291136]">datos consignados</strong> en este formulario son verídicos y han sido validados previamente a través del correo electrónico registrado.</>,
                    <>Soy consciente de que los <strong className="text-[#291136]">datos de la otra parte</strong> aquí declarados serán utilizados para las notificaciones del proceso, asumiendo plena responsabilidad sobre su exactitud.</>,
                ]}
            />

            {hcaptchaSiteKey && (
                <div className="flex justify-center pb-2">
                    <HCaptchaWidget siteKey={hcaptchaSiteKey} onToken={setCaptchaToken} />
                </div>
            )}

            <div className="flex justify-end mt-2">
                <button type="submit" disabled={procesando || (hcaptchaSiteKey && !captchaToken)}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold bg-[#BE0F4A] text-white rounded-xl hover:bg-[#9c0a3b] disabled:opacity-50 transition-colors shadow-lg">
                    <Send size={16}/> {procesando ? 'Enviando...' : 'Enviar Solicitud JPRD'}
                </button>
            </div>
        </form>
        </>
    );
}
