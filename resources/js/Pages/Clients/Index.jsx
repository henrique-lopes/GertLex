import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import EmptyState from '@/Components/UI/EmptyState';
import { Plus, Search, Users, ChevronLeft, ChevronRight, Building2, User } from 'lucide-react';

export default function ClientsIndex({ clients, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [type, setType]     = useState(filters?.type ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    function applyFilters(overrides = {}) {
        router.get('/clientes', {
            search: overrides.search ?? search,
            type:   overrides.type   ?? type,
            status: overrides.status ?? status,
        }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Clientes">
            <Head title="Clientes — LexFlow" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0]">Clientes</h1>
                    <p className="text-sm text-[#6B7491] mt-0.5">{clients?.total ?? 0} clientes cadastrados</p>
                </div>
                <Link href="/clientes/novo">
                    <Button><Plus size={16} /> Novo Cliente</Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-4 mb-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-48 flex items-center gap-2 bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2">
                    <Search size={14} className="text-[#6B7491] shrink-0" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        placeholder="Buscar por nome, CPF, CNPJ..."
                        className="flex-1 bg-transparent text-sm text-[#E8EAF0] placeholder-[#6B7491] outline-none"
                    />
                </div>
                <select value={type} onChange={e => { setType(e.target.value); applyFilters({ type: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todos os tipos</option>
                    <option value="individual">Pessoa Física</option>
                    <option value="company">Pessoa Jurídica</option>
                </select>
                <select value={status} onChange={e => { setStatus(e.target.value); applyFilters({ status: e.target.value }); }}
                    className="bg-[#0D0F14] border border-[#1E2330] rounded-lg px-3 py-2 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                    <option value="">Todos os status</option>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                {(clients?.data ?? []).length === 0 ? (
                    <EmptyState icon={Users} title="Nenhum cliente encontrado"
                        description="Cadastre o primeiro cliente do escritório."
                        action={<Link href="/clientes/novo"><Button>Novo Cliente</Button></Link>} />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#1A1E29]">
                                        {['Cliente','Tipo','Documento','E-mail','Processos','Status'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1E2330]">
                                    {clients.data.map(client => (
                                        <tr key={client.id} className="hover:bg-[#1A1E29]/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <Link href={`/clientes/${client.uuid}`}
                                                    className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#1A1E29] flex items-center justify-center shrink-0">
                                                        {client.type === 'company'
                                                            ? <Building2 size={14} className="text-[#6B7491]" />
                                                            : <User size={14} className="text-[#6B7491]" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#E8EAF0] hover:text-[#C9A84C] transition-colors">
                                                            {client.company_name || client.name}
                                                        </p>
                                                        {client.type === 'company' && client.trade_name && (
                                                            <p className="text-xs text-[#6B7491]">{client.trade_name}</p>
                                                        )}
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge value={client.type} />
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491] font-mono text-xs">
                                                {client.cpf || client.cnpj || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491]">
                                                {client.email || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#6B7491]">
                                                {client.cases_count ?? 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge value={client.status} label={client.status === 'active' ? 'Ativo' : 'Inativo'} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {clients.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2330]">
                                <p className="text-xs text-[#6B7491]">Mostrando {clients.from}–{clients.to} de {clients.total}</p>
                                <div className="flex items-center gap-2">
                                    {clients.prev_page_url && (
                                        <Link href={clients.prev_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]">
                                            <ChevronLeft size={16} />
                                        </Link>
                                    )}
                                    <span className="text-xs text-[#6B7491]">{clients.current_page} / {clients.last_page}</span>
                                    {clients.next_page_url && (
                                        <Link href={clients.next_page_url} className="p-1.5 rounded-lg bg-[#1A1E29] text-[#6B7491] hover:text-[#E8EAF0]">
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
