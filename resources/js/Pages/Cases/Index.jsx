import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import EmptyState from '@/Components/UI/EmptyState';
import Modal from '@/Components/UI/Modal';
import { Plus, Search, Filter, Briefcase, ChevronLeft, ChevronRight, Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const TRIBUNAIS = [
    'TJSP','TJRJ','TJMG','TJRS','TJPR','TJSC','TJBA','TJPE','TJCE','TJGO',
    'TRT2','TRT15','STJ','STF',
];

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
}

const areaLabels = {
    trabalhista: 'Trabalhista', civil: 'Cível', empresarial: 'Empresarial',
    familia: 'Família', tributario: 'Tributário', criminal: 'Criminal',
    previdenciario: 'Previdenciário', administrativo: 'Administrativo',
};

const areas = Object.entries(areaLabels);
const statuses = [
    { value: 'active', label: 'Ativo' },
    { value: 'waiting', label: 'Aguardando' },
    { value: 'urgent', label: 'Urgente' },
    { value: 'closed_won', label: 'Ganho' },
    { value: 'closed_lost', label: 'Perdido' },
];

export default function CasesIndex({ cases, lawyers, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [area, setArea] = useState(filters?.area ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [lawyer, setLawyer] = useState(filters?.lawyer ?? '');

    // DataJud modal state
    const [datajudOpen, setDatajudOpen] = useState(false);
    const [cnjNumber, setCnjNumber]     = useState('');
    const [tribunal, setTribunal]       = useState('TJSP');
    const [searching, setSearching]     = useState(false);
    const [results, setResults]         = useState(null);
    const [importing, setImporting]     = useState(null);
    const [imported, setImported]       = useState({});
    const [searchError, setSearchError] = useState('');
    const [searchMsg, setSearchMsg]     = useState('');

    async function searchDataJud() {
        if (!cnjNumber.trim()) return;
        setSearching(true);
        setResults(null);
        setSearchError('');
        setSearchMsg('');
        try {
            const res = await fetch('/datajud/buscar-oab', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ cnj_number: cnjNumber, tribunal }),
            });
            const data = await res.json();
            if (!res.ok) setSearchError(data.error ?? 'Erro ao buscar.');
            else {
                setResults(data.cases ?? []);
                if (data.message) setSearchMsg(data.message);
            }
        } catch {
            setSearchError('Erro de conexão.');
        } finally {
            setSearching(false);
        }
    }

    async function importCase(c) {
        setImporting(c.cnj_number);
        try {
            const res = await fetch('/datajud/importar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    cnj_number:     c.cnj_number,
                    title:          c.title,
                    tribunal:       c.tribunal,
                    court:          c.court,
                    filed_at:       c.filed_at,
                    opposing_party: c.parties?.find(p => p.type !== 'Advogado' && p.type !== 'Autor')?.name ?? '',
                }),
            });
            const data = await res.json();
            if (!res.ok) alert(data.error ?? 'Erro ao importar.');
            else setImported(prev => ({ ...prev, [c.cnj_number]: data.uuid }));
        } finally {
            setImporting(null);
        }
    }

    function applyFilters(overrides = {}) {
        router.get('/processos', {
            search: overrides.search ?? search,
            area:   overrides.area ?? area,
            status: overrides.status ?? status,
            lawyer: overrides.lawyer ?? lawyer,
        }, { preserveState: true, replace: true });
    }

    function handleSearchKey(e) {
        if (e.key === 'Enter') applyFilters();
    }

    return (
        <AppLayout title="Processos">
            <Head title="Processos — GertLex" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Processos</h1>
                    <p className="text-sm text-[#6B7491] mt-0.5">{cases?.total ?? 0} processos cadastrados</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setDatajudOpen(true)}>
                        <Download size={16} /> Importar via DataJud
                    </Button>
                    <Link href="/processos/novo">
                        <Button><Plus size={16} /> Novo Processo</Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 flex items-center gap-2 bg-[#0D0F14] border border-[#1E2330]
                    rounded-lg px-3 py-2">
                    <Search size={14} className="text-[#6B7491] shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleSearchKey}
                        placeholder="Buscar por título ou Nº CNJ..."
                        className="flex-1 bg-transparent text-sm text-[#E8EAF0] placeholder-[#6B7491] outline-none"
                    />
                </div>

                <select
                    value={area}
                    onChange={e => { setArea(e.target.value); applyFilters({ area: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
                        focus:outline-none focus:border-[#C9A84C]"
                >
                    <option value="">Todas as áreas</option>
                    {areas.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>

                <select
                    value={status}
                    onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
                        focus:outline-none focus:border-[#C9A84C]"
                >
                    <option value="">Todos os status</option>
                    {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>

                <select
                    value={lawyer}
                    onChange={e => { setLawyer(e.target.value); applyFilters({ lawyer: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0]
                        focus:outline-none focus:border-[#C9A84C]"
                >
                    <option value="">Todos os advogados</option>
                    {(lawyers ?? []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>

                <Button variant="secondary" onClick={() => applyFilters()} size="md">
                    <Filter size={14} /> Filtrar
                </Button>
            </div>

            {/* Table */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                {(cases?.data ?? []).length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="Nenhum processo encontrado"
                        description="Clique em 'Novo Processo' para cadastrar o primeiro processo."
                        action={<Link href="/processos/novo"><Button>Novo Processo</Button></Link>}
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#1A1E29]">
                                        {['Processo', 'Cliente', 'Advogado', 'Área', 'Fase', 'Valor', 'Status'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium
                                                text-[#6B7491] uppercase tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2330]">
                                    {cases.data.map(c => (
                                        <tr key={c.id} className="hover:bg-[#1A1E29]/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/processos/${c.uuid}`}
                                                    className="text-sm font-medium text-[#E8EAF0] hover:text-[#C9A84C] transition-colors line-clamp-1">
                                                    {c.title}
                                                </Link>
                                                {c.cnj_number && (
                                                    <p className="text-xs text-[#6B7491] mt-0.5 font-mono">{c.cnj_number}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491]">
                                                {c.client?.company_name || c.client?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491]">
                                                {c.responsible?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491] whitespace-nowrap">
                                                {areaLabels[c.area] ?? c.area}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491]">
                                                {c.phase || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491] whitespace-nowrap">
                                                {c.case_value ? formatCurrency(c.case_value) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge value={c.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {cases.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2330]">
                                <p className="text-xs text-[#6B7491]">
                                    Mostrando {cases.from}–{cases.to} de {cases.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    {cases.prev_page_url && (
                                        <Link href={cases.prev_page_url}
                                            className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0] transition-colors">
                                            <ChevronLeft size={16} />
                                        </Link>
                                    )}
                                    <span className="text-xs text-[#6B7491]">{cases.current_page} / {cases.last_page}</span>
                                    {cases.next_page_url && (
                                        <Link href={cases.next_page_url}
                                            className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0] transition-colors">
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* DataJud Modal */}
            <Modal open={datajudOpen} onClose={() => { setDatajudOpen(false); setResults(null); setCnjNumber(''); }} title="Importar Processo via DataJud CNJ">
                <div className="space-y-4">
                    <p className="text-xs text-[#6B7491]">
                        Informe o número CNJ do processo (com ou sem formatação) e selecione o tribunal.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Número CNJ *</label>
                            <input
                                value={cnjNumber}
                                onChange={e => setCnjNumber(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && searchDataJud()}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="0000001-23.2020.8.26.0100" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Tribunal *</label>
                            <select value={tribunal} onChange={e => setTribunal(e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                {TRIBUNAIS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <Button onClick={searchDataJud} disabled={searching || !cnjNumber.trim()} className="w-full justify-center">
                        {searching ? <><Loader2 size={15} className="animate-spin" /> Buscando...</> : <><Search size={15} /> Buscar Processo</>}
                    </Button>

                    {searchError && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E05555]/10 border border-[#E05555]/20 text-[#E05555] text-sm">
                            <AlertCircle size={14} /> {searchError}
                        </div>
                    )}

                    {results !== null && results.length === 0 && (
                        <p className="text-sm text-[#6B7491] text-center py-4">
                            {searchMsg || 'Nenhum processo encontrado. Verifique o número e o tribunal.'}
                        </p>
                    )}

                    {results && results.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {results.map((c, i) => (
                                <div key={i} className="flex items-start justify-between gap-3 p-3 bg-[#0D0F14] rounded-xl border border-[#1E2330]">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#E8EAF0] truncate">{c.title}</p>
                                        <p className="text-xs text-[#6B7491] font-mono mt-0.5">{c.cnj_number}</p>
                                        {c.court && <p className="text-xs text-[#6B7491] mt-0.5">{c.court}</p>}
                                        {c.subject && <p className="text-xs text-[#6B7491] mt-0.5 truncate">{c.subject}</p>}
                                    </div>
                                    {imported[c.cnj_number] ? (
                                        <Link href={`/processos/${imported[c.cnj_number]}`}>
                                            <span className="flex items-center gap-1 text-xs text-[#2ECC8A] whitespace-nowrap">
                                                <CheckCircle size={13} /> Importado
                                            </span>
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => importCase(c)}
                                            disabled={importing === c.cnj_number}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                                bg-[#C9A84C]/15 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-colors whitespace-nowrap disabled:opacity-50">
                                            {importing === c.cnj_number
                                                ? <><Loader2 size={12} className="animate-spin" /> Importando...</>
                                                : <><Download size={12} /> Importar</>
                                            }
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>
        </AppLayout>
    );
}
