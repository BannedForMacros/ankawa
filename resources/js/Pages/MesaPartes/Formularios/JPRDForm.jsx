import { useState, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Building2, HardHat, User, Paperclip, FileText, X, Send, Loader2, CheckCircle2, Lock, Unlock } from 'lucide-react';
import EmailsInput from '@/Components/EmailsInput';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';
import toast from 'react-hot-toast';

const ICONOS_EXT = { pdf: '📄', doc: '📝', docx: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' };
function ext(n) { return n.split('.').pop().toLowerCase(); }

/* ─── Sección ─── */
function Seccion({ icono: Icono, titulo, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={16} className="text-[#BE0F4A]" />
                </div>
                <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</h2>
            </div>
            <div className="p-6 space-y-4">{children}</div>
        </div>
    );
}

/* ─── Campo de texto base ─── */
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

function Input({ label, required, error, ...props }) {
    return (
        <Campo label={label} required={required} error={error}>
            <input {...props}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20" />
        </Campo>
    );
}

/* ─── Bloque con lookup RENIEC/SUNAT ─── */
function BloqueEntidad({ titulo, icono: Icono, datos, onChange, errors = {} }) {
    const [cargando,  setCargando]  = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    function onRucChange(val) {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        onChange({ ...datos, ruc: clean });
        clearTimeout(timerRef.current);
        if (clean.length === 11) {
            timerRef.current = setTimeout(() => consultarRuc(clean), 500);
        } else {
            setBloqueado(false);
        }
    }

    async function consultarRuc(ruc) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'ruc', numero: ruc } });
            onChange({ ...datos, ruc, nombre: data.nombre ?? datos.nombre });
            setBloqueado(true);
        } catch {
            toast('No se encontró el RUC. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
            setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    return (
        <Seccion icono={Icono} titulo={titulo}>
            <div className="grid grid-cols-2 gap-4">
                <Campo label="RUC" required error={errors.ruc}>
                    <div className="relative">
                        <input type="text" value={datos.ruc ?? ''} onChange={e => onRucChange(e.target.value)}
                            placeholder="20xxxxxxxxx" maxLength={11}
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] ${
                                bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                            }`} />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                            {!cargando && bloqueado && <CheckCircle2 size={14} className="text-emerald-500"/>}
                        </div>
                    </div>
                </Campo>
                <Input label="Teléfono de contacto" value={datos.telefono ?? ''} onChange={e => onChange({ ...datos, telefono: e.target.value })}
                    placeholder="01-234-5678 / 987654321" error={errors.telefono} />
            </div>
            <Campo label="Nombre / Razón social" required error={errors.nombre}>
                <input type="text" value={datos.nombre ?? ''} onChange={e => onChange({ ...datos, nombre: e.target.value })}
                    disabled={bloqueado}
                    placeholder="Nombre completo de la entidad"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] ${bloqueado ? 'border-emerald-400 bg-emerald-50 text-gray-500' : 'border-gray-200'}`} />
                {bloqueado && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700">
                        <Lock size={11}/> Verificado vía SUNAT
                        <button type="button" onClick={() => { setBloqueado(false); onChange({ ...datos, nombre: '' }); }}
                            className="ml-2 text-gray-400 hover:text-red-500"><X size={11}/></button>
                    </div>
                )}
            </Campo>
            <EmailsInput
                label="Correos para notificación"
                value={datos.emails ?? []}
                onChange={emails => onChange({ ...datos, emails })}
                required={false}
                placeholder="correo@entidad.gob.pe"
            />
        </Seccion>
    );
}

