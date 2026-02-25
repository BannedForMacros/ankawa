import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    ChevronRight, ChevronLeft, User, Users, FileText,
    Scale, CheckCircle2, Mail, ShieldCheck, AlertTriangle, Paperclip
} from 'lucide-react';
import toast from 'react-hot-toast';

const opcionesTipoPersona = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Juridica' },
];

const opcionesSiNo = [
    { id: 1, nombre: 'Si, solicito designacion por el Director' },
    { id: 0, nombre: 'No, propongo arbitro'                     },
];

export default function ArbitrajeForm({ servicio }) {
    // ── OBTENER EL USUARIO AUTENTICADO (SI EXISTE) ──
    const { auth } = usePage().props;
    const isAuth = auth?.user !== null;
    const user = auth?.user;

    // ── PASOS DINÁMICOS ──
    // Si el usuario está logueado, no mostramos el paso de Verificación OTP
    const pasos = [
        { numero: 1, label: 'Demandante',   icono: User },
        ...(!isAuth ? [{ numero: 2, label: 'Verificacion', icono: ShieldCheck }] : []),
        { numero: 3, label: 'Demandado',    icono: Users },
        { numero: 4, label: 'Controversia', icono: Scale },
        { numero: 5, label: 'Arbitraje',    icono: FileText },
        { numero: 6, label: 'Anexos',       icono: Paperclip }, // ── NUEVO PASO DE DOCUMENTOS ──
    ];

    const [paso, setPaso]                   = useState(1);
    const [modalLegal, setModalLegal]       = useState(false);
    const [aceptoLegal, setAceptoLegal]     = useState(false);
    const [enviandoOtp, setEnviandoOtp]     = useState(false);
    const [otpEnviado, setOtpEnviado]       = useState(false);
    const [codigoOtp, setCodigoOtp]         = useState('');
    const [verificando, setVerificando]     = useState(false);
    const [otpError, setOtpError]           = useState('');
    const [errorGeneral, setErrorGeneral]   = useState('');

    // ── CONFIGURACIÓN DEL FORMULARIO ──
    const { data, setData, post, processing, errors } = useForm({
        servicio_id:                    servicio.id,
        // Si está logueado, hereda sus datos por defecto
        tipo_persona:                   isAuth ? (user.tipo_persona || 'natural') : 'natural',
        nombre_demandante:              isAuth ? user.name : '',
        documento_demandante:           isAuth ? (user.numero_documento || '') : '',
        nombre_representante:           '',
        documento_representante:        '',
        domicilio_demandante:           isAuth ? (user.direccion || '') : '',
        email_demandante:               isAuth ? user.email : '',
        telefono_demandante:            isAuth ? (user.telefono || '') : '',
        
        nombre_demandado:               '',
        domicilio_demandado:            '',
        email_demandado:                '',
        telefono_demandado:             '',
        resumen_controversia:           '',
        pretensiones:                   '',
        monto_involucrado:              '',
        solicita_designacion_director:  1,
        nombre_arbitro_propuesto:       '',
        email_arbitro_propuesto:        '',
        domicilio_arbitro_propuesto:    '',
        reglas_aplicables:              '',
        documentos_anexos:              [], // Array para los PDFs obligatorios
    });

    // ── Al terminar paso 1 → Validar campos y mostrar modal legal ──
    const handleSiguientePaso1 = () => {
        if (!data.nombre_demandante || !data.documento_demandante ||
            !data.domicilio_demandante || !data.email_demandante || !data.telefono_demandante) {
            toast.error('Complete todos los campos obligatorios del demandante', { position: 'top-center' });
            return;
        }
        setModalLegal(true);
    };

    // ── Aceptar legal → Decidir el flujo (Avanzar directo o Enviar OTP) ──
    const handleAceptarLegal = async () => {
        setModalLegal(false);
        setAceptoLegal(true);
        setErrorGeneral('');

        // Si ya está logueado, nos saltamos la verificación OTP y vamos al paso 3
        if (isAuth) {
            setPaso(3);
            return;
        }

        // Flujo para invitados (Público)
        setEnviandoOtp(true);
        try {
            await axios.post(route('mesa-partes.enviarCodigo'), {
                email:     data.email_demandante,
                nombre:    data.nombre_demandante,
                documento: data.documento_demandante, // Enviamos el DNI/RUC para validar
                servicio:  servicio.nombre,
            });
            setOtpEnviado(true);
            setPaso(2);
        } catch (error) {
            // Validamos si es nuestro error especial 409 (Usuario ya existe)
            if (error.response?.status === 409) {
                setErrorGeneral(error.response.data.mensaje);
                setPaso(1); // Lo regresamos al paso 1 para que vea el error
            } else {
                setErrorGeneral('No se pudo enviar el código. Intente nuevamente.');
            }
        } finally {
            setEnviandoOtp(false);
        }
    };

    // ── Verificar OTP ──
    const handleVerificarOtp = async () => {
        setOtpError('');
        setVerificando(true);
        try {
            await axios.post(route('mesa-partes.verificarCodigo'), {
                email:  data.email_demandante,
                codigo: codigoOtp,
            });
            setOtpVerificado(true);
            setPaso(3);
        } catch (err) {
            setOtpError(err.response?.data?.mensaje ?? 'Código incorrecto o expirado.');
        } finally {
            setVerificando(false);
        }
    };

    // ── Enviar Formulario Final ──
    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('solicitud.arbitraje.store'), {
            preserveScroll: true,
            onError: () => toast.error('Revise los errores marcados en el formulario', { position: 'top-center' }),
        });
    };

    // ── Manejador del botón "Anterior" para que no se rompa la navegación con el usuario logueado ──
    const irAtras = () => {
        if (paso === 3 && isAuth) {
            setPaso(1);
        } else {
            setPaso(p => p - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#291136] to-[#4A153D] p-6">
            <div className="max-w-2xl mx-auto">

                {/* Logo */}
                <div className="text-center mb-8">
                    <img src="/logo-white.png" alt="Ankawa" className="h-12 mx-auto mb-3" />
                    <h1 className="text-xl font-bold text-white">{servicio.nombre}</h1>
                    <p className="text-white/50 text-sm">Formulario de Solicitud</p>
                </div>

                {/* Stepper Dinámico */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {pasos.map((p, i) => {
                        const Icono      = p.icono;
                        const activo     = paso === p.numero;
                        const completado = paso > p.numero;
                        return (
                            <div key={p.numero} className="flex items-center gap-1">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                                    ${activo     ? 'bg-[#BE0F4A] text-white shadow-lg'     : ''}
                                    ${completado ? 'bg-white/20 text-white'                : ''}
                                    ${!activo && !completado ? 'bg-white/10 text-white/40' : ''}`}>
                                    {completado ? <CheckCircle2 size={13} /> : <Icono size={13} />}
                                    <span className="hidden sm:inline">{p.label}</span>
                                </div>
                                {i < pasos.length - 1 && (
                                    <ChevronRight size={13} className="text-white/30" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Alerta de Error Inteligente (Usuario Duplicado) */}
                {errorGeneral && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-3 text-sm text-red-800 font-medium">
                            <div className="p-2 bg-red-100 rounded-full shrink-0">
                                <AlertTriangle size={20} className="text-red-600" />
                            </div>
                            {errorGeneral}
                        </div>
                        {errorGeneral.includes('inicie sesión') && (
                            <a href={route('login')} 
                                className="whitespace-nowrap px-5 py-2.5 bg-[#BE0F4A] text-white rounded-xl font-bold text-xs hover:bg-[#9c0a3b] transition-colors shadow-md flex items-center gap-2 shrink-0">
                                <User size={14} />
                                Iniciar Sesión
                            </a>
                        )}
                    </div>
                )}

                {/* Card del Formulario */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8">

                            {/* ── Paso 1 — Demandante ── */}
                            {paso === 1 && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-lg font-bold text-[#291136] flex items-center gap-2">
                                            <User size={20} className="text-[#BE0F4A]" />
                                            Sus Datos (Demandante)
                                        </h2>
                                        {isAuth && (
                                            <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 flex items-center gap-1 shadow-sm">
                                                <CheckCircle2 size={13}/> Identidad Verificada
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                            ¿Actuará en este caso como? <span className="text-[#BE0F4A]">*</span>
                                        </label>
                                        <CustomSelect
                                            value={data.tipo_persona}
                                            onChange={val => setData('tipo_persona', val)}
                                            options={opcionesTipoPersona}
                                            placeholder={null}
                                            disabled={isAuth} // Bloqueado
                                        />
                                    </div>

                                    <Input label={data.tipo_persona === 'juridica' ? 'Razón Social' : 'Nombre completo'} required
                                        type="text" value={data.nombre_demandante}
                                        onChange={e => setData('nombre_demandante', e.target.value)}
                                        disabled={isAuth} // Bloqueado
                                        placeholder={data.tipo_persona === 'juridica' ? 'Empresa SAC' : 'Juan Perez Lopez'}
                                        error={errors.nombre_demandante} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label={data.tipo_persona === 'juridica' ? 'RUC' : 'DNI / CE'} required
                                            type="text" value={data.documento_demandante}
                                            onChange={e => setData('documento_demandante', e.target.value)}
                                            disabled={isAuth} // Bloqueado
                                            placeholder={data.tipo_persona === 'juridica' ? '20xxxxxxxxx' : '12345678'}
                                            error={errors.documento_demandante} />
                                        
                                        <Input label="Correo electrónico" required type="email"
                                            value={data.email_demandante}
                                            onChange={e => setData('email_demandante', e.target.value)}
                                            disabled={isAuth} // Bloqueado
                                            placeholder="correo@ejemplo.com"
                                            error={errors.email_demandante} />
                                    </div>

                                    {/* El representante legal SIEMPRE está desbloqueado */}
                                    {data.tipo_persona === 'juridica' && (
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                                            <Input label="Representante Legal" type="text" className="!mb-0"
                                                value={data.nombre_representante}
                                                onChange={e => setData('nombre_representante', e.target.value)} />
                                            <Input label="DNI del Representante" type="text" className="!mb-0"
                                                value={data.documento_representante}
                                                onChange={e => setData('documento_representante', e.target.value)} />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-2">
                                            <Input label="Domicilio de notificación" required type="text"
                                                value={data.domicilio_demandante}
                                                onChange={e => setData('domicilio_demandante', e.target.value)}
                                                disabled={isAuth} // Bloqueado
                                                placeholder="Dirección completa"
                                                error={errors.domicilio_demandante} />
                                        </div>
                                        <Input label="Teléfono" required type="text"
                                            value={data.telefono_demandante}
                                            onChange={e => setData('telefono_demandante', e.target.value)}
                                            disabled={isAuth} // Bloqueado
                                            placeholder="987654321"
                                            error={errors.telefono_demandante} />
                                    </div>
                                </div>
                            )}

                            {/* ── Paso 2 — Verificación OTP ── */}
                            {paso === 2 && !isAuth && (
                                <div className="text-center animate-in fade-in zoom-in-95 duration-300 py-4">
                                    <div className="w-16 h-16 bg-[#BE0F4A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Mail size={28} className="text-[#BE0F4A]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-[#291136] mb-2">
                                        Verificación de Identidad
                                    </h2>
                                    <p className="text-gray-500 text-sm mb-6">
                                        Hemos enviado un código de 6 dígitos a<br />
                                        <strong className="text-[#291136]">{data.email_demandante}</strong>
                                    </p>

                                    <div className="max-w-xs mx-auto">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={codigoOtp}
                                            onChange={e => setCodigoOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className={`w-full text-center text-3xl font-bold tracking-widest px-4 py-4 border-2 rounded-xl
                                                focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A]
                                                font-mono text-[#291136] transition-all
                                                ${otpError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        />
                                        {otpError && (
                                            <p className="mt-2 text-xs font-semibold text-red-500 flex items-center justify-center gap-1">
                                                <AlertTriangle size={13} /> {otpError}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-4">
                                        Válido por 15 minutos. Revise su carpeta de spam.
                                    </p>
                                </div>
                            )}

                            {/* ── Paso 3 — Demandado ── */}
                            {paso === 3 && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <Users size={20} className="text-[#BE0F4A]" />
                                        Datos del Demandado
                                    </h2>
                                    <Input label="Nombre completo / Razón Social" required type="text"
                                        value={data.nombre_demandado}
                                        onChange={e => setData('nombre_demandado', e.target.value)}
                                        placeholder="Nombre o razón social de a quién demanda"
                                        error={errors.nombre_demandado} />
                                    <Input label="Domicilio de notificación" required type="text"
                                        value={data.domicilio_demandado}
                                        onChange={e => setData('domicilio_demandado', e.target.value)}
                                        placeholder="Dirección exacta del demandado"
                                        error={errors.domicilio_demandado} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Correo electrónico" type="email"
                                            value={data.email_demandado}
                                            onChange={e => setData('email_demandado', e.target.value)}
                                            placeholder="correo@ejemplo.com" />
                                        <Input label="Teléfono" type="text"
                                            value={data.telefono_demandado}
                                            onChange={e => setData('telefono_demandado', e.target.value)}
                                            placeholder="987654321" />
                                    </div>
                                </div>
                            )}

                            {/* ── Paso 4 — Controversia ── */}
                            {paso === 4 && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <Scale size={20} className="text-[#BE0F4A]" />
                                        Materia de la Controversia
                                    </h2>
                                    <Textarea label="Resumen de la controversia" required
                                        value={data.resumen_controversia}
                                        onChange={e => setData('resumen_controversia', e.target.value)}
                                        placeholder="Describa brevemente los hechos y el origen del conflicto..."
                                        rows={4} error={errors.resumen_controversia} />
                                    <Textarea label="Pretensiones" required
                                        value={data.pretensiones}
                                        onChange={e => setData('pretensiones', e.target.value)}
                                        placeholder="Indique qué solicita al tribunal arbitral..."
                                        rows={4} error={errors.pretensiones} />
                                    <Input label="Monto involucrado (S/)" type="number" min="0" step="0.01"
                                        value={data.monto_involucrado}
                                        onChange={e => setData('monto_involucrado', e.target.value)}
                                        placeholder="Ej: 50000.00" error={errors.monto_involucrado} />
                                </div>
                            )}

                            {/* ── Paso 5 — Arbitraje ── */}
                            {paso === 5 && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <FileText size={20} className="text-[#BE0F4A]" />
                                        Conformación del Tribunal
                                    </h2>
                                    <div className="mb-5">
                                        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                            Designación de Árbitro <span className="text-[#BE0F4A]">*</span>
                                        </label>
                                        <CustomSelect
                                            value={data.solicita_designacion_director}
                                            onChange={val => setData('solicita_designacion_director', val)}
                                            options={opcionesSiNo}
                                            placeholder={null}
                                        />
                                    </div>
                                    {data.solicita_designacion_director === 0 && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <Input label="Nombre del Árbitro Propuesto" type="text" className="!mb-0"
                                                    value={data.nombre_arbitro_propuesto}
                                                    onChange={e => setData('nombre_arbitro_propuesto', e.target.value)} />
                                            </div>
                                            <Input label="Correo del Árbitro Propuesto" type="email" className="!mb-0"
                                                value={data.email_arbitro_propuesto}
                                                onChange={e => setData('email_arbitro_propuesto', e.target.value)} />
                                            <Input label="Domicilio del Árbitro Propuesto" type="text" className="!mb-0"
                                                value={data.domicilio_arbitro_propuesto}
                                                onChange={e => setData('domicilio_arbitro_propuesto', e.target.value)} />
                                        </div>
                                    )}
                                    <Input label="Reglas aplicables" type="text"
                                        value={data.reglas_aplicables}
                                        onChange={e => setData('reglas_aplicables', e.target.value)}
                                        placeholder="Ej: Reglamento Ankawa, UNCITRAL..." />
                                </div>
                            )}

                            {/* ── Paso 6 — Anexos (NUEVO) ── */}
                            {paso === 6 && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <Paperclip size={20} className="text-[#BE0F4A]" />
                                        Documentos Adjuntos
                                    </h2>
                                    
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                        <p className="text-sm text-amber-800 font-medium">
                                            Para procesar su solicitud, es obligatorio adjuntar:
                                        </p>
                                        <ul className="list-disc pl-5 mt-2 text-sm text-amber-700">
                                            <li>Copia de DNI o Ficha RUC.</li>
                                            <li>Contrato que contenga el Convenio Arbitral.</li>
                                            <li>Comprobante de pago de derechos.</li>
                                        </ul>
                                        <p className="text-xs text-amber-600 mt-2 italic">(Máx. 10MB por archivo).</p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                            Subir Archivos <span className="text-[#BE0F4A]">*</span>
                                        </label>
                                        <input 
                                            type="file" 
                                            multiple 
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={(e) => setData('documentos_anexos', Array.from(e.target.files))}
                                            className="block w-full text-sm text-gray-500
                                                file:mr-4 file:py-3 file:px-4
                                                file:rounded-xl file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-[#291136]/5 file:text-[#291136]
                                                hover:file:bg-[#291136]/10 cursor-pointer border border-gray-200 rounded-xl transition-all"
                                        />
                                        {errors.documentos_anexos && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.documentos_anexos}</p>}
                                        
                                        {/* Lista de archivos seleccionados */}
                                        {data.documentos_anexos.length > 0 && (
                                            <ul className="mt-4 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                {data.documentos_anexos.map((file, idx) => (
                                                    <li key={idx} className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                                                        <FileText size={16} className="text-[#BE0F4A]"/> 
                                                        <span className="truncate">{file.name}</span>
                                                        <span className="text-xs text-gray-400 font-normal shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* ── Navegación Footer ── */}
                        <div className="flex items-center justify-between px-8 py-5 bg-gray-50 border-t border-gray-100">
                            <button type="button"
                                onClick={irAtras}
                                disabled={paso === 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#291136] border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={16} /> Anterior
                            </button>

                            {/* Paso 1 → Llama a validación / legal */}
                            {paso === 1 && (
                                <button type="button" onClick={handleSiguientePaso1}
                                    disabled={enviandoOtp}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#291136] text-white hover:bg-[#4A153D] transition-all disabled:opacity-50">
                                    {enviandoOtp ? 'Procesando...' : 'Siguiente'}
                                    <ChevronRight size={16} />
                                </button>
                            )}

                            {/* Paso 2 → Verifica OTP */}
                            {paso === 2 && !isAuth && (
                                <button type="button" onClick={handleVerificarOtp}
                                    disabled={verificando || codigoOtp.length !== 6}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-all disabled:opacity-50">
                                    {verificando ? 'Verificando...' : 'Verificar Código'}
                                    <ShieldCheck size={16} />
                                </button>
                            )}

                            {/* Pasos 3, 4 y 5 → Siguiente normal */}
                            {paso >= 3 && paso < 6 && (
                                <button type="button" onClick={() => setPaso(p => p + 1)}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#291136] text-white hover:bg-[#4A153D] transition-all">
                                    Siguiente <ChevronRight size={16} />
                                </button>
                            )}

                            {/* Paso 6 → Enviar Formulario */}
                            {paso === 6 && (
                                <PrimaryButton type="submit" disabled={processing} className="shadow-lg hover:scale-105 transition-transform">
                                    {processing ? 'Subiendo archivos...' : 'Enviar Solicitud y Finalizar'}
                                </PrimaryButton>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Modal Legal ── */}
            {modalLegal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                            <ShieldCheck size={22} className="text-[#BE0F4A]" />
                            <h3 className="text-white font-bold">Declaración Jurada y Tratamiento de Datos</h3>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                            <p>
                                De conformidad con la <strong>Ley N° 29733 — Ley de Protección de Datos Personales</strong>
                                y su Reglamento (D.S. 003-2013-JUS), el Centro de Arbitraje Ankawa Internacional le informa que:
                            </p>
                            <ul className="space-y-2 pl-4">
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    Sus datos personales serán tratados exclusivamente para la gestión del proceso arbitral solicitado.
                                </li>
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    No serán transferidos a terceros sin su consentimiento, salvo mandato judicial o legal.
                                </li>
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    Usted tiene derecho de acceso, rectificación, cancelación y oposición (derechos ARCO).
                                </li>
                            </ul>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                                <p className="font-bold text-amber-800 mb-1">Declaración Jurada</p>
                                <p className="text-amber-700">
                                    El suscrito declara bajo juramento que la información proporcionada es
                                    verídica y exacta, asumiendo plena responsabilidad legal por su contenido
                                    conforme al D.L. 1071 — Decreto Legislativo que norma el Arbitraje.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button onClick={() => setModalLegal(false)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100 transition-all">
                                Cancelar
                            </button>
                            <button onClick={handleAceptarLegal}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-all shadow-lg">
                                <CheckCircle2 size={16} />
                                Acepto y Continuo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}