import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, placeholder, error }) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const menuRef = useRef(null);

    // Función para calcular la posición (Memorizada para evitar renders infinitos)
    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({
                // Sumamos el scroll actual para que la posición sea relativa al body
                left: rect.left + window.scrollX,
                top: rect.bottom + window.scrollY + 4, 
                width: rect.width
            });
        }
    }, []);

    const toggleMenu = () => {
        if (!isOpen) updatePosition();
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                buttonRef.current && !buttonRef.current.contains(event.target) &&
                menuRef.current && !menuRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        // Si el menú está abierto, escuchamos el scroll y el resize
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

    return (
        <>
            <div className="relative w-full" ref={buttonRef}>
                <button
                    type="button"
                    onClick={toggleMenu}
                    className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A] transition-all ${
                        error ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                >
                    <span className={selectedOption ? 'text-[#291136]' : 'text-gray-400'}>
                        {selectedOption ? selectedOption.nombre : placeholder}
                    </span>
                    <ChevronDown 
                        size={16} 
                        className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </button>
            </div>

            {/* Portal: Se renderiza al final del body */}
            {isOpen && createPortal(
                <ul
                    ref={menuRef}
                    style={{
                        position: 'absolute',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        zIndex: 999999 
                    }}
                    className="bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-auto py-1.5 focus:outline-none"
                >
                    <li
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        className="px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                        {placeholder}
                    </li>
                    {options.map((opt) => (
                        <li
                            key={opt.id}
                            onClick={() => { onChange(opt.id); setIsOpen(false); }}
                            className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                value?.toString() === opt.id.toString() 
                                    ? 'bg-[#BE0F4A]/10 text-[#BE0F4A] font-semibold' 
                                    : 'text-[#291136] hover:bg-gray-50'
                            }`}
                        >
                            {opt.nombre}
                        </li>
                    ))}
                </ul>,
                document.body
            )}
        </>
    );
}