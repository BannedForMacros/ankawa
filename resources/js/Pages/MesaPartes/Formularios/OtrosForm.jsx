import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { Paperclip, Send, FileText, X, Image } from 'lucide-react';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';

const ICONOS_EXT = { pdf: '📄', doc: '📝', docx: '📝', jpg: '🖼️', jpeg: '🖼️', png: '🖼️' };

function ext(nombre) {
    return nombre.split('.').pop().toLowerCase();
}

export default function OtrosForm({ servicio, portalEmail, portalUser }) {
    const isPortal = !!portalEmail;

    const [tiposDocumento, setTiposDocumento]   = useState([]);
    const [cargandoTipos, setCargandoTipos]     = useState(true);
    const [procesando, setProcesando]           = useState(false);
    const [errores, setErrores]                 = useState({});
    const [archivos, setArchivos]               = useState([]);
    const [confirm, setConfirm]                 = useState(false);
    const [mostrarLoader, setMostrarLoader]     = useState(false);
    const loaderTimer                           = useRef(null);
    const inputRef                              = useRef();

    const [form, setForm] = useState({
        nombre_remitente:  portalUser?.name ?? '',
        email_remitente:   portalEmail ?? '',
        tipo_documento_id: '',
        descripcion:       '',
        observacion:       '',
    });

    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(data => {
                setTiposDocumento(data);
                if (data.length === 1) {
                    setForm(prev => ({ ...prev, tipo_documento_id: String(data[0].id) }));
                }
                setCargandoTipos(false);
            })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrores(prev => ({ ...prev, [field]: undefined }));
    }

    function agregarArchivos(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !archivos.some(a => a.name === n.name && a.size === n.size)
        );
        setArchivos(prev => [...prev, ...nuevos]);
        e.target.value = '';
    }

    function quitarArchivo(i) {
        setArchivos(prev => prev.filter((_, idx) => idx !== i));
    }

    function validar() {
        const errs = {};
        if (!form.nombre_remitente.trim()) errs.nombre_remitente = 'Requerido';
        if (!form.email_remitente.trim())  errs.email_remitente  = 'Requerido';
        if (tiposDocumento.length > 1 && !form.tipo_documento_id) errs.tipo_documento_id = 'Selecciona un tipo';
        if (!form.descripcion.trim())      errs.descripcion      = 'Requerido';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validar();
        if (Object.keys(errs).length) { setErrores(errs); return; }
        setConfirm(true);
    }

    function confirmar() {
        setConfirm(false);
        setProcesando(true);

        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        fd.append('servicio_id',       servicio.id);
        fd.append('tipo_documento_id', form.tipo_documento_id);
        fd.append('nombre_remitente',  form.nombre_remitente);
        fd.append('email_remitente',   form.email_remitente);
        fd.append('descripcion',       form.descripcion);
        if (form.observacion.trim()) fd.append('observacion', form.observacion);
        archivos.forEach(f => fd.append('documentos[]', f));

        router.post(route('solicitud.otros.store'), fd, {
            forceFormData: true,
            onFinish: () => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                setProcesando(false);
            },
            onError: errs => setErrores(errs),
        });
    }

    const tipoActivo = tiposDocumento.find(t => String(t.id) === form.tipo_documento_id);
    const resumenConfirm = `Enviará un documento "${tipoActivo?.nombre ?? 'seleccionado'}" de parte de ${form.nombre_remitente || '—'}. Se enviaráun cargo de recepción a ${form.email_remitente}.${archivos.length ? ` Adjuntos: ${archivos.length} archivo(s).` : ''}`;

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar envío"
            resumen={resumenConfirm}
            onConfirm={confirmar}
            onCancel={() => setConfirm(false)}
            confirmando={procesando}
        />

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
            <h2 className="text-lg font-bold text-[#291136]">Envío de Documento — {servicio.nombre}</h2>

            {/* Nombre remitente */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del remitente *</label>
                <input type="text" value={form.nombre_remitente} onChange={e => set('nombre_remitente', e.target.value)}
                    className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]"
                    placeholder="Nombre completo o razón social"/>
                {errores.nombre_remitente && <p className="text-sm text-red-500 mt-1">{errores.nombre_remitente}</p>}
            </div>

            {/* Email remitente */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                {isPortal ? (
                    <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-lg px-3 py-2.5 text-sm text-emerald-800 font-medium">
                        {portalEmail}
                    </div>
                ) : (
                    <input type="email" value={form.email_remitente} onChange={e => set('email_remitente', e.target.value)}
                        className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]"
                        placeholder="Se enviará el número de cargo a este correo"/>
                )}
                {errores.email_remitente && <p className="text-sm text-red-500 mt-1">{errores.email_remitente}</p>}
            </div>

            {/* Tipo de documento */}
            {cargandoTipos ? (
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de documento</label>
                    <div className="h-10 bg-gray-100 animate-pulse rounded-lg"/>
                </div>
            ) : tiposDocumento.length > 1 ? (
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de documento *</label>
                    <select value={form.tipo_documento_id} onChange={e => set('tipo_documento_id', e.target.value)}
                        className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]">
                        <option value="">Seleccionar...</option>
                        {tiposDocumento.map(td => (
                            <option key={td.id} value={td.id}>{td.nombre}</option>
                        ))}
                    </select>
                    {errores.tipo_documento_id && <p className="text-sm text-red-500 mt-1">{errores.tipo_documento_id}</p>}
                </div>
            ) : tiposDocumento.length === 1 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-gray-400 text-xs">Tipo:</span>
                    <span className="font-semibold">{tiposDocumento[0].nombre}</span>
                </div>
            ) : null}

            {/* Descripción */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Descripción / Mensaje *</label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    rows={4} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]"
                    placeholder="Detalle el motivo o contenido del documento enviado..."/>
                {errores.descripcion && <p className="text-sm text-red-500 mt-1">{errores.descripcion}</p>}
            </div>

            {/* Observación (opcional) */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Observación <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea value={form.observacion} onChange={e => set('observacion', e.target.value)}
                    rows={2} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]"
                    placeholder="Alguna observación adicional..."/>
            </div>

            {/* Archivos con preview */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2 inline-flex items-center gap-1.5">
                    <Paperclip size={13}/> Documentos adjuntos
                </label>
                <button type="button" onClick={() => inputRef.current?.click()}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors justify-center">
                    <Paperclip size={15}/> Seleccionar archivos
                </button>
                <input ref={inputRef} type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={agregarArchivos} className="hidden"/>

                {archivos.length > 0 && (
                    <ul className="mt-3 space-y-2">
                        {archivos.map((f, i) => (
                            <li key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                                <span className="text-lg shrink-0">{ICONOS_EXT[ext(f.name)] ?? '📎'}</span>
                                <span className="truncate flex-1 text-[#291136] font-medium">{f.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{(f.size/1024/1024).toFixed(2)} MB</span>
                                <button type="button" onClick={() => quitarArchivo(i)}
                                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                    <X size={14}/>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="pt-2 border-t border-gray-100">
                <button type="submit" disabled={procesando}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50 transition-colors">
                    <Send size={14}/> {procesando ? 'Enviando...' : 'Enviar documento'}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                    Al confirmar recibirás un número de cargo en tu correo como constancia.
                </p>
            </div>
        </form>
        </>
    );
}
