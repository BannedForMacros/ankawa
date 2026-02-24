import { Link } from '@inertiajs/react';
import { CheckCircle2, Mail, LogIn } from 'lucide-react';

export default function Confirmacion({ numeroCargo }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="bg-[#291136] px-8 py-6 text-center">
                    <img src="/logo-white.png" alt="Ankawa" className="h-10 mx-auto mb-3" />
                    <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mt-2">
                        <CheckCircle2 size={30} className="text-white" />
                    </div>
                </div>
                <div className="h-1 bg-[#BE0F4A]" />

                {/* Contenido */}
                <div className="p-8 text-center">
                    <h1 className="text-2xl font-extrabold text-[#291136] mb-2">
                        Solicitud Recibida
                    </h1>
                    <p className="text-gray-500 text-sm mb-6">
                        Su solicitud ha sido registrada exitosamente en el sistema.
                    </p>

                    <div className="bg-[#291136]/5 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Numero de Cargo</p>
                        <p className="text-2xl font-extrabold text-[#291136] tracking-widest">{numeroCargo}</p>
                    </div>

                    <div className="space-y-3 text-sm text-left text-gray-600 mb-8">
                        <div className="flex items-start gap-3">
                            <Mail size={16} className="text-[#BE0F4A] mt-0.5 shrink-0" />
                            <span>
                                Hemos enviado a su correo el <strong>cargo de presentacion</strong> en PDF
                                junto con sus <strong>credenciales de acceso</strong> al sistema.
                            </span>
                        </div>
                        <div className="flex items-start gap-3">
                            <LogIn size={16} className="text-[#BE0F4A] mt-0.5 shrink-0" />
                            <span>
                                Con esas credenciales podra ingresar y hacer seguimiento
                                del estado de su expediente.
                            </span>
                        </div>
                    </div>

                    <Link
                        href={route('login')}
                        className="block w-full text-center bg-[#BE0F4A] hover:bg-[#BC1D35] text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        Ingresar al Sistema
                    </Link>
                </div>
            </div>
        </div>
    );
}