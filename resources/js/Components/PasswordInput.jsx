import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ label, required, value, onChange, placeholder, error }) {
    const [show, setShow] = useState(false);

    return (
        <div className="mb-5">
            {/* Aquí dibujamos el Label si es que nos mandan uno */}
            {label && (
                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                    {label} {required && <span className="text-[#BE0F4A]">*</span>}
                </label>
            )}
            
            <div 
                className={`flex items-center w-full px-4 py-2.5 border rounded-xl bg-white transition-all focus-within:ring-4 focus-within:ring-[#BE0F4A]/10 focus-within:border-[#BE0F4A] overflow-hidden ${
                    error ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
            >
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full flex-1 bg-transparent p-0 text-sm text-[#291136] placeholder-gray-400 border-0 focus:border-0 focus:ring-0 focus:outline-none m-0 shadow-none"
                    style={{
                        border: '0px solid transparent',
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: 'transparent'
                    }}
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="ml-3 text-gray-400 hover:text-[#291136] focus:outline-none flex-shrink-0"
                >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {/* Aquí dibujamos el mensaje de error si es que existe */}
            {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
        </div>
    );
}