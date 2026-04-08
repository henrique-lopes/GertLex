import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Building2, Users, CreditCard, Shield, TrendingUp,
    ChevronRight, ToggleLeft, ToggleRight, Search
} from 'lucide-react';

const PLAN_COLOR = {
    trial:   'bg-[#6B7491]/20 text-[#6B7491]',
    starter: 'bg-[#4A7CFF]/15 text-[#4A7CFF]',
    pro:     'bg-[#C9A84C]/15 text-[#C9A84C]',
    premium: 'bg-[#2ECC8A]/15 text-[#2ECC8A]',
};

const STATUS_COLOR = {
    trialing:  'bg-[#C9A84C]/15 text-[#C9A84C]',
    active:    'bg-[#2ECC8A]/15 text-[#2ECC8A]',
    suspended: 'bg-[#E05555]/15 text-[#E05555]',
    canceled:  'bg-[#6B7491]/20 text-[#6B7491]',
};

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#6B7491] uppercase tracking-wider">{label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={16} />
                </div>
            </div>
            <p className="text-2xl font-bold text-[#E8EAF0]">{value}</p>
        </div>
    );
}

export default function AdminIndex({ workspaces, stats }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState('');

    const filtered = workspaces.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.email?.toLowerCase().includes(search.toLowerCase())
    );

    function toggle(id) {
        router.post(`/admin/workspaces/${id}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#0D0F14] text-[#E8EAF0] p-6">
            <Head title="Super Admin — GertLex" />

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-lg bg-[#E05555]/15 flex items-center justify-center">
                    <Shield size={18} className="text-[#E05555]" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Painel Super Admin</h1>
                    <p className="text-xs text-[#6B7491]">Gestão de workspaces e planos</p>
                </div>
            </div>

            {flash?.success && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-[#2ECC8A]/10 text-[#2ECC8A] border border-[#2ECC8A]/20 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Total Escritórios" value={stats.total_workspaces} icon={Building2} color="bg-[#4A7CFF]/15 text-[#4A7CFF]" />
                <StatCard label="Ativos"            value={stats.active}           icon={TrendingUp} color="bg-[#2ECC8A]/15 text-[#2ECC8A]" />
                <StatCard label="Em Trial"          value={stats.trialing}         icon={CreditCard} color="bg-[#C9A84C]/15 text-[#C9A84C]" />
                <StatCard label="Pagantes"          value={stats.paid}             icon={CreditCard} color="bg-[#2ECC8A]/15 text-[#2ECC8A]" />
                <StatCard label="Total Usuários"    value={stats.total_users}      icon={Users}      color="bg-[#6B7491]/20 text-[#6B7491]" />
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-[#13161E] border border-[#1E2330] rounded-lg px-3 py-2 mb-4 w-full max-w-sm">
                <Search size={14} className="text-[#6B7491]" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar escritório..."
                    className="bg-transparent text-sm text-[#E8EAF0] placeholder-[#6B7491] outline-none flex-1"
                />
            </div>

            {/* Table */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[#1E2330] text-[#6B7491] text-xs uppercase tracking-wider">
                            <th className="text-left px-4 py-3">Escritório</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">E-mail</th>
                            <th className="text-left px-4 py-3">Plano</th>
                            <th className="text-left px-4 py-3 hidden lg:table-cell">Status</th>
                            <th className="text-left px-4 py-3 hidden lg:table-cell">Membros</th>
                            <th className="text-left px-4 py-3 hidden lg:table-cell">Criado em</th>
                            <th className="text-center px-4 py-3">Ativo</th>
                            <th className="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2330]">
                        {filtered.map(ws => (
                            <tr key={ws.id} className="hover:bg-[#1A1E29] transition-colors">
                                <td className="px-4 py-3 font-medium text-[#E8EAF0]">{ws.name}</td>
                                <td className="px-4 py-3 text-[#6B7491] hidden md:table-cell">{ws.email}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[ws.plan] ?? ''}`}>
                                        {ws.plan}
                                    </span>
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[ws.plan_status] ?? ''}`}>
                                        {ws.plan_status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[#6B7491] hidden lg:table-cell">{ws.members_count}</td>
                                <td className="px-4 py-3 text-[#6B7491] hidden lg:table-cell">{ws.created_at}</td>
                                <td className="px-4 py-3 text-center">
                                    <button onClick={() => toggle(ws.id)} className="text-[#6B7491] hover:text-[#E8EAF0] transition-colors">
                                        {ws.is_active
                                            ? <ToggleRight size={22} className="text-[#2ECC8A]" />
                                            : <ToggleLeft size={22} className="text-[#E05555]" />
                                        }
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                                    <Link href={`/admin/workspaces/${ws.id}`}
                                        className="text-[#6B7491] hover:text-[#C9A84C] transition-colors">
                                        <ChevronRight size={18} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-[#6B7491]">
                                    Nenhum escritório encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
