import { cloneElement } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    Scale, Inbox, Clock, CalendarX, FolderOpen, FileSearch,
    AlertTriangle, UserX, Gavel, Send, CheckSquare, ChevronRight,
    Layers, Users, BarChart3, FileStack, Briefcase, ShieldCheck,
} from 'lucide-react';
import KPIGrid from '@/Components/KPIGrid';
import KPICard from '@/Components/KPICard';
import BarrasChart from '@/Components/charts/BarrasChart';
import ColumnasChart from '@/Components/charts/ColumnasChart';
import DonutChart from '@/Components/charts/DonutChart';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function urgencia(dias) {
    if (dias === null || dias === undefined) {
        return { label: '—', cls: 'text-ankawa-deep/40 bg-ankawa-deep/5 border-ankawa-deep/10' };
    }
    if (dias < 0)  return { label: `Vencido ${Math.abs(dias)}d`, cls: 'text-red-700 bg-red-50 border-red-200' };
    if (dias === 0) return { label: 'Hoy', cls: 'text-ankawa-rose bg-ankawa-rose/10 border-ankawa-rose/25' };
    if (dias <= 2) return { label: `${dias}d`, cls: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: `${dias}d`, cls: 'text-ankawa-deep/60 bg-ankawa-deep/[0.06] border-ankawa-deep/10' };
}

/* ── Bloques presentacionales ─────────────────────────────────────────── */

const PANEL_GRADIENT = 'linear-gradient(135deg, #291136 0%, #4A153D 55%, #BE0F4A 100%)';

function Panel({ title, icon, children, action }) {
    return (
        <section className="bg-white rounded-2xl border border-ankawa-deep/[0.08] shadow-sm overflow-hidden flex flex-col">
            {/* Banda de cabecera con gradiente de marca — parte el card en dos */}
            <div
                className="flex items-center justify-between gap-3 px-5 py-3.5"
                style={{ background: PANEL_GRADIENT }}
            >
                <h3 className="flex items-center gap-3 min-w-0">
                    {icon && (
                        <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 shrink-0">
                            {cloneElement(icon, { size: 22, strokeWidth: 2, className: 'text-white' })}
                        </span>
                    )}
                    <span className="font-bold text-white text-[15px] leading-tight truncate">{title}</span>
                </h3>
                {action}
            </div>
            <div className="p-5">
                {children}
            </div>
        </section>
    );
}

