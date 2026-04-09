import { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Mail, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';

export default function MesaPartesLogin() {
    const [step,     setStep]     = useState('email');
    const [email,    setEmail]    = useState('');
    const [codigo,   setCodigo]   = useState(['', '', '', '', '', '']);
    const [cargando, setCargando] = useState(false);
    const [error,    setError]    = useState('');
    const inputsRef              = useRef([]);

    async function enviarCodigo(e) {
        e.preventDefault();
        if (!email.trim()) return;
        setCargando(true); setError('');
        try {
            const res = await fetch(route('mesa-partes.enviarCodigo'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (data.ok) {
                setStep('otp');
            } else {
                setError(data.mensaje ?? 'No se pudo enviar el código. Intente nuevamente.');
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.');
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
        // Focus the last filled input or keep current if nothing was added
        inputsRef.current[Math.min(nextFocus + 1, 5)]?.focus();
    }

    async function verificarCodigo(e) {
        e.preventDefault();
        const codigoStr = codigo.join('');
        if (codigoStr.length < 6) return;
        setCargando(true); setError('');
        try {
            const res = await fetch(route('mesa-partes.verificarCodigo'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ email, codigo: codigoStr }),
            });
            const data = await res.json();
            if (data.ok) {
                window.location.href = route('mesa-partes.inicio');
            } else {
                setError(data.mensaje ?? 'Código incorrecto o expirado.');
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4"
             style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <Head title="Mesa de Partes — Ankawa" />

            <div className="mb-8">
                <img src="/logo.png" alt="Ankawa" className="h-14 object-contain" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-[#291136] via-[#BE0F4A] to-[#291136]" />
                <div className="p-8">
                    {step === 'email' ? (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-[#BE0F4A]/10 flex items-center justify-center mx-auto mb-3">
                                    <Mail size={22} className="text-[#BE0F4A]" />
                                </div>
                                <h1 className="text-xl font-black text-[#291136]">Mesa de Partes</h1>
                                <p className="text-sm text-gray-500 mt-1">Ingresa tu correo para ver tus expedientes o presentar una nueva solicitud</p>
                            </div>
                            <form onSubmit={enviarCodigo} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="correo@ejemplo.com" required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#BE0F4A]" />
                                </div>
                                {error && <p className="text-xs text-red-500">{error}</p>}
                                <button type="submit" disabled={cargando}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors">
                                    {cargando ? 'Enviando código...' : <><span>Recibir código</span><ArrowRight size={16}/></>}
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
                                    Enviamos un código a<br/>
                                    <span className="font-semibold text-[#291136]">{email}</span>
                                </p>
                            </div>
                            <form onSubmit={verificarCodigo} className="space-y-4">
                                <div className="flex gap-2 justify-center">
                                    {codigo.map((d, i) => (
                                        <input key={i}
                                            ref={el => inputsRef.current[i] = el}
                                            type="text" inputMode="numeric" maxLength={1}
                                            value={d}
                                            onChange={e => onDigit(i, e.target.value)}
                                            onKeyDown={e => onKeyDown(i, e)}
                                            onPaste={e => handlePaste(e, i)}
                                            className="w-11 h-12 text-center text-lg font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#BE0F4A] transition-colors"
                                        />
                                    ))}
                                </div>
                                {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                                <button type="submit" disabled={cargando || codigo.join('').length < 6}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#BE0F4A] text-white rounded-xl font-bold text-sm hover:bg-[#9c0a3b] disabled:opacity-60 transition-colors">
                                    {cargando ? 'Verificando...' : <><CheckCircle2 size={16}/><span>Ingresar</span></>}
                                </button>
                                <button type="button" onClick={() => { setStep('email'); setCodigo(['','','','','','']); setError(''); }}
                                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                                    ← Cambiar correo
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <p className="text-xs text-gray-400 mt-6">The Ankawa Global Group SAC — Plataforma de Expedientes Electrónicos</p>
        </div>
    );
}
