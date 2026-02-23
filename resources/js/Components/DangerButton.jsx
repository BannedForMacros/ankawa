export default function DangerButton({ children, className = '', disabled, ...props }) {
    return (
        <button
            {...props}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                bg-red-600 hover:bg-red-700 active:bg-red-800
                transition-colors duration-200 shadow-sm
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-red-500/50
                ${className}`}
        >
            {children}
        </button>
    );
}