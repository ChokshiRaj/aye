import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import {
  LayoutDashboard,
  Calendar,
  Flame,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Bell,
  BarChart2,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

export function Sidebar({ expanded, setExpanded }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync theme class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/notifications/unread-count');
      if (res.data && res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleItemClick = (id: string) => {
    if (id === 'dashboard') {
      navigate('/dashboard');
    } else if (id === 'calendar') {
      navigate('/calendar');
    } else if (id === 'habits') {
      navigate('/habits');
    } else if (id === 'markets') {
      navigate('/markets');
    } else if (id === 'settings') {
      navigate('/settings');
    } else if (id === 'notifications') {
      navigate('/notifications');
    } else if (id === 'analytics') {
      navigate('/analytics');
    } else {
      navigate(`/dashboard?view=${id}`);
    }
  };

  let currentActive = 'dashboard';
  if (location.pathname === '/calendar') {
    currentActive = 'calendar';
  } else if (location.pathname === '/habits') {
    currentActive = 'habits';
  } else if (location.pathname === '/markets') {
    currentActive = 'markets';
  } else if (location.pathname === '/settings') {
    currentActive = 'settings';
  } else if (location.pathname === '/notifications') {
    currentActive = 'notifications';
  } else if (location.pathname === '/analytics') {
    currentActive = 'analytics';
  } else {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    currentActive = viewParam || 'dashboard';
  }

  return (
    <aside
      className={`fixed bottom-0 left-0 top-0 z-50 hidden h-screen border-r border-slate-200 bg-white transition-all duration-300 dark:border-[#1f1f1f] dark:bg-[#111111] md:flex flex-col justify-between ${
        expanded ? 'w-[220px]' : 'w-[60px]'
      }`}
    >
      {/* Top Section: Logo & Toggle */}
      <div>
        <div className="relative flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-[#1f1f1f]">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-sm font-bold text-white shrink-0">
              A
            </span>
            {expanded && (
              <span className="text-xl font-bold tracking-widest text-red-600 dark:text-red-500 animate-in fade-in duration-200">
                AYE
              </span>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="absolute -right-3 top-5 rounded-full border border-slate-200 bg-white p-1 text-slate-550 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {expanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="mt-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentActive === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`group flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-l-4 border-red-600 bg-red-50/50 text-red-600 dark:bg-red-950/10 dark:text-red-400'
                    : 'border-l-4 border-transparent text-slate-550 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="relative shrink-0">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-red-600 dark:text-red-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500'
                    }`}
                  />
                  {!expanded && item.id === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-2 w-2 rounded-full bg-red-600 ring-2 ring-white dark:ring-[#111111] animate-pulse" />
                  )}
                </div>
                {expanded && (
                  <span className="truncate animate-in fade-in duration-150 flex-1 text-left">
                    {item.label}
                  </span>
                )}
                {expanded && item.id === 'notifications' && unreadCount > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shrink-0 leading-none">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Theme & Profile */}
      <div className="px-2 pb-4 space-y-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className={`flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-semibold text-slate-550 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50`}
          title="Toggle Theme"
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              {expanded && <span className="animate-in fade-in duration-150">Dark Mode</span>}
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 text-amber-500" />
              {expanded && <span className="animate-in fade-in duration-150">Light Mode</span>}
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-lg py-2.5 px-3 text-sm font-semibold text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-4 w-4 shrink-0 text-red-500" />
          {expanded && <span className="animate-in fade-in duration-150">Logout</span>}
        </button>

        {/* User Info */}
        {user && (
          <div className="flex h-14 items-center gap-3 border-t border-slate-100 px-2 pt-3 dark:border-[#1f1f1f]">
            <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-400">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            {expanded && (
              <div className="overflow-hidden animate-in fade-in duration-150">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {user.name}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
