import { MapPin } from 'lucide-react';
import UbigeoSelect from '@/Components/UbigeoSelect';

/* ─────────────────────────────────────────────────────────────
   DomicilioFields — captura de domicilio desglosado y reutilizable.
   El valor es un objeto con las partes; para almacenamiento/notificación
   se compone una sola línea legible con `componerDomicilio()`.

   Uso:
     <DomicilioFields value={domicilio} onChange={setDomicilio} />

   El `value` puede llegar como string (legado / autocompletado SUNAT):
   `normalizarDomicilio()` lo coloca en el campo "Dirección".
   ───────────────────────────────────────────────────────────── */

export const CAMPOS_DOMICILIO = [
    'direccion', 'urbanizacion', 'numero', 'lote_mz',
    'departamento', 'provincia', 'distrito',
];

export const domicilioVacio = () =>
    CAMPOS_DOMICILIO.reduce((acc, k) => ({ ...acc, [k]: '' }), {});

/* Acepta string (legado/SUNAT) u objeto → siempre devuelve objeto completo. */
export function normalizarDomicilio(v) {
    if (!v) return domicilioVacio();
    if (typeof v === 'string') return { ...domicilioVacio(), direccion: v };
    return { ...domicilioVacio(), ...v };
}

/* Compone una dirección de una sola línea, legible, para enviar al backend. */
export function componerDomicilio(v) {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    const d = normalizarDomicilio(v);
    const partes = [];
    if (d.direccion)    partes.push(d.direccion);
    if (d.numero)       partes.push(`N° ${d.numero}`);
    if (d.lote_mz)      partes.push(d.lote_mz);
    if (d.urbanizacion) partes.push(`Urb. ${d.urbanizacion}`);
    if (d.distrito)     partes.push(d.distrito);
    if (d.provincia)    partes.push(d.provincia);
    if (d.departamento) partes.push(d.departamento);
    return partes.join(', ').trim();
}

const baseInput = (error, disabled) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl bg-white transition-all text-[#291136] placeholder-gray-400
     focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A]
     disabled:opacity-50 disabled:cursor-not-allowed
     ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`;

function CampoTexto({ label, required, value, onChange, onBlur, disabled, error, placeholder, className = '' }) {
    return (
        <div className={className}>
            <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                {label} {required && <span className="text-[#BE0F4A]">*</span>}
            </label>
            <input
                type="text"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                onBlur={onBlur}
                disabled={disabled}
                placeholder={placeholder}
                className={baseInput(error, disabled)}
            />
        </div>
    );
}

export default function DomicilioFields({
    value,
    onChange,
    onBlur,
    disabled = false,
    error,
    required = true,
    label = 'Domicilio de notificación',
}) {
    const v = normalizarDomicilio(value);
    const set = (campo, val) => onChange({ ...v, [campo]: val });

    return (
        <div className={`rounded-xl border p-4 ${error ? 'border-red-300 bg-red-50/40' : 'border-gray-200 bg-gray-50/60'}`}>
            <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} className="text-[#BE0F4A]" />
                <span className="text-xs font-bold text-[#291136] uppercase tracking-wide opacity-80">
                    {label} {required && <span className="text-[#BE0F4A]">*</span>}
                </span>
            </div>

            <div className="space-y-3">
                {/* Dirección — campo ancla */}
                <CampoTexto
                    label="Dirección" required={required}
                    value={v.direccion} onChange={val => set('direccion', val)}
                    onBlur={onBlur} disabled={disabled} error={error}
                    placeholder="Av. / Jr. / Calle"
                />

                {/* Urbanización · Número · Lote/Mz */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CampoTexto label="Urbanización" value={v.urbanizacion}
                        onChange={val => set('urbanizacion', val)} onBlur={onBlur}
                        disabled={disabled} placeholder="Urb." />
                    <CampoTexto label="Número" value={v.numero}
                        onChange={val => set('numero', val)} onBlur={onBlur}
                        disabled={disabled} placeholder="N°" />
                    <CampoTexto label="Lote / Mz" value={v.lote_mz}
                        onChange={val => set('lote_mz', val)} onBlur={onBlur}
                        disabled={disabled} placeholder="Lote / Mz" />
                </div>

                {/* Departamento · Provincia · Distrito (cascada buscable) */}
                <UbigeoSelect
                    value={{ departamento: v.departamento, provincia: v.provincia, distrito: v.distrito }}
                    onChange={ubi => onChange({ ...v, ...ubi })}
                    disabled={disabled}
                    required={false}
                />
            </div>

            {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
        </div>
    );
}
