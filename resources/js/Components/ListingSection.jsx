/**
 * ListingSection — Contenedor de una sección de listado (cards de expediente,
 * solicitudes, usuarios, etc.).
 *
 * Compone <SectionHeading>, descripción opcional, filtros opcionales y barra
 * meta opcional ("Mostrando X de Y" — el padre la construye con la data real).
 *
 * Props:
 *   - title:        string         — obligatorio
 *   - description?: string         — párrafo descriptivo bajo el título
 *   - meta?:        ReactNode      — texto pequeño con metadata (mono uppercase)
 *   - filters?:     ReactNode      — barra de filtros / búsqueda / tabs
 *   - children:     ReactNode      — items del listado (ya espaciados con space-y-3)
 *
 * El componente NO calcula nada: meta llega ya formateado por el padre.
 */

import SectionHeading from './SectionHeading';

export default function ListingSection({ title, description, meta, filters, children }) {
    return (
        <section>
            <SectionHeading title={title} />

            {description && (
                <p className="text-base text-ankawa-deep/70 leading-relaxed max-w-xl mb-6">
                    {description}
                </p>
            )}

            {filters && (
                <div className="border-b border-ankawa-deep/[0.08] pb-4 mb-4">
                    {filters}
                </div>
            )}

            {meta && (
                <div className="font-mono text-xs uppercase tracking-widest text-ankawa-deep/60 border-t border-b border-ankawa-deep/[0.08] py-2.5 mb-4">
                    {meta}
                </div>
            )}

            <div className="space-y-3">
                {children}
            </div>
        </section>
    );
}
