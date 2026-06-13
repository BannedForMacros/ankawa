import { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function PortalLogin({ hcaptchaSiteKey }) {
    const [step, setStep] = useState('identidad'); // 'identidad' | 'otp'
    const [email, setEmail] = useState('');
    const [numeroDoc, setNumeroDoc] = useState('');
    const [digito, setDigito] = useState('');
    const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [reenvioEn, setReenvioEn] = useState(0); // segundos para habilitar "Reenviar código"
    const inputsRef = useRef([]);
    const captchaRef = useRef(null);
    const [captchaWidgetId, setCaptchaWidgetId] = useState(null);
    const [captchaToken, setCaptchaToken] = useState('');

    useEffect(() => {
        if (!hcaptchaSiteKey) return;
        if (window.hcaptcha) return;
        if (document.getElementById('hcaptcha-api-script')) return;

        const script = document.createElement('script');
        script.id = 'hcaptcha-api-script';
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }, [hcaptchaSiteKey]);

    useEffect(() => {
        if (!hcaptchaSiteKey) return;
        if (step !== 'identidad') return;
        if (captchaWidgetId !== null) return;

        const intervalo = setInterval(() => {
            if (window.hcaptcha && captchaRef.current) {
                clearInterval(intervalo);
                const id = window.hcaptcha.render(captchaRef.current, {
                    sitekey: hcaptchaSiteKey,
                    callback: (token) => setCaptchaToken(token),
                    'expired-callback': () => setCaptchaToken(''),
                });
                setCaptchaWidgetId(id);
            }
        }, 200);

        return () => clearInterval(intervalo);
    }, [hcaptchaSiteKey, step, captchaWidgetId]);

    // Cuenta regresiva para habilitar el reenvío del código
    useEffect(() => {
        if (step !== 'otp' || reenvioEn <= 0) return;
        const t = setTimeout(() => setReenvioEn(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [step, reenvioEn]);

    async function enviarCodigo(e) {
        e.preventDefault();
        if (!email.trim() || !numeroDoc.trim()) return;
        if (!digito.trim()) {
            setError('Ingrese el dígito verificador del DNI.');
            return;
        }
        if (hcaptchaSiteKey && !captchaToken) {
            setError('Complete la verificación de seguridad.');
            return;
        }

        setCargando(true);
        setError('');

        try {
            // window.axios usa la cookie XSRF-TOKEN (rotada por Laravel en cada respuesta).
            // Si usamos fetch con meta token estático, el token queda obsoleto cuando la
            // sesión rota (login/logout en otra pestaña, cambio de auth web ↔ portal) → 419.
            const { data } = await window.axios.post(route('portal.enviar-codigo'), {
                email: email.trim(),
                tipo_doc: 'dni',
                numero_doc: numeroDoc.trim(),
                digito_verificador: digito.trim().toUpperCase(),
                captcha_token: captchaToken,
            });

            if (data.ok) {
                setStep('otp');
                setReenvioEn(60);
                setAviso('');
            } else {
                setError(data.mensaje ?? 'No se pudo iniciar sesión.');
                if (window.hcaptcha && captchaWidgetId !== null) {
                    window.hcaptcha.reset(captchaWidgetId);
                    setCaptchaToken('');
                }
            }
        } catch (err) {
            setError(err.response?.data?.mensaje ?? 'Error de conexión. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    }

    // Reenviar el código. El captcha es de un solo uso: si el servidor lo rechaza,
    // se devuelve al usuario al paso de identidad para completarlo de nuevo.
    async function reenviarCodigo() {
        if (cargando || reenvioEn > 0) return;
        setCargando(true); setError(''); setAviso('');
        try {
            const { data } = await window.axios.post(route('portal.enviar-codigo'), {
                email: email.trim(),
                tipo_doc: 'dni',
                numero_doc: numeroDoc.trim(),
                digito_verificador: digito.trim().toUpperCase(),
                captcha_token: captchaToken,
            });
            if (data.ok) {
                setCodigo(['', '', '', '', '', '']);
                setReenvioEn(60);
                setAviso('Le enviamos un código nuevo. El anterior quedó anulado.');
            } else {
                volverAIdentidad();
                setError('Por seguridad, complete nuevamente la verificación para reenviar el código.');
                if (window.hcaptcha && captchaWidgetId !== null) {
                    window.hcaptcha.reset(captchaWidgetId);
                    setCaptchaToken('');
                }
            }
        } catch (err) {
            setError(err.response?.data?.mensaje ?? 'Error de conexión. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    }

    function onDigit(i, val) {
        const clean = val.replace(/\D/g, '').slice(0, 1);
        const nuevo = [...codigo];
        nuevo[i] = clean;
        setCodigo(nuevo);
        if (clean && i < 5) inputsRef.current[i + 1]?.focus();
    }

    function onKeyDown(i, e) {
        if (e.key === 'Backspace' && !codigo[i] && i > 0) {
            inputsRef.current[i - 1]?.focus();
        }
    }

    function handlePaste(e, i) {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').split('');
        if (pasteData.length === 0) return;

        const nuevo = [...codigo];
        let nextFocus = i;
        pasteData.forEach((char, index) => {
            if (i + index < 6) {
                nuevo[i + index] = char;
                nextFocus = i + index;
            }
        });
        setCodigo(nuevo);
        inputsRef.current[Math.min(nextFocus + 1, 5)]?.focus();
    }

    async function verificarCodigo(e) {
        e.preventDefault();
        const codigoStr = codigo.join('');
        if (codigoStr.length < 6) return;
        setCargando(true); setError('');
        try {
            const { data } = await window.axios.post(route('portal.verificar-codigo'), {
                email,
                codigo: codigoStr,
            });
            if (data.ok) {
                window.location.href = route('portal.expedientes');
            } else {
                setError(data.mensaje ?? 'Código incorrecto o expirado.');
            }
        } catch (err) {
            setError(err.response?.data?.mensaje ?? 'Error de conexión. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    }

    function volverAIdentidad() {
        setStep('identidad');
        setCodigo(['', '', '', '', '', '']);
        setError('');
        setAviso('');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4">
            <Head title="Portal Externo — Ankawa" />

            {/* Header con botón Volver al inicio */}
            <div className="w-full max-w-5xl mx-auto pt-2 pb-4">
                <Link
                    href={route('welcome')}
                    className="group inline-flex items-center text-gray-500 hover:text-[#BE0F4A] transition-all duration-300 font-medium"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-[#BE0F4A]/10 transition-colors">
                        <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300" />
                    </div>
                    <span className="text-sm">Volver al inicio</span>
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
            <div className="mb-8">
                <img src="/logo.png" alt="Ankawa" className="h-14 object-contain" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-[#291136]" />
                <div className="p-8">
                    {step === 'identidad' ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center mx-auto mb-3">
                                    <ShieldCheck size={22} className="text-[#BE0F4A]" />
                                </div>
                                <h1 className="text-xl font-black text-[#291136]">Portal Externo</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Verifique su identidad para acceder.
                                </p>
                            </div>

                            <form onSubmit={enviarCodigo} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A]"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">No se aceptan correos temporales o desechables.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">DNI</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={numeroDoc}
                                        onChange={e => setNumeroDoc(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                        placeholder="8 dígitos"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Dígito verificador del DNI</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={digito}
                                            onChange={e => setDigito(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 1).toUpperCase())}
                                            placeholder="X"
                                            required
                                            maxLength={1}
                                            className="w-16 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#BE0F4A]"
                                        />
                                        <p className="text-xs text-gray-600 leading-snug">
                                            Es el número o letra pequeño que aparece junto a su número de DNI
                                            en el documento físico.
                                        </p>
                                    </div>
                                </div>

                                {hcaptchaSiteKey && (
                                    <div className="flex justify-center pt-1">
                                        <div ref={captchaRef} />
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-600">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors"
                                >
                                    {cargando ? 'Verificando…' : <><span>Continuar</span><ArrowRight size={16} /></>}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center mx-auto mb-3">
                                    <KeyRound size={22} className="text-[#BE0F4A]" />
                                </div>
                                <h1 className="text-xl font-black text-[#291136]">Código de verificación</h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    Enviamos un código a<br />
                                    <span className="font-semibold text-[#291136]">{email}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    El código llega en 1 o 2 minutos y vence a los 15.
                                    Revise también su carpeta de spam (correo no deseado).
                                </p>
                            </div>
                            <form onSubmit={verificarCodigo} className="space-y-4">
                                <div className="flex gap-2 justify-center">
                                    {codigo.map((d, i) => (
                                        <input
                                            key={i}
                                            ref={el => inputsRef.current[i] = el}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={e => onDigit(i, e.target.value)}
                                            onKeyDown={e => onKeyDown(i, e)}
                                            onPaste={e => handlePaste(e, i)}
                                            className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#BE0F4A] transition-colors"
                                        />
                                    ))}
                                </div>
                                {error && (
                                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-600">{error}</p>
                                    </div>
                                )}
                                {aviso && (
                                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-emerald-700">{aviso}</p>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={cargando || codigo.join('').length < 6}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors"
                                >
                                    {cargando ? 'Verificando…' : <><CheckCircle2 size={16} /><span>Ingresar</span></>}
                                </button>
                                <button
                                    type="button"
                                    onClick={reenviarCodigo}
                                    disabled={cargando || reenvioEn > 0}
                                    className="w-full text-xs font-semibold text-[#BE0F4A] hover:text-[#9c0a3b] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    {reenvioEn > 0
                                        ? `¿No le llegó? Podrá reenviarlo en ${reenvioEn} s`
                                        : '¿No le llegó? Reenviar código'}
                                </button>
                                <button
                                    type="button"
                                    onClick={volverAIdentidad}
                                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    ← Volver a verificar identidad
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-6">The Ankawa Global Group SAC — Plataforma de Expedientes Electrónicos</p>
            </div>
        </div>
    );
}
