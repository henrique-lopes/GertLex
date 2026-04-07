import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, Briefcase, Users, DollarSign,
    Calendar, FolderOpen, Sparkles, Settings, Menu, X,
    Bell, Search, ChevronDown, LogOut, User, Building2,
    Sun, Moon, AlertTriangle, Clock, CreditCard
} from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

const navItems = [
    { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
    { href: '/processos',     label: 'Processos',    icon: Briefcase },
    { href: '/clientes',      label: 'Clientes',     icon: Users },
    { href: '/equipe',        label: 'Equipe',       icon: Users },
    { href: '/financeiro',    label: 'Financeiro',   icon: DollarSign },
    { href: '/agenda',        label: 'Agenda',       icon: Calendar },
    { href: '/documentos',    label: 'Documentos',   icon: FolderOpen },
    { href: '/ia',            label: 'IA Jurídica',  icon: Sparkles },
    { href: '/planos',        label: 'Planos',       icon: CreditCard },
];

function NavItem({ href, label, icon: Icon, collapsed }) {
    const { url } = usePage();
    const active = url === href || (href !== '/' && url.startsWith(href));

    return (
        <Link
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative
                ${active
                    ? 'bg-[#C9A84C]/15 text-[#C9A84C]'
                    : 'text-[#6B7491] hover:text-[#E8EAF0] hover:bg-[#1A1E29]'
                }`}
        >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
            {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-[#1A1E29] text-[#E8EAF0] text-xs
                    rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 border border-[#1E2330]">
                    {label}
                </span>
            )}
        </Link>
    );
}

function UserMenu({ user, workspace }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#1A1E29] transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#7A5F28]
                    flex items-center justify-center text-black font-bold text-xs shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-[#E8EAF0] leading-tight">{user?.name}</p>
                    <p className="text-xs text-[#6B7491] leading-tight">{workspace?.name}</p>
                </div>
                <ChevronDown size={14} className="text-[#6B7491] hidden md:block" />
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[#13161E] border border-[#1E2330]
                        rounded-xl shadow-xl z-50 py-1">
                        <Link
                            href="/configuracoes"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#E8EAF0] hover:bg-[#1A1E29]"
                            onClick={() => setOpen(false)}
                        >
                            <Settings size={15} /> Configurações
                        </Link>
                        <hr className="border-[#1E2330] my-1" />
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#E05555] hover:bg-[#1A1E29] w-full text-left"
                            onClick={() => setOpen(false)}
                        >
                            <LogOut size={15} /> Sair
                        </Link>
                    </div>
                </>
            )}
        </div>
    );
}

function TrialBanner({ trial }) {
    if (!trial?.isOnTrial || !trial?.alertLevel) return null;

    const config = {
        critical: { bg: 'bg-[#E05555]/10 border-[#E05555]/30', text: 'text-[#E05555]', icon: AlertTriangle },
        warning:  { bg: 'bg-[#F5A623]/10 border-[#F5A623]/30', text: 'text-[#F5A623]', icon: Clock },
        info:     { bg: 'bg-[#4A7CFF]/10 border-[#4A7CFF]/30', text: 'text-[#4A7CFF]', icon: Clock },
    }[trial.alertLevel];

    const Icon = config.icon;
    const days = trial.daysRemaining;
    const msg = days === 0
        ? 'Seu trial expira hoje!'
        : `Seu trial expira em ${days} dia${days !== 1 ? 's' : ''}.`;

    return (
        <div className={`flex items-center justify-between px-4 lg:px-6 py-2 border-b text-xs font-medium ${config.bg}`}>
            <div className={`flex items-center gap-2 ${config.text}`}>
                <Icon size={14} />
                <span>{msg} Ative um plano para não perder o acesso.</span>
            </div>
            <Link href="/planos" className={`underline underline-offset-2 ${config.text} hover:opacity-80 transition-opacity`}>
                Ver planos →
            </Link>
        </div>
    );
}

export default function AppLayout({ children, title }) {
    const { auth, flash, trial } = usePage().props;
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const planMeta = {
        trial:   { label: 'Trial',   color: 'bg-[#6B7491]/20 text-[#6B7491]' },
        starter: { label: 'Starter', color: 'bg-[#4A7CFF]/15 text-[#4A7CFF]' },
        pro:     { label: 'Pro',     color: 'bg-[#C9A84C]/15 text-[#C9A84C]' },
        premium: { label: 'Premium', color: 'bg-[#2ECC8A]/15 text-[#2ECC8A]' },
    }[auth?.workspace?.plan] ?? { label: 'Trial', color: 'bg-[#6B7491]/20 text-[#6B7491]' };

    return (
        <div className="min-h-screen bg-[#0D0F14] text-[#E8EAF0] flex">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-[#0D0F14] border-r border-[#1E2330] z-40
                flex flex-col transition-all duration-300
                ${collapsed ? 'w-16' : 'w-60'}
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 px-4 py-5 border-b border-[#1E2330]
                    ${collapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#7A5F28]
                        flex items-center justify-center shrink-0">
                        <span className="text-black font-black text-sm">L</span>
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-bold text-[#E8EAF0]">
                            Lex<span className="text-[#C9A84C]">Flow</span>
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                    {navItems.map(item => (
                        <NavItem key={item.href} {...item} collapsed={collapsed} />
                    ))}
                </nav>

                {/* Footer */}
                {!collapsed && (
                    <div className="px-4 py-4 border-t border-[#1E2330]">
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 size={13} className="text-[#6B7491]" />
                            <span className="text-xs text-[#6B7491] truncate">
                                {auth?.workspace?.name}
                            </span>
                        </div>
                        <Link href="/planos"
                    className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 ${planMeta.color}`}>
                    {planMeta.label}
                </Link>
                    </div>
                )}

                {/* Collapse toggle (desktop) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex items-center justify-center h-10 border-t border-[#1E2330]
                        text-[#6B7491] hover:text-[#E8EAF0] hover:bg-[#1A1E29] transition-colors"
                >
                    <Menu size={18} />
                </button>
            </aside>

            {/* Main */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300
                ${collapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-20 bg-[#0D0F14]/80 backdrop-blur border-b border-[#1E2330]
                    flex items-center gap-4 px-4 lg:px-6 h-14">
                    <button
                        className="lg:hidden text-[#6B7491] hover:text-[#E8EAF0]"
                        onClick={() => setMobileOpen(!mobileOpen)}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>

                    {title && (
                        <h1 className="text-base font-semibold text-[#E8EAF0] hidden sm:block">
                            {title}
                        </h1>
                    )}

                    <div className="flex-1" />

                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 bg-[#13161E] border border-[#1E2330]
                        rounded-lg px-3 py-1.5 text-sm text-[#6B7491] w-56">
                        <Search size={14} />
                        <span>Buscar...</span>
                    </div>

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                        className="w-9 h-9 flex items-center justify-center rounded-lg
                            text-[#6B7491] hover:text-[#E8EAF0] hover:bg-[#1A1E29] transition-colors"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <UserMenu user={auth?.user} workspace={auth?.workspace} />
                </header>

                {/* Trial banner */}
                <TrialBanner trial={trial} />

                {/* Flash messages */}
                {(flash?.success || flash?.error) && (
                    <div className={`mx-4 lg:mx-6 mt-4 px-4 py-3 rounded-lg text-sm
                        ${flash.success
                            ? 'bg-[#2ECC8A]/10 text-[#2ECC8A] border border-[#2ECC8A]/20'
                            : 'bg-[#E05555]/10 text-[#E05555] border border-[#E05555]/20'
                        }`}>
                        {flash.success || flash.error}
                    </div>
                )}

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
