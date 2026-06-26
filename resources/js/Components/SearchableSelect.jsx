import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   SearchableSelect — select con buscador, mismo lenguaje visual que
   CustomSelect (portal + animación). Filtra sin distinguir tildes ni
   mayúsculas. `options`: [{ id, nombre }].
   ───────────────────────────────────────────────────────────── */

const norm = (s) => (s ?? '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export default function SearchableSelect({
    value, onChange, options = [], placeholder = 'Seleccione...',
    searchPlaceholder = 'Buscar...', error, disabled = false, emptyText = 'Sin resultados',
}) {
    const [isOpen, setIsOpen]   = useState(false);
    const [entered, setEntered] = useState(false);
    const [query, setQuery]     = useState('');
    const [coords, setCoords]   = useState({ top: 0, left: 0, width: 0 });
    const buttonRef = useRef(null);
    const menuRef   = useRef(null);
    const searchRef = useRef(null);
    const closeTimer = useRef(null);

    const updatePosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setCoords({ left: rect.left + window.scrollX, top: rect.bottom + window.scrollY + 4, width: rect.width });
        }
    }, []);

    const openMenu = useCallback(() => {
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        updatePosition();
        setQuery('');
        setIsOpen(true);
    }, [updatePosition]);

    const closeMenu = useCallback(() => {
        setEntered(false);
        closeTimer.current = setTimeout(() => { setIsOpen(false); closeTimer.current = null; }, 160);
    }, []);

    const toggleMenu = () => {
        if (disabled) return;
        isOpen ? closeMenu() : openMenu();
    };

    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => { setEntered(true); searchRef.current?.focus(); });
        return () => cancelAnimationFrame(raf);
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)) {
                closeMenu();
            }
        };
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
    }, [isOpen, updatePosition, closeMenu]);

    const selectedOption = options.find(opt => opt.id.toString() === value?.toString());

    const filtered = useMemo(() => {
        const q = norm(query);
        if (!q) return options;
        return options.filter(opt => norm(opt.nombre).includes(q));
    }, [options, query]);

    const elegir = (id) => { onChange(id); closeMenu(); };

    return (
        <>
            <div className="relative w-full" ref={buttonRef}>
                <button
                    type="button"
                    onClick={toggleMenu}
                    disabled={disabled}
                    className={`w-full px-4 py-2.5 text-sm bg-white border rounded-xl flex items-center justify-between gap-2 focus:outline-none focus:ring-4 focus:ring-[#BE0F4A]/10 focus:border-[#BE0F4A] transition-all ${
                        error ? 'border-red-400 bg-red-50' : disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-70' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <span className={`truncate ${selectedOption ? 'text-[#291136]' : 'text-gray-400'}`}>
                        {selectedOption ? selectedOption.nombre : placeholder}
                    </span>
                    <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform duration-200 ${entered ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px`, width: `${coords.width}px`, zIndex: 999999 }}
                    className={`bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden origin-top transition-all duration-150 ease-out ${
                        entered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
                    }`}
                >
                    {/* Buscador */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/20 focus:border-[#BE0F4A]"
                            />
                            {query && (
                                <button type="button" onClick={() => { setQuery(''); searchRef.current?.focus(); }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Opciones */}
                    <ul className="max-h-56 overflow-auto py-1.5">
                        {filtered.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-gray-400 text-center">{emptyText}</li>
                        ) : filtered.map(opt => (
                            <li
                                key={opt.id}
                                onClick={() => elegir(opt.id)}
                                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                                    value?.toString() === opt.id.toString()
                                        ? 'bg-[#BE0F4A]/10 text-[#BE0F4A] font-semibold'
                                        : 'text-[#291136] hover:bg-gray-50'
                                }`}
                            >
                                {opt.nombre}
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}
        </>
    );
}