/* ─── Multi-archivo con preview ─── */
function MultiArchivo({ archivos, onChange, label }) {
    const inputRef = useRef();

    function agregar(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
        onChange([...archivos, ...nuevos]);
        e.target.value = '';
    }

    return (
        <div>
            {label && <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">{label}</label>}
            <button type="button" onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                <Paperclip size={15}/> Seleccionar archivos
            </button>
            <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={agregar} className="hidden"/>
            {archivos.length > 0 && (
                <ul className="mt-3 space-y-2">
                    {archivos.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                            <span className="text-lg shrink-0">{ICONOS_EXT[ext(f.name)] ?? '📎'}</span>
                            <span className="truncate flex-1 text-[#291136] font-medium">{f.name}</span>
                            <span className="text-xs text-gray-400 shrink-0">{(f.size/1024/1024).toFixed(2)} MB</span>
                            <button type="button" onClick={() => onChange(archivos.filter((_, j) => j !== i))}
                                className="text-gray-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─── Formulario JPRD ─── */
export default function JPRDForm({ servicio, portalEmail, portalUser }) {
    const isPortal = !!portalEmail;

    const [procesando,      setProcesando]      = useState(false);
    const [confirm,         setConfirm]         = useState(false);
    const [mostrarLoader,   setMostrarLoader]   = useState(false);
    const [errores,         setErrores]         = useState({});
    const loaderTimer                           = useRef(null);

    const [solicitante, setSolicitante] = useState({
        nombre:         portalUser?.name ?? '',
        tipo_documento: 'dni',
        documento:      portalUser?.numero_documento ?? '',
        emails:         portalEmail ? [{ email: portalEmail, label: '' }] : [{ email: '', label: '' }],
    });

    const [entidad, setEntidad] = useState({
        nombre: '', ruc: '', telefono: '', emails: [],
    });

    const [contratista, setContratista] = useState({
        nombre: '', ruc: '', telefono: '', emails: [],
    });

    const [descripcion,   setDescripcion]   = useState('');
    const [observacion,   setObservacion]   = useState('');
    const [archivos,      setArchivos]      = useState([]);

    function validar() {
        const errs = {};
        if (!solicitante.nombre.trim())    errs.sol_nombre    = 'Requerido';
        if (!solicitante.documento.trim()) errs.sol_documento = 'Requerido';
        if (!solicitante.emails.some(e => e.email.trim())) errs.sol_email = 'Ingresa al menos un correo';
        if (!entidad.nombre.trim())        errs.ent_nombre    = 'Requerido';
        if (!entidad.ruc.trim())           errs.ent_ruc       = 'Requerido';
        if (!contratista.nombre.trim())    errs.con_nombre    = 'Requerido';
        if (!contratista.ruc.trim())       errs.con_ruc       = 'Requerido';
        if (!descripcion.trim())           errs.descripcion   = 'Requerido';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validar();
        if (Object.keys(errs).length) {
            setErrores(errs);
            toast.error('Completa los campos obligatorios', { position: 'top-center' });
            return;
        }
        setConfirm(true);
    }

    function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('servicio_id',                   servicio.id);
        fd.append('nombre_solicitante',            solicitante.nombre);
        fd.append('tipo_documento_solicitante',    solicitante.tipo_documento);
        fd.append('documento_solicitante',         solicitante.documento);
        fd.append('emails_solicitante',            JSON.stringify(solicitante.emails.filter(e => e.email.trim())));
        fd.append('nombre_entidad',                entidad.nombre);
        fd.append('ruc_entidad',                   entidad.ruc);
        fd.append('telefono_entidad',              entidad.telefono ?? '');
        fd.append('emails_entidad',                JSON.stringify(entidad.emails.filter(e => e.email.trim())));
        fd.append('nombre_contratista',            contratista.nombre);
        fd.append('ruc_contratista',               contratista.ruc);
        fd.append('telefono_contratista',          contratista.telefono ?? '');
        fd.append('emails_contratista',            JSON.stringify(contratista.emails.filter(e => e.email.trim())));
        fd.append('descripcion',                   descripcion);
        if (observacion.trim()) fd.append('observacion', observacion);
        archivos.forEach(f => fd.append('documentos[]', f));

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

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar solicitud JPRD"
            resumen={`Se enviará la solicitud de conformación de JPRD del servicio "${servicio.nombre}". Se enviará un cargo de recepción al correo del solicitante.`}
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />

        <form onSubmit={handleSubmit}>

            {/* Solicitante */}
            <Seccion icono={User} titulo="Datos del Solicitante">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <Campo label="Tipo de documento" required>
                            <select value={solicitante.tipo_documento}
                                onChange={e => setSolicitante(s => ({ ...s, tipo_documento: e.target.value }))}
                                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]">
                                <option value="dni">DNI</option>
                                <option value="ruc">RUC</option>
                                <option value="ce">C.E.</option>
                            </select>
                        </Campo>
                    </div>
                    <div>
                        <Input label="N° Documento" required
                            value={solicitante.documento}
                            onChange={e => setSolicitante(s => ({ ...s, documento: e.target.value.replace(/\D/g, '') }))}
                            placeholder="12345678"
                            error={errores.sol_documento} />
                    </div>
                    <div>
                        {/* placeholder col */}
                    </div>
                </div>
                <Input label="Nombre completo / Razón Social" required
                    value={solicitante.nombre}
                    onChange={e => setSolicitante(s => ({ ...s, nombre: e.target.value }))}
                    placeholder="Nombre del solicitante o empresa"
                    error={errores.sol_nombre} />
                {isPortal ? (
                    <div>
                        <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                            Correo del solicitante <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-3 py-2.5 text-sm text-emerald-800 font-medium">
                            {portalEmail}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP</p>
                    </div>
                ) : (
                    <EmailsInput
                        label="Correos del solicitante"
                        value={solicitante.emails}
                        onChange={emails => setSolicitante(s => ({ ...s, emails }))}
                        required
                        placeholder="correo@ejemplo.com"
                        error={errores.sol_email}
                    />
                )}
            </Seccion>

            {/* Entidad */}
            <BloqueEntidad
                titulo="Datos de la Entidad"
                icono={Building2}
                datos={entidad}
                onChange={setEntidad}
                errors={{ nombre: errores.ent_nombre, ruc: errores.ent_ruc }}
            />

            {/* Contratista */}
            <BloqueEntidad
                titulo="Datos del Contratista"
                icono={HardHat}
                datos={contratista}
                onChange={setContratista}
                errors={{ nombre: errores.con_nombre, ruc: errores.con_ruc }}
            />

            {/* Descripción */}
            <Seccion icono={FileText} titulo="Descripción de la controversia">
                <Campo label="Descripción" required error={errores.descripcion}>
                    <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                        rows={4} placeholder="Describa brevemente la controversia..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]" />
                </Campo>
                <Campo label="Observación (opcional)">
                    <textarea value={observacion} onChange={e => setObservacion(e.target.value)}
                        rows={2} placeholder="Alguna observación adicional..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]" />
                </Campo>
            </Seccion>

            {/* Documentos */}
            <Seccion icono={Paperclip} titulo="Documentos adjuntos">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-2">
                    Adjunte: solicitud de conformación de JPRD, contrato de obra, y demás documentos de respaldo.
                </div>
                <MultiArchivo archivos={archivos} onChange={setArchivos} />
            </Seccion>

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
