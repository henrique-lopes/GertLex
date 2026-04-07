import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { Plus, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

const categories = [
    ['office','Aluguel'],['staff','Salários'],['legal_costs','Custas'],
    ['technology','Tecnologia'],['marketing','Marketing'],['travel','Viagem'],
    ['taxes','Impostos'],['other','Outros'],
];

export default function Expenses({ expenses, filters }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [category, setCategory]     = useState(filters?.category ?? '');

    const form = useForm({
        description: '', category: 'office', amount: '', expense_date: '', notes: '',
    });

    function applyFilters(overrides = {}) {
        router.get('/financeiro/despesas', {
            category: overrides.category ?? category,
        }, { preserveState: true, replace: true });
    }

    function submitCreate(e) {
        e.preventDefault();
        form.post(route('finance.expenses.store'), {
            onSuccess: () => { setCreateOpen(false); form.reset(); }
        });
    }

    function deleteExpense(id) {
        if (confirm('Remover esta despesa?')) {
            router.delete(route('finance.expenses.destroy', id));
        }
    }

    return (
        <AppLayout title="Despesas">
            <Head title="Despesas — LexFlow" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/financeiro" className="text-sm text-[#6B7491] hover:text-[#E8EAF0]">Financeiro</Link>
                        <span className="text-[#6B7491]">/</span>
                        <span className="text-sm text-[#E8EAF0]">Despesas</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Despesas</h1>
                </div>
                <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nova Despesa</Button>
            </div>

            {/* Filters */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 mb-6 flex gap-3">
                <select value={category} onChange={e => { setCategory(e.target.value); applyFilters({ category: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todas as categorias</option>
                    {categories.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#1A1E29]">
                                {['Descrição','Categoria','Valor','Data','Ação'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7491] uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2330]">
                            {(expenses?.data ?? []).length === 0 && (
                                <tr><td colSpan={5} className="px-4 py-10 text-sm text-[#6B7491] text-center">Nenhuma despesa registrada.</td></tr>
                            )}
                            {(expenses?.data ?? []).map(exp => (
                                <tr key={exp.id} className="hover:bg-[#1A1E29]/50">
                                    <td className="px-4 py-3 text-sm text-[#E8EAF0]">{exp.description}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A1E29] text-[#6B7491]">
                                            {categories.find(([v]) => v === exp.category)?.[1] ?? exp.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-[#E8EAF0]">{formatCurrency(exp.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-[#6B7491]">{formatDate(exp.expense_date)}</td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => deleteExpense(exp.id)}
                                            className="text-[#6B7491] hover:text-[#E05555] transition-colors p-1">
                                            <Trash2 size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {expenses?.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2330]">
                        <p className="text-xs text-[#6B7491]">Mostrando {expenses.from}–{expenses.to} de {expenses.total}</p>
                        <div className="flex items-center gap-2">
                            {expenses.prev_page_url && <Link href={expenses.prev_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronLeft size={16} /></Link>}
                            <span className="text-xs text-[#6B7491]">{expenses.current_page} / {expenses.last_page}</span>
                            {expenses.next_page_url && <Link href={expenses.next_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronRight size={16} /></Link>}
                        </div>
                    </div>
                )}
            </div>

            {/* Create modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova Despesa" size="sm">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Descrição *</label>
                        <input value={form.data.description} onChange={e => form.setData('description', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Aluguel do escritório..." />
                        {form.errors.description && <p className="text-xs text-[#E05555] mt-1">{form.errors.description}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Categoria *</label>
                            <select value={form.data.category} onChange={e => form.setData('category', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                {categories.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Valor (R$) *</label>
                            <input type="number" step="0.01" value={form.data.amount} onChange={e => form.setData('amount', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="0,00" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Data *</label>
                        <input type="date" value={form.data.expense_date} onChange={e => form.setData('expense_date', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={form.processing}>Salvar</Button>
                        <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
