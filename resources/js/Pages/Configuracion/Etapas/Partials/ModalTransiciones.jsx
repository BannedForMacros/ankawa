import { useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import Input from '@/Components/Input';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import toast from 'react-hot-toast';
import { GitBranch, Trash2, ArrowRight, Pencil, Bell, X, Users, FileText } from 'lucide-react';

const opcionesSiNo = [
    { id: 1, nombre: 'Sí' },
    { id: 0, nombre: 'No' },
];

export default function ModalTransiciones({ 
    show, 
    onClose, 
    actividad, 
    acciones = [], 
    tiposActor = [], 
    todasActividades = [] 
}) {
    // 1. TODOS LOS HOOKS ARRIBA (Sin condicionales antes)
    const [transicionEditando, setTransicionEditando] = useState(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        catalogo_accion_id: '',
        etiqueta_boton: '',
        actividad_destino_id: '',
        designa_tipo_actor_id: '',
        requiere_documento: 0,
        permite_documento: 1,
        requiere_observacion: 0,
    });

    // 2. AHORA SÍ, EL CONDICIONAL PARA DETENER EL RENDERIZADO VISUAL
    if (!actividad) return null;

    // 3. VARIABLES NORMALES
    const opcionesAcciones = acciones.map(a => ({ id: a.id, nombre: a.nombre }));
    const opcionesDestino = todasActividades.map(a => ({ id: a.id, nombre: a.nombre_completo }));
    const opcionesActores = [
        { id: '', nombre: '-- Ninguno (No designar) --' },
        ...tiposActor.map(a => ({ id: a.id, nombre: a.nombre }))
    ];

    const cancelarEdicion = () => {
        setTransicionEditando(null);
        reset();
        clearErrors();
    };

    const abrirEditar = (t) => {
        clearErrors();
        setTransicionEditando(t);
        setData({
            catalogo_accion_id: t.catalogo_accion_id,
            etiqueta_boton: t.etiqueta_boton,
            actividad_destino_id: t.actividad_destino_id,
            designa_tipo_actor_id: t.designa_tipo_actor_id ?? '',
            requiere_documento: t.requiere_documento,
            permite_documento: t.permite_documento,
            requiere_observacion: t.requiere_observacion,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const route_name = transicionEditando 
            ? route('transiciones.update', transicionEditando.id)
            : route('transiciones.store', actividad.id);

        const method = transicionEditando ? put : post;
        
        method(route_name, {
            preserveScroll: true,
            onSuccess: (page) => {
                cancelarEdicion();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Error al guardar la transición'),
        });
    };

    const handleDelete = (transicionId) => {
        if (!confirm('¿Eliminar este botón? Los expedientes no podrán usarlo más.')) return;
        
        router.delete(route('transiciones.destroy', transicionId), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (transicionEditando?.id === transicionId) cancelarEdicion();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
        });
    };

    return (
        <Modal show={show} onClose={() => { cancelarEdicion(); onClose(); }} maxWidth="2xl">
            <div className="p-7 max-h-[90vh] overflow-y-auto">
                {/* Cabecera */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#291136]">
                            <GitBranch size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#291136]">Flujo y Botones</h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Actividad: <span className="text-[#BE0F4A]">{actividad.nombre}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-500">
                        <X size={18} />
                    </button>
                </div>

                {/* Lista de Transiciones Existentes */}
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80 mb-3">
                        Botones Configurados
                    </h3>
                    
                    {(!actividad.transiciones || actividad.transiciones.length === 0) ? (
                        <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-400 border border-dashed border-gray-200">
                            No hay transiciones configuradas. El expediente se detendrá aquí.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {actividad.transiciones.map(t => (
                                <div key={t.id} className={`flex items-center justify-between p-3 border rounded-xl shadow-sm transition-all
                                    ${transicionEditando?.id === t.id ? 'border-[#BE0F4A] bg-[#BE0F4A]/5' : 'bg-white border-gray-200'}`}>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm" style={{ backgroundColor: t.accion_catalogo?.color_hex || '#291136' }}>
                                                {t.etiqueta_boton}
                                            </span>
                                            <ArrowRight size={14} className="text-gray-400" />
                                            <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]" title={t.actividad_destino?.nombre}>
                                                {t.actividad_destino?.nombre}
                                            </span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] text-gray-500 mt-1.5 flex-wrap">
                                            {t.designa_tipo_actor_id && <span className="bg-blue-50 border border-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Users size={10}/> Designa: {t.tipo_actor_designado?.nombre}</span>}
                                            {t.requiere_documento === 1 && <span className="bg-red-50 border border-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1"><FileText size={10}/> Exige PDF</span>}
                                            {t.requiere_observacion === 1 && <span className="bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Exige Texto</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2 ml-2 shrink-0">
                                        {/* BOTÓN PREPARADO PARA NOTIFICACIONES */}
                                        <button onClick={() => alert("¡Pronto! Aquí configuraremos los emails automáticos.")} 
                                            className="p-1.5 text-amber-500 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1"
                                            title="Configurar Notificaciones de Correo">
                                            <Bell size={14} />
                                        </button>
                                        
                                        <button type="button" onClick={() => abrirEditar(t)} className="p-1.5 text-[#291136] bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button type="button" onClick={() => handleDelete(t.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Formulario */}
                <div className={`p-5 rounded-2xl border transition-all ${transicionEditando ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#291136] uppercase tracking-wide opacity-80">
                            {transicionEditando ? 'Editando Botón' : 'Agregar Nuevo Botón'}
                        </h3>
                        {transicionEditando && (
                            <button type="button" onClick={cancelarEdicion} className="text-xs text-blue-600 font-bold hover:underline">
                                Cancelar edición
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-1">Tipo de Acción (Color base)</label>
                                <CustomSelect 
                                    value={data.catalogo_accion_id} 
                                    onChange={v => setData('catalogo_accion_id', v)} 
                                    options={opcionesAcciones} placeholder="-- Seleccione --" />
                                {errors.catalogo_accion_id && <p className="text-xs text-red-500 mt-1">{errors.catalogo_accion_id}</p>}
                            </div>
                            <div>
                                <Input label="Etiqueta del Botón (Texto visible)" required type="text" 
                                    value={data.etiqueta_boton} 
                                    onChange={e => setData('etiqueta_boton', e.target.value)} 
                                    placeholder="Ej: Aprobar Solicitud" className="!mb-0" />
                                {errors.etiqueta_boton && <p className="text-xs text-red-500 mt-1">{errors.etiqueta_boton}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#291136] mb-1">Destino (¿A qué actividad se mueve el caso?)</label>
                            <CustomSelect 
                                value={data.actividad_destino_id} 
                                onChange={v => setData('actividad_destino_id', v)} 
                                options={opcionesDestino} placeholder="-- Siguiente Actividad --" />
                            {errors.actividad_destino_id && <p className="text-xs text-red-500 mt-1">{errors.actividad_destino_id}</p>}
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <label className="block text-xs font-bold text-[#BE0F4A] mb-1 flex items-center gap-1">
                                <Users size={12}/> Designación de Actor (Opcional)
                            </label>
                            <p className="text-[10px] text-gray-500 mb-2">
                                Si eliges uno, al presionar este botón el sistema pedirá seleccionar qué usuario tomará este rol en el expediente actual.
                            </p>
                            <CustomSelect 
                                value={data.designa_tipo_actor_id} 
                                onChange={v => setData('designa_tipo_actor_id', v)} 
                                options={opcionesActores} placeholder={null} />
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-2 mt-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Exige Subir PDF?</label>
                                <CustomSelect value={data.requiere_documento} onChange={v => setData('requiere_documento', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Permite Subir PDF?</label>
                                <CustomSelect value={data.permite_documento} onChange={v => setData('permite_documento', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">¿Exige Motivo/Texto?</label>
                                <CustomSelect value={data.requiere_observacion} onChange={v => setData('requiere_observacion', v)} options={opcionesSiNo} placeholder={null} />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
                            <PrimaryButton type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : transicionEditando ? 'Guardar Cambios' : 'Agregar Botón'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    );
}