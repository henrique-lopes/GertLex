export default function Card({ title, children, action, className = '' }) {
    return (
        <div className={`bg-[#13161E] border border-[#1E2330] rounded-xl ${className}`}>
            {title && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2330]">
                    <h3 className="text-sm font-semibold text-[#E8EAF0]">{title}</h3>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={title ? '' : 'p-5'}>
                {title ? <div className="p-5">{children}</div> : children}
            </div>
        </div>
    );
}

export function StatCard({ label, value, delta, icon: Icon, color = 'gold' }) {
    const colors = {
        gold:  'text-[#C9A84C] bg-[#C9A84C]/10',
        blue:  'text-[#4A7CFF] bg-[#4A7CFF]/10',
        green: 'text-[#2ECC8A] bg-[#2ECC8A]/10',
        red:   'text-[#E05555] bg-[#E05555]/10',
    };

    return (
        <div className="bg-[#13161E] border border-[#1E2330] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#6B7491] uppercase tracking-wider">{label}</span>
                {Icon && (
                    <div className={`w-9 h-9 rounded-lg ${colors[color]} flex items-center justify-center`}>
                        <Icon size={17} className={colors[color].split(' ')[0]} />
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-[#E8EAF0]">{value}</p>
            {delta !== undefined && (
                <p className={`text-xs mt-1 ${delta >= 0 ? 'text-[#2ECC8A]' : 'text-[#E05555]'}`}>
                    {delta >= 0 ? '+' : ''}{delta} vs mês anterior
                </p>
            )}
        </div>
    );
}
