import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className={`relative bg-[#13161E] border border-[#1E2330] rounded-2xl shadow-2xl
                w-full ${sizes[size]} max-h-[90vh] flex flex-col`}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2330] shrink-0">
                        <h2 className="text-base font-semibold text-[#E8EAF0]">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-[#6B7491] hover:text-[#E8EAF0] transition-colors rounded-lg p-1 hover:bg-[#1A1E29]"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                <div className="overflow-y-auto flex-1 px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
