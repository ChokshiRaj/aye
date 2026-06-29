import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events?: any[];
  compact?: boolean; // when used in dashboard widget mode
}

export function CalendarWidget({ selectedDate, onDateSelect, events = [], compact = false }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daysOfWeekShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  const getDayString = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isToday = (day: number | null) => {
    if (day === null) return false;
    const t = new Date();
    return t.getDate() === day && t.getMonth() === month && t.getFullYear() === year;
  };

  const isSelected = (day: number | null) => {
    if (day === null || !selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const getEventsOnDay = (day: number | null) => {
    if (day === null) return [];
    const dateStr = getDayString(day);
    return events.filter((e) => e.date === dateStr);
  };

  const handleDayClick = (day: number | null) => {
    if (day !== null && onDateSelect) {
      onDateSelect(new Date(year, month, day));
    }
  };

  // Category dot color
  const getCategoryDotColor = (cat: string) => {
    switch (cat) {
      case 'important': return 'bg-amber-400';
      case 'personal': return 'bg-emerald-400';
      case 'other': return 'bg-slate-400';
      case 'work':
      default: return 'bg-red-500';
    }
  };

  const totalEventsThisMonth = events.filter((e) => {
    const [ey, em] = e.date.split('-').map(Number);
    return ey === year && em === month + 1;
  }).length;

  if (compact) {
    // Compact version used in dashboard widget
    return (
      <div className="flex flex-col h-full">
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1f1f1f] mb-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {monthNames[month].slice(0, 3)} {year}
          </span>
          <div className="flex items-center gap-0.5">
            <button onClick={prevMonth} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button onClick={nextMonth} className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {/* Compact weekdays */}
        <div className="grid grid-cols-7 text-center mb-1">
          {daysOfWeekShort.map((d, i) => (
            <div key={i} className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{d}</div>
          ))}
        </div>
        {/* Compact days */}
        <div className="grid grid-cols-7 gap-0.5 flex-1">
          {daysArray.map((day, index) => {
            const today = isToday(day);
            const selected = isSelected(day);
            const dayEvents = getEventsOnDay(day);
            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`relative flex flex-col items-center justify-center rounded-md text-[10px] font-semibold aspect-square cursor-pointer transition-all select-none ${
                  day === null
                    ? 'pointer-events-none'
                    : today
                    ? 'bg-red-600 text-white shadow-sm'
                    : selected
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-400 dark:bg-red-950/20 dark:text-red-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {day}
                {dayEvents.length > 0 && day !== null && (
                  <span className={`absolute bottom-0.5 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full ${today ? 'bg-white' : 'bg-red-500'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full-page version
  return (
    <div className="flex flex-col h-full">
      {/* Full Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {monthNames[month]}
            <span className="ml-2 text-lg font-bold text-slate-400 dark:text-slate-500">{year}</span>
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-widest mt-0.5">
            {totalEventsThisMonth} event{totalEventsThisMonth !== 1 ? 's' : ''} this month
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((d, i) => (
          <div key={i} className="text-center text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-2">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d[0]}</span>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div className="border-t border-slate-100 dark:border-[#1f1f1f] mb-2" />

      {/* Days grid — grows to fill all available space */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {daysArray.map((day, index) => {
          const today = isToday(day);
          const selected = isSelected(day);
          const dayEvents = getEventsOnDay(day);
          const isWeekend = day !== null && ((index % 7 === 0) || (index % 7 === 6));

          return (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`relative flex flex-col items-start p-1 md:p-1.5 border-b border-r border-slate-100 dark:border-[#1f1f1f] min-h-[52px] md:min-h-[72px] transition-all group select-none ${
                day === null
                  ? 'pointer-events-none'
                  : 'cursor-pointer'
              } ${
                today
                  ? 'bg-red-50/60 dark:bg-red-950/10'
                  : selected
                  ? 'bg-slate-50 dark:bg-slate-800/30'
                  : isWeekend && day !== null
                  ? 'bg-slate-50/30 dark:bg-slate-900/20'
                  : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/10'
              }`}
            >
              {/* Day number */}
              {day !== null && (
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] md:text-xs font-bold transition-all ${
                    today
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/30'
                      : selected
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                      : isWeekend
                      ? 'text-slate-400 dark:text-slate-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                      : 'text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}
                >
                  {day}
                </span>
              )}

              {/* Event dots / pills */}
              <div className="mt-auto w-full space-y-0.5 pt-0.5">
                {dayEvents.slice(0, 2).map((ev, ei) => (
                  <div
                    key={ei}
                    className={`hidden sm:block w-full truncate rounded text-[8px] font-semibold px-1 py-px leading-tight ${
                      ev.category === 'important'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        : ev.category === 'personal'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : ev.category === 'other'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    }`}
                  >
                    {ev.title}
                  </div>
                ))}
                {/* Mobile: just dots */}
                <div className="sm:hidden flex gap-0.5 flex-wrap">
                  {dayEvents.slice(0, 3).map((ev, ei) => (
                    <span key={ei} className={`h-1 w-1 rounded-full ${getCategoryDotColor(ev.category)}`} />
                  ))}
                </div>
                {dayEvents.length > 2 && (
                  <div className="hidden sm:block text-[8px] text-slate-400 dark:text-slate-500 font-semibold px-1">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarWidget;
