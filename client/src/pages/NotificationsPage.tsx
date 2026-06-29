import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav, MobileHeader } from '../components/layout/BottomNav';
import api from '../api/axios';
import {
  Bell,
  Check,
  Flame,
  Calendar,
  Timer,
  Trash2,
  CheckSquare,
  Loader,
  X,
  Inbox,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'HABIT' | 'EVENT' | 'TODO' | 'SYSTEM' | 'FOCUS';
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Filters: All | Unread | Habits | Events | Todos | System
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD' | 'HABIT' | 'EVENT' | 'TODO' | 'SYSTEM'>('ALL');

  const fetchNotifications = async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      const res = await api.get(`/api/notifications?page=${pageNum}&limit=20`);
      if (res.data && res.data.success) {
        const { notifications: list, pagination } = res.data.data;
        if (append) {
          setNotifications((prev) => [...prev, ...list]);
        } else {
          setNotifications(list);
        }
        setHasMore(pageNum < pagination.pages);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
    setPage(1);
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    fetchNotifications(next, true);
    setPage(next);
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const res = await api.patch('/api/notifications/read-all');
      if (res.data && res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    setActionLoading(true);
    try {
      const res = await api.delete('/api/notifications/clear-all');
      if (res.data && res.data.success) {
        setNotifications([]);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to clear all:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkSingleRead = async (id: string, link: string | null) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      await api.patch(`/api/notifications/${id}/read`);
      if (link) {
        navigate(link);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await api.delete(`/api/notifications/${id}`);
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const getTypeConfig = (type: NotificationItem['type']) => {
    switch (type) {
      case 'TODO':
        return {
          icon: <CheckSquare className="h-4 w-4" />,
          color: 'border-blue-500 text-blue-500 bg-blue-50/40 dark:bg-blue-950/10',
        };
      case 'HABIT':
        return {
          icon: <Flame className="h-4 w-4" />,
          color: 'border-emerald-500 text-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10',
        };
      case 'EVENT':
        return {
          icon: <Calendar className="h-4 w-4" />,
          color: 'border-red-500 text-red-500 bg-red-50/40 dark:bg-red-950/10',
        };
      case 'FOCUS':
        return {
          icon: <Timer className="h-4 w-4" />,
          color: 'border-purple-500 text-purple-500 bg-purple-50/40 dark:bg-purple-950/10',
        };
      case 'SYSTEM':
      default:
        return {
          icon: <Bell className="h-4 w-4" />,
          color: 'border-slate-500 text-slate-500 bg-slate-50/40 dark:bg-slate-950/10',
        };
    }
  };

  // Filter Logic
  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !n.read;
    return n.type === activeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Sidebar navigation */}
      <Sidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded} />

      {/* Mobile Wordmark Header */}
      <MobileHeader />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        <main className="mx-auto max-w-4xl px-4 pt-4 sm:px-6 lg:px-8">
          
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-[#1f1f1f] pb-4 mb-5">
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600 animate-pulse" /> Notifications Inbox
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage your system and activity notifications.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={actionLoading || notifications.filter(n => !n.read).length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
              >
                <Check className="h-3.5 w-3.5 text-emerald-500" /> Mark all read
              </button>
              <button
                onClick={handleClearAll}
                disabled={actionLoading || notifications.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" /> Clear all
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {(['ALL', 'UNREAD', 'HABIT', 'EVENT', 'TODO', 'SYSTEM'] as const).map((filter) => {
              const label = filter === 'ALL' ? 'All' : filter === 'UNREAD' ? 'Unread' : filter.charAt(0) + filter.slice(1).toLowerCase() + 's';
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                    activeFilter === filter
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/10'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-[#111111] dark:border-[#1f1f1f] dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Notification List Container */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-7 w-7 animate-spin text-red-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-300">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/40">
                <Inbox className="h-7 w-7 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">You're all caught up!</h3>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-xs">No notifications matching the selected filter were found.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredNotifications.map((noti) => {
                const cfg = getTypeConfig(noti.type);
                return (
                  <div
                    key={noti.id}
                    onClick={() => handleMarkSingleRead(noti.id, noti.link)}
                    className={`group relative flex gap-3.5 rounded-xl border border-l-4 p-4 cursor-pointer transition-all ${cfg.color} ${
                      noti.read
                        ? 'border-slate-200 bg-white/70 dark:border-[#1f1f1f] dark:bg-[#111111]/70'
                        : 'border-slate-300 bg-white shadow-sm dark:border-[#2f2f2f] dark:bg-[#111111]'
                    }`}
                  >
                    {/* Icon container */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {cfg.icon}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {noti.title}
                        </h4>
                        {!noti.read && (
                          <span className="h-2 w-2 rounded-full bg-red-600 block shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-450 leading-relaxed pr-2">
                        {noti.body}
                      </p>
                      <span className="mt-2 block text-[9px] text-slate-400 dark:text-slate-605 font-bold uppercase tracking-wider">
                        {formatTimeAgo(noti.createdAt)}
                      </span>
                    </div>

                    {/* Delete button (displays on hover) */}
                    <button
                      onClick={(e) => handleDeleteSingle(e, noti.id)}
                      className="absolute right-3.5 top-3.5 opacity-0 group-hover:opacity-100 rounded-md p-1 text-slate-450 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-all duration-150"
                      title="Delete"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-[#1f1f1f] dark:bg-[#111111] dark:text-slate-300 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Load More Notifications
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Mobile Sticky Navigation Footer */}
      <BottomNav activeTab="more" />

    </div>
  );
}

export default NotificationsPage;
