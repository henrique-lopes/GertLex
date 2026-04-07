import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import Badge from '@/Components/UI/Badge';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    PieChart, Pie, Cell, Legend
} from 'recharts';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

const CATEGORY_COLORS = ['#C9A84C','#4A7CFF','#2ECC8A','#E05555','#a855f7','#f97316','#14b8a6'];
const categoryLabels = {
    office:'Aluguel',staff:'Salários',legal_costs:'Custas',technology:'Tecnologia',
    marketing:'Marketing',travel:'Viagem',taxes:'Impostos',other:'Outros',
};

export default function FinanceIndex({ stats, chart, expenses_by_category, due_soon }) {
    return (
        <AppLayout title="Financeiro">
            <Head title="Financeiro — LexFlow" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-[#E8EAF0]">Financeiro</h1>
                <div className="flex gap-4 mt-2">
                    <Link href="/financeiro/faturas" className="text-sm text-[#C9A84C] hover:underline">Cobranças</Link>
                    <Link href="/financeiro/despesas" className="text-sm text-[#6B7491] hover:text-[#E8EAF0]">Despesas</Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { label: 'Recebido (mês)',  value: formatCurrency(stats?.received),  color: 'text-[#2ECC8A]',  bg: 'bg-[#2ECC8A]/10'  },
                    { label: 'A receber',        value: formatCurrency(stats?.pending),   color: 'text-[#4A7CFF]',  bg: 'bg-[#4A7CFF]/10'  },
                    { label: 'Vencido',          value: formatCurrency(stats?.overdue),   color: 'text-[#E05555]',  bg: 'bg-[#E05555]/10'  },
                    { label: 'Despesas (mês)',   value: formatCurrency(stats?.expenses),  color: 'text-[#C9A84C]',  bg: 'bg-[#C9A84C]/10'  },
                    { label: 'Lucro líquido',    value: formatCurrency(stats?.profit),    color: stats?.profit >= 0 ? 'text-[#2ECC8A]' : 'text-[#E05555]', bg: 'bg-[#1A1E29]' },
                ].map(s => (
                    <div key={s.label} className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4">
                        <p className="text-xs text-[#6B7491] uppercase tracking-wider mb-2">{s.label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Bar chart */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Recebimentos vs Despesas (6 meses)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chart ?? []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
                                <XAxis dataKey="month" tick={{ fill: '#6B7491', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6B7491', fontSize: 11 }} axisLine={false} tickLine={false}
                                    tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                                <Tooltip contentStyle={{ background: '#13161E', border: '1px solid #1E2330', borderRadius: 8 }}
                                    labelStyle={{ color: '#E8EAF0' }} formatter={v => [formatCurrency(v)]} />
                                <Bar dataKey="received" name="Recebido" fill="#2ECC8A" radius={[4,4,0,0]} />
                                <Bar dataKey="expenses" name="Despesas" fill="#E05555" radius={[4,4,0,0]} opacity={0.7} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Due soon */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330]">
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">Vencendo em 7 dias</h3>
                            <Link href="/financeiro/faturas" className="text-xs text-[#C9A84C] hover:underline flex items-center gap-1">
                                Ver todas <ArrowRight size={12} />
                            </Link>
                        </div>
                        <div className="divide-y divide-[#1E2330]">
                            {(due_soon ?? []).length === 0 && (
                                <p className="px-5 py-6 text-sm text-[#6B7491] text-center">Nenhuma cobrança próxima do vencimento.</p>
                            )}
                            {(due_soon ?? []).map(inv => (
                                <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                                    <div>
                                        <p className="text-sm font-medium text-[#E8EAF0]">{inv.description}</p>
                                        <p className="text-xs text-[#6B7491] mt-0.5">
                                            {inv.client?.company_name || inv.client?.name} · Venc: {formatDate(inv.due_date)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-[#E8EAF0]">{formatCurrency(inv.amount)}</span>
                                        <Badge value={inv.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Pie chart */}
                <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Despesas por Categoria</h3>
                    {(expenses_by_category ?? []).length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={expenses_by_category} dataKey="total" nameKey="category"
                                    cx="50%" cy="50%" outerRadius={80} label={false}>
                                    {(expenses_by_category ?? []).map((_, i) => (
                                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v, name) => [formatCurrency(v), categoryLabels[name] ?? name]}
                                    contentStyle={{ background: '#13161E', border: '1px solid #1E2330', borderRadius: 8 }} />
                                <Legend formatter={name => categoryLabels[name] ?? name}
                                    wrapperStyle={{ fontSize: 11, color: '#6B7491' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-sm text-[#6B7491] text-center py-12">Sem despesas este mês.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
