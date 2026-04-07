const variants = {
    primary:   'bg-gradient-to-r from-[#C9A84C] to-[#7A5F28] text-black font-bold hover:opacity-90',
    secondary: 'bg-[#13161E] border border-[#1E2330] text-[#E8EAF0] hover:bg-[#1A1E29]',
    danger:    'bg-[#E05555]/15 border border-[#E05555]/30 text-[#E05555] hover:bg-[#E05555]/25',
    ghost:     'text-[#6B7491] hover:text-[#E8EAF0] hover:bg-[#1A1E29]',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    type = 'button',
    onClick,
    ...props
}) {
    const base = 'inline-flex items-center gap-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 disabled:opacity-50 disabled:cursor-not-allowed';
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
