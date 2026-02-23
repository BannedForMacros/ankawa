export default function Badge({ status, text }) {
    const styles = {
        activo: 'bg-green-100 text-green-700 border-green-200',
        inactivo: 'bg-gray-100 text-gray-500 border-gray-200',
        pendiente: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        error: 'bg-red-100 text-red-700 border-red-200',
    };

    // Normalizamos el status a minúsculas o usamos un mapeo según tu base de datos
    const currentStyle = styles[status?.toLowerCase()] || styles.inactivo;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-60"></span>
            {text}
        </span>
    );
}