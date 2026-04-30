/**
 * KPIGrid — Wrapper que distribuye <KPICard> en grid responsivo.
 *
 * Responsive: 1 col mobile · 2 cols tablet · 4 cols desktop.
 * No agrega padding ni borders; ese contexto lo provee la página contenedora.
 */

export default function KPIGrid({ children }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {children}
        </div>
    );
}
