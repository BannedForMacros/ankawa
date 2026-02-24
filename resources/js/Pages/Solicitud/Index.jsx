import { Link } from '@inertiajs/react';
import { ArrowRight, Scale, FileText } from 'lucide-react';

export default function Index({ servicios }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#291136] to-[#4A153D] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">

                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <img src="/logo-white.png" alt="Ankawa Internacional" className="h-16 mx-auto mb-4" />
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        Centro de Arbitraje
                    </h1>
                    <p className="text-white/60 mt-2">Selecciona el tipo de servicio para iniciar tu solicitud</p>
                </div>

                {/* Cards de servicios */}
                <div className="space-y-3">
                    {servicios.map((servicio) => (
                        <Link
                            key={servicio.id}
                            href={route('solicitud.formulario', servicio.id)}
                            className="flex items-center justify-between bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-2xl px-6 py-5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#BE0F4A] flex items-center justify-center shrink-0">
                                    <Scale size={20} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-lg">{servicio.nombre}</p>
                                    {servicio.descripcion && (
                                        <p className="text-white/50 text-sm mt-0.5">{servicio.descripcion}</p>
                                    )}
                                </div>
                            </div>
                            <ArrowRight size={20} className="text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>
                    ))}
                </div>

                <p className="text-center text-white/30 text-xs mt-8">
                    Ankawa Internacional &mdash; Resolucion de Conflictos
                </p>
            </div>
        </div>
    );
}