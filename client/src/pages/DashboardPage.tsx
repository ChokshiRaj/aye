import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { widgetsApi } from '../api/widgets';
import { authApi } from '../api/auth';
import { Settings as SettingsType } from '../types';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';

// Widgets
import ClockWidget from '../components/widgets/ClockWidget';
import WeatherWidget from '../components/widgets/WeatherWidget';
import QuoteWidget from '../components/widgets/QuoteWidget';
import TodoWidget from '../components/widgets/TodoWidget';
import NewsWidget from '../components/widgets/NewsWidget';

import EventsWidget from '../components/widgets/EventsWidget';
import TimerWidget from '../components/widgets/TimerWidget';
import HabitsWidget from '../components/widgets/HabitsWidget';
import BookmarksWidget from '../components/widgets/BookmarksWidget';
import FinanceWidget from '../components/widgets/FinanceWidget';
import NotesWidget from '../components/widgets/NotesWidget';
import GmailWidget from '../components/widgets/GmailWidget';

import { Loader, Globe, Settings as SettingsIcon, ShieldCheck, TrendingUp } from 'lucide-react';
import { PWAInstallBanner } from '../components/layout/PWAInstallBanner';

export function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState(searchParams.get('view') || 'dashboard');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Settings
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mobile More tab session states
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);


  const fetchSettings = async () => {
    try {
      const res = await widgetsApi.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      } else {
        setError(res.error || 'Failed to load user settings');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching user settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update active view from search query parameter
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      setActiveView(viewParam);
    }
  }, [searchParams]);

  // Fetch active sessions for mobile 'More' tab
  useEffect(() => {
    if (activeView === 'more') {
      const fetchSessions = async () => {
        setSessionsLoading(true);
        try {
          const res = await authApi.getSessions();
          if (res.success && res.data) {
            setSessions(res.data.sessions);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setSessionsLoading(false);
        }
      };
      fetchSessions();
    }
  }, [activeView]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-red-600 dark:text-red-500" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Provisioning command centre...
          </p>
        </div>
      </div>
    );
  }

  const weatherCity = settings?.city || 'Vadodara';
  const financeTickers = settings?.stockTickers || ['NIFTY', 'RELIANCE', 'TCS'];

  // Helper to parse user agent
  const parseUserAgent = (ua: string) => {
    if (ua.includes('Chrome') && ua.includes('Safari')) {
      if (ua.includes('Edg')) return 'Microsoft Edge';
      return 'Google Chrome';
    }
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Apple Safari';
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Postman')) return 'Postman App';
    return ua.split('/')[0] || 'Browser';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Collapsible Left Sidebar (Desktop) */}
      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />



      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
          
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400">
              ⚠️ Warning: {error}. Widget synchronization may be limited.
            </div>
          )}

          {/* Desktop Dashboard Grid View */}
          {activeView === 'dashboard' && (
            <>
              {/* Desktop 12-Column Responsive Layout */}
              <div className="hidden md:grid grid-cols-12 gap-3.5">
                {/* Row 1: Clock (4), Weather (4), Quote (4) */}
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <ClockWidget />
                </div>
                <div className="col-span-12 md:col-span-6 lg:col-span-4">
                  <WeatherWidget city={weatherCity} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <QuoteWidget />
                </div>

                {/* Row 2: Todo (5), News (7) */}
                <div className="col-span-12 lg:col-span-5">
                  <TodoWidget />
                </div>
                <div className="col-span-12 lg:col-span-7">
                  <NewsWidget />
                </div>

                {/* Row 3: Events (6), Timer (3), Habits (3) */}
                <div className="col-span-12 sm:col-span-6">
                  <EventsWidget />
                </div>
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                  <TimerWidget />
                </div>
                <div className="col-span-12 sm:col-span-6 lg:col-span-3">
                  <HabitsWidget />
                </div>

                {/* Row 4: Bookmarks (4), Finance (4), Gmail (4) */}
                <div className="col-span-12 lg:col-span-4">
                  <BookmarksWidget />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <FinanceWidget tickers={financeTickers} />
                </div>
                <div className="col-span-12 lg:col-span-4">
                  <GmailWidget />
                </div>

                {/* Row 5: Notes (12) */}
                <div className="col-span-12">
                  <NotesWidget />
                </div>
              </div>

              {/* Mobile Home Stacked Widget Layout */}
              <div className="block md:hidden space-y-4">
                <div className="space-y-3">
                  <ClockWidget />
                  <WeatherWidget city={weatherCity} />
                </div>
                <EventsWidget />
                <TodoWidget />
                <NewsWidget />
                <TimerWidget />
                <FinanceWidget tickers={financeTickers} />
                <GmailWidget />
                <QuoteWidget />
              </div>
            </>
          )}

          {/* Calendar View */}
          {activeView === 'calendar' && (
            <div className="animate-in fade-in duration-200">
              <EventsWidget />
            </div>
          )}

          {/* Habits View */}
          {activeView === 'habits' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <HabitsWidget showHeatmap={true} />
            </div>
          )}

          {/* Notes View */}
          {activeView === 'notes' && (
            <div className="h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-200">
              <NotesWidget fullHeight={true} />
            </div>
          )}

          {/* Bookmarks View (Desktop Sidebar Nav fallback) */}
          {activeView === 'bookmarks' && (
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
              <BookmarksWidget />
            </div>
          )}

          {/* Mobile "More" Submenu Tab */}
          {activeView === 'more' && (
            <div className="block md:hidden space-y-4 animate-in fade-in duration-200">
              {/* Bookmarks Widget */}
              <BookmarksWidget />

              {/* Markets & Settings Shortcut Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] flex flex-col gap-2">
                <Link
                  to="/markets"
                  className="flex items-center justify-between w-full rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Markets Command Centre
                  </span>
                  <span>→</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center justify-between w-full rounded-lg bg-red-50 p-3 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
                >
                  <span className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" /> Account & Widget Settings
                  </span>
                  <span>→</span>
                </Link>
              </div>

              {/* Active Sessions List */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2 dark:border-[#1f1f1f] mb-3">
                  <ShieldCheck className="h-4 w-4 text-red-650 dark:text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-550">
                    Active Sessions
                  </span>
                </div>
                {sessionsLoading ? (
                  <div className="py-4 text-center">
                    <Loader className="mx-auto h-4 w-4 animate-spin text-red-600 dark:text-red-550" />
                  </div>
                ) : (
                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-850">
                    {sessions.map((s) => (
                      <div key={s.id} className={`flex items-start gap-2.5 pt-3 first:pt-0`}>
                        <div className="rounded bg-slate-50 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-750 dark:text-slate-200 truncate">
                              {parseUserAgent(s.userAgent)}
                            </span>
                            {s.isCurrent && (
                              <span className="rounded bg-emerald-50 px-1 py-0.5 text-[8px] font-bold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">
                            IP: {s.ip} | {new Date(s.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PWA installation banner */}
      {activeView === 'dashboard' && <PWAInstallBanner />}

      {/* Fixed Bottom Navigation Bar (Mobile) */}
      <BottomNav activeTab={activeView} />

    </div>
  );
}

export default DashboardPage;
