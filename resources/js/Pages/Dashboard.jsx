import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatCard } from '@/Components/UI/Card';
import Badge from '@/Components/UI/Badge';
import {
    Briefcase, DollarSign, Users, Calendar,
    AlertTriangle, ArrowRight, Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

function daysUntil(d) {
    if (!d) return null;
    const diff = Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000);
    return diff;
}

const areaLabels = {
    trabalhista: 'Trabalhista', civil: 'Cível', empresarial: 'Empresarial',
    familia: 'Família', tributario: 'Tributário', criminal: 'Criminal', previdenciario: 'Previdenciário',
};

export default function Dashboard({ stats, recent_cases, today_events, upcoming_deadlines, finance_chart }) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard — LexFlow" />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                    label="Processos Ativos"
                    value={stats?.active_cases ?? 0}
                    delta={stats?.cases_delta}
                    icon={Briefcase}
                    color="blue"
                />
                <StatCard
                    label="Faturamento (mês)"
                    value={formatCurrency(stats?.mrr)}
                    icon={DollarSign}
                    color="gold"
                />
                <StatCard
                    label="Advogados Ativos"
                    value={stats?.active_lawyers ?? 0}
                    icon={Users}
                    color="green"
                />
                <StatCard
                    label="Audiências (semana)"
                    value={stats?.week_events ?? 0}
                    icon={Calendar}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left column */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Finance chart */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Faturamento vs Despesas (6 meses)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={finance_chart ?? []} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
                                <XAxis dataKey="month" tick={{ fill: '#6B7491', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6B7491', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: '#13161E', border: '1px solid #1E2330', borderRadius: 8 }}
                                    labelStyle={{ color: '#E8EAF0' }}
                                    formatter={(v) => [formatCurrency(v)]}
                                />
                                <Bar dataKey="received" name="Recebido" fill="#C9A84C" radius={[4,4,0,0]} />
                                <Bar dataKey="expenses" name="Despesas" fill="#E05555" radius={[4,4,0,0]} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Recent cases */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330]">
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">Processos Recentes</h3>
                            <Link href="/processos" className="text-xs text-[#C9A84C] hover:underline flex items-center gap-1">
                                Ver todos <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="divide-y divide-[#1E2330]">
                            {(recent_cases ?? []).length === 0 && (
                                <p className="px-5 py-8 text-sm text-[#6B7491] text-center">Nenhum processo cadastrado.</p>
                            )}
                            {(recent_cases ?? []).map(c => (
                                <Link
                                    key={c.id}
                                    href={`/processos/${c.uuid}`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1A1E29] transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-[#E8EAF0] truncate">{c.title}</p>
                                        <p className="text-xs text-[#6B7491] mt-0.5">
                                            {c.client?.company_name || c.client?.name} · {areaLabels[c.area] ?? c.area}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-4 shrink-0">
                                        {c.case_value && (
                                            <span className="text-xs text-[#6B7491] hidden sm:block">
                                                {formatCurrency(c.case_value)}
                                            </span>
                                        )}
                                        <Badge value={c.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    {/* Today events */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330]">
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">Audiências Hoje</h3>
                            <Link href="/agenda" className="text-xs text-[#C9A84C] hover:underline">
                                Agenda
                            </Link>
                        </div>
                        <div className="p-5 space-y-3">
                            {(today_events ?? []).length === 0 && (
                                <p className="text-sm text-[#6B7491] text-center py-4">Nenhum evento hoje.</p>
                            )}
                            {(today_events ?? []).map(e => (
                                <div key={e.id} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-2 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[#E8EAF0]">{e.title}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <Clock size={11} className="text-[#6B7491]" />
                                            <span className="text-xs text-[#6B7491]">
                                                {new Date(e.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {e.location && (
                                                <span className="text-xs text-[#6B7491] truncate"> · {e.location}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming deadlines */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                        <div className="px-5 py-4 border-b border-[#1E2330]">
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">Prazos Próximos</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            {(upcoming_deadlines ?? []).length === 0 && (
                                <p className="text-sm text-[#6B7491] text-center py-4">Nenhum prazo nos próximos 7 dias.</p>
                            )}
                            {(upcoming_deadlines ?? []).map(c => {
                                const days = daysUntil(c.next_deadline);
                                return (
                                    <Link key={c.id} href={`/processos/${c.uuid}`}
                                        className="flex items-center gap-3 hover:bg-[#1A1E29] rounded-lg p-2 -m-2 transition-colors">
                                        <AlertTriangle
                                            size={15}
                                            className={days <= 1 ? 'text-[#E05555]' : days <= 3 ? 'text-yellow-400' : 'text-[#6B7491]'}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-[#E8EAF0] truncate">{c.title}</p>
                                            <p className="text-xs text-[#6B7491]">
                                                {formatDate(c.next_deadline)}
                                                {days !== null && (
                                                    <span className={` · ${days <= 1 ? 'text-[#E05555]' : days <= 3 ? 'text-yellow-400' : 'text-[#6B7491]'}`}>
                                                        {days === 0 ? ' hoje' : days === 1 ? ' amanhã' : ` ${days} dias`}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
