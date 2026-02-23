export default function SecondaryButton({ children, className = '', disabled, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
                text-[#291136] bg-white border border-gray-300
                hover:bg-gray-50 hover:border-[#291136]/30
                transition-colors duration-200 shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-[#291136]/20
                ${className}`}
        >
            {children}
        </button>
    );
}