import { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle2, ShieldCheck, AlertCircle, HelpCircle, Info, Home, Headphones, Lock } from 'lucide-react';
import LoginEnvioOverlay from '@/Components/LoginEnvioOverlay';
import DniEjemploSvg from '@/Components/DniEjemploSvg';
import Reveal from '@/Components/Reveal';

/**
 * Flujo de login OTP del portal público (identidad → código).
 *
 * Antes vivía duplicado casi idéntico en MesaPartes/Login.jsx y Portal/Login.jsx
 * (~320 líneas c/u). Las únicas diferencias reales son los textos y las rutas:
 *
 * @param {string}  hcaptchaSiteKey
 * @param {string}  headTitle        título de la pestaña del navegador
 * @param {string}  titulo           encabezado (ej. "Mesa de Partes")
 * @param {string}  subtitulo        texto bajo el encabezado
 * @param {string}  enviarRoute      nombre de ruta para solicitar el código
 * @param {string}  verificarRoute   nombre de ruta para validar el código
 * @param {string}  redirectFallback adónde ir tras validar si el server no devuelve `redirect`
 * @param {string}  variant          'portal' (1 columna sobria, ejemplo del DNI colapsable —
 *                                   default) | 'mesa-partes' (card ancha de 2 columnas con el
 *                                   ejemplo siempre visible, logo protagónico y animaciones)
 */
