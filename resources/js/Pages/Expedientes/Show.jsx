import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Clock, FileText, Users, PlusCircle, AlertCircle, ClipboardList } from 'lucide-react';
import TabHistorial from './Partials/TabHistorial';
import TabNuevoMovimiento from './Partials/TabNuevoMovimiento';
import TabAccionPendiente from './Partials/TabAccionPendiente';
import TabActores from './Partials/TabActores';
import TabSolicitud from './Partials/TabSolicitud';

const estadoColors = {
    activo:     'bg-emerald-100 text-emerald-700 border-emerald-200',
    suspendido: 'bg-amber-100 text-amber-700 border-amber-200',
    concluido:  'bg-gray-100 text-gray-500 border-gray-200',
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
}) {
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

    tabs.push({ id: 'actores', label: 'Actores', Icon: Users });

    const [activeTab, setActiveTab] = useState(miAccionPendiente ? 'accion' : 'historial');

    const gestor = expediente.actores?.find(a => a.es_gestor && a.activo);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-semibold leading-tight text-[#291136]">
                        {expediente.numero_expediente ?? `EXP-${expediente.id}`}
                    </h2>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${estadoColors[expediente.estado] ?? ''}`}>
                        {expediente.estado}
                    </span>
                </div>
            }
        >
            <Head title={expediente.numero_expediente ?? 'Expediente'} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* ── Cabecera informativa ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-xs text-gray-400 block">Servicio</span>
                                <span className="font-bold text-[#291136]">{expediente.servicio?.nombre}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block">Etapa Actual</span>
                                <span className="font-bold text-[#BE0F4A]">{expediente.etapa_actual?.nombre ?? '—'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block">Gestor</span>
                                <span className="font-bold text-[#291136]">{gestor?.usuario?.name ?? 'Sin designar'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block">Plazos</span>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-bold">{plazo.pendientes} pendiente(s)</span>
                                    {plazo.por_vencer > 0 && (
                                        <span className="text-amber-600 font-bold">• {plazo.por_vencer} por vencer</span>
                                    )}
                                    {plazo.vencidos > 0 && (
                                        <span className="text-red-600 font-bold">• {plazo.vencidos} vencido(s)</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Tabs ── */}
                    <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
                        {tabs.map(({ id, label, Icon, alerta }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === id
                                        ? 'border-[#291136] text-[#291136]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <Icon size={15}/>
                                {label}
                                {(id === 'accion' || alerta) && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
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
                        />
                    )}

                    {activeTab === 'solicitud' && expediente.solicitud && (
                        <TabSolicitud
                            expediente={expediente}
                            solicitud={expediente.solicitud}
                            esGestor={esGestor}
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
