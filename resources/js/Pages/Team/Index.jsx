import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { Plus, Users, Briefcase, DollarSign, Trash2 } from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
}

function Avatar({ name, size = 'md' }) {
    const sizes = { sm: 'w-9 h-9 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-base' };
    const initials = name?.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    return (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-[#C9A84C] to-[#7A5F28]
            flex items-center justify-center font-bold text-black shrink-0`}>
            {initials}
        </div>
    );
}

export default function TeamIndex({ members }) {
    const [inviteOpen, setInviteOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '', email: '', role: 'lawyer', oab_number: '', billing_percentage: 30,
    });

    function submitInvite(e) {
        e.preventDefault();
        post(route('team.invite'), {
            onSuccess: () => { setInviteOpen(false); reset(); }
        });
    }

    function removeMember(id) {
        if (confirm('Remover este membro da equipe?')) {
            router.delete(route('team.remove', id));
        }
    }

    return (
        <AppLayout title="Equipe">
            <Head title="Equipe — LexFlow" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Equipe</h1>
                    <p className="text-sm text-[#6B7491] mt-0.5">{members?.length ?? 0} membros ativos</p>
                </div>
                <Button onClick={() => setInviteOpen(true)}><Plus size={16} /> Adicionar Membro</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {(members ?? []).map(member => (
                    <div key={member.id} className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar name={member.user?.name} />
                                <div>
                                    <p className="text-sm font-semibold text-[#E8EAF0]">{member.user?.name}</p>
                                    <p className="text-xs text-[#6B7491]">{member.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge value={member.role} />
                                {member.role !== 'owner' && (
                                    <button onClick={() => removeMember(member.id)}
                                        className="text-[#6B7491] hover:text-[#E05555] transition-colors p-1">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {(member.user?.specialties ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                                {member.user.specialties.slice(0,3).map(s => (
                                    <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#1A1E29] text-[#6B7491]">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        )}

                        {member.user?.oab_number && (
                            <p className="text-xs text-[#6B7491] mb-4">
                                OAB {member.user.oab_state ?? ''} {member.user.oab_number}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#1E2330]">
                            <div className="flex items-center gap-2">
                                <Briefcase size={13} className="text-[#6B7491]" />
                                <div>
                                    <p className="text-xs text-[#6B7491]">Processos</p>
                                    <p className="text-sm font-bold text-[#E8EAF0]">{member.active_cases ?? 0}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign size={13} className="text-[#6B7491]" />
                                <div>
                                    <p className="text-xs text-[#6B7491]">Faturamento</p>
                                    <p className="text-sm font-bold text-[#E8EAF0]">{formatCurrency(member.month_revenue)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {(members ?? []).length === 0 && (
                    <div className="col-span-full">
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-12 text-center">
                            <Users size={32} className="text-[#6B7491] mx-auto mb-3" />
                            <p className="text-sm font-medium text-[#E8EAF0]">Nenhum membro na equipe</p>
                            <p className="text-xs text-[#6B7491] mt-1">Adicione advogados ao escritório.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Invite modal */}
            <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Adicionar Membro">
                <form onSubmit={submitInvite} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Nome *</label>
                        <input value={data.name} onChange={e => setData('name', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Dr. Nome Sobrenome" />
                        {errors.name && <p className="text-xs text-[#E05555] mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">E-mail *</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="advogado@escritorio.com" />
                        {errors.email && <p className="text-xs text-[#E05555] mt-1">{errors.email}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Função *</label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                <option value="admin">Admin</option>
                                <option value="lawyer">Advogado</option>
                                <option value="intern">Estagiário</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">OAB</label>
                            <input value={data.oab_number} onChange={e => setData('oab_number', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="SP 123456" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                            % Honorários: {data.billing_percentage}%
                        </label>
                        <input type="range" min="0" max="100" value={data.billing_percentage}
                            onChange={e => setData('billing_percentage', Number(e.target.value))}
                            className="w-full accent-[#C9A84C]" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Adicionando...' : 'Adicionar'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
