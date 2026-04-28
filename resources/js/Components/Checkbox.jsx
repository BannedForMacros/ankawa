import { forwardRef } from 'react';

const Checkbox = forwardRef(function Checkbox(
    { className = '', label, description, error, required, children, ...props },
    ref
) {
    const inputEl = (
        <input
            {...props}
            ref={ref}
            type="checkbox"
            className={`
                appearance-none w-5 h-5 rounded-md border-2 cursor-pointer shrink-0
                transition-all duration-150
                checked:bg-[#BE0F4A] checked:border-[#BE0F4A]
                focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/15
                disabled:opacity-50 disabled:cursor-not-allowed
                relative
                checked:after:content-['']
                checked:after:absolute
                checked:after:left-[5px]
                checked:after:top-[1px]
                checked:after:w-[5px]
                checked:after:h-[10px]
                checked:after:border-r-2
                checked:after:border-b-2
                checked:after:border-white
                checked:after:rotate-45
                ${error ? 'border-red-400' : 'border-gray-300 hover:border-[#BE0F4A]/60'}
                ${className}
            `}
        />
    );

    if (!label && !description && !children) {
        return inputEl;
    }

    return (
        <div className="w-full">
            <label className={`flex items-start gap-3 cursor-pointer select-none ${error ? 'text-red-600' : ''}`}>
                <span className="mt-0.5">{inputEl}</span>
                <span className="flex-1 leading-snug">
                    {label && (
                        <span className={`block text-sm font-semibold ${error ? 'text-red-700' : 'text-[#291136]'}`}>
                            {label}
                            {required && <span className="text-[#BE0F4A] ml-1">*</span>}
                        </span>
                    )}
                    {description && (
                        <span className="block text-xs text-gray-500 mt-1 font-normal leading-relaxed">
                            {description}
                        </span>
                    )}
                    {children}
                </span>
            </label>
            {error && typeof error === 'string' && (
                <p className="mt-1.5 ml-8 text-xs font-semibold text-red-500">{error}</p>
            )}
        </div>
    );
});

export default Checkbox;
