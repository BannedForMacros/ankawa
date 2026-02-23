export default function PrimaryButton({ children, className = '', disabled, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                bg-[#BE0F4A] hover:bg-[#BC1D35] active:bg-[#4A153D]
                transition-colors duration-200 shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/50
                ${className}`}
        >
            {children}
        </button>
    );
}