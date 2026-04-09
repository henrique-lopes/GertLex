import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Button from '@/Components/UI/Button';
import Modal from '@/Components/UI/Modal';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Pencil, Trash2, Video, Monitor } from 'lucide-react';

const TYPE_COLORS = {
    hearing:        { dot: 'bg-yellow-400', badge: 'text-yellow-400' },
    fatal_deadline: { dot: 'bg-[#E05555]',  badge: 'text-[#E05555]' },
    meeting:        { dot: 'bg-[#4A7CFF]',  badge: 'text-[#4A7CFF]' },
    task:           { dot: 'bg-[#2ECC8A]',  badge: 'text-[#2ECC8A]' },
    other:          { dot: 'bg-[#6B7491]',  badge: 'text-[#6B7491]' },
};

const TYPE_LABELS = {
    hearing:'Audiência', fatal_deadline:'Prazo Fatal', meeting:'Reunião', task:'Tarefa', other:'Outro',
};

function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}
function firstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

export default function CalendarIndex({ events, cases, month }) {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const [y, m] = (month ?? '').split('-').map(Number);
        return { year: y || new Date().getFullYear(), month: (m || new Date().getMonth() + 1) - 1 };
    });
    const [selectedDay, setSelectedDay]   = useState(null);
    const [createOpen, setCreateOpen]     = useState(false);
    const [editEvent, setEditEvent]       = useState(null);

    const form = useForm({
        title: '', type: 'hearing', starts_at: '', ends_at: '',
        all_day: false, is_virtual: false, location: '', meeting_url: '',
        case_id: '', alert_1d: true, alert_5d: false, description: '',
    });

    const editForm = useForm({
        title: '', type: 'hearing', starts_at: '', ends_at: '',
        all_day: false, is_virtual: false, location: '', meeting_url: '',
        status: 'pending', description: '',
    });

    function openEdit(ev) {
        editForm.setData({
            title:       ev.title,
            type:        ev.type,
            starts_at:   ev.starts_at ? ev.starts_at.slice(0, 16) : '',
            ends_at:     ev.ends_at   ? ev.ends_at.slice(0, 16)   : '',
            all_day:     ev.all_day ?? false,
            is_virtual:  ev.is_virtual ?? false,
            location:    ev.location ?? '',
            meeting_url: ev.meeting_url ?? '',
            status:      ev.status ?? 'pending',
            description: ev.description ?? '',
        });
        setEditEvent(ev);
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.put(route('calendar.update', editEvent.id), {
            onSuccess: () => setEditEvent(null),
        });
    }

    function deleteEvent(ev) {
        if (!confirm(`Remover "${ev.title}"?`)) return;
        router.delete(route('calendar.destroy', ev.id));
    }

    const { year, month: mon } = currentMonth;
    const days    = daysInMonth(year, mon);
    const firstDay = firstDayOfMonth(year, mon);
    const monthStr = `${year}-${String(mon + 1).padStart(2, '0')}`;

    // Group events by day
    const eventsByDay = {};
    (events ?? []).forEach(e => {
        const d = new Date(e.starts_at).getDate();
        if (!eventsByDay[d]) eventsByDay[d] = [];
        eventsByDay[d].push(e);
    });

    function prevMonth() {
        const d = new Date(year, mon - 1, 1);
        const nm = { year: d.getFullYear(), month: d.getMonth() };
        setCurrentMonth(nm);
        router.get('/agenda', { month: `${nm.year}-${String(nm.month + 1).padStart(2,'0')}` }, { preserveState: true, replace: true });
    }

    function nextMonth() {
        const d = new Date(year, mon + 1, 1);
        const nm = { year: d.getFullYear(), month: d.getMonth() };
        setCurrentMonth(nm);
        router.get('/agenda', { month: `${nm.year}-${String(nm.month + 1).padStart(2,'0')}` }, { preserveState: true, replace: true });
    }

    function submitCreate(e) {
        e.preventDefault();
        form.post(route('calendar.store'), {
            onSuccess: () => { setCreateOpen(false); form.reset(); }
        });
    }

    const selectedEvents = selectedDay ? (eventsByDay[selectedDay] ?? []) : [];

    const monthName = new Date(year, mon).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const weekDays = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

    return (
        <AppLayout title="Agenda">
            <Head title="Agenda — GertLex" />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-[#E8EAF0] capitalize">{monthName}</h1>
                    <p className="text-sm text-[#6B7491] mt-0.5">{events?.length ?? 0} eventos no mês</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="p-2 rounded-lg bg-[#13161E] border border-[#1E2330] text-[#6B7491] hover:text-[#E8EAF0]">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-lg bg-[#13161E] border border-[#1E2330] text-[#6B7491] hover:text-[#E8EAF0]">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Novo Evento</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Calendar grid */}
                <div className="xl:col-span-3 bg-[#13161E] border border-[#1E2330] rounded-xl overflow-hidden">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 bg-[#1A1E29]">
                        {weekDays.map(d => (
                            <div key={d} className="py-3 text-center text-xs font-medium text-[#6B7491] uppercase tracking-wider">{d}</div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {/* Empty cells before first day */}
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`e-${i}`} className="h-24 border-b border-r border-[#1E2330] bg-[#0D0F14]/30" />
                        ))}

                        {/* Day cells */}
                        {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                            const dayEvents = eventsByDay[day] ?? [];
                            const isToday = new Date().getDate() === day &&
                                new Date().getMonth() === mon && new Date().getFullYear() === year;
                            const isSelected = selectedDay === day;

                            return (
                                <div
                                    key={day}
                                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                                    className={`h-24 border-b border-r border-[#1E2330] p-2 cursor-pointer transition-colors
                                        ${isSelected ? 'bg-[#C9A84C]/10' : 'hover:bg-[#1A1E29]/50'}`}
                                >
                                    <span className={`text-xs font-medium inline-flex w-5 h-5 items-center justify-center rounded-full
                                        ${isToday ? 'bg-[#C9A84C] text-black' : 'text-[#6B7491]'}`}>
                                        {day}
                                    </span>
                                    <div className="mt-1 space-y-0.5">
                                        {dayEvents.slice(0, 2).map(ev => {
                                            const colors = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
                                            return (
                                                <div key={ev.id} className="flex items-center gap-1 truncate">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot} shrink-0`} />
                                                    <span className="text-xs text-[#E8EAF0] truncate">{ev.title}</span>
                                                </div>
                                            );
                                        })}
                                        {dayEvents.length > 2 && (
                                            <span className="text-xs text-[#6B7491]">+{dayEvents.length - 2} mais</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Day panel */}
                <div className="bg-[#13161E] border border-[#1E2330] rounded-xl">
                    <div className="px-5 py-4 border-b border-[#1E2330]">
                        <h3 className="text-sm font-semibold text-[#E8EAF0]">
                            {selectedDay
                                ? `${selectedDay} de ${new Date(year, mon).toLocaleString('pt-BR', { month: 'long' })}`
                                : 'Selecione um dia'
                            }
                        </h3>
                    </div>
                    <div className="p-5">
                        {!selectedDay && (
                            <p className="text-sm text-[#6B7491] text-center py-8">Clique em um dia para ver os eventos.</p>
                        )}
                        {selectedDay && selectedEvents.length === 0 && (
                            <p className="text-sm text-[#6B7491] text-center py-8">Nenhum evento neste dia.</p>
                        )}
                        <div className="space-y-3">
                            {selectedEvents.map(ev => {
                                const colors = TYPE_COLORS[ev.type] ?? TYPE_COLORS.other;
                                return (
                                    <div key={ev.id} className="bg-[#0D0F14] border border-[#1E2330] rounded-xl p-3">
                                        <div className="flex items-start gap-2">
                                            <div className={`w-2 h-2 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[#E8EAF0] truncate">{ev.title}</p>
                                                <p className={`text-xs mt-0.5 ${colors.badge}`}>{TYPE_LABELS[ev.type] ?? ev.type}</p>
                                                {ev.starts_at && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Clock size={11} className="text-[#6B7491]" />
                                                        <span className="text-xs text-[#6B7491]">
                                                            {new Date(ev.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                )}
                                                {ev.is_virtual && ev.meeting_url ? (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Video size={11} className="text-[#4A7CFF]" />
                                                        <a href={ev.meeting_url} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-[#4A7CFF] hover:underline truncate">
                                                            Entrar na reunião
                                                        </a>
                                                    </div>
                                                ) : ev.is_virtual ? (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Video size={11} className="text-[#4A7CFF]" />
                                                        <span className="text-xs text-[#4A7CFF]">Virtual</span>
                                                    </div>
                                                ) : ev.location ? (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <MapPin size={11} className="text-[#6B7491]" />
                                                        <span className="text-xs text-[#6B7491] truncate">{ev.location}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => openEdit(ev)}
                                                    className="p-1.5 rounded-lg text-[#6B7491] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors">
                                                    <Pencil size={13} />
                                                </button>
                                                <button onClick={() => deleteEvent(ev)}
                                                    className="p-1.5 rounded-lg text-[#6B7491] hover:text-[#E05555] hover:bg-[#E05555]/10 transition-colors">
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit event modal */}
            <Modal open={!!editEvent} onClose={() => setEditEvent(null)} title="Editar Evento">
                <form onSubmit={submitEdit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Título *</label>
                        <input value={editForm.data.title} onChange={e => editForm.setData('title', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        {editForm.errors.title && <p className="text-xs text-[#E05555] mt-1">{editForm.errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Tipo *</label>
                            <select value={editForm.data.type} onChange={e => editForm.setData('type', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                {Object.entries(TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Status</label>
                            <select value={editForm.data.status} onChange={e => editForm.setData('status', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                <option value="pending">Pendente</option>
                                <option value="done">Concluído</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Início *</label>
                            <input type="datetime-local" value={editForm.data.starts_at} onChange={e => editForm.setData('starts_at', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Fim</label>
                            <input type="datetime-local" value={editForm.data.ends_at} onChange={e => editForm.setData('ends_at', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editForm.data.is_virtual} onChange={e => editForm.setData('is_virtual', e.target.checked)} className="accent-[#C9A84C]" />
                            <span className="text-sm text-[#6B7491]">Audiência/Reunião Virtual</span>
                        </label>
                    </div>
                    {editForm.data.is_virtual ? (
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Link da Reunião</label>
                            <input value={editForm.data.meeting_url} onChange={e => editForm.setData('meeting_url', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="https://meet.google.com/..." />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Local</label>
                            <input value={editForm.data.location} onChange={e => editForm.setData('location', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="Ex: 2ª Vara do Trabalho — SP" />
                        </div>
                    )}
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={editForm.processing}>Salvar</Button>
                        <Button type="button" variant="secondary" onClick={() => setEditEvent(null)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>

            {/* Create event modal */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Evento">
                <form onSubmit={submitCreate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Título *</label>
                        <input value={form.data.title} onChange={e => form.setData('title', e.target.value)}
                            className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                            placeholder="Ex: Audiência de instrução" />
                        {form.errors.title && <p className="text-xs text-[#E05555] mt-1">{form.errors.title}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Tipo *</label>
                            <select value={form.data.type} onChange={e => form.setData('type', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                {Object.entries(TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Processo</label>
                            <select value={form.data.case_id} onChange={e => form.setData('case_id', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]">
                                <option value="">Nenhum</option>
                                {(cases ?? []).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Início *</label>
                            <input type="datetime-local" value={form.data.starts_at} onChange={e => form.setData('starts_at', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Fim</label>
                            <input type="datetime-local" value={form.data.ends_at} onChange={e => form.setData('ends_at', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.is_virtual} onChange={e => form.setData('is_virtual', e.target.checked)} className="accent-[#C9A84C]" />
                            <span className="text-sm text-[#6B7491]">Audiência/Reunião Virtual</span>
                        </label>
                    </div>
                    {form.data.is_virtual ? (
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Link da Reunião</label>
                            <input value={form.data.meeting_url} onChange={e => form.setData('meeting_url', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="https://meet.google.com/..." />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-medium text-[#6B7491] uppercase tracking-wider mb-1.5">Local</label>
                            <input value={form.data.location} onChange={e => form.setData('location', e.target.value)}
                                className="w-full bg-[#0D0F14] border border-[#1E2330] rounded-lg px-4 py-2.5 text-sm text-[#E8EAF0] focus:outline-none focus:border-[#C9A84C]"
                                placeholder="Ex: 2ª Vara do Trabalho — SP" />
                        </div>
                    )}
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.alert_1d} onChange={e => form.setData('alert_1d', e.target.checked)} className="accent-[#C9A84C]" />
                            <span className="text-sm text-[#6B7491]">Alerta 1 dia antes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.data.alert_5d} onChange={e => form.setData('alert_5d', e.target.checked)} className="accent-[#C9A84C]" />
                            <span className="text-sm text-[#6B7491]">Alerta 5 dias antes</span>
                        </label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={form.processing}>Criar Evento</Button>
                        <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
