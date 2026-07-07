import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Clock, FileText, Users, PlusCircle, ClipboardList, ArrowRight, Info, Briefcase, Layers, UserCheck, Timer, Inbox } from 'lucide-react';
import TabHistorial from './Partials/TabHistorial';
import TabNuevoMovimiento from './Partials/TabNuevoMovimiento';
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
    etapas,
    tiposActor,
    usuariosAsignables,
    actoresNotificables,
    actoresEmailValidado = [],
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

    tabs.push({ id: 'envios', label: 'Envíos', Icon: Inbox, badge: enviosBadge });
    tabs.push({ id: 'actores', label: 'Actores', Icon: Users });

    const [activeTab, setActiveTab] = useState('historial');

    const responsables = expediente.actores?.filter(a => a.es_gestor && a.activo) ?? [];
    const responsablePrincipal = responsables[0] ?? null;
    const solicitud = expediente.solicitud;

    // ── Banner de próximo paso (solo para el responsable) ──────────────────
    const proximoPaso = (() => {
        if (!esGestor || expediente.estado !== 'activo') return null;

        if (responsables.length === 0) return {
            tipo: 'urgente',
            texto: 'Aún no hay un Responsable designado para este expediente.',
            accion: 'Ir a Actores',
            tab: 'actores',
        };

        if (solicitud && !solicitud.resultado_revision) return {
            tipo: 'alerta',
            texto: 'Debes revisar la solicitud y declarar si es CONFORME o NO CONFORME antes de continuar.',
            accion: 'Revisar solicitud',
            tab: 'solicitud',
        };

        if (solicitud?.resultado_revision === 'no_conforme' && solicitud?.estado === 'subsanacion') {
            const esJPRD = (expediente.solicitud_type ?? '').includes('JPRD');
            const quien  = esJPRD ? 'la Entidad Contratante' : 'el demandante';
            return {
                tipo: 'info',
                texto: `La solicitud fue declarada NO CONFORME. Esperando subsanación de ${quien}.`,
                accion: null,
            };
        }

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
        info:    'bg-[#291136]/5 border-[#291136]/15 text-[#291136]',   // aviso neutro: tinte de marca, no azul
        ok:      'bg-emerald-50 border-emerald-200 text-emerald-800',
    };

    return (
        <AuthenticatedLayout>
            <Head title={expediente.numero_expediente ?? 'Expediente'} />

            <PageHeader
                breadcrumb={[
                    { label: 'Inicio',       href: route('dashboard') },
                    { label: 'Expedientes',  href: route('expedientes.index') },
                    { label: expediente.numero_expediente ?? `EXP-${expediente.id}` },
                ]}
                title="Expediente"
                titleAccent={expediente.numero_expediente ?? `EXP-${expediente.id}`}
                description={`Detalle, etapas y actuaciones del expediente. Servicio: ${expediente.servicio?.nombre ?? '—'} · Etapa actual: ${expediente.etapa_actual?.nombre ?? '—'}.`}
                image="/images/backgrounds/hero-expedientes.jpg"
            />

            {/* ── Resumen ejecutivo del expediente ── */}
            <div className="bg-white border-b border-ankawa-deep/10">
                <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {[
                            { Icon: Briefcase, label: 'Servicio', value: expediente.servicio?.nombre ?? '—' },
                            { Icon: Layers,    label: 'Etapa',    value: expediente.etapa_actual?.nombre ?? '—', highlight: true },
                            {
                                Icon: UserCheck,
                                label: responsables.length > 1 ? `Responsables (${responsables.length})` : 'Responsable',
                                value: responsables.length === 0
                                    ? 'Sin designar'
                                    : responsables.map(r => r.usuario?.name ?? r.nombre_externo ?? 'Sin nombre').join(' · '),
                            },
                            {
                                Icon: Timer,
                                label: 'Plazos',
                                value: `${plazo.pendientes} pendiente(s)${plazo.por_vencer > 0 ? ` · ${plazo.por_vencer} por vencer` : ''}${plazo.vencidos > 0 ? ` · ${plazo.vencidos} vencido(s)` : ''}`,
                            },
                        ].map(({ Icon: MetaIcon, label, value, highlight }, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <MetaIcon size={12} className={highlight ? 'text-ankawa-rose' : 'text-ankawa-deep/40'} strokeWidth={2.5} />
                                <span className="text-[11px] font-bold uppercase tracking-wide text-ankawa-deep/45">{label}</span>
                                <span className={`text-sm font-semibold ${highlight ? 'text-ankawa-rose' : 'text-ankawa-deep/85'}`}>{value}</span>
                            </div>
                        ))}
                    </div>
                    <span className={{
                        activo:     'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200',
                        suspendido: 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200',
                        concluido:  'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200',
                    }[expediente.estado] ?? 'px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-500 border border-gray-200'}>
                        {estadoLabel[expediente.estado] ?? expediente.estado}
                    </span>
                </div>
            </div>

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

                    {/* ── Tabs — control segmentado sobre card blanco (activo en rose de marca) ── */}
                    <div className="bg-white rounded-2xl border border-ankawa-deep/[0.08] shadow-sm p-1.5 flex gap-1 overflow-x-auto">
                        {tabs.map(({ id, label, Icon, alerta, badge }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors whitespace-nowrap ${
                                    activeTab === id
                                        ? 'bg-[#BE0F4A] text-white shadow-sm shadow-[#BE0F4A]/30'
                                        : 'text-ankawa-deep/55 hover:text-[#291136] hover:bg-ankawa-deep/[0.04]'
                                }`}
                            >
                                <Icon size={15}/>
                                {label}
                                {alerta && (
                                    <span className={`w-2 h-2 rounded-full animate-pulse ${activeTab === id ? 'bg-white' : 'bg-red-500'}`}/>
                                )}
                                {badge > 0 && (
                                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
                                        activeTab === id ? 'bg-white text-[#BE0F4A]' : 'bg-[#BE0F4A] text-white'
                                    }`}>
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
                            etapaActualId={expediente.etapa_actual_id}
                            tiposResolucion={tiposResolucion ?? []}
                            tiposDocumento={tiposDocumento ?? []}
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
                            actoresEmailValidado={actoresEmailValidado}
                            tiposDocumento={tiposDocumento}
                            miTipoActorId={miTipoActorId}
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
