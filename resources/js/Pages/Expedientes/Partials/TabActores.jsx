import { useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { UserPlus, Trash2, Star, Globe, Building2 } from 'lucide-react';

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

    // Actores elegibles para gestor (no demandante/demandado)
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

    // Tipo actor seleccionado y su config
    const tipoSeleccionado = useMemo(() => {
        if (!formActor.data.tipo_actor_id) return null;
        return tiposActorConfig.find(t => String(t.id) === String(formActor.data.tipo_actor_id));
    }, [formActor.data.tipo_actor_id, tiposActorConfig]);

    // Filtrar usuarios por rol_auto_slug del tipo de actor seleccionado
    const usuariosFiltrados = useMemo(() => {
        if (!tipoSeleccionado?.rol_auto_slug) return usuariosAsignables;
        return usuariosAsignables.filter(u => u.rol?.slug === tipoSeleccionado.rol_auto_slug);
    }, [tipoSeleccionado, usuariosAsignables]);

    // Tipos de actor disponibles para agregar (no automáticos)
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
    const formGestor = useForm({
        actor_id: '',
    });

    function designarGestor(e) {
        e.preventDefault();
        formGestor.post(route('expedientes.gestor.designar', expediente.id), {
            onSuccess: () => { formGestor.reset(); setShowFormGestor(false); },
        });
    }

    return (
        <div className="space-y-4">
            {/* ── Lista de actores ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#291136]">Actores del Expediente</h3>
                    <div className="flex gap-2">
                        {puedeDesignarGestor && (
                            <button
                                onClick={() => setShowFormGestor(!showFormGestor)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                            >
                                <Star size={12}/> Designar Gestor
                            </button>
                        )}
                        {puedeEditar && tiposActorManuales.length > 0 && (
                            <button
                                onClick={() => setShowFormActor(!showFormActor)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors"
                            >
                                <UserPlus size={12}/> Agregar Actor
                            </button>
                        )}
                    </div>
                </div>

                {actoresActivos.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No hay actores asignados.</p>
                ) : (
                    <div className="space-y-2">
                        {actoresActivos.map(actor => (
                            <div key={actor.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    actor.es_gestor ? 'bg-amber-100 text-amber-700' : 'bg-[#291136]/10 text-[#291136]'
                                }`}>
                                    {actor.es_gestor ? <Star size={14}/> : (actor.usuario?.name ?? '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#291136] truncate">
                                            {actor.usuario?.name ?? 'Sin nombre'}
                                        </span>
                                        {actor.es_gestor && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                GESTOR
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                        <span className="font-semibold">{actor.tipo_actor?.nombre ?? '—'}</span>
                                        {actor.usuario?.rol?.nombre && (
                                            <>
                                                <span className="text-gray-200">•</span>
                                                <span>{actor.usuario.rol.nombre}</span>
                                            </>
                                        )}
                                        <span className="text-gray-200">•</span>
                                        <span>{actor.usuario?.email ?? '—'}</span>
                                    </div>
                                </div>
                                {puedeEditar && !['demandante', 'demandado'].includes(actor.tipo_actor?.slug) && (
                                    <button
                                        onClick={() => removerActor(actor.id)}
                                        className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Form: Agregar Actor ── */}
            {showFormActor && (
                <form onSubmit={agregarActor} className="bg-white rounded-2xl border border-[#291136]/20 shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-bold text-[#291136]">Agregar Actor</h4>

                    {/* Tipo de Actor */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Actor *</label>
                        <select
                            value={formActor.data.tipo_actor_id}
                            onChange={e => onTipoActorChange(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                        >
                            <option value="">Seleccionar...</option>
                            {tiposActorManuales.map(t => (
                                <option key={t.id} value={t.id}>{t.nombre}</option>
                            ))}
                        </select>
                        {formActor.errors.tipo_actor_id && <p className="text-xs text-red-500 mt-1">{formActor.errors.tipo_actor_id}</p>}
                    </div>

                    {/* Modo: Interno / Externo (solo si permite_externo) */}
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
                                        <Building2 size={12}/> Interno (usuario existente)
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
                                        <Globe size={12}/> Externo (crear cuenta)
                                    </button>
                                </div>
                            )}

                            {/* Modo Interno: dropdown de usuarios filtrados por rol */}
                            {formActor.data.modo === 'interno' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        Usuario *
                                        {tipoSeleccionado.rol_auto_slug && (
                                            <span className="ml-1 text-gray-400 font-normal">
                                                (filtrado por rol: {tipoSeleccionado.rol_auto_slug})
                                            </span>
                                        )}
                                    </label>
                                    <select
                                        value={formActor.data.usuario_id}
                                        onChange={e => formActor.setData('usuario_id', e.target.value)}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
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

                            {/* Modo Externo: nombre + email */}
                            {formActor.data.modo === 'externo' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                                        <input
                                            type="text"
                                            value={formActor.data.nombre_externo}
                                            onChange={e => formActor.setData('nombre_externo', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="Nombre del actor externo"
                                        />
                                        {formActor.errors.nombre_externo && <p className="text-xs text-red-500 mt-1">{formActor.errors.nombre_externo}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                                        <input
                                            type="email"
                                            value={formActor.data.email_externo}
                                            onChange={e => formActor.setData('email_externo', e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                            placeholder="correo@ejemplo.com"
                                        />
                                        {formActor.errors.email_externo && <p className="text-xs text-red-500 mt-1">{formActor.errors.email_externo}</p>}
                                    </div>
                                    <p className="sm:col-span-2 text-xs text-gray-400">
                                        Se creará una cuenta automáticamente y se notificará por correo con las credenciales de acceso.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {formActor.errors.general && <p className="text-xs text-red-500">{formActor.errors.general}</p>}

                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setShowFormActor(false); formActor.reset(); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                            Cancelar
                        </button>
                        <button type="submit" disabled={formActor.processing} className="px-4 py-2 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50">
                            Agregar
                        </button>
                    </div>
                </form>
            )}

            {/* ── Form: Designar Gestor ── */}
            {showFormGestor && (
                <form onSubmit={designarGestor} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-bold text-amber-700">Designar Gestor del Expediente</h4>
                    <p className="text-xs text-gray-500">Seleccione un actor ya asignado al expediente para designarlo como Gestor.</p>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Actor *</label>
                        <select
                            value={formGestor.data.actor_id}
                            onChange={e => formGestor.setData('actor_id', e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
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
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setShowFormGestor(false); formGestor.reset(); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                            Cancelar
                        </button>
                        <button type="submit" disabled={formGestor.processing} className="px-4 py-2 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
                            Designar Gestor
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
