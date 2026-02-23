import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
    { label, required, error, rows = 3, className = '', ...props },
    ref
) {
    return (
        <div className="mb-5">
            {label && (
                <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
                    {label} {required && <span className="text-[#BE0F4A]">*</span>}
                </label>
            )}
            <textarea
                {...props}
                ref={ref}
                rows={rows}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl bg-white
                    focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A]
                    transition-all text-[#291136] placeholder-gray-400 resize-none
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
                    ${className}`}
            />
            {error && (
                <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Textarea;