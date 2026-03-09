import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

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
            <Head title="Iniciar Sesión" />

            {/* Contenedor principal que centra todo el bloque */}
            <div className="flex flex-col items-center justify-center w-full py-10 px-4 sm:px-6 lg:px-8">
                
                {/* Títulos fuera de la tarjeta */}
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Bienvenido de nuevo
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Ingresa tus credenciales para acceder a tu cuenta
                    </p>
                </div>

                {/* Tarjeta blanca del formulario */}
                <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                    {status && (
                        <div className="mb-6 rounded-md bg-green-50 p-4 text-sm font-medium text-green-600 border border-green-200">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        {/* Campo de Correo Electrónico */}
                        <div>
                            <InputLabel htmlFor="email" value="Correo Electrónico" className="text-gray-800 font-medium" />

                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                /* Se sobreescribe el outline azul por el color de la marca (rose-700) */
                                className="mt-2 block w-full focus:border-rose-700 focus:ring-rose-700 rounded-md border-gray-300 shadow-sm transition-colors"
                                autoComplete="username"
                                isFocused={true}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="ejemplo@correo.com"
                            />

                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Campo de Contraseña */}
                        <div>
                            <div className="flex items-center justify-between">
                                <InputLabel htmlFor="password" value="Contraseña" className="text-gray-800 font-medium" />
                                
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm font-medium text-slate-500 hover:text-rose-700 transition duration-150 ease-in-out focus:outline-none focus:underline"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                )}
                            </div>

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-2 block w-full focus:border-rose-700 focus:ring-rose-700 rounded-md border-gray-300 shadow-sm transition-colors"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                            />

                            <InputError message={errors.password} className="mt-2" />
                        </div>


                        {/* Botón de Submit */}
                        <div className="pt-4">
                            <PrimaryButton 
                                /* Se fuerza el color de fondo para que coincida con el logo (rose-700) */
                                className="w-full flex justify-center py-3 bg-rose-700 hover:bg-rose-800 focus:bg-rose-800 active:bg-rose-900 rounded-md shadow-sm transition-all duration-200 ease-in-out disabled:opacity-75 disabled:cursor-not-allowed text-base tracking-wide" 
                                disabled={processing}
                            >
                                {processing ? 'Iniciando...' : 'Iniciar Sesión'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </GuestLayout>
    );
}