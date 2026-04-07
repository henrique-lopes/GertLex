import { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import {
    ChevronLeft, Edit, Trash2, Plus, FileText,
    DollarSign, Clock, Calendar, Sparkles, AlertTriangle
} from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}
function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

const areaLabels = {
    trabalhista:'Trabalhista',civil:'Cível',empresarial:'Empresarial',
    familia:'Família',tributario:'Tributário',criminal:'Criminal',
    previdenciario:'Previdenciário',administrativo:'Administrativo',
};

function Tab({ label, active, onClick, count }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${active
                    ? 'border-[#C9A84C] text-[#C9A84C]'
                    : 'border-transparent text-[#6B7491] hover:text-[#E8EAF0]'
                }`}
        >
            {label}
            {count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
                    ${active ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'bg-[#1A1E29] text-[#6B7491]'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

export default function CasesShow({ case: c, lawyers }) {
    const [tab, setTab] = useState('overview');
    const [addMovementOpen, setAddMovementOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState(c?.ai_summary ?? null);

    const movementForm = useForm({ title: '', description: '', occurred_at: '' });

    function deleteCase() {
        if (confirm('Tem certeza que deseja remover este processo?')) {
            router.delete(`/processos/${c.uuid}`);
        }
    }

    function submitMovement(e) {
        e.preventDefault();
        movementForm.post(`/api/cases/${c.uuid}/movements`, {
            onSuccess: () => { setAddMovementOpen(false); movementForm.reset(); router.reload(); }
        });
    }

    if (!c) return null;

    return (
        <AppLayout title={c.title}>
            <Head title={`${c.title} — LexFlow`} />

            {/* Back */}
            <Link href="/processos" className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0] mb-4">
                <ChevronLeft size={16} /> Processos
            </Link>

            {/* Header */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <Badge value={c.status} />
                            <span className="text-xs text-[#6B7491]">{areaLabels[c.area] ?? c.area}</span>
                            {c.cnj_number && (
                                <span className="text-xs font-mono text-[#6B7491] bg-[#1A1E29] px-2 py-0.5 rounded">
                                    {c.cnj_number}
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-bold text-[#E8EAF0]">{c.title}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[#6B7491] flex-wrap">
                            <span>Cliente: <span className="text-[#E8EAF0]">{c.client?.company_name || c.client?.name}</span></span>
                            <span>Resp: <span className="text-[#E8EAF0]">{c.responsible?.name}</span></span>
                            {c.phase && <span>Fase: <span className="text-[#E8EAF0]">{c.phase}</span></span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/processos/${c.uuid}/editar`}>
                            <Button variant="secondary" size="sm"><Edit size={14} /> Editar</Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={deleteCase}><Trash2 size={14} /></Button>
                    </div>
                </div>

                {/* AI summary */}
                {aiSummary && (
                    <div className="mt-4 p-4 bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-[#C9A84C]" />
                            <span className="text-xs font-medium text-[#C9A84C] uppercase tracking-wider">Resumo IA</span>
                        </div>
                        <p className="text-sm text-[#E8EAF0] leading-relaxed">{aiSummary}</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Main content */}
                <div className="xl:col-span-3">
                    {/* Tabs */}
                    <div className="flex border-b border-[#1E2330] mb-6 overflow-x-auto">
                        <Tab label="Visão Geral" active={tab === 'overview'} onClick={() => setTab('overview')} />
                        <Tab label="Movimentações" active={tab === 'movements'} onClick={() => setTab('movements')}
                            count={c.movements?.length} />
                        <Tab label="Documentos" active={tab === 'documents'} onClick={() => setTab('documents')}
                            count={c.documents?.length} />
                        <Tab label="Financeiro" active={tab === 'financial'} onClick={() => setTab('financial')}
                            count={c.invoices?.length} />
                    </div>

                    {/* Overview */}
                    {tab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                ['Vara / Tribunal', [c.court, c.tribunal].filter(Boolean).join(' · ')],
                                ['Comarca', [c.court_city, c.court_state].filter(Boolean).join(' — ')],
                                ['Valor da Causa', c.case_value ? formatCurrency(c.case_value) : null],
                                ['Honorários', c.fee_amount ? formatCurrency(c.fee_amount) : null],
                                ['Data Distribuição', formatDate(c.filed_at)],
                                ['Próximo Prazo', c.next_deadline
                                    ? <span className="text-[#E05555]">{formatDate(c.next_deadline)}</span>
                                    : null],
                            ].map(([label, value]) => value ? (
                                <div key={label} className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4">
                                    <p className="text-xs text-[#6B7491] uppercase tracking-wider mb-1">{label}</p>
                                    <p className="text-sm font-medium text-[#E8EAF0]">{value}</p>
                                </div>
                            ) : null)}
                        </div>
                    )}

                    {/* Movements */}
                    {tab === 'movements' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <Button size="sm" onClick={() => setAddMovementOpen(true)}>
                                    <Plus size={14} /> Adicionar Movimentação
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {(c.movements ?? []).length === 0 && (
                                    <p className="text-sm text-[#6B7491] text-center py-8">Nenhuma movimentação registrada.</p>
                                )}
                                {(c.movements ?? []).map((m, i) => (
                                    <div key={m.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] shrink-0 mt-1.5" />
                                            {i < (c.movements.length - 1) && (
                                                <div className="w-px flex-1 bg-[#1E2330] mt-1" />
                                            )}
                                        </div>
                                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 flex-1 mb-2">
                                            <div className="flex items-start justify-between">
                                                <p className="text-sm font-medium text-[#E8EAF0]">{m.title}</p>
                                                <span className="text-xs text-[#6B7491] shrink-0 ml-3">
                                                    {formatDateTime(m.occurred_at)}
                                                </span>
                                            </div>
                                            {m.description && (
                                                <p className="text-sm text-[#6B7491] mt-1">{m.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                    m.source === 'datajud'
                                                        ? 'bg-[#4A7CFF]/15 text-[#4A7CFF]'
                                                        : 'bg-[#1A1E29] text-[#6B7491]'
                                                }`}>
                                                    {m.source === 'datajud' ? 'DataJud' : 'Manual'}
                                                </span>
                                                {m.created_by && (
                                                    <span className="text-xs text-[#6B7491]">por {m.created_by.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Documents */}
                    {tab === 'documents' && (
                        <div>
                            <p className="text-sm text-[#6B7491] text-center py-8">
                                Upload de documentos disponível na página de Documentos.{' '}
                                <Link href="/documentos" className="text-[#C9A84C] hover:underline">Ir para Documentos</Link>
                            </p>
                        </div>
                    )}

                    {/* Financial */}
                    {tab === 'financial' && (
                        <div className="space-y-3">
                            {(c.invoices ?? []).length === 0 && (
                                <p className="text-sm text-[#6B7491] text-center py-8">Nenhuma cobrança registrada.</p>
                            )}
                            {(c.invoices ?? []).map(inv => (
                                <div key={inv.id} className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4
                                    flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#E8EAF0]">{inv.description}</p>
                                        <p className="text-xs text-[#6B7491] mt-0.5">
                                            Venc: {formatDate(inv.due_date)}
                                            {inv.installment_total > 1 && ` · Parcela ${inv.installment_number}/${inv.installment_total}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-[#E8EAF0]">
                                            {formatCurrency(inv.amount)}
                                        </span>
                                        <Badge value={inv.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* AI Actions */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4">
                        <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">IA Jurídica</h3>
                        <div className="space-y-2">
                            <Link href={`/ia?case=${c.uuid}`}>
                                <Button variant="secondary" size="sm" className="w-full justify-start">
                                    <Sparkles size={14} className="text-[#C9A84C]" />
                                    Resumir com IA
                                </Button>
                            </Link>
                            <Link href={`/ia?case=${c.uuid}&type=risk`}>
                                <Button variant="secondary" size="sm" className="w-full justify-start">
                                    <AlertTriangle size={14} className="text-yellow-400" />
                                    Analisar Risco
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Events */}
                    {(c.events ?? []).length > 0 && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4">
                            <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">Próximos Eventos</h3>
                            <div className="space-y-2">
                                {c.events.slice(0, 3).map(e => (
                                    <div key={e.id} className="flex items-start gap-2">
                                        <Calendar size={13} className="text-[#C9A84C] mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-medium text-[#E8EAF0]">{e.title}</p>
                                            <p className="text-xs text-[#6B7491]">{formatDateTime(e.starts_at)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    {(c.tasks ?? []).filter(t => t.status !== 'completed').length > 0 && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4">
                            <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">Tarefas Pendentes</h3>
                            <div className="space-y-2">
                                {c.tasks.filter(t => t.status !== 'completed').slice(0, 4).map(t => (
                                    <div key={t.id} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#6B7491] shrink-0" />
                                        <span className="text-xs text-[#E8EAF0] truncate">{t.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add movement modal */}
            <Modal open={addMovementOpen} onClose={() => setAddMovementOpen(false)} title="Nova Movimentação">
                <form onSubmit={submitMovement} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                            Título *
                        </label>
                        <input
                            value={movementForm.data.title}
                            onChange={e => movementForm.setData('title', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Ex: Audiência realizada"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                            Data
                        </label>
                        <input
                            type="datetime-local"
                            value={movementForm.data.occurred_at}
                            onChange={e => movementForm.setData('occurred_at', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                            Descrição
                        </label>
                        <textarea
                            value={movementForm.data.description}
                            onChange={e => movementForm.setData('description', e.target.value)}
                            rows={3}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C] resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={movementForm.processing}>Salvar</Button>
                        <Button type="button" variant="secondary" onClick={() => setAddMovementOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
