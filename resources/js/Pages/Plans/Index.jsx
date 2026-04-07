import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Check, X, Sparkles, AlertTriangle, Clock, MessageCircle, Zap } from 'lucide-react';

const PLAN_ORDER = ['starter', 'pro', 'premium'];

const PLAN_STYLE = {
    trial:   { color: '#6B7491', gradient: 'from-[#6B7491]/20 to-[#6B7491]/5',  badge: 'bg-[#6B7491]/15 text-[#6B7491]' },
    starter: { color: '#4A7CFF', gradient: 'from-[#4A7CFF]/20 to-[#4A7CFF]/5',  badge: 'bg-[#4A7CFF]/15 text-[#4A7CFF]' },
    pro:     { color: '#C9A84C', gradient: 'from-[#C9A84C]/20 to-[#C9A84C]/5',  badge: 'bg-[#C9A84C]/15 text-[#C9A84C]', popular: true },
    premium: { color: '#2ECC8A', gradient: 'from-[#2ECC8A]/20 to-[#2ECC8A]/5',  badge: 'bg-[#2ECC8A]/15 text-[#2ECC8A]' },
};

const FEATURES = [
    { key: 'lawyers',    label: 'Advogados',          getValue: p => p.max_lawyers === -1 ? 'Ilimitado' : `Até ${p.max_lawyers}` },
    { key: 'cases',      label: 'Processos ativos',   getValue: p => p.max_cases   === -1 ? 'Ilimitado' : `Até ${p.max_cases}` },
    { key: 'documents',  label: 'Documentos',         getValue: () => 'Ilimitado' },
    { key: 'finance',    label: 'Financeiro',         getValue: () => true },
    { key: 'calendar',   label: 'Agenda',             getValue: () => true },
    { key: 'ai',         label: 'IA Jurídica',        getValue: p => p.has_ai },
    { key: 'portal',     label: 'Portal do cliente',  getValue: p => p.has_client_portal },
    { key: 'whitelabel', label: 'White Label',        getValue: p => p.has_white_label },
    { key: 'support',    label: 'Suporte',            getValue: (_, key) => ({ trial: 'E-mail', starter: 'E-mail + Chat', pro: 'Prioritário', premium: 'Dedicado' })[key] },
];

function FeatureValue({ value }) {
    if (value === true)  return <Check size={16} className="text-[#2ECC8A] mx-auto" />;
    if (value === false) return <X     size={16} className="text-[#6B7491]/40 mx-auto" />;
    return <span className="text-xs text-[#E8EAF0]">{value}</span>;
}

