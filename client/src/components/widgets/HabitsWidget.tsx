import { useState, useEffect, FormEvent } from 'react';
import { widgetsApi } from '../../api/widgets';
import { Habit } from '../../types';
import { Check, Plus, Trash2, Loader, Flame } from 'lucide-react';

interface HabitsWidgetProps {
  showHeatmap?: boolean;
}

export function HabitsWidget({ showHeatmap = false }: HabitsWidgetProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHabits = async () => {
    try {
      const res = await widgetsApi.getHabits();
      if (res.success && res.data) {
        setHabits(res.data);
      } else {
        setError(res.error || 'Failed to load habits');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Compute the last 7 days (including today)
  const getLast7Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
    return dates;
  };

  const days = getLast7Days();

  const getDayString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleAddHabit = async (e: FormEvent) => {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name || submitting) return;

    setSubmitting(true);
    try {
      const res = await widgetsApi.createHabit(name);
      if (res.success && res.data) {
        setHabits([...habits, res.data]);
        setNewHabitName('');
      } else {
        setError(res.error || 'Failed to create habit');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating habit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      const original = [...habits];
      setHabits(habits.filter((h) => h.id !== id));

      const res = await widgetsApi.deleteHabit(id);
      if (!res.success) {
        setHabits(original);
        setError(res.error || 'Failed to delete habit');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting habit');
    }
  };

  const handleToggleLog = async (habitId: string, date: Date) => {
    const dateStr = getDayString(date);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isLogged = habit.logs.some((log) => {
      const logDateOnly = log.date.split('T')[0];
      return logDateOnly === dateStr;
    });

    try {
      // Optimistic state update
      const updatedHabits = habits.map((h) => {
        if (h.id === habitId) {
          const newLogs = isLogged
            ? h.logs.filter((log) => log.date.split('T')[0] !== dateStr)
            : [...h.logs, { id: 'temp', date: `${dateStr}T00:00:00.000Z`, habitId, userId: '' }];
          return { ...h, logs: newLogs };
        }
        return h;
      });
      setHabits(updatedHabits);

      if (isLogged) {
        const res = await widgetsApi.unlogHabit(habitId, dateStr);
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await widgetsApi.logHabit(habitId, dateStr);
        if (!res.success) throw new Error(res.error);
        
        if (res.data) {
          setHabits((prev) =>
            prev.map((h) => {
              if (h.id === habitId) {
                return {
                  ...h,
                  logs: h.logs.map((l) => (l.id === 'temp' && l.date.startsWith(dateStr) ? res.data! : l)),
                };
              }
              return h;
            })
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle log');
      fetchHabits();
    }
  };

  const getDayLabel = (date: Date) => {
    const daysName = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return daysName[date.getDay()];
  };

  // Generate days in current month for heatmap
  const getDaysInMonth = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    const result = [];
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      result.push(new Date(d));
    }
    return result;
  };

  const monthDays = getDaysInMonth();
  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

  // Get color for habit completion level
  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800 text-transparent';
    if (count === 1) return 'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-400';
    if (count === 2) return 'bg-red-400 dark:bg-red-700/70 text-white';
    return 'bg-red-600 dark:bg-red-500 text-white';
  };

  return (
    <div className={`flex flex-col gap-4 ${showHeatmap ? 'w-full' : 'h-[240px] justify-between'}`}>
      
      {/* Habits Streaks Card */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-[#1f1f1f] dark:bg-[#111111] min-h-[240px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-red-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Habits Streak Matrix
            </span>
          </div>
        </div>

        {/* Grid Content */}
        <div className="custom-scrollbar my-2 flex-1 overflow-y-auto pr-0.5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader className="h-5 w-5 animate-spin text-red-600 dark:text-red-500" />
            </div>
          ) : error ? (
            <div className="py-2 text-center text-xs text-red-500">{error}</div>
          ) : habits.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-4">
              <p className="text-xs text-slate-400">No habits tracked yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {habits.map((habit) => (
                <div key={habit.id} className="flex flex-col gap-1.5 border-b border-slate-50 pb-2.5 last:border-0 dark:border-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 line-clamp-1 max-w-[150px]">
                      {habit.name}
                    </span>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                      title="Delete Habit"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {/* 7-day checkboxes */}
                  <div className="flex justify-between items-center gap-1.5">
                    {days.map((day) => {
                      const dateStr = getDayString(day);
                      const isCompleted = habit.logs.some((l) => l.date.split('T')[0] === dateStr);
                      const todayStr = getDayString(new Date());
                      const isToday = dateStr === todayStr;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => handleToggleLog(habit.id, day)}
                          className={`flex flex-col items-center justify-center rounded-lg p-1 w-[34px] border transition-all ${
                            isCompleted
                              ? 'bg-red-600 border-red-600 text-white font-bold'
                              : isToday
                              ? 'border-red-500 bg-red-50/10 text-slate-700 dark:text-slate-300'
                              : 'border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-850 dark:bg-slate-800/20 dark:text-slate-550'
                          }`}
                          title={`${habit.name}: ${isCompleted ? 'Done' : 'Not Done'} on ${dateStr}`}
                        >
                          <span className="text-[8px] uppercase">{getDayLabel(day)}</span>
                          {isCompleted ? (
                            <Check className="h-3 w-3 mt-0.5 font-black" />
                          ) : (
                            <span className="text-[10px] mt-0.5">{day.getDate()}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleAddHabit} className="flex gap-1.5 border-t border-slate-100 pt-2 dark:border-[#1f1f1f]">
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-800/40 dark:text-white dark:focus:bg-slate-800"
            placeholder="New habit name..."
            maxLength={50}
          />
          <button
            type="submit"
            disabled={!newHabitName.trim() || submitting}
            className="rounded-lg bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Heatmap Card (Only rendered when showHeatmap=true) */}
      {showHeatmap && !loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest border-b border-slate-100 pb-2 dark:border-[#1f1f1f] mb-4">
            {currentMonthName} Heatmap Grid
          </h3>

          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {monthDays.map((date) => {
              const dateStr = getDayString(date);
              
              // Count completed habits on this date
              const completedCount = habits.filter((h) =>
                h.logs.some((l) => l.date.split('T')[0] === dateStr)
              ).length;

              return (
                <div
                  key={dateStr}
                  className={`w-7 h-7 flex items-center justify-center rounded text-[10px] font-bold transition-all hover:scale-105 ${getHeatmapColorClass(
                    completedCount
                  )}`}
                  title={`${date.toLocaleDateString()}: ${completedCount} habits completed`}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800"></div>
            <div className="w-3.5 h-3.5 rounded bg-red-200 dark:bg-red-900/40"></div>
            <div className="w-3.5 h-3.5 rounded bg-red-400 dark:bg-red-700/70"></div>
            <div className="w-3.5 h-3.5 rounded bg-red-600 dark:bg-red-500"></div>
            <span>More</span>
          </div>
        </div>
      )}

    </div>
  );
}

export default HabitsWidget;
