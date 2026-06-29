import { useState, useEffect } from 'react';
import { widgetsApi } from '../../api/widgets';
import { CalendarDays, AlertCircle, Loader } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  description?: string | null;
}

interface EventsWidgetProps {
  selectedDate?: Date;
  events?: EventItem[];
}

export function EventsWidget({ selectedDate, events }: EventsWidgetProps) {
  const [localEvents, setLocalEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const targetDate = selectedDate || new Date();

  // YYYY-MM-DD Date format
  const getDayString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const targetDateStr = getDayString(targetDate);

  // Fetch events only if not passed as props (Standalone Dashboard mode)
  useEffect(() => {
    if (events === undefined) {
      const fetchEvents = async () => {
        setLoading(true);
        try {
          const res = await widgetsApi.getEvents();
          if (res.success && res.data) {
            setLocalEvents(res.data);
          }
        } catch (err) {
          console.error('Failed to load events:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }
  }, [events]);

  const activeEvents = events !== undefined ? events : localEvents;

  // Filter events matching selected date & sort chronologically
  const dayEvents = activeEvents
    .filter((e) => e.date === targetDateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'important':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'personal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'other':
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'work':
      default:
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
    }
  };

  return (
    <div className="flex h-[240px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-red-500" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Schedule for {targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Events List */}
      <div className="custom-scrollbar my-2 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-red-500" />
          </div>
        ) : dayEvents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-4">
            <p className="text-xs text-slate-400">No events scheduled today</p>
          </div>
        ) : (
          dayEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-2 rounded-lg border border-slate-50 bg-slate-50/50 p-2 dark:border-[#1f1f1f] dark:bg-slate-800/10"
            >
              {/* Time */}
              <div className="text-[9px] font-bold text-slate-450 dark:text-slate-500 w-22 shrink-0">
                {event.startTime} - {event.endTime}
              </div>
              
              {/* Divider */}
              <div className="h-6 w-0.5 bg-slate-200 dark:bg-slate-800 shrink-0" />

              {/* Title & Category Tag */}
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate">
                  {event.title}
                </p>
                <span
                  className={`inline-block mt-0.5 rounded border px-1 text-[8px] font-semibold uppercase tracking-wider ${getBadgeColor(
                    event.category
                  )}`}
                >
                  {event.category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-650 flex items-center gap-1">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Linked to central calendar database</span>
      </div>
    </div>
  );
}

export default EventsWidget;
