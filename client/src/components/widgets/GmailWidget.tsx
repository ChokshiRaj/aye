import { useState, useEffect } from 'react';
import widgetsApi from '../../api/widgets';
import { Mail, RefreshCw, Loader2, Link } from 'lucide-react';

export function GmailWidget() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [email, setEmail] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch Gmail inbox data
  const fetchInboxData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const res = await widgetsApi.getGmailInbox();
      if (res.success && res.data) {
        setConnected(res.data.connected);
        setUnreadCount(res.data.unreadCount || 0);
        setMessages(res.data.messages || []);
      }
    } catch (err: any) {
      if (err.response?.status === 550) {
        // Token issues or not connected
        setConnected(false);
      } else {
        setError('Failed to load Gmail messages.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Check connection status on load
  const checkStatus = async () => {
    try {
      const res = await widgetsApi.getGmailStatus();
      if (res.success && res.data) {
        setConnected(res.data.connected);
        setEmail(res.data.email || '');
        if (res.data.connected) {
          fetchInboxData();
        } else {
          setLoading(false);
        }
      }
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Auto-refresh Gmail inbox every 5 minutes
  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => {
      fetchInboxData(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [connected]);

  // Connect Gmail flow
  const handleConnect = async () => {
    try {
      const res = await widgetsApi.getGmailAuthUrl();
      if (res.success && res.data?.authUrl) {
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          res.data.authUrl,
          'Connect Gmail',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
        );

        const handleOAuthMessage = async (e: MessageEvent) => {
          if (e.data === 'gmail-connected') {
            window.removeEventListener('message', handleOAuthMessage);
            if (popup) popup.close();
            setConnected(true);
            setLoading(true);
            // Refresh connection email
            const statusRes = await widgetsApi.getGmailStatus();
            if (statusRes.success && statusRes.data) {
              setEmail(statusRes.data.email || '');
            }
            fetchInboxData();
          }
        };

        window.addEventListener('message', handleOAuthMessage);
      }
    } catch (err: any) {
      setError('Failed to launch Gmail connection.');
    }
  };

  return (
    <div className="flex h-[320px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Gmail Inbox</h3>
            {connected && email && (
              <p className="text-[9px] text-slate-400 font-semibold truncate max-w-[150px]">{email}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {connected && unreadCount > 0 && (
            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white shrink-0">
              {unreadCount} unread
            </span>
          )}
          {connected && (
            <button
              onClick={() => fetchInboxData(true)}
              disabled={refreshing || loading}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Refresh Gmail"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-red-600" />
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Loading inbox preview...</p>
          </div>
        ) : !connected ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-800/50">
              <Mail className="h-5 w-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Gmail Integration</h4>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500 max-w-[200px] leading-normal">
              Connect your Google account to preview your latest unread emails here.
            </p>
            <button
              onClick={handleConnect}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-[10px] font-bold text-white hover:bg-red-750 transition-colors"
            >
              <Link className="h-3.5 w-3.5" />
              Connect Gmail
            </button>
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[10px] font-semibold text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => fetchInboxData()}
              className="mt-3 rounded bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">🎉 Inbox is clean!</p>
            <p className="mt-0.5 text-[9px] text-slate-400">No recent messages in your inbox.</p>
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-50 dark:divide-slate-800/40">
            {messages.map((msg) => (
              <div key={msg.id} className={`pt-2.5 first:pt-0`}>
                <div className="flex justify-between items-baseline">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-slate-250 truncate max-w-[130px]">
                    {msg.sender}
                  </span>
                  <span className="text-[8px] text-slate-400 shrink-0">
                    {msg.date.split(',')[1]?.trim()?.split(' ')[0] || msg.date.split(' ')[0] || ''}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-850 dark:text-slate-350 truncate mt-0.5">
                  {msg.subject}
                </p>
                <p className="text-[9px] text-slate-450 dark:text-slate-500 line-clamp-1 mt-0.5 leading-normal">
                  {msg.snippet}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GmailWidget;
