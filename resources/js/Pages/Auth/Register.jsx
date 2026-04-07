import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        workspace_name:        '',
        oab_number:            '',
    });

    useEffect(() => {
        return () => { reset('password', 'password_confirmation'); };
    }, []);

    function submit(e) {
        e.preventDefault();
        post(route('register'));
    }

    return (
        <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center p-4">
            <Head title="Criar Conta — LexFlow" />

            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#7A5F28]
                        flex items-center justify-center mb-4 shadow-lg shadow-[#C9A84C]/20">
                        <span className="text-black font-black text-2xl">L</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#E8EAF0]">
                        Lex<span className="text-[#C9A84C]">Flow</span>
                    </h1>
                    <p className="text-sm text-[#6B7491] mt-1">Comece seu período de teste grátis</p>
                </div>

                <div className="bg-[#13161E] border border-[#1E2330] rounded-2xl p-8">
                    <h2 className="text-lg font-semibold text-[#E8EAF0] mb-6">Criar nova conta</h2>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                Nome do Escritório *
                            </label>
                            <input
                                type="text"
                                value={data.workspace_name}
                                onChange={e => setData('workspace_name', e.target.value)}
                                placeholder="Silva & Advogados Associados"
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors"
                            />
                            {errors.workspace_name && <p className="text-xs text-[#E05555] mt-1">{errors.workspace_name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                    Seu Nome *
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    placeholder="Dr. João Silva"
                                    className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                        text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                        focus:outline-none focus:border-[#C9A84C] transition-colors"
                                />
                                {errors.name && <p className="text-xs text-[#E05555] mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                    OAB (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={data.oab_number}
                                    onChange={e => setData('oab_number', e.target.value)}
                                    placeholder="SP 123456"
                                    className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                        text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                        focus:outline-none focus:border-[#C9A84C] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                E-mail *
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="seu@email.com"
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors"
                            />
                            {errors.email && <p className="text-xs text-[#E05555] mt-1">{errors.email}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                    Senha *
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                        text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                        focus:outline-none focus:border-[#C9A84C] transition-colors"
                                />
                                {errors.password && <p className="text-xs text-[#E05555] mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                    Confirmar *
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={e => setData('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                        text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                        focus:outline-none focus:border-[#C9A84C] transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-[#C9A84C] to-[#7A5F28] text-black
                                font-bold rounded-lg py-3 text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {processing ? 'Criando conta...' : 'Criar conta grátis'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#6B7491] mt-6">
                        Já tem conta?{' '}
                        <Link href={route('login')} className="text-[#C9A84C] hover:underline font-medium">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
