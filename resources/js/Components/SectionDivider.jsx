/**
 * SectionDivider — Divisor ornamental entre bloques de página.
 *
 * Líneas finas a los costados y cuatro rombos centrados (uno en rose Ankawa
 * para el toque heráldico). Puramente decorativo, sin props.
 */

export default function SectionDivider() {
    return (
        <div className="flex items-center justify-center gap-3 my-12" aria-hidden="true">
            <div className="h-px w-24 bg-ankawa-deep/15" />
            <div className="flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rotate-45 bg-ankawa-deep/30" />
                <span className="block w-2   h-2   rotate-45 bg-ankawa-rose" />
                <span className="block w-2   h-2   rotate-45 bg-ankawa-deep/40" />
                <span className="block w-1.5 h-1.5 rotate-45 bg-ankawa-deep/30" />
            </div>
            <div className="h-px w-24 bg-ankawa-deep/15" />
        </div>
    );
}
