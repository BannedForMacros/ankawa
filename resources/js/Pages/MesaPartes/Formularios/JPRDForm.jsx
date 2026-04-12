import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    Building2, HardHat, User, Paperclip, FileText, X, Send,
    Loader2, CheckCircle2, Lock, ChevronRight, AlertCircle, Plus, Trash2
} from 'lucide-react';
import EmailsInput from '@/Components/EmailsInput';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';
import toast from 'react-hot-toast';

/* ─── Constantes ─── */
const TIPOS_PERSONA = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Jurídica' },
];
const SUBTIPOS_JURIDICA = [
    { id: 'empresa',         nombre: 'Empresa'          },
    { id: 'consorcio',       nombre: 'Consorcio'        },
    { id: 'entidad_publica', nombre: 'Entidad Pública'  },
];

/* ─── Sección visual ─── */
function Seccion({ icono: Icono, titulo, children, accent = false }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className={`flex items-center gap-3 px-6 py-4 border-b border-gray-100 ${accent ? 'bg-[#291136]/5' : 'bg-gray-50/60'}`}>
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={16} className="text-[#BE0F4A]" />
                </div>
                <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</h2>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </div>
    );
}

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

/* ─── Lookup RUC vía SUNAT ─── */
// onResuelto(ruc, nombre) → actualiza ambos campos juntos en el parent para evitar stale closure
function CampoRuc({ value, onResuelto, error, disabled }) {
    const [cargando,  setCargando]  = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function handleChange(val) {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        onResuelto(clean, bloqueado ? '' : null); // null = no tocar nombre todavía
        setBloqueado(false);
        clearTimeout(timerRef.current);
        if (clean.length === 11) {
            timerRef.current = setTimeout(() => consultar(clean), 500);
        }
    }

    async function consultar(ruc) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'ruc', numero: ruc } });
            onResuelto(ruc, data.nombre ?? ''); // un solo callback → sin stale
            setBloqueado(true);
        } catch {
            toast('RUC no encontrado en SUNAT. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onResuelto('', '');
    }

    return (
        <div>
            <div className="relative">
                <input type="text" value={value} onChange={e => handleChange(e.target.value)}
                    disabled={disabled}
                    placeholder="20xxxxxxxxx" maxLength={11}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 ${
                        bloqueado ? 'border-emerald-400 bg-emerald-50' : error ? 'border-red-300' : 'border-gray-200'
                    } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`} />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                    {!cargando && bloqueado && (
                        <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
                    )}
                    {!cargando && !bloqueado && value.length === 11 && (
                        <CheckCircle2 size={14} className="text-emerald-500"/>
                    )}
                </div>
            </div>
            {bloqueado && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> Verificado vía SUNAT</p>
            )}
        </div>
    );
}

/* ─── Lookup DNI vía RENIEC ─── */
// onResuelto(dni, nombre) → mismo patrón que CampoRuc
function CampoDni({ value, onResuelto, error, disabled }) {
    const [cargando,  setCargando]  = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function handleChange(val) {
        const clean = val.replace(/\D/g, '').slice(0, 8);
        onResuelto(clean, bloqueado ? '' : null);
        setBloqueado(false);
        clearTimeout(timerRef.current);
        if (clean.length === 8) {
            timerRef.current = setTimeout(() => consultar(clean), 500);
        }
    }

    async function consultar(dni) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'dni', numero: dni } });
            onResuelto(dni, data.nombre ?? '');
            setBloqueado(true);
        } catch {
            toast('DNI no encontrado en RENIEC. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onResuelto('', '');
    }

    return (
        <div>
            <div className="relative">
                <input type="text" value={value} onChange={e => handleChange(e.target.value)}
                    disabled={disabled}
                    placeholder="12345678" maxLength={8}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 ${
                        bloqueado ? 'border-emerald-400 bg-emerald-50' : error ? 'border-red-300' : 'border-gray-200'
                    } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`} />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                    {!cargando && bloqueado && (
                        <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>
                    )}
                    {!cargando && !bloqueado && value.length === 8 && (
                        <CheckCircle2 size={14} className="text-emerald-500"/>
                    )}
                </div>
            </div>
            {bloqueado && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> Verificado vía RENIEC</p>
            )}
        </div>
    );
}

