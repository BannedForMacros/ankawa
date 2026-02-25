import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import { FolderOpen, LayoutDashboard } from 'lucide-react';

// ── Componente visual para el Estado del Expediente ──
function EstadoBadge({ estado }) {
    const map = {
        en_proceso: { color: 'bg-blue-100 text-blue-800',   label: 'En Proceso' },
        resuelto:   { color: 'bg-green-100 text-green-800', label: 'Resuelto'   },
        archivado:  { color: 'bg-gray-100 text-gray-800',   label: 'Archivado'  },
    };
    const s = map[estado] ?? { color: 'bg-gray-100 text-gray-500', label: estado };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.color}`}>
            {s.label}
        </span>
    );
}

// ── Componente Principal ──
// Le ponemos = [] por si el backend manda null, React no explote con el .length
export default function Index({ expedientes = [] }) { 

    // ── Definición de Columnas para tu componente Table.jsx ──
    const columnas = [
        {
            key: 'numero_expediente',
            label: 'N° Expediente / Cargo',
            sortable: true,
            render: (row) => (
                <span className="font-mono font-bold text-[#291136] text-xs">
                    {row.numero_expediente || 'Sin N° Oficial'}
                </span>
            )
        },
        {
            key: 'servicio',
            label: 'Servicio',
            sortable: true,
            render: (row) => <span className="text-gray-600 text-sm font-medium">{row.servicio}</span>
        },
        {
            key: 'etapa',
            label: 'Etapa',
            sortable: true,
            render: (row) => <span className="font-semibold text-gray-800 text-xs">{row.etapa}</span>
        },
        {
            key: 'actividad',
            label: 'Actividad Actual (Pendiente)',
            sortable: true,
            render: (row) => (
                <span className="inline-flex items-center text-xs text-orange-700 bg-orange-50 px-2 py-1.5 rounded-lg border border-orange-100 font-medium">
                    {row.actividad}
                </span>
            )
        },
        {
            key: 'estado',
            label: 'Estado',
            sortable: true,
            render: (row) => <EstadoBadge estado={row.estado} />
        },
        {
            key: 'created_at',
            label: 'Fecha Inicio',
            sortable: true,
            render: (row) => <span className="text-xs text-gray-500">{row.created_at}</span>
        },
        {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            render: (row) => (
                <Link
                    href={route('expedientes.show', row.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-[#291136] rounded-xl hover:bg-[#291136] hover:text-white transition-colors text-xs font-bold shadow-sm"
                    title="Abrir Expediente"
                >
                    <FolderOpen size={14} /> Abrir Caso
                </Link>
            )
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Expedientes en Curso" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* ── Cabecera de la vista ── */}
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#BE0F4A]/10 text-[#BE0F4A] rounded-2xl flex items-center justify-center">
                                <LayoutDashboard size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-[#291136]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                                    Expedientes en Curso
                                </h1>
                                <p className="text-gray-500 mt-1 text-sm">
                                    Bandeja principal para la gestión, revisión y seguimiento de casos.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Tu Componente de Tabla ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-2 sm:p-4">
                        <Table
                            columns={columnas}
                            data={expedientes}
                            routeName="expedientes.index"
                            searchPlaceholder="Buscar por número o estado..."
                        />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}