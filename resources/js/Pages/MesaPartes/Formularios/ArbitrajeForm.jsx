import { useForm, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Input from '@/Components/Input';
import Textarea from '@/Components/Textarea';
import CustomSelect from '@/Components/CustomSelect';
import PrimaryButton from '@/Components/PrimaryButton';
import EmailsInput from '@/Components/EmailsInput';
import AnkawaLoader from '@/Components/AnkawaLoader';
import Checkbox from '@/Components/Checkbox';
import AceptacionReglamento from '@/Components/AceptacionReglamento';
import HCaptchaWidget from '@/Components/HCaptchaWidget';
import { filtrarArchivosValidos } from '@/utils/archivos';
import { consultarDocumento } from '@/utils/consultaDocumento';
import useDocumentoLookup from '@/hooks/useDocumentoLookup';
import { z } from 'zod';
import { validarZod, validarCampo } from '@/lib/validar';
import { confirmar } from '@/lib/swalAnkawa';
import FilePreviewModal from '@/Components/FilePreviewModal';
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
export const LONG_DOC = { dni: 8, ruc: 11, ce: null };

export function docDefaultPorPersona(tipo) {
    return tipo === 'juridica' ? 'ruc' : 'dni';
}

/* ─── Sección visual ─── */
export function Seccion({ icono: Icono, titulo, descripcion, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="w-8 h-8 rounded-lg bg-[#BE0F4A]/10 flex items-center justify-center">
                    <Icono size={16} className="text-[#BE0F4A]" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-[#291136] uppercase tracking-wide">{titulo}</h2>
                    {descripcion && (
                        <p className="text-xs text-gray-500 mt-0.5">{descripcion}</p>
                    )}
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

/* ─── Multi-archivo con append/remove ─── */
export function MultiArchivoInput({ label, value = [], onChange, accept }) {
    const { upload_accept, upload_mimes, upload_max_mb } = usePage().props;
    const acceptValue  = accept ?? upload_accept;
    const formatsLabel = (upload_mimes ?? []).map(m => m.toUpperCase()).join(', ');
    const inputRef = useRef();
    const [previewFile, setPreviewFile] = useState(null);

    function agregar(e) {
        const nuevos = filtrarArchivosValidos(e.target.files, { mimes: upload_mimes, maxMb: upload_max_mb })
            .filter(n => !value.some(a => a.name === n.name && a.size === n.size));
        onChange([...value, ...nuevos]);
        e.target.value = '';
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
            <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        </div>
    );
}

/* ─── Buscador de DNI para representante ─── */
function RepresentanteDNI({ dniValue, nombreValue, onDniChange, onNombreChange, label = 'Representante Legal', required = true, contexto = 'form_representante' }) {
    const { cargando, bloqueado, onChange, limpiar } = useDocumentoLookup({
        tipo: 'dni',
        longitud: 8,
        onResuelto: (doc, nom) => { onDniChange(doc); if (nom !== null) onNombreChange(nom); },
        mensajeNoEncontrado: 'DNI no encontrado. Complete el nombre manualmente.',
        limpiarNombreEnFallo: true,
        contexto,
    });

    return (
        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    DNI del {label} {required && <span className="text-[#BE0F4A]">*</span>}
                </label>
                <div className="relative">
                    <input type="text" value={dniValue}
                        onChange={e => onChange(e.target.value)}
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
                    Nombre del {label} {required && <span className="text-[#BE0F4A]">*</span>}
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

/* ─── Buscador de RUC con razón social (API SUNAT) ─── */
export function RucBuscador({ rucValue, razonSocialValue, onRucChange, onRazonSocialChange, label = 'Empresa', required = false }) {
    const { cargando, bloqueado, onChange, limpiar } = useDocumentoLookup({
        tipo: 'ruc',
        longitud: 11,
        onResuelto: (doc, nom) => { onRucChange(doc); if (nom !== null) onRazonSocialChange(nom); },
        mensajeNoEncontrado: 'RUC no encontrado. Complete la razón social manualmente.',
        limpiarNombreEnFallo: true,
        bloqueadoInicial: !!razonSocialValue,
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    RUC del {label} {required && <span className="text-[#BE0F4A]">*</span>}
                </label>
                <div className="relative">
                    <input type="text" value={rucValue}
                        onChange={e => onChange(e.target.value)}
                        maxLength={11} placeholder="20xxxxxxxxx"
                        className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 transition-colors ${
                            rucValue.length === 11 && bloqueado ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200'
                        }`} />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {cargando && <Loader2 size={13} className="animate-spin text-gray-400"/>}
                        {!cargando && bloqueado &&
                            <button type="button" onClick={limpiar}><X size={13} className="text-gray-400 hover:text-red-500"/></button>}
                        {!cargando && !bloqueado && rucValue.length === 11 &&
                            <CheckCircle2 size={13} className="text-emerald-500"/>}
                    </div>
                </div>
                {bloqueado && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><Lock size={10}/> Verificado vía SUNAT</p>
                )}
            </div>
            <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                    Razón Social {required && <span className="text-[#BE0F4A]">*</span>}
                </label>
                <input type="text" value={razonSocialValue}
                    onChange={e => onRazonSocialChange(e.target.value)}
                    disabled={bloqueado}
                    placeholder="Razón social de la empresa"
                    className={`w-full text-sm border rounded-xl px-3 py-2.5 ${bloqueado ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-gray-200'}`} />
            </div>
        </div>
    );
}

/* Clave estable para las filas de consorcio: con key={idx}, al eliminar una fila React
   reutiliza la instancia y el candado "Verificado vía SUNAT" se pega a la empresa equivocada. */
export const nuevaEmpresaConsorcio = () => ({ ruc: '', nombre: '', _key: crypto.randomUUID() });
export const empresasPayload = (empresas) => empresas.map(({ _key, ...e }) => e);

/* ─── Fila de empresa en consorcio ─── */
function FilaEmpresaConsorcio({ empresa, onUpdate, onRemove }) {
    const { cargando, bloqueado, onChange, limpiar } = useDocumentoLookup({
        tipo: 'ruc',
        longitud: 11,
        onResuelto: (doc, nom) => onUpdate(nom === null ? { ruc: doc } : { ruc: doc, nombre: nom }),
        mensajeNoEncontrado: 'RUC no encontrado. Complete el nombre manualmente.',
        limpiarNombreEnFallo: true,
        bloqueadoInicial: !!empresa.nombre,
    });

    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
            <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">RUC</label>
                <div className="relative">
                    <input type="text" value={empresa.ruc} onChange={e => onChange(e.target.value)}
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
            <div className="sm:col-span-2">
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
function PanelConsorcio({ esDemandante, portalEmail, empresas, onEmpresasChange, representante, onRepresentanteChange, docContrato, onDocContratoChange, errores = {} }) {
    const { cargando: cargandoRep, bloqueado: bloqueadoRep, onChange: onDniRepChange, limpiar: limpiarRep } = useDocumentoLookup({
        tipo: 'dni',
        longitud: 8,
        onResuelto: (doc, nom) => onRepresentanteChange(nom === null ? { dni: doc } : { dni: doc, nombre: nom }),
        mensajeNoEncontrado: 'DNI no encontrado. Complete el nombre manualmente.',
        limpiarNombreEnFallo: true,
        contexto: 'form_representante',
    });

    function agregarEmpresa() {
        onEmpresasChange([...empresas, nuevaEmpresaConsorcio()]);
    }

    function actualizarEmpresa(idx, cambios) {
        onEmpresasChange(empresas.map((e, i) => i === idx ? { ...e, ...cambios } : e));
    }

    function eliminarEmpresa(idx) {
        onEmpresasChange(empresas.filter((_, i) => i !== idx));
    }

    return (
        <div className="mt-4 space-y-5 bg-gray-50 rounded-xl border border-gray-200 p-4">

            {/* 1. Empresas del consorcio */}
            <div className={errores.empresas ? 'rounded-lg ring-2 ring-red-400 ring-offset-2 ring-offset-gray-50 p-2 -m-2' : ''}>
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
                    <p className={`text-xs italic ${errores.empresas ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {errores.empresas || 'Agregue al menos una empresa del consorcio.'}
                    </p>
                )}
                <div className="space-y-2">
                    {empresas.map((emp, idx) => (
                        <FilaEmpresaConsorcio key={emp._key ?? idx} empresa={emp}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">DNI <span className="text-[#BE0F4A]">*</span></label>
                        <div className="relative">
                            <input type="text" value={representante.dni ?? ''}
                                onChange={e => onDniRepChange(e.target.value)}
                                maxLength={8} placeholder="12345678"
                                className={`w-full text-sm border rounded-xl px-3 py-2.5 pr-8 ${
                                    errores.repDni ? 'border-red-400 bg-red-50' :
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
                        {errores.repDni && <p className="text-xs text-red-500 mt-1 font-semibold">{errores.repDni}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Nombre <span className="text-[#BE0F4A]">*</span></label>
                        <input type="text" value={representante.nombre ?? ''}
                            onChange={e => onRepresentanteChange({ nombre: e.target.value })}
                            disabled={bloqueadoRep}
                            placeholder="Nombre completo"
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 ${
                                errores.repNombre ? 'border-red-400 bg-red-50' :
                                bloqueadoRep ? 'bg-gray-50 text-gray-500 border-gray-200' : 'border-gray-200'
                            }`} />
                        {errores.repNombre && <p className="text-xs text-red-500 mt-1 font-semibold">{errores.repNombre}</p>}
                    </div>
                </div>

            </div>

            {/* 3. Contrato notariado de consorcio */}
            <MultiArchivoInput
                label={esDemandante ? "Contrato notariado de consorcio *" : "Contrato notariado de consorcio (opcional)"}
                value={docContrato}
                onChange={onDocContratoChange} />
            {!esDemandante && (
                <p className="text-xs text-gray-500 -mt-2">Adjunte solo si cuenta con el documento del demandado.</p>
            )}
        </div>
    );
}

/* ─── Bloque de Persona (demandante o demandado) ─── */
export function BloquePersona({
    titulo, descripcion, icono: Icono, campos, setCampos, errors, bloquearTipoPersona,
    conRepresentante, esDemandante, portalEmail,
    subtipoJuridico, onSubtipoChange,
    docVigenciaPoder, onDocVigenciaPoderChange,
    docContratoConsorcio, onDocContratoConsorcioChange,
    docResolucionFacultades, onDocResolucionFacultadesChange,
    empresasConsorcio, onEmpresasConsorcioChange,
    representanteConsorcio, onRepresentanteConsorcioChange,
    onBlurCampo,
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
            const data = await consultarDocumento(tipo, numero, esDemandante ? 'form_demandante' : 'form_demandado');
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
        <Seccion icono={Icono} titulo={titulo} descripcion={descripcion}>
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
                    <div className={errors?.subtipo ? 'rounded-xl ring-2 ring-red-300 ring-offset-2 ring-offset-white p-2 -m-2' : ''}>
                        <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                            Tipo de persona jurídica <span className="text-[#BE0F4A]">*</span>
                        </label>
                        <CustomSelect value={subtipoJuridico || ''} onChange={onSubtipoChange}
                            options={SUBTIPOS_JURIDICA} placeholder="Seleccione..." />
                        {errors?.subtipo && <p className="text-xs text-red-500 mt-1.5 font-semibold">{errors.subtipo}</p>}
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
                                        onBlur={() => onBlurCampo?.('documento')}
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
                            onBlur={() => onBlurCampo?.('nombre')}
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

                {/* Domicilio — para consorcio se renderiza al final, después del PanelConsorcio */}
                {!esConsorcio && (
                    <Input label="Domicilio de notificación" required type="text"
                        value={campos.domicilio ?? ''}
                        onChange={e => setCampos({ domicilio: e.target.value })}
                        onBlur={() => onBlurCampo?.('domicilio')}
                        disabled={domicilioLocked}
                        placeholder="Dirección completa"
                        error={errors?.domicilio} />
                )}

                {/* ── Paneles según sub-tipo jurídico ── */}

                {/* Empresa → Vigencia de Poder */}
                {tipoPersona === 'juridica' && subtipoJuridico === 'empresa' && (
                    <div className="rounded-xl border border-[#291136]/15 bg-[#291136]/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-[#291136] font-semibold">
                            <Building2 size={15} className="shrink-0 text-[#BE0F4A]"/>
                            {esDemandante
                                ? <>Documento requerido: <span className="font-bold">Vigencia de Poder</span></>
                                : <>Documento del demandado: <span className="font-bold">Vigencia de Poder (opcional)</span></>}
                        </div>
                        <MultiArchivoInput
                            label={esDemandante ? "Adjuntar Vigencia de Poder *" : "Adjuntar Vigencia de Poder"}
                            value={docVigenciaPoder}
                            onChange={onDocVigenciaPoderChange} />
                        {!esDemandante && (
                            <p className="text-xs text-[#291136]/60">Adjunte solo si cuenta con el documento del demandado.</p>
                        )}
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
                        errores={{
                            empresas:  errors?.empresas,
                            repDni:    errors?.repDni,
                            repNombre: errors?.repNombre,
                        }}
                    />
                )}

                {/* Entidad pública → Resolución de facultades */}
                {tipoPersona === 'juridica' && subtipoJuridico === 'entidad_publica' && (
                    <div className="rounded-xl border border-[#291136]/15 bg-[#291136]/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-[#291136] font-semibold">
                            <Building2 size={15} className="shrink-0 text-[#BE0F4A]"/>
                            {esDemandante
                                ? <>Documento requerido: <span className="font-bold">Resolución de facultades del funcionario a cargo</span></>
                                : <>Documento del demandado: <span className="font-bold">Resolución de facultades (opcional)</span></>}
                        </div>
                        <MultiArchivoInput
                            label={esDemandante ? "Adjuntar Resolución de Facultades *" : "Adjuntar Resolución de Facultades"}
                            value={docResolucionFacultades}
                            onChange={onDocResolucionFacultadesChange} />
                        {!esDemandante && (
                            <p className="text-xs text-[#291136]/60">Adjunte solo si cuenta con el documento del demandado.</p>
                        )}
                    </div>
                )}

                {/* Domicilio al final del bloque cuando es consorcio */}
                {esConsorcio && (
                    <Input label="Domicilio de notificación" required type="text"
                        value={campos.domicilio ?? ''}
                        onChange={e => setCampos({ domicilio: e.target.value })}
                        onBlur={() => onBlurCampo?.('domicilio')}
                        disabled={domicilioLocked}
                        placeholder="Dirección completa"
                        error={errors?.domicilio} />
                )}

            </div>
        </Seccion>
    );
}

/* ─── Esquema de validación (espeja la antigua lógica manual de handleSubmit) ─── */
/* Las claves de error coinciden 1:1 con las marcas que lee el render (missingFields). */
const arbitrajeSchema = z.object({
    pretensiones: z.any(), monto_controversias: z.any(), suma_monto_pretensiones_determinadas: z.any(),
    pretensiones_indeterminadas: z.any(), documentos_solicitud_inicio: z.any(),
    tipo_persona: z.any(), subtipo_dem: z.any(), nombre_demandante: z.any(), documento_demandante: z.any(),
    tipo_documento: z.any(), domicilio_demandante: z.any(), telefono_demandante: z.any(),
    empresas_dem: z.any(), rep_dem_dni: z.any(), rep_dem_nombre: z.any(),
    nombre_demandado: z.any(), domicilio_demandado: z.any(), tipo_persona_demandado: z.any(), subtipo_dado: z.any(),
    empresas_dado: z.any(), rep_dado_dni: z.any(), rep_dado_nombre: z.any(), email_demandado: z.any(),
    acepta_reglamento_card: z.any(), email_principal_dem: z.any(),
}).superRefine((d, ctx) => {
    const add = (k, m) => ctx.addIssue({ code: 'custom', path: [k], message: m });
    const req = (k, val, m = 'Campo obligatorio') => { if (!String(val ?? '').trim()) add(k, m); };

    req('pretensiones', d.pretensiones);
    req('monto_controversias', d.monto_controversias);
    if (d.suma_monto_pretensiones_determinadas === '' || d.suma_monto_pretensiones_determinadas === null || d.suma_monto_pretensiones_determinadas === undefined)
        add('suma_monto_pretensiones_determinadas', 'Campo obligatorio');
    req('pretensiones_indeterminadas', d.pretensiones_indeterminadas);
    if (d.documentos_solicitud_inicio === 0) add('documentos_solicitud_inicio', 'Adjunte la solicitud de inicio de arbitraje');

    // Demandante: solo si no es consorcio (en consorcio se usan los datos del rep)
    if (!(d.tipo_persona === 'juridica' && d.subtipo_dem === 'consorcio')) {
        req('nombre_demandante', d.nombre_demandante);
        req('documento_demandante', d.documento_demandante);
        const lon = LONG_DOC[d.tipo_documento];
        if (lon && d.documento_demandante && d.documento_demandante.length !== lon) add('documento_demandante', `Debe tener ${lon} dígitos`);
    }
    req('domicilio_demandante', d.domicilio_demandante);
    req('telefono_demandante', d.telefono_demandante);

    if (d.tipo_persona === 'juridica') {
        if (!d.subtipo_dem) add('subtipo_juridico_demandante', 'Seleccione el tipo');
        if (d.subtipo_dem === 'consorcio') {
            if (d.empresas_dem === 0) add('empresas_consorcio_demandante', 'Agregue al menos una empresa');
            if (!d.rep_dem_dni || d.rep_dem_dni.length !== 8) add('rep_consorcio_demandante_dni', 'DNI obligatorio (8 dígitos)');
            if (!String(d.rep_dem_nombre ?? '').trim()) add('rep_consorcio_demandante_nombre', 'Nombre obligatorio');
        }
    }

    req('nombre_demandado', d.nombre_demandado);
    req('domicilio_demandado', d.domicilio_demandado);

    if (d.tipo_persona_demandado === 'juridica') {
        if (!d.subtipo_dado) add('subtipo_juridico_demandado', 'Seleccione el tipo');
        if (d.subtipo_dado === 'consorcio') {
            if (d.empresas_dado === 0) add('empresas_consorcio_demandado', 'Agregue al menos una empresa');
            if (!d.rep_dado_dni || d.rep_dado_dni.length !== 8) add('rep_consorcio_demandado_dni', 'DNI obligatorio (8 dígitos)');
            if (!String(d.rep_dado_nombre ?? '').trim()) add('rep_consorcio_demandado_nombre', 'Nombre obligatorio');
            if (!String(d.email_demandado ?? '').trim()) add('email_demandado', 'Email del representante del consorcio');
        }
    }

    if (!d.acepta_reglamento_card) add('acepta_reglamento_card', 'Debe aceptar la declaración para enviar la solicitud');
    if (!d.email_principal_dem) add('emails_demandante', 'Ingrese al menos un correo');
});

/* ─── Formulario principal ─── */
export default function ArbitrajeForm({ servicio, portalEmail, portalUser, hcaptchaSiteKey }) {
    const [captchaToken, setCaptchaToken] = useState('');
    const { auth } = usePage().props;
    const isPortal = !!portalEmail;
    const isAuth   = !!auth?.user && !isPortal;
    const user     = isPortal ? portalUser : auth?.user;

    const [aceptoLegal, setAceptoLegal]     = useState(isAuth || isPortal);
    const [modalLegal, setModalLegal]       = useState(false);
    const [mostrarLoader, setMostrarLoader] = useState(false);
    const [errorValidacion, setErrorValidacion] = useState('');
    // Modal de campos faltantes (estilo SweetAlert)
    const [missingFields, setMissingFields]     = useState({});
    const [showErrorModal, setShowErrorModal]   = useState(false);
    // Controla si los datos del demandante están bloqueados (pre-cargados del usuario autenticado)
    const [demandanteBloqueado, setDemandanteBloqueado] = useState(false);
    const emailInicial = isPortal ? portalEmail : '';
    const [emailsDem, setEmailsDem]         = useState(emailInicial ? [{ email: emailInicial, label: '' }] : [{ email: '', label: '' }]);
    const [emailsDemAdic, setEmailsDemAdic] = useState([]);
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
    const [repConsorcioDado, setRepConsorcioDado] = useState({ dni: '', nombre: '' });

    // Documentos de sub-tipo jurídico
    const [docVigenciaPoderDem,         setDocVigenciaPoderDem]         = useState([]);
    const [docContratoConsorcioDem,     setDocContratoConsorcioDem]     = useState([]);
    const [docResolucionFacultadesDem,  setDocResolucionFacultadesDem]  = useState([]);
    const [docVigenciaPoderDado,        setDocVigenciaPoderDado]        = useState([]);
    const [docContratoConsorcioDado,    setDocContratoConsorcioDado]    = useState([]);
    const [docResolucionFacultadesDado, setDocResolucionFacultadesDado] = useState([]);

    const { data, setData } = useForm({
        servicio_id:                   servicio.id,
        // Demandante — NO se pre-cargan datos personales: quien presenta puede estar
        // redactando para otra persona. Solo el correo OTP del portal se conserva (canal verificado).
        tipo_persona:                  'natural',
        tipo_documento:                docDefaultPorPersona('natural'),
        nombre_demandante:             '',
        documento_demandante:          '',
        nombre_representante:          '',
        documento_representante:       '',
        domicilio_demandante:          '',
        email_demandante:              emailInicial ?? '',
        telefono_demandante:           '',
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
        pretensiones:                          '',
        monto_controversias:                   '',
        suma_monto_pretensiones_determinadas:  '',
        pretensiones_indeterminadas:           '',
        documentos_controversia:               [],
        documentos_solicitud_inicio:           [],
        // Árbitro
        solicita_designacion_director: 1,
        nombre_arbitro_propuesto:      '',
        documento_arbitro_propuesto:   '',
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
        factura_ruc:                   '',
        factura_razon_social:          '',
        // Adjuntos
        documentos_anexos:             [],
    });

    // El envío usa router.post con FormData manual, que NO alimenta el `errors`/`processing`
    // de useForm: los errores 422 del backend llegan como prop de página (usePage) y el
    // estado de envío se controla aquí para deshabilitar el botón y evitar doble submit.
    const errors = usePage().props.errors ?? {};
    const [enviando, setEnviando] = useState(false);

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

    // Datos planos para el esquema Zod (mismas claves que las marcas de error del render)
    function datosValidables() {
        const emailPrincipal = isPortal ? { email: portalEmail } : emailsDem.find(e => e.email.trim());
        return {
            pretensiones: data.pretensiones,
            monto_controversias: data.monto_controversias,
            suma_monto_pretensiones_determinadas: data.suma_monto_pretensiones_determinadas,
            pretensiones_indeterminadas: data.pretensiones_indeterminadas,
            documentos_solicitud_inicio: (data.documentos_solicitud_inicio ?? []).length,
            tipo_persona: data.tipo_persona,
            subtipo_dem: subtipoJuridicoDem,
            nombre_demandante: data.nombre_demandante,
            documento_demandante: data.documento_demandante,
            tipo_documento: data.tipo_documento,
            domicilio_demandante: data.domicilio_demandante,
            telefono_demandante: data.telefono_demandante,
            empresas_dem: empresasConsorcioDem.length,
            rep_dem_dni: repConsorcioDem.dni,
            rep_dem_nombre: repConsorcioDem.nombre,
            nombre_demandado: data.nombre_demandado,
            domicilio_demandado: data.domicilio_demandado,
            tipo_persona_demandado: data.tipo_persona_demandado,
            subtipo_dado: subtipoJuridicoDado,
            empresas_dado: empresasConsorcioDado.length,
            rep_dado_dni: repConsorcioDado.dni,
            rep_dado_nombre: repConsorcioDado.nombre,
            email_demandado: data.email_demandado,
            acepta_reglamento_card: data.acepta_reglamento_card,
            email_principal_dem: !!emailPrincipal,
        };
    }

    // onBlur por campo: valida el esquema completo pero marca/limpia solo ese campo
    const validarBlur = (campo) => validarCampo(arbitrajeSchema, datosValidables(), campo, setMissingFields);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!aceptoLegal) { setModalLegal(true); return; }

        if (!validarZod(arbitrajeSchema, datosValidables(), { setError: setMissingFields, clearErrors: () => setMissingFields({}) })) {
            // Inline (missingFields) + modal-resumen con las etiquetas legibles (FIELD_LABELS)
            setShowErrorModal(true);
            return;
        }

        setErrorValidacion('');
        const ok = await confirmar({
            variant: 'warning',
            titulo:  'Confirmar solicitud de arbitraje',
            mensaje: `Se enviará la solicitud de arbitraje del servicio "${servicio.nombre}". Se generará un cargo y se enviarán credenciales de acceso al correo registrado.`,
            detalles: [
                { label: 'Demandante', value: data.nombre_demandante || (empresasConsorcioDem[0]?.nombre ? 'Consorcio: ' + empresasConsorcioDem[0].nombre : '—') },
                { label: 'Demandado', value: data.nombre_demandado || '—' },
            ],
            confirmText: 'Sí, enviar',
        });
        if (ok) enviarFormulario();
    };

    // Mapa de claves internas → etiquetas legibles para el modal
    const FIELD_LABELS = {
        pretensiones:                          'Pretensiones',
        monto_controversias:                   'Monto de la(s) Controversia(s)',
        suma_monto_pretensiones_determinadas:  'Suma de Monto de Pretensiones Determinadas (Monto en soles)',
        pretensiones_indeterminadas:           'Pretensiones Indeterminadas',
        documentos_solicitud_inicio:           'Solicitud de Inicio de Arbitraje',
        nombre_demandante:                  'Nombre del demandante',
        documento_demandante:               'Documento del demandante',
        domicilio_demandante:               'Domicilio del demandante',
        telefono_demandante:                'Teléfono del demandante',
        emails_demandante:                  'Correo del demandante',
        subtipo_juridico_demandante:        'Tipo de persona jurídica del demandante',
        empresas_consorcio_demandante:      'Empresas del consorcio (demandante)',
        rep_consorcio_demandante_dni:       'DNI del representante del consorcio (demandante)',
        rep_consorcio_demandante_nombre:    'Nombre del representante del consorcio (demandante)',
        nombre_demandado:                   'Nombre del demandado',
        domicilio_demandado:                'Domicilio del demandado',
        email_demandado:                    'Correo electrónico del demandado',
        subtipo_juridico_demandado:         'Tipo de persona jurídica del demandado',
        empresas_consorcio_demandado:       'Empresas del consorcio (demandado)',
        rep_consorcio_demandado_dni:        'DNI del representante del consorcio (demandado)',
        rep_consorcio_demandado_nombre:     'Nombre del representante del consorcio (demandado)',
        acepta_reglamento_card:             'Declaración y aceptación final',
    };

    // Auto-limpiar la marca de un campo cuando el usuario empieza a llenarlo
    useEffect(() => {
        if (Object.keys(missingFields).length === 0) return;
        const filled = {};
        if (data.pretensiones?.trim())                                  filled.pretensiones                          = true;
        if (data.monto_controversias?.trim())                           filled.monto_controversias                   = true;
        if (data.suma_monto_pretensiones_determinadas?.toString().trim()) filled.suma_monto_pretensiones_determinadas = true;
        if (data.pretensiones_indeterminadas?.trim())                   filled.pretensiones_indeterminadas           = true;
        if (Array.isArray(data.documentos_solicitud_inicio) && data.documentos_solicitud_inicio.length > 0)
                                                                        filled.documentos_solicitud_inicio           = true;
        if (data.nombre_demandante?.trim())    filled.nombre_demandante    = true;
        if (data.documento_demandante?.trim() && (!LONG_DOC[data.tipo_documento] || data.documento_demandante.length === LONG_DOC[data.tipo_documento])) filled.documento_demandante = true;
        if (data.domicilio_demandante?.trim()) filled.domicilio_demandante = true;
        if (data.telefono_demandante?.trim())  filled.telefono_demandante  = true;
        if (data.nombre_demandado?.trim())     filled.nombre_demandado     = true;
        if (data.domicilio_demandado?.trim())  filled.domicilio_demandado  = true;
        if (data.email_demandado?.trim())      filled.email_demandado      = true;
        if (subtipoJuridicoDem)                filled.subtipo_juridico_demandante = true;
        if (subtipoJuridicoDado)               filled.subtipo_juridico_demandado  = true;
        if (empresasConsorcioDem.length > 0)   filled.empresas_consorcio_demandante = true;
        if (empresasConsorcioDado.length > 0)  filled.empresas_consorcio_demandado  = true;
        if (repConsorcioDem.dni?.length === 8) filled.rep_consorcio_demandante_dni = true;
        if (repConsorcioDem.nombre?.trim())    filled.rep_consorcio_demandante_nombre = true;
        if (repConsorcioDado.dni?.length === 8) filled.rep_consorcio_demandado_dni = true;
        if (repConsorcioDado.nombre?.trim())    filled.rep_consorcio_demandado_nombre = true;
        if (data.acepta_reglamento_card)       filled.acepta_reglamento_card = true;
        if (emailsDem.some(e => e.email?.trim())) filled.emails_demandante = true;
        const next = { ...missingFields };
        let cambios = false;
        Object.keys(filled).forEach(k => {
            if (next[k]) { delete next[k]; cambios = true; }
        });
        if (cambios) setMissingFields(next);
    }, [data, subtipoJuridicoDem, subtipoJuridicoDado, empresasConsorcioDem, empresasConsorcioDado, repConsorcioDem, repConsorcioDado, emailsDem]);

    const enviarFormulario = () => {
        if (enviando) return;
        setEnviando(true);
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
        fd.set('email_demandante', isPortal ? portalEmail : (emailsDem[0]?.email ?? ''));
        fd.append('emails_demandante', JSON.stringify(
            isPortal
                ? [
                    { email: portalEmail, label: '' },
                    ...emailsDemAdic
                        .filter(e => e.email.trim() && e.email.trim().toLowerCase() !== portalEmail.toLowerCase()),
                  ]
                : emailsDem.filter(e => e.email.trim())
        ));
        fd.append('emails_demandado',  JSON.stringify(emailsDado.filter(e => e.email.trim())));

        // Sub-tipos jurídicos
        fd.append('subtipo_juridico_demandante', subtipoJuridicoDem);
        fd.append('subtipo_juridico_demandado',  subtipoJuridicoDado);

        // Consorcio demandante
        fd.append('empresas_consorcio_demandante', JSON.stringify(empresasPayload(empresasConsorcioDem)));
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
        fd.append('empresas_consorcio_demandado',            JSON.stringify(empresasPayload(empresasConsorcioDado)));
        fd.append('nombre_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.nombre ?? '') : (data.nombre_representante_dem ?? ''));
        fd.append('documento_representante_demandado',
            subtipoJuridicoDado === 'consorcio' ? (repConsorcioDado.dni ?? '') : (data.documento_representante_dem ?? ''));

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

        if (captchaToken) fd.append('captcha_token', captchaToken);

        router.post(route('solicitud.arbitraje.store'), fd, {
            forceFormData: true,
            onFinish: () => {
                setEnviando(false);
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
            },
            onError: (errs) => {
                clearTimeout(loaderTimer.current);
                setMostrarLoader(false);
                toast.error(Object.values(errs)[0] || 'Revise los campos marcados en rojo', { position: 'top-center' });
            },
        });
    };

    return (
        <>
        <AnkawaLoader visible={mostrarLoader} />
        <form onSubmit={handleSubmit} encType="multipart/form-data">

            {/* Leyenda de campos obligatorios */}
            <div className="mb-5 px-4 py-3 bg-[#291136]/5 border border-[#291136]/15 rounded-xl flex items-center gap-3">
                <span className="text-[#BE0F4A] text-lg font-black leading-none">*</span>
                <p className="text-sm text-[#291136]">
                    Los campos marcados con <span className="text-[#BE0F4A] font-bold">*</span> son obligatorios.
                </p>
            </div>

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
                        <CustomSelect
                            value={tipoDocumentoId}
                            onChange={val => setTipoDocumentoId(String(val))}
                            options={tiposDocumento}
                            placeholder="Seleccionar tipo..."
                        />
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
            <BloquePersona
                icono={User} titulo="Sus Datos (Demandante)"
                descripcion="El demandante es usted: quien presenta la solicitud."
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
                errors={{
                    documento: errors.documento_demandante || missingFields.documento_demandante,
                    nombre:    errors.nombre_demandante    || missingFields.nombre_demandante,
                    domicilio: errors.domicilio_demandante || missingFields.domicilio_demandante,
                    subtipo:   missingFields.subtipo_juridico_demandante,
                    empresas:  missingFields.empresas_consorcio_demandante,
                    repDni:    missingFields.rep_consorcio_demandante_dni,
                    repNombre: missingFields.rep_consorcio_demandante_nombre,
                }}
                onBlurCampo={campo => validarBlur(`${campo}_demandante`)}
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
                            <div className="space-y-3">
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
                                <EmailsInput
                                    label="Correos adicionales del demandante (para notificaciones)"
                                    value={emailsDemAdic}
                                    onChange={setEmailsDemAdic}
                                    required={false}
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        ) : (
                            <EmailsInput
                                label="Correos del demandante (para notificaciones)"
                                value={emailsDem}
                                onChange={setEmailsDem}
                                required
                                placeholder="correo@ejemplo.com"
                                error={errors.email_demandante || missingFields.emails_demandante}
                            />
                        )}
                    </div>
                </div>
                <Input id="telefono_demandante" label="Teléfono" required type="text"
                    value={data.telefono_demandante} onChange={e => setData('telefono_demandante', e.target.value)}
                    placeholder="987654321"
                    error={errors.telefono_demandante || missingFields.telefono_demandante} />
            </div>

            {/* Bloque Demandado */}
            <BloquePersona
                icono={Users} titulo="Datos del Demandado"
                descripcion="El demandado es la persona o empresa contra la que presenta su solicitud."
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
                errors={{
                    documento: errors.documento_demandado,
                    nombre:    errors.nombre_demandado    || missingFields.nombre_demandado,
                    domicilio: errors.domicilio_demandado || missingFields.domicilio_demandado,
                    subtipo:   missingFields.subtipo_juridico_demandado,
                    empresas:  missingFields.empresas_consorcio_demandado,
                    repDni:    missingFields.rep_consorcio_demandado_dni,
                    repNombre: missingFields.rep_consorcio_demandado_nombre,
                }}
                onBlurCampo={campo => validarBlur(`${campo}_demandado`)}
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
                        placeholder="correo@ejemplo.com"
                        error={errors.email_demandado || missingFields.email_demandado} />
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
                <Textarea id="pretensiones" label="Pretensiones" required
                    hint="¿Qué le pide al tribunal arbitral? Describa cada reclamo con sus palabras."
                    value={data.pretensiones} onChange={e => setData('pretensiones', e.target.value)}
                    placeholder="Ej.: Que se ordene el pago de las valorizaciones pendientes..." rows={4}
                    error={errors.pretensiones || missingFields.pretensiones} />
                <Textarea id="monto_controversias" label="Monto de la(s) Controversia(s)" required
                    hint="¿Cuánto dinero está en disputa en total? Si hay varios reclamos, descríbalos por separado."
                    value={data.monto_controversias} onChange={e => setData('monto_controversias', e.target.value)}
                    placeholder="Ej.: S/ 80,000 por valorizaciones + S/ 20,000 por penalidades..." rows={3}
                    error={errors.monto_controversias || missingFields.monto_controversias} />
                <Input label="Suma de Monto de Pretensiones Determinadas (Monto en soles)" required
                    hint="Sume solo los reclamos que tienen un monto exacto en soles."
                    type="number" min="0" step="0.01"
                    value={data.suma_monto_pretensiones_determinadas}
                    onChange={e => setData('suma_monto_pretensiones_determinadas', e.target.value)}
                    placeholder="Ej: 50000.00"
                    error={errors.suma_monto_pretensiones_determinadas || missingFields.suma_monto_pretensiones_determinadas} />
                <Textarea id="pretensiones_indeterminadas" label="Pretensiones Indeterminadas (Que no se puedan cuantificar)" required
                    hint="Reclamos sin monto exacto, por ejemplo: que se cumpla el contrato. Si no tiene ninguno, escriba «Ninguna»."
                    value={data.pretensiones_indeterminadas} onChange={e => setData('pretensiones_indeterminadas', e.target.value)}
                    placeholder="Ej.: Que se declare resuelto el contrato... (o escriba «Ninguna»)" rows={3}
                    error={errors.pretensiones_indeterminadas || missingFields.pretensiones_indeterminadas} />
                <div className="mt-4">
                    <MultiArchivoInput
                        label={<>Convenio Arbitral <span className="font-normal opacity-80">(Contrato donde figura la cláusula arbitral, orden de servicio u orden de compra, si existe — opcional)</span></>}
                        value={data.documentos_controversia}
                        onChange={v => setData('documentos_controversia', v)} />
                </div>
                <div className="mt-4">
                    <MultiArchivoInput
                        label={<>Solicitud de Inicio de Arbitraje <span className="text-[#BE0F4A]">*</span></>}
                        value={data.documentos_solicitud_inicio}
                        onChange={v => setData('documentos_solicitud_inicio', v)} />
                    {(errors.documentos_solicitud_inicio || missingFields.documentos_solicitud_inicio) && (
                        <p className="mt-1.5 text-xs font-semibold text-red-500">
                            {errors.documentos_solicitud_inicio || missingFields.documentos_solicitud_inicio}
                        </p>
                    )}
                </div>
            </Seccion>

            {/* Conformación del Tribunal */}
            <Seccion icono={FileText} titulo="Conformación del Tribunal">
                <div className="mb-5">
                    <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                        Designación de Árbitro <span className="text-[#BE0F4A]">*</span>
                    </label>
                    <CustomSelect value={data.solicita_designacion_director}
                        onChange={val => setData(d => ({ ...d, solicita_designacion_director: val }))}
                        options={OPCIONES_ARBITRO} placeholder={null} />
                </div>

                {data.solicita_designacion_director === 0 && (
                    <div className="space-y-4">
                        <RepresentanteDNI
                            label="Árbitro Propuesto"
                            required={false}
                            contexto="form_arbitro"
                            dniValue={data.documento_arbitro_propuesto}
                            nombreValue={data.nombre_arbitro_propuesto}
                            onDniChange={val => setData('documento_arbitro_propuesto', val)}
                            onNombreChange={val => setData('nombre_arbitro_propuesto', val)}
                        />
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                            <Input label="Correo del Árbitro Propuesto" type="email"
                                value={data.email_arbitro_propuesto}
                                onChange={e => setData('email_arbitro_propuesto', e.target.value)} />
                            <Input label="Domicilio del Árbitro Propuesto" type="text"
                                value={data.domicilio_arbitro_propuesto}
                                onChange={e => setData('domicilio_arbitro_propuesto', e.target.value)} />
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
                        <div className="bg-[#291136]/5 border border-[#291136]/15 rounded-xl p-3 mb-3 text-sm text-[#291136]">
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

                <div className="mt-6">
                    <h3 className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-70 mb-3">
                        Datos de la Emisión de Factura
                    </h3>
                    <RucBuscador
                        label="Cliente"
                        rucValue={data.factura_ruc}
                        razonSocialValue={data.factura_razon_social}
                        onRucChange={val => setData('factura_ruc', val)}
                        onRazonSocialChange={val => setData('factura_razon_social', val)}
                    />
                </div>
            </Seccion>

            {/* Adjuntos */}
            <Seccion icono={Paperclip} titulo="Documentos Adjuntos (Anexos)">
                <div className="bg-[#291136]/5 border border-[#291136]/15 rounded-xl p-4 mb-5">
                    <p className="text-sm text-[#291136] font-semibold mb-1">Recomendación</p>
                    <p className="text-sm text-[#291136]/75">
                        Antes de adjuntar, <strong>renombre cada archivo</strong> con el tipo de documento que representa
                        (ej: <em>DNI_representante.pdf</em>, <em>Poder_notarial.pdf</em>, <em>Contrato_principal.pdf</em>).
                        Esto facilita la revisión del expediente.
                    </p>
                </div>
                <MultiArchivoInput value={data.documentos_anexos} onChange={v => setData('documentos_anexos', v)} />
            </Seccion>

            {/* Declaración y Aceptación final */}
            <AceptacionReglamento
                checked={data.acepta_reglamento_card}
                onChange={v => setData('acepta_reglamento_card', v)}
                error={missingFields.acepta_reglamento_card}
                contexto="al presente proceso arbitral"
                finalidad="arbitraje"
                bulletsExtra={[
                    <>Confirmo que los <strong className="text-[#291136]">datos del demandante</strong> consignados en este formulario son verídicos y han sido validados previamente a través del correo electrónico registrado.</>,
                    <>Soy consciente de que los <strong className="text-[#291136]">datos del demandado</strong> aquí declarados serán utilizados para las notificaciones del proceso, asumiendo plena responsabilidad sobre su exactitud.</>,
                ]}
            />

            {hcaptchaSiteKey && (
                <div className="flex justify-center pb-2">
                    <HCaptchaWidget siteKey={hcaptchaSiteKey} onToken={setCaptchaToken} />
                </div>
            )}

            <div className="flex justify-end">
                <PrimaryButton
                    type="submit"
                    disabled={enviando || (hcaptchaSiteKey && !captchaToken)}
                    className="px-8 py-3 text-base shadow-lg"
                >
                    {enviando ? 'Enviando solicitud...' : 'Enviar Solicitud'}
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

        {/* Modal de campos faltantes (estilo SweetAlert) */}
        {showErrorModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowErrorModal(false)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-150"
                    onClick={e => e.stopPropagation()}>
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <AlertTriangle size={22} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-lg leading-tight">No se pudo enviar la solicitud</h3>
                            <p className="text-white/90 text-xs mt-0.5">
                                {Object.keys(missingFields).length === 1
                                    ? 'Falta 1 campo obligatorio'
                                    : `Faltan ${Object.keys(missingFields).length} campos obligatorios`}
                            </p>
                        </div>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <p className="text-sm text-gray-600 mb-3">Complete los siguientes campos antes de enviar:</p>
                        <ul className="space-y-2">
                            {Object.entries(missingFields).map(([k, msg]) => (
                                <li key={k} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50 border border-red-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2"/>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-[#291136]">
                                            {FIELD_LABELS[k] ?? msg}
                                        </p>
                                        {FIELD_LABELS[k] && msg !== 'Campo obligatorio' && (
                                            <p className="text-xs text-red-600 mt-0.5">{msg}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button type="button" onClick={() => setShowErrorModal(false)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-[#BE0F4A] text-white hover:bg-[#9c0a3b] transition-colors shadow-sm">
                            <CheckCircle2 size={16}/> Entendido, voy a corregir
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
