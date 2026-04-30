import { useState, useMemo } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import {
    FileText, Clock, CheckCircle2, XCircle, AlertTriangle,
    FolderOpen, Upload, ChevronRight, ChevronDown, Download, ArrowRight,
    User, Edit3, Mail, Phone, Building2, HardHat, Scale, Briefcase,
    Users, Gavel, ShieldAlert, ShieldCheck, MapPin, FileCheck, Hash,
    Receipt, BookOpen, Search, Calendar, Layers, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ──────────────────────────────────────────────────────────────────
   Mapeos / utilidades
   ──────────────────────────────────────────────────────────────── */

const ESTADO_CONFIG = {
    pendiente: {
        icon:   <Clock size={18} className="text-amber-500" />,
        bg:     'bg-amber-50 border-amber-200',
        pill:   'bg-amber-100 text-amber-700',
        titulo: 'En revisión',
        desc:   'Tu solicitud está siendo revisada por la Secretaría General.',
    },
    subsanacion: {
        icon:   <AlertTriangle size={18} className="text-orange-500" />,
        bg:     'bg-orange-50 border-orange-200',
        pill:   'bg-orange-100 text-orange-700',
        titulo: 'Acción requerida — Subsanación',
        desc:   'La Secretaría encontró observaciones. Corrige los datos y/o documentos indicados.',
    },
    admitida: {
        icon:   <CheckCircle2 size={18} className="text-emerald-500" />,
        bg:     'bg-emerald-50 border-emerald-200',
        pill:   'bg-emerald-100 text-emerald-700',
        titulo: 'Admitida',
        desc:   'Tu solicitud fue admitida.',
    },
    rechazada: {
        icon:   <XCircle size={18} className="text-red-500" />,
        bg:     'bg-red-50 border-red-200',
        pill:   'bg-red-100 text-red-700',
        titulo: 'No admitida',
        desc:   'Tu solicitud no fue admitida a trámite.',
    },
};

const SERVICIO_META = {
    'arbitraje':            { icon: Scale,     accent: '#BE0F4A', label: 'Arbitraje' },
    'arbitraje-emergencia': { icon: Zap,       accent: '#BC1D35', label: 'Arbitraje de Emergencia' },
    'jprd':                 { icon: Gavel,     accent: '#291136', label: 'JPRD' },
    'otros':                { icon: Briefcase, accent: '#4A153D', label: 'Otros' },
};

const SUBTIPO_LABEL = {
    empresa:         'Empresa',
    consorcio:       'Consorcio',
    entidad_publica: 'Entidad Pública',
};

const TIPO_DOC_LABEL = {
    dni: 'DNI',
    ruc: 'RUC',
    ce:  'CE',
};

const formatMonto = v => v ? 'S/ ' + Number(v).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : '—';

/* ──────────────────────────────────────────────────────────────────
   Sub-componentes de presentación
   ──────────────────────────────────────────────────────────────── */

function Pill({ children, className = '' }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${className}`}>
            {children}
        </span>
    );
}

function DataRow({ label, children, mono = false }) {
    if (children == null || children === '' || (Array.isArray(children) && !children.length)) return null;
    return (
        <div className="grid grid-cols-3 gap-3 py-1.5">
            <dt className="text-[11px] uppercase tracking-wide font-bold text-gray-400">{label}</dt>
            <dd className={`col-span-2 text-sm text-gray-700 break-words ${mono ? 'font-mono' : ''}`}>{children}</dd>
        </div>
    );
}

function Section({ icon: Icon, titulo, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-gray-50/70 hover:bg-gray-50 transition-colors">
                <Icon size={15} className="text-[#BE0F4A] shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide text-[#291136] flex-1 text-left">{titulo}</span>
                <ChevronDown size={15} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <dl className="p-4 divide-y divide-gray-50">
                    {children}
                </dl>
            )}
        </div>
    );
}

function EmailLista({ emails }) {
    if (!emails || !emails.length) return null;
    return (
        <ul className="space-y-1">
            {emails.map((e, i) => {
                if (!e || !e.email) return null;
                return (
                    <li key={i} className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Mail size={11} className="text-gray-400 shrink-0" />
                        <span className="break-all">{e.email}</span>
                        {e.label && (
                            <Pill className="bg-[#BE0F4A]/10 text-[#BE0F4A]">{e.label}</Pill>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}

function ConsorcioLista({ empresas }) {
    if (!empresas?.length) return null;
    return (
        <ul className="space-y-1.5">
            {empresas.map((e, i) => (
                <li key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-2.5 py-1.5">
                    <Building2 size={12} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700 flex-1 truncate">{e.nombre || '—'}</span>
                    {e.ruc && <span className="font-mono text-xs text-gray-500">{e.ruc}</span>}
                </li>
            ))}
        </ul>
    );
}

/* ──────────────────────────────────────────────────────────────────
   Bloques específicos por servicio
   ──────────────────────────────────────────────────────────────── */

function BloquePersona({ titulo, datos, icon: Icon }) {
    if (!datos) return null;
    const esConsorcio = datos.subtipo_juridico === 'consorcio' || datos.subtipo === 'consorcio';
    const subtipoLabel = SUBTIPO_LABEL[datos.subtipo_juridico ?? datos.subtipo] || (datos.tipo_persona === 'natural' ? 'Persona Natural' : null);

    return (
        <Section icon={Icon} titulo={titulo}>
            <DataRow label="Tipo de persona">
                {datos.tipo_persona === 'juridica' ? 'Persona Jurídica' : datos.tipo_persona === 'natural' ? 'Persona Natural' : null}
                {subtipoLabel && datos.tipo_persona === 'juridica' && (
                    <span className="ml-2 text-xs text-gray-500">({subtipoLabel})</span>
                )}
            </DataRow>
            <DataRow label={TIPO_DOC_LABEL[datos.tipo_documento ?? datos.tipo_doc_identidad] ?? 'Documento'} mono>
                {datos.documento ?? datos.numero_doc_identidad}
            </DataRow>
            <DataRow label={esConsorcio ? 'Consorcio' : 'Nombre'}>{datos.nombre}</DataRow>

            {esConsorcio && datos.empresas_consorcio?.length > 0 && (
                <DataRow label="Empresas">
                    <ConsorcioLista empresas={datos.empresas_consorcio} />
                </DataRow>
            )}
            {esConsorcio && datos.empresas?.length > 0 && (
                <DataRow label="Empresas">
                    <ConsorcioLista empresas={datos.empresas} />
                </DataRow>
            )}

            {(datos.representante?.nombre || datos.representante?.documento || datos.representante?.dni) && (
                <DataRow label="Representante">
                    <div>
                        <div>{datos.representante.nombre || '—'}</div>
                        {(datos.representante.documento || datos.representante.dni) && (
                            <div className="text-xs text-gray-500 font-mono mt-0.5">
                                {TIPO_DOC_LABEL.dni}: {datos.representante.documento ?? datos.representante.dni}
                            </div>
                        )}
                    </div>
                </DataRow>
            )}

            <DataRow label="Domicilio">
                {datos.domicilio && (
                    <span className="flex items-start gap-1.5">
                        <MapPin size={11} className="text-gray-400 shrink-0 mt-1" />
                        <span>{datos.domicilio}</span>
                    </span>
                )}
            </DataRow>

            {datos.email && (
                <DataRow label="Correo principal">
                    <span className="flex items-center gap-1.5">
                        <Mail size={11} className="text-gray-400 shrink-0" />
                        <span className="break-all">{datos.email}</span>
                    </span>
                </DataRow>
            )}

            {datos.emails?.length > 0 && (
                <DataRow label="Correos registrados">
                    <EmailLista emails={datos.emails} />
                </DataRow>
            )}

            {datos.telefono && (
                <DataRow label="Teléfono">
                    <span className="flex items-center gap-1.5">
                        <Phone size={11} className="text-gray-400 shrink-0" />
                        {datos.telefono}
                    </span>
                </DataRow>
            )}
        </Section>
    );
}

function DetalleArbitraje({ datos }) {
    return (
        <div className="space-y-3">
            <BloquePersona titulo="Datos del Demandante" datos={datos.demandante} icon={User} />
            <BloquePersona titulo="Datos del Demandado"  datos={datos.demandado}  icon={Users} />

            <Section icon={BookOpen} titulo="Controversia y Pretensiones">
                <DataRow label="Resumen">{datos.controversia.resumen}</DataRow>
                <DataRow label="Pretensiones">
                    {datos.controversia.pretensiones && (
                        <p className="whitespace-pre-line">{datos.controversia.pretensiones}</p>
                    )}
                </DataRow>
                <DataRow label="Monto involucrado">{formatMonto(datos.controversia.monto_involucrado)}</DataRow>
                <DataRow label="Suma pretensiones determinadas">{formatMonto(datos.controversia.suma_pretensiones_determinadas)}</DataRow>
                <DataRow label="Pretensiones indeterminadas">{datos.controversia.pretensiones_indeterminadas}</DataRow>
                <DataRow label="Monto controversias">{datos.controversia.monto_controversias}</DataRow>
            </Section>

            <Section icon={Gavel} titulo="Conformación del Tribunal">
                <DataRow label="Designación de árbitro">
                    {datos.arbitro.solicita_designacion_director
                        ? <Pill className="bg-emerald-100 text-emerald-700">Sí, solicito designación por el Centro</Pill>
                        : <Pill className="bg-gray-100 text-gray-600">Propongo árbitro</Pill>}
                </DataRow>
                {!datos.arbitro.solicita_designacion_director && (
                    <>
                        <DataRow label="Árbitro propuesto">{datos.arbitro.nombre}</DataRow>
                        <DataRow label="Documento" mono>{datos.arbitro.documento}</DataRow>
                        <DataRow label="Correo">{datos.arbitro.email}</DataRow>
                        <DataRow label="Domicilio">{datos.arbitro.domicilio}</DataRow>
                    </>
                )}
            </Section>

            <Section icon={ShieldAlert} titulo="Medida Cautelar" defaultOpen={false}>
                <DataRow label="¿Tiene medida cautelar?">
                    {datos.medida_cautelar
                        ? <Pill className="bg-amber-100 text-amber-700">Sí, ya ejecutada</Pill>
                        : <Pill className="bg-gray-100 text-gray-600">No</Pill>}
                </DataRow>
            </Section>

            {(datos.factura?.ruc || datos.factura?.razon_social) && (
                <Section icon={Receipt} titulo="Datos de Facturación" defaultOpen={false}>
                    <DataRow label="RUC" mono>{datos.factura.ruc}</DataRow>
                    <DataRow label="Razón Social">{datos.factura.razon_social}</DataRow>
                </Section>
            )}
        </div>
    );
}

function DetalleJPRD({ datos }) {
    const esEntidad = datos.rol_solicitante === 'entidad';
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#291136]/5 border border-[#291136]/10 rounded-xl">
                <CheckCircle2 size={14} className="text-[#BE0F4A]" />
                <span className="text-xs font-semibold text-[#291136]">
                    Presentas como: <strong>{esEntidad ? 'Entidad Contratante' : 'Contratista'}</strong>
                </span>
            </div>

            <BloquePersona titulo={esEntidad ? "Datos de la Entidad (Solicitante)" : "Datos de la Entidad Contratante"}
                datos={datos.entidad} icon={Building2} />
            <BloquePersona titulo={esEntidad ? "Datos del Contratista" : "Datos del Contratista (Solicitante)"}
                datos={datos.contratista} icon={HardHat} />

            <Section icon={FileCheck} titulo="Petición de Decisión Vinculante" defaultOpen={false}>
                <DataRow label="¿Hubo petición previa?">
                    {datos.tiene_peticion_previa
                        ? <Pill className="bg-emerald-100 text-emerald-700">Sí</Pill>
                        : <Pill className="bg-gray-100 text-gray-600">No</Pill>}
                </DataRow>
                {datos.observacion && <DataRow label="Observación">{datos.observacion}</DataRow>}
            </Section>
        </div>
    );
}

function DetalleOtros({ datos }) {
    return (
        <div className="space-y-3">
            <BloquePersona titulo="Datos del Remitente" datos={datos.remitente} icon={User} />

            <Section icon={FileText} titulo="Contenido del Documento">
                <DataRow label="Tipo de documento">{datos.tipo_documento_nombre}</DataRow>
                <DataRow label="Descripción">
                    {datos.descripcion && <p className="whitespace-pre-line">{datos.descripcion}</p>}
                </DataRow>
                {datos.observacion && <DataRow label="Observación">{datos.observacion}</DataRow>}
            </Section>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────
   Subsanación (solo Arbitraje, mantiene flujo existente)
   ──────────────────────────────────────────────────────────────── */

function FormSubsanacion({ solicitud }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const [tab, setTab]           = useState('datos');
    const [procesando, setProcesando] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [archivosNuevos, setArchivosNuevos] = useState([]);
    const [eliminar, setEliminar] = useState([]);

    const dem = solicitud.datos.demandante;
    const dado = solicitud.datos.demandado;
    const cont = solicitud.datos.controversia;

    const [form, setForm] = useState({
        domicilio_demandante:  dem?.domicilio ?? '',
        nombre_demandado:      dado?.nombre ?? '',
        documento_demandado:   dado?.documento ?? '',
        email_demandado:       dado?.email ?? '',
        telefono_demandado:    dado?.telefono ?? '',
        domicilio_demandado:   dado?.domicilio ?? '',
        resumen_controversia:  cont?.resumen ?? '',
        pretensiones:          cont?.pretensiones ?? '',
        monto_involucrado:     cont?.monto_involucrado ?? '',
    });

    const campo = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const toggleEliminar = (id) => setEliminar(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleSubmit = () => {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (v !== null && v !== undefined) formData.append(k, v);
        });
        archivosNuevos.forEach((archivo, i) => formData.append(`documentos_nuevos[${i}]`, archivo));
        eliminar.forEach((id, i) => formData.append(`documentos_eliminar[${i}]`, id));

        setProcesando(true);
        router.post(route('mesa-partes.subsanar', solicitud.pk), formData, {
            forceFormData: true,
            onSuccess: (page) => {
                const msg = page.props.flash?.success;
                if (msg) toast.success(msg);
                setArchivosNuevos([]);
                setEliminar([]);
            },
            onError: (errs) => toast.error(errs.general ?? 'Error al guardar.'),
            onFinish: () => setProcesando(false),
        });
    };

    return (
        <div className="border border-[#BE0F4A]/20 rounded-xl overflow-hidden bg-white">
            <div className="flex border-b border-gray-100 bg-gray-50/80">
                {[
                    { key: 'datos',      label: 'Corregir datos', icon: <Edit3 size={13} /> },
                    { key: 'documentos', label: 'Documentos',     icon: <FileText size={13} /> },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold transition-all
                            ${tab === t.key
                                ? 'border-b-2 border-[#BE0F4A] text-[#BE0F4A] bg-white'
                                : 'text-gray-400 hover:text-gray-600'}`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            <div className="p-5 space-y-4">
                {tab === 'datos' && (
                    <div className="space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-[#291136] text-white text-xs font-bold flex items-center justify-center shrink-0">D</span>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Demandante</span>
                                <span className="text-xs text-gray-400">(solo domicilio editable)</span>
                            </div>
                            <input type="text" value={form.domicilio_demandante}
                                onChange={e => campo('domicilio_demandante', e.target.value)}
                                placeholder="Domicilio procesal"
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                        </div>

                        <hr className="border-gray-100" />

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-5 h-5 rounded-full bg-[#BE0F4A] text-white text-xs font-bold flex items-center justify-center shrink-0">D</span>
                                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide">Demandado</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { key: 'nombre_demandado',    label: 'Nombre completo',   type: 'text'  },
                                    { key: 'documento_demandado', label: 'N° Documento',      type: 'text'  },
                                    { key: 'email_demandado',     label: 'Correo electrónico', type: 'email' },
                                    { key: 'telefono_demandado',  label: 'Teléfono',          type: 'text'  },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                                        <input type={f.type} value={form[f.key]}
                                            onChange={e => campo(f.key, e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                                    </div>
                                ))}
                                <div className="md:col-span-2">
                                    <label className="block text-xs text-gray-500 mb-1">Domicilio</label>
                                    <input type="text" value={form.domicilio_demandado}
                                        onChange={e => campo('domicilio_demandado', e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div>
                            <div className="text-xs font-bold text-[#291136] uppercase tracking-wide mb-3">Controversia y Pretensiones</div>
                            <div className="space-y-3">
                                <textarea rows={3} value={form.resumen_controversia}
                                    onChange={e => campo('resumen_controversia', e.target.value)}
                                    placeholder="Resumen de la controversia"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                                <textarea rows={3} value={form.pretensiones}
                                    onChange={e => campo('pretensiones', e.target.value)}
                                    placeholder="Pretensiones"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A] resize-none" />
                                <input type="number" min={0} value={form.monto_involucrado}
                                    onChange={e => campo('monto_involucrado', e.target.value)}
                                    placeholder="Monto involucrado (S/)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]" />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'documentos' && (
                    <div className="space-y-4">
                        {solicitud.documentos?.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Documentos actuales</div>
                                <div className="space-y-1.5">
                                    {solicitud.documentos.map(doc => (
                                        <div key={doc.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                                                ${eliminar.includes(doc.id) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <FileText size={14} className="text-gray-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm text-gray-700 truncate">{doc.nombre_original}</div>
                                                <div className="text-xs text-gray-400">{doc.created_at}</div>
                                            </div>
                                            <button onClick={() => toggleEliminar(doc.id)}
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors
                                                    ${eliminar.includes(doc.id)
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                        : 'bg-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500'}`}>
                                                {eliminar.includes(doc.id) ? 'Deshacer' : 'Eliminar'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Agregar documentos nuevos</div>
                            <div
                                onDrop={e => {
                                    e.preventDefault();
                                    setDragOver(false);
                                    setArchivosNuevos(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                                }}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onClick={() => document.getElementById(`upload-edit-${solicitud.pk}`).click()}
                                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
                                    ${dragOver ? 'border-[#BE0F4A] bg-[#BE0F4A]/5' : 'border-gray-200 hover:border-[#BE0F4A]/40'}`}>
                                <input id={`upload-edit-${solicitud.pk}`} type="file" multiple
                                    accept={upload_accept} className="hidden"
                                    onChange={e => setArchivosNuevos(prev => [...prev, ...Array.from(e.target.files)])} />
                                <Upload size={18} className="mx-auto mb-2 text-gray-400" />
                                <p className="text-xs text-gray-500">
                                    Arrastra o <span className="text-[#BE0F4A] font-semibold">selecciona archivos</span>
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
                            </div>

                            {archivosNuevos.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                    {archivosNuevos.map((archivo, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                                            <FileText size={13} className="text-emerald-500 shrink-0" />
                                            <span className="text-xs text-gray-700 flex-1 truncate">{archivo.name}</span>
                                            <span className="text-xs text-gray-400">{(archivo.size/1024/1024).toFixed(1)}MB</span>
                                            <button onClick={() => setArchivosNuevos(prev => prev.filter((_, j) => j !== i))}
                                                className="text-gray-400 hover:text-red-500 text-lg leading-none">&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={procesando}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] disabled:opacity-50 transition-colors">
                    {procesando ? 'Guardando...' : 'Guardar cambios'}
                    {!procesando && <ArrowRight size={16} />}
                </button>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────
   Card principal
   ──────────────────────────────────────────────────────────────── */

function CardSolicitud({ solicitud }) {
    const [expandido, setExpandido] = useState(solicitud.estado === 'subsanacion');
    const config  = ESTADO_CONFIG[solicitud.estado] ?? ESTADO_CONFIG.pendiente;
    const meta    = SERVICIO_META[solicitud.tipo_servicio] ?? SERVICIO_META.otros;
    const Icon    = meta.icon;

    // Resumen del actor "más importante" según servicio
    const resumenContraparte = (() => {
        if (solicitud.tipo_servicio === 'jprd') {
            return solicitud.datos.rol_solicitante === 'entidad'
                ? solicitud.datos.contratista?.nombre
                : solicitud.datos.entidad?.nombre;
        }
        if (solicitud.tipo_servicio === 'otros') {
            return solicitud.datos.tipo_documento_nombre;
        }
        return solicitud.datos.demandado?.nombre;
    })();

    const resumenLabel = (() => {
        if (solicitud.tipo_servicio === 'jprd') {
            return solicitud.datos.rol_solicitante === 'entidad' ? 'Contratista' : 'Entidad';
        }
        if (solicitud.tipo_servicio === 'otros') return 'Tipo';
        return 'Demandado';
    })();

    const monto = solicitud.datos?.controversia?.monto_involucrado;

    const Detalle = {
        'arbitraje':            DetalleArbitraje,
        'arbitraje-emergencia': DetalleArbitraje,
        'jprd':                 DetalleJPRD,
        'otros':                DetalleOtros,
    }[solicitud.tipo_servicio];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">

            {/* Borde lateral por estado */}
            <div className={`flex border-l-4 ${
                solicitud.estado === 'subsanacion' ? 'border-l-orange-400'
                : solicitud.estado === 'admitida'  ? 'border-l-emerald-400'
                : solicitud.estado === 'rechazada' ? 'border-l-red-400'
                : 'border-l-amber-400'}`}>
                <div className="flex-1 min-w-0">

                    {/* ── Header ── */}
                    <div className={`px-5 py-4 border-b ${config.bg}`}>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm" style={{ color: meta.accent }}>
                                <Icon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-[#291136] text-sm">{solicitud.numero_cargo}</span>
                                    <Pill className="bg-white/70 text-[#291136] border border-gray-200">
                                        <Layers size={10} />{solicitud.servicio}
                                    </Pill>
                                    <Pill className={config.pill}>
                                        {config.icon && <span className="-ml-0.5">{config.icon}</span>}
                                        {config.titulo}
                                    </Pill>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-3 flex-wrap">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={11} /> {solicitud.created_at}
                                    </span>
                                    {solicitud.numero_expediente && (
                                        <span className="flex items-center gap-1 text-[#291136] font-semibold">
                                            <Hash size={11} /> {solicitud.numero_expediente}
                                        </span>
                                    )}
                                    {solicitud.acepta_reglamento_card && (
                                        <span className="flex items-center gap-1 text-emerald-600">
                                            <ShieldCheck size={11} /> Declaración aceptada
                                        </span>
                                    )}
                                </p>
                            </div>
                            {solicitud.estado === 'admitida' && solicitud.expediente_id && (
                                <Link href={route('expedientes.show', solicitud.expediente_id)}
                                    className="shrink-0 hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm">
                                    <FolderOpen size={13} />
                                    Ver expediente
                                    <ChevronRight size={11} />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* ── Body ── */}
                    <div className="p-5 space-y-4">

                        {/* Resumen rápido */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 bg-gray-50 rounded-xl px-4 py-3">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{resumenLabel}</div>
                                <div className="text-sm font-semibold text-[#291136] mt-0.5 truncate">
                                    {resumenContraparte || <span className="text-gray-400 font-normal">—</span>}
                                </div>
                            </div>
                            {monto != null && (
                                <div className="bg-[#BE0F4A]/5 rounded-xl px-4 py-3 border border-[#BE0F4A]/10">
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-[#BE0F4A]/70">Monto</div>
                                    <div className="text-sm font-bold text-[#BE0F4A] mt-0.5">{formatMonto(monto)}</div>
                                </div>
                            )}
                            {solicitud.tipo_servicio === 'otros' && (
                                <div className="bg-gray-50 rounded-xl px-4 py-3">
                                    <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Documentos</div>
                                    <div className="text-sm font-bold text-[#291136] mt-0.5">
                                        {solicitud.documentos?.length ?? 0}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Subsanación */}
                        {solicitud.estado === 'subsanacion' && solicitud.subsanacion_activa && (
                            <div className="space-y-4">
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                    <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <AlertTriangle size={12} />
                                        Observación de Secretaría
                                    </div>
                                    <p className="text-sm text-orange-800 leading-relaxed">{solicitud.subsanacion_activa.observacion}</p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-orange-600 font-semibold">
                                        <Clock size={12} />
                                        Plazo límite: {solicitud.subsanacion_activa.fecha_limite}
                                        ({solicitud.subsanacion_activa.plazo_dias} días hábiles)
                                    </div>
                                </div>
                                <FormSubsanacion solicitud={solicitud} />
                            </div>
                        )}

                        {/* Botón ver detalle */}
                        <button onClick={() => setExpandido(e => !e)}
                            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:border-[#BE0F4A] hover:text-[#BE0F4A] hover:bg-[#BE0F4A]/5 transition-colors">
                            <Search size={13} />
                            {expandido ? 'Ocultar detalles' : 'Ver todos los datos enviados'}
                            <ChevronDown size={13} className={`transition-transform ${expandido ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Detalle completo */}
                        {expandido && Detalle && (
                            <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Detalle datos={solicitud.datos} />

                                {/* Documentos */}
                                {solicitud.documentos?.length > 0 && (
                                    <Section icon={FileText} titulo={`Documentos adjuntos (${solicitud.documentos.length})`}>
                                        <div className="space-y-1.5 pt-1">
                                            {solicitud.documentos.map(doc => (
                                                <a key={doc.id}
                                                    href={route('documentos.descargar', doc.id)}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#BE0F4A]/5 transition-colors group border border-gray-100">
                                                    <FileText size={14} className="text-gray-400 group-hover:text-[#BE0F4A] shrink-0 transition-colors" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-gray-700 truncate font-medium">{doc.nombre_original}</div>
                                                        <div className="text-xs text-gray-400">{doc.tipo_documento} · {doc.created_at}</div>
                                                    </div>
                                                    <Download size={13} className="text-gray-300 group-hover:text-[#BE0F4A] shrink-0 transition-colors" />
                                                </a>
                                            ))}
                                        </div>
                                    </Section>
                                )}
                            </div>
                        )}

                        {/* Acción mobile */}
                        {solicitud.estado === 'admitida' && solicitud.expediente_id && (
                            <Link href={route('expedientes.show', solicitud.expediente_id)}
                                className="sm:hidden w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                <FolderOpen size={13} />
                                Ver expediente
                                <ChevronRight size={11} />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────────
   Página: Mis Solicitudes
   ──────────────────────────────────────────────────────────────── */

export default function MisSolicitudes({ solicitudes }) {
    const [filtro, setFiltro] = useState('todas');

    const ordenadas = useMemo(() => {
        const arr = [...solicitudes].sort((a, b) => {
            const prioridad = { subsanacion: 0, pendiente: 1, admitida: 2, rechazada: 3 };
            return (prioridad[a.estado] ?? 4) - (prioridad[b.estado] ?? 4);
        });
        if (filtro === 'todas') return arr;
        return arr.filter(s => s.estado === filtro);
    }, [solicitudes, filtro]);

    const conteos = useMemo(() => ({
        todas:       solicitudes.length,
        subsanacion: solicitudes.filter(s => s.estado === 'subsanacion').length,
        pendiente:   solicitudes.filter(s => s.estado === 'pendiente').length,
        admitida:    solicitudes.filter(s => s.estado === 'admitida').length,
        rechazada:   solicitudes.filter(s => s.estado === 'rechazada').length,
    }), [solicitudes]);

    const filtros = [
        { key: 'todas',       label: 'Todas',          color: 'bg-[#291136] text-white'        },
        { key: 'subsanacion', label: 'Por subsanar',   color: 'bg-orange-500 text-white'       },
        { key: 'pendiente',   label: 'En revisión',    color: 'bg-amber-500 text-white'        },
        { key: 'admitida',    label: 'Admitidas',      color: 'bg-emerald-500 text-white'      },
        { key: 'rechazada',   label: 'No admitidas',   color: 'bg-red-500 text-white'          },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Mis Solicitudes" />

            {/* Hero header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-l-4 border-[#BE0F4A]">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-[#291136] tracking-tight uppercase"
                                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                Mis Solicitudes
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Seguimiento completo de tus solicitudes presentadas en Mesa de Partes
                            </p>
                        </div>
                        <Link href={route('mesa-partes.nueva-solicitud')}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-colors shadow-sm">
                            <FileText size={15} />
                            Nueva Solicitud
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="py-8">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Filtros */}
                    {solicitudes.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-6">
                            {filtros.map(f => {
                                const activo = filtro === f.key;
                                const cnt = conteos[f.key];
                                if (cnt === 0 && f.key !== 'todas') return null;
                                return (
                                    <button key={f.key} onClick={() => setFiltro(f.key)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all
                                            ${activo
                                                ? `${f.color} shadow-sm`
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                        {activo && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                        {f.label}
                                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activo ? 'bg-white/20' : 'bg-white text-gray-500'}`}>
                                            {cnt}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {ordenadas.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center text-gray-400">
                            <FileText size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-gray-600">
                                {solicitudes.length === 0
                                    ? 'Aún no tienes solicitudes registradas'
                                    : 'No hay solicitudes en este estado'}
                            </p>
                            {solicitudes.length === 0 && (
                                <>
                                    <p className="text-sm mt-1 mb-6">Presenta tu primera solicitud desde la Mesa de Partes Virtual.</p>
                                    <Link href={route('mesa-partes.index')}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#BC1D35] transition-colors">
                                        Ir a Mesa de Partes
                                        <ArrowRight size={15} />
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {ordenadas.map(s => (
                                <CardSolicitud key={s.id} solicitud={s} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
