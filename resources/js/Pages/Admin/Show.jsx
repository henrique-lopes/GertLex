import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Shield, Users, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';

const PLANS = ['trial', 'starter', 'pro', 'premium'];
const STATUSES = ['trialing', 'active', 'suspended', 'canceled'];

const ROLE_LABEL = {
    owner:  'Owner',
    admin:  'Admin',
    lawyer: 'Advogado',
    intern: 'Estagiário',
    staff:  'Staff',
};

export default function AdminShow({ workspace }) {
    const { flash } = usePage().props;
    const [plan, setPlan] = useState(workspace.plan);
    const [planStatus, setPlanStatus] = useState(workspace.plan_status);

    function savePlan(e) {
        e.preventDefault();
        router.put(`/admin/workspaces/${workspace.id}/plan`, { plan, plan_status: planStatus }, { preserveScroll: true });
    }

    function toggle() {
        router.post(`/admin/workspaces/${workspace.id}/toggle`, {}, { preserveScroll: true });
    }

    return (
        <div className="min-h-screen bg-[#0D0F14] text-[#E8EAF0] p-6 max-w-4xl mx-auto">
            <Head title={`Admin — ${workspace.name}`} />

            <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-[#6B7491] hover:text-[#E8EAF0] mb-6 transition-colors">
                <ArrowLeft size={16} /> Voltar
            </Link>

            {flash?.success && (
                <div className="mb-6 px-4 py-3 rounded-lg bg-[#2ECC8A]/10 text-[#2ECC8A] border border-[#2ECC8A]/20 text-sm">
                    {flash.success}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#7A5F28] flex items-center justify-center">
                        <span className="text-black font-black">{workspace.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-[#E8EAF0]">{workspace.name}</h1>
                        <p className="text-xs text-[#6B7491]">{workspace.email}</p>
                    </div>
                </div>
                <button onClick={toggle} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-[#1E2330] hover:bg-[#1A1E29] transition-colors">
                    {workspace.is_active
                        ? <><ToggleRight size={18} className="text-[#2ECC8A]" /> Ativo</>
                        : <><ToggleLeft size={18} className="text-[#E05555]" /> Suspenso</>
                    }
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plano */}
                <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard size={16} className="text-[#C9A84C]" />
                        <h2 className="text-sm font-semibold text-[#E8EAF0]">Plano & Status</h2>
                    </div>
                    <form onSubmit={savePlan} className="space-y-3">
                        <div>
                            <label className="block text-xs text-[#6B7491] mb-1">Plano</label>
                            <select
                                value={plan}
                                onChange={e => setPlan(e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            >
                                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-[#6B7491] mb-1">Status</label>
                            <select
                                value={planStatus}
                                onChange={e => setPlanStatus(e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            >
                                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#C9A84C] to-[#7A5F28] text-black font-bold rounded-lg py-2 text-sm hover:opacity-90 transition-opacity"
                        >
                            Salvar Plano
                        </button>
                    </form>
                </div>

                {/* Info */}
                <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield size={16} className="text-[#4A7CFF]" />
                        <h2 className="text-sm font-semibold text-[#E8EAF0]">Informações</h2>
                    </div>
                    <dl className="space-y-2 text-sm">
                        {[
                            ['CNPJ',       workspace.cnpj || '—'],
                            ['OAB',        workspace.oab_seccional ? `${workspace.oab_seccional}` : '—'],
                            ['Cidade',     workspace.address_city || '—'],
                            ['Trial até',  workspace.trial_ends_at || '—'],
                            ['Criado em',  workspace.created_at],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between">
                                <dt className="text-[#6B7491]">{label}</dt>
                                <dd className="text-[#E8EAF0]">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>

            {/* Members */}
            <div className="mt-6 bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1E2330]">
                    <Users size={16} className="text-[#6B7491]" />
                    <h2 className="text-sm font-semibold text-[#E8EAF0]">Membros ({workspace.members?.length ?? 0})</h2>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[#6B7491] text-xs uppercase tracking-wider border-b border-[#1E2330]">
                            <th className="text-left px-5 py-3">Nome</th>
                            <th className="text-left px-5 py-3">E-mail</th>
                            <th className="text-left px-5 py-3">Role</th>
                            <th className="text-left px-5 py-3">OAB</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2330]">
                        {workspace.members?.map(member => (
                            <tr key={member.id} className="hover:bg-[#1A1E29]">
                                <td className="px-5 py-3 text-[#E8EAF0]">{member.user?.name}</td>
                                <td className="px-5 py-3 text-[#6B7491]">{member.user?.email}</td>
                                <td className="px-5 py-3">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E2330] text-[#6B7491]">
                                        {ROLE_LABEL[member.role] ?? member.role}
                                    </span>
                                </td>
                                <td className="px-5 py-3 text-[#6B7491]">{member.user?.oab_number || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
