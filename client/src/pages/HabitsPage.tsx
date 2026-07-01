import { useState, useEffect, useRef } from 'react';
import { widgetsApi } from '../api/widgets';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import {
  Flame,
  Plus,
  Trash2,
  Check,
  Calendar,
  Grid,
  Loader,
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

  // Compute current week days (Monday to Sunday)
  const getCurrentWeekDays = () => {
    const dates = [];
    const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const today = new Date();
    
    // Get Monday of the current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today);
    monday.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const isToday = d.toDateString() === today.toDateString();

      dates.push({
        dateStr,
        dayNum: d.getDate(),
        dayLabel: weekdays[i],
        isToday,
      });
    }
    return dates;
  };

  const weekDays = getCurrentWeekDays();

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
  const currentMonthShort = new Date().toLocaleString('default', { month: 'short' }).toUpperCase();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

 
 
  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800/60 text-transparent border border-transparent';
    if (count === 1) return 'bg-red-200 dark:bg-red-950/30 text-red-800 dark:text-red-400 border border-transparent';
    if (count === 2) return 'bg-red-400 dark:bg-red-800/60 text-white border border-transparent';
    return 'bg-red-655 text-white border border-transparent';
  };

  const calculateSuccessRate = () => {
    if (habits.length === 0) return 0;
    let totalCompletions = 0;
    habits.forEach((h) => {
      h.logs.forEach((log) => {
        const logDate = new Date(log.date);
        if (logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth) {
          totalCompletions++;
        }
      });
    });
    const totalPossible = monthDays.length * habits.length;
    return Math.round((totalCompletions / totalPossible) * 100) || 0;
  };
  const successRate = calculateSuccessRate();

  const totalCompletionsCount = habits.reduce((acc, h) => {
    return acc + h.logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonth;
    }).length;
  }, 0);
  const totalXP = totalCompletionsCount * 10;

  const getHeatmapGrid = () => {
    const today = new Date();
    const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const shift = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const grid = [];
    for (let i = 0; i < shift; i++) {
      grid.push(<div key={`empty-${i}`} className="w-7 h-7 sm:w-8 sm:h-8" />);
    }

    monthDays.forEach((date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dNum = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dNum}`;
      const isToday = date.toDateString() === today.toDateString();
      const completedCount = habits.filter((h) =>
        h.logs.some((l) => l.date === dateStr)
      ).length;

      grid.push(
        <div
          key={dateStr}
          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-[10px] font-bold transition-all hover:scale-105 ${getHeatmapColorClass(
            completedCount
          )} ${
            isToday ? 'border border-dashed border-red-500 ring-2 ring-red-500/10' : ''
          }`}
          title={`${date.toLocaleDateString()}: ${completedCount} habits completed`}
        >
          {date.getDate()}
        </div>
      );
    });

    return grid;
  };

  const HeatmapCard = () => {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] space-y-5 animate-in fade-in duration-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Heatmap</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Your activity density for {currentMonthName}</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-black text-red-655 dark:text-red-500">{successRate}%</h3>
            <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">{currentMonthShort} SUCCESS RATE</p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-450 dark:text-slate-555 mb-2">
            <div>M</div>
            <div>T</div>
            <div>W</div>
            <div>T</div>
            <div>F</div>
            <div>S</div>
            <div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1.5 justify-items-center">
            {getHeatmapGrid()}
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-555">
            <span>INTENSITY</span>
            <div className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-850" />
            <div className="w-3.5 h-3.5 rounded bg-red-200 dark:bg-red-955/30" />
            <div className="w-3.5 h-3.5 rounded bg-red-400 dark:bg-red-800/60" />
            <div className="w-3.5 h-3.5 rounded bg-red-655" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-555 font-bold">
            <div className="w-3.5 h-3.5 rounded border border-dashed border-red-500" />
            <span>TODAY</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800/80">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/20">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Most Active</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">Mornings</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/20">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555">Total Heat</p>
            <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1">{totalXP.toLocaleString()} XP</p>
          </div>
        </div>
      </div>
    );
  };

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
    
    // Optimistic UI Update using functional state to ensure fresh state
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updatedLogs = isLogged
            ? h.logs.filter((l) => l.date !== dateStr)
            : [...h.logs, { id: 'temp-' + Date.now(), date: dateStr }];
          return { ...h, logs: updatedLogs };
        }
        return h;
      })
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
          setHabits((prev) =>
            prev.map((h) =>
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



      {/* Main Content */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          
          <div className="space-y-6">
            
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-[#1f1f1f]">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Habits Tracker</h1>
                <p className="text-xs text-slate-500 mt-0.5">Build consistency daily and maintain your flame streaks.</p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-250 bg-slate-100/50 p-1 dark:border-slate-800 dark:bg-[#111111] w-full sm:w-auto shrink-0">
                <button
                  onClick={() => setShowHeatmap(false)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    !showHeatmap
                      ? 'bg-gradient-to-r from-red-500 to-red-650 text-white shadow-sm shadow-red-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Grid className="h-3.5 w-3.5" /> 7-Day Grid
                </button>
                <button
                  onClick={() => setShowHeatmap(true)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    showHeatmap
                      ? 'bg-gradient-to-r from-red-500 to-red-650 text-white shadow-sm shadow-red-500/10'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" /> Heatmap
                </button>
              </div>
            </div>

            {/* Layout Grid */}
            {!showHeatmap ? (
              // 7-Day Grid View (Desktop shows side-by-side, Mobile shows list only)
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Input + Habit Cards (2/3 width on desktop) */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Add Habit input card */}
                  <form onSubmit={handleCreateHabit} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-550">
                      <Plus className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      placeholder="Enter a new habit name..."
                      className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
                      maxLength={50}
                    />
                    <button
                      type="submit"
                      disabled={createLoading || !newHabitName.trim()}
                      className="rounded-lg bg-gradient-to-r from-red-500 to-red-650 p-2 sm:px-4 sm:py-2 text-xs font-bold text-white hover:from-red-600 hover:to-red-750 transition-all active:scale-95 disabled:opacity-50 shadow-sm shadow-red-500/20 flex items-center justify-center shrink-0"
                    >
                      {createLoading ? (
                        <span className="sm:block hidden">ADDING...</span>
                      ) : (
                        <span className="sm:block hidden">ADD HABIT</span>
                      )}
                      <Plus className="h-4 w-4 sm:hidden block" />
                    </button>
                  </form>

                  {/* Habits list */}
                  {habits.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                      <Flame className="mx-auto h-12 w-12 text-slate-355 dark:text-slate-700 animate-pulse mb-3" />
                      <p className="text-xs text-slate-400 dark:text-slate-550 font-semibold">No habits monitored yet. Create one above to begin!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {habits.map((habit) => {
                        const streak = calculateStreak(habit.logs);
                        return (
                          <div key={habit.id} className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-3 sm:gap-4">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div>
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
                                      className="rounded border border-red-500 bg-white px-2 py-0.5 text-sm font-semibold text-slate-900 focus:outline-none dark:bg-slate-800/60 dark:text-white w-full max-w-[200px]"
                                    />
                                  ) : (
                                    <div className="flex flex-col">
                                      <h3
                                        onClick={() => handleStartEditing(habit)}
                                        className="text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer hover:underline"
                                        title="Click to rename"
                                      >
                                        {habit.name}
                                      </h3>
                                      {streak > 0 ? (
                                        <span className="flex items-center gap-1 text-[10px] font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                                          <Flame className="h-3 w-3 fill-red-500 text-red-500" /> {streak} DAY STREAK
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-550 mt-0.5">
                                          <Flame className="h-3 w-3 text-slate-400 dark:text-slate-550" /> 0 DAY STREAK
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:text-slate-550 dark:hover:bg-red-950/20 dark:hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-155"
                                title="Delete Habit"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Checkboxes grid */}
                            <div className="flex justify-between items-center gap-1 sm:gap-2">
                              {weekDays.map((d) => {
                                const isChecked = habit.logs.some((l) => l.date === d.dateStr);
                                return (
                                  <div key={d.dateStr} className="flex flex-col items-center flex-1">
                                    <span className="hidden sm:block text-[9px] font-bold text-slate-400 dark:text-slate-550 mb-1.5 text-center uppercase">
                                      {d.dayLabel}
                                    </span>
                                    <button
                                      onClick={() => handleToggleLog(habit.id, d.dateStr)}
                                      className={`w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center rounded-lg border transition-all active:scale-90 duration-150 ${
                                        isChecked
                                          ? 'border-red-655 bg-gradient-to-br from-red-500 to-red-655 text-white shadow-sm shadow-red-500/20'
                                          : d.isToday
                                          ? 'border-2 border-dashed border-red-500 bg-red-50/5 text-red-500'
                                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-350 dark:border-slate-800 dark:bg-slate-800/10 dark:hover:border-slate-750'
                                      }`}
                                    >
                                      {isChecked ? (
                                        <Check className="h-4 w-4 stroke-[3]" />
                                      ) : d.isToday ? (
                                        <>
                                          <span className="text-[8px] font-black sm:block hidden">TODAY</span>
                                          <span className="text-[10px] font-bold sm:hidden block">{d.dayLabel.charAt(0)}</span>
                                        </>
                                      ) : (
                                        <span className="text-[10px] font-bold sm:hidden block text-slate-455 dark:text-slate-555">
                                          {d.dayLabel.charAt(0)}
                                        </span>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Monthly Heatmap Sidebar (1/3 width on desktop, hidden on mobile) */}
                <div className="hidden lg:block">
                  <HeatmapCard />
                </div>

              </div>
            ) : (
              // Heatmap Full View (Desktop shows full-width heatmap card, Mobile shows heatmap card only)
              <div className="max-w-2xl mx-auto">
                <HeatmapCard />
              </div>
            )}

            

          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab="habits" />

    </div>
  );
}

export default HabitsPage;
