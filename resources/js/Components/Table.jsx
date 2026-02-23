import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { 
    ChevronUp, 
    ChevronDown, 
    ChevronsUpDown, 
    Search, 
    ChevronLeft, 
    ChevronRight 
} from 'lucide-react';

// ── Encabezado de columna con ordenamiento ──
function ThSortable({ column, label, sortBy, sortDir, onSort, isFirst, isLast }) {
    const isActive = sortBy === column;
    const roundedClass = isFirst ? 'rounded-tl-xl' : isLast ? 'rounded-tr-xl' : '';

    return (
        <th
            onClick={() => onSort(column)}
            className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer select-none hover:bg-[#BC1D35]/80 transition-colors ${roundedClass}`}
        >
            <div className="flex items-center gap-1.5">
                <span>{label}</span>
                <span className="opacity-70">
                    {isActive
                        ? sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                        : <ChevronsUpDown size={13} />
                    }
                </span>
            </div>
        </th>
    );
}

// ── Paginación ──
function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) return null;
    const { current_page, last_page, from, to, total } = meta;

    const pages = [];
    const delta = 2;
    const range = [];
    for (let i = Math.max(1, current_page - delta); i <= Math.min(last_page, current_page + delta); i++) {
        range.push(i);
    }
    if (range[0] > 1) {
        pages.push(1);
        if (range[0] > 2) pages.push('...');
    }
    pages.push(...range);
    if (range[range.length - 1] < last_page) {
        if (range[range.length - 1] < last_page - 1) pages.push('...');
        pages.push(last_page);
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white rounded-b-xl">
            <p className="text-xs text-gray-500">
                Mostrando <span className="font-medium text-[#291136]">{from}</span> a <span className="font-medium text-[#291136]">{to}</span> de <span className="font-medium text-[#291136]">{total}</span> registros
            </p>
            <div className="flex items-center gap-1">
                <button onClick={() => onPageChange(current_page - 1)} disabled={current_page === 1} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
                {pages.map((page, i) => page === '...' ? <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span> : <button key={page} onClick={() => onPageChange(page)} className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === current_page ? 'bg-[#BE0F4A] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{page}</button>)}
                <button onClick={() => onPageChange(current_page + 1)} disabled={current_page === last_page} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
            </div>
        </div>
    );
}

// ── Componente principal Table ──
export default function Table({
    columns,
    data,
    meta,
    routeName,
    routeParams = {},
    searchPlaceholder = 'Buscar...',
}) {
    const urlParams = new URLSearchParams(window.location.search);
    const [search, setSearch] = useState(urlParams.get('search') ?? '');
    const [sortBy, setSortBy] = useState(urlParams.get('sort') ?? '');
    const [sortDir, setSortDir] = useState(urlParams.get('dir') ?? 'asc');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (urlParams.get('search') ?? '')) {
                fetchData(1, search, sortBy, sortDir);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchData = (page, q, sort, dir) => {
        router.get(
            route(routeName, routeParams),
            { page, search: q || undefined, sort: sort || undefined, dir: dir || undefined },
            { preserveState: true, replace: true }
        );
    };

    const handleSort = (column) => {
        const newDir = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDir(newDir);
        fetchData(1, search, column, newDir);
    };

    const handlePageChange = (page) => fetchData(page, search, sortBy, sortDir);

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#BE0F4A]/30 focus:border-[#BE0F4A] text-[#291136] bg-white shadow-sm transition-all"
                />
            </div>

            <div className="rounded-xl shadow-sm border border-gray-200 bg-white">
                <div className="overflow-x-auto rounded-t-xl">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr style={{ background: 'linear-gradient(135deg, #291136 0%, #4A153D 100%)' }}>
                                {columns.map((col, index) => (
                                    col.sortable !== false ? (
                                        <ThSortable
                                            key={col.key}
                                            column={col.key}
                                            label={col.label}
                                            sortBy={sortBy}
                                            sortDir={sortDir}
                                            onSort={handleSort}
                                            isFirst={index === 0}
                                            isLast={index === columns.length - 1}
                                        />
                                    ) : (
                                        <th 
                                            key={col.key} 
                                            className={`px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider 
                                                ${index === 0 ? 'rounded-tl-xl' : ''} 
                                                ${index === columns.length - 1 ? 'rounded-tr-xl' : ''}`}
                                        >
                                            {col.label}
                                        </th>
                                    )
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400 text-sm">
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : (
                                data.map((row, i) => (
                                    <tr key={row.id ?? i} className="hover:bg-gray-50/80 transition-colors">
                                        {columns.map(col => (
                                            <td key={col.key} className="px-4 py-3 text-[#291136]/80 leading-tight">
                                                {col.render ? col.render(row) : (row[col.key] ?? '—')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={meta} onPageChange={handlePageChange} />
            </div>
        </div>
    );
}