import { useMemo } from 'react';
import SearchableSelect from '@/Components/SearchableSelect';
import UBIGEO from '@/data/ubigeo-peru.json';

/* ─────────────────────────────────────────────────────────────
   UbigeoSelect — Departamento → Provincia → Distrito en cascada.
   Cada nivel se habilita solo cuando el anterior está elegido y se
   reinicia hacia abajo al cambiar un nivel superior. Cada select es
   buscable (SearchableSelect). Data: INEI/RENIEC (1893 distritos).

   value:  { departamento, provincia, distrito }  (nombres en MAYÚSCULA)
   onChange(nuevoValor) — devuelve el objeto completo ya recalculado.
   ───────────────────────────────────────────────────────────── */

const opt = (nombre) => ({ id: nombre, nombre });

export default function UbigeoSelect({ value = {}, onChange, disabled = false, required = true, errors = {} }) {
    const { departamento = '', provincia = '', distrito = '' } = value;

    const departamentos = useMemo(() => UBIGEO.map(d => opt(d.nombre)), []);
    const depSel  = useMemo(() => UBIGEO.find(d => d.nombre === departamento), [departamento]);
    const provincias = useMemo(() => (depSel?.provincias ?? []).map(p => opt(p.nombre)), [depSel]);
    const provSel = useMemo(() => depSel?.provincias.find(p => p.nombre === provincia), [depSel, provincia]);
    const distritos = useMemo(() => (provSel?.distritos ?? []).map(opt), [provSel]);

    const setDep  = (v) => onChange({ departamento: v, provincia: '', distrito: '' });
    const setProv = (v) => onChange({ departamento, provincia: v, distrito: '' });
    const setDist = (v) => onChange({ departamento, provincia, distrito: v });

    const star = required ? <span className="text-[#BE0F4A]">*</span> : null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                    Departamento {star}
                </label>
                <SearchableSelect
                    value={departamento}
                    onChange={setDep}
                    options={departamentos}
                    placeholder="Departamento"
                    searchPlaceholder="Buscar departamento..."
                    disabled={disabled}
                    error={errors.departamento}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                    Provincia {star}
                </label>
                <SearchableSelect
                    value={provincia}
                    onChange={setProv}
                    options={provincias}
                    placeholder={departamento ? 'Provincia' : 'Elija departamento'}
                    searchPlaceholder="Buscar provincia..."
                    disabled={disabled || !departamento}
                    error={errors.provincia}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-[#291136] mb-1.5 uppercase tracking-wide opacity-70">
                    Distrito {star}
                </label>
                <SearchableSelect
                    value={distrito}
                    onChange={setDist}
                    options={distritos}
                    placeholder={provincia ? 'Distrito' : 'Elija provincia'}
                    searchPlaceholder="Buscar distrito..."
                    disabled={disabled || !provincia}
                    error={errors.distrito}
                />
            </div>
        </div>
    );
}
