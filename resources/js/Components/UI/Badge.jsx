const variants = {
    active:      'bg-[#4A7CFF]/15 text-[#4A7CFF]',
    waiting:     'bg-yellow-500/15 text-yellow-400',
    urgent:      'bg-[#E05555]/15 text-[#E05555] animate-pulse',
    closed_won:  'bg-[#2ECC8A]/15 text-[#2ECC8A]',
    closed_lost: 'bg-[#6B7491]/15 text-[#6B7491]',
    pending:     'bg-yellow-500/15 text-yellow-400',
    paid:        'bg-[#2ECC8A]/15 text-[#2ECC8A]',
    overdue:     'bg-[#E05555]/15 text-[#E05555]',
    partial:     'bg-orange-500/15 text-orange-400',
    owner:       'bg-[#C9A84C]/15 text-[#C9A84C]',
    admin:       'bg-[#4A7CFF]/15 text-[#4A7CFF]',
    lawyer:      'bg-purple-500/15 text-purple-400',
    intern:      'bg-teal-500/15 text-teal-400',
    staff:       'bg-[#6B7491]/15 text-[#6B7491]',
    individual:  'bg-[#4A7CFF]/15 text-[#4A7CFF]',
    company:     'bg-purple-500/15 text-purple-400',
    hearing:     'bg-yellow-500/15 text-yellow-400',
    fatal_deadline: 'bg-[#E05555]/15 text-[#E05555]',
    meeting:     'bg-[#4A7CFF]/15 text-[#4A7CFF]',
    default:     'bg-[#6B7491]/15 text-[#6B7491]',
};

const labels = {
    active:      'Ativo',
    waiting:     'Aguardando',
    urgent:      'Urgente',
    closed_won:  'Ganho',
    closed_lost: 'Perdido',
    pending:     'Pendente',
    paid:        'Pago',
    overdue:     'Vencido',
    partial:     'Parcial',
    owner:       'Proprietário',
    admin:       'Admin',
    lawyer:      'Advogado',
    intern:      'Estagiário',
    staff:       'Staff',
    individual:  'PF',
    company:     'PJ',
    hearing:     'Audiência',
    fatal_deadline: 'Prazo Fatal',
    meeting:     'Reunião',
};

export default function Badge({ value, label, className = '' }) {
    const variant = variants[value] ?? variants.default;
    const text     = label ?? labels[value] ?? value;

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variant} ${className}`}>
            {text}
        </span>
    );
}
