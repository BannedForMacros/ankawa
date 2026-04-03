import { Plus, X, Mail } from 'lucide-react';

/**
 * Componente para ingresar múltiples correos electrónicos con etiqueta opcional.
 * value: [{ email: string, label: string }]
 */
export default function EmailsInput({
    value = [],
    onChange,
    label = 'Correos electrónicos',
    required = false,
    placeholder = 'correo@ejemplo.com',
    error,
}) {
    function agregar() {
        onChange([...value, { email: '', label: '' }]);
    }

    function actualizar(i, field, val) {
        onChange(value.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
    }

    function quitar(i) {
        onChange(value.filter((_, idx) => idx !== i));
    }

    // Asegurar siempre al menos 1 si required
    const puedeQuitar = (i) => !(required && value.length === 1 && i === 0);

    return (
        <div>
            <label className="block text-xs font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-70">
                <span className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {label}
                    {required && <span className="text-[#BE0F4A]">*</span>}
                </span>
            </label>

            <div className="space-y-2">
                {value.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <input
                            type="email"
                            value={item.email}
                            onChange={e => actualizar(i, 'email', e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20"
                        />
                        <input
                            type="text"
                            value={item.label}
                            onChange={e => actualizar(i, 'label', e.target.value)}
                            placeholder="Ej: Mesa de Partes"
                            className="w-40 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#BE0F4A] focus:ring-1 focus:ring-[#BE0F4A]/20"
                        />
                        {puedeQuitar(i) && (
                            <button
                                type="button"
                                onClick={() => quitar(i)}
                                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {value.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">Sin correos registrados.</p>
            )}

            <button
                type="button"
                onClick={agregar}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#BE0F4A] hover:text-[#9c0a3b] transition-colors"
            >
                <Plus size={13} /> Agregar correo
            </button>

            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
}
