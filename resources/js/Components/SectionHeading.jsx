/**
 * SectionHeading — Subtítulo de sección con la línea ornamental rose Ankawa.
 *
 * Componente puramente presentacional. Reutilizable para preceder cualquier
 * bloque de una página (Resumen, Listado, Configuración, etc.) y mantener
 * coherencia con el <PageHeader>.
 *
 * Props:
 *   - title: string                  — obligatorio
 *   - meta?: ReactNode               — contenido a la derecha (fecha, contador, etc.)
 *
 * Si `meta` no se pasa, esa columna no se renderiza.
 */

export default function SectionHeading({ title, meta }) {
    return (
        <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
                <div className="w-12 h-[3px] bg-ankawa-rose mb-4" aria-hidden="true" />
                <h2 className="font-serif text-2xl md:text-3xl font-medium text-ankawa-deep leading-tight">
                    {title}
                </h2>
            </div>
            {meta != null && meta !== false && (
                <div className="font-mono text-xs tracking-widest uppercase text-ankawa-deep/60">
                    {meta}
                </div>
            )}
        </div>
    );
}
