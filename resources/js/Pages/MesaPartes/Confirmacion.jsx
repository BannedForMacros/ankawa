import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, FileText, ArrowRight, Home } from 'lucide-react';

export default function Confirmacion({ numeroCargo }) {
    return (
        <>
            <Head title="Solicitud Enviada" />

            <div className="min-h-screen bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">

                    {/* Header verde */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-10 text-center">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={44} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-white mb-1">
                            ¡Solicitud Enviada!
                        </h1>
                        <p className="text-white/80 text-sm">
                            Su solicitud ha sido recibida correctamente
                        </p>
                    </div>

                    <div className="p-8">

                        {/* Número de cargo */}
                        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#BE0F4A]/10 flex items-center justify-center shrink-0">
                                <FileText size={22} className="text-[#BE0F4A]" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                                    Número de Cargo
                                </p>
                                <p className="text-xl font-extrabold text-[#291136] tracking-wider">
                                    {numeroCargo}
                                </p>
                            </div>
                        </div>

                        <ul className="text-sm text-gray-600 space-y-3 mb-8">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                                Se ha enviado un correo con su acuse de recibo y credenciales de acceso.
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                                La Secretaría General revisará su solicitud en un plazo de 5 días hábiles.
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                                Puede hacer seguimiento desde <strong>Mis Solicitudes</strong> en cualquier momento.
                            </li>
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={route('mesa-partes.mis-solicitudes')}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] transition-colors"
                            >
                                Ver Mis Solicitudes
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href={route('dashboard')}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                <Home size={16} />
                                Inicio
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
