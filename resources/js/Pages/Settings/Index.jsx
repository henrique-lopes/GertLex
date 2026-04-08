import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { Building2, CreditCard, Bell, Zap, UserCircle } from 'lucide-react';

const planInfo = {
    trial:   { label: 'Trial',   color: 'text-yellow-400', desc: '14 dias grátis' },
    starter: { label: 'Starter', color: 'text-[#4A7CFF]',  desc: '3 advogados · 50 processos' },
    pro:     { label: 'Pro',     color: 'text-[#C9A84C]',  desc: '10 advogados · 500 processos' },
    premium: { label: 'Premium', color: 'text-[#2ECC8A]',  desc: 'Ilimitado + IA + White Label' },
};

function FInput({ label, error, ...props }) {
    return (
        <div>
            {label && <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">{label}</label>}
            <input className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0]
                focus:outline-none focus:border-[#C9A84C] transition-colors placeholder-[#6B7491]" {...props} />
            {error && <p className="text-xs text-[#E05555] mt-1">{error}</p>}
        </div>
    );
}

function ProfileForm({ user }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:             user?.name ?? '',
        email:            user?.email ?? '',
        current_password: '',
        password:         '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('settings.profile.update'));
    }

    return (
        <form onSubmit={submit}>
            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6 space-y-5">
                <h2 className="text-base font-semibold text-[#E8EAF0]">Meu Perfil</h2>

                {recentlySuccessful && (
                    <div className="px-4 py-3 rounded-lg bg-[#2ECC8A]/10 text-[#2ECC8A] text-sm border border-[#2ECC8A]/20">
                        Perfil atualizado com sucesso!
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FInput label="Nome *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} />
                    <FInput label="E-mail *" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} />
                </div>

                <hr className="border-[#1E2330]" />
                <h3 className="text-sm font-semibold text-[#E8EAF0]">Alterar Senha</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FInput label="Senha Atual" type="password" value={data.current_password} onChange={e => setData('current_password', e.target.value)} error={errors.current_password} placeholder="••••••••" />
                    <FInput label="Nova Senha" type="password" value={data.password} onChange={e => setData('password', e.target.value)} error={errors.password} placeholder="••••••••" />
                    <FInput label="Confirmar Nova Senha" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} placeholder="••••••••" />
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Salvando...' : 'Salvar Perfil'}
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default function SettingsIndex({ workspace }) {
    const { auth } = usePage().props;
    const isSuperAdmin = auth?.isSuperAdmin && !workspace;

    const tabs = [
        ...(!isSuperAdmin ? [
            { id: 'workspace',     label: 'Escritório',    icon: Building2 },
            { id: 'plan',          label: 'Plano',          icon: CreditCard },
            { id: 'notifications', label: 'Notificações',   icon: Bell },
            { id: 'integrations',  label: 'Integrações',    icon: Zap },
        ] : []),
        { id: 'profile', label: 'Meu Perfil', icon: UserCircle },
    ];

    const [tab, setTab] = useState(isSuperAdmin ? 'profile' : 'workspace');

    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        name:            workspace?.name ?? '',
        email:           workspace?.email ?? '',
        phone:           workspace?.phone ?? '',
        cnpj:            workspace?.cnpj ?? '',
        oab_seccional:   workspace?.oab_seccional ?? '',
        oab_number:      workspace?.oab_number ?? '',
        address_street:  workspace?.address_street ?? '',
        address_number:  workspace?.address_number ?? '',
        address_city:    workspace?.address_city ?? '',
        address_state:   workspace?.address_state ?? '',
        address_zipcode: workspace?.address_zipcode ?? '',
        timezone:        workspace?.timezone ?? 'America/Sao_Paulo',
    });

    function submit(e) {
        e.preventDefault();
        put(route('settings.workspace.update'));
    }

    const plan = planInfo[workspace?.plan] ?? planInfo.trial;

    return (
        <AppLayout title="Configurações">
            <Head title="Configurações — GertLex" />

            <h1 className="text-xl font-bold text-[#E8EAF0] mb-6">Configurações</h1>

            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Tab nav */}
                <nav className="lg:w-48 shrink-0">
                    <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-2 space-y-1">
                        {tabs.map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${tab === t.id
                                        ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                                        : 'text-[#6B7491] hover:text-[#E8EAF0] hover:bg-[#1A1E29]'
                                    }`}>
                                <t.icon size={16} />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="flex-1">
                    {/* Workspace */}
                    {tab === 'workspace' && (
                        <form onSubmit={submit}>
                            <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6 space-y-5">
                                <h2 className="text-base font-semibold text-[#E8EAF0]">Dados do Escritório</h2>

                                {recentlySuccessful && (
                                    <div className="px-4 py-3 rounded-lg bg-[#2ECC8A]/10 text-[#2ECC8A] text-sm border border-[#2ECC8A]/20">
                                        Configurações salvas com sucesso!
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FInput label="Nome do Escritório *" value={data.name} onChange={e => setData('name', e.target.value)} error={errors.name} />
                                    <FInput label="E-mail *" type="email" value={data.email} onChange={e => setData('email', e.target.value)} error={errors.email} />
                                    <FInput label="Telefone" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="(11) 3000-0000" />
                                    <FInput label="CNPJ" value={data.cnpj} onChange={e => setData('cnpj', e.target.value)} placeholder="00.000.000/0001-00" />
                                    <FInput label="OAB Seccional" value={data.oab_seccional} onChange={e => setData('oab_seccional', e.target.value)} placeholder="SP" />
                                    <FInput label="OAB Número" value={data.oab_number} onChange={e => setData('oab_number', e.target.value)} />
                                </div>

                                <hr className="border-[#1E2330]" />

                                <h3 className="text-sm font-semibold text-[#E8EAF0]">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <FInput label="Logradouro" value={data.address_street} onChange={e => setData('address_street', e.target.value)} />
                                    </div>
                                    <FInput label="Número" value={data.address_number} onChange={e => setData('address_number', e.target.value)} />
                                    <div className="md:col-span-2">
                                        <FInput label="Cidade" value={data.address_city} onChange={e => setData('address_city', e.target.value)} />
                                    </div>
                                    <FInput label="Estado" value={data.address_state} onChange={e => setData('address_state', e.target.value)} maxLength={2} />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Salvando...' : 'Salvar Configurações'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Plan */}
                    {tab === 'plan' && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h2 className="text-base font-semibold text-[#E8EAF0] mb-6">Plano Atual</h2>

                            <div className="flex items-center gap-4 p-4 bg-[#0D0F14] rounded-xl border border-[#1E2330] mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#C9A84C]/10 flex items-center justify-center">
                                    <CreditCard size={20} className="text-[#C9A84C]" />
                                </div>
                                <div>
                                    <p className={`text-lg font-bold ${plan.color}`}>{plan.label}</p>
                                    <p className="text-sm text-[#6B7491]">{plan.desc}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {[
                                    ['Advogados', `${workspace?.max_lawyers === -1 ? '∞' : workspace?.max_lawyers ?? 3}`],
                                    ['Processos', `${workspace?.max_cases === -1 ? '∞' : workspace?.max_cases ?? 50}`],
                                    ['IA Jurídica', workspace?.has_ai ? '✓ Incluído' : '✗ Não incluído'],
                                    ['Portal do Cliente', workspace?.has_client_portal ? '✓ Incluído' : '✗ Não incluído'],
                                ].map(([label, value]) => (
                                    <div key={label} className="p-3 bg-[#0D0F14] rounded-xl border border-[#1E2330]">
                                        <p className="text-xs text-[#6B7491] mb-1">{label}</p>
                                        <p className="text-sm font-semibold text-[#E8EAF0]">{value}</p>
                                    </div>
                                ))}
                            </div>

                            <p className="text-sm text-[#6B7491]">
                                Para fazer upgrade do plano, entre em contato com nossa equipe de vendas.
                            </p>
                        </div>
                    )}

                    {/* Notifications */}
                    {tab === 'notifications' && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h2 className="text-base font-semibold text-[#E8EAF0] mb-6">Preferências de Notificação</h2>
                            <div className="space-y-4">
                                {[
                                    ['Alertas de prazo 1 dia antes', true],
                                    ['Alertas de prazo 5 dias antes', true],
                                    ['E-mail para novos processos', false],
                                    ['E-mail para pagamentos recebidos', true],
                                    ['E-mail para novos clientes', false],
                                ].map(([label, defaultVal]) => (
                                    <div key={label} className="flex items-center justify-between py-3 border-b border-[#1E2330]">
                                        <span className="text-sm text-[#E8EAF0]">{label}</span>
                                        <div className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer
                                            ${defaultVal ? 'bg-[#C9A84C]' : 'bg-[#1E2330]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform
                                                ${defaultVal ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Profile */}
                    {tab === 'profile' && (
                        <ProfileForm user={auth?.user} />
                    )}

                    {/* Integrations */}
                    {tab === 'integrations' && (
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h2 className="text-base font-semibold text-[#E8EAF0] mb-6">Integrações</h2>
                            <div className="space-y-4">
                                {[
                                    { name: 'DataJud CNJ', key: 'DATAJUD_API_KEY', desc: 'Busca automática de processos no CNJ' },
                                    { name: 'Anthropic (IA)', key: 'ANTHROPIC_API_KEY', desc: 'Assistente jurídico com IA generativa' },
                                    { name: 'Asaas', key: 'ASAAS_API_KEY', desc: 'Cobrança automática via boleto e PIX' },
                                ].map(integration => (
                                    <div key={integration.name} className="p-4 bg-[#0D0F14] rounded-xl border border-[#1E2330]">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-[#E8EAF0]">{integration.name}</p>
                                                <p className="text-xs text-[#6B7491]">{integration.desc}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="password"
                                            placeholder={`Chave de API — ${integration.key}`}
                                            className="w-full bg-[#13161E] border border-[#1E2330] rounded-lg px-4 py-2 text-sm
                                                text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C] placeholder-[#6B7491]"
                                        />
                                    </div>
                                ))}
                                <p className="text-xs text-[#6B7491]">
                                    As chaves de API são configuradas no arquivo <code className="text-[#C9A84C]">.env</code> do servidor.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
