import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, FileText, ArrowRight, Home, Copy, Check } from 'lucide-react';

export default function Confirmacion({ numeroCargo }) {
    const [copiado, setCopiado] = useState(false);

    async function copiarNumero() {
        try {
            await navigator.clipboard.writeText(numeroCargo);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2500);
        } catch {
            // Clipboard no disponible (http o navegador antiguo): el número queda visible para copiarlo a mano.
        }
    }

    return (
        <>
            <Head title="Solicitud Enviada" />

            <div className="min-h-screen bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">

                    {/* Header con gradiente de marca; el check emerald queda como acento de éxito */}
                    <div
                        className="px-8 py-10 text-center"
                        style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 50%, #BE0F4A 100%)' }}
                    >
                        <div className="w-20 h-20 bg-white/15 border border-white/25 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={44} className="text-emerald-300" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-1">
                            ¡Solicitud Enviada!
                        </h1>
                        <p className="text-white/80 text-sm">
                            Su solicitud ha sido recibida correctamente
                        </p>
                    </div>

                    <div className="p-8">

                        {/* Número de cargo */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#BE0F4A]/10 flex items-center justify-center shrink-0">
                                    <FileText size={22} className="text-[#BE0F4A]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">
                                        Número de Cargo
                                    </p>
                                    <p className="text-xl font-extrabold text-[#291136] tracking-wider">
                                        {numeroCargo}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={copiarNumero}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 ${
                                        copiado
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A]'
                                    }`}
                                >
                                    {copiado ? <Check size={14} /> : <Copy size={14} />}
                                    {copiado ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                                Este es su comprobante de recepción. <strong>Guárdelo</strong>: lo necesitará
                                para consultar el estado de su solicitud.
                            </p>
                        </div>

                        <ul className="text-sm text-gray-600 space-y-3 mb-8">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                Se ha enviado un correo con su acuse de recibo y credenciales de acceso.
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                La Secretaría General revisará su solicitud en un plazo de 5 días hábiles.
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                                Puede hacer seguimiento desde <strong>Mis Solicitudes</strong> en cualquier momento.
                            </li>
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href={route('mesa-partes.mis-solicitudes')}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#3D1A52] transition-colors"
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
