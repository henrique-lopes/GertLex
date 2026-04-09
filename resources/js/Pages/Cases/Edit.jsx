import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { ChevronLeft } from 'lucide-react';

const areas = [
    ['trabalhista','Trabalhista'],['civil','Cível'],['empresarial','Empresarial'],
    ['familia','Família'],['tributario','Tributário'],['criminal','Criminal'],
    ['previdenciario','Previdenciário'],['administrativo','Administrativo'],
];
const feeTypes = [
    ['fixed','Honorário Fixo'],['success','Êxito'],['mixed','Misto (Fixo + Êxito)'],
    ['hourly','Por Hora'],['pro_bono','Pro Bono'],
];
const sides = [['author','Autor'],['defendant','Réu'],['third_party','Terceiro']];
const statuses = [
    ['active','Ativo'],['waiting','Aguardando'],['urgent','Urgente'],
    ['closed_won','Encerrado (Ganho)'],['closed_lost','Encerrado (Perdido)'],
];

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
function FInput({ ...props }) {
    return (
        <input className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
            text-sm text-[#E8EAF0] placeholder-[#6B7491]
            focus:outline-none focus:border-[#C9A84C] transition-colors" {...props} />
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

export default function CasesEdit({ legalCase, clients, lawyers }) {
    const { data, setData, put, processing, errors } = useForm({
        title:               legalCase.title ?? '',
        client_id:           legalCase.client_id ? String(legalCase.client_id) : '',
        responsible_user_id: legalCase.responsible_user_id ? String(legalCase.responsible_user_id) : '',
        area:                legalCase.area ?? '',
        cnj_number:          legalCase.cnj_number ?? '',
        court:               legalCase.court ?? '',
        court_city:          legalCase.court_city ?? '',
        court_state:         legalCase.court_state ?? '',
        tribunal:            legalCase.tribunal ?? '',
        status:              legalCase.status ?? 'active',
        phase:               legalCase.phase ?? '',
        side:                legalCase.side ?? 'author',
        fee_type:            legalCase.fee_type ?? 'fixed',
        fee_amount:          legalCase.fee_amount ?? '',
        fee_success_pct:     legalCase.fee_success_pct ?? '',
        case_value:          legalCase.case_value ?? '',
        filed_at:            legalCase.filed_at ?? '',
        next_deadline:       legalCase.next_deadline ?? '',
        notes:               legalCase.notes ?? '',
    });

    function submit(e) {
        e.preventDefault();
        put(route('cases.update', legalCase.uuid));
    }

    return (
        <AppLayout title="Editar Processo">
            <Head title="Editar Processo — GertLex" />

            <div className="mb-6">
                <Link href={`/processos/${legalCase.uuid}`} className="inline-flex items-center gap-1 text-sm text-[#6B7491] hover:text-[#E8EAF0]">
                    <ChevronLeft size={16} /> Voltar
                </Link>
                <h1 className="text-xl font-bold text-[#E8EAF0] mt-2">Editar Processo</h1>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Informações Básicas</h3>
                            <div className="space-y-4">
                                <Field label="Título do Processo" error={errors.title} required>
                                    <FInput value={data.title} onChange={e => setData('title', e.target.value)}
                                        placeholder="Ex: Ação Trabalhista — Horas Extras" />
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Cliente" error={errors.client_id} required>
                                        <FSelect value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {(clients ?? []).map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.company_name || c.name}
                                                </option>
                                            ))}
                                        </FSelect>
                                    </Field>

                                    <Field label="Advogado Responsável" error={errors.responsible_user_id} required>
                                        <FSelect value={data.responsible_user_id} onChange={e => setData('responsible_user_id', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {(lawyers ?? []).map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </FSelect>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Field label="Área" error={errors.area} required>
                                        <FSelect value={data.area} onChange={e => setData('area', e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {areas.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>

                                    <Field label="Status">
                                        <FSelect value={data.status} onChange={e => setData('status', e.target.value)}>
                                            {statuses.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>

                                    <Field label="Polo">
                                        <FSelect value={data.side} onChange={e => setData('side', e.target.value)}>
                                            {sides.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                        </FSelect>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Nº CNJ">
                                        <FInput value={data.cnj_number}
                                            onChange={e => setData('cnj_number', e.target.value)}
                                            placeholder="0000000-00.0000.0.00.0000" />
                                    </Field>
                                    <Field label="Fase Processual">
                                        <FInput value={data.phase}
                                            onChange={e => setData('phase', e.target.value)}
                                            placeholder="Ex: Instrução, Recurso..." />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Court info */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Dados do Tribunal</h3>
                            <div className="space-y-4">
                                <Field label="Vara / Juízo">
                                    <FInput value={data.court} onChange={e => setData('court', e.target.value)}
                                        placeholder="Ex: 2ª Vara do Trabalho" />
                                </Field>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <Field label="Cidade">
                                            <FInput value={data.court_city} onChange={e => setData('court_city', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Estado">
                                        <FInput value={data.court_state} onChange={e => setData('court_state', e.target.value)}
                                            placeholder="SP" maxLength={2} />
                                    </Field>
                                </div>
                                <Field label="Tribunal">
                                    <FInput value={data.tribunal} onChange={e => setData('tribunal', e.target.value)}
                                        placeholder="TJSP, TRT2, STJ..." />
                                </Field>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Observações</h3>
                            <textarea
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                rows={4}
                                placeholder="Notas internas sobre o processo..."
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors resize-none"
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Datas</h3>
                            <div className="space-y-4">
                                <Field label="Data de Distribuição">
                                    <FInput type="date" value={data.filed_at} onChange={e => setData('filed_at', e.target.value)} />
                                </Field>
                                <Field label="Próximo Prazo">
                                    <FInput type="date" value={data.next_deadline} onChange={e => setData('next_deadline', e.target.value)} />
                                </Field>
                            </div>
                        </div>

                        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-[#E8EAF0] mb-4">Honorários</h3>
                            <div className="space-y-4">
                                <Field label="Tipo de Honorário">
                                    <FSelect value={data.fee_type} onChange={e => setData('fee_type', e.target.value)}>
                                        {feeTypes.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                                    </FSelect>
                                </Field>
                                {['fixed','mixed'].includes(data.fee_type) && (
                                    <Field label="Valor Fixo (R$)">
                                        <FInput type="number" step="0.01" value={data.fee_amount}
                                            onChange={e => setData('fee_amount', e.target.value)} placeholder="0,00" />
                                    </Field>
                                )}
                                {['success','mixed'].includes(data.fee_type) && (
                                    <Field label="% de Êxito">
                                        <FInput type="number" step="0.01" min="0" max="100" value={data.fee_success_pct}
                                            onChange={e => setData('fee_success_pct', e.target.value)} placeholder="20" />
                                    </Field>
                                )}
                                <Field label="Valor da Causa (R$)">
                                    <FInput type="number" step="0.01" value={data.case_value}
                                        onChange={e => setData('case_value', e.target.value)} placeholder="0,00" />
                                </Field>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button type="submit" disabled={processing} size="lg" className="w-full justify-center">
                                {processing ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                            <Link href={`/processos/${legalCase.uuid}`}>
                                <Button variant="secondary" size="lg" className="w-full justify-center">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}
