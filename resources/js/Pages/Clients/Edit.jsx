import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { ChevronLeft } from 'lucide-react';

function FInput({ ...props }) {
    return (
        <input className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] placeholder-[#6B7491] focus:outline-none focus:border-[#C9A84C] transition-colors"
            {...props} />
    );
}
function FSelect({ children, ...props }) {
    return (
        <select className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C] transition-colors" {...props}>
            {children}
        </select>
    );
}
function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                {label}{required && <span className="text-[#E05555] ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-[#E05555] mt-1">{error}</p>}
        </div>
    );
}

export default function ClientsEdit({ client, lawyers }) {
    const { data, setData, put, processing, errors } = useForm({
        name:                 client.name ?? '',
        email:                client.email ?? '',
        phone:                client.phone ?? '',
        cpf:                  client.cpf ?? '',
        cnpj:                 client.cnpj ?? '',
        company_name:         client.company_name ?? '',
        trade_name:           client.trade_name ?? '',
        responsible_user_id:  client.responsible_user_id ? String(client.responsible_user_id) : '',
        address_street:       client.address_street ?? '',
        address_number:       client.address_number ?? '',
        address_complement:   client.address_complement ?? '',
        address_neighborhood: client.address_neighborhood ?? '',
        address_city:         client.address_city ?? '',
        address_state:        client.address_state ?? '',
        address_zipcode:      client.address_zipcode ?? '',
        status:               client.status ?? 'active',
        notes:                client.notes ?? '',
    });

    async function fetchCEP() {
        const cep = data.address_zipcode.replace(/\D/g, '');
        if (cep.length !== 8) return;
        try {
            const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const json = await r.json();
            if (!json.erro) {
                setData(d => ({
                    ...d,
                    address_street:       json.logradouro || d.address_street,
                    address_neighborhood: json.bairro || d.address_neighborhood,
                    address_city:         json.localidade || d.address_city,
                    address_state:        json.uf || d.address_state,
                }));
            }
        } catch {}
    }

    function submit(e) {
        e.preventDefault();
        put(route('clients.update', client.uuid));
    }

    const isCompany = client.type === 'company';

    return (
        <AppLayout title="Editar Cliente">
            <Head title="Editar Cliente — GertLex" />

            <div className="mb-6">
                <Link href={`/clientes/${client.uuid}`} className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0]">
                    <ChevronLeft size={16} /> Voltar
                </Link>
                <h1 className="text-xl font-bold text-[#E8EAF0] mt-2">
                    Editar: {client.company_name || client.name}
                </h1>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal / company info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">
                                {isCompany ? 'Dados da Empresa' : 'Dados Pessoais'}
                            </h3>
                            <div className="space-y-4">
                                {isCompany ? (
                                    <>
                                        <Field label="CNPJ" error={errors.cnpj}>
                                            <FInput value={data.cnpj} onChange={e => setData('cnpj', e.target.value)}
                                                placeholder="00.000.000/0001-00" />
                                        </Field>
                                        <Field label="Razão Social" error={errors.company_name} required>
                                            <FInput value={data.company_name} onChange={e => setData('company_name', e.target.value)} />
                                        </Field>
                                        <Field label="Nome Fantasia">
                                            <FInput value={data.trade_name} onChange={e => setData('trade_name', e.target.value)} />
                                        </Field>
                                    </>
                                ) : (
                                    <>
                                        <Field label="Nome Completo" error={errors.name} required>
                                            <FInput value={data.name} onChange={e => setData('name', e.target.value)} />
                                        </Field>
                                        <Field label="CPF" error={errors.cpf}>
                                            <FInput value={data.cpf} onChange={e => setData('cpf', e.target.value)}
                                                placeholder="000.000.000-00" />
                                        </Field>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="E-mail" error={errors.email}>
                                        <FInput type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                            placeholder="email@exemplo.com" />
                                    </Field>
                                    <Field label="Telefone">
                                        <FInput value={data.phone} onChange={e => setData('phone', e.target.value)}
                                            placeholder="(11) 99999-0000" />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Endereço</h3>
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <Field label="CEP">
                                            <FInput value={data.address_zipcode} onChange={e => setData('address_zipcode', e.target.value)}
                                                placeholder="00000-000" onBlur={fetchCEP} />
                                        </Field>
                                    </div>
                                    <div className="flex items-end pb-0.5">
                                        <button type="button" onClick={fetchCEP}
                                            className="px-3 py-2.5 bg-[#C9A84C]/15 text-[#C9A84C] text-xs rounded-lg hover:bg-[#C9A84C]/25 transition-colors">
                                            Buscar CEP
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="col-span-3">
                                        <Field label="Logradouro">
                                            <FInput value={data.address_street} onChange={e => setData('address_street', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Número">
                                        <FInput value={data.address_number} onChange={e => setData('address_number', e.target.value)} />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Bairro">
                                        <FInput value={data.address_neighborhood} onChange={e => setData('address_neighborhood', e.target.value)} />
                                    </Field>
                                    <Field label="Cidade">
                                        <FInput value={data.address_city} onChange={e => setData('address_city', e.target.value)} />
                                    </Field>
                                    <Field label="Estado">
                                        <FInput value={data.address_state} onChange={e => setData('address_state', e.target.value)} maxLength={2} />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Configurações</h3>
                            <div className="space-y-4">
                                <Field label="Status">
                                    <FSelect value={data.status} onChange={e => setData('status', e.target.value)}>
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="suspended">Suspenso</option>
                                    </FSelect>
                                </Field>
                                <Field label="Advogado Responsável">
                                    <FSelect value={data.responsible_user_id} onChange={e => setData('responsible_user_id', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {(lawyers ?? []).map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </FSelect>
                                </Field>
                            </div>
                        </div>

                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Observações</h3>
                            <textarea value={data.notes} onChange={e => setData('notes', e.target.value)} rows={4}
                                placeholder="Notas sobre o cliente..."
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491] focus:outline-none focus:border-[#C9A84C] resize-none" />
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={processing} size="lg" className="w-full justify-center">
                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            <Link href={`/clientes/${client.uuid}`}>
                                <Button variant="secondary" size="lg" className="w-full justify-center">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
