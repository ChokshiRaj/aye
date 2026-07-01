import { useState, useEffect, useRef } from 'react';
import { widgetsApi } from '../api/widgets';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav, MobileHeader } from '../components/layout/BottomNav';
import HabitsWidget from '../components/widgets/HabitsWidget';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  Calendar,
  Grid,
  Loader,
  TrendingUp,
} from 'lucide-react';

interface HabitLog {
  id: string;
  date: string;
}

interface Habit {
  id: string;
  name: string;
  logs: HabitLog[];
}

export function HabitsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // New Habit creation
  const [newHabitName, setNewHabitName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Heatmap vs Matrix toggle
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchHabits = async () => {
    try {
      const res = await widgetsApi.getHabits();
      if (res.success && res.data) {
        // Ensure logs dates are formatted as YYYY-MM-DD
        const formattedHabits = res.data.map((h: any) => ({
          ...h,
          logs: h.logs.map((log: any) => ({
            ...log,
            date: log.date.split('T')[0],
          })),
        }));
        setHabits(formattedHabits);
      } else {
        console.error(res.error || 'Failed to load habits');
      }
    } catch (err: any) {
      console.error(err.message || 'Error fetching habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Set focus on input during inline editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Compute last 7 days (left to right: 6 days ago -> today)
  const getPastSevenDays = () => {
    const dates = [];
    const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      dates.push({
        dateStr,
        dayNum: d.getDate(),
        dayLabel: weekdays[d.getDay()],
        isToday: i === 0,
      });
    }
    return dates;
  };

  const lastSevenDays = getPastSevenDays();

  // Streak calculation logic
  const calculateStreak = (logs: HabitLog[]) => {
    const logDates = new Set(logs.map((l) => l.date));
    let streak = 0;
    const today = new Date();

    const formatDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    let checkDate = new Date(today);
    const todayStr = formatDateStr(checkDate);

    if (logDates.has(todayStr)) {
      while (logDates.has(formatDateStr(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = formatDateStr(checkDate);
      if (logDates.has(yesterdayStr)) {
        while (logDates.has(formatDateStr(checkDate))) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
    }

    return streak;
  };

  // Toggle log completion
  const handleToggleLog = async (habitId: string, dateStr: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const isLogged = habit.logs.some((l) => l.date === dateStr);
    
    // Optimistic UI Update
    let updatedLogs;
    if (isLogged) {
      updatedLogs = habit.logs.filter((l) => l.date !== dateStr);
    } else {
      updatedLogs = [...habit.logs, { id: 'temp-' + Date.now(), date: dateStr }];
    }

    setHabits(
      habits.map((h) => (h.id === habitId ? { ...h, logs: updatedLogs } : h))
    );

    try {
      if (isLogged) {
        const res = await widgetsApi.unlogHabit(habitId, dateStr);
        if (!res.success) {
          fetchHabits(); // Rollback
        }
      } else {
        const res = await widgetsApi.logHabit(habitId, dateStr);
        if (res.success && res.data) {
          // Replace temp log with actual log
          setHabits(
            habits.map((h) =>
              h.id === habitId
                ? {
                    ...h,
                    logs: h.logs.map((l) =>
                      l.date === dateStr ? { id: res.data!.id, date: dateStr } : l
                    ),
                  }
                : h
            )
          );
        } else {
          fetchHabits(); // Rollback
        }
      }
    } catch (err) {
      fetchHabits(); // Rollback
    }
  };

  // Create Habit
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || createLoading) return;

    setCreateLoading(true);
    try {
      const res = await widgetsApi.createHabit(newHabitName.trim());
      if (res.success && res.data) {
        const newHabit = {
          id: res.data.id,
          name: res.data.name,
          logs: [],
        };
        setHabits([...habits, newHabit]);
        setNewHabitName('');
      } else {
        alert(res.error || 'Failed to create habit');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating habit');
    } finally {
      setCreateLoading(false);
    }
  };

  // Inline Edit Rename
  const handleStartEditing = (habit: Habit) => {
    setEditingId(habit.id);
    setEditName(habit.name);
  };

  const handleSaveRename = async (id: string) => {
    if (!editName.trim() || editName.trim() === habits.find((h) => h.id === id)?.name) {
      setEditingId(null);
      return;
    }

    // Optimistic Update
    setHabits(habits.map((h) => (h.id === id ? { ...h, name: editName.trim() } : h)));
    setEditingId(null);

    try {
      const res = await widgetsApi.updateHabit(id, editName.trim());
      if (!res.success) {
        fetchHabits();
        alert(res.error || 'Failed to update habit name');
      }
    } catch (err: any) {
      fetchHabits();
      alert(err.message || 'Error updating habit name');
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this habit? Doing so will permanently wipe your streak logs!'
      )
    )
      return;

    const originalHabits = [...habits];
    setHabits(habits.filter((h) => h.id !== id));

    try {
      const res = await widgetsApi.deleteHabit(id);
      if (!res.success) {
        setHabits(originalHabits);
        alert(res.error || 'Failed to delete habit');
      }
    } catch (err: any) {
      setHabits(originalHabits);
      alert(err.message || 'Error deleting habit');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-red-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Loading habits tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Desktop Sidebar */}
      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* Mobile Wordmark Header */}
      <MobileHeader />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
          
          <div className="space-y-6">
            
            {/* Header Controls */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#1f1f1f]">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Habits Tracker</h1>
                <p className="text-xs text-slate-500 mt-0.5">Build consistency daily and maintain your flame streaks.</p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-250 bg-slate-100/50 p-1 dark:border-slate-800 dark:bg-[#111111]">
                <button
                  onClick={() => setShowHeatmap(false)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    !showHeatmap
                      ? 'bg-gradient-to-r from-red-500 to-red-650 text-white shadow-sm shadow-red-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" /> 7-Day Grid
                </button>
                <button
                  onClick={() => setShowHeatmap(true)}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    showHeatmap
                      ? 'bg-gradient-to-r from-red-500 to-red-650 text-white shadow-sm shadow-red-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" /> Heatmap
                </button>
              </div>
            </div>

            {/* Rendering the Matrix lists */}
            {!showHeatmap ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] space-y-6">
                
                {habits.length === 0 ? (
                  <div className="text-center py-12">
                    <Flame className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 animate-pulse mb-3" />
                    <p className="text-xs text-slate-450 font-semibold">No habits monitored yet. Create one below to begin!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto pr-1">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 w-2/5">Habit Details</th>
                          
                          {/* 7 Days Columns Headers */}
                          {lastSevenDays.map((d) => (
                            <th
                              key={d.dateStr}
                              className={`pb-3 text-center text-[10px] font-bold uppercase ${
                                d.isToday
                                  ? 'text-red-500 dark:text-red-400 font-extrabold'
                                  : 'text-slate-400 dark:text-slate-550'
                              }`}
                            >
                              <div>{d.dayLabel}</div>
                              <div className={`mt-0.5 mx-auto flex h-5.5 w-5.5 items-center justify-center rounded-md text-[10px] font-bold transition-all ${
                                d.isToday
                                  ? 'bg-red-650 text-white font-extrabold shadow-sm shadow-red-500/20'
                                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400'
                              }`}>
                                {d.dayNum}
                              </div>
                            </th>
                          ))}
                          
                          <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-550 w-[80px]">Actions</th>
                        </tr>
                      </thead>
                      
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {habits.map((habit) => {
                          const streak = calculateStreak(habit.logs);
                          
                          return (
                            <tr key={habit.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                              
                              {/* Inline Editable Habit Name + Streak */}
                              <td className="py-4 pr-3">
                                {editingId === habit.id ? (
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onBlur={() => handleSaveRename(habit.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(habit.id);
                                      if (e.key === 'Escape') setEditingId(null);
                                    }}
                                    className="rounded border border-red-500 bg-white px-2 py-0.5 text-xs font-semibold text-slate-900 focus:outline-none dark:bg-slate-800/60 dark:text-white w-full max-w-[200px]"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span
                                      onClick={() => handleStartEditing(habit)}
                                      className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:underline"
                                      title="Click to rename inline"
                                    >
                                      {habit.name}
                                    </span>
                                    {streak > 0 && (
                                      <span className="flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-extrabold text-red-600 dark:bg-red-950/20 dark:text-red-400">
                                        <Flame className="h-3 w-3 fill-red-500 text-red-500" /> {streak}d
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* 7 Toggles Cells */}
                              {lastSevenDays.map((d) => {
                                const isChecked = habit.logs.some((l) => l.date === d.dateStr);
                                
                                return (
                                  <td key={d.dateStr} className="py-4 text-center">
                                    <button
                                      onClick={() => handleToggleLog(habit.id, d.dateStr)}
                                      className={`mx-auto flex h-6.5 w-6.5 items-center justify-center rounded-md border transition-all active:scale-90 duration-150 ${
                                        isChecked
                                          ? 'border-red-600 bg-gradient-to-br from-red-500 to-red-650 text-white shadow-sm shadow-red-500/30'
                                          : d.isToday
                                          ? 'border-red-550 bg-red-50/5 text-transparent hover:border-red-500 dark:border-red-900/50'
                                          : 'border-slate-200 bg-slate-50 text-transparent hover:border-slate-350 dark:border-slate-800 dark:bg-slate-800/10 dark:hover:border-slate-600'
                                      } ${d.isToday ? 'ring-2 ring-red-500/20' : ''}`}
                                    >
                                      <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                                    </button>
                                  </td>
                                );
                              })}

                              {/* Action Row */}
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => handleDeleteHabit(habit.id)}
                                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-500 dark:hover:bg-red-950/20 dark:hover:text-red-450 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-155"
                                  title="Delete Habit"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Habit Form Panel */}
                <form onSubmit={handleCreateHabit} className="border-t border-slate-100 pt-5 dark:border-[#1f1f1f] flex gap-2">
                  <input
                    type="text"
                    required
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Enter new habit name... (e.g. Read 10 pages)"
                    className="flex-1 rounded-lg border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-[#111111] dark:text-white dark:focus:bg-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={createLoading || !newHabitName.trim()}
                    className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-500 to-red-650 px-4 py-2 text-xs font-bold text-white hover:from-red-600 hover:to-red-750 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-red-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </form>

              </div>
            ) : (
              // Heatmap Full View
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                <HabitsWidget showHeatmap={true} />
              </div>
            )}

            {/* Premium details indicator */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-150 bg-slate-50/50 p-3.5 dark:border-[#1f1f1f] dark:bg-slate-800/10">
              <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Your streak resets if yesterday was not marked completed. Make sure to log completions before midnight!
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab="habits" />

    </div>
  );
}

export default HabitsPage;
