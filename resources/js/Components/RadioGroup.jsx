/* ─────────────────────────────────────────────────────────────
   RadioGroup — opciones de selección única en tarjetas, con el
   lenguaje visual de la marca (acento #BE0F4A). Reutilizable.

   props:
     value      — id seleccionado
     onChange   — (id) => void
     options    — [{ id, nombre, descripcion? }]
     columns    — 1 (apiladas) | 2 (en grilla)  (default 1)
   ───────────────────────────────────────────────────────────── */

export default function RadioGroup({ value, onChange, options = [], columns = 1, disabled = false }) {
    return (
        <div className={columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-2.5'}>
            {options.map((opt) => {
                const selected = value?.toString() === opt.id.toString();
                return (
                    <button
                        key={opt.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(opt.id)}
                        className={`flex items-start gap-3 w-full text-left rounded-xl border p-3.5 transition-all
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${selected
                                ? 'border-[#BE0F4A] bg-[#BE0F4A]/5 ring-1 ring-[#BE0F4A]/30'
                                : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                        <span className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                            ${selected ? 'border-[#BE0F4A]' : 'border-gray-300'}`}>
                            {selected && <span className="w-2 h-2 rounded-full bg-[#BE0F4A]" />}
                        </span>
                        <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${selected ? 'text-[#BE0F4A]' : 'text-[#291136]'}`}>
                                {opt.nombre}
                            </span>
                            {opt.descripcion && (
                                <span className="block text-xs text-gray-500 mt-0.5 font-normal">{opt.descripcion}</span>
                            )}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
