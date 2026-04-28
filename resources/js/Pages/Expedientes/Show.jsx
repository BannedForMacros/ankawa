import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Clock, FileText, Users, PlusCircle, AlertCircle, ClipboardList, ArrowRight, Info, Briefcase, Layers, UserCheck, Timer, Inbox } from 'lucide-react';
import TabHistorial from './Partials/TabHistorial';
import TabNuevoMovimiento from './Partials/TabNuevoMovimiento';
import TabAccionPendiente from './Partials/TabAccionPendiente';
import TabActores from './Partials/TabActores';
import TabSolicitud from './Partials/TabSolicitud';
import TabEnvios from './Partials/TabEnvios';

const estadoLabel = {
    activo:     'Activo',
    suspendido: 'Suspendido',
    concluido:  'Concluido',
};

export default function Show({
    expediente,
    esGestor,
    puedeDesignarGestor,
    miAccionPendiente,
    etapas,
    tiposActor,
    usuariosAsignables,
    actoresNotificables,
    plazo,
    tiposDocumento,
    tiposResolucion,
    enviosCount = 0,
    miTipoActorId = null,
}) {
    const [enviosBadge, setEnviosBadge] = useState(enviosCount);

    useEffect(() => { setEnviosBadge(enviosCount); }, [enviosCount]);

    const tabs = [];

    tabs.push({ id: 'historial', label: 'Historial', Icon: Clock });

    if (expediente.solicitud) {
        const pendienteRevision = esGestor && !expediente.solicitud.resultado_revision;
        tabs.push({ id: 'solicitud', label: 'Solicitud', Icon: ClipboardList, alerta: pendienteRevision });
    }

    if (esGestor && expediente.estado === 'activo') {
        tabs.push({ id: 'nuevo', label: 'Nuevo Movimiento', Icon: PlusCircle });
    }

    if (miAccionPendiente) {
        tabs.push({ id: 'accion', label: 'Mi Acción Pendiente', Icon: AlertCircle });
    }

    tabs.push({ id: 'envios', label: 'Envíos', Icon: Inbox, badge: enviosBadge });
    tabs.push({ id: 'actores', label: 'Actores', Icon: Users });

    const [activeTab, setActiveTab] = useState(miAccionPendiente ? 'accion' : 'historial');

    useEffect(() => {
        if (!miAccionPendiente && activeTab === 'accion') {
            setActiveTab('historial');
        }
    }, [miAccionPendiente]);

    const gestor = expediente.actores?.find(a => a.es_gestor && a.activo);
    const solicitud = expediente.solicitud;

    // ── Banner de próximo paso (solo para el gestor) ──────────────────────
    const proximoPaso = (() => {
        if (!esGestor || expediente.estado !== 'activo') return null;

        if (!gestor) return {
            tipo: 'urgente',
            texto: 'Primero debes designar un Gestor para este expediente.',
            accion: 'Ir a Actores',
            tab: 'actores',
        };

        if (solicitud && !solicitud.resultado_revision) return {
            tipo: 'alerta',
            texto: 'Debes revisar la solicitud y declarar si es CONFORME o NO CONFORME antes de continuar.',
            accion: 'Revisar solicitud',
            tab: 'solicitud',
        };

        if (solicitud?.resultado_revision === 'no_conforme' && solicitud?.estado === 'subsanacion') return {
            tipo: 'info',
            texto: 'La solicitud fue declarada NO CONFORME. Esperando subsanación del demandante.',
            accion: null,
        };

        if (miAccionPendiente) return {
            tipo: 'alerta',
            texto: 'Tienes una acción pendiente que requiere tu respuesta.',
            accion: 'Ver mi acción',
            tab: 'accion',
        };

        if (solicitud?.resultado_revision === 'conforme') return {
            tipo: 'ok',
            texto: 'Solicitud admitida. Puedes crear el siguiente movimiento del proceso.',
            accion: 'Nuevo movimiento',
            tab: 'nuevo',
        };

        return null;
    })();

    const bannerColors = {
        urgente: 'bg-red-50 border-red-300 text-red-800',
        alerta:  'bg-amber-50 border-amber-300 text-amber-800',
        info:    'bg-blue-50 border-blue-200 text-blue-800',
        ok:      'bg-emerald-50 border-emerald-200 text-emerald-800',
    };

    return (
        <AuthenticatedLayout>
            <Head title={expediente.numero_expediente ?? 'Expediente'} />

            <PageHeader
                title={expediente.numero_expediente ?? `EXP-${expediente.id}`}
                backHref={route('expedientes.index')}
                backLabel="Expedientes"
                badge={
                    <span className={{
                        activo:     'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200',
                        suspendido: 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200',
                        concluido:  'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200',
                    }[expediente.estado] ?? 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200'}>
                        {estadoLabel[expediente.estado] ?? expediente.estado}
                    </span>
                }
                meta={[
                    { Icon: Briefcase, label: 'Servicio', value: expediente.servicio?.nombre ?? '—' },
                    { Icon: Layers,    label: 'Etapa',    value: expediente.etapa_actual?.nombre ?? '—', highlight: true },
                    { Icon: UserCheck, label: 'Gestor',   value: gestor?.usuario?.name ?? 'Sin designar' },
                    { Icon: Timer,     label: 'Plazos',   value: `${plazo.pendientes} pendiente(s)${plazo.por_vencer > 0 ? ` · ${plazo.por_vencer} por vencer` : ''}${plazo.vencidos > 0 ? ` · ${plazo.vencidos} vencido(s)` : ''}` },
                ]}
            />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Banner próximo paso ── */}
                    {proximoPaso && (
                        <div className={`flex items-center justify-between gap-4 px-5 py-3.5 rounded-2xl border ${bannerColors[proximoPaso.tipo]}`}>
                            <div className="flex items-center gap-3 text-sm font-semibold">
                                <Info size={16} className="shrink-0"/>
                                <span>📌 <strong>¿Qué sigue?</strong> {proximoPaso.texto}</span>
                            </div>
                            {proximoPaso.accion && (
                                <button
                                    onClick={() => setActiveTab(proximoPaso.tab)}
                                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white/70 border border-current/20 whitespace-nowrap hover:bg-white transition-colors"
                                >
                                    {proximoPaso.accion} <ArrowRight size={12}/>
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Tabs ── */}
                    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                        {tabs.map(({ id, label, Icon, alerta, badge }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === id
                                        ? 'border-[#BE0F4A] text-[#BE0F4A]'
                                        : 'border-transparent text-gray-400 hover:text-[#291136]'
                                }`}
                            >
                                <Icon size={15}/>
                                {label}
                                {(id === 'accion' || alerta) && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
                                )}
                                {badge > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#BE0F4A] text-white text-[10px] font-black">
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Contenido ── */}
                    {activeTab === 'historial' && (
                        <TabHistorial
                            movimientos={expediente.movimientos ?? []}
                            solicitud={expediente.solicitud}
                            esGestor={esGestor}
                            expedienteId={expediente.id}
                            tiposResolucion={tiposResolucion ?? []}
                            onIrANuevo={esGestor && expediente.estado === 'activo' ? () => setActiveTab('nuevo') : null}
                            actores={expediente.actores ?? []}
                        />
                    )}

                    {activeTab === 'solicitud' && expediente.solicitud && (
                        <TabSolicitud
                            expediente={expediente}
                            solicitud={expediente.solicitud}
                            esGestor={esGestor}
                            etapas={etapas}
                            tiposActor={tiposActor}
                            actoresNotificables={actoresNotificables}
                            tiposDocumento={tiposDocumento ?? []}
                            miTipoActorId={miTipoActorId}
                        />
                    )}

                    {activeTab === 'nuevo' && esGestor && (
                        <TabNuevoMovimiento
                            expediente={expediente}
                            etapas={etapas}
                            tiposActor={tiposActor}
                            usuariosAsignables={usuariosAsignables}
                            actoresNotificables={actoresNotificables}
                            tiposDocumento={tiposDocumento}
                            miTipoActorId={miTipoActorId}
                        />
                    )}

                    {activeTab === 'accion' && miAccionPendiente && (
                        <TabAccionPendiente
                            expediente={expediente}
                            movimiento={miAccionPendiente}
                            actoresNotificables={actoresNotificables}
                            esGestor={esGestor}
                            etapas={etapas}
                            tiposActor={tiposActor}
                            usuariosAsignables={usuariosAsignables}
                            tiposDocumento={tiposDocumento}
                        />
                    )}

                    {activeTab === 'actores' && (
                        <TabActores
                            expediente={expediente}
                            esGestor={esGestor}
                            puedeDesignarGestor={puedeDesignarGestor}
                            tiposActorConfig={tiposActor}
                            usuariosAsignables={usuariosAsignables}
                        />
                    )}

                    {activeTab === 'envios' && (
                        <TabEnvios
                            expedienteId={expediente.id}
                            onCambio={() => router.reload({ only: ['enviosCount', 'expediente'] })}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
