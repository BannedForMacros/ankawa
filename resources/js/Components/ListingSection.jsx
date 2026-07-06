/**
 * ListingSection — Contenedor de una sección de listado (cards de expediente,
 * solicitudes, usuarios, etc.) con identidad de marca Ankawa.
 *
 * Mismo patrón que los paneles del Dashboard: card partido en dos — banda de
 * cabecera con gradiente de marca (icono en tile + título en blanco) y cuerpo
 * blanco con descripción, filtros, meta y los items del listado.
 *
 * Props:
 *   - title:        string         — obligatorio
 *   - icon?:        ReactNode      — LucideIcon; se normaliza a 22px blanco en tile
 *   - description?: string         — párrafo descriptivo bajo la banda
 *   - meta?:        ReactNode      — texto pequeño con metadata (uppercase)
 *   - filters?:     ReactNode      — barra de filtros / búsqueda / tabs
 *   - children:     ReactNode      — items del listado (ya espaciados con space-y-3)
 *
 * El componente NO calcula nada: meta llega ya formateado por el padre.
 */

import { cloneElement, isValidElement } from 'react';

const BAND_GRADIENT = 'linear-gradient(135deg, #291136 0%, #4A153D 55%, #BE0F4A 100%)';

export default function ListingSection({ title, icon, description, meta, filters, children }) {
    return (
        <section className="bg-white rounded-2xl border border-ankawa-deep/[0.08] shadow-sm overflow-hidden">
            {/* Banda de cabecera con gradiente de marca */}
            <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: BAND_GRADIENT }}>
                {icon && (
                    <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 shrink-0">
                        {isValidElement(icon) ? cloneElement(icon, { size: 22, strokeWidth: 2, className: 'text-white' }) : icon}
                    </span>
                )}
                <h2 className="font-bold text-white text-[15px] leading-tight truncate">{title}</h2>
            </div>

            <div className="p-5">
                {description && (
                    <p className="text-base text-ankawa-deep/70 leading-relaxed max-w-xl mb-5">
                        {description}
                    </p>
                )}

                {filters && (
                    <div className="border-b border-ankawa-deep/[0.08] pb-4 mb-4">
                        {filters}
                    </div>
                )}

                {meta && (
                    <div className="text-xs font-semibold uppercase tracking-widest text-ankawa-deep/60 border-b border-ankawa-deep/[0.08] pb-2.5 mb-4">
                        {meta}
                    </div>
                )}

                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </section>
    );
}
