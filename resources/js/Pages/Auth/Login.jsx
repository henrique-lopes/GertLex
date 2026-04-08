import { useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        return () => { reset('password'); };
    }, []);

    function submit(e) {
        e.preventDefault();
        post(route('login'));
    }

    return (
        <div className="min-h-screen bg-[#0D0F14] flex items-center justify-center p-4">
            <Head title="Entrar — GertLex" />

            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#7A5F28]
                        flex items-center justify-center mb-4 shadow-lg shadow-[#C9A84C]/20">
                        <span className="text-black font-black text-2xl">G</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#E8EAF0]">
                        Gert<span className="text-[#C9A84C]">Lex</span>
                    </h1>
                    <p className="text-sm text-[#6B7491] mt-1">Gestão jurídica inteligente</p>
                </div>

                <div className="bg-[#13161E] border border-[#1E2330] rounded-2xl p-8">
                    <h2 className="text-lg font-semibold text-[#E8EAF0] mb-6">Acessar minha conta</h2>

                    {status && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-[#2ECC8A]/10 text-[#2ECC8A] text-sm border border-[#2ECC8A]/20">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">
                                E-mail
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                autoComplete="email"
                                autoFocus
                                placeholder="seu@email.com"
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors"
                            />
                            {errors.email && <p className="text-xs text-[#E05555] mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-[#6B7491] uppercase tracking-wider">
                                    Senha
                                </label>
                                {canResetPassword && (
                                    <Link href={route('password.request')} className="text-xs text-[#C9A84C] hover:underline">
                                        Esqueci a senha
                                    </Link>
                                )}
                            </div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                autoComplete="current-password"
                                placeholder="••••••••"
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5
                                    text-sm text-[#E8EAF0] placeholder-[#6B7491]
                                    focus:outline-none focus:border-[#C9A84C] transition-colors"
                            />
                            {errors.password && <p className="text-xs text-[#E05555] mt-1">{errors.password}</p>}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                className="accent-[#C9A84C]"
                            />
                            <span className="text-sm text-[#6B7491]">Lembrar-me</span>
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-gradient-to-r from-[#C9A84C] to-[#7A5F28] text-black
                                font-bold rounded-lg py-3 text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {processing ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-[#6B7491] mt-6">
                        Novo no GertLex?{' '}
                        <Link href={route('register')} className="text-[#C9A84C] hover:underline font-medium">
                            Criar conta grátis
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
