import { useState } from 'react';
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

export default function ClientsCreate({ lawyers }) {
    const { data, setData, post, processing, errors } = useForm({
        type: 'individual', name: '', email: '', phone: '',
        cpf: '', cnpj: '', company_name: '', trade_name: '',
        responsible_user_id: '',
        address_street: '', address_number: '', address_complement: '',
        address_neighborhood: '', address_city: '', address_state: '', address_zipcode: '',
        notes: '', origin: '',
    });

    async function fetchCNPJ() {
        if (!data.cnpj) return;
        const cnpj = data.cnpj.replace(/\D/g, '');
        if (cnpj.length !== 14) return;
        try {
            const r = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
            const json = await r.json();
            if (json.status !== 'ERROR') {
                setData(d => ({
                    ...d,
                    company_name: json.nome || d.company_name,
                    trade_name:   json.fantasia || d.trade_name,
                    email:        json.email || d.email,
                    phone:        json.telefone || d.phone,
                    address_street:       json.logradouro || d.address_street,
                    address_number:       json.numero || d.address_number,
                    address_complement:   json.complemento || d.address_complement,
                    address_neighborhood: json.bairro || d.address_neighborhood,
                    address_city:         json.municipio || d.address_city,
                    address_state:        json.uf || d.address_state,
                    address_zipcode:      json.cep?.replace(/\D/g, '') || d.address_zipcode,
                }));
            }
        } catch {}
    }

    async function fetchCEP() {
        if (!data.address_zipcode) return;
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
        post(route('clients.store'));
    }

    return (
        <AppLayout title="Novo Cliente">
            <Head title="Novo Cliente — LexFlow" />

            <div className="mb-6">
                <Link href="/clientes" className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0]">
                    <ChevronLeft size={16} /> Voltar
                </Link>
                <h1 className="text-xl font-bold text-[#E8EAF0] mt-2">Novo Cliente</h1>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Type toggle */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Tipo de Cliente</h3>
                            <div className="flex gap-3">
                                {[['individual','Pessoa Física'],['company','Pessoa Jurídica']].map(([v,l]) => (
                                    <button key={v} type="button"
                                        onClick={() => setData('type', v)}
                                        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all
                                            ${data.type === v
                                                ? 'border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C]'
                                                : 'border-[#1E2330] text-[#6B7491] hover:border-[#6B7491]'
                                            }`}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Personal info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">
                                {data.type === 'company' ? 'Dados da Empresa' : 'Dados Pessoais'}
                            </h3>
                            <div className="space-y-4">
                                {data.type === 'company' ? (
                                    <>
                                        <div className="flex gap-3">
                                            <div className="flex-1">
                                                <Field label="CNPJ" error={errors.cnpj}>
                                                    <FInput value={data.cnpj} onChange={e => setData('cnpj', e.target.value)}
                                                        placeholder="00.000.000/0001-00" onBlur={fetchCNPJ} />
                                                </Field>
                                            </div>
                                            <div className="flex items-end pb-0.5">
                                                <button type="button" onClick={fetchCNPJ}
                                                    className="px-3 py-2.5 bg-[#C9A84C]/15 text-[#C9A84C] text-xs rounded-lg hover:bg-[#C9A84C]/25 transition-colors whitespace-nowrap">
                                                    Buscar CNPJ
                                                </button>
                                            </div>
                                        </div>
                                        <Field label="Razão Social" error={errors.company_name} required>
                                            <FInput value={data.company_name} onChange={e => setData('company_name', e.target.value)}
                                                placeholder="Empresa LTDA" />
                                        </Field>
                                        <Field label="Nome Fantasia">
                                            <FInput value={data.trade_name} onChange={e => setData('trade_name', e.target.value)}
                                                placeholder="Nome Fantasia" />
                                        </Field>
                                    </>
                                ) : (
                                    <>
                                        <Field label="Nome Completo" error={errors.name} required>
                                            <FInput value={data.name} onChange={e => setData('name', e.target.value)}
                                                placeholder="João da Silva" />
                                        </Field>
                                        <Field label="CPF" error={errors.cpf}>
                                            <FInput value={data.cpf} onChange={e => setData('cpf', e.target.value)}
                                                placeholder="000.000.000-00" />
                                        </Field>
                                    </>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="E-mail">
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
                                <Field label="Advogado Responsável">
                                    <FSelect value={data.responsible_user_id} onChange={e => setData('responsible_user_id', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        {(lawyers ?? []).map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </FSelect>
                                </Field>
                                <Field label="Origem">
                                    <FSelect value={data.origin} onChange={e => setData('origin', e.target.value)}>
                                        <option value="">Selecione...</option>
                                        <option value="indication">Indicação</option>
                                        <option value="website">Site</option>
                                        <option value="social">Redes Sociais</option>
                                        <option value="direct">Contato Direto</option>
                                        <option value="other">Outro</option>
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
                                {processing ? 'Salvando...' : 'Cadastrar Cliente'}
                            </Button>
                            <Link href="/clientes">
                                <Button variant="secondary" size="lg" className="w-full justify-center">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
