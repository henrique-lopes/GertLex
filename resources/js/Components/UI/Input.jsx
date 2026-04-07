export default function Input({
    label,
    error,
    icon: Icon,
    className = '',
    containerClass = '',
    ...props
}) {
    return (
        <div className={`flex flex-col gap-1 ${containerClass}`}>
            {label && (
                <label className="text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7491] pointer-events-none"
                    />
                )}
                <input
                    className={`w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg
                        px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#6B7491]
                        focus:outline-none focus:border-[#C9A84C] transition-colors
                        disabled:opacity-50
                        ${Icon ? 'pl-9' : ''}
                        ${error ? 'border-[#E05555] focus:border-[#E05555]' : ''}
                        ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-[#E05555]">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, className = '', containerClass = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1 ${containerClass}`}>
            {label && (
                <label className="text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                    {label}
                </label>
            )}
            <textarea
                className={`w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg
                    px-4 py-2.5 text-sm text-[#E8EAF0] placeholder-[#6B7491]
                    focus:outline-none focus:border-[#C9A84C] transition-colors
                    resize-none
                    ${error ? 'border-[#E05555]' : ''}
                    ${className}`}
                rows={4}
                {...props}
            />
            {error && <p className="text-xs text-[#E05555]">{error}</p>}
        </div>
    );
}

export function Select({ label, error, children, className = '', containerClass = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1 ${containerClass}`}>
            {label && (
                <label className="text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                    {label}
                </label>
            )}
            <select
                className={`w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg
                    px-4 py-2.5 text-sm text-[#E8EAF0]
                    focus:outline-none focus:border-[#C9A84C] transition-colors
                    ${error ? 'border-[#E05555]' : ''}
                    ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && <p className="text-xs text-[#E05555]">{error}</p>}
        </div>
    );
}