function PlanCard({ planKey, plan, isCurrent, onUpgrade, processing }) {
    const style   = PLAN_STYLE[planKey];
    const isFree  = plan.price === 0;

    return (
        <div className={`relative flex flex-col rounded-2xl border transition-all
            ${isCurrent
                ? `border-[${style.color}] bg-gradient-to-b ${style.gradient}`
                : 'border-[#1E2330] bg-[#13161E] hover:border-[#2a3040]'
            }
            ${style.popular ? 'ring-1 ring-[#C9A84C]/40' : ''}
        `}>
            {style.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-[#C9A84C] text-black text-xs font-bold px-3 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={11} /> Mais popular
                    </span>
                </div>
            )}

            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.badge}`}>
                        {plan.label}
                    </span>
                    {isCurrent && (
                        <span className="text-xs text-[#6B7491] bg-[#1A1E29] px-2 py-0.5 rounded-full">
                            Plano atual
                        </span>
                    )}
                </div>

                <div className="mb-6">
                    {isFree ? (
                        <div>
                            <span className="text-3xl font-black text-[#E8EAF0]">Grátis</span>
                            <p className="text-xs text-[#6B7491] mt-1">por {plan.trial_days} dias · sem cartão</p>
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm text-[#6B7491]">R$</span>
                                <span className="text-3xl font-black text-[#E8EAF0]">{plan.price.toLocaleString('pt-BR')}</span>
                                <span className="text-sm text-[#6B7491]">/mês</span>
                            </div>
                            <p className="text-xs text-[#6B7491] mt-1">por escritório · cobrado mensalmente</p>
                        </div>
                    )}
                </div>

                {!isCurrent && !isFree && (
                    <button
                        onClick={() => onUpgrade(planKey)}
                        disabled={processing}
                        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                            ${style.popular
                                ? 'bg-[#C9A84C] hover:bg-[#D4B558] text-black'
                                : 'bg-[#1A1E29] hover:bg-[#222840] text-[#E8EAF0] border border-[#2a3040]'
                            }`}
                    >
                        {processing ? 'Aguarde...' : 'Assinar agora →'}
                    </button>
                )}

                {isCurrent && !isFree && (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center
                        border border-[#1E2330] text-[#6B7491] cursor-default">
                        Plano ativo
                    </div>
                )}
            </div>

            <div className="border-t border-[#1E2330] px-6 py-4 flex-1">
                <p className="text-xs font-semibold text-[#6B7491] uppercase tracking-wider mb-3">Incluso</p>
                <ul className="space-y-2.5">
                    {FEATURES.filter(f => ['lawyers','cases','ai','portal','support'].includes(f.key)).map(f => {
                        const val = f.getValue(plan, planKey);
                        if (val === false) return null;
                        return (
                            <li key={f.key} className="flex items-center gap-2 text-sm text-[#E8EAF0]">
                                <Check size={14} style={{ color: style.color }} className="shrink-0" />
                                <span>
                                    {f.label}
                                    {typeof val === 'string' && val !== 'true' && (
                                        <span className="text-[#6B7491]"> — {val}</span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

export default function PlansIndex({ workspace, plans, trialDays, blockReason }) {
    const { data, post, processing } = useForm({ plan: '' });

    function handleUpgrade(planKey) {
        post(route('plans.upgrade'), { data: { plan: planKey } });
    }

    const currentPlan = workspace?.plan ?? 'trial';
    const isTrialing  = workspace?.plan_status === 'trialing';
    const isBlocked   = workspace?.plan_status === 'canceled' || workspace?.plan_status === 'blocked';

    return (
        <AppLayout title="Planos">
            <Head title="Planos — LexFlow" />

            <div className="max-w-6xl mx-auto">

                {/* Block / expiry alert */}
                {(blockReason || isBlocked) && (
                    <div className="mb-6 flex items-start gap-3 px-5 py-4 rounded-xl
                        bg-[#E05555]/10 border border-[#E05555]/30 text-[#E05555]">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <p className="text-sm">{blockReason ?? 'Seu acesso foi suspenso. Escolha um plano para continuar.'}</p>
                    </div>
                )}

                {/* Trial countdown */}
                {isTrialing && !blockReason && (
                    <div className="mb-6 flex items-center justify-between px-5 py-4 rounded-xl
                        bg-[#4A7CFF]/10 border border-[#4A7CFF]/25">
                        <div className="flex items-center gap-3 text-[#4A7CFF]">
                            <Clock size={18} />
                            <span className="text-sm font-medium">
                                {trialDays > 0
                                    ? `Você está no período de trial — ${trialDays} dia${trialDays !== 1 ? 's' : ''} restante${trialDays !== 1 ? 's' : ''}.`
                                    : 'Seu período de trial termina hoje.'
                                }
                            </span>
                        </div>
                        <span className="text-xs text-[#6B7491]">Assine para não perder seus dados</span>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-2xl font-black text-[#E8EAF0] mb-2">
                        Escolha o plano ideal para o seu escritório
                    </h1>
                    <p className="text-[#6B7491] text-sm">
                        Todos os planos incluem onboarding gratuito e migração de dados assistida.
                    </p>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {PLAN_ORDER.map(key => (
                        <PlanCard
                            key={key}
                            planKey={key}
                            plan={plans[key]}
                            isCurrent={currentPlan === key && !isTrialing}
                            onUpgrade={handleUpgrade}
                            processing={processing}
                        />
                    ))}
                </div>

                {/* Comparison table */}
                <div className="bg-[#13161E] border border-[#1E2330] rounded-2xl overflow-hidden mb-10">
                    <div className="px-6 py-4 border-b border-[#1E2330]">
                        <h2 className="text-base font-semibold text-[#E8EAF0]">Comparativo completo</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[#1E2330]">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-[#6B7491] uppercase tracking-wider w-1/3">
                                        Recurso
                                    </th>
                                    {['trial', ...PLAN_ORDER].map(key => (
                                        <th key={key} className="px-4 py-3 text-center">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_STYLE[key].badge}`}>
                                                {plans[key]?.label}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {FEATURES.map((f, i) => (
                                    <tr key={f.key} className={`border-b border-[#1E2330] ${i % 2 === 0 ? '' : 'bg-[#0D0F14]/40'}`}>
                                        <td className="px-6 py-3 text-sm text-[#E8EAF0]">{f.label}</td>
                                        {['trial', ...PLAN_ORDER].map(key => (
                                            <td key={key} className="px-4 py-3 text-center">
                                                <FeatureValue value={f.getValue(plans[key], key)} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4
                    bg-gradient-to-r from-[#C9A84C]/10 to-[#4A7CFF]/10
                    border border-[#C9A84C]/20 rounded-2xl px-6 py-5">
                    <div>
                        <p className="text-sm font-semibold text-[#E8EAF0] mb-0.5">Precisa de um plano personalizado?</p>
                        <p className="text-xs text-[#6B7491]">
                            Para escritórios com mais de 20 advogados ou necessidades especiais, entre em contato.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/5511999999999?text=Olá!%20Tenho%20interesse%20no%20LexFlow%20Enterprise."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                            bg-[#25D366] hover:bg-[#20BD5A] text-white transition-colors shrink-0"
                    >
                        <MessageCircle size={16} /> Falar no WhatsApp
                    </a>
                </div>

                <p className="text-center text-xs text-[#6B7491] mt-6">
                    Pagamento via PIX ou boleto bancário · Cancelamento a qualquer momento · Dados preservados por 30 dias após cancelamento
                </p>
            </div>
        </AppLayout>
    );
}