export default function OtpLoginFlow({
    hcaptchaSiteKey,
    headTitle,
    titulo,
    subtitulo,
    enviarRoute,
    verificarRoute,
    redirectFallback,
    overlayEnvio = false,
    variant = 'portal',
}) {
    const esMesaPartes = variant === 'mesa-partes';

    const [step, setStep] = useState('identidad'); // 'identidad' | 'otp'
    const [dirPaso, setDirPaso] = useState(null);  // 'right' | 'left' | null (sin transición inicial)
    const [email, setEmail] = useState('');
    const [numeroDoc, setNumeroDoc] = useState('');
    const [digito, setDigito] = useState('');
    const [mostrarAyudaDigito, setMostrarAyudaDigito] = useState(false); // solo variante portal
    const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [reenvioEn, setReenvioEn] = useState(0); // segundos para habilitar "Reenviar código"
    const inputsRef = useRef([]);
    const captchaRef = useRef(null);
    const [captchaWidgetId, setCaptchaWidgetId] = useState(null);
    const [captchaToken, setCaptchaToken] = useState('');

    // Cargar script de hCaptcha solo si hay sitekey configurado
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

    // Renderizar widget hCaptcha cuando esté disponible
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

    function resetCaptcha() {
        if (window.hcaptcha && captchaWidgetId !== null) {
            window.hcaptcha.reset(captchaWidgetId);
            setCaptchaToken('');
        }
    }

    // Cambia de paso registrando la dirección para el cross-fade + slide
    function irAPaso(nuevo) {
        setDirPaso(nuevo === 'otp' ? 'right' : 'left');
        setStep(nuevo);
    }

    async function enviarCodigo(e) {
        e.preventDefault();
        if (!email.trim() || !numeroDoc.trim()) return;
        if (!digito.trim()) {
            setError('Ingrese el dígito verificador del DNI (el carácter al final del número impreso en su DNI).');
            return;
        }
        if (hcaptchaSiteKey && !captchaToken) {
            setError('Complete la verificación de seguridad.');
            return;
        }

        setCargando(true);
        setError('');

        try {
            // window.axios (bootstrap.js) lee la cookie XSRF-TOKEN que Laravel rota en cada
            // respuesta — evita el "419 CSRF mismatch" tras una rotación de sesión.
            const { data } = await window.axios.post(route(enviarRoute), {
                email: email.trim(),
                tipo_doc: 'dni',
                numero_doc: numeroDoc.trim(),
                digito_verificador: digito.trim().toUpperCase(),
                captcha_token: captchaToken,
            });

            if (data.ok) {
                irAPaso('otp');
                setReenvioEn(60);
                setAviso('');
            } else {
                setError(data.mensaje ?? 'No se pudo iniciar sesión. Verifique los datos e intente de nuevo.');
                resetCaptcha();
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
            const { data } = await window.axios.post(route(enviarRoute), {
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
                resetCaptcha();
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
            const { data } = await window.axios.post(route(verificarRoute), {
                email,
                codigo: codigoStr,
            });
            if (data.ok) {
                // Si el usuario llegó al login intentando abrir un recurso concreto
                // (p. ej. un documento desde el correo), lo devolvemos ahí; si no, al fallback.
                window.location.href = data.redirect ?? route(redirectFallback);
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
        irAPaso('identidad');
        setCodigo(['', '', '', '', '', '']);
        setError('');
        setAviso('');
    }

    const inputClasses = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-ankawa-rose focus:ring-2 focus:ring-ankawa-rose/15 transition-shadow';

    // Bloque del dígito verificador: en mesa-partes el ejemplo vive siempre visible
    // en la columna derecha (sin toggle); en portal conserva el panel colapsable.
    const bloqueDigito = (
        <div key="digito">
            <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Dígito verificador del DNI</label>
                {!esMesaPartes && (
                    <button
                        type="button"
                        onClick={() => setMostrarAyudaDigito(v => !v)}
                        aria-expanded={mostrarAyudaDigito}
                        className="flex items-center gap-1 text-xs font-semibold text-ankawa-rose hover:text-ankawa-rose-hover transition-colors"
                    >
                        <HelpCircle size={14} /> {mostrarAyudaDigito ? 'Ocultar ejemplo' : '¿Dónde lo encuentro?'}
                    </button>
                )}
            </div>
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={digito}
                    onChange={e => setDigito(e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 1).toUpperCase())}
                    placeholder="X"
                    required
                    maxLength={1}
                    className="w-16 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-ankawa-rose focus:ring-2 focus:ring-ankawa-rose/15 transition-shadow"
                />
                <p className="text-xs text-gray-600 leading-snug">
                    Es el número o letra al final de su DNI, resaltado en color.
                </p>
            </div>

            {!esMesaPartes && (
                <div className={`grid transition-all duration-300 ease-out ${mostrarAyudaDigito ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                        <div className={`rounded-xl border border-ankawa-deep/15 bg-ankawa-deep/5 p-3 transition-transform duration-300 ease-out ${mostrarAyudaDigito ? 'translate-y-0' : 'translate-y-2'}`}>
                            <div className="flex items-start gap-2 mb-2.5">
                                <Info size={15} className="text-ankawa-rose mt-0.5 shrink-0" />
                                <p className="text-xs text-ankawa-deep leading-snug">
                                    El <strong>dígito verificador</strong> es el carácter (número o letra) que aparece
                                    <strong> después de su número de DNI</strong>, normalmente en la
                                    <strong> esquina superior derecha</strong> del documento, resaltado en color.
                                </p>
                            </div>
                            <DniEjemploSvg
                                pulso={mostrarAyudaDigito}
                                className="w-full max-w-[18rem] mx-auto rounded-lg border border-ankawa-deep/10 bg-white"
                            />
                            <p className="text-[11px] text-gray-500 text-center mt-2 leading-snug">
                                En el ejemplo, para el DNI <strong className="text-ankawa-deep">47654321</strong> el
                                dígito verificador es <strong className="text-emerald-600">2</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Campos del paso identidad como array para que Reveal pueda escalonarlos
    const camposIdentidad = [
        <div key="correo">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
            <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className={inputClasses}
            />
            <p className="text-xs text-gray-500 mt-1">No se aceptan correos temporales o desechables.</p>
        </div>,

        <div key="dni">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">DNI</label>
            <input
                type="text"
                inputMode="numeric"
                value={numeroDoc}
                onChange={e => setNumeroDoc(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="8 dígitos"
                required
                className={inputClasses}
            />
        </div>,

        bloqueDigito,

        hcaptchaSiteKey && (
            <div key="captcha" className="flex justify-center pt-1">
                <div ref={captchaRef} />
            </div>
        ),

        error && (
            <div key="error" className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
            </div>
        ),

        <button
            key="submit"
            type="submit"
            disabled={cargando}
            className="relative overflow-hidden group/btn w-full flex items-center justify-center gap-2 py-3 bg-ankawa-rose text-white rounded-xl font-bold text-sm hover:bg-ankawa-rose-hover disabled:opacity-60 transition-colors"
        >
            {esMesaPartes && (
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
                    <span className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-[160%] skew-x-[-20deg] motion-safe:group-hover/btn:animate-shine"></span>
                </span>
            )}
            {cargando ? 'Verificando…' : <><span>Continuar</span><ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform duration-300" /></>}
        </button>,

        // En mesa-partes la nota RENIEC vive en la columna del ejemplo
        !esMesaPartes && (
            <p key="legal" className="text-xs text-gray-500 text-center leading-snug">
                Validamos su identidad ante RENIEC como medida de seguridad legal.
                Si representa a una empresa, los datos del RUC se piden dentro del formulario.
            </p>
        ),
    ];

    // Encabezado del paso identidad (escudo + título + subtítulo)
    const encabezadoIdentidad = (
        <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-ankawa-rose/10 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck size={22} className="text-ankawa-rose" />
            </div>
            <h1 className="text-xl font-black text-ankawa-deep">{titulo}</h1>
            <p className="text-sm text-gray-500 mt-1">
                {subtitulo}
            </p>
        </div>
    );

    // Columna derecha (solo mesa-partes): ejemplo del DNI siempre visible, sin toggle
    const columnaEjemplo = (
        <div className="h-full p-6 lg:p-8 border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col justify-center">
            <div className="flex items-start gap-2 mb-4">
                <Info size={15} className="text-ankawa-rose mt-0.5 shrink-0" />
                <p className="text-xs text-ankawa-deep leading-snug">
                    El <strong>dígito verificador</strong> es el carácter (número o letra) que aparece
                    <strong> después de su número de DNI</strong>, normalmente en la
                    <strong> esquina superior derecha</strong> del documento, resaltado en color.
                </p>
            </div>
            <DniEjemploSvg
                pulso
                className="w-full max-w-xs mx-auto rounded-lg border border-ankawa-deep/10 bg-white"
            />
            <p className="text-[11px] text-gray-500 text-center mt-2 leading-snug">
                En el ejemplo, para el DNI <strong className="text-ankawa-deep">47654321</strong> el
                dígito verificador es <strong className="text-emerald-600">2</strong>.
            </p>
            <p className="text-xs text-gray-500 text-center leading-snug mt-5 pt-4 border-t border-gray-100">
                Validamos su identidad ante RENIEC como medida de seguridad legal.
                Si representa a una empresa, los datos del RUC se piden dentro del formulario.
            </p>
        </div>
    );

    const contenidoOtp = (
        <>
            <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-ankawa-rose/10 flex items-center justify-center mx-auto mb-3">
                    <KeyRound size={22} className="text-ankawa-rose" />
                </div>
                <h1 className="text-xl font-black text-ankawa-deep">Código de verificación</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Enviamos un código a<br />
                    <span className="font-semibold text-ankawa-deep">{email}</span>
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
                            className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-ankawa-rose focus:ring-2 focus:ring-ankawa-rose/15 transition-shadow"
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
                    className="w-full flex items-center justify-center gap-2 py-3 bg-ankawa-rose text-white rounded-xl font-bold text-sm hover:bg-ankawa-rose-hover disabled:opacity-60 transition-colors"
                >
                    {cargando ? 'Verificando…' : <><CheckCircle2 size={16} /><span>Ingresar</span></>}
                </button>
                <button
                    type="button"
                    onClick={reenviarCodigo}
                    disabled={cargando || reenvioEn > 0}
                    className="w-full text-xs font-semibold text-ankawa-rose hover:text-ankawa-rose-hover disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
    );

    // Clase del cross-fade + slide entre pasos (solo tras una transición real)
    const stepAnimClass = esMesaPartes && dirPaso
        ? (dirPaso === 'right' ? 'motion-safe:animate-step-in-right' : 'motion-safe:animate-step-in-left')
        : '';

    const volverInicio = (
        <Link
            href={route('welcome')}
            className="group inline-flex items-center text-gray-500 hover:text-ankawa-rose transition-all duration-300 font-medium"
        >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 group-hover:bg-ankawa-rose/10 transition-colors">
                <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform duration-300" />
            </div>
            <span className="text-sm">Volver al inicio</span>
        </Link>
    );

    // ── Variante Mesa de Partes: card ancha de 2 columnas, centrada y simétrica ──
    if (esMesaPartes) {
        return (
            <div className="min-h-screen bg-[#FAF8F9] flex flex-col relative">
                <Head title={headTitle} />
                <LoginEnvioOverlay visible={overlayEnvio && cargando && step === 'identidad'} />

                {/* Halo radial tonal, completo y simétrico, detrás de la card */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 55% 45% at 50% 58%, rgba(41, 17, 54, 0.04), transparent 70%)' }}
                />

                {/* Header institucional (mismo patrón que GuestLayout / login de Expedientes) */}
                <Reveal direction="down" duration={700} className="relative z-20">
                    <nav className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6">
                            <div className="flex justify-between items-center h-16 lg:h-[72px]">
                                <Link href="/" className="flex items-center gap-4 group">
                                    {/* El águila gira sobre su eje (rotateY 360°) al pasar el cursor */}
                                    <picture className="[perspective:600px]">
                                        <source srcSet="/logo.webp" type="image/webp" />
                                        <img
                                            src="/logo.png"
                                            alt="CARD Ankawa"
                                            className="h-11 lg:h-12 w-auto object-contain transition-transform duration-700 ease-out motion-safe:group-hover:[transform:rotateY(360deg)]"
                                        />
                                    </picture>
                                    <div className="hidden sm:block border-l border-gray-200 pl-4">
                                        <p className="text-xs font-bold text-ankawa-deep uppercase tracking-widest leading-tight">
                                            Centro de Arbitraje y
                                        </p>
                                        <p className="text-xs font-bold text-ankawa-deep uppercase tracking-widest leading-tight">
                                            Resolución de Disputas
                                        </p>
                                        <p className="text-xs font-semibold text-ankawa-rose uppercase tracking-wider mt-0.5">
                                            Ankawa Internacional
                                        </p>
                                    </div>
                                </Link>

                                <div className="flex items-center gap-2 sm:gap-5">
                                    <Link
                                        href={route('welcome')}
                                        className="group/nav relative hidden md:flex items-center gap-1.5 text-gray-500 hover:text-ankawa-deep text-sm font-medium transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-ankawa-rose after:transition-transform after:duration-300"
                                    >
                                        <Home size={16} className="text-ankawa-rose/70 group-hover/nav:text-ankawa-rose transition-colors duration-300" />
                                        Inicio
                                    </Link>
                                    <a
                                        href="mailto:soportetecnico@ankawainternacional.org"
                                        className="group/nav relative hidden md:flex items-center gap-1.5 text-gray-500 hover:text-ankawa-deep text-sm font-medium transition-colors duration-300 after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:h-0.5 after:w-full after:origin-left after:scale-x-0 hover:after:scale-x-100 after:bg-ankawa-rose after:transition-transform after:duration-300"
                                    >
                                        <Headphones size={16} className="text-ankawa-rose/70 group-hover/nav:text-ankawa-rose transition-colors duration-300" />
                                        Soporte
                                    </a>
                                    <Link
                                        href="/login"
                                        className="flex items-center gap-2 bg-ankawa-rose text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-ankawa-rose-hover transition-all duration-300 ease-out shadow-sm shadow-ankawa-rose/20 motion-safe:hover:-translate-y-0.5"
                                    >
                                        <Lock size={15} />
                                        Iniciar Sesión
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </nav>
                </Reveal>

                <div className="flex-1 flex flex-col items-center justify-center relative px-4 py-2">
                    {/* Reveal (transición) y no animate-fade-in (keyframe con fill both):
                        la capa de composición retenida pintaba el recuadro del logo con un
                        tinte ligeramente distinto al del fondo off-white */}
                    <Reveal direction="fade" duration={900} className="mb-2">
                        <picture>
                            <source srcSet="/logo.webp" type="image/webp" />
                            <img src="/logo.png" alt="Ankawa Internacional" className="h-32 lg:h-48 w-auto object-contain" />
                        </picture>
                    </Reveal>

                    <Reveal
                        direction="zoom"
                        duration={700}
                        className={`w-full ${step === 'identidad' ? 'max-w-[1060px]' : 'max-w-md'}`}
                    >
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="h-1.5 bg-gradient-to-r from-ankawa-deep via-ankawa-rose to-ankawa-deep" />
                            <div key={step} className={stepAnimClass}>
                                {step === 'identidad' ? (
                                    <Reveal
                                        staggerChildren={120}
                                        duration={500}
                                        className="grid grid-cols-1 lg:grid-cols-2"
                                        childClassName="h-full"
                                    >
                                        <div className="p-6 lg:p-8">
                                            {encabezadoIdentidad}
                                            <form onSubmit={enviarCodigo}>
                                                <Reveal staggerChildren={80} duration={500} delay={120} className="space-y-4">
                                                    {camposIdentidad}
                                                </Reveal>
                                            </form>
                                        </div>
                                        {columnaEjemplo}
                                    </Reveal>
                                ) : (
                                    <div className="p-6 sm:p-8">
                                        {contenidoOtp}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Reveal>

                    <p className="text-xs text-gray-400 mt-3 relative">
                        The Ankawa Global Group SAC — Plataforma de Expedientes Electrónicos
                    </p>
                </div>
            </div>
        );
    }

    // ── Variante Portal (default): centrada y sobria, como siempre ──
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col p-4">
            <Head title={headTitle} />

            <LoginEnvioOverlay visible={overlayEnvio && cargando && step === 'identidad'} />

            {/* Header con botón Volver al inicio */}
            <div className="w-full max-w-5xl mx-auto pt-2 pb-4">
                {volverInicio}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="mb-5">
                    <img src="/logo.png" alt="Ankawa" className="h-12 object-contain" />
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
                    <div className="h-1.5 bg-gradient-to-r from-ankawa-deep via-ankawa-rose to-ankawa-deep" />
                    <div className="p-6">
                        {step === 'identidad' ? (
                            <>
                                {encabezadoIdentidad}
                                <form onSubmit={enviarCodigo}>
                                    <div className="space-y-4">{camposIdentidad}</div>
                                </form>
                            </>
                        ) : (
                            contenidoOtp
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-6">The Ankawa Global Group SAC — Plataforma de Expedientes Electrónicos</p>
            </div>
        </div>
    );
}
