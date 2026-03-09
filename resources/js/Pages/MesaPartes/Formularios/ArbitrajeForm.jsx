import { useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import {
    User, Users, Scale, FileText, Paperclip,
    CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const opcionesTipoPersona = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Juridica' },
];

const opcionesSiNo = [
    { id: 1, nombre: 'Si, solicito designacion por el Director' },
    { id: 0, nombre: 'No, propongo arbitro'                     },
];

function Seccion({ icono: Icono, titulo, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={16} className="text-[#BE0F4A]" />
                </div>
                <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

export default function ArbitrajeForm({ servicio }) {
    const { auth } = usePage().props;
    const isAuth = !!auth?.user;
    const user   = auth?.user;

    const [aceptoLegal, setAceptoLegal]   = useState(isAuth); // Auth ya aceptó al registrarse
    const [modalLegal, setModalLegal]     = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        servicio_id:                    servicio.id,
        tipo_persona:                   isAuth ? (user.tipo_persona || 'natural') : 'natural',
        nombre_demandante:              isAuth ? user.name : '',
        documento_demandante:           isAuth ? (user.numero_documento || '') : '',
        nombre_representante:           '',
        documento_representante:        '',
        domicilio_demandante:           isAuth ? (user.direccion || '') : '',
        email_demandante:               isAuth ? user.email : '',
        telefono_demandante:            isAuth ? (user.telefono || '') : '',
        nombre_demandado:               '',
        domicilio_demandado:            '',
        email_demandado:                '',
        telefono_demandado:             '',
        resumen_controversia:           '',
        pretensiones:                   '',
        monto_involucrado:              '',
        solicita_designacion_director:  1,
        nombre_arbitro_propuesto:       '',
        email_arbitro_propuesto:        '',
        domicilio_arbitro_propuesto:    '',
        reglas_aplicables:              '',
        documentos_controversia:        [],
        documentos_anexos:              [],
    });

    // Mostrar toast cuando llegan errores del servidor
    const prevErrors = useRef({});
    useEffect(() => {
        if (errors.general && errors.general !== prevErrors.current.general) {
            toast.error(errors.general, { position: 'top-center', duration: 6000 });
            // Scroll al mensaje de error
            document.getElementById('error-general')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        prevErrors.current = errors;
    }, [errors]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!aceptoLegal) {
            setModalLegal(true);
            return;
        }

        // Validación mínima antes de enviar
        const requeridos = {
            nombre_demandante:   'Nombre del demandante',
            documento_demandante:'Documento del demandante',
            domicilio_demandante:'Domicilio del demandante',
            email_demandante:    'Correo del demandante',
            telefono_demandante: 'Teléfono del demandante',
            nombre_demandado:    'Nombre del demandado',
            domicilio_demandado: 'Domicilio del demandado',
            resumen_controversia:'Resumen de la controversia',
            pretensiones:        'Pretensiones',
        };

        for (const [campo, etiqueta] of Object.entries(requeridos)) {
            if (!data[campo]?.trim()) {
                toast.error(`El campo "${etiqueta}" es obligatorio`, { position: 'top-center' });
                document.getElementById(campo)?.focus();
                return;
            }
        }


        post(route('solicitud.arbitraje.store'), {
            preserveScroll: true,
            forceFormData:  true,
            onError: (errs) => {
                const primero = Object.values(errs)[0];
                toast.error(primero || 'Revise los campos marcados', { position: 'top-center' });
            },
        });
    };

    return (
        <>
        <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* ── Demandante ── */}
            <Seccion icono={User} titulo="Sus Datos (Demandante)">
                {isAuth && (
                    <div className="flex items-center gap-2 mb-5 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-xs font-semibold text-green-700">
                        <CheckCircle2 size={14} />
                        Identidad verificada — sus datos se han cargado automáticamente
                    </div>
                )}

                <div className="mb-5">
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Tipo de persona <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect
                        value={data.tipo_persona}
                        onChange={val => setData('tipo_persona', val)}
                        options={opcionesTipoPersona}
                        placeholder={null}
                        disabled={isAuth}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Input
                            id="nombre_demandante"
                            label={data.tipo_persona === 'juridica' ? 'Razón Social' : 'Nombre completo'}
                            required type="text"
                            value={data.nombre_demandante}
                            onChange={e => setData('nombre_demandante', e.target.value)}
                            disabled={isAuth}
                            placeholder="Juan Pérez López"
                            error={errors.nombre_demandante}
                        />
                    </div>
                    <Input
                        id="documento_demandante"
                        label={data.tipo_persona === 'juridica' ? 'RUC' : 'DNI / CE'}
                        required type="text"
                        value={data.documento_demandante}
                        onChange={e => setData('documento_demandante', e.target.value)}
                        disabled={isAuth}
                        placeholder="12345678"
                        error={errors.documento_demandante}
                    />
                    <Input
                        id="email_demandante"
                        label="Correo electrónico" required type="email"
                        value={data.email_demandante}
                        onChange={e => setData('email_demandante', e.target.value)}
                        disabled={isAuth}
                        placeholder="correo@ejemplo.com"
                        error={errors.email_demandante}
                    />
                </div>

                {data.tipo_persona === 'juridica' && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                        <Input label="Representante Legal" type="text"
                            value={data.nombre_representante}
                            onChange={e => setData('nombre_representante', e.target.value)} />
                        <Input label="DNI del Representante" type="text"
                            value={data.documento_representante}
                            onChange={e => setData('documento_representante', e.target.value)} />
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <Input
                            id="domicilio_demandante"
                            label="Domicilio de notificación" required type="text"
                            value={data.domicilio_demandante}
                            onChange={e => setData('domicilio_demandante', e.target.value)}
                            disabled={isAuth}
                            placeholder="Dirección completa"
                            error={errors.domicilio_demandante}
                        />
                    </div>
                    <Input
                        id="telefono_demandante"
                        label="Teléfono" required type="text"
                        value={data.telefono_demandante}
                        onChange={e => setData('telefono_demandante', e.target.value)}
                        disabled={isAuth}
                        placeholder="987654321"
                        error={errors.telefono_demandante}
                    />
                </div>
            </Seccion>

            {/* ── Demandado ── */}
            <Seccion icono={Users} titulo="Datos del Demandado">
                <div className="col-span-2">
                    <Input
                        id="nombre_demandado"
                        label="Nombre completo / Razón Social" required type="text"
                        value={data.nombre_demandado}
                        onChange={e => setData('nombre_demandado', e.target.value)}
                        placeholder="Nombre o razón social de a quién demanda"
                        error={errors.nombre_demandado}
                    />
                </div>
                <Input
                    id="domicilio_demandado"
                    label="Domicilio de notificación" required type="text"
                    value={data.domicilio_demandado}
                    onChange={e => setData('domicilio_demandado', e.target.value)}
                    placeholder="Dirección exacta del demandado"
                    error={errors.domicilio_demandado}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Correo electrónico" type="email"
                        value={data.email_demandado}
                        onChange={e => setData('email_demandado', e.target.value)}
                        placeholder="correo@ejemplo.com" />
                    <Input label="Teléfono" type="text"
                        value={data.telefono_demandado}
                        onChange={e => setData('telefono_demandado', e.target.value)}
                        placeholder="987654321" />
                </div>
            </Seccion>

            {/* ── Controversia ── */}
            <Seccion icono={Scale} titulo="Materia de la Controversia">
                <Textarea
                    id="resumen_controversia"
                    label="Resumen de la controversia" required
                    value={data.resumen_controversia}
                    onChange={e => setData('resumen_controversia', e.target.value)}
                    placeholder="Describa brevemente los hechos y el origen del conflicto..."
                    rows={4}
                    error={errors.resumen_controversia}
                />
                <Textarea
                    id="pretensiones"
                    label="Pretensiones" required
                    value={data.pretensiones}
                    onChange={e => setData('pretensiones', e.target.value)}
                    placeholder="Indique qué solicita al tribunal arbitral..."
                    rows={4}
                    error={errors.pretensiones}
                />
                <Input label="Monto involucrado (S/)" type="number" min="0" step="0.01"
                    value={data.monto_involucrado}
                    onChange={e => setData('monto_involucrado', e.target.value)}
                    placeholder="Ej: 50000.00"
                    error={errors.monto_involucrado}
                />

                <div className="mt-4">
                    <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                        Documentos de la Controversia <span className="text-gray-400 font-normal">(contratos, evidencias — opcional)</span>
                    </label>
                    <input
                        type="file" multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={e => setData('documentos_controversia', Array.from(e.target.files))}
                        className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#291136]/5 file:text-[#291136] hover:file:bg-[#291136]/10 cursor-pointer border border-gray-200 rounded-xl"
                    />
                    {data.documentos_controversia.length > 0 && (
                        <ul className="mt-2 space-y-1">
                            {data.documentos_controversia.map((f, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                                    <FileText size={12} className="text-[#BE0F4A]" /> {f.name}
                                    <span className="text-gray-400">({(f.size/1024/1024).toFixed(2)} MB)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Seccion>

            {/* ── Arbitraje ── */}
            <Seccion icono={FileText} titulo="Conformación del Tribunal">
                <div className="mb-5">
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Designación de Árbitro <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect
                        value={data.solicita_designacion_director}
                        onChange={val => setData('solicita_designacion_director', val)}
                        options={opcionesSiNo}
                        placeholder={null}
                    />
                </div>

                {data.solicita_designacion_director === 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input label="Nombre del Árbitro Propuesto" type="text"
                                value={data.nombre_arbitro_propuesto}
                                onChange={e => setData('nombre_arbitro_propuesto', e.target.value)} />
                        </div>
                        <Input label="Correo del Árbitro Propuesto" type="email"
                            value={data.email_arbitro_propuesto}
                            onChange={e => setData('email_arbitro_propuesto', e.target.value)} />
                        <Input label="Domicilio del Árbitro Propuesto" type="text"
                            value={data.domicilio_arbitro_propuesto}
                            onChange={e => setData('domicilio_arbitro_propuesto', e.target.value)} />
                    </div>
                )}

                <Input label="Reglas aplicables" type="text"
                    value={data.reglas_aplicables}
                    onChange={e => setData('reglas_aplicables', e.target.value)}
                    placeholder="Ej: Reglamento Ankawa, UNCITRAL..." />
            </Seccion>


            {/* ── Documentos Adjuntos ── */}
            <Seccion icono={Paperclip} titulo="Documentos Adjuntos (opcional)">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-blue-800">
                        Puede adjuntar documentos de respaldo como DNI, poderes notariales, comprobantes de pago, etc.
                        Estos quedarán registrados junto a su solicitud.
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Subir Archivos
                    </label>
                    <input
                        type="file" multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={e => setData('documentos_anexos', Array.from(e.target.files))}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#291136]/5 file:text-[#291136] hover:file:bg-[#291136]/10 cursor-pointer border border-gray-200 rounded-xl"
                    />
                    {data.documentos_anexos.length > 0 && (
                        <ul className="mt-4 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {data.documentos_anexos.map((file, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-center gap-2 font-medium">
                                    <FileText size={15} className="text-[#BE0F4A] shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-gray-400 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Seccion>

            {/* ── Aviso legal + Enviar ── */}
            {!aceptoLegal && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-blue-800">
                        <ShieldCheck size={20} className="text-blue-500 shrink-0" />
                        <span>Al enviar declara bajo juramento que la información es verídica (Ley N° 29733 — Protección de Datos).</span>
                    </div>
                </div>
            )}

            {errors.general && (
                <div id="error-general" className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800 font-medium">
                    <AlertTriangle size={18} className="text-red-500 shrink-0" />
                    {errors.general}
                </div>
            )}

            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base shadow-lg">
                    {processing ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </PrimaryButton>
            </div>

        </form>

        {/* Modal Legal (solo para no autenticados) */}
        {modalLegal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                    <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                        <ShieldCheck size={22} className="text-[#BE0F4A]" />
                        <h3 className="text-white font-bold">Declaración Jurada y Protección de Datos</h3>
                    </div>
                    <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                        <p>
                            De conformidad con la <strong>Ley N° 29733 — Ley de Protección de Datos Personales</strong>
                            y su Reglamento (D.S. 003-2013-JUS), el Centro de Arbitraje Ankawa Internacional le informa que:
                        </p>
                        <ul className="space-y-2 pl-4">
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                Sus datos serán tratados exclusivamente para la gestión del proceso arbitral.
                            </li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                No serán transferidos a terceros sin su consentimiento, salvo mandato legal.
                            </li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5" />
                                Tiene derecho de acceso, rectificación, cancelación y oposición (derechos ARCO).
                            </li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                            <p className="font-bold text-amber-800 mb-1">Declaración Jurada</p>
                            <p className="text-amber-700">
                                El suscrito declara bajo juramento que la información proporcionada es
                                verídica conforme al D.L. 1071.
                            </p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={() => setModalLegal(false)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button onClick={() => { setAceptoLegal(true); setModalLegal(false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50); }}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b]">
                            <CheckCircle2 size={16} />
                            Acepto y Envío
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
