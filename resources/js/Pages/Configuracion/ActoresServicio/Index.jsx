import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import ConfirmDialog from '@/Components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
    UserCog, Zap, UserX, Pencil, ChevronDown,
    Info, ExternalLink, Users
} from 'lucide-react';

// ── Modal: detalles de configuración de un actor ──────────────────────────────

function ModalDetalles({ show, onClose, actor, config, servicioId }) {
    const [form, setForm]             = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (show && config) {
            setForm({
                es_automatico:   config.es_automatico   ?? false,
                permite_externo: config.permite_externo ?? false,
                rol_auto_slug:   config.rol_auto_slug   ?? '',
                orden:           config.orden           ?? 1,
            });
        }
    }, [show, actor?.id]);

    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('configuracion.actores-servicio.upsert', { servicio: servicioId, tipoActor: actor.id }),
            form,
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setProcessing(false);
                    onClose();
                    if (page.props.flash?.success) toast.success(page.props.flash.success);
                },
                onError: () => { setProcessing(false); toast.error('Error al guardar.'); },
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="sm">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <UserCog size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#291136]">Configurar: {actor?.nombre}</h2>
                            <p className="text-xs text-gray-400">Ajusta cómo funciona este participante en el servicio</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {/* Asignación automática */}
                        <div className={`rounded-xl border p-4 transition-colors ${form.es_automatico ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-[#291136]">Asignación automática</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Al crear un expediente, el sistema asigna este participante solo, sin intervención manual.
                                    </p>
                                </div>
                                <button type="button" onClick={() => set('es_automatico', !form.es_automatico)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.es_automatico ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.es_automatico ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            {form.es_automatico && (
                                <div className="mt-3 pt-3 border-t border-emerald-200">
                                    <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-1.5">
                                        ¿A qué rol del sistema se asignará?
                                    </label>
                                    <input type="text"
                                        placeholder="Ej: secretaria_general_adjunta"
                                        value={form.rol_auto_slug}
                                        onChange={e => set('rol_auto_slug', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400" />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Identificador interno del rol. El sistema buscará al usuario de ese rol con menos expedientes activos.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Acepta persona externa */}
                        <div className={`rounded-xl border p-4 transition-colors ${form.permite_externo ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className="flex items-center justify-between">
                                <div className="pr-4">
                                    <p className="text-sm font-bold text-[#291136]">Acepta participante externo</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Permite agregar una persona que no tiene usuario en el sistema (se le creará un acceso temporal).
                                    </p>
                                </div>
                                <button type="button" onClick={() => set('permite_externo', !form.permite_externo)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.permite_externo ? 'bg-blue-500' : 'bg-gray-200'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.permite_externo ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Orden */}
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Posición en la lista de participantes
                            </label>
                            <div className="flex items-center gap-2">
                                <input type="number" min={1} max={99}
                                    value={form.orden}
                                    onChange={e => set('orden', Number(e.target.value))}
                                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                                <p className="text-xs text-gray-400">El número más bajo aparece primero.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={processing}
                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" disabled={processing}
                        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#291136] text-white hover:bg-[#4A153D] shadow-lg disabled:opacity-50 transition-colors">
                        {processing ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

const SLUGS_INMUTABLES = ['demandante', 'demandado'];

export default function ActoresServicioIndex({ servicios, tiposActor, pivot }) {
    const [servicioId,  setServicioId]  = useState(servicios[0]?.id ?? null);
    const [modalOpen,   setModalOpen]   = useState(false);
    const [editando,    setEditando]    = useState(null);
    const [toggling,    setToggling]    = useState(null); // id del actor siendo toggled
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [quitando,    setQuitando]    = useState(null);
    const [deleting,    setDeleting]    = useState(false);

    const servicio   = servicios.find(s => s.id === servicioId);
    const configurables = tiposActor.filter(a => !SLUGS_INMUTABLES.includes(a.slug));

    const filas = configurables.map(actor => ({
        ...actor,
        config: pivot.find(p => p.servicio_id === servicioId && p.tipo_actor_id === actor.id) ?? null,
    })).sort((a, b) => (a.config?.orden ?? 99) - (b.config?.orden ?? 99));

    // Toggle incluir/excluir directo desde la tabla
    const handleToggle = (actor, activo) => {
        setToggling(actor.id);
        if (activo) {
            // Incluir: POST con defaults
            router.post(
                route('configuracion.actores-servicio.upsert', { servicio: servicioId, tipoActor: actor.id }),
                { es_automatico: false, permite_externo: false, rol_auto_slug: '', orden: 1 },
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        setToggling(null);
                        if (page.props.flash?.success) toast.success(page.props.flash.success);
                    },
                    onError: () => { setToggling(null); toast.error('Error al guardar.'); },
                }
            );
        } else {
            // Excluir: confirm + DELETE
            setQuitando(actor);
            setToggling(null);
            setConfirmOpen(true);
        }
    };

    const handleQuitarConfirmado = () => {
        setDeleting(true);
        router.delete(
            route('configuracion.actores-servicio.destroy', { servicio: servicioId, tipoActor: quitando.id }),
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setDeleting(false);
                    setConfirmOpen(false);
                    setQuitando(null);
                    if (page.props.flash?.success) toast.success(page.props.flash.success);
                },
                onError: () => { setDeleting(false); toast.error('Error al quitar.'); },
            }
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="p-6">

                {/* Header */}
                <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 mb-6">
                    <div className="px-6 py-6 border-l-4 border-[#BE0F4A]">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase">
                                    Actores por Servicio
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Define qué participantes intervienen en cada servicio y cómo se asignan en el expediente
                                </p>
                            </div>
                            <Link
                                href="/configuracion/tipos-actor"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 border-[#291136] text-[#291136] hover:bg-[#291136] hover:text-white transition-colors">
                                <Users size={15} />
                                Ver catálogo de tipos de actor
                                <ExternalLink size={13} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Selector de servicio */}
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-5 shadow-sm flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-bold text-[#291136] shrink-0">Viendo participantes del servicio:</span>
                    <div className="relative min-w-[240px]">
                        <select
                            value={servicioId ?? ''}
                            onChange={e => setServicioId(Number(e.target.value))}
                            className="w-full appearance-none border-2 border-[#291136]/20 rounded-xl px-4 py-2.5 pr-9 text-sm font-bold text-[#291136] bg-white focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A] transition-colors">
                            {servicios.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#291136]/50 pointer-events-none" />
                    </div>
                    <p className="text-xs text-gray-400 ml-1">
                        {filas.filter(f => f.config).length} de {filas.length} tipo(s) de actor incluidos en este servicio
                    </p>
                </div>

                {/* Nota sobre actores del sistema */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800">
                    <Info size={15} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>
                        <strong>Demandante</strong> y <strong>Demandado</strong> se asignan automáticamente en todos los servicios
                        desde el formulario de solicitud — no necesitan configuración aquí.
                        Para crear nuevos tipos de participante usa el botón <strong>"Ver catálogo de tipos de actor"</strong>.
                    </span>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider rounded-tl-2xl w-1/4">
                                    Tipo de Participante
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    ¿Incluido en este servicio?
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Se asigna solo
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Acepta persona externa
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                    Posición
                                </th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-white uppercase tracking-wider rounded-tr-2xl">
                                    Ajustar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                                        <UserX size={36} className="mx-auto mb-2 opacity-30" />
                                        No hay tipos de actor disponibles.{' '}
                                        <Link href="/configuracion/tipos-actor" className="text-[#BE0F4A] font-semibold hover:underline">
                                            Crear en el catálogo
                                        </Link>
                                    </td>
                                </tr>
                            ) : filas.map(fila => {
                                const incluido    = !!fila.config;
                                const esToggling  = toggling === fila.id;
                                return (
                                    <tr key={fila.id} className={`transition-colors ${incluido ? 'hover:bg-gray-50/80' : 'bg-gray-50/30 hover:bg-gray-50/60'}`}>

                                        {/* Nombre */}
                                        <td className="px-5 py-4">
                                            <span className={`font-semibold ${incluido ? 'text-[#291136]' : 'text-gray-400'}`}>
                                                {fila.nombre}
                                            </span>
                                        </td>

                                        {/* Toggle incluido */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    disabled={esToggling}
                                                    onClick={() => handleToggle(fila, !incluido)}
                                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50
                                                        ${incluido ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200
                                                        ${incluido ? 'translate-x-5' : 'translate-x-0'}`} />
                                                </button>
                                                <span className={`text-xs font-semibold ${incluido ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                    {incluido ? 'Sí, incluido' : 'No incluido'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Se asigna solo */}
                                        <td className="px-5 py-4">
                                            {incluido && fila.config.es_automatico ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                                    <Zap size={10} /> Sí, automático
                                                </span>
                                            ) : incluido ? (
                                                <span className="text-xs text-gray-400">Manual</span>
                                            ) : (
                                                <span className="text-xs text-gray-200">—</span>
                                            )}
                                        </td>

                                        {/* Acepta externo */}
                                        <td className="px-5 py-4">
                                            {incluido && fila.config.permite_externo ? (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                                                    Sí, acepta externo
                                                </span>
                                            ) : incluido ? (
                                                <span className="text-xs text-gray-400">Solo internos</span>
                                            ) : (
                                                <span className="text-xs text-gray-200">—</span>
                                            )}
                                        </td>

                                        {/* Posición */}
                                        <td className="px-5 py-4 text-center">
                                            {incluido ? (
                                                <span className="text-sm font-black text-[#291136]">{fila.config.orden}</span>
                                            ) : (
                                                <span className="text-xs text-gray-200">—</span>
                                            )}
                                        </td>

                                        {/* Acción editar */}
                                        <td className="px-5 py-4 text-right">
                                            {incluido && (
                                                <button
                                                    onClick={() => { setEditando({ actor: fila, config: fila.config }); setModalOpen(true); }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#BE0F4A]/70 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors">
                                                    <Pencil size={13} /> Ajustar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalDetalles
                show={modalOpen}
                onClose={() => setModalOpen(false)}
                actor={editando?.actor}
                config={editando?.config}
                servicioId={servicioId}
            />

            <ConfirmDialog
                show={confirmOpen}
                title="Quitar participante del servicio"
                message={`¿Seguro que deseas quitar "${quitando?.nombre}" del servicio "${servicio?.nombre}"? Se eliminará toda su configuración para este servicio.`}
                confirmText="Sí, quitar"
                processing={deleting}
                onConfirm={handleQuitarConfirmado}
                onCancel={() => { setConfirmOpen(false); setQuitando(null); }}
            />
        </AuthenticatedLayout>
    );
}
