import React, { Children, useEffect, useRef, useState } from 'react';

/**
 * Reveal — animación de entrada on-scroll (IntersectionObserver + transiciones CSS).
 *
 * Solo anima `transform` y `opacity` (60 fps). Si el usuario tiene
 * `prefers-reduced-motion: reduce`, el contenido se muestra de inmediato
 * sin animación (nunca se oculta).
 *
 * Props:
 * - direction:       'up' | 'down' | 'left' | 'right' | 'fade' | 'zoom'  (default 'up')
 * - delay:           ms antes de iniciar la transición                    (default 0)
 * - duration:        ms de la transición                                  (default 700)
 * - threshold:       fracción visible que dispara el reveal               (default 0.15)
 * - once:            si true, anima una sola vez                          (default true)
 * - staggerChildren: ms entre hijos directos; cada hijo se envuelve en un
 *                    div que hereda dirección/duración con delay incremental
 * - childClassName:  clases para los wrappers de hijos en modo stagger
 */

const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const HIDDEN_BY_DIRECTION = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    fade: '',
    zoom: 'scale-[0.96] translate-y-4',
};

export function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReduced(mq.matches);
        const onChange = (e) => setReduced(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return reduced;
}

export default function Reveal({
    children,
    direction = 'up',
    delay = 0,
    duration = 700,
    threshold = 0.15,
    once = true,
    staggerChildren = 0,
    className = '',
    childClassName = '',
}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        if (reduced) {
            setVisible(true);
            return;
        }
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (once) observer.unobserve(entry.target);
                } else if (!once) {
                    setVisible(false);
                }
            },
            { threshold }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [reduced, threshold, once]);

    const shown = reduced || visible;
    const hiddenClass = `opacity-0 ${HIDDEN_BY_DIRECTION[direction] ?? HIDDEN_BY_DIRECTION.up}`;
    const stateClass = shown
        ? 'opacity-100 translate-x-0 translate-y-0 scale-100'
        : hiddenClass;

    const transitionStyle = (index = 0) =>
        reduced
            ? undefined
            : {
                  transitionProperty: 'transform, opacity',
                  transitionDuration: `${duration}ms`,
                  transitionTimingFunction: EASING,
                  transitionDelay: `${delay + index * staggerChildren}ms`,
              };

    if (staggerChildren > 0) {
        return (
            <div ref={ref} className={className}>
                {Children.map(children, (child, i) =>
                    // Hijos condicionales (false/null) no se envuelven: evita divs
                    // vacíos que romperían space-y-* y el conteo del stagger visual
                    child ? (
                        <div className={`${stateClass} ${childClassName}`} style={transitionStyle(i)}>
                            {child}
                        </div>
                    ) : child
                )}
            </div>
        );
    }

    return (
        <div ref={ref} className={`${stateClass} ${className}`} style={transitionStyle(0)}>
            {children}
        </div>
    );
}
