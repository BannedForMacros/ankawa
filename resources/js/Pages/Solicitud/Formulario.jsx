import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    ChevronRight, ChevronLeft, User, Users, FileText,
    Scale, CheckCircle2, Mail, ShieldCheck, AlertTriangle
} from 'lucide-react';

const opcionesTipoPersona = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Juridica' },
];

const opcionesSiNo = [
    { id: 1, nombre: 'Si, solicito designacion por el Director' },
    { id: 0, nombre: 'No, propongo arbitro'                     },
];

const pasos = [
    { numero: 1, label: 'Demandante',   icono: User      },
    { numero: 2, label: 'Verificacion', icono: ShieldCheck},
    { numero: 3, label: 'Demandado',    icono: Users     },
    { numero: 4, label: 'Controversia', icono: Scale     },
    { numero: 5, label: 'Arbitraje',    icono: FileText  },
];

export default function Formulario({ servicio }) {

    const [paso, setPaso]                   = useState(1);
    const [modalLegal, setModalLegal]       = useState(false);
    const [aceptoLegal, setAceptoLegal]     = useState(false);
    const [enviandoOtp, setEnviandoOtp]     = useState(false);
    const [otpEnviado, setOtpEnviado]       = useState(false);
    const [codigoOtp, setCodigoOtp]         = useState('');
    const [verificando, setVerificando]     = useState(false);
    const [otpVerificado, setOtpVerificado] = useState(false);
    const [otpError, setOtpError]           = useState('');
    const [errorGeneral, setErrorGeneral]   = useState('');

    const { data, setData, post, processing, errors } = useForm({
        servicio_id:                    servicio.id,
        tipo_persona:                   'natural',
        nombre_demandante:              '',
        documento_demandante:           '',
        nombre_representante:           '',
        documento_representante:        '',
        domicilio_demandante:           '',
        email_demandante:               '',
        telefono_demandante:            '',
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
    });

    // Al terminar paso 1 → mostrar modal legal
    const handleSiguientePaso1 = () => {
        if (!data.nombre_demandante || !data.documento_demandante ||
            !data.domicilio_demandante || !data.email_demandante || !data.telefono_demandante) {
            return;
        }
        setModalLegal(true);
    };

    // Aceptar legal → enviar OTP
    const handleAceptarLegal = async () => {
        setModalLegal(false);
        setAceptoLegal(true);
        setEnviandoOtp(true);
        try {
            await axios.post(route('solicitud.enviarCodigo'), {
                email:    data.email_demandante,
                nombre:   data.nombre_demandante,
                servicio: servicio.nombre,
            });
            setOtpEnviado(true);
            setPaso(2);
        } catch {
            setErrorGeneral('No se pudo enviar el codigo. Intente nuevamente.');
        } finally {
            setEnviandoOtp(false);
        }
    };

    // Verificar OTP
    const handleVerificarOtp = async () => {
        setOtpError('');
        setVerificando(true);
        try {
            await axios.post(route('solicitud.verificarCodigo'), {
                email:  data.email_demandante,
                codigo: codigoOtp,
            });
            setOtpVerificado(true);
            setPaso(3);
        } catch (err) {
            setOtpError(err.response?.data?.mensaje ?? 'Codigo incorrecto o expirado.');
        } finally {
            setVerificando(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('solicitud.store'));
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

                {/* Stepper */}
                <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                    {pasos.map((p, i) => {
                        const Icono     = p.icono;
                        const activo    = paso === p.numero;
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

                {/* Error general */}
                {errorGeneral && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-sm text-red-700 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        {errorGeneral}
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8">

                            {/* ── Paso 1 — Demandante ── */}
                            {paso === 1 && (
                                <div>
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <User size={20} className="text-[#BE0F4A]" />
                                        Sus Datos (Demandante)
                                    </h2>

                                    <div className="mb-5">
                                        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                            Tipo de Persona <span className="text-[#BE0F4A]">*</span>
                                        </label>
                                        <CustomSelect
                                            value={data.tipo_persona}
                                            onChange={val => setData('tipo_persona', val)}
                                            options={opcionesTipoPersona}
                                            placeholder={null}
                                        />
                                    </div>

                                    <Input label={data.tipo_persona === 'juridica' ? 'Razon Social' : 'Nombre completo'} required
                                        type="text" value={data.nombre_demandante}
                                        onChange={e => setData('nombre_demandante', e.target.value)}
                                        placeholder={data.tipo_persona === 'juridica' ? 'Empresa SAC' : 'Juan Perez Lopez'}
                                        error={errors.nombre_demandante} />

                                    <Input label={data.tipo_persona === 'juridica' ? 'RUC' : 'DNI / CE'} required
                                        type="text" value={data.documento_demandante}
                                        onChange={e => setData('documento_demandante', e.target.value)}
                                        placeholder={data.tipo_persona === 'juridica' ? '20xxxxxxxxx' : '12345678'}
                                        error={errors.documento_demandante} />

                                    {data.tipo_persona === 'juridica' && <>
                                        <Input label="Representante Legal" type="text"
                                            value={data.nombre_representante}
                                            onChange={e => setData('nombre_representante', e.target.value)} />
                                        <Input label="DNI del Representante" type="text"
                                            value={data.documento_representante}
                                            onChange={e => setData('documento_representante', e.target.value)} />
                                    </>}

                                    <Input label="Domicilio" required type="text"
                                        value={data.domicilio_demandante}
                                        onChange={e => setData('domicilio_demandante', e.target.value)}
                                        placeholder="Direccion completa"
                                        error={errors.domicilio_demandante} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Correo electronico" required type="email"
                                            value={data.email_demandante}
                                            onChange={e => setData('email_demandante', e.target.value)}
                                            placeholder="correo@ejemplo.com"
                                            error={errors.email_demandante} />
                                        <Input label="Telefono" required type="text"
                                            value={data.telefono_demandante}
                                            onChange={e => setData('telefono_demandante', e.target.value)}
                                            placeholder="987654321"
                                            error={errors.telefono_demandante} />
                                    </div>
                                </div>
                            )}

                            {/* ── Paso 2 — Verificación OTP ── */}
                            {paso === 2 && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-[#BE0F4A]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Mail size={28} className="text-[#BE0F4A]" />
                                    </div>
                                    <h2 className="text-lg font-bold text-[#291136] mb-2">
                                        Verificacion de Identidad
                                    </h2>
                                    <p className="text-gray-500 text-sm mb-6">
                                        Hemos enviado un codigo de 6 digitos a<br />
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
                                        Valido por 15 minutos. Revise su carpeta de spam.
                                    </p>
                                </div>
                            )}

                            {/* ── Paso 3 — Demandado ── */}
                            {paso === 3 && (
                                <div>
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <Users size={20} className="text-[#BE0F4A]" />
                                        Datos del Demandado
                                    </h2>
                                    <Input label="Nombre completo / Razon Social" required type="text"
                                        value={data.nombre_demandado}
                                        onChange={e => setData('nombre_demandado', e.target.value)}
                                        placeholder="Nombre o razon social"
                                        error={errors.nombre_demandado} />
                                    <Input label="Domicilio" required type="text"
                                        value={data.domicilio_demandado}
                                        onChange={e => setData('domicilio_demandado', e.target.value)}
                                        placeholder="Direccion del demandado"
                                        error={errors.domicilio_demandado} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Correo electronico" type="email"
                                            value={data.email_demandado}
                                            onChange={e => setData('email_demandado', e.target.value)}
                                            placeholder="correo@ejemplo.com" />
                                        <Input label="Telefono" type="text"
                                            value={data.telefono_demandado}
                                            onChange={e => setData('telefono_demandado', e.target.value)}
                                            placeholder="987654321" />
                                    </div>
                                </div>
                            )}

                            {/* ── Paso 4 — Controversia ── */}
                            {paso === 4 && (
                                <div>
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
                                        placeholder="Indique que solicita al tribunal arbitral..."
                                        rows={4} error={errors.pretensiones} />
                                    <Input label="Monto involucrado (S/)" type="number" min="0" step="0.01"
                                        value={data.monto_involucrado}
                                        onChange={e => setData('monto_involucrado', e.target.value)}
                                        placeholder="50000.00" error={errors.monto_involucrado} />
                                </div>
                            )}

                            {/* ── Paso 5 — Arbitraje ── */}
                            {paso === 5 && (
                                <div>
                                    <h2 className="text-lg font-bold text-[#291136] mb-6 flex items-center gap-2">
                                        <FileText size={20} className="text-[#BE0F4A]" />
                                        Conformacion del Tribunal
                                    </h2>
                                    <div className="mb-5">
                                        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                                            Designacion de Arbitro <span className="text-[#BE0F4A]">*</span>
                                        </label>
                                        <CustomSelect
                                            value={data.solicita_designacion_director}
                                            onChange={val => setData('solicita_designacion_director', val)}
                                            options={opcionesSiNo}
                                            placeholder={null}
                                        />
                                    </div>
                                    {data.solicita_designacion_director === 0 && <>
                                        <Input label="Nombre del Arbitro Propuesto" type="text"
                                            value={data.nombre_arbitro_propuesto}
                                            onChange={e => setData('nombre_arbitro_propuesto', e.target.value)} />
                                        <Input label="Correo del Arbitro Propuesto" type="email"
                                            value={data.email_arbitro_propuesto}
                                            onChange={e => setData('email_arbitro_propuesto', e.target.value)} />
                                        <Input label="Domicilio del Arbitro Propuesto" type="text"
                                            value={data.domicilio_arbitro_propuesto}
                                            onChange={e => setData('domicilio_arbitro_propuesto', e.target.value)} />
                                    </>}
                                    <Input label="Reglas aplicables" type="text"
                                        value={data.reglas_aplicables}
                                        onChange={e => setData('reglas_aplicables', e.target.value)}
                                        placeholder="Ej: Reglamento Ankawa, UNCITRAL..." />
                                    <div className="mt-4 p-4 bg-[#291136]/5 rounded-xl border border-[#291136]/10 text-sm text-[#291136]/70 leading-relaxed">
                                        Al enviar esta solicitud, usted declara que la informacion es veridica
                                        y acepta el reglamento del Centro de Arbitraje Ankawa Internacional.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navegación */}
                        <div className="flex items-center justify-between px-8 py-5 bg-gray-50 border-t border-gray-100">
                            <button type="button"
                                onClick={() => setPaso(p => p - 1)}
                                disabled={paso === 1}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#291136] border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                <ChevronLeft size={16} /> Anterior
                            </button>

                            {/* Paso 1 → modal legal */}
                            {paso === 1 && (
                                <button type="button" onClick={handleSiguientePaso1}
                                    disabled={enviandoOtp}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#291136] text-white hover:bg-[#4A153D] transition-all disabled:opacity-50">
                                    {enviandoOtp ? 'Enviando...' : 'Siguiente'}
                                    <ChevronRight size={16} />
                                </button>
                            )}

                            {/* Paso 2 → verificar OTP */}
                            {paso === 2 && (
                                <button type="button" onClick={handleVerificarOtp}
                                    disabled={verificando || codigoOtp.length !== 6}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-all disabled:opacity-50">
                                    {verificando ? 'Verificando...' : 'Verificar Codigo'}
                                    <ShieldCheck size={16} />
                                </button>
                            )}

                            {/* Pasos 3-4 → siguiente normal */}
                            {paso >= 3 && paso < 5 && (
                                <button type="button" onClick={() => setPaso(p => p + 1)}
                                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#291136] text-white hover:bg-[#4A153D] transition-all">
                                    Siguiente <ChevronRight size={16} />
                                </button>
                            )}

                            {/* Paso 5 → enviar */}
                            {paso === 5 && (
                                <PrimaryButton type="submit" disabled={processing}>
                                    {processing ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                                </PrimaryButton>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Modal Legal ── */}
            {modalLegal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                        <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                            <ShieldCheck size={22} className="text-[#BE0F4A]" />
                            <h3 className="text-white font-bold">Declaracion Jurada y Tratamiento de Datos</h3>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                            <p>
                                De conformidad con la <strong>Ley N° 29733 — Ley de Proteccion de Datos Personales</strong>
                                y su Reglamento (D.S. 003-2013-JUS), el Centro de Arbitraje Ankawa Internacional le informa que:
                            </p>
                            <ul className="space-y-2 pl-4">
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    Sus datos personales seran tratados exclusivamente para la gestion del proceso arbitral solicitado.
                                </li>
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    No seran transferidos a terceros sin su consentimiento, salvo mandato judicial o legal.
                                </li>
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    Usted tiene derecho de acceso, rectificacion, cancelacion y oposicion (derechos ARCO).
                                </li>
                                <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                    Los datos seran conservados durante el tiempo necesario para cumplir con las obligaciones legales.
                                </li>
                            </ul>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                                <p className="font-bold text-amber-800 mb-1">Declaracion Jurada</p>
                                <p className="text-amber-700">
                                    El suscrito declara bajo juramento que la informacion proporcionada es
                                    veridica y exacta, asumiendo plena responsabilidad legal por su contenido
                                    conforme al D.L. 1071 — Decreto Legislativo que norma el Arbitraje.
                                </p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
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