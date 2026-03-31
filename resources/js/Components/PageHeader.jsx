import { Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';

export default function PageHeader({
    title,
    subtitle,
    backHref,
    backLabel = 'Volver',
    badge,
    actions,
    meta,
    icon: Icon,
}) {
    return (
        <div className="px-6 pt-6 pb-4">
            {backHref && (
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[#BE0F4A] transition-colors mb-3"
                >
                    <ChevronLeft size={13} strokeWidth={2.5} />
                    {backLabel}
                </Link>
            )}

            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-black text-[#BE0F4A] tracking-tight uppercase leading-none">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-gray-400 text-sm mt-1.5">{subtitle}</p>
                    )}
                    {meta && meta.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3">
                            {meta.map(({ Icon: MetaIcon, label, value, highlight }, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    {MetaIcon && (
                                        <MetaIcon size={12} className={highlight ? 'text-[#BE0F4A]' : 'text-gray-400'} strokeWidth={2.5} />
                                    )}
                                    <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</span>
                                    <span className={`text-sm font-bold ${highlight ? 'text-[#BE0F4A]' : 'text-gray-700'}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {(badge || actions) && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0 self-start">
                        {badge}
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
