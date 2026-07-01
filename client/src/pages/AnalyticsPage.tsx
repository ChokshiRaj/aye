import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import api from '../api/axios';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart2,
  Calendar,
  CheckCircle,
  Clock,
  Flame,
  Loader,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsData {
  todos: {
    total: number;
    completed: number;
    rate: number;
  };
  focus: {
    totalSessions: number;
    totalMinutes: number;
    history: { date: string; minutes: number }[];
  };
  habits: {
    id: string;
    name: string;
    totalCompletions: number;
    weeklyCompletionRate: number;
    currentStreak: number;
    longestStreak: number;
  }[];
  heatmap: { date: string; count: number }[];
}

export function AnalyticsPage() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/analytics');
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  // Fallback defaults
  const stats = data || {
    todos: { total: 0, completed: 0, rate: 0 },
    focus: { totalSessions: 0, totalMinutes: 0, history: [] },
    habits: [],
    heatmap: [],
  };

  // Pie chart data preparation
  const todoPieData = [
    { name: 'Completed', value: stats.todos.completed },
    { name: 'Remaining', value: Math.max(0, stats.todos.total - stats.todos.completed) },
  ];
  const COLORS = ['#ef4444', '#e2e8f0']; // Red and Slate-200
  const DARK_COLORS = ['#ef4444', '#1f1f1f']; // Red and dark grey

  // Heatmap helper: past 365 days
  const heatmapDays = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    heatmapDays.push(d);
  }

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-[#111111]/60 border border-slate-200/20';
    if (count <= 2) return 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-400';
    if (count <= 4) return 'bg-red-300 text-red-900 dark:bg-red-800/60 dark:text-red-300';
    return 'bg-red-500 text-white dark:bg-red-600 dark:text-white';
  };

  // Format date for heatmap tooltip
  const formatHeatmapDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Convert minutes to hours & minutes string
  const formatFocusHours = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Sidebar navigation */}
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />



      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        <main className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1f1f1f] pb-4 mb-6">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-red-600" /> Analytics Insights
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Visualize your productivity, habits, and study logs.</p>
            </div>
            
            <button
              onClick={fetchAnalytics}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
              title="Sync Stats"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Focus Session Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Focus Session Duration</span>
                <Clock className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {formatFocusHours(stats.focus.totalMinutes)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Over {stats.focus.totalSessions} study intervals
                </p>
              </div>
            </div>

            {/* Todo Rate Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Tasks Completed</span>
                <CheckCircle className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.todos.completed} / {stats.todos.total}
                </h3>
                <p className="text-[10px] text-slate-450 mt-0.5">
                  {stats.todos.rate}% completion rate
                </p>
              </div>
            </div>

            {/* Habits Logged Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Habits Tracked</span>
                <Flame className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.habits.length} Habits
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Across daily and weekly intervals
                </p>
              </div>
            </div>

            {/* Best Streak Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Longest Habit Streak</span>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </div>
              <div className="mt-2.5">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {stats.habits.length > 0 ? Math.max(...stats.habits.map((h) => h.longestStreak)) : 0} Days
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Consecutive completion record
                </p>
              </div>
            </div>
          </div>

          {/* Heatmap Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] mb-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-red-655" /> 365-Day Activity Ledger
            </h2>
            <p className="text-xs text-slate-400 mb-4 leading-normal">
              Heatmap representation of daily actions compiled from check-ins, Pomodoro timer completes, and tasks checked off.
            </p>

            <div className="relative overflow-x-auto">
              <div className="grid grid-flow-col grid-rows-7 gap-[4px] min-w-[720px] pb-2 pt-1">
                {heatmapDays.map((date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const act = stats.heatmap.find((h) => h.date === dateStr);
                  const count = act ? act.count : 0;
                  const color = getHeatmapColor(count);
                  return (
                    <div
                      key={dateStr}
                      className={`h-2.5 w-2.5 rounded-sm ${color} transition-all hover:scale-125 duration-100 cursor-pointer`}
                      title={`${formatHeatmapDate(date)}: ${count} activities`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-100 dark:bg-[#111111]/60" />
              <span className="h-2.5 w-2.5 rounded-sm bg-red-100 dark:bg-red-950/20" />
              <span className="h-2.5 w-2.5 rounded-sm bg-red-300 dark:bg-red-800/60" />
              <span className="h-2.5 w-2.5 rounded-sm bg-red-500 dark:bg-red-600" />
              <span>More</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Area Chart: Focus Study Hours */}
            <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Focus Time (Past 7 Days)
              </h2>
              {stats.focus.history.length === 0 ? (
                <div className="flex h-60 items-center justify-center text-xs text-slate-400">
                  No focus session logs found for this week.
                </div>
              ) : (
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={stats.focus.history}>
                      <defs>
                        <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(d) => {
                          const dateObj = new Date(d);
                          return dateObj.toLocaleDateString(undefined, { weekday: 'short' });
                        }}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#111111',
                          border: '1px solid #1f1f1f',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        formatter={(val: number) => [`${val} minutes`, 'Focus duration']}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="#ef4444"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorFocus)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie Chart: Todo Breakup */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                Todo Completion Ratio
              </h2>
              {stats.todos.total === 0 ? (
                <div className="flex h-60 items-center justify-center text-xs text-slate-400">
                  Create todos to populate ratio metrics.
                </div>
              ) : (
                <div className="h-60 w-full flex flex-col justify-around">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={todoPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {todoPieData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                document.documentElement.classList.contains('dark')
                                  ? DARK_COLORS[index % DARK_COLORS.length]
                                  : COLORS[index % COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#111111',
                            border: '1px solid #1f1f1f',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                          itemStyle={{ color: '#ffffff' }}
                          labelStyle={{ color: '#ffffff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      Completed ({stats.todos.completed})
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                      Pending ({Math.max(0, stats.todos.total - stats.todos.completed)})
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Habit Streak Table / Bars */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] mb-6">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
              Habit Completion Comparison
            </h2>

            {stats.habits.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Configure habits to track streaks and completion metrics.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.habits.map((habit) => (
                  <div key={habit.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>{habit.name}</span>
                      <span className="text-slate-400 flex items-center gap-2">
                        <span>Current Streak: <strong className="text-red-550">{habit.currentStreak}</strong> d</span>
                        <span>Longest: <strong>{habit.longestStreak}</strong> d</span>
                        <span>Completions: <strong>{habit.totalCompletions}</strong></span>
                      </span>
                    </div>
                    {/* Progress Bar of Weekly Completion */}
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-850 overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, habit.weeklyCompletionRate))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>7-Day Consistency</span>
                      <span>{habit.weeklyCompletionRate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>

      {/* Mobile Sticky Navigation Footer */}
      <BottomNav activeTab="more" />

    </div>
  );
}

export default AnalyticsPage;
