import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Badge from '@/Components/UI/Badge';
import Button from '@/Components/UI/Button';
import { ChevronLeft, Edit, Trash2, Briefcase, DollarSign, Mail, Phone, MapPin } from 'lucide-react';

function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v ?? 0);
}
function formatDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

const areaLabels = {
    trabalhista:'Trabalhista',civil:'Cível',empresarial:'Empresarial',
    familia:'Família',tributario:'Tributário',criminal:'Criminal',
};

export default function ClientsShow({ client }) {
    function deleteClient() {
        if (confirm('Remover este cliente?')) {
            router.delete(`/clientes/${client.uuid}`);
        }
    }

    if (!client) return null;

    return (
        <AppLayout title={client.company_name || client.name}>
            <Head title={`${client.company_name || client.name} — LexFlow`} />

            <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0] mb-4">
                <ChevronLeft size={16} /> Clientes
            </Link>

            {/* Header */}
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6 mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <Badge value={client.type} />
                            <Badge value={client.status} label={client.status === 'active' ? 'Ativo' : 'Inativo'} />
                        </div>
                        <h1 className="text-xl font-bold text-[#E8EAF0]">
                            {client.company_name || client.name}
                        </h1>
                        {client.type === 'company' && client.trade_name && (
                            <p className="text-sm text-[#6B7491]">{client.trade_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 flex-wrap">
                            {client.email && (
                                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-sm text-[#6B7491] hover:text-[#C9A84C]">
                                    <Mail size={13} /> {client.email}
                                </a>
                            )}
                            {client.phone && (
                                <span className="flex items-center gap-1.5 text-sm text-[#6B7491]">
                                    <Phone size={13} /> {client.phone}
                                </span>
                            )}
                            {client.address_city && (
                                <span className="flex items-center gap-1.5 text-sm text-[#6B7491]">
                                    <MapPin size={13} /> {client.address_city}/{client.address_state}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/clientes/${client.uuid}/editar`}>
                            <Button variant="secondary" size="sm"><Edit size={14} /> Editar</Button>
                        </Link>
                        <Button variant="danger" size="sm" onClick={deleteClient}><Trash2 size={14} /></Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Cases */}
                <div className="xl:col-span-2">
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330]">
                            <h3 className="text-sm font-semibold text-[#E8EAF0]">Processos</h3>
                            <span className="text-xs text-[#6B7491]">{client.cases?.length ?? 0} processos</span>
                        </div>
                        <div className="divide-y divide-[#1E2330]">
                            {(client.cases ?? []).length === 0 && (
                                <p className="px-5 py-8 text-sm text-[#6B7491] text-center">Nenhum processo.</p>
                            )}
                            {(client.cases ?? []).map(c => (
                                <Link key={c.id} href={`/processos/${c.uuid}`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#1A1E29] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-[#E8EAF0]">{c.title}</p>
                                        <p className="text-xs text-[#6B7491] mt-0.5">
                                            {areaLabels[c.area] ?? c.area}
                                            {c.phase && ` · ${c.phase}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {c.case_value && (
                                            <span className="text-xs text-[#6B7491]">{formatCurrency(c.case_value)}</span>
                                        )}
                                        <Badge value={c.status} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info sidebar */}
                <div className="space-y-4">
                    {/* Document info */}
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                        <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">Documentos</h3>
                        <div className="space-y-2">
                            {client.cpf && (
                                <div>
                                    <p className="text-xs text-[#6B7491]">CPF</p>
                                    <p className="text-sm text-[#E8EAF0] font-mono">{client.cpf}</p>
                                </div>
                            )}
                            {client.cnpj && (
                                <div>
                                    <p className="text-xs text-[#6B7491]">CNPJ</p>
                                    <p className="text-sm text-[#E8EAF0] font-mono">{client.cnpj}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-[#6B7491]">Cliente desde</p>
                                <p className="text-sm text-[#E8EAF0]">{formatDate(client.client_since)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {(client.address_street || client.address_city) && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                            <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">Endereço</h3>
                            <p className="text-sm text-[#E8EAF0]">
                                {[
                                    client.address_street && `${client.address_street}${client.address_number ? ', ' + client.address_number : ''}`,
                                    client.address_neighborhood,
                                    client.address_city && `${client.address_city}/${client.address_state}`,
                                    client.address_zipcode,
                                ].filter(Boolean).join(' · ')}
                            </p>
                        </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
                            <h3 className="text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-3">Observações</h3>
                            <p className="text-sm text-[#E8EAF0] leading-relaxed">{client.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
