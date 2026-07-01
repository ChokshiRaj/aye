import { useState, useEffect } from 'react';
import { widgetsApi } from '../api/widgets';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav, MobileHeader } from '../components/layout/BottomNav';
import CalendarWidget from '../components/widgets/CalendarWidget';
import {
  Plus,
  Trash2,
  Edit2,
  Clock,
  X,
  Loader,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  description?: string | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; border: string }> = {
  work: {
    label: 'Work',
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    border: 'border-red-200 dark:border-red-900/30',
  },
  personal: {
    label: 'Personal',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-900/30',
  },
  important: {
    label: 'Important',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-400',
    border: 'border-amber-200 dark:border-amber-900/30',
  },
  other: {
    label: 'Other',
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
};

export function CalendarPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('work');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);



  const fetchEvents = async () => {
    try {
      const res = await widgetsApi.getEvents();
      if (res.success && res.data) setEvents(res.data);
    } catch (err: any) {
      console.error(err.message || 'Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const getDayString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const selectedDateStr = getDayString(selectedDate);

  const dayEvents = events
    .filter((e) => e.date === selectedDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));



  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setCategory('work');
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setTitle(event.title);
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setCategory(event.category);
    setDescription(event.description || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || formLoading) return;
    setFormLoading(true);

    const eventPayload = {
      title: title.trim(),
      date: selectedDateStr,
      startTime,
      endTime,
      category,
      description: description.trim() || null,
    };

    try {
      if (editingEvent) {
        const res = await widgetsApi.updateEvent(editingEvent.id, eventPayload);
        if (res.success && res.data) {
          setEvents(events.map((e) => (e.id === editingEvent.id ? res.data! : e)));
          setIsModalOpen(false);
        } else alert(res.error || 'Failed to update event');
      } else {
        const res = await widgetsApi.createEvent(eventPayload);
        if (res.success && res.data) {
          setEvents([...events, res.data]);
          setIsModalOpen(false);
        } else alert(res.error || 'Failed to create event');
      }
    } catch (err: any) {
      alert(err.message || 'Error saving event');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    const backup = [...events];
    setEvents(events.filter((e) => e.id !== id));
    try {
      const res = await widgetsApi.deleteEvent(id);
      if (!res.success) { setEvents(backup); alert(res.error || 'Failed to delete'); }
    } catch (err: any) {
      setEvents(backup);
      alert(err.message || 'Error deleting event');
    }
  };

  const formatDisplayDate = (date: Date) =>
    date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-red-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  // ─── Events Panel ────────────────────────────────────────────────────────────
  const EventsPanel = () => (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {formatDisplayDate(selectedDate)}
          </h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold mt-0.5">
            {dayEvents.length === 0 ? 'No events' : `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''} scheduled`}
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition-all active:scale-95 shadow-sm shadow-red-500/20"
        >
          <Plus className="h-3.5 w-3.5" /> Add Event
        </button>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-0.5">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <CalendarIcon className="h-7 w-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Nothing scheduled</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Click Add Event to get started</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-all dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Event
            </button>
          </div>
        ) : (
          dayEvents.map((event) => {
            const cfg = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;
            return (
              <div
                key={event.id}
                className="group relative flex gap-3 rounded-xl border border-slate-100 bg-white p-3.5 hover:border-slate-200 hover:shadow-sm transition-all dark:border-[#1f1f1f] dark:bg-[#111111] dark:hover:border-slate-700"
              >
                {/* Category side bar */}
                <div className={`w-1 shrink-0 rounded-full ${cfg.dot}`} />

                <div className="flex-1 min-w-0">
                  {/* Time + Category badge */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                      <Clock className="h-2.5 w-2.5" />
                      {event.startTime} – {event.endTime}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{event.title}</p>
                  {event.description && (
                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditModal(event)}
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Edit"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">

      {/* Desktop Sidebar */}
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen pb-20 md:pb-0 ${sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'}`}>

        {/* ── DESKTOP LAYOUT ──────────────────────────────────────────────────── */}
        <div className="hidden md:flex h-screen overflow-hidden">

            {/* Left: Full Calendar */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] p-6">
              <CalendarWidget
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                events={events}
              />
            </div>

            {/* Right: Events Panel */}
            <div className="w-80 xl:w-96 flex flex-col bg-slate-50 dark:bg-[#0a0a0a] p-5 overflow-hidden shrink-0">
              <EventsPanel />
            </div>

        </div>

        {/* ── MOBILE LAYOUT ──────────────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col pb-12">
          {/* Mobile Calendar View */}
          <div className="bg-white dark:bg-[#111111] p-4 border-b border-slate-200 dark:border-[#1f1f1f]">
            <CalendarWidget
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              events={events}
            />
          </div>

          {/* Mobile Events View */}
          <div className="flex-1 p-4">
            <EventsPanel />
          </div>
        </div>

      </div>

      {/* ── Add / Edit Event Modal ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-0 sm:px-4">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1f1f1f] dark:bg-[#111111] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-[#1f1f1f] shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-safe">

              {/* Category selector — visual pills */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Category</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-bold transition-all ${
                        category === key
                          ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-offset-0 ring-current`
                          : 'border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 dark:border-[#1f1f1f] dark:bg-slate-800/40 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111111] dark:text-white dark:focus:bg-slate-900 transition-all"
                  placeholder="e.g. Team standup meeting"
                  maxLength={100}
                />
              </div>

              {/* Time row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111111] dark:text-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111111] dark:text-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Notes <span className="normal-case font-normal">(optional)</span></label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-[#111111] dark:text-white dark:focus:bg-slate-900 h-20 resize-none transition-all"
                  placeholder="Additional notes or links..."
                  maxLength={500}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !title.trim()}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm shadow-red-500/20"
                >
                  {formLoading ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab="calendar" />
    </div>
  );
}

export default CalendarPage;