function ListaVencimientos({ items, emptyLabel = 'Nada por aquí — todo al día.' }) {
    if (!items || items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-8 text-ankawa-deep/40">
                <CheckSquare size={28} strokeWidth={1.5} className="mb-2" />
                <p className="text-sm">{emptyLabel}</p>
            </div>
        );
    }
    return (
        <ul className="divide-y divide-ankawa-deep/[0.06]">
            {items.map((m) => {
                const u = urgencia(m.dias_restantes);
                return (
                    <li key={m.id}>
                        <Link
                            href={`/expedientes/${m.expediente_id}`}
                            className="flex items-center gap-3 py-3 group hover:bg-ankawa-deep/[0.015] -mx-2 px-2 rounded-lg transition-colors"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-xs tabular-nums text-ankawa-rose mb-0.5">{m.expediente ?? '—'}</p>
                                <p className="text-sm text-ankawa-deep/80 truncate">{m.instruccion || 'Movimiento'}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${u.cls}`}>
                                {u.label}
                            </span>
                            <ChevronRight size={15} className="shrink-0 text-ankawa-deep/20 group-hover:text-ankawa-rose transition-colors" />
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}

function ListaExpedientes({ items, emptyLabel }) {
    if (!items || items.length === 0) {
        return <p className="text-sm text-ankawa-deep/40 py-6 text-center">{emptyLabel}</p>;
    }
    return (
        <ul className="divide-y divide-ankawa-deep/[0.06]">
            {items.map((e) => (
                <li key={e.id}>
                    <Link
                        href={`/expedientes/${e.id}`}
                        className="flex items-center gap-3 py-3 group hover:bg-ankawa-deep/[0.015] -mx-2 px-2 rounded-lg transition-colors"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="text-xs tabular-nums text-ankawa-rose mb-0.5">{e.numero ?? '—'}</p>
                            <p className="text-sm text-ankawa-deep/70 truncate">
                                {e.servicio}{e.etapa ? ` · ${e.etapa}` : ''}
                            </p>
                        </div>
                        <ChevronRight size={15} className="shrink-0 text-ankawa-deep/20 group-hover:text-ankawa-rose transition-colors" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/* ── Página ───────────────────────────────────────────────────────────── */

export default function Dashboard({ perfil = {}, personal = {}, global = null, gestor = null, arbitral = null }) {
    const nombre = perfil?.nombre ?? '';
    const primerNombre = nombre.split(' ')[0] || nombre;

    return (
        <AuthenticatedLayout>
            <Head title="Panel de Control" />

            {/* ── Hero fotográfico de marca (momento de entrada) ── */}
            <header className="relative overflow-hidden">
                {/* Foto de oficina legal (zoom lento Ken Burns) */}
                <div
                    className="absolute inset-0 bg-cover bg-center dash-kenburns"
                    style={{ backgroundImage: 'url(/images/backgrounds/hero-dashboard.jpg)' }}
                />
                {/* Velo de marca — oscuro a la izquierda (legibilidad) hacia rose a la derecha */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(100deg, rgba(41,17,54,0.95) 0%, rgba(74,21,61,0.88) 42%, rgba(190,15,74,0.60) 100%)' }}
                />
                {/* Águila a color de marca */}
                <img
                    src="/logo.png"
                    alt=""
                    aria-hidden="true"
                    className="hidden md:block pointer-events-none select-none absolute right-8 lg:right-14 top-1/2 -translate-y-1/2 h-[200px] w-auto z-10"
                    style={{ opacity: 0.9 }}
                />

                <div className="relative z-20 px-6 sm:px-10 py-10 max-w-3xl dash-hero-in">
                    <nav aria-label="Breadcrumb" className="mb-4">
                        <span className="text-xs uppercase tracking-widest text-white/70">Inicio</span>
                    </nav>
                    <div className="w-12 h-[3px] bg-ankawa-rose mb-4" aria-hidden="true" />
                    <h1 className="font-black text-4xl md:text-5xl leading-tight text-white mb-2 tracking-tight">
                        Hola, <span className="text-ankawa-rose">{primerNombre}</span>
                    </h1>
                    <p className="text-sm md:text-base text-white/80">
                        {perfil?.rol_nombre ?? ''}{perfil?.puede_ver_todos ? ' · visión institucional' : ''}
                    </p>
                </div>
            </header>

            <div className="relative min-h-full" style={{ background: 'linear-gradient(to bottom, #f4f1f6 0%, #ebe6ef 100%)' }}>
                {/* Fondo del contenido — águila de marca COMPLETA (contain, a color).
                    bg-fixed: se mantiene visible al hacer scroll (no desaparece).
                    Base plum-gris cálida (ni rosado lavado, ni gris plano). */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 bg-contain bg-center bg-no-repeat bg-fixed opacity-20"
                        style={{ backgroundImage: 'url(/images/backgrounds/contenido-aguila.jpg)' }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 py-8 space-y-10">

                {/* ── Resumen personal (siempre) ── */}
                <div>
                    <KPIGrid className="dash-stagger">
                        <KPICard variant="filled" label="Mis expedientes" value={personal.mis_expedientes ?? 0}
                            accentColor="deep" icon={<Scale size={18} strokeWidth={1.8} />} />
                        <KPICard variant="filled" label="Pendientes a mi cargo" value={personal.mis_pendientes ?? 0}
                            accentColor="rose" icon={<Inbox size={18} strokeWidth={1.8} />} />
                        <KPICard variant="filled" label="Por vencer · 3 días" value={personal.por_vencer ?? 0}
                            accentColor="crimson" icon={<Clock size={18} strokeWidth={1.8} />} />
                        <KPICard variant="filled" label="Vencidos" value={personal.vencidos ?? 0}
                            accentColor="muted" icon={<CalendarX size={18} strokeWidth={1.8} />} />
                    </KPIGrid>

                    {(personal.por_vencer_lista?.length > 0) && (
                        <Panel title="Próximos vencimientos a tu cargo" icon={<Clock size={18} className="text-ankawa-rose" />}>
                            <ListaVencimientos items={personal.por_vencer_lista} />
                        </Panel>
                    )}
                </div>

                {/* ── Bloque GLOBAL (dirección / secretarías con visión institucional) ── */}
                {global && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-ankawa-rose text-xs font-bold uppercase tracking-widest">
                            <ShieldCheck size={14} /> Visión institucional
                        </div>

                        <KPIGrid className="dash-stagger">
                            <KPICard variant="filled" label="Expedientes activos" value={global.expedientes_activos ?? 0}
                                accentColor="deep" icon={<FolderOpen size={18} strokeWidth={1.8} />} />
                            <KPICard variant="filled" label="Solicitudes por revisar" value={global.admision?.por_revisar ?? 0}
                                accentColor="rose" icon={<FileSearch size={18} strokeWidth={1.8} />} />
                            <KPICard variant="filled" label="Vencidos · institución" value={global.vencidos ?? 0}
                                accentColor="muted" icon={<AlertTriangle size={18} strokeWidth={1.8} />} />
                            <KPICard variant="filled" label="Sin gestor asignado" value={global.admision?.sin_gestor ?? 0}
                                accentColor="crimson" icon={<UserX size={18} strokeWidth={1.8} />} />
                        </KPIGrid>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 dash-stagger">
                            <Panel title="Expedientes activos por servicio" icon={<Layers size={18} className="text-ankawa-rose" />}>
                                <DonutChart data={global.por_servicio} emptyLabel="Sin expedientes activos" />
                            </Panel>
                            <Panel title="Carga por gestor" icon={<Users size={18} className="text-ankawa-rose" />}>
                                <BarrasChart data={global.carga_gestores} color="deep" emptyLabel="Sin casos asignados" />
                            </Panel>
                            <Panel title="Cargos emitidos · últimos 6 meses" icon={<BarChart3 size={18} className="text-ankawa-rose" />}>
                                <ColumnasChart data={global.cargos_mes} />
                            </Panel>
                            <Panel
                                title="Vencimientos más próximos"
                                icon={<Clock size={18} className="text-ankawa-rose" />}
                                action={<Link href="/expedientes" className="shrink-0 text-xs font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors">Ver todos</Link>}
                            >
                                <ListaVencimientos items={global.urgentes} emptyLabel="Sin plazos pendientes." />
                            </Panel>
                            <div className="lg:col-span-2">
                                <Panel
                                    title="Expedientes recientes"
                                    icon={<FileStack size={18} className="text-ankawa-rose" />}
                                    action={<Link href="/expedientes" className="shrink-0 text-xs font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors">Ir a expedientes</Link>}
                                >
                                    <ListaExpedientes items={global.recientes} emptyLabel="Aún no hay expedientes." />
                                </Panel>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Bloque GESTOR (secretario arbitral / gestor JPRD con casos a cargo) ── */}
                {gestor && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-ankawa-rose text-xs font-bold uppercase tracking-widest">
                            <Briefcase size={14} /> Mis casos como gestor
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dash-stagger">
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:col-span-1">
                                <KPICard variant="filled" label="Casos a mi cargo" value={gestor.mis_casos ?? 0}
                                    accentColor="deep" icon={<Briefcase size={18} strokeWidth={1.8} />} />
                                <KPICard variant="filled" label="Envíos por aceptar" value={gestor.envios_por_aceptar ?? 0}
                                    accentColor="rose" icon={<Send size={18} strokeWidth={1.8} />} />
                            </div>
                            <div className="lg:col-span-2">
                                <Panel title="Requerimientos por vencer en mis casos" icon={<Clock size={18} className="text-ankawa-rose" />}>
                                    <ListaVencimientos items={gestor.por_vencer_lista} />
                                </Panel>
                            </div>
                        </div>

                        <Panel title="Mis casos por etapa" icon={<Layers size={18} className="text-ankawa-rose" />}>
                            <BarrasChart data={gestor.por_etapa} color="deep" emptyLabel="Sin casos activos." />
                        </Panel>
                    </div>
                )}

                {/* ── Bloque ARBITRAL (árbitro / adjudicador designado) ── */}
                {arbitral && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-ankawa-rose text-xs font-bold uppercase tracking-widest">
                            <Gavel size={14} /> Casos para resolver
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dash-stagger">
                            <KPICard variant="filled" label="Casos designados" value={arbitral.mis_casos ?? 0}
                                accentColor="deep" icon={<Gavel size={18} strokeWidth={1.8} />} />
                            <div className="lg:col-span-2">
                                <Panel title="Esperan mi conformidad / laudo" icon={<CheckSquare size={18} className="text-ankawa-rose" />}>
                                    <ListaExpedientes items={arbitral.conformidad_pendiente} emptyLabel="Ningún caso requiere tu conformidad ahora." />
                                </Panel>
                            </div>
                        </div>

                        <Panel title="Plazos a mi cargo" icon={<Clock size={18} className="text-ankawa-rose" />}>
                            <ListaVencimientos items={arbitral.plazos} />
                        </Panel>
                    </div>
                )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
