import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, Flame, FileText, Menu, Sun, Moon, Bell } from 'lucide-react';
import api from '../../api/axios';

interface BottomNavProps {
  activeTab: string;
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'habits', label: 'Habits', icon: Flame },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'more', label: 'More', icon: Menu },
  ];

  const handleTabClick = (id: string) => {
    if (id === 'dashboard') {
      navigate('/dashboard');
    } else if (id === 'calendar') {
      navigate('/calendar');
    } else if (id === 'habits') {
      navigate('/habits');
    } else if (id === 'notifications') {
      navigate('/notifications');
    } else if (id === 'analytics') {
      navigate('/analytics');
    } else {
      navigate(`/dashboard?view=${id}`);
    }
  };

  let currentTab = activeTab;
  if (location.pathname === '/calendar') {
    currentTab = 'calendar';
  } else if (location.pathname === '/habits') {
    currentTab = 'habits';
  } else if (location.pathname === '/settings') {
    currentTab = 'more';
  } else if (location.pathname === '/notifications') {
    currentTab = 'more';
  } else if (location.pathname === '/analytics') {
    currentTab = 'more';
  } else if (location.pathname === '/markets') {
    currentTab = 'more';
  } else {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get('view');
    currentTab = viewParam || 'dashboard';
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-slate-200 bg-white/95 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#111111]/95 md:hidden items-center justify-around pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="flex flex-col items-center justify-center w-12 h-full text-center group"
          >
            <Icon
              className={`h-5 w-5 transition-colors ${
                isActive ? 'text-red-655 dark:text-red-500' : 'text-slate-400 dark:text-slate-550'
              }`}
            />
            <span
              className={`mt-1 text-[10px] font-bold transition-colors ${
                isActive ? 'text-red-650 dark:text-red-500' : 'text-slate-400 dark:text-slate-550'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function MobileHeader() {
  const navigate = useNavigate();
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

  // Fetch unread count for mobile badge
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/api/notifications/unread-count');
        if (res.data && res.data.success) {
          setUnreadCount(res.data.data.count);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#0a0a0a]/90 md:hidden">
      <button
        onClick={() => navigate('/notifications')}
        className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-450 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        aria-label="View Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-red-650 ring-2 ring-white dark:ring-[#0a0a0a] animate-pulse" />
        )}
      </button>
      <span className="text-lg font-black tracking-widest text-red-655 dark:text-red-550">
        AYE
      </span>
      <button
        onClick={toggleTheme}
        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-450 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        aria-label="Toggle Theme"
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    </header>
  );
}
