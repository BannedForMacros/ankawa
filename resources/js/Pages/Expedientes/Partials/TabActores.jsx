import { useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { UserPlus, Trash2, Star, Globe, Building2, ShieldCheck, ShieldAlert } from 'lucide-react';
import AnkawaModal from '@/Components/AnkawaModal';

export default function TabActores({
    expediente,
    esGestor,
    puedeDesignarGestor,
    tiposActorConfig = [],
    usuariosAsignables = [],
}) {
    const puedeEditar = esGestor || puedeDesignarGestor;
    const [showFormActor, setShowFormActor] = useState(false);
    const [showFormGestor, setShowFormGestor] = useState(false);

    const actoresActivos = (expediente.actores ?? []).filter(a => a.activo);

    const actoresParaGestor = actoresActivos.filter(
        a => !['demandante', 'demandado'].includes(a.tipo_actor?.slug)
    );

    // ── Form: Agregar Actor ──
    const formActor = useForm({
        tipo_actor_id: '',
        modo: 'interno',
        usuario_id: '',
        nombre_externo: '',
        email_externo: '',
    });

    const tipoSeleccionado = useMemo(() => {
        if (!formActor.data.tipo_actor_id) return null;
        return tiposActorConfig.find(t => String(t.id) === String(formActor.data.tipo_actor_id));
    }, [formActor.data.tipo_actor_id, tiposActorConfig]);

    const usuariosFiltrados = useMemo(() => {
        if (!tipoSeleccionado?.rol_auto_slug) return usuariosAsignables;
        return usuariosAsignables.filter(u => u.rol?.slug === tipoSeleccionado.rol_auto_slug);
    }, [tipoSeleccionado, usuariosAsignables]);

    const tiposActorManuales = tiposActorConfig.filter(t => !t.es_automatico);

    function onTipoActorChange(tipoActorId) {
        formActor.setData(prev => ({
            ...prev,
            tipo_actor_id: tipoActorId,
            modo: 'interno',
            usuario_id: '',
            nombre_externo: '',
            email_externo: '',
        }));
    }

    function agregarActor(e) {
        e.preventDefault();
        formActor.post(route('expedientes.actores.store', expediente.id), {
            onSuccess: () => { formActor.reset(); setShowFormActor(false); },
        });
    }

    function removerActor(actorId) {
        if (!confirm('¿Está seguro de remover este actor?')) return;
        router.delete(route('expedientes.actores.destroy', [expediente.id, actorId]));
    }

    // ── Form: Designar Gestor ──
    const formGestor = useForm({ actor_id: '' });

    function designarGestor(e) {
        e.preventDefault();
        formGestor.post(route('expedientes.gestor.designar', expediente.id), {
            onSuccess: () => { formGestor.reset(); setShowFormGestor(false); },
        });
    }

    const inputCls = "w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]";

    return (
        <div className="space-y-4">

            {/* ── Lista de actores ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                    className="px-5 py-3 flex items-center justify-between"
                    style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}
                >
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Actores del Expediente</h3>
                    <div className="flex gap-2">
                        {puedeDesignarGestor && (
                            <button
                                onClick={() => setShowFormGestor(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-400 text-amber-900 hover:bg-amber-300 transition-colors"
                            >
                                <Star size={12} /> Designar Gestor
                            </button>
                        )}
                        {puedeEditar && tiposActorManuales.length > 0 && (
                            <button
                                onClick={() => setShowFormActor(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#BE0F4A] text-white hover:bg-[#BE0F4A]/90 transition-colors"
                            >
                                <UserPlus size={12} /> Agregar Actor
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-5">
                    {actoresActivos.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No hay actores asignados.</p>
                    ) : (
                        <div className="space-y-2">
                            {actoresActivos.map(actor => (
                                <div
                                    key={actor.id}
                                    className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 border-l-4 ${
                                        actor.es_gestor ? 'border-l-amber-400'
                                        : actor.tipo_actor?.slug === 'demandante' ? 'border-l-[#BE0F4A]'
                                        : actor.tipo_actor?.slug === 'demandado'  ? 'border-l-[#291136]/40'
                                        : 'border-l-gray-200'
                                    }`}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        actor.es_gestor ? 'bg-amber-100 text-amber-700' : 'bg-[#291136]/10 text-[#291136]'
                                    }`}>
                                        {actor.es_gestor
                                            ? <Star size={14} />
                                            : (actor.usuario?.name ?? '?').charAt(0).toUpperCase()
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-bold text-[#291136] truncate">
                                                {actor.usuario?.name ?? 'Sin nombre'}
                                            </span>
                                            {actor.es_gestor && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                    GESTOR
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                                            <span className="font-semibold">{actor.tipo_actor?.nombre ?? '—'}</span>
                                            {actor.usuario?.rol?.nombre && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{actor.usuario.rol.nombre}</span>
                                                </>
                                            )}
                                            <span className="text-gray-300">•</span>
                                            <span>{actor.usuario?.email ?? '—'}</span>
                                            <span className="text-gray-300">•</span>
                                            {actor.credenciales_enviadas ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                                    <ShieldCheck size={13} /> credenciales enviadas
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                                                    <ShieldAlert size={13} /> credenciales pendientes
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {puedeEditar && !['demandante', 'demandado'].includes(actor.tipo_actor?.slug) && (
                                        <button
                                            onClick={() => removerActor(actor.id)}
                                            className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal: Agregar Actor ── */}
            <AnkawaModal
                open={showFormActor}
                onClose={() => { setShowFormActor(false); formActor.reset(); }}
                title="Agregar Actor"
            >
                <form onSubmit={agregarActor} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de Actor *</label>
                        <select
                            value={formActor.data.tipo_actor_id}
                            onChange={e => onTipoActorChange(e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Seleccionar...</option>
                            {tiposActorManuales.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                        {formActor.errors.tipo_actor_id && <p className="text-xs text-red-500 mt-1">{formActor.errors.tipo_actor_id}</p>}
                    </div>

                    {tipoSeleccionado && (
                        <>
                            {tipoSeleccionado.permite_externo && (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => formActor.setData('modo', 'interno')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                            formActor.data.modo === 'interno'
                                                ? 'bg-[#291136] text-white border-[#291136]'
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Building2 size={12} /> Interno (usuario existente)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => formActor.setData('modo', 'externo')}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                            formActor.data.modo === 'externo'
                                                ? 'bg-[#BE0F4A] text-white border-[#BE0F4A]'
                                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <Globe size={12} /> Externo (crear cuenta)
                                    </button>
                                </div>
                            )}

                            {formActor.data.modo === 'interno' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                                        Usuario *
                                        {tipoSeleccionado.rol_auto_slug && (
                                            <span className="ml-1 text-gray-400 font-normal">
                                                (rol: {tipoSeleccionado.rol_auto_slug})
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        value={formActor.data.usuario_id}
                                        onChange={e => formActor.setData('usuario_id', e.target.value)}
                                        className={inputCls}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {usuariosFiltrados.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} — {u.rol?.nombre}</option>
                                        ))}
                                    </select>
                                    {usuariosFiltrados.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">No hay usuarios disponibles con el rol requerido.</p>
                                    )}
                                    {formActor.errors.usuario_id && <p className="text-xs text-red-500 mt-1">{formActor.errors.usuario_id}</p>}
                                </div>
                            )}

                            {formActor.data.modo === 'externo' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre completo *</label>
                                        <input
                                            type="text"
                                            value={formActor.data.nombre_externo}
                                            onChange={e => formActor.setData('nombre_externo', e.target.value)}
                                            className={inputCls}
                                            placeholder="Nombre del actor externo"
                                        />
                                        {formActor.errors.nombre_externo && <p className="text-xs text-red-500 mt-1">{formActor.errors.nombre_externo}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                                        <input
                                            type="email"
                                            value={formActor.data.email_externo}
                                            onChange={e => formActor.setData('email_externo', e.target.value)}
                                            className={inputCls}
                                            placeholder="correo@ejemplo.com"
                                        />
                                        {formActor.errors.email_externo && <p className="text-xs text-red-500 mt-1">{formActor.errors.email_externo}</p>}
                                    </div>
                                    <p className="sm:col-span-2 text-sm text-gray-400">
                                        Se creará una cuenta automáticamente y se enviará por correo con las credenciales de acceso.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {formActor.errors.general && <p className="text-xs text-red-500">{formActor.errors.general}</p>}

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => { setShowFormActor(false); formActor.reset(); }}
                            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formActor.processing}
                            className="px-5 py-2 text-sm font-bold bg-[#BE0F4A] text-white rounded-lg hover:bg-[#BE0F4A]/90 disabled:opacity-50 transition-colors"
                        >
                            {formActor.processing ? 'Guardando...' : 'Agregar Actor'}
                        </button>
                    </div>
                </form>
            </AnkawaModal>

            {/* ── Modal: Designar Gestor ── */}
            <AnkawaModal
                open={showFormGestor}
                onClose={() => { setShowFormGestor(false); formGestor.reset(); }}
                title="Designar Gestor del Expediente"
                size="sm"
            >
                <form onSubmit={designarGestor} className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Seleccione un actor ya asignado al expediente para designarlo como Gestor.
                    </p>
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-1">Actor *</label>
                        <select
                            value={formGestor.data.actor_id}
                            onChange={e => formGestor.setData('actor_id', e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Seleccionar actor...</option>
                            {actoresParaGestor.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.usuario?.name ?? 'Sin nombre'} — {a.tipo_actor?.nombre}
                                    {a.es_gestor ? ' (Gestor actual)' : ''}
                                </option>
                            ))}
                        </select>
                        {formGestor.errors.actor_id && <p className="text-xs text-red-500 mt-1">{formGestor.errors.actor_id}</p>}
                        {formGestor.errors.general && <p className="text-xs text-red-500 mt-1">{formGestor.errors.general}</p>}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => { setShowFormGestor(false); formGestor.reset(); }}
                            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formGestor.processing}
                            className="px-5 py-2 text-sm font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {formGestor.processing ? 'Designando...' : 'Designar Gestor'}
                        </button>
                    </div>
                </form>
            </AnkawaModal>
        </div>
    );
}
