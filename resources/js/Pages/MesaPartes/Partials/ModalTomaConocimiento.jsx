import { useState } from 'react';
import { router } from '@inertiajs/react';

const BADGE_ESTADO = {
    activo:     'bg-emerald-100 text-emerald-700',
    suspendido: 'bg-amber-100 text-amber-700',
    concluido:  'bg-gray-100 text-gray-600',
};

export default function ModalTomaConocimiento({ pendientes }) {
    const [lista,      setLista]      = useState(pendientes);
    const [checked,    setChecked]    = useState(false);
    const [procesando, setProcesando] = useState(false);

    if (lista.length === 0) return null;

    const exp    = lista[0];
    const total  = pendientes.length;
    const actual = total - lista.length + 1;

    function aceptar() {
        if (!checked || procesando) return;
        setProcesando(true);
        router.post(
            route('mesa-partes.aceptarConocimiento', exp.id),
            {},
            {
                onSuccess: () => {
                    setLista(prev => prev.slice(1));
                    setChecked(false);
                    setProcesando(false);
                },
                onError: () => setProcesando(false),
            }
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(41, 17, 54, 0.85)' }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

                {/* Header rojo sólido */}
                <div className="px-6 pt-6 pb-5 bg-[#BE0F4A]">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                            Toma de Conocimiento
                        </span>
                        <div className="flex items-center gap-2">
                            {total > 1 && (
                                <span className="text-[10px] font-semibold text-white/60">{actual} / {total}</span>
                            )}
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${BADGE_ESTADO[exp.estado] ?? 'bg-white/20 text-white'}`}>
                                {exp.estado}
                            </span>
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{exp.numero_expediente}</h2>
                    <p className="text-sm text-white/70 mt-0.5">{exp.servicio}</p>
                </div>

                {/* Cuerpo */}
                <div className="px-6 py-5 space-y-4">
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Ha sido notificado como parte en este proceso. Al continuar, queda constancia de que:
                    </p>
                    <ul className="space-y-2">
                        {[
                            'Recibió la notificación enviada a su correo electrónico.',
                            'Tiene conocimiento de su participación en este proceso.',
                            'Acepta ser notificado por este portal y por correo.',
                            'Esta aceptación se registra con fecha, hora e IP como constancia legal.',
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#BE0F4A] shrink-0"/>
                                {item}
                            </li>
                        ))}
                    </ul>

                    {/* Checkbox */}
                    <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-colors ${
                        checked ? 'bg-gray-50 border-[#291136]/20' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#291136] shrink-0"/>
                        <span className="text-sm font-semibold text-gray-700 leading-snug">
                            He leído lo anterior y doy por notificado el expediente <span className="text-[#291136]">{exp.numero_expediente}</span>.
                        </span>
                    </label>

                    {/* Botón */}
                    <button
                        onClick={aceptar}
                        disabled={!checked || procesando}
                        className="w-full py-2.5 text-sm font-bold text-white bg-[#291136] rounded-xl hover:bg-[#3d1a52] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {procesando ? 'Registrando...' : total > 1 && actual < total ? 'Aceptar y siguiente →' : 'Aceptar y continuar →'}
                    </button>

                    <p className="text-[10px] text-center text-gray-400">
                        Se registra tu IP y dispositivo como constancia en el historial del expediente.
                    </p>
                </div>
            </div>
        </div>
    );
}
