import { Eye, Pencil, Trash2 } from 'lucide-react';

export function ViewButton({ onClick, title = 'Ver detalle' }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-1.5 rounded-lg text-[#291136]/60 hover:bg-[#291136]/10 hover:text-[#291136] transition-colors"
        >
            <Eye size={16} />
        </button>
    );
}

export function EditButton({ onClick, title = 'Editar' }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-1.5 rounded-lg text-[#BE0F4A]/70 hover:bg-[#BE0F4A]/10 hover:text-[#BE0F4A] transition-colors"
        >
            <Pencil size={16} />
        </button>
    );
}

export function DeleteButton({ onClick, title = 'Eliminar' }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
            <Trash2 size={16} />
        </button>
    );
}

export function ActionButtons({ onView, onEdit, onDelete }) {
    return (
        <div className="flex items-center gap-1">
            {onView  && <ViewButton   onClick={onView}   />}
            {onEdit  && <EditButton   onClick={onEdit}   />}
            {onDelete && <DeleteButton onClick={onDelete} />}
        </div>
    );
}