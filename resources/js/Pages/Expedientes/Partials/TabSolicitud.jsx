import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Pencil, X, CheckCircle, XCircle, FileText, Download } from 'lucide-react';

export default function TabSolicitud({ expediente, solicitud, esGestor = false }) {
    const [editando, setEditando] = useState(false);
    const [showNoConforme, setShowNoConforme] = useState(false);
    const [motivoNoConforme, setMotivoNoConforme] = useState('');
    const [procesando, setProcesando] = useState(false);
    const [errores, setErrores] = useState({});

    // ── Form para editar datos de la solicitud ──
    const formEdit = useForm({
        nombre_demandante: solicitud.nombre_demandante ?? '',
        documento_demandante: solicitud.documento_demandante ?? '',
        nombre_representante: solicitud.nombre_representante ?? '',
        documento_representante: solicitud.documento_representante ?? '',
        domicilio_demandante: solicitud.domicilio_demandante ?? '',
        email_demandante: solicitud.email_demandante ?? '',
        telefono_demandante: solicitud.telefono_demandante ?? '',
        nombre_demandado: solicitud.nombre_demandado ?? '',
        domicilio_demandado: solicitud.domicilio_demandado ?? '',
        email_demandado: solicitud.email_demandado ?? '',
        telefono_demandado: solicitud.telefono_demandado ?? '',
        resumen_controversia: solicitud.resumen_controversia ?? '',
        pretensiones: solicitud.pretensiones ?? '',
        monto_involucrado: solicitud.monto_involucrado ?? '',
    });

    function guardarEdicion(e) {
        e.preventDefault();
        formEdit.put(route('expedientes.solicitud.update', expediente.id), {
            onSuccess: () => setEditando(false),
        });
    }

    function declararConforme() {
        if (!confirm('¿Está seguro de declarar la solicitud como CONFORME? Se notificará al demandado.')) return;
        setProcesando(true);
        router.post(
            route('expedientes.conformidad', expediente.id),
            { resultado: 'conforme', motivo_no_conformidad: '' },
            { onFinish: () => setProcesando(false) }
        );
    }

    function declararNoConforme(e) {
        e.preventDefault();
        setErrores({});
        if (!motivoNoConforme.trim()) {
            setErrores({ motivo_no_conformidad: 'El motivo es obligatorio.' });
            return;
        }
        setProcesando(true);
        router.post(
            route('expedientes.conformidad', expediente.id),
            { resultado: 'no_conforme', motivo_no_conformidad: motivoNoConforme },
            {
                onFinish: () => setProcesando(false),
                onError: (errs) => setErrores(errs),
            }
        );
    }

    const campo = (label, value) => (
        <div>
            <span className="text-xs text-gray-400 block">{label}</span>
            <span className="text-sm font-semibold text-[#291136]">{value || '—'}</span>
        </div>
    );

    const inputField = (label, field, type = 'text', required = false) => (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{label} {required && '*'}</label>
            <input
                type={type}
                value={formEdit.data[field]}
                onChange={e => formEdit.setData(field, e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
            />
            {formEdit.errors[field] && <p className="text-xs text-red-500 mt-1">{formEdit.errors[field]}</p>}
        </div>
    );

    return (
        <div className="space-y-4">

            {/* ── Cabecera con botón editar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#291136]">Datos de la Solicitud</h3>
                    <div className="flex items-center gap-2">
                        {/* Badge de estado de revisión */}
                        {solicitud.resultado_revision && (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                solicitud.resultado_revision === 'conforme'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : 'bg-red-50 text-red-600 border-red-200'
                            }`}>
                                {solicitud.resultado_revision === 'conforme' ? 'CONFORME' : 'NO CONFORME'}
                            </span>
                        )}
                        {esGestor && !editando && (
                            <button
                                onClick={() => setEditando(true)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#291136]/5 text-[#291136] hover:bg-[#291136]/10 border border-[#291136]/20 transition-colors"
                            >
                                <Pencil size={12}/> Editar
                            </button>
                        )}
                    </div>
                </div>

                {editando ? (
                    /* ── Modo edición ── */
                    <form onSubmit={guardarEdicion} className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inputField('Nombre completo', 'nombre_demandante', 'text', true)}
                                {inputField('Documento de identidad', 'documento_demandante', 'text', true)}
                                {inputField('Representante', 'nombre_representante')}
                                {inputField('Doc. Representante', 'documento_representante')}
                                {inputField('Domicilio', 'domicilio_demandante', 'text', true)}
                                {inputField('Email', 'email_demandante', 'email', true)}
                                {inputField('Teléfono', 'telefono_demandante', 'text', true)}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inputField('Nombre completo', 'nombre_demandado', 'text', true)}
                                {inputField('Domicilio', 'domicilio_demandado', 'text', true)}
                                {inputField('Email', 'email_demandado', 'email')}
                                {inputField('Teléfono', 'telefono_demandado')}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Resumen de la controversia *</label>
                                    <textarea
                                        value={formEdit.data.resumen_controversia}
                                        onChange={e => formEdit.setData('resumen_controversia', e.target.value)}
                                        rows={4}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pretensiones *</label>
                                    <textarea
                                        value={formEdit.data.pretensiones}
                                        onChange={e => formEdit.setData('pretensiones', e.target.value)}
                                        rows={3}
                                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    />
                                </div>
                                {inputField('Monto involucrado (S/)', 'monto_involucrado', 'number')}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                            <button type="button" onClick={() => { setEditando(false); formEdit.reset(); }} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700">
                                <X size={12} className="inline mr-1"/> Cancelar
                            </button>
                            <button type="submit" disabled={formEdit.processing} className="px-5 py-2 text-xs font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                ) : (
                    /* ── Modo lectura ── */
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandante</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campo('Nombre', solicitud.nombre_demandante)}
                                {campo('Documento', solicitud.documento_demandante)}
                                {campo('Tipo de persona', solicitud.tipo_persona)}
                                {campo('Representante', solicitud.nombre_representante)}
                                {campo('Doc. Representante', solicitud.documento_representante)}
                                {campo('Domicilio', solicitud.domicilio_demandante)}
                                {campo('Email', solicitud.email_demandante)}
                                {campo('Teléfono', solicitud.telefono_demandante)}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Demandado</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {campo('Nombre', solicitud.nombre_demandado)}
                                {campo('Domicilio', solicitud.domicilio_demandado)}
                                {campo('Email', solicitud.email_demandado)}
                                {campo('Teléfono', solicitud.telefono_demandado)}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Controversia y Pretensiones</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Resumen de la controversia</span>
                                    <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3">{solicitud.resumen_controversia || '—'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Pretensiones</span>
                                    <p className="text-sm text-[#291136] bg-gray-50 rounded-lg p-3">{solicitud.pretensiones || '—'}</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {campo('Monto involucrado', solicitud.monto_involucrado ? `S/ ${Number(solicitud.monto_involucrado).toLocaleString()}` : '—')}
                                    {campo('Solicita designación por Director', solicitud.solicita_designacion_director ? 'Sí' : 'No')}
                                    {campo('Árbitro propuesto', solicitud.nombre_arbitro_propuesto)}
                                    {campo('Reglas aplicables', solicitud.reglas_aplicables)}
                                </div>
                            </div>
                        </div>

                        {/* Documentos de la solicitud */}
                        {solicitud.documentos?.length > 0 && (
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-[#BE0F4A] mb-3 uppercase tracking-wide">Documentos Adjuntos</h4>
                                <div className="space-y-1.5">
                                    {solicitud.documentos.map(doc => (
                                        <a
                                            key={doc.id}
                                            href={route('documentos.descargar', doc.id)}
                                            className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors group"
                                        >
                                            <FileText size={16} className="text-gray-400 group-hover:text-[#291136]"/>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-semibold text-[#291136] truncate block">{doc.nombre_original}</span>
                                                {doc.tipo_documento && (
                                                    <span className="text-[10px] text-gray-400">{doc.tipo_documento.nombre}</span>
                                                )}
                                            </div>
                                            <Download size={14} className="text-gray-300 group-hover:text-[#291136]"/>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Motivo de no conformidad */}
                        {solicitud.resultado_revision === 'no_conforme' && solicitud.motivo_no_conformidad && (
                            <div className="border-t border-gray-100 pt-4">
                                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                                    <h4 className="text-xs font-bold text-red-600 mb-2">Motivo de No Conformidad</h4>
                                    <p className="text-sm text-red-800">{solicitud.motivo_no_conformidad}</p>
                                    {solicitud.fecha_revision && (
                                        <p className="text-[11px] text-red-400 mt-2">
                                            Registrado el {new Date(solicitud.fecha_revision).toLocaleDateString('es-PE')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Esperando subsanación ── */}
            {esGestor && solicitud.estado === 'subsanacion' && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-amber-700 mb-1">⏳ Esperando subsanación del demandante</h3>
                    <p className="text-xs text-amber-700">
                        Se declaró NO CONFORME y se creó una acción pendiente para el demandante.
                        Una vez que el demandante responda, podrás volver a revisar la conformidad desde esta sección.
                    </p>
                </div>
            )}

            {/* ── Conformidad (gestor puede revisar si no está conforme ni en subsanación activa) ── */}
            {esGestor && solicitud.resultado_revision !== 'conforme' && solicitud.estado !== 'subsanacion' && !editando && (
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-amber-700 mb-3">Revisión de Conformidad</h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Revise los datos de la solicitud y declare si la información es conforme o requiere subsanación.
                    </p>

                    {showNoConforme ? (
                        <form onSubmit={declararNoConforme} className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Motivo de no conformidad *</label>
                                <textarea
                                    value={motivoNoConforme}
                                    onChange={e => setMotivoNoConforme(e.target.value)}
                                    rows={3}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                                    placeholder="Indique los motivos por los que la solicitud no es conforme..."
                                />
                                {errores.motivo_no_conformidad && (
                                    <p className="text-xs text-red-500 mt-1">{errores.motivo_no_conformidad}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={procesando}
                                    className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirmar No Conforme
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowNoConforme(false); setErrores({}); }}
                                    className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={declararConforme}
                                disabled={procesando}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                            >
                                <CheckCircle size={16}/> Declarar Conforme
                            </button>
                            <button
                                onClick={() => setShowNoConforme(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                            >
                                <XCircle size={16}/> Declarar No Conforme
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
