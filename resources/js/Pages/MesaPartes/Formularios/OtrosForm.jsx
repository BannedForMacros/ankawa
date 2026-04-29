import { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    Paperclip, Send, FileText, X, User, Building2,
    CreditCard, Loader2, CheckCircle2, Lock, Unlock, AlertCircle
} from 'lucide-react';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';
import AceptacionReglamento from '@/Components/AceptacionReglamento';
import toast from 'react-hot-toast';

/* ─── Utilitario de extensión ─── */
const ICONOS_EXT = { pdf: '📄', doc: '📝', docx: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' };
function ext(nombre) { return nombre.split('.').pop().toLowerCase(); }

/* ─── Sub-componentes de layout ─── */
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
            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 transition-colors ${
                error ? 'border-red-300' : 'border-gray-200'
            } ${className}`}
        />
    );
}

/* ─── Campo documento con lookup API ─── */
function CampoDocumento({ tipo, value, onResuelto, error, disabled }) {
    const [cargando,  setCargando]  = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    const maxLen = tipo === 'ruc' ? 11 : tipo === 'dni' ? 8 : null;

    useEffect(() => {
        // Resetear estado cuando cambia el tipo de documento
        setBloqueado(false);
        clearTimeout(timerRef.current);
    }, [tipo]);

    function handleChange(val) {
        const clean = maxLen
            ? val.replace(/\D/g, '').slice(0, maxLen)
            : val.slice(0, 20);

        if (bloqueado) {
            setBloqueado(false);
            onResuelto(clean, '');
            return;
        }
        onResuelto(clean, null); // null = no cambiar nombre todavía
        clearTimeout(timerRef.current);

        const necesitaLookup = (tipo === 'ruc' && clean.length === 11) || (tipo === 'dni' && clean.length === 8);
        if (necesitaLookup) {
            timerRef.current = setTimeout(() => consultar(clean), 500);
        }
    }

    async function consultar(numero) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo, numero } });
            onResuelto(numero, data.nombre ?? '');
            setBloqueado(true);
        } catch {
            const label = tipo === 'ruc' ? 'RUC no encontrado en SUNAT' : 'DNI no encontrado en RENIEC';
            toast(label + '. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onResuelto('', '');
    }

    const placeholder = tipo === 'ruc' ? '20xxxxxxxxx' : tipo === 'dni' ? '12345678' : 'N° de documento';

    return (
        <div>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={e => handleChange(e.target.value)}
                    disabled={disabled}
                    placeholder={placeholder}
                    maxLength={maxLen ?? 20}
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 transition-colors ${
                        bloqueado ? 'border-emerald-400 bg-emerald-50' : error ? 'border-red-300' : 'border-gray-200'
                    } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {cargando && <Loader2 size={14} className="animate-spin text-gray-400" />}
                    {!cargando && bloqueado && (
                        <button type="button" onClick={limpiar}>
                            <X size={13} className="text-gray-400 hover:text-red-500" />
                        </button>
                    )}
                    {!cargando && !bloqueado && value && maxLen && value.length === maxLen && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                    )}
                </div>
            </div>
            {bloqueado && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <Lock size={10} />
                    {tipo === 'ruc' ? 'Verificado vía SUNAT' : 'Verificado vía RENIEC'}
                </p>
            )}
        </div>
    );
}

/* ─── Formulario principal ─── */
export default function OtrosForm({ servicio, portalEmail }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const isPortal = !!portalEmail;

    /* ── Tipos de documento del servicio ── */
    const [tiposDocumento, setTiposDocumento] = useState([]);
    const [cargandoTipos,  setCargandoTipos]  = useState(true);

    /* ── Estado del formulario ── */
    const [form, setForm] = useState({
        tipo_persona:          'natural',
        tipo_doc_identidad:    'dni',
        numero_doc_identidad:  '',
        nombre_remitente:      '',
        email_remitente:       portalEmail ?? '',
        tipo_documento_id:     '',
        descripcion:           '',
        observacion:           '',
    });

    /* ── Nombre bloqueado por API ── */
    const [nombreBloqueado, setNombreBloqueado] = useState(false);

    /* ── Archivos adjuntos ── */
    const [archivos, setArchivos] = useState([]);

    /* ── Aceptación reglamento ── */
    const [aceptaReglamento, setAceptaReglamento] = useState(false);

    /* ── UI ── */
    const [procesando,    setProcesando]    = useState(false);
    const [errores,       setErrores]       = useState({});
    const [confirm,       setConfirm]       = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const loaderTimer = useRef(null);
    const inputRef    = useRef();

    /* ── Cargar tipos de documento del servicio ── */
    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(data => {
                setTiposDocumento(data);
                if (data.length === 1) {
                    setForm(prev => ({ ...prev, tipo_documento_id: String(data[0].id) }));
                }
                setCargandoTipos(false);
            })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    /* ── Cuando cambia tipo_persona: resetear tipo_doc_identidad y número ── */
    function cambiarTipoPersona(tipo) {
        setForm(prev => ({
            ...prev,
            tipo_persona:         tipo,
            tipo_doc_identidad:   tipo === 'juridica' ? 'ruc' : 'dni',
            numero_doc_identidad: '',
            nombre_remitente:     '',
        }));
        setNombreBloqueado(false);
    }

    /* ── Callback de lookup de documento ── */
    function onDocumentoResuelto(numero, nombre) {
        setForm(prev => ({
            ...prev,
            numero_doc_identidad: numero,
            ...(nombre !== null ? { nombre_remitente: nombre } : {}),
        }));
        if (nombre !== null && nombre !== '') {
            setNombreBloqueado(true);
        } else if (nombre === '') {
            setNombreBloqueado(false);
        }
    }

    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrores(prev => ({ ...prev, [field]: undefined }));
    }

    function agregarArchivos(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
        setArchivos(prev => [...prev, ...nuevos]);
        e.target.value = '';
    }

    function quitarArchivo(i) {
        setArchivos(prev => prev.filter((_, idx) => idx !== i));
    }

    function validar() {
        const errs = {};
        if (!form.numero_doc_identidad.trim()) errs.numero_doc_identidad = 'Requerido';
        if (!form.nombre_remitente.trim())     errs.nombre_remitente     = 'Requerido';
        if (!form.email_remitente.trim())      errs.email_remitente      = 'Requerido';
        if (tiposDocumento.length > 1 && !form.tipo_documento_id) {
            errs.tipo_documento_id = 'Selecciona un tipo';
        }
        if (tiposDocumento.length === 0 && !cargandoTipos) {
            errs.tipo_documento_id = 'No hay tipos de documento configurados para este servicio';
        }
        if (!form.descripcion.trim()) errs.descripcion = 'Requerido';
        if (!aceptaReglamento) errs.acepta_reglamento = 'Debes aceptar la declaración para enviar la solicitud';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validar();
        if (Object.keys(errs).length) { setErrores(errs); return; }
        setConfirm(true);
    }

    function confirmar() {
        setConfirm(false);
        setProcesando(true);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('servicio_id',          servicio.id);
        fd.append('tipo_persona',         form.tipo_persona);
        fd.append('tipo_doc_identidad',   form.tipo_doc_identidad);
        fd.append('numero_doc_identidad', form.numero_doc_identidad);
        fd.append('nombre_remitente',     form.nombre_remitente);
        fd.append('email_remitente',      form.email_remitente);
        fd.append('tipo_documento_id',    form.tipo_documento_id);
        fd.append('descripcion',          form.descripcion);
        if (form.observacion.trim()) fd.append('observacion', form.observacion);
        fd.append('acepta_reglamento_card', aceptaReglamento ? '1' : '0');
        archivos.forEach(f => fd.append('documentos[]', f));

        router.post(route('solicitud.otros.store'), fd, {
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

    /* ── Resumen para modal de confirmación ── */
    const tipoActivo = tiposDocumento.find(t => String(t.id) === form.tipo_documento_id);
    const resumenConfirm = `Enviará${tipoActivo ? ' un "' + tipoActivo.nombre + '"' : ''} de parte de ${form.nombre_remitente || '—'}. Se enviará un cargo de recepción a ${form.email_remitente}.${archivos.length ? ` Adjuntos: ${archivos.length} archivo(s).` : ''}`;

    /* ── Opciones de tipo de documento según persona ── */
    const opcionesDoc = form.tipo_persona === 'juridica'
        ? [{ id: 'ruc', label: 'RUC' }]
        : [{ id: 'dni', label: 'DNI' }, { id: 'ce', label: 'Carnet de Extranjería' }];

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar envío"
            resumen={resumenConfirm}
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />

        <form onSubmit={handleSubmit}>

            {/* Leyenda de campos obligatorios */}
            <div className="mb-5 px-4 py-3 bg-[#291136]/5 border border-[#291136]/15 rounded-xl flex items-center gap-3">
                <span className="text-[#BE0F4A] text-lg font-black leading-none">*</span>
                <p className="text-sm text-[#291136]">
                    Los campos marcados con <span className="text-[#BE0F4A] font-bold">*</span> son obligatorios.
                </p>
            </div>

            {/* ── Tipo de solicitud ── */}
            {cargandoTipos ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3 mb-3"/>
                    <div className="h-9 bg-gray-100 animate-pulse rounded-xl"/>
                </div>
            ) : tiposDocumento.length === 0 ? (
                <div className="flex items-center gap-3 p-4 mb-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertCircle size={18} className="text-amber-500 shrink-0"/>
                    <p className="text-sm text-amber-700 font-semibold">
                        No hay tipos de documento configurados para este servicio.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]" />
                        </div>
                        <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">
                            Tipo de documento {tiposDocumento.length > 1 && <span className="text-[#BE0F4A]">*</span>}
                        </h2>
                    </div>
                    <div className="px-6 py-4">
                        {tiposDocumento.length === 1 ? (
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#291136]/10 text-[#291136]">
                                    {tiposDocumento[0].nombre}
                                </span>
                            </div>
                        ) : (
                            <>
                            <select
                                value={form.tipo_documento_id}
                                onChange={e => set('tipo_documento_id', e.target.value)}
                                className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 ${
                                    errores.tipo_documento_id ? 'border-red-300' : 'border-gray-200'
                                }`}
                            >
                                <option value="">Seleccionar tipo de documento...</option>
                                {tiposDocumento.map(td => (
                                    <option key={td.id} value={td.id}>{td.nombre}</option>
                                ))}
                            </select>
                            {errores.tipo_documento_id && (
                                <p className="text-xs text-red-500 mt-1">{errores.tipo_documento_id}</p>
                            )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Identificación del remitente ── */}
            <Seccion icono={isPortal || form.tipo_persona === 'juridica' ? Building2 : User} titulo="Identificación del remitente">

                {/* Toggle persona natural / jurídica */}
                <Campo label="Tipo de persona" required>
                    <div className="flex gap-2">
                        {[
                            { id: 'natural',  icono: User,      label: 'Persona Natural'   },
                            { id: 'juridica', icono: Building2, label: 'Persona Jurídica' },
                        ].map(({ id, icono: Icono, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => cambiarTipoPersona(id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                                    form.tipo_persona === id
                                        ? 'border-[#BE0F4A] bg-[#BE0F4A]/10 text-[#BE0F4A]'
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            >
                                <Icono size={15} />
                                {label}
                            </button>
                        ))}
                    </div>
                </Campo>

                {/* Tipo de documento de identidad */}
                {form.tipo_persona === 'natural' && (
                    <Campo label="Tipo de documento" required>
                        <div className="flex gap-2">
                            {opcionesDoc.map(({ id, label }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => {
                                        setForm(prev => ({
                                            ...prev,
                                            tipo_doc_identidad:   id,
                                            numero_doc_identidad: '',
                                            nombre_remitente:     '',
                                        }));
                                        setNombreBloqueado(false);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                                        form.tipo_doc_identidad === id
                                            ? 'border-[#BE0F4A] bg-[#BE0F4A]/10 text-[#BE0F4A]'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Campo>
                )}

                {/* Número de documento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Campo
                        label={form.tipo_persona === 'juridica' ? 'RUC' : form.tipo_doc_identidad === 'ruc' ? 'RUC' : form.tipo_doc_identidad === 'dni' ? 'DNI' : 'N° de Carnet'}
                        required
                        error={errores.numero_doc_identidad}
                    >
                        <CampoDocumento
                            tipo={form.tipo_doc_identidad}
                            value={form.numero_doc_identidad}
                            onResuelto={onDocumentoResuelto}
                            error={errores.numero_doc_identidad}
                        />
                    </Campo>

                    <Campo label={form.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre completo'} required error={errores.nombre_remitente}>
                        <div className="relative">
                            <input
                                type="text"
                                value={form.nombre_remitente}
                                onChange={e => {
                                    set('nombre_remitente', e.target.value);
                                    setNombreBloqueado(false);
                                }}
                                placeholder={form.tipo_persona === 'juridica' ? 'Razón social' : 'Nombre completo'}
                                className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 transition-colors ${
                                    errores.nombre_remitente ? 'border-red-300' : nombreBloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                                }`}
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                {nombreBloqueado
                                    ? <button type="button" onClick={() => { setNombreBloqueado(false); set('nombre_remitente', ''); }}><Unlock size={13} className="text-emerald-500 hover:text-gray-400"/></button>
                                    : form.nombre_remitente && <Lock size={13} className="text-gray-300"/>
                                }
                            </div>
                        </div>
                        {nombreBloqueado && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 size={10}/> Auto-completado
                            </p>
                        )}
                    </Campo>
                </div>

                {/* Correo electrónico */}
                <Campo label="Correo electrónico" required error={errores.email_remitente}>
                    {isPortal ? (
                        <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-3 py-2.5 text-sm text-emerald-800 font-medium">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0"/>
                            {portalEmail}
                        </div>
                    ) : (
                        <InputBase
                            type="email"
                            value={form.email_remitente}
                            onChange={e => set('email_remitente', e.target.value)}
                            placeholder="Se enviará el número de cargo a este correo"
                            error={errores.email_remitente}
                        />
                    )}
                </Campo>
            </Seccion>

            {/* ── Contenido ── */}
            <Seccion icono={FileText} titulo="Contenido del documento">
                <Campo label="Descripción / Mensaje" required error={errores.descripcion}>
                    <textarea
                        value={form.descripcion}
                        onChange={e => set('descripcion', e.target.value)}
                        rows={4}
                        placeholder="Detalle el motivo o contenido del documento enviado..."
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 resize-none transition-colors ${
                            errores.descripcion ? 'border-red-300' : 'border-gray-200'
                        }`}
                    />
                </Campo>
                <Campo label="Observación (opcional)">
                    <textarea
                        value={form.observacion}
                        onChange={e => set('observacion', e.target.value)}
                        rows={2}
                        placeholder="Alguna observación adicional..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20 resize-none transition-colors"
                    />
                </Campo>
            </Seccion>

            {/* ── Documentos adjuntos ── */}
            <Seccion icono={Paperclip} titulo="Documentos adjuntos">
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center"
                >
                    <Paperclip size={15}/> Seleccionar archivos
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={upload_accept}
                    onChange={agregarArchivos}
                    className="hidden"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                {archivos.length > 0 && (
                    <ul className="space-y-2">
                        {archivos.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                                <span className="text-lg shrink-0">{ICONOS_EXT[ext(f.name)] ?? '📎'}</span>
                                <span className="truncate flex-1 text-[#291136] font-medium">{f.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{(f.size/1024/1024).toFixed(2)} MB</span>
                                <button type="button" onClick={() => quitarArchivo(i)}
                                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                    <X size={14}/>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Seccion>

            {/* ── Aceptación reglamento ── */}
            <AceptacionReglamento
                checked={aceptaReglamento}
                onChange={setAceptaReglamento}
                error={errores.acepta_reglamento}
                contexto="al presente trámite ante el Centro"
                finalidad="trámite"
                bulletsExtra={[
                    <>Confirmo que los <strong className="text-[#291136]">datos del remitente</strong> consignados en este formulario son verídicos.</>,
                    <>Asumo plena responsabilidad sobre el <strong className="text-[#291136]">contenido y veracidad</strong> del documento adjunto.</>,
                ]}
            />

            {/* ── Submit ── */}
            <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-400">
                    Al confirmar recibirás un número de cargo en tu correo.
                </p>
                <button
                    type="submit"
                    disabled={procesando || (tiposDocumento.length === 0 && !cargandoTipos)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#BE0F4A] text-white rounded-xl hover:bg-[#9c0a3b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send size={14}/> {procesando ? 'Enviando...' : 'Enviar documento'}
                </button>
            </div>
        </form>
        </>
    );
}
