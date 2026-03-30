import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Paperclip, Send } from 'lucide-react';

export default function OtrosForm({ servicio }) {
    const [tiposDocumento, setTiposDocumento]   = useState([]);
    const [cargandoTipos, setCargandoTipos]     = useState(true);
    const [procesando, setProcesando]           = useState(false);
    const [errores, setErrores]                 = useState({});
    const [archivos, setArchivos]               = useState([]);

    const [form, setForm] = useState({
        nombre_remitente:  '',
        email_remitente:   '',
        tipo_documento_id: '',
        descripcion:       '',
    });

    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(data => { setTiposDocumento(data); setCargandoTipos(false); })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    function set(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
        setErrores(prev => ({ ...prev, [field]: undefined }));
    }

    function validar() {
        const errs = {};
        if (!form.nombre_remitente.trim()) errs.nombre_remitente = 'Requerido';
        if (!form.email_remitente.trim())  errs.email_remitente  = 'Requerido';
        if (!form.tipo_documento_id)       errs.tipo_documento_id = 'Selecciona un tipo';
        if (!form.descripcion.trim())      errs.descripcion       = 'Requerido';
        return errs;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const errs = validar();
        if (Object.keys(errs).length) { setErrores(errs); return; }

        setProcesando(true);
        const fd = new FormData();
        fd.append('servicio_id',       servicio.id);
        fd.append('tipo_documento_id', form.tipo_documento_id);
        fd.append('nombre_remitente',  form.nombre_remitente);
        fd.append('email_remitente',   form.email_remitente);
        fd.append('descripcion',       form.descripcion);
        archivos.forEach(f => fd.append('documentos[]', f));

        router.post(route('solicitud.otros.store'), fd, {
            forceFormData: true,
            onFinish:  () => setProcesando(false),
            onError:   errs => setErrores(errs),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 max-w-2xl">
            <h2 className="text-lg font-bold text-[#291136]">Envío de Documento — {servicio.nombre}</h2>

            {/* Nombre remitente */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre del remitente *</label>
                <input type="text" value={form.nombre_remitente} onChange={e => set('nombre_remitente', e.target.value)}
                    className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"
                    placeholder="Nombre completo o razón social"/>
                {errores.nombre_remitente && <p className="text-sm text-red-500 mt-1">{errores.nombre_remitente}</p>}
            </div>

            {/* Email remitente */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                <input type="email" value={form.email_remitente} onChange={e => set('email_remitente', e.target.value)}
                    className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"
                    placeholder="Se enviará el número de cargo a este correo"/>
                {errores.email_remitente && <p className="text-sm text-red-500 mt-1">{errores.email_remitente}</p>}
            </div>

            {/* Tipo de documento */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo de documento *</label>
                {cargandoTipos ? (
                    <div className="h-10 bg-gray-100 animate-pulse rounded-lg"/>
                ) : (
                    <select value={form.tipo_documento_id} onChange={e => set('tipo_documento_id', e.target.value)}
                        className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5">
                        <option value="">Seleccionar...</option>
                        {tiposDocumento.map(td => (
                            <option key={td.id} value={td.id}>{td.nombre}</option>
                        ))}
                    </select>
                )}
                {errores.tipo_documento_id && <p className="text-sm text-red-500 mt-1">{errores.tipo_documento_id}</p>}
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Descripción / Mensaje *</label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                    rows={4} className="w-full text-base border border-gray-200 rounded-lg px-3 py-2.5"
                    placeholder="Detalle el motivo o contenido del documento enviado..."/>
                {errores.descripcion && <p className="text-sm text-red-500 mt-1">{errores.descripcion}</p>}
            </div>

            {/* Archivos */}
            <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1 inline-flex items-center gap-1.5">
                    <Paperclip size={13}/> Documentos adjuntos
                </label>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={e => setArchivos(Array.from(e.target.files))}
                    className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#291136]/5 file:text-[#291136] hover:file:bg-[#291136]/10"/>
                {archivos.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{archivos.length} archivo(s) seleccionado(s)</p>
                )}
            </div>

            <div className="pt-2 border-t border-gray-100">
                <button type="submit" disabled={procesando}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-[#291136] text-white rounded-lg hover:bg-[#3d1a52] disabled:opacity-50 transition-colors">
                    <Send size={14}/> {procesando ? 'Enviando...' : 'Enviar documento'}
                </button>
                <p className="text-xs text-gray-400 mt-2">
                    Al enviar recibirás un número de cargo en tu correo como constancia.
                </p>
            </div>
        </form>
    );
}
