import { useState, useEffect, useMemo } from 'react';
import { useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ConfigHeader from '@/Components/ConfigHeader';
import CustomSelect from '@/Components/CustomSelect';
import Modal from '@/Components/Modal';
import toast from 'react-hot-toast';
import { Receipt, Pencil, ToggleLeft, ToggleRight, Info, Search, Filter } from 'lucide-react';

function ModalEditar({ show, onClose, tipo }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        nombre: '',
        descripcion: '',
        genera_cargo: true,
        activo: true,
    });

    useEffect(() => {
        if (show && tipo) {
            setData({
                nombre:       tipo.nombre ?? '',
                descripcion:  tipo.descripcion ?? '',
                genera_cargo: !!tipo.genera_cargo,
                activo:       !!tipo.activo,
            });
        }
    }, [show, tipo?.id]);

    const submit = (e) => {
        e.preventDefault();
        put(route('configuracion.tipos-evento-cargo.update', tipo.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                onClose(); reset();
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('Revise los campos e intente de nuevo.'),
        });
    };

    if (!tipo) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-[#291136] flex items-center justify-center shrink-0">
                            <Receipt size={18} className="text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-[#291136]">Editar Tipo de Evento</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Nombre <span className="text-[#BE0F4A]">*</span>
                            </label>
                            <input type="text" required maxLength={150}
                                value={data.nombre}
                                onChange={e => setData('nombre', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                            {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[#291136] uppercase tracking-wide mb-2">
                                Descripción
                            </label>
                            <textarea rows={3} maxLength={1000}
                                value={data.descripcion}
                                onChange={e => setData('descripcion', e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#291136]/20 focus:border-[#291136]" />
                            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-xs font-bold text-[#291136]">Emite cargo</p>
                                    <p className="text-[10px] text-gray-400">Si está apagado, no se genera número</p>
                                </div>
                                <button type="button"
                                    onClick={() => setData('genera_cargo', !data.genera_cargo)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-2 ${data.genera_cargo ? 'bg-[#BE0F4A]' : 'bg-gray-200'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${data.genera_cargo ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-xs font-bold text-[#291136]">Activo</p>
                                    <p className="text-[10px] text-gray-400">Disponible en el sistema</p>
                                </div>
                                <button type="button"
                                    onClick={() => setData('activo', !data.activo)}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-2 ${data.activo ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${data.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
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

export default function TiposEventoCargoIndex({ tipos }) {
    const [editando,  setEditando]  = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // ── Filtros (client-side) ──
    const [search, setSearch] = useState('');
    const [estado, setEstado] = useState('');
    const [genera, setGenera] = useState('');
    const tiposFiltrados = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tipos.filter(t => {
            if (estado === 'activos'   && !t.activo) return false;
            if (estado === 'inactivos' &&  t.activo) return false;
            if (genera === 'si' && !t.genera_cargo) return false;
            if (genera === 'no' &&  t.genera_cargo) return false;
            if (q && !(`${t.nombre ?? ''} ${t.descripcion ?? ''}`.toLowerCase().includes(q))) return false;
            return true;
        });
    }, [tipos, search, estado, genera]);
    const hayFiltros = !!search || estado !== '' || genera !== '';

    const toggle = (tipo, campo) => {
        const nuevoValor = !tipo[campo];
        router.put(route('configuracion.tipos-evento-cargo.update', tipo.id), {
            nombre:       tipo.nombre,
            descripcion:  tipo.descripcion ?? '',
            genera_cargo: campo === 'genera_cargo' ? nuevoValor : tipo.genera_cargo,
            activo:       campo === 'activo'       ? nuevoValor : tipo.activo,
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                if (page.props.flash?.success) toast.success(page.props.flash.success);
            },
            onError: () => toast.error('No se pudo actualizar.'),
        });
    };

    return (
        <AuthenticatedLayout>
            <ConfigHeader
                breadcrumb={[
                    { label: 'Inicio', href: route('dashboard') },
                    { label: 'Configuración' },
                    { label: 'Tipos de Cargo' },
                ]}
                title="Tipos de"
                titleAccent="Cargo"
                description="Define qué eventos del sistema emiten un cargo correlativo (CARGO-AAAA-NNNN)."
            />
            <div className="p-6 max-w-6xl mx-auto">

                {/* Aviso explicativo */}
                <div className="mb-5 bg-[#291136]/[0.03] border border-[#291136]/10 rounded-2xl p-4 flex gap-3">
                    <Info size={18} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                    <div className="text-xs text-gray-600 leading-relaxed">
                        Estos códigos son fijos del sistema y no pueden eliminarse ni crearse desde aquí.
                        Lo que sí puede ajustarse: el <strong>nombre</strong>, la <strong>descripción</strong> y los toggles
                        de <strong>"Emite cargo"</strong> y <strong>"Activo"</strong>. Si apagas <em>"Emite cargo"</em>,
                        el evento se procesa normalmente pero <em>no</em> se genera número de cargo asociado.
                    </div>
                </div>

                {/* Toolbar: filtros a la izquierda, búsqueda a la derecha */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#291136]/55">
                            <Filter size={14} className="text-[#BE0F4A]" />
                            Filtrar por:
                        </span>
                        <div className="w-44">
                            <CustomSelect value={estado} onChange={setEstado}
                                options={[{ id: 'activos', nombre: 'Activos' }, { id: 'inactivos', nombre: 'Inactivos' }]}
                                placeholder="Todos los estados" />
                        </div>
                        <div className="w-48">
                            <CustomSelect value={genera} onChange={setGenera}
                                options={[{ id: 'si', nombre: 'Emite cargo' }, { id: 'no', nombre: 'No emite cargo' }]}
                                placeholder="Emisión de cargo" />
                        </div>
                    </div>
                    <div className="relative w-full sm:w-72 sm:ml-auto">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar tipo de evento..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A] text-[#291136] bg-white shadow-sm transition-all" />
                    </div>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider rounded-tl-2xl w-1/4">
                                    Nombre
                                </th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">
                                    Cargos
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-28">
                                    Emite cargo
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">
                                    Estado
                                </th>
                                <th className="px-5 py-3.5 text-center text-xs font-semibold text-white uppercase tracking-wider w-20 rounded-tr-2xl">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {tiposFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-14 text-center text-gray-400">
                                        <Receipt size={36} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-medium">
                                            {hayFiltros
                                                ? 'No se encontraron tipos de evento con esos filtros.'
                                                : 'No hay tipos de evento de cargo registrados.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : tiposFiltrados.map(tipo => (
                                <tr key={tipo.id} className="hover:bg-gray-50/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <span className={`font-bold ${tipo.activo ? 'text-[#291136]' : 'text-gray-400'}`}>
                                            {tipo.nombre}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {tipo.descripcion || <span className="text-gray-300 italic">Sin descripción</span>}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-600">
                                            {tipo.cargos_count}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button onClick={() => toggle(tipo, 'genera_cargo')}
                                            className="inline-flex items-center justify-center"
                                            title={tipo.genera_cargo ? 'Apagar emisión de cargo' : 'Encender emisión de cargo'}>
                                            {tipo.genera_cargo
                                                ? <ToggleRight size={28} className="text-[#BE0F4A]" />
                                                : <ToggleLeft  size={28} className="text-gray-300" />}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button onClick={() => toggle(tipo, 'activo')}
                                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors
                                                ${tipo.activo
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                                                }`}>
                                            {tipo.activo ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => { setEditando(tipo); setModalOpen(true); }}
                                                title="Editar nombre y descripción"
                                                className="p-2 rounded-lg text-[#291136]/50 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors">
                                                <Pencil size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                </div>
            </div>

            <ModalEditar
                show={modalOpen}
                onClose={() => setModalOpen(false)}
                tipo={editando}
            />
        </AuthenticatedLayout>
    );
}
