import { useState, useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import { Sparkles, Send, User, Bot, RotateCcw, ChevronDown } from 'lucide-react';
import axios from 'axios';

const SUGGESTIONS = [
    'Quais são os prazos para recurso de apelação no processo civil?',
    'Explique o procedimento de dissolução de sociedade limitada.',
    'Como calcular juros de mora e correção monetária em ação trabalhista?',
    'Quais são os requisitos para uma ação de usucapião?',
    'Redija um modelo de notificação extrajudicial.',
];

const PETITION_TYPES = [
    'Petição Inicial',
    'Contestação',
    'Recurso de Apelação',
    'Embargos de Declaração',
    'Agravo de Instrumento',
    'Exceção de Pré-Executividade',
];

function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${isUser ? 'bg-[#C9A84C]/20' : 'bg-[#4A7CFF]/20'}`}>
                {isUser
                    ? <User size={15} className="text-[#C9A84C]" />
                    : <Sparkles size={15} className="text-[#4A7CFF]" />
                }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                ${isUser
                    ? 'bg-[#C9A84C]/15 text-[#E8EAF0] rounded-tr-sm'
                    : 'bg-[#13161E] border border-[#1E2330] text-[#E8EAF0] rounded-tl-sm'
                }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
        </div>
    );
}

export default function AIIndex() {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [showPetitions, setShowPetitions] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    async function sendMessage(text) {
        const content = text ?? input.trim();
        if (!content || loading) return;
        setInput('');

        const newMessages = [...messages, { role: 'user', content }];
        setMessages(newMessages);
        setLoading(true);

        try {
            const res = await axios.post('/ia/chat', {
                messages: newMessages.map(m => ({ role: m.role, content: m.content })),
            });
            setMessages([...newMessages, { role: 'assistant', content: res.data.content }]);
        } catch (err) {
            const errorMsg = err.response?.data?.error ?? 'Erro ao comunicar com a IA. Tente novamente.';
            setMessages([...newMessages, { role: 'assistant', content: errorMsg }]);
        } finally {
            setLoading(false);
        }
    }

    function sendPetitionRequest(type) {
        setShowPetitions(false);
        sendMessage(`Redija um modelo de ${type} completo, com todos os elementos necessários conforme o CPC/2015.`);
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    return (
        <AppLayout title="IA Jurídica">
            <Head title="IA Jurídica — LexFlow" />

            <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-[#E8EAF0] flex items-center gap-2">
                            <Sparkles size={20} className="text-[#C9A84C]" />
                            IA Jurídica
                        </h1>
                        <p className="text-sm text-[#6B7491] mt-0.5">Assistente especializado em direito brasileiro</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Petition templates */}
                        <div className="relative">
                            <Button variant="secondary" size="sm" onClick={() => setShowPetitions(!showPetitions)}>
                                Modelos de Petição <ChevronDown size={14} />
                            </Button>
                            {showPetitions && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowPetitions(false)} />
                                    <div className="absolute right-0 top-full mt-1 w-56 bg-[#13161E] border border-[#1E2330]
                                        rounded-xl shadow-xl z-20 py-1">
                                        {PETITION_TYPES.map(type => (
                                            <button key={type} onClick={() => sendPetitionRequest(type)}
                                                className="w-full text-left px-4 py-2.5 text-sm text-[#E8EAF0] hover:bg-[#1A1E29] transition-colors">
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {messages.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => setMessages([])}>
                                <RotateCcw size={14} /> Nova conversa
                            </Button>
                        )}
                    </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 bg-[#13161E] border border-[#1E2330] rounded-xl overflow-y-auto p-6 space-y-6 mb-4">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                                <Sparkles size={28} className="text-[#C9A84C]" />
                            </div>
                            <h3 className="text-base font-semibold text-[#E8EAF0] mb-2">Como posso ajudar?</h3>
                            <p className="text-sm text-[#6B7491] mb-8 text-center max-w-sm">
                                Sou especializado em direito brasileiro. Pergunte sobre legislação, jurisprudência,
                                prazos processuais ou peça para redigir documentos jurídicos.
                            </p>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)}
                                        className="text-left px-4 py-3 rounded-xl bg-[#0D0F14] border border-[#1E2330]
                                            text-sm text-[#6B7491] hover:border-[#C9A84C]/50 hover:text-[#E8EAF0] transition-colors">
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <MessageBubble key={i} message={msg} />
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#4A7CFF]/20 flex items-center justify-center shrink-0">
                                <Sparkles size={15} className="text-[#4A7CFF]" />
                            </div>
                            <div className="bg-[#0D0F14] border border-[#1E2330] rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#6B7491] animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#6B7491] animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#6B7491] animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="flex gap-3">
                    <div className="flex-1 bg-[#13161E] border border-[#1E2330] rounded-xl flex items-end gap-3 px-4 py-3
                        focus-within:border-[#C9A84C] transition-colors">
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua pergunta jurídica... (Enter para enviar)"
                            rows={1}
                            className="flex-1 bg-transparent text-sm text-[#E8EAF0] placeholder-[#6B7491] outline-none resize-none max-h-32"
                            style={{ minHeight: '24px' }}
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                            }}
                        />
                    </div>
                    <Button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        size="lg"
                        className="shrink-0 aspect-square px-0 w-12 justify-center"
                    >
                        <Send size={16} />
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
