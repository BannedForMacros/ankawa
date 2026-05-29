import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Popover reutilizable, posicionado vía portal a document.body para no ser
 * recortado por contenedores con overflow (tablas con overflow-x-auto, etc.).
 *
 * Se abre con hover Y con foco de teclado; se cierra con click afuera, Escape,
 * o al salir el puntero (con un pequeño delay para poder entrar al panel).
 *
 * Uso:
 *   <Popover
 *      panelClassName="bg-white border ..."
 *      trigger={(triggerProps, open) => (
 *          <button type="button" {...triggerProps} aria-label="...">+3</button>
 *      )}
 *   >
 *      {contenido del panel}
 *   </Popover>
 */
export default function Popover({ trigger, children, panelClassName = '' }) {
    const [isOpen, setIsOpen]   = useState(false); // montado en el DOM
    const [entered, setEntered] = useState(false); // estado animado (visible)
    const [coords, setCoords]   = useState({ top: 0, left: 0 });

    const triggerRef = useRef(null);
    const panelRef   = useRef(null);
    const hoverClose = useRef(null); // delay antes de iniciar el cierre
    const unmount    = useRef(null); // delay para desmontar tras la animación

    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setCoords({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX });
    }, []);

    const open = useCallback(() => {
        clearTimeout(hoverClose.current);
        clearTimeout(unmount.current);
        updatePosition();
        setIsOpen(true);
    }, [updatePosition]);

    const close = useCallback(() => {
        setEntered(false);
        clearTimeout(unmount.current);
        unmount.current = setTimeout(() => setIsOpen(false), 150);
    }, []);

    // Cierre con delay: permite mover el puntero del trigger al panel sin que se cierre.
    const requestClose = useCallback(() => {
        clearTimeout(hoverClose.current);
        hoverClose.current = setTimeout(close, 120);
    }, [close]);

    const cancelClose = useCallback(() => {
        clearTimeout(hoverClose.current);
        clearTimeout(unmount.current);
    }, []);

    // Animación de entrada en el frame siguiente al montaje
    useEffect(() => {
        if (!isOpen) return;
        const raf = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(raf);
    }, [isOpen]);

    // Click afuera, Escape y reposicionamiento mientras está abierto
    useEffect(() => {
        if (!isOpen) return;
        const onDown = (e) => {
            if (triggerRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
            close();
        };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, close, updatePosition]);

    // Limpiar timers al desmontar
    useEffect(() => () => { clearTimeout(hoverClose.current); clearTimeout(unmount.current); }, []);

    const triggerProps = {
        ref:             triggerRef,
        onMouseEnter:    open,
        onMouseLeave:    requestClose,
        onFocus:         open,
        onBlur:          requestClose,
        onClick:         open,
        'aria-haspopup': true,
        'aria-expanded': isOpen,
    };

    return (
        <>
            {trigger(triggerProps, isOpen)}
            {isOpen && createPortal(
                <div
                    ref={panelRef}
                    role="dialog"
                    onMouseEnter={cancelClose}
                    onMouseLeave={requestClose}
                    style={{ position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px`, zIndex: 999999 }}
                    className={`origin-top transition-all duration-150 ease-out ${
                        entered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-1'
                    } ${panelClassName}`}
                >
                    {children}
                </div>,
                document.body
            )}
        </>
    );
}
