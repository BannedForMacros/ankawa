import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Lock, ShieldCheck } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Acceso Seguro | CARD ANKAWA" />

            {/* Contenedor Principal: Inmersivo y Oscuro (Firma Visual Ankawa) */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#291136]">
                
                {/* Elemento Arquitectónico de Fondo: Gradiente complejo exigido por el manual */}
                <div 
                    className="absolute inset-0 opacity-60 transform -skew-y-12 scale-125 origin-top-left translate-y-20"
                    style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 50%, #BE0F4A 100%)' }}
                ></div>

                {/* Logo marca de agua gigante */}
                <img src="/logo-white.png" alt="" className="absolute -bottom-20 -left-16 w-[42rem] h-auto opacity-[0.04] -rotate-12 pointer-events-none select-none" />

                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
                    
                    {/* Columna Izquierda: Branding Institucional Imponente */}
                    <div className="w-full lg:w-1/2 text-white/90">
                        {/* Status Pills simulando la interfaz interna */}
                        <div className="flex flex-wrap items-center gap-3 mb-8">
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 text-white uppercase tracking-widest backdrop-blur-sm">
                                Portal Privado
                            </span>
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 bg-[#291136] text-white border border-[#4A153D]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse" />
                                Conexión Cifrada
                            </span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[1.05]">
                            CARD<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 drop-shadow-sm">
                                ANKAWA
                            </span>
                        </h1>

                        {/* Page Hero Pattern adoptado para el texto introductorio */}
                        <div className="mt-8 pl-6 border-l-4 border-[#BE0F4A]">
                            <p className="text-lg lg:text-xl text-white/70 font-normal leading-relaxed max-w-lg">
                                Centro de Arbitraje y Resolución de Disputas.
                                <br />
                                <span className="font-semibold text-white mt-1 block">
                                    Justicia especializada, ágil y transparente.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Columna Derecha: Tarjeta de Login (Estilizada como un 'Expediente Activo') */}
                    <div className="w-full lg:w-[460px]">
                        <div className="bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-gray-100 border-l-4 border-l-[#BE0F4A] p-8 sm:p-10 relative">
                            
                            {/* Icono flotante superior */}
                            <div className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-[#291136] text-white flex items-center justify-center shadow-lg border-4 border-white transition-transform hover:scale-105">
                                <ShieldCheck className="w-6 h-6 text-[#BE0F4A]" />
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-black text-[#291136] tracking-tight uppercase">
                                    Identificación
                                </h2>
                                <p className="text-gray-500 text-sm mt-1 font-normal">
                                    Ingrese sus credenciales para acceder al sistema
                                </p>
                            </div>

                            {status && (
                                <div className="mb-6 rounded-md bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 border-l-4 border-emerald-400">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-6">
                                {/* Campo de Correo Electrónico */}
                                <div>
                                    <InputLabel 
                                        htmlFor="email" 
                                        value="Correo Electrónico" 
                                        className="text-[#291136] font-semibold text-xs uppercase tracking-wider mb-2" 
                                    />
                                    <div className="relative">
                                        <TextInput
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="block w-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A] rounded-md shadow-sm text-sm text-gray-800 transition-all duration-200 py-2.5"
                                            autoComplete="username"
                                            isFocused={true}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="operador@ankawa.com"
                                        />
                                    </div>
                                    <InputError message={errors.email} className="mt-2 text-[#BE0F4A]" />
                                </div>

                                {/* Campo de Contraseña */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <InputLabel 
                                            htmlFor="password" 
                                            value="Contraseña" 
                                            className="text-[#291136] font-semibold text-xs uppercase tracking-wider" 
                                        />
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-xs font-semibold text-gray-400 hover:text-[#BE0F4A] transition-colors duration-200 focus:outline-none"
                                            >
                                                ¿OLVIDÓ SU CLAVE?
                                            </Link>
                                        )}
                                    </div>
                                    <TextInput
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="block w-full border-gray-200 bg-gray-50 focus:bg-white focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A] rounded-md shadow-sm text-sm text-gray-800 transition-all duration-200 py-2.5"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    <InputError message={errors.password} className="mt-2 text-[#BE0F4A]" />
                                </div>

                                {/* Controles inferiores */}
                                <div className="flex items-center justify-between pt-2">
                                    <label className="flex items-center cursor-pointer group">
                                        <Checkbox
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) => setData('remember', e.target.checked)}
                                            className="rounded-sm border-gray-300 text-[#BE0F4A] shadow-sm focus:ring-[#BE0F4A] transition duration-150 group-hover:border-[#B23241]"
                                        />
                                        <span className="ms-2 text-xs font-semibold text-gray-500 group-hover:text-[#291136] transition-colors uppercase tracking-wide">
                                            Mantener sesión
                                        </span>
                                    </label>
                                </div>

                                {/* Botón CTA */}
                                <div className="pt-2">
                                    <PrimaryButton 
                                        className="w-full flex justify-center py-3.5 bg-[#BE0F4A] hover:bg-[#BC1D35] focus:bg-[#B23241] active:bg-[#291136] rounded-md shadow-md transition-all duration-200 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-sm tracking-widest uppercase" 
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <span className="flex items-center gap-2">
                                                <Lock className="w-4 h-4 animate-pulse" /> Validando...
                                            </span>
                                        ) : (
                                            'Ingresar al Sistema'
                                        )}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                        
                        {/* Footer legal miniatura bajo la tarjeta */}
                        <p className="text-center text-white/40 text-xs mt-6 font-medium">
                            &copy; {new Date().getFullYear()} The Ankawa Global Group SAC. <br/> Uso exclusivo y confidencial.
                        </p>
                    </div>

                </div>
            </div>
        </GuestLayout>
    );
}