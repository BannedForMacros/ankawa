// resources/js/Components/Input.jsx
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  {
    label,
    required = false,
    error,
    iconRight,
    onIconClick,           // ← nueva prop para el clic del ícono
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  return (
    <div className={`mb-5 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-bold text-[#291136] mb-2 uppercase tracking-wide opacity-80">
          {label}
          {required && <span className="text-[#BE0F4A] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 text-sm border rounded-xl
            focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A]
            transition-all text-[#291136] bg-white
            ${iconRight ? 'pr-11' : 'pr-4'}
            ${error ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
            ${className}
          `}
          {...props}
        />

        {iconRight && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-[#291136] transition-colors focus:outline-none"
          >
            {iconRight}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>
      )}
    </div>
  );
});

export default Input;