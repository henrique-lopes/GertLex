import { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { Plus, Search, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function Invoices({ invoices, clients, filters }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [payOpen, setPayOpen]       = useState(false);
    const [selectedInv, setSelected]  = useState(null);
    const [search, setSearch]         = useState(filters?.search ?? '');
    const [status, setStatus]         = useState(filters?.status ?? '');

    const createForm = useForm({
        client_id: '', case_id: '', description: '', amount: '',
        due_date: '', installments: 1, notes: '',
    });

    const payForm = useForm({ payment_method: 'pix', amount_paid: '', paid_at: '' });

    function applyFilters(overrides = {}) {
        router.get('/financeiro/faturas', {
            search: overrides.search ?? search,
            status: overrides.status ?? status,
        }, { preserveState: true, replace: true });
    }

    function submitCreate(e) {
        e.preventDefault();
        createForm.post(route('finance.invoices.store'), {
            onSuccess: () => { setCreateOpen(false); createForm.reset(); }
        });
    }

    function openPay(inv) {
        setSelected(inv);
        payForm.setData({ payment_method: 'pix', amount_paid: inv.amount, paid_at: new Date().toISOString().split('T')[0] });
        setPayOpen(true);
    }

    function submitPay(e) {
        e.preventDefault();
        payForm.put(route('finance.invoices.pay', selectedInv.id), {
            onSuccess: () => { setPayOpen(false); setSelected(null); }
        });
    }

    return (
        <AppLayout title="Cobranças">
            <Head title="Cobranças — LexFlow" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/financeiro" className="text-sm text-[#6B7491] hover:text-[#E8EAF0]">Financeiro</Link>
                        <span className="text-[#6B7491]">/</span>
                        <span className="text-sm text-[#E8EAF0]">Cobranças</span>
                    </div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Cobranças</h1>
                </div>
                <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Nova Cobrança</Button>
            </div>

            {/* Filters */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 flex items-center gap-2 bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2">
                    <Search size={14} className="text-[#6B7491]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        placeholder="Buscar descrição..." className="flex-1 bg-transparent text-sm text-[#E8EAF0] outline-none placeholder-[#6B7491]" />
                </div>
                <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todos os status</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                    <option value="overdue">Vencido</option>
                    <option value="partial">Parcial</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#1A1E29]">
                                {['Descrição','Cliente','Vencimento','Valor','Parcela','Status','Ação'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E2330]">
                            {(invoices?.data ?? []).length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-10 text-sm text-[#6B7491] text-center">Nenhuma cobrança.</td></tr>
                            )}
                            {(invoices?.data ?? []).map(inv => (
                                <tr key={inv.id} className="hover:bg-[#1A1E29]/50">
                                    <td className="px-4 py-3 text-sm text-[#E8EAF0]">{inv.description}</td>
                                    <td className="px-4 py-3 text-sm text-[#6B7491]">
                                        {inv.client?.company_name || inv.client?.name || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#6B7491]">{formatDate(inv.due_date)}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-[#E8EAF0]">{formatCurrency(inv.amount)}</td>
                                    <td className="px-4 py-3 text-sm text-[#6B7491]">
                                        {inv.installment_total > 1 ? `${inv.installment_number}/${inv.installment_total}` : '—'}
                                    </td>
                                    <td className="px-4 py-3"><Badge value={inv.status} /></td>
                                    <td className="px-4 py-3">
                                        {inv.status === 'pending' && (
                                            <button onClick={() => openPay(inv)}
                                                className="text-xs px-2.5 py-1 rounded-lg bg-[#2ECC8A]/15 text-[#2ECC8A] hover:bg-[#2ECC8A]/25 transition-colors">
                                                Registrar Pagamento
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {invoices?.last_page > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2330]">
                        <p className="text-xs text-[#6B7491]">Mostrando {invoices.from}–{invoices.to} de {invoices.total}</p>
                        <div className="flex items-center gap-2">
                            {invoices.prev_page_url && <Link href={invoices.prev_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronLeft size={16} /></Link>}
                            <span className="text-xs text-[#6B7491]">{invoices.current_page} / {invoices.last_page}</span>
                            {invoices.next_page_url && <Link href={invoices.next_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]"><ChevronRight size={16} /></Link>}
                        </div>
                    </div>
                )}
            </div>

            {/* Create modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nova Cobrança">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Cliente *</label>
                        <select value={createForm.data.client_id} onChange={e => createForm.setData('client_id', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                            <option value="">Selecione...</option>
                            {(clients ?? []).map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
                        </select>
                        {createForm.errors.client_id && <p className="text-xs text-[#E05555] mt-1">{createForm.errors.client_id}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Descrição *</label>
                        <input value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Honorários advocatícios..." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Valor (R$) *</label>
                            <input type="number" step="0.01" value={createForm.data.amount} onChange={e => createForm.setData('amount', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="0,00" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Vencimento *</label>
                            <input type="date" value={createForm.data.due_date} onChange={e => createForm.setData('due_date', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Parcelas</label>
                            <input type="number" min="1" max="60" value={createForm.data.installments} onChange={e => createForm.setData('installments', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={createForm.processing}>Criar Cobrança</Button>
                        <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            {/* Pay modal */}
            <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Registrar Pagamento" size="sm">
                <form onSubmit={submitPay} className="space-y-4">
                    <p className="text-sm text-[#6B7491]">{selectedInv?.description}</p>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Forma de Pagamento *</label>
                        <select value={payForm.data.payment_method} onChange={e => payForm.setData('payment_method', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                            <option value="pix">PIX</option>
                            <option value="transfer">Transferência</option>
                            <option value="boleto">Boleto</option>
                            <option value="credit_card">Cartão de Crédito</option>
                            <option value="cash">Dinheiro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Valor Pago (R$)</label>
                        <input type="number" step="0.01" value={payForm.data.amount_paid} onChange={e => payForm.setData('amount_paid', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Data do Pagamento</label>
                        <input type="date" value={payForm.data.paid_at} onChange={e => payForm.setData('paid_at', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={payForm.processing}>Confirmar Pagamento</Button>
                        <Button type="button" variant="secondary" onClick={() => setPayOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
