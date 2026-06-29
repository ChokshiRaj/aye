import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-[#1f1f1f]">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-550">
          Local Time
        </span>
        <Clock className="h-4 w-4 text-red-500" />
      </div>

      <div className="my-auto py-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 tabular-nums">
          {formatTime(time)}
        </h2>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Calendar className="h-3.5 w-3.5" />
        <span>{formatDate(time)}</span>
      </div>
    </div>
  );
}

export default ClockWidget;
