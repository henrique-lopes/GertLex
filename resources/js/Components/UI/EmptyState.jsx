export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-[#1A1E29] flex items-center justify-center mb-4">
                    <Icon size={28} className="text-[#6B7491]" />
                </div>
            )}
            <h3 className="text-base font-semibold text-[#E8EAF0] mb-1">{title}</h3>
            {description && <p className="text-sm text-[#6B7491] max-w-xs mb-4">{description}</p>}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
