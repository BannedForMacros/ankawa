import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import EmailsInput from '@/Components/EmailsInput';
import ConfirmModal from '@/Components/ConfirmModal';
import AnkawaLoader from '@/Components/AnkawaLoader';
import {
    User, Users, Scale, FileText, Paperclip,
    CheckCircle2, AlertTriangle, ChevronRight, ShieldCheck,
    Loader2, X, Lock, Unlock, ShieldAlert, CreditCard, Plus, Trash2, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Constantes ─── */
const TIPOS_PERSONA = [
    { id: 'natural',  nombre: 'Persona Natural'  },
    { id: 'juridica', nombre: 'Persona Jurídica' },
];
const SUBTIPOS_JURIDICA = [
    { id: 'empresa',         nombre: 'Empresa'         },
    { id: 'consorcio',       nombre: 'Consorcio'       },
    { id: 'entidad_publica', nombre: 'Entidad Pública' },
];
const OPCIONES_ARBITRO = [
    { id: 1, nombre: 'Sí, solicito designación por el Centro' },
    { id: 0, nombre: 'No, propongo árbitro'                   },
];
const LONG_DOC = { dni: 8, ruc: 11, ce: null };

function docDefaultPorPersona(tipo) {
    return tipo === 'juridica' ? 'ruc' : 'dni';
}

/* ─── Sección visual ─── */
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

/* ─── Multi-archivo con append/remove ─── */
function MultiArchivoInput({ label, value = [], onChange, accept }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const acceptValue  = accept ?? upload_accept;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const inputRef = useRef();
    const [previewFile, setPreviewFile] = useState(null);

    function agregar(e) {
        const nuevos = Array.from(e.target.files).filter(
            n => !value.some(a => a.name === n.name && a.size === n.size)
        );
        onChange([...value, ...nuevos]);
        e.target.value = '';
    }

    function closePreview() {
        if (previewFile) URL.revokeObjectURL(previewFile._objectUrl);
        setPreviewFile(null);
    }

    return (
        <div>
            {label && <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">{label}</label>}
            <button type="button" onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#BE0F4A] hover:text-[#BE0F4A] transition-colors w-full justify-center">
                <Paperclip size={15}/> Agregar archivos
            </button>
            <input ref={inputRef} type="file" multiple accept={acceptValue} onChange={agregar} className="hidden" />
            <p className="text-xs text-gray-400 mt-1.5 text-center">{formatsLabel} — máx. {upload_max_mb} MB por archivo</p>
            {value.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                    {value.map((f, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
                            <FileText size={18} className="text-[#BE0F4A] shrink-0"/>
                            <button type="button" onClick={() => setPreviewFile(f)}
                                className="truncate flex-1 text-sm font-medium text-gray-700 hover:text-[#BE0F4A] hover:underline text-left transition-colors">
                                {f.name}
                            </button>
                            <span className="text-sm text-gray-400 shrink-0">{(f.size/1024).toFixed(0)} KB</span>
                            <button type="button" onClick={() => onChange(value.filter((_,j) => j !== i))}
                                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            )}
            {previewFile && (() => {
                const url = URL.createObjectURL(previewFile);
                const ext = previewFile.name.split('.').pop().toLowerCase();
                const esImagen = ['jpg','jpeg','png','gif','webp'].includes(ext);
                const esPdf   = ext === 'pdf';
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closePreview}>
                        <div className="absolute inset-0 bg-black/60"/>
                        <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-[#BE0F4A]"/>
                                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[400px]">{previewFile.name}</span>
                                </div>
                                <button type="button" onClick={closePreview} className="text-gray-400 hover:text-gray-700 transition-colors">
                                    <X size={20}/>
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
                                {esImagen && <img src={url} alt={previewFile.name} className="max-w-full max-h-[70vh] rounded object-contain"/>}
                                {esPdf && <iframe src={url} title={previewFile.name} className="w-full h-[70vh] rounded border-0"/>}
                                {!esImagen && !esPdf && (
                                    <div className="text-center">
                                        <FileText size={48} className="mx-auto mb-3 text-gray-300"/>
                                        <p className="text-base font-medium text-gray-500">Vista previa no disponible</p>
                                        <p className="text-sm mt-1 text-gray-400">Este tipo de archivo no puede previsualizarse en el navegador.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

/* ─── Buscador de DNI para representante ─── */
function RepresentanteDNI({ dniValue, nombreValue, onDniChange, onNombreChange, label = 'Representante Legal' }) {
    const [cargando, setCargando]   = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const timerRef = useRef();

    async function onChangeDni(val) {
        const clean = val.replace(/\D/g, '').slice(0, 8);
        if (bloqueado && clean !== dniValue) {
            setBloqueado(false);
            onNombreChange('');
        }
        onDniChange(clean);
        clearTimeout(timerRef.current);
        if (clean.length === 8) {
            timerRef.current = setTimeout(() => buscar(clean), 500);
        }
    }

    async function buscar(dni) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'dni', numero: dni } });
            onNombreChange(data.nombre ?? '');
            setBloqueado(true);
        } catch {
            toast('DNI no encontrado. Complete el nombre manualmente.', { icon: 'ℹ️', duration: 3000 });
            onNombreChange('');
            setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onDniChange('');
        onNombreChange('');
    }

    return (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    DNI del {label} <span className="text-[#BE0F4A]">*</span>
                </label>
                <div className="relative">
                    <input type="text" value={dniValue}
                        onChange={e => onChangeDni(e.target.value)}
                        maxLength={8} placeholder="12345678"
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 transition-colors ${
                            dniValue.length === 8 && bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado &&
                            <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>}
                        {!cargando && !bloqueado && dniValue.length === 8 &&
                            <CheckCircle2 size={13} className="text-emerald-500"/>}
                    </div>
                </div>
                {bloqueado && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> Verificado vía RENIEC</p>
                )}
            </div>
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    Nombre del {label} <span className="text-[#BE0F4A]">*</span>
                </label>
                <input type="text" value={nombreValue}
                    onChange={e => onNombreChange(e.target.value)}
                    disabled={bloqueado}
                    placeholder="Nombre completo"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 ${bloqueado ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-gray-200'}`} />
            </div>
        </div>
    );
}

/* ─── Fila de empresa en consorcio ─── */
function FilaEmpresaConsorcio({ empresa, onUpdate, onRemove }) {
    const [cargando, setCargando]   = useState(false);
    const [bloqueado, setBloqueado] = useState(!!empresa.nombre);
    const timerRef = useRef();

    async function onRucChange(val) {
        const clean = val.replace(/\D/g, '').slice(0, 11);
        if (bloqueado && clean !== empresa.ruc) { setBloqueado(false); onUpdate({ ruc: clean, nombre: '' }); return; }
        onUpdate({ ruc: clean, nombre: bloqueado ? empresa.nombre : empresa.nombre });
        clearTimeout(timerRef.current);
        if (clean.length === 11) {
            timerRef.current = setTimeout(() => buscarRuc(clean), 500);
        }
    }

    async function buscarRuc(ruc) {
        setCargando(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'ruc', numero: ruc } });
            onUpdate({ ruc, nombre: data.nombre ?? '' });
            setBloqueado(true);
        } catch {
            toast('RUC no encontrado. Complete el nombre manualmente.', { icon: 'ℹ️', duration: 3000 });
            onUpdate({ ruc, nombre: '' });
            setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    function limpiar() {
        setBloqueado(false);
        onUpdate({ ruc: '', nombre: '' });
    }

    return (
        <div className="grid grid-cols-5 gap-2 items-end">
            <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">RUC</label>
                <div className="relative">
                    <input type="text" value={empresa.ruc} onChange={e => onRucChange(e.target.value)}
                        maxLength={11} placeholder="20xxxxxxxxx"
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 ${
                            empresa.ruc.length === 11 && bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado &&
                            <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>}
                    </div>
                </div>
            </div>
            <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Razón Social</label>
                <input type="text" value={empresa.nombre} onChange={e => onUpdate({ nombre: e.target.value })}
                    disabled={bloqueado}
                    placeholder="Nombre de la empresa"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 ${bloqueado ? 'bg-gray-50 text-gray-500' : 'border-gray-200'}`} />
            </div>
            <div className="flex items-end pb-0.5">
                <button type="button" onClick={onRemove}
                    className="flex items-center justify-center w-full py-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 size={15}/>
                </button>
            </div>
        </div>
    );
}

/* ─── Panel Consorcio: orden empresas → representante → contrato ─── */
function PanelConsorcio({ esDemandante, portalEmail, empresas, onEmpresasChange, representante, onRepresentanteChange, docContrato, onDocContratoChange }) {
    const [cargandoRep, setCargandoRep] = useState(false);
    const [bloqueadoRep, setBloqueadoRep] = useState(false);
    const timerRepRef = useRef();

    function agregarEmpresa() {
        onEmpresasChange([...empresas, { ruc: '', nombre: '' }]);
    }

    function actualizarEmpresa(idx, cambios) {
        onEmpresasChange(empresas.map((e, i) => i === idx ? { ...e, ...cambios } : e));
    }

    function eliminarEmpresa(idx) {
        onEmpresasChange(empresas.filter((_, i) => i !== idx));
    }

    async function onDniRepChange(val) {
        const clean = val.replace(/\D/g, '').slice(0, 8);
        if (bloqueadoRep && clean !== representante.dni) {
            setBloqueadoRep(false);
            onRepresentanteChange({ dni: clean, nombre: '' });
            return;
        }
        onRepresentanteChange({ dni: clean });
        clearTimeout(timerRepRef.current);
        if (clean.length === 8) {
            timerRepRef.current = setTimeout(() => buscarRep(clean), 500);
        }
    }

    async function buscarRep(dni) {
        setCargandoRep(true);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo: 'dni', numero: dni } });
            onRepresentanteChange({ dni, nombre: data.nombre ?? '' });
            setBloqueadoRep(true);
        } catch {
            toast('DNI no encontrado. Complete el nombre manualmente.', { icon: 'ℹ️', duration: 3000 });
            onRepresentanteChange({ dni, nombre: '' });
            setBloqueadoRep(false);
        } finally {
            setCargandoRep(false);
        }
    }

    function limpiarRep() {
        setBloqueadoRep(false);
        onRepresentanteChange({ dni: '', nombre: '' });
    }

    return (
        <div className="mt-4 space-y-5 bg-gray-50 rounded-xl border border-gray-200 p-4">

            {/* 1. Empresas del consorcio */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70">
                        Empresas que forman el consorcio <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <button type="button" onClick={agregarEmpresa}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#BE0F4A] hover:text-[#9c0a3b] transition-colors">
                        <Plus size={13}/> Agregar empresa
                    </button>
                </div>
                {empresas.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Agregue al menos una empresa del consorcio.</p>
                )}
                <div className="space-y-2">
                    {empresas.map((emp, idx) => (
                        <FilaEmpresaConsorcio key={idx} empresa={emp}
                            onUpdate={cambios => actualizarEmpresa(idx, cambios)}
                            onRemove={() => eliminarEmpresa(idx)} />
                    ))}
                </div>
            </div>

            {/* 2. Representante del consorcio */}
            <div>
                <p className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70 mb-3">
                    Representante del Consorcio <span className="text-[#BE0F4A]">*</span>
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">DNI <span className="text-[#BE0F4A]">*</span></label>
                        <div className="relative">
                            <input type="text" value={representante.dni ?? ''}
                                onChange={e => onDniRepChange(e.target.value)}
                                maxLength={8} placeholder="12345678"
                                className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 ${
                                    representante.dni?.length === 8 && bloqueadoRep ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                                }`} />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                {cargandoRep && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                                {!cargandoRep && bloqueadoRep &&
                                    <button type="button" onClick={limpiarRep}><X size={13} className="text-gray-400 hover:text-red-500"/></button>}
                                {!cargandoRep && !bloqueadoRep && representante.dni?.length === 8 &&
                                    <CheckCircle2 size={13} className="text-emerald-500"/>}
                            </div>
                        </div>
                        {bloqueadoRep && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> Verificado vía RENIEC</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nombre <span className="text-[#BE0F4A]">*</span></label>
                        <input type="text" value={representante.nombre ?? ''}
                            onChange={e => onRepresentanteChange({ nombre: e.target.value })}
                            disabled={bloqueadoRep}
                            placeholder="Nombre completo"
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 ${bloqueadoRep ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-gray-200'}`} />
                    </div>
                </div>

                {/* Email del representante */}
                {esDemandante ? (
                    portalEmail ? (
                        <div className="mt-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Correo del Representante</label>
                            <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-medium">
                                <CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>
                                {portalEmail}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no puede modificarse</p>
                        </div>
                    ) : null
                ) : (
                    <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                            Correo del Representante <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <input type="email" value={representante.email ?? ''}
                            onChange={e => onRepresentanteChange({ email: e.target.value })}
                            placeholder="correo@empresa.com"
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5" />
                    </div>
                )}
            </div>

            {/* 3. Contrato notariado de consorcio */}
            <MultiArchivoInput
                label="Contrato notariado de consorcio *"
                value={docContrato}
                onChange={onDocContratoChange} />
        </div>
    );
}

/* ─── Bloque de Persona (demandante o demandado) ─── */
function BloquePersona({
    titulo, icono: Icono, campos, setCampos, errors, bloquearTipoPersona,
    conRepresentante, esDemandante, portalEmail,
    subtipoJuridico, onSubtipoChange,
    docVigenciaPoder, onDocVigenciaPoderChange,
    docContratoConsorcio, onDocContratoConsorcioChange,
    docResolucionFacultades, onDocResolucionFacultadesChange,
    empresasConsorcio, onEmpresasConsorcioChange,
    representanteConsorcio, onRepresentanteConsorcioChange,
}) {
    const [tipoPersona, setTipoPersona] = useState(campos.tipo_persona || 'natural');
    const [tipoDoc,     setTipoDoc]     = useState(campos.tipo_documento || 'dni');
    const [cargando,    setCargando]    = useState(false);
    const [bloqueado,   setBloqueado]   = useState(false);
    const [modoManual,  setModoManual]  = useState(false);
    const timerRef = useRef();

    // Para campos jurídicos (RUC/nombre) siempre editables aunque sea usuario auth
    // Solo los campos de persona natural se bloquean si el usuario ya está identificado
    const esNaturalBloqueado = bloquearTipoPersona && tipoPersona === 'natural';
    const esConsorcio = tipoPersona === 'juridica' && subtipoJuridico === 'consorcio';

    const opcionesDoc = tipoPersona === 'juridica'
        ? [{ id: 'ruc', nombre: 'RUC (11 dígitos)' }]
        : [{ id: 'dni', nombre: 'DNI (8 dígitos)' }, { id: 'ce', nombre: 'Carné de Extranjería' }];

    function cambiarPersona(val) {
        const nuevoDoc = docDefaultPorPersona(val);
        setTipoPersona(val);
        setTipoDoc(nuevoDoc);
        setBloqueado(false); setModoManual(false);
        setCampos({ tipo_persona: val, tipo_documento: nuevoDoc, documento: '', nombre: '', domicilio: '' });
        onSubtipoChange('');
    }

    function cambiarTipoDoc(val) {
        setTipoDoc(val);
        setBloqueado(false); setModoManual(false);
        setCampos({ tipo_documento: val, documento: '', nombre: '', domicilio: '' });
    }

    function onDocChange(val) {
        const clean = val.replace(/\D/g, '');
        if (clean.length === 11 && clean.startsWith('2') && tipoDoc !== 'ruc') {
            setTipoDoc('ruc'); setTipoPersona('juridica');
            setCampos({ tipo_persona: 'juridica', tipo_documento: 'ruc', documento: clean });
            consultarAPI('ruc', clean);
            return;
        }
        setCampos({ documento: clean });
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => consultarAPI(tipoDoc, clean), 500);
    }

    async function consultarAPI(tipo, numero) {
        const lon = LONG_DOC[tipo];
        if (lon && numero.length !== lon) return;
        if (tipo === 'ce' && numero.length < 6) return;

        setCargando(true); setModoManual(false);
        try {
            const { data } = await axios.get(route('consulta.documento'), { params: { tipo, numero } });
            const cambios = { nombre: data.nombre ?? '' };
            if (tipo === 'ruc' && data.domicilio) cambios.domicilio = data.domicilio;
            setCampos(cambios);
            setBloqueado(true);
        } catch (err) {
            if (err.response?.status === 404) {
                toast('Documento no encontrado. Complete manualmente.', { icon: 'ℹ️', duration: 3000 });
            } else {
                toast('Consulta no disponible. Complete manualmente.', { icon: '⚠️', duration: 3000 });
            }
            setModoManual(true); setBloqueado(false);
        } finally {
            setCargando(false);
        }
    }

    function limpiarDoc() {
        setBloqueado(false); setModoManual(false);
        setCampos({ documento: '', nombre: '', domicilio: '' });
    }

    const lon             = LONG_DOC[tipoDoc];
    const docValido       = lon ? campos.documento?.length === lon : (campos.documento?.length ?? 0) >= 6;
    const esLocked        = bloqueado && !modoManual && !esNaturalBloqueado;
    const domicilioLocked = esNaturalBloqueado || (esLocked && tipoDoc === 'ruc');

    return (
        <Seccion icono={Icono} titulo={titulo}>
            <div className="space-y-4">

                {/* Tipo persona */}
                <div>
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Tipo de persona <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect value={tipoPersona} onChange={cambiarPersona}
                        options={TIPOS_PERSONA} placeholder={null} disabled={bloquearTipoPersona} />
                </div>

                {/* Sub-tipo jurídico */}
                {tipoPersona === 'juridica' && (
                    <div>
                        <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                            Tipo de persona jurídica <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <CustomSelect value={subtipoJuridico || ''} onChange={onSubtipoChange}
                            options={SUBTIPOS_JURIDICA} placeholder="Seleccione..." />
                    </div>
                )}

                {/* ── Campos de identidad: se ocultan para consorcio ── */}
                {!esConsorcio && (
                    <>
                        {/* Tipo doc + Número */}
                        <div className="grid grid-cols-5 gap-3">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                                    Tipo doc. <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <CustomSelect value={tipoDoc} onChange={cambiarTipoDoc}
                                    options={opcionesDoc} placeholder={null}
                                    disabled={esNaturalBloqueado || tipoPersona === 'juridica'} />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                                    N° documento <span className="text-[#BE0F4A]">*</span>
                                    {lon && <span className="text-gray-400 font-normal ml-1">({lon} díg.)</span>}
                                </label>
                                <div className="relative">
                                    <input type="text" value={campos.documento ?? ''}
                                        onChange={e => onDocChange(e.target.value)}
                                        disabled={esNaturalBloqueado}
                                        maxLength={lon ?? 20}
                                        placeholder={tipoDoc === 'ruc' ? '20xxxxxxxxx' : tipoDoc === 'dni' ? '12345678' : ''}
                                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-9 transition-colors ${
                                            errors?.documento ? 'border-red-400 bg-red-50' :
                                            docValido && bloqueado ? 'border-emerald-400 bg-emerald-50' :
                                            esNaturalBloqueado ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
                                        }`}
                                    />
                                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                                        {cargando && <Loader2 size={14} className="animate-spin text-gray-400"/>}
                                        {!cargando && bloqueado && !esNaturalBloqueado &&
                                            <button type="button" onClick={limpiarDoc} title="Limpiar">
                                                <X size={14} className="text-gray-400 hover:text-red-500"/>
                                            </button>}
                                        {!cargando && !bloqueado && docValido && !esNaturalBloqueado &&
                                            <CheckCircle2 size={14} className="text-emerald-500"/>}
                                    </div>
                                </div>
                                {errors?.documento && <p className="text-xs text-red-500 mt-1">{errors.documento}</p>}
                            </div>
                        </div>

                        {bloqueado && !esNaturalBloqueado && (
                            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                <Lock size={12}/> Datos verificados automáticamente vía RENIEC/SUNAT
                            </div>
                        )}
                        {modoManual && (
                            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                <Unlock size={12}/> Complete los datos manualmente
                            </div>
                        )}

                        {/* Nombre / Razón Social */}
                        <Input label={tipoPersona === 'juridica' ? 'Razón Social' : 'Nombre completo'} required
                            type="text" value={campos.nombre ?? ''}
                            onChange={e => setCampos({ nombre: e.target.value })}
                            disabled={esNaturalBloqueado || esLocked}
                            placeholder={tipoPersona === 'juridica' ? 'Empresa S.A.C.' : 'Juan Pérez López'}
                            error={errors?.nombre} />

                        {/* Representante para empresa/entidad_publica — con DNI lookup */}
                        {tipoPersona === 'juridica' && (subtipoJuridico === 'empresa' || subtipoJuridico === 'entidad_publica') && (
                            <RepresentanteDNI
                                label={subtipoJuridico === 'entidad_publica' ? 'Funcionario a Cargo' : 'Representante Legal'}
                                dniValue={campos.documento_representante ?? ''}
                                nombreValue={campos.nombre_representante ?? ''}
                                onDniChange={v => setCampos({ documento_representante: v })}
                                onNombreChange={v => setCampos({ nombre_representante: v })}
                            />
                        )}

                    </>
                )}

                {/* Domicilio — siempre visible */}
                <Input label="Domicilio de notificación" required type="text"
                    value={campos.domicilio ?? ''}
                    onChange={e => setCampos({ domicilio: e.target.value })}
                    disabled={domicilioLocked}
                    placeholder="Dirección completa"
                    error={errors?.domicilio} />

                {/* ── Paneles según sub-tipo jurídico ── */}

                {/* Empresa → Vigencia de Poder */}
                {tipoPersona === 'juridica' && subtipoJuridico === 'empresa' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-blue-800 font-semibold">
                            <Building2 size={15} className="shrink-0"/>
                            Documento requerido: <span className="font-bold">Vigencia de Poder</span>
                        </div>
                        <MultiArchivoInput
                            label="Adjuntar Vigencia de Poder *"
                            value={docVigenciaPoder}
                            onChange={onDocVigenciaPoderChange} />
                    </div>
                )}

                {/* Consorcio → Panel completo */}
                {esConsorcio && (
                    <PanelConsorcio
                        esDemandante={esDemandante}
                        portalEmail={portalEmail}
                        empresas={empresasConsorcio}
                        onEmpresasChange={onEmpresasConsorcioChange}
                        representante={representanteConsorcio}
                        onRepresentanteChange={onRepresentanteConsorcioChange}
                        docContrato={docContratoConsorcio}
                        onDocContratoChange={onDocContratoConsorcioChange}
                    />
                )}

                {/* Entidad pública → Resolución de facultades */}
                {tipoPersona === 'juridica' && subtipoJuridico === 'entidad_publica' && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-blue-800 font-semibold">
                            <Building2 size={15} className="shrink-0"/>
                            Documento requerido: <span className="font-bold">Resolución de facultades del funcionario a cargo</span>
                        </div>
                        <MultiArchivoInput
                            label="Adjuntar Resolución de Facultades *"
                            value={docResolucionFacultades}
                            onChange={onDocResolucionFacultadesChange} />
                    </div>
                )}

            </div>
        </Seccion>
    );
}

/* ─── Formulario principal ─── */
export default function ArbitrajeForm({ servicio, portalEmail, portalUser }) {
    const { auth } = usePage().props;
    const isPortal = !!portalEmail;
    const isAuth   = !!auth?.user && !isPortal;
    const user     = isPortal ? portalUser : auth?.user;

    const tipoPersInicial = user ? (user.tipo_persona || 'natural') : 'natural';

    const [aceptoLegal, setAceptoLegal]     = useState(isAuth || isPortal);
    const [modalLegal, setModalLegal]       = useState(false);
    const [confirm, setConfirm]             = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState('');
    // Controla si los datos del demandante están bloqueados (pre-cargados del usuario autenticado)
    const [demandanteBloqueado, setDemandanteBloqueado] = useState(isAuth || isPortal);
    const emailInicial = isPortal ? portalEmail : (isAuth ? user?.email : '');
    const [emailsDem, setEmailsDem]         = useState(emailInicial ? [{ email: emailInicial, label: '' }] : [{ email: '', label: '' }]);
    const [emailsDado, setEmailsDado]       = useState([]);
    const loaderTimer                       = useRef(null);

    // Sub-tipos jurídicos
    const [subtipoJuridicoDem,  setSubtipoJuridicoDem]  = useState('');
    const [subtipoJuridicoDado, setSubtipoJuridicoDado] = useState('');

    // Empresas de consorcio
    const [empresasConsorcioDem,  setEmpresasConsorcioDem]  = useState([]);
    const [empresasConsorcioDado, setEmpresasConsorcioDado] = useState([]);

    // Representante de consorcio
    const [repConsorcioDem,  setRepConsorcioDem]  = useState({ dni: '', nombre: '' });
    const [repConsorcioDado, setRepConsorcioDado] = useState({ dni: '', nombre: '', email: '' });

    // Documentos de sub-tipo jurídico
    const [docVigenciaPoderDem,         setDocVigenciaPoderDem]         = useState([]);
    const [docContratoConsorcioDem,     setDocContratoConsorcioDem]     = useState([]);
    const [docResolucionFacultadesDem,  setDocResolucionFacultadesDem]  = useState([]);
    const [docVigenciaPoderDado,        setDocVigenciaPoderDado]        = useState([]);
    const [docContratoConsorcioDado,    setDocContratoConsorcioDado]    = useState([]);
    const [docResolucionFacultadesDado, setDocResolucionFacultadesDado] = useState([]);

    const { data, setData, processing, errors } = useForm({
        servicio_id:                   servicio.id,
        // Demandante
        tipo_persona:                  tipoPersInicial,
        tipo_documento:                docDefaultPorPersona(tipoPersInicial),
        nombre_demandante:             user?.name ?? '',
        documento_demandante:          user?.numero_documento ?? '',
        nombre_representante:          '',
        documento_representante:       '',
        domicilio_demandante:          user?.direccion ?? '',
        email_demandante:              emailInicial ?? '',
        telefono_demandante:           user?.telefono ?? '',
        // Demandado
        tipo_persona_demandado:        'natural',
        tipo_documento_demandado:      'dni',
        nombre_demandado:              '',
        documento_demandado:           '',
        domicilio_demandado:           '',
        email_demandado:               '',
        telefono_demandado:            '',
        nombre_representante_dem:      '',
        documento_representante_dem:   '',
        // Controversia
        resumen_controversia:          '',
        pretensiones:                  '',
        monto_involucrado:             '',
        documentos_controversia:       [],
        // Árbitro
        solicita_designacion_director: 1,
        nombre_arbitro_propuesto:      '',
        email_arbitro_propuesto:       '',
        domicilio_arbitro_propuesto:   '',
        reglas_aplicables:             '',
        acepta_reglamento_card:        false,
        precision_reglas:              '',
        // Medida cautelar
        tiene_medida_cautelar:         false,
        documentos_medida_cautelar:    [],
        // Tasa
        comprobante_pago_tasa:         [],
        // Adjuntos
        documentos_anexos:             [],
    });

    const setCamposDem = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona              !== undefined ? { tipo_persona:              cambios.tipo_persona }              : {}),
        ...(cambios.tipo_documento            !== undefined ? { tipo_documento:             cambios.tipo_documento }            : {}),
        ...(cambios.documento                 !== undefined ? { documento_demandante:       cambios.documento }                 : {}),
        ...(cambios.nombre                    !== undefined ? { nombre_demandante:          cambios.nombre }                    : {}),
        ...(cambios.domicilio                 !== undefined ? { domicilio_demandante:       cambios.domicilio }                 : {}),
        ...(cambios.nombre_representante      !== undefined ? { nombre_representante:       cambios.nombre_representante }      : {}),
        ...(cambios.documento_representante   !== undefined ? { documento_representante:    cambios.documento_representante }   : {}),
    })), [setData]);

    const setCamposDado = useCallback((cambios) => setData(d => ({
        ...d,
        ...(cambios.tipo_persona           !== undefined ? { tipo_persona_demandado:        cambios.tipo_persona }           : {}),
        ...(cambios.tipo_documento         !== undefined ? { tipo_documento_demandado:       cambios.tipo_documento }         : {}),
        ...(cambios.documento              !== undefined ? { documento_demandado:            cambios.documento }              : {}),
        ...(cambios.nombre                 !== undefined ? { nombre_demandado:               cambios.nombre }                 : {}),
        ...(cambios.domicilio              !== undefined ? { domicilio_demandado:            cambios.domicilio }              : {}),
        ...(cambios.nombre_representante   !== undefined ? { nombre_representante_dem:       cambios.nombre_representante }   : {}),
        ...(cambios.documento_representante!== undefined ? { documento_representante_dem:    cambios.documento_representante }: {}),
    })), [setData]);

    const prevErrors = useRef({});
    useEffect(() => {
        if (errors.general && errors.general !== prevErrors.current.general) {
            toast.error(errors.general, { position: 'top-center', duration: 6000 });
        }
        prevErrors.current = errors;
    }, [errors]);

    const [tiposDocumento,  setTiposDocumento]  = useState([]);
    const [cargandoTipos,   setCargandoTipos]   = useState(true);
    const [tipoDocumentoId, setTipoDocumentoId] = useState('');

    useEffect(() => {
        setCargandoTipos(true);
        fetch(route('servicios.tipos-documento', servicio.id))
            .then(r => r.json())
            .then(tiposData => {
                setTiposDocumento(tiposData);
                if (tiposData.length === 1) setTipoDocumentoId(String(tiposData[0].id));
                setCargandoTipos(false);
            })
            .catch(() => setCargandoTipos(false));
    }, [servicio.id]);

    function mostrarError(msg) {
        setErrorValidacion(msg);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!aceptoLegal) { setModalLegal(true); return; }

        // Campos obligatorios básicos
        const camposObligatorios = [
            [data.resumen_controversia, 'Resumen de la controversia'],
            [data.pretensiones,         'Pretensiones'],
        ];
        // Demandante: solo si no es consorcio
        if (data.tipo_persona !== 'juridica' || subtipoJuridicoDem !== 'consorcio') {
            camposObligatorios.push([data.nombre_demandante,    'Nombre del demandante']);
            camposObligatorios.push([data.documento_demandante, 'Documento del demandante']);
        }
        for (const [val, label] of camposObligatorios) {
            if (!val?.toString().trim()) {
                mostrarError(`"${label}" es obligatorio`);
                return;
            }
        }

        // Sub-tipo jurídico demandante
        if (data.tipo_persona === 'juridica') {
            if (!subtipoJuridicoDem) {
                mostrarError('Seleccione el tipo de persona jurídica del demandante');
                return;
            }
            if (subtipoJuridicoDem === 'consorcio') {
                if (empresasConsorcioDem.length === 0) { mostrarError('Agregue al menos una empresa del consorcio (demandante)'); return; }
                if (!repConsorcioDem.dni || repConsorcioDem.dni.length !== 8) { mostrarError('Ingrese el DNI del representante del consorcio (demandante)'); return; }
                if (!repConsorcioDem.nombre?.trim()) { mostrarError('Ingrese el nombre del representante del consorcio (demandante)'); return; }
            }
        }

        // Sub-tipo jurídico demandado
        if (data.tipo_persona_demandado === 'juridica') {
            if (!subtipoJuridicoDado) { mostrarError('Seleccione el tipo de persona jurídica del demandado'); return; }
            if (subtipoJuridicoDado === 'consorcio') {
                if (empresasConsorcioDado.length === 0) { mostrarError('Agregue al menos una empresa del consorcio (demandado)'); return; }
                if (!repConsorcioDado.dni || repConsorcioDado.dni.length !== 8) { mostrarError('Ingrese el DNI del representante del consorcio (demandado)'); return; }
                if (!repConsorcioDado.nombre?.trim()) { mostrarError('Ingrese el nombre del representante del consorcio (demandado)'); return; }
                if (!repConsorcioDado.email?.trim()) { mostrarError('Ingrese el correo del representante del consorcio (demandado)'); return; }
            }
        }

        // Reglamento CARD
        if (data.solicita_designacion_director === 1 && !data.acepta_reglamento_card) {
            mostrarError('Debe aceptar el reglamento del CARD ANKAWA INT para continuar');
            return;
        }

        const emailPrincipal = emailsDem.find(e => e.email.trim());
        if (!emailPrincipal) { mostrarError('Ingresa al menos un correo electrónico del demandante'); return; }

        if (data.tipo_persona !== 'juridica' || subtipoJuridicoDem !== 'consorcio') {
            const lon = LONG_DOC[data.tipo_documento];
            if (lon && data.documento_demandante.length !== lon) {
                mostrarError(`Documento del demandante debe tener ${lon} dígitos`);
                return;
            }
        }

        setErrorValidacion('');
        setConfirm(true);
    };

    const enviarFormulario = () => {
        setConfirm(false);
        loaderTimer.current = setTimeout(() => setMostrarLoader(true), 300);

        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => {
            if (v === null || v === undefined) return;
            if (Array.isArray(v)) {
                v.forEach(f => fd.append(k + '[]', f instanceof File ? f : String(f)));
            } else if (typeof v === 'boolean') {
                fd.append(k, v ? '1' : '0');
            } else {
                fd.append(k, v);
            }
        });

        // Tipo de documento de la solicitud
        if (tipoDocumentoId) fd.append('tipo_documento_id', tipoDocumentoId);

        // Emails
        fd.set('email_demandante', emailsDem[0]?.email ?? '');
        fd.append('emails_demandante', JSON.stringify(emailsDem.filter(e => e.email.trim())));
        fd.append('emails_demandado',  JSON.stringify(emailsDado.filter(e => e.email.trim())));

        // Sub-tipos jurídicos
        fd.append('subtipo_juridico_demandante', subtipoJuridicoDem);
        fd.append('subtipo_juridico_demandado',  subtipoJuridicoDado);

        // Consorcio demandante
        fd.append('empresas_consorcio_demandante', JSON.stringify(empresasConsorcioDem));
        if (subtipoJuridicoDem === 'consorcio') {
            fd.set('nombre_representante',    repConsorcioDem.nombre ?? '');
            fd.set('documento_representante', repConsorcioDem.dni ?? '');
            // Para consorcio, usar el representante como nombre/doc de la cuenta
            if (!fd.get('nombre_demandante')) {
                fd.set('nombre_demandante',    repConsorcioDem.nombre ?? '');
                fd.set('documento_demandante', repConsorcioDem.dni ?? '');
            }
        }

        // Consorcio demandado
        fd.append('empresas_consorcio_demandado',            JSON.stringify(empresasConsorcioDado));
        fd.append('nombre_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.nombre ?? '') : (data.nombre_representante_dem ?? ''));
        fd.append('documento_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.dni ?? '') : (data.documento_representante_dem ?? ''));
        fd.append('email_representante_consorcio_demandado', repConsorcioDado.email ?? '');

        // Archivos de sub-tipo jurídico
        const gruposArchivos = {
            doc_vigencia_poder_dem:         docVigenciaPoderDem,
            doc_contrato_consorcio_dem:     docContratoConsorcioDem,
            doc_resolucion_facultades_dem:  docResolucionFacultadesDem,
            doc_vigencia_poder_dado:        docVigenciaPoderDado,
            doc_contrato_consorcio_dado:    docContratoConsorcioDado,
            doc_resolucion_facultades_dado: docResolucionFacultadesDado,
        };
        Object.entries(gruposArchivos).forEach(([key, files]) => {
            files.forEach(f => fd.append(key + '[]', f));
        });

        router.post(route('solicitud.arbitraje.store'), fd, {
            forceFormData: true,
            onFinish: () => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
            },
            onError: (errs) => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                toast.error(Object.values(errs)[0] || 'Revise los campos', { position: 'top-center' });
            },
        });
    };

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <ConfirmModal
            open={confirm}
            titulo="Confirmar solicitud de arbitraje"
            resumen={`Se enviará la solicitud de arbitraje del servicio "${servicio.nombre}" a nombre de ${data.nombre_demandante || (empresasConsorcioDem[0]?.nombre ? 'Consorcio: ' + empresasConsorcioDem[0].nombre : '—')}. Se generará un cargo y se enviarán credenciales de acceso al correo registrado.`}
            onConfirm={enviarFormulario}
            onCancel={() => setConfirm(false)}
            confirmando={processing}
        />
        <form onSubmit={handleSubmit} encType="multipart/form-data">

                {/* Tipo de solicitud */}
            {cargandoTipos ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3 mb-2"/>
                    <div className="h-9 bg-gray-100 animate-pulse rounded-xl"/>
                </div>
            ) : tiposDocumento.length === 1 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]"/>
                        </div>
                        <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Tipo de solicitud</h2>
                    </div>
                    <div className="px-6 py-4 flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-[#291136]/10 text-[#291136]">
                            {tiposDocumento[0].nombre}
                        </span>
                    </div>
                </div>
            ) : tiposDocumento.length > 1 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                            <FileText size={16} className="text-[#BE0F4A]"/>
                        </div>
                        <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">Tipo de solicitud</h2>
                    </div>
                    <div className="px-6 py-4">
                        <select value={tipoDocumentoId} onChange={e => setTipoDocumentoId(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#BE0F4A]">
                            <option value="">Seleccionar tipo...</option>
                            {tiposDocumento.map(td => <option key={td.id} value={td.id}>{td.nombre}</option>)}
                        </select>
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 mb-5 bg-amber-50 border border-amber-200 rounded-2xl">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0"/>
                    <p className="text-sm text-amber-700 font-semibold">
                        No hay tipos de documento configurados para este servicio.
                    </p>
                </div>
            )}

            {/* Bloque Demandante */}
            {demandanteBloqueado ? (
                <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                        <CheckCircle2 size={14}/> Identidad verificada — datos cargados automáticamente
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setDemandanteBloqueado(false);
                            setCamposDem({ tipo_persona: 'natural', tipo_documento: 'dni', documento: '', nombre: '', domicilio: '', nombre_representante: '', documento_representante: '' });
                            setEmailsDem([{ email: '', label: '' }]);
                            setSubtipoJuridicoDem('');
                            setEmpresasConsorcioDem([]);
                            setRepConsorcioDem({ dni: '', nombre: '' });
                        }}
                        className="text-xs font-semibold text-green-600 hover:text-red-600 underline underline-offset-2 transition-colors shrink-0"
                    >
                        Cambiar persona
                    </button>
                </div>
            ) : (isAuth || isPortal) ? (
                <div className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-700">
                    <AlertTriangle size={14}/> Ingresando datos de otra persona
                </div>
            ) : null}
            <BloquePersona
                icono={User} titulo="Sus Datos (Demandante)"
                campos={{
                    tipo_persona:            data.tipo_persona,
                    tipo_documento:          data.tipo_documento,
                    documento:               data.documento_demandante,
                    nombre:                  data.nombre_demandante,
                    domicilio:               data.domicilio_demandante,
                    nombre_representante:    data.nombre_representante,
                    documento_representante: data.documento_representante,
                }}
                setCampos={setCamposDem}
                errors={{ documento: errors.documento_demandante, nombre: errors.nombre_demandante, domicilio: errors.domicilio_demandante }}
                bloquearTipoPersona={demandanteBloqueado}
                conRepresentante={true}
                esDemandante={true}
                portalEmail={portalEmail}
                subtipoJuridico={subtipoJuridicoDem}
                onSubtipoChange={setSubtipoJuridicoDem}
                docVigenciaPoder={docVigenciaPoderDem}
                onDocVigenciaPoderChange={setDocVigenciaPoderDem}
                docContratoConsorcio={docContratoConsorcioDem}
                onDocContratoConsorcioChange={setDocContratoConsorcioDem}
                docResolucionFacultades={docResolucionFacultadesDem}
                onDocResolucionFacultadesChange={setDocResolucionFacultadesDem}
                empresasConsorcio={empresasConsorcioDem}
                onEmpresasConsorcioChange={setEmpresasConsorcioDem}
                representanteConsorcio={repConsorcioDem}
                onRepresentanteConsorcioChange={cambios => setRepConsorcioDem(r => ({ ...r, ...cambios }))}
            />

            {/* Email(s) y teléfono del demandante */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="col-span-2">
                        {isPortal ? (
                            <div>
                                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                                    Correo del demandante <span className="text-[#BE0F4A]">*</span>
                                </label>
                                <div className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 rounded-xl px-4 py-2.5 text-sm text-emerald-800 font-medium">
                                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0"/>
                                    {portalEmail}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Correo verificado por OTP — no puede modificarse</p>
                            </div>
                        ) : (
                            <EmailsInput
                                label="Correos del demandante (para notificaciones)"
                                value={emailsDem}
                                onChange={setEmailsDem}
                                required
                                placeholder="correo@ejemplo.com"
                                error={errors.email_demandante}
                            />
                        )}
                    </div>
                </div>
                <Input id="telefono_demandante" label="Teléfono" required type="text"
                    value={data.telefono_demandante} onChange={e => setData('telefono_demandante', e.target.value)}
                    disabled={isAuth || (isPortal && !!user?.telefono)} placeholder="987654321" error={errors.telefono_demandante} />
            </div>

            {/* Bloque Demandado */}
            <BloquePersona
                icono={Users} titulo="Datos del Demandado"
                campos={{
                    tipo_persona:            data.tipo_persona_demandado,
                    tipo_documento:          data.tipo_documento_demandado,
                    documento:               data.documento_demandado,
                    nombre:                  data.nombre_demandado,
                    domicilio:               data.domicilio_demandado,
                    nombre_representante:    data.nombre_representante_dem,
                    documento_representante: data.documento_representante_dem,
                }}
                setCampos={setCamposDado}
                errors={{ documento: errors.documento_demandado, nombre: errors.nombre_demandado, domicilio: errors.domicilio_demandado }}
                bloquearTipoPersona={false}
                conRepresentante={false}
                esDemandante={false}
                portalEmail={null}
                subtipoJuridico={subtipoJuridicoDado}
                onSubtipoChange={setSubtipoJuridicoDado}
                docVigenciaPoder={docVigenciaPoderDado}
                onDocVigenciaPoderChange={setDocVigenciaPoderDado}
                docContratoConsorcio={docContratoConsorcioDado}
                onDocContratoConsorcioChange={setDocContratoConsorcioDado}
                docResolucionFacultades={docResolucionFacultadesDado}
                onDocResolucionFacultadesChange={setDocResolucionFacultadesDado}
                empresasConsorcio={empresasConsorcioDado}
                onEmpresasConsorcioChange={setEmpresasConsorcioDado}
                representanteConsorcio={repConsorcioDado}
                onRepresentanteConsorcioChange={cambios => setRepConsorcioDado(r => ({ ...r, ...cambios }))}
            />

            {/* Email(s) y teléfono del demandado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 -mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Input label="Correo electrónico del demandado" type="email"
                        value={data.email_demandado} onChange={e => setData('email_demandado', e.target.value)}
                        placeholder="correo@ejemplo.com" error={errors.email_demandado} />
                    <Input label="Teléfono del demandado" type="text"
                        value={data.telefono_demandado} onChange={e => setData('telefono_demandado', e.target.value)}
                        placeholder="987654321" error={errors.telefono_demandado} />
                </div>
                <EmailsInput
                    label="Correos adicionales del demandado (para notificaciones)"
                    value={emailsDado}
                    onChange={setEmailsDado}
                    required={false}
                    placeholder="correo@ejemplo.com"
                />
            </div>

            {/* Controversia */}
            <Seccion icono={Scale} titulo="Materia de la Controversia">
                <Textarea id="resumen_controversia" label="Resumen de la controversia" required
                    value={data.resumen_controversia} onChange={e => setData('resumen_controversia', e.target.value)}
                    placeholder="Describa brevemente los hechos y el origen del conflicto..." rows={4}
                    error={errors.resumen_controversia} />
                <Textarea id="pretensiones" label="Pretensiones" required
                    value={data.pretensiones} onChange={e => setData('pretensiones', e.target.value)}
                    placeholder="Indique qué solicita al tribunal arbitral..." rows={4}
                    error={errors.pretensiones} />
                <Input label="Monto involucrado (S/)" type="number" min="0" step="0.01"
                    value={data.monto_involucrado} onChange={e => setData('monto_involucrado', e.target.value)}
                    placeholder="Ej: 50000.00" error={errors.monto_involucrado} />
                <div className="mt-4">
                    <MultiArchivoInput
                        label="Convenio Arbitral (Contrato donde figura la cláusula arbitral, orden de servicio u orden de compra, si existe)"
                        value={data.documentos_controversia}
                        onChange={v => setData('documentos_controversia', v)} />
                </div>
            </Seccion>

            {/* Conformación del Tribunal */}
            <Seccion icono={FileText} titulo="Conformación del Tribunal">
                <div className="mb-5">
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Designación de Árbitro <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect value={data.solicita_designacion_director}
                        onChange={val => setData(d => ({ ...d, solicita_designacion_director: val, acepta_reglamento_card: false, precision_reglas: '' }))}
                        options={OPCIONES_ARBITRO} placeholder={null} />
                </div>

                {data.solicita_designacion_director === 1 && (
                    <div className="mt-4 space-y-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox"
                                checked={data.acepta_reglamento_card}
                                onChange={e => setData('acepta_reglamento_card', e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-[#BE0F4A] cursor-pointer" />
                            <span className="text-sm font-semibold text-amber-900 leading-snug">
                                Aceptación expresa de conocer y someterse a los reglamentos del CARD ANKAWA INT
                                <span className="text-[#BE0F4A] ml-1">*</span>
                            </span>
                        </label>
                        <div>
                            <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                                Cualquier precisión relativa a las reglas de arbitraje
                                <span className="text-gray-400 font-normal ml-1">(máx. 100 caracteres)</span>
                            </label>
                            <textarea maxLength={100} rows={2} value={data.precision_reglas}
                                onChange={e => setData('precision_reglas', e.target.value)}
                                placeholder="Indique cualquier precisión adicional sobre las reglas..."
                                className="w-full text-sm border border-amber-200 bg-white rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-amber-400" />
                            <p className="text-xs text-gray-400 text-right mt-0.5">{data.precision_reglas.length}/100</p>
                        </div>
                    </div>
                )}

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
                        <div className="col-span-2">
                            <Input label="Reglas aplicables" type="text"
                                value={data.reglas_aplicables} onChange={e => setData('reglas_aplicables', e.target.value)}
                                placeholder="Ej: Reglamento Ankawa, UNCITRAL..." />
                        </div>
                    </div>
                )}
            </Seccion>

            {/* Medida Cautelar */}
            <Seccion icono={ShieldAlert} titulo="Medida Cautelar">
                <p className="text-sm text-gray-600 mb-4">
                    ¿Se ha ejecutado una medida cautelar por una autoridad judicial o por un árbitro de emergencia?
                </p>
                <div className="flex gap-3">
                    <button type="button"
                        onClick={() => setData('tiene_medida_cautelar', true)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                            data.tiene_medida_cautelar ? 'bg-[#291136] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {data.tiene_medida_cautelar && <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse"/>}
                        Sí
                    </button>
                    <button type="button"
                        onClick={() => setData(d => ({ ...d, tiene_medida_cautelar: false, documentos_medida_cautelar: [] }))}
                        className={`px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                            !data.tiene_medida_cautelar ? 'bg-[#291136] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {!data.tiene_medida_cautelar && <span className="w-1.5 h-1.5 rounded-full bg-[#BE0F4A] animate-pulse"/>}
                        No
                    </button>
                </div>
                {data.tiene_medida_cautelar && (
                    <div className="mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-3 text-sm text-blue-800">
                            Puede adjuntar uno o más archivos que acrediten la medida cautelar ejecutada (resolución judicial, laudo de emergencia, etc.).
                        </div>
                        <MultiArchivoInput
                            label="Documentos de la medida cautelar"
                            value={data.documentos_medida_cautelar}
                            onChange={v => setData('documentos_medida_cautelar', v)} />
                    </div>
                )}
            </Seccion>

            {/* Tasa de Solicitud */}
            <Seccion icono={CreditCard} titulo="Tasa de Solicitud de Arbitraje">
                <MultiArchivoInput
                    label="Copia del comprobante de pago (opcional)"
                    value={data.comprobante_pago_tasa}
                    onChange={v => setData('comprobante_pago_tasa', v)} />
            </Seccion>

            {/* Adjuntos */}
            <Seccion icono={Paperclip} titulo="Documentos Adjuntos (Anexos)">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Recomendación</p>
                    <p className="text-sm text-blue-700">
                        Antes de adjuntar, <strong>renombre cada archivo</strong> con el tipo de documento que representa
                        (ej: <em>DNI_representante.pdf</em>, <em>Poder_notarial.pdf</em>, <em>Contrato_principal.pdf</em>).
                        Esto facilita la revisión del expediente.
                    </p>
                </div>
                <MultiArchivoInput value={data.documentos_anexos} onChange={v => setData('documentos_anexos', v)} />
            </Seccion>

            {/* Aviso legal */}
            {!aceptoLegal && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-sm text-blue-800">
                    <ShieldCheck size={20} className="text-blue-500 shrink-0"/>
                    <span>Al enviar declara bajo juramento que la información es verídica (Ley N° 29733).</span>
                </div>
            )}
            {(errorValidacion || errors.general) && (
                <div className="mb-5 p-4 bg-red-50 border border-red-400 rounded-xl flex items-center gap-3 text-sm text-red-800 font-semibold">
                    <AlertTriangle size={18} className="text-red-500 shrink-0"/>
                    {errorValidacion || errors.general}
                </div>
            )}
            <div className="flex justify-end">
                <PrimaryButton type="submit" disabled={processing} className="px-8 py-3 text-base shadow-lg">
                    {processing ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </PrimaryButton>
            </div>
        </form>

        {/* Modal Legal */}
        {modalLegal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                    <div className="bg-[#291136] px-6 py-4 flex items-center gap-3">
                        <ShieldCheck size={22} className="text-[#BE0F4A]"/>
                        <h3 className="text-white font-bold">Declaración Jurada y Protección de Datos</h3>
                    </div>
                    <div className="p-6 max-h-80 overflow-y-auto text-sm text-gray-600 leading-relaxed space-y-3">
                        <p>De conformidad con la <strong>Ley N° 29733</strong> y D.S. 003-2013-JUS:</p>
                        <ul className="space-y-2 pl-4">
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>Sus datos serán usados exclusivamente para la gestión del proceso arbitral.</li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>No serán transferidos a terceros sin su consentimiento, salvo mandato legal.</li>
                            <li className="flex gap-2"><ChevronRight size={14} className="text-[#BE0F4A] shrink-0 mt-0.5"/>Tiene derechos ARCO (Acceso, Rectificación, Cancelación, Oposición).</li>
                        </ul>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                            <p className="font-bold text-amber-800 mb-1">Declaración Jurada</p>
                            <p className="text-amber-700">Declaro bajo juramento que la información es verídica conforme al D.L. 1071.</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button onClick={() => setModalLegal(false)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button onClick={() => { setAceptoLegal(true); setModalLegal(false); setTimeout(() => document.querySelector('form')?.requestSubmit(), 50); }}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b]">
                            <CheckCircle2 size={16}/> Acepto y Envío
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