/* ─── Representante legal (DNI lookup) ─── */
// onResuelto(dni, nombre) — callback único para evitar stale closure
function BloqueRepresentante({ dni, nombre, onResuelto, label = 'Representante Legal' }) {
    const [cargando, setCargando]   = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function handleDni(val) {
        const clean = val.replace(/\D/g, '').slice(0, 8);
        if (bloqueado && clean !== dni) { setBloqueado(false); onResuelto(clean, ''); return; }
        onResuelto(clean, null); // null = no cambiar nombre todavía
        clearTimeout(timerRef.current);
        if (clean.length === 8) timerRef.current = setTimeout(() => buscar(clean), 500);
    }

    async function buscar(d) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'dni', numero: d } });
            onResuelto(d, data.nombre ?? '');
            setBloqueado(true);
        } catch {
            toast('DNI no encontrado. Complete el nombre manualmente.', { icon: 'ℹ️', duration: 3000 });
            setBloqueado(false);
        } finally { setCargando(false); }
    }

    return (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    DNI del {label} <span className="text-[#BE0F4A]">*</span>
                </label>
                <div className="relative">
                    <input type="text" value={dni} onChange={e => handleDni(e.target.value)}
                        maxLength={8} placeholder="12345678"
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 ${
                            bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado && (
                            <button type="button" onClick={() => { setBloqueado(false); onResuelto('', ''); }}>
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
    const [cargando,  setCargando]  = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function handleRuc(val) {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        if (bloqueado && clean !== empresa.ruc) {
            setBloqueado(false);
            onUpdate({ ruc: clean, nombre: '' });
            return;
        }
        onUpdate({ ...empresa, ruc: clean });
        clearTimeout(timerRef.current);
        if (clean.length === 11) {
            timerRef.current = setTimeout(() => buscar(clean), 500);
        }
    }

    async function buscar(ruc) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'ruc', numero: ruc } });
            // onUpdate recibe el objeto completo → no depende de empresa del closure
            onUpdate({ ruc, nombre: data.nombre ?? '' });
            setBloqueado(true);
        } catch {
            toast('RUC no encontrado. Complete manualmente.', { icon: 'ℹ️', duration: 2500 });
            setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onUpdate({ ruc: '', nombre: '' });
    }

    return (
        <div className="grid grid-cols-5 gap-2 items-end bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="col-span-2">
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
            <div className="col-span-2">
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
function EmpresasConsorcio({ empresas, onChange, error }) {
    function agregar() { onChange([...empresas, { ruc: '', nombre: '' }]); }

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
                    key={i}
                    empresa={emp}
                    onUpdate={nuevaEmp => onChange(empresas.map((e, j) => j === i ? nuevaEmp : e))}
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
}) {
    function set(campo, val) { onChange({ ...datos, [campo]: val }); }
    function setRep(campo, val) { onChange({ ...datos, representante: { ...datos.representante, [campo]: val } }); }

    const esNatural  = datos.tipo_persona === 'natural';
    const esJuridica = datos.tipo_persona === 'juridica';
    const esConsorcio = datos.subtipo === 'consorcio';

    return (
        <Seccion icono={Icono} titulo={titulo} accent={isSolicitante}>
            {isSolicitante && (
                <div className="flex items-center gap-2 bg-[#291136]/5 border border-[#291136]/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-[#291136] mb-2">
                    <CheckCircle2 size={14} className="text-[#BE0F4A]"/>
                    Estos son tus datos como solicitante
                </div>
            )}

            {/* Tipo de persona */}
            <div className="grid grid-cols-2 gap-4">
                <Campo label="Tipo de persona" required>
                    <select value={datos.tipo_persona}
                        onChange={e => onChange({ ...datos, tipo_persona: e.target.value, subtipo: '', documento: '', nombre: '', representante: { dni: '', nombre: '' }, empresas: [] })}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]">
                        {TIPOS_PERSONA.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                </Campo>

                {esJuridica && (
                    <Campo label="Tipo de entidad jurídica" required error={errors.subtipo}>
                        <select value={datos.subtipo}
                            onChange={e => onChange({ ...datos, subtipo: e.target.value, empresas: e.target.value === 'consorcio' ? [{ ruc: '', nombre: '' }] : [] })}
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] ${errors.subtipo ? 'border-red-300' : 'border-gray-200'}`}>
                            <option value="">Selecciona...</option>
                            {SUBTIPOS_JURIDICA.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                    </Campo>
                )}
            </div>

            {/* Documento y nombre */}
            {esNatural ? (
                <div className="grid grid-cols-2 gap-4">
                    <Campo label="DNI" required error={errors.documento}>
                        <CampoDni
                            value={datos.documento ?? ''}
                            onResuelto={(doc, nom) => onChange({ ...datos, documento: doc, ...(nom !== null && { nombre: nom }) })}
                            error={errors.documento}
                        />
                    </Campo>
                    <Campo label="Nombre completo" required error={errors.nombre}>
                        <InputBase value={datos.nombre ?? ''} onChange={e => set('nombre', e.target.value)}
                            placeholder="Nombre del solicitante" error={errors.nombre} />
                    </Campo>
                </div>
            ) : (
                <>
                    {!esConsorcio ? (
                        <div className="grid grid-cols-2 gap-4">
                            <Campo label="RUC" required error={errors.documento}>
                                <CampoRuc
                                    value={datos.documento ?? ''}
                                    onResuelto={(doc, nom) => onChange({ ...datos, documento: doc, ...(nom !== null && { nombre: nom }) })}
                                    error={errors.documento}
                                />
                            </Campo>
                            <Campo label="Razón Social" required error={errors.nombre}>
                                <InputBase value={datos.nombre ?? ''} onChange={e => set('nombre', e.target.value)}
                                    placeholder="Nombre / Razón Social" error={errors.nombre} />
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
                </>
            )}

            {/* Teléfono */}
            <Campo label="Teléfono de contacto">
                <InputBase value={datos.telefono ?? ''} onChange={e => set('telefono', e.target.value)}
                    placeholder="01-234-5678 / 987654321" />
            </Campo>

            {/* Email */}
            {emailBloqueado ? (
                <div>
                    <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                        Correo principal <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-3 py-2.5 text-sm text-emerald-800 font-medium">
                        <Lock size={13}/> {emailFijo}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no editable</p>
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
    const inputRef = useRef();

    function agregar(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
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
                <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={agregar} className="hidden"/>
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
function actorVacio(emailFijo = null) {
    return {
        tipo_persona: 'juridica',
        subtipo: '',
        documento: '',
        nombre: '',
        telefono: '',
        emails: emailFijo ? [{ email: emailFijo, label: '' }] : [{ email: '', label: '' }],
        representante: { dni: '', nombre: '' },
        empresas: [],
    };
}

/* ─── Formulario JPRD ─── */
export default function JPRDForm({ servicio, portalEmail, portalUser }) {
    const isPortal = !!portalEmail;

    const [procesando,    setProcesando]    = useState(false);
    const [confirm,       setConfirm]       = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [errores,       setErrores]       = useState({});
    const loaderTimer                       = useRef(null);

    // Paso 1: selección de rol
    const [rolSolicitante, setRolSolicitante] = useState(null); // 'entidad' | 'contratista'

    // Solo pre-llena el correo del portal (el autenticador es el email OTP)
    function datosDesdePortal() {
        return actorVacio(portalEmail);
    }

    const [entidad,     setEntidad]     = useState(actorVacio());
    const [contratista, setContratista] = useState(actorVacio());

    // Cuando el usuario elige rol, pre-llena sus datos
    function elegirRol(rol) {
        setRolSolicitante(rol);
        const datosMios = datosDesdePortal();
        if (rol === 'entidad') {
            setEntidad(datosMios);
            setContratista(actorVacio());
        } else {
            setContratista(datosMios);
            setEntidad(actorVacio());
        }
        setErrores({});
    }

    const [descripcion, setDescripcion] = useState('');
    const [observacion, setObservacion] = useState('');

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

    function validar() {
        const e = {};
        if (!rolSolicitante) { e.rol = 'Debes seleccionar tu rol'; return e; }

        // ── Entidad ──
        const entConsorcio = entidad.tipo_persona === 'juridica' && entidad.subtipo === 'consorcio';
        if (entidad.tipo_persona === 'juridica' && !entidad.subtipo) {
            e.ent_subtipo = 'Selecciona el tipo de entidad jurídica';
        }
        if (!entConsorcio) {
            if (!(entidad.nombre ?? '').trim())    e.ent_nombre    = 'Requerido';
            if (!(entidad.documento ?? '').trim()) e.ent_documento = 'Requerido';
        } else {
            if ((entidad.empresas ?? []).length === 0) e.ent_empresas = 'Agrega al menos una empresa del consorcio';
        }

        // ── Contratista ──
        const conConsorcio = contratista.tipo_persona === 'juridica' && contratista.subtipo === 'consorcio';
        if (contratista.tipo_persona === 'juridica' && !contratista.subtipo) {
            e.con_subtipo = 'Selecciona el tipo de entidad jurídica';
        }
        if (!conConsorcio) {
            if (!(contratista.nombre ?? '').trim())    e.con_nombre    = 'Requerido';
            if (!(contratista.documento ?? '').trim()) e.con_documento = 'Requerido';
        } else {
            if ((contratista.empresas ?? []).length === 0) e.con_empresas = 'Agrega al menos una empresa del consorcio';
        }

        // ── Email del solicitante (solo si no es portal) ──
        const emailsSol = rolSolicitante === 'entidad' ? entidad.emails : contratista.emails;
        if (!isPortal && !(emailsSol ?? []).some(em => em.email?.trim())) {
            e.sol_email = 'Ingresa al menos un correo';
        }

        if (!(descripcion ?? '').trim())           e.descripcion  = 'Requerido';
        if (docSolicitudConformacion.length === 0)  e.doc_solicitud = 'Adjunta la solicitud de conformación de JPRD';
        if (docContratoObra.length === 0)            e.doc_contrato  = 'Adjunta el contrato de obra';
        return e;
    }

    function handleSubmit(e) {
        e.preventDefault();
        try {
            const errs = validar();
            if (Object.keys(errs).length) {
                setErrores(errs);
                // Mensaje descriptivo indicando qué falta
                const primero = Object.values(errs)[0];
                toast.error(primero, { position: 'top-center', duration: 4000 });
                return;
            }
            setConfirm(true);
        } catch (err) {
            console.error('Error al validar formulario JPRD:', err);
            toast.error('Error inesperado. Revisa la consola.', { position: 'top-center' });
        }
    }

    function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('servicio_id',        servicio.id);
        fd.append('rol_solicitante',    rolSolicitante);

        // Email principal del solicitante (del portal o ingresado)
        const emailsSolFinal = isPortal
            ? [{ email: portalEmail, label: '' }]
            : (rolSolicitante === 'entidad' ? entidad.emails : contratista.emails).filter(em => em.email.trim());

        // Entidad
        const emailsEntFinal = isPortal && rolSolicitante === 'entidad'
            ? emailsSolFinal
            : entidad.emails.filter(em => em.email.trim());

        fd.append('nombre_entidad',                 entidad.nombre ?? '');
        fd.append('ruc_entidad',                    entidad.documento ?? '');
        fd.append('telefono_entidad',               entidad.telefono ?? '');
        fd.append('tipo_persona_entidad',           entidad.tipo_persona);
        fd.append('subtipo_entidad',                entidad.subtipo ?? '');
        fd.append('representante_entidad_dni',      entidad.representante?.dni ?? '');
        fd.append('representante_entidad_nombre',   entidad.representante?.nombre ?? '');
        fd.append('empresas_entidad',               JSON.stringify(entidad.empresas ?? []));
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
        fd.append('empresas_contratista',             JSON.stringify(contratista.empresas ?? []));
        fd.append('emails_contratista',               JSON.stringify(emailsConFinal));

        if (tipoDocumentoId) fd.append('tipo_documento_id', tipoDocumentoId);
        fd.append('descripcion',  descripcion);
        if (observacion.trim()) fd.append('observacion', observacion);

        // Documentos
        docSolicitudConformacion.forEach(f => fd.append('doc_solicitud_conformacion[]', f));
        docContratoObra.forEach(f => fd.append('doc_contrato_obra[]', f));
        docAdendas.forEach(f  => fd.append('doc_adendas[]', f));
        docAnexos.forEach(f   => fd.append('doc_anexos[]', f));

        router.post(route('solicitud.jprd.store'), fd, {
            forceFormData: true,
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

    const nombreOtraParte = rolSolicitante === 'entidad' ? 'el Contratista' : 'la Entidad Contratante';

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar solicitud JPRD"
            resumen={`Se enviará la solicitud de constitución de JPRD del servicio "${servicio.nombre}". Se enviará un cargo de recepción al correo registrado.`}
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />

        <form onSubmit={handleSubmit}>
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
                        <select value={tipoDocumentoId} onChange={e => setTipoDocumentoId(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]">
                            <option value="">Seleccionar tipo...</option>
                            {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                        </select>
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
                errors={rolSolicitante === 'entidad'
                    ? { documento: errores.ent_documento, nombre: errores.ent_nombre, subtipo: errores.ent_subtipo, empresas: errores.ent_empresas }
                    : { documento: errores.con_documento, nombre: errores.con_nombre, subtipo: errores.con_subtipo, empresas: errores.con_empresas }}
                isSolicitante
            />

            {/* Datos de la otra parte */}
            <BloqueActor
                titulo={`Datos de ${nombreOtraParte}`}
                icono={rolSolicitante === 'entidad' ? HardHat : Building2}
                datos={rolSolicitante === 'entidad' ? contratista : entidad}
                onChange={rolSolicitante === 'entidad' ? setContratista : setEntidad}
                emailBloqueado={false}
                errors={rolSolicitante === 'entidad'
                    ? { documento: errores.con_documento, nombre: errores.con_nombre, subtipo: errores.con_subtipo, empresas: errores.con_empresas }
                    : { documento: errores.ent_documento, nombre: errores.ent_nombre, subtipo: errores.ent_subtipo, empresas: errores.ent_empresas }}
                isSolicitante={false}
            />

            {/* Descripción */}
            <Seccion icono={FileText} titulo="Descripción de la controversia">
                <Campo label="Descripción" required error={errores.descripcion}>
                    <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                        rows={4} placeholder="Describa brevemente la controversia..."
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] ${errores.descripcion ? 'border-red-300' : 'border-gray-200'}`} />
                </Campo>
                <Campo label="Observación (opcional)">
                    <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
                        rows={2} placeholder="Alguna observación adicional..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]" />
                </Campo>
            </Seccion>

            {/* Documentos */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                    <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                        <Paperclip size={16} className="text-[#BE0F4A]"/>
                    </div>
                    <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Documentos</h2>
                </div>
                <div className="p-6 space-y-3">
                    <SeccionDoc
                        icono={FileText}
                        titulo="Solicitud de Conformación de JPRD"
                        descripcion="Documento formal de solicitud de constitución de la Junta de Prevención y Resolución de Disputas."
                        archivos={docSolicitudConformacion}
                        onChange={setDocSolicitudConformacion}
                        required
                        error={errores.doc_solicitud}
                    />
                    <SeccionDoc
                        icono={FileText}
                        titulo="Contrato de Obra"
                        descripcion="Contrato principal de obra materia de la controversia."
                        archivos={docContratoObra}
                        onChange={setDocContratoObra}
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
            </div>

            <div className="flex justify-end mt-2">
                <button type="submit" disabled={procesando}
                    className="inline-flex items-center gap-2 px-8 py-3 text-sm font-bold bg-[#BE0F4A] text-white rounded-xl hover:bg-[#9c0a3b] disabled:opacity-50 transition-colors shadow-lg">
                    <Send size={16}/> {procesando ? 'Enviando...' : 'Enviar Solicitud JPRD'}
                </button>
            </div>
        </form>
        </>
    );
}
