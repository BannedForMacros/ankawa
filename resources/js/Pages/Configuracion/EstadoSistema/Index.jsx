import { useState, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import {
    Clock, Cpu, Radio, Antenna, Database, HardDrive, Mail, AlarmClock,
    Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Pause, Play,
} from 'lucide-react';

// Mapa de iconos por clave que envía el backend (SystemHealthService).
const ICONOS = { Clock, Cpu, Radio, Antenna, Database, HardDrive, Mail, AlarmClock };

// Estética por estado.
const ESTILO = {
    ok:           { punto: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', borde: 'border-l-emerald-400', Icon: CheckCircle2, label: 'Operativo' },
    warn:         { punto: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 border-amber-200',       borde: 'border-l-amber-400',   Icon: AlertTriangle, label: 'Atención' },
    error:        { punto: 'bg-red-500',     chip: 'bg-red-50 text-red-700 border-red-200',             borde: 'border-l-red-400',     Icon: XCircle,       label: 'Caído' },
    desconocido:  { punto: 'bg-gray-400',    chip: 'bg-gray-100 text-gray-600 border-gray-200',         borde: 'border-l-gray-300',    Icon: HelpCircle,    label: 'Sin datos' },
};

const RESUMEN = {
    ok:    { wrap: 'bg-emerald-50 border-emerald-200', texto: 'text-emerald-800', titulo: 'Todos los servicios operativos' },
    warn:  { wrap: 'bg-amber-50 border-amber-200',     texto: 'text-amber-800',   titulo: 'Hay servicios que requieren atención' },
    error: { wrap: 'bg-red-50 border-red-200',         texto: 'text-red-800',     titulo: 'Hay servicios críticos caídos' },
};

const INTERVALO_MS = 10000;

function horaCorta(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '—'; }
}

function TarjetaServicio({ servicio }) {
    const est = ESTILO[servicio.estado] ?? ESTILO.desconocido;
    const Icon = ICONOS[servicio.icono] ?? Activity;

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${est.borde} p-5`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#291136]/5 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[#291136]" />
                    </div>
                    <div>
                        <h3 className="font-bold text-[#291136] leading-tight">{servicio.nombre}</h3>
                        {servicio.critico && (
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-[#BE0F4A]">Crítico</span>
                        )}
                    </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${est.chip}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${est.punto} ${servicio.estado === 'error' ? 'animate-pulse' : ''}`} />
                    {est.label}
                </span>
            </div>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">{servicio.mensaje}</p>

            {Array.isArray(servicio.detalle) && servicio.detalle.length > 0 && (
                <dl className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {servicio.detalle.map((d, i) => (
                        <div key={i} className="flex flex-col">
                            <dt className="text-[10px] uppercase tracking-wide font-semibold text-gray-400">{d.label}</dt>
                            <dd className="text-xs text-gray-700 font-medium break-words">{d.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

export default function Index({ inicial }) {
    const [snapshot, setSnapshot] = useState(inicial ?? null);
    const [error, setError] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [auto, setAuto] = useState(true);
    const timer = useRef(null);

    const refrescar = useCallback(async () => {
        setCargando(true);
        try {
            const { data } = await window.axios.get('/configuracion/estado-sistema/check');
            setSnapshot(data);
            setError(false);
        } catch {
            setError(true);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (!auto) return;
        timer.current = setInterval(refrescar, INTERVALO_MS);
        return () => clearInterval(timer.current);
    }, [auto, refrescar]);

    const servicios = snapshot?.servicios ?? [];
    const global = snapshot?.global ?? 'desconocido';
    const res = RESUMEN[global] ?? RESUMEN.warn;

    return (
        <AuthenticatedLayout>
            <ConfigHeader
                breadcrumb={[{ label: 'Configuración' }, { label: 'Estado del Sistema' }]}
                title="Estado del"
                titleAccent="Sistema"
                description="Monitoreo en vivo de los servicios de infraestructura: cron, worker de colas, WebSocket (Reverb), broadcasting y soporte."
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setAuto((a) => !a)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#291136] bg-gray-100 hover:bg-gray-200 transition-colors"
                            title={auto ? 'Pausar auto-actualización' : 'Reanudar auto-actualización'}
                        >
                            {auto ? <Pause size={16} /> : <Play size={16} />}
                            {auto ? 'Auto 10s' : 'Pausado'}
                        </button>
                        <button
                            type="button"
                            onClick={refrescar}
                            disabled={cargando}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-ankawa-rose hover:bg-ankawa-rose-hover shadow-lg shadow-ankawa-rose/25 transition-all disabled:opacity-60"
                        >
                            <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
                            Actualizar
                        </button>
                    </div>
                }
            />

            <div className="px-6 sm:px-10 py-6 max-w-6xl">
                {/* Error state */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800">No se pudo obtener el estado del sistema</p>
                            <p className="text-sm text-red-700 mt-0.5">Falló la consulta al servidor. Reintenta en unos segundos.</p>
                        </div>
                        <button onClick={refrescar} className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-700 bg-red-100 hover:bg-red-200 transition-colors">
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Empty / loading inicial */}
                {!snapshot && !error ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-gray-200" />
                                <div className="h-4 bg-gray-200 rounded w-1/2 mt-3" />
                                <div className="h-3 bg-gray-200 rounded w-3/4 mt-3" />
                            </div>
                        ))}
                    </div>
                ) : snapshot ? (
                    <>
                        {/* Resumen global */}
                        <div className={`mb-6 rounded-xl border p-4 flex items-center justify-between gap-4 flex-wrap ${res.wrap}`}>
                            <div className="flex items-center gap-3">
                                <Activity className={`w-6 h-6 ${res.texto}`} />
                                <div>
                                    <p className={`font-bold ${res.texto}`}>{res.titulo}</p>
                                    <p className={`text-xs ${res.texto} opacity-80`}>
                                        Última lectura: {horaCorta(snapshot.generado_at)}
                                        {cargando && ' · actualizando…'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-semibold">
                                {['ok', 'warn', 'error'].map((k) => {
                                    const n = servicios.filter((s) => s.estado === k).length;
                                    const e = ESTILO[k];
                                    return (
                                        <span key={k} className="inline-flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${e.punto}`} />
                                            <span className={res.texto}>{n} {e.label}</span>
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tarjetas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {servicios.map((s) => <TarjetaServicio key={s.clave} servicio={s} />)}
                        </div>
                    </>
                ) : null}
            </div>
        </AuthenticatedLayout>
    );
}
