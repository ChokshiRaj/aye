import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { widgetsApi } from '../api/widgets';
import { authApi } from '../api/auth';
import api from '../api/axios';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '../utils/pushService';
import { Settings as SettingsType, Session as SessionType } from '../types';
import Sidebar from '../components/layout/Sidebar';
import { BottomNav } from '../components/layout/BottomNav';
import {
  ChevronLeft,
  User as UserIcon,
  Lock,
  Settings as SettingsIcon,
  Check,
  X,
  Phone,
  Mail,
  ShieldAlert,
  Loader,
  Smartphone,
  ShieldCheck,
  Globe,
  Trash2,
  ChevronRight,
  Bell,
  Database,
  Download,
  Key,
} from 'lucide-react';

type TabType = 'account' | 'security' | 'widgets' | 'notifications' | '2fa' | 'sessions' | 'data' | 'integrations' | 'developer';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Mobile Drill-down states
  const [activeSubView, setActiveSubView] = useState<TabType | null>(null);

  // Loading / Error states
  const [, setSettings] = useState<SettingsType | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Account form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Widgets form states
  const [city, setCity] = useState('');
  const [timezone, setTimezone] = useState('');
  const [stockTickers, setStockTickers] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState('');
  const [newsApiKey, setNewsApiKey] = useState('');

  // Notifications state
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testPushLoading, setTestPushLoading] = useState(false);

  // Sessions states
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // 2FA Setup states
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [totpVerificationCode, setTotpVerificationCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);

  // Data Export state
  const [exportLoading, setExportLoading] = useState<string | null>(null);

  // Show Crypto toggle
  const [showCrypto, setShowCrypto] = useState(false);

  // Email notification preferences state
  const [emailLoginOtp, setEmailLoginOtp] = useState(false);
  const [emailDailyHabits, setEmailDailyHabits] = useState(true);
  const [emailEventReminder, setEmailEventReminder] = useState(true);
  const [emailWeeklyReport, setEmailWeeklyReport] = useState(true);
  const [emailStreakWarning, setEmailStreakWarning] = useState(true);
  const [emailDataExport, setEmailDataExport] = useState(true);
  const [emailLoginAlert, setEmailLoginAlert] = useState(true);

  // Gmail OAuth state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailLoading, setGmailLoading] = useState(false);

  // Developer/API keys state
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleRedirectUri, setGoogleRedirectUri] = useState('');
  const [goldApiKey, setGoldApiKey] = useState('');

  const initPushStatus = async () => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
    const subscribed = await isPushSubscribed();
    setPushEnabled(subscribed);
  };

  const fetchGmailStatus = async () => {
    setGmailLoading(true);
    try {
      const res = await widgetsApi.getGmailStatus();
      if (res.success && res.data) {
        setGmailConnected(res.data.connected);
        setGmailEmail(res.data.email || '');
      }
    } catch (err: any) {
      console.error('Failed to fetch Gmail status:', err);
    } finally {
      setGmailLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await widgetsApi.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
        setCity(res.data.city);
        setTimezone(res.data.timezone);
        setStockTickers(res.data.stockTickers);
        setNewsApiKey(res.data.newsApiKey || '');
        setShowCrypto(res.data.showCrypto || false);
        setSmtpHost(res.data.smtpHost || '');
        setSmtpPort(res.data.smtpPort !== null && res.data.smtpPort !== undefined ? String(res.data.smtpPort) : '');
        setSmtpUser(res.data.smtpUser || '');
        setSmtpPass(res.data.smtpPass || '');
        setSmtpFrom(res.data.smtpFrom || '');
        setGoogleClientId(res.data.googleClientId || '');
        setGoogleClientSecret(res.data.googleClientSecret || '');
        setGoogleRedirectUri(res.data.googleRedirectUri || '');
        setGoldApiKey(res.data.goldApiKey || '');

        // Email notification preferences
        setEmailLoginOtp(res.data.emailLoginOtp || false);
        setEmailDailyHabits(res.data.emailDailyHabits !== false);
        setEmailEventReminder(res.data.emailEventReminder !== false);
        setEmailWeeklyReport(res.data.emailWeeklyReport !== false);
        setEmailStreakWarning(res.data.emailStreakWarning !== false);
        setEmailDataExport(res.data.emailDataExport !== false);
        setEmailLoginAlert(res.data.emailLoginAlert !== false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.getSessions();
      if (res.success && res.data) {
        setSessions(res.data.sessions);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to fetch active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setMobile(user.mobile || '');
    }
    fetchSettings();
    initPushStatus();
    fetchGmailStatus();
  }, [user]);

  // Fetch sessions list when sessions tab or mobile subview becomes active
  useEffect(() => {
    if (activeTab === 'sessions' || activeSubView === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, activeSubView]);

  // Alert message automatic timeout
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

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

  // Account Save
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateProfile({ name, email, mobile: mobile.trim() || null });
      setSuccessMessage('Account details updated successfully.');
      setActiveSubView(null); // Return to mobile settings list on success
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update account.');
    } finally {
      setActionLoading(false);
    }
  };

  // Security Save
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword });
      setSuccessMessage('Password changed successfully. Logging out...');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password.');
      setActionLoading(false);
    }
  };

  // Widget settings Save
  const handleSaveWidgets = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await widgetsApi.updateSettings({
        city,
        timezone,
        stockTickers,
        newsApiKey: newsApiKey.trim() || null,
      });
      if (res.success && res.data) {
        setSettings(res.data);
        setSuccessMessage('Dashboard widget configurations saved.');
        setActiveSubView(null);
      } else {
        setErrorMessage(res.error || 'Failed to save widget settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  // Developer/API keys Save
  const handleSaveDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await widgetsApi.updateSettings({
        smtpHost: smtpHost.trim() || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser: smtpUser.trim() || null,
        smtpPass: smtpPass.trim() || null,
        smtpFrom: smtpFrom.trim() || null,
        googleClientId: googleClientId.trim() || null,
        googleClientSecret: googleClientSecret.trim() || null,
        googleRedirectUri: googleRedirectUri.trim() || null,
        goldApiKey: goldApiKey.trim() || null,
        newsApiKey: newsApiKey.trim() || null,
      });
      if (res.success && res.data) {
        setSettings(res.data);
        setSuccessMessage('Developer configurations and API keys saved.');
        setActiveSubView(null);
      } else {
        setErrorMessage(res.error || 'Failed to save developer settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePushToggle = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush();
        setPushEnabled(false);
        setSuccessMessage('Unsubscribed from push notifications.');
      } else {
        await subscribeToPush();
        setPushEnabled(true);
        setSuccessMessage('Subscribed to push notifications successfully!');
      }
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Push registration failed.');
      if ('Notification' in window) {
        setPermissionState(Notification.permission);
      }
    }
  };

  const handleSendTestPush = async () => {
    setTestPushLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.post('/api/push/test');
      if (res.data && res.data.success) {
        setSuccessMessage(res.data.data.message || 'Test push notification dispatched.');
      } else {
        setErrorMessage(res.data.error || 'Failed to send test push.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send test push.');
    } finally {
      setTestPushLoading(false);
    }
  };

  const handleDownload = async (endpoint: string, filename: string) => {
    setExportLoading(filename);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      // Create a URL for the downloaded blob
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage(`Successfully downloaded ${filename}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download backup.');
    } finally {
      setExportLoading(null);
    }
  };

  const handleEmailPreferenceToggle = async (key: string, currentValue: boolean) => {
    if (key === 'emailPasswordAlert') return;

    const newValue = !currentValue;

    // Optimistic Update
    if (key === 'emailLoginOtp') setEmailLoginOtp(newValue);
    else if (key === 'emailDailyHabits') setEmailDailyHabits(newValue);
    else if (key === 'emailEventReminder') setEmailEventReminder(newValue);
    else if (key === 'emailWeeklyReport') setEmailWeeklyReport(newValue);
    else if (key === 'emailStreakWarning') setEmailStreakWarning(newValue);
    else if (key === 'emailDataExport') setEmailDataExport(newValue);
    else if (key === 'emailLoginAlert') setEmailLoginAlert(newValue);

    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await widgetsApi.updateEmailPreferences({
        [key]: newValue,
      });
      if (res.success) {
        setSuccessMessage('Saved');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        // Rollback
        if (key === 'emailLoginOtp') setEmailLoginOtp(currentValue);
        else if (key === 'emailDailyHabits') setEmailDailyHabits(currentValue);
        else if (key === 'emailEventReminder') setEmailEventReminder(currentValue);
        else if (key === 'emailWeeklyReport') setEmailWeeklyReport(currentValue);
        else if (key === 'emailStreakWarning') setEmailStreakWarning(currentValue);
        else if (key === 'emailDataExport') setEmailDataExport(currentValue);
        else if (key === 'emailLoginAlert') setEmailLoginAlert(currentValue);

        setErrorMessage(res.error || 'Failed to save email preferences.');
      }
    } catch (err: any) {
      // Rollback
      if (key === 'emailLoginOtp') setEmailLoginOtp(currentValue);
      else if (key === 'emailDailyHabits') setEmailDailyHabits(currentValue);
      else if (key === 'emailEventReminder') setEmailEventReminder(currentValue);
      else if (key === 'emailWeeklyReport') setEmailWeeklyReport(currentValue);
      else if (key === 'emailStreakWarning') setEmailStreakWarning(currentValue);
      else if (key === 'emailDataExport') setEmailDataExport(currentValue);
      else if (key === 'emailLoginAlert') setEmailLoginAlert(currentValue);

      setErrorMessage(err.message || 'Failed to save email preferences.');
    }
  };

  const handleConnectGmail = async () => {
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
            setSuccessMessage('Gmail successfully connected!');
            fetchGmailStatus();
          }
        };

        window.addEventListener('message', handleOAuthMessage);
      } else {
        setErrorMessage(res.error || 'Failed to get authorization URL.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initiate Gmail connection.');
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail?')) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await widgetsApi.disconnectGmail();
      if (res.success) {
        setSuccessMessage('Gmail disconnected.');
        setGmailConnected(false);
        setGmailEmail('');
      } else {
        setErrorMessage(res.error || 'Failed to disconnect Gmail.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to disconnect Gmail.');
    } finally {
      setActionLoading(false);
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = async () => {
    if (!confirm('Are you sure you want to log out all other devices?')) return;
    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.revokeOtherSessions();
      if (res.success) {
        setSuccessMessage('Successfully terminated all other active sessions.');
        fetchSessions();
      } else {
        setErrorMessage(res.error || 'Failed to revoke other sessions.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revoke other sessions.');
    } finally {
      setActionLoading(false);
    }
  };

  // Setup 2FA
  const handleSetup2fa = async () => {
    setSetupLoading(true);
    setErrorMessage(null);
    try {
      const res = await authApi.setup2fa();
      if (res.success && res.data) {
        setQrCodeDataUrl(res.data.qrCodeDataUrl);
        setTwoFactorSecret(res.data.secret);
      } else {
        setErrorMessage(res.error || 'Failed to initialize 2FA setup.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error configuring 2FA.');
    } finally {
      setSetupLoading(false);
    }
  };

  // Verify and enable 2FA
  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorSecret || totpVerificationCode.length !== 6) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.verify2fa({
        secret: twoFactorSecret,
        code: totpVerificationCode,
      });
      if (res.success) {
        setSuccessMessage('Two-factor authentication enabled!');
        await updateProfile({});
        setQrCodeDataUrl(null);
        setTwoFactorSecret(null);
        setTotpVerificationCode('');
        setActiveSubView(null);
      } else {
        setErrorMessage(res.error || 'Invalid code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to activate 2FA.');
    } finally {
      setActionLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpVerificationCode.length !== 6) return;

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await authApi.disable2fa({ code: totpVerificationCode });
      if (res.success) {
        setSuccessMessage('Two-factor authentication deactivated.');
        await updateProfile({});
        setTotpVerificationCode('');
        setActiveSubView(null);
      } else {
        setErrorMessage(res.error || 'Invalid code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to deactivate 2FA.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTicker = () => {
    const formatted = newTicker.trim().toUpperCase();
    if (formatted && !stockTickers.includes(formatted)) {
      setStockTickers([...stockTickers, formatted]);
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    setStockTickers(stockTickers.filter((t) => t !== tickerToRemove));
  };

  if (settingsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-red-650 dark:text-red-500" />
          <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  // Common Header back navigation (shared across forms)
  const renderMobileSubViewHeader = (title: string) => (
    <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4 dark:border-[#1f1f1f] dark:bg-[#111111] md:hidden mb-4">
      <button
        onClick={() => { setActiveSubView(null); setErrorMessage(null); setSuccessMessage(null); }}
        className="rounded-full bg-slate-50 p-1.5 text-slate-655 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0a0a0a] dark:text-slate-100">
      
      {/* Collapsible Left Sidebar (Desktop) */}
      <Sidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
      />

      {/* Main Container */}
      <div
        className={`transition-all duration-300 min-h-screen pb-20 md:pb-6 ${
          sidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'
        }`}
      >
        
        {/* Desktop Header */}
        <header className="sticky top-0 z-40 hidden w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-[#1f1f1f] dark:bg-[#0a0a0a]/80 md:block">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-650 hover:bg-slate-100 hover:text-slate-800 dark:border-[#1f1f1f] dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750 dark:hover:text-slate-100"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-950 dark:text-white">Settings</h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 uppercase tracking-widest font-semibold">
                AYE Personal Command Centre
              </p>
            </div>
          </div>
        </header>

        {/* Settings Body */}
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6">
          
          {/* Status Alerts */}
          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-250 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 dark:border-red-950/20 dark:bg-red-950/20 dark:text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ========================================================
              DESKTOP VIEW: Split navigation layout (Hidden on mobile)
              ======================================================== */}
          <div className="hidden md:grid grid-cols-12 gap-6">
            {/* Sidebar Tab Selector */}
            <div className="col-span-4">
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'account'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="h-4 w-4" /> Account Details
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'security'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Lock className="h-4 w-4" /> Security & Password
                </button>
                <button
                  onClick={() => setActiveTab('widgets')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'widgets'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <SettingsIcon className="h-4 w-4" /> Widget Configurations
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'notifications'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Bell className="h-4 w-4" /> Push Notifications
                </button>
                <button
                  onClick={() => setActiveTab('integrations')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'integrations'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Globe className="h-4 w-4" /> Integrations
                </button>
                
                <div className="my-1.5 border-t border-slate-100 dark:border-[#1f1f1f]"></div>

                <button
                  onClick={() => setActiveTab('2fa')}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === '2fa'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" /> Two-Factor Auth (2FA)
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'sessions'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Smartphone className="h-4 w-4" /> Active Sessions
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'data'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Database className="h-4 w-4" /> Data & Privacy
                </button>
                <button
                  onClick={() => setActiveTab('developer')}
                  className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                    activeTab === 'developer'
                      ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                      : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Key className="h-4 w-4" /> Developer & API Keys
                </button>
              </div>
            </div>

            {/* Desktop Panels content */}
            <div className="col-span-8">
              {/* Developer Keys */}
              {activeTab === 'developer' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Developer & API Keys</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Configure your custom integrations and SMTP mailer. These values override server environment variable configurations.
                  </p>

                  <form onSubmit={handleSaveDeveloper} className="mt-6 space-y-6">
                    {/* SMTP Configuration */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">1. SMTP Email Server Configuration</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">SMTP Host</label>
                          <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="smtp.gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">SMTP Port</label>
                          <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="587" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">SMTP Username / Email</label>
                          <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="your-email@gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">SMTP Password / App Password</label>
                          <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">SMTP From Header Address</label>
                        <input type="text" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder='"AYE Command Centre" <your-email@gmail.com>' />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-4"></div>

                    {/* Google Console Credentials */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">2. Google Console OAuth (Gmail Widget)</h3>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Google Client ID</label>
                        <input type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="xxxx.apps.googleusercontent.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Google Client Secret</label>
                        <input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Google OAuth Redirect URI</label>
                        <input type="text" value={googleRedirectUri} onChange={(e) => setGoogleRedirectUri(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="http://localhost:5000/api/gmail/callback" />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-4"></div>

                    {/* Live Markets Gold API and News API */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-500">3. Commodity Markets & News API Integration</h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">GoldAPI.io Access Key</label>
                          <input type="text" value={goldApiKey} onChange={(e) => setGoldApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="goldapi-xxxx-io-key" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">NewsAPI.org Key</label>
                          <input type="password" value={newsApiKey} onChange={(e) => setNewsApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <button type="submit" disabled={actionLoading} className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all">
                        {actionLoading ? 'Saving...' : 'Save Developer Credentials'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Account Details */}
              {activeTab === 'account' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Account Details</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Update your personal details.</p>
                  
                  <form onSubmit={handleSaveAccount} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mobile Number</label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <button type="submit" disabled={actionLoading} className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all">{actionLoading ? 'Saving...' : 'Save Profile'}</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Details */}
              {activeTab === 'security' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Password</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Update credentials. Invalidation redirects to Login.</p>
                  
                  <form onSubmit={handleSaveSecurity} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Current Password</label>
                      <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">New Password</label>
                        <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Min 8 characters" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Confirm New Password</label>
                        <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Confirm password" />
                      </div>
                    </div>
                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <button type="submit" disabled={actionLoading || !newPassword} className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all">{actionLoading ? 'Updating...' : 'Change Password'}</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Widget Configs */}
              {activeTab === 'widgets' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Widget Configurations</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Customize Weather & Finance widget parameters.</p>
                  
                  <form onSubmit={handleSaveWidgets} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Weather City</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Timezone</label>
                      <input type="text" required value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">News API Key (NewsAPI.org)</label>
                      <input type="password" value={newsApiKey} onChange={(e) => setNewsApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Enter NewsAPI.org API Key to load real news" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Finance Tickers</label>
                      <div className="mt-1 flex gap-2">
                        <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Add ticker (e.g. AAPL)" />
                        <button type="button" onClick={handleAddTicker} className="rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Add</button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stockTickers.map((t) => (
                          <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                            {t}
                            <button type="button" onClick={() => handleRemoveTicker(t)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300"><X className="h-3.5 w-3.5" /></button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Crypto Widget</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Display Bitcoin, Ethereum, Solana, and other prices on your dashboard.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={showCrypto}
                          onChange={(e) => setShowCrypto(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                      </label>
                    </div>

                    <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <button type="submit" disabled={actionLoading} className="rounded-lg bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-all">{actionLoading ? 'Saving...' : 'Save Settings'}</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Push Notifications */}
              {activeTab === 'notifications' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-red-600" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Push Notifications</h2>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Configure browser alerts and reminders.</p>

                  <div className="mt-6 space-y-5">
                    {/* Status Info */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/50">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Permission Status</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Browser permissions: <span className="font-bold uppercase">{permissionState}</span>
                        </p>
                      </div>
                      {permissionState === 'denied' && (
                        <span className="rounded bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">
                          Blocked in Browser
                        </span>
                      )}
                      {permissionState === 'granted' && (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable Notifications</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Receive alerts for Pomodoro end, habits, and upcoming events.
                        </p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={pushEnabled}
                          onChange={handlePushToggle}
                          disabled={permissionState === 'denied'}
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                      </label>
                    </div>

                    {permissionState === 'denied' && (
                      <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50/50 p-3 rounded-lg border border-red-100/55 dark:border-red-950/20 dark:bg-red-950/10">
                        ⚠️ Push notifications are currently blocked in your browser settings. Please enable them in your browser site settings.
                      </p>
                    )}

                    {/* Send Test Push Button */}
                    <div className="flex justify-start border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                      <button
                        type="button"
                        onClick={handleSendTestPush}
                        disabled={testPushLoading || !pushEnabled}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-750 transition-all"
                      >
                        {testPushLoading ? 'Sending...' : 'Send Test Notification'}
                      </button>
                    </div>

                    {/* Email Notifications Section */}
                    <div className="border-t border-slate-200 pt-6 mt-6 dark:border-[#1f1f1f]">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-5 w-5 text-red-600" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</h3>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-550 mb-6">
                        Manage which emails AYE sends to: <span className="font-bold text-slate-700 dark:text-slate-350">{user?.email}</span>
                      </p>

                      <div className="rounded-xl border border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#111111] overflow-hidden divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                        
                        {/* OTP Verification */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              🔐 Login OTP Verification
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Require email OTP on every login</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailLoginOtp}
                              onChange={() => handleEmailPreferenceToggle('emailLoginOtp', emailLoginOtp)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Password Change Alert (Locked ON) */}
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/10">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              🔒 Password Change Alert <span className="text-[9px] font-bold text-red-650 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded ml-1">(always)</span>
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Instant alert when your password changes</p>
                          </div>
                          <label className="relative inline-flex items-center opacity-60 cursor-not-allowed">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled={true}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-red-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:content-[''] translate-x-0 after:translate-x-full after:border-white dark:bg-red-500"></div>
                          </label>
                        </div>

                        {/* Daily Habit Summary */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              🎯 Daily Habit Summary
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Your habits recap every evening at 9 PM IST</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailDailyHabits}
                              onChange={() => handleEmailPreferenceToggle('emailDailyHabits', emailDailyHabits)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Event Reminders */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              📅 Event Reminders
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Email 1 hour before calendar events begin</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailEventReminder}
                              onChange={() => handleEmailPreferenceToggle('emailEventReminder', emailEventReminder)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Weekly Analytics Report */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              📊 Weekly Analytics Report
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Your productivity summary every Monday 8 AM IST</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailWeeklyReport}
                              onChange={() => handleEmailPreferenceToggle('emailWeeklyReport', emailWeeklyReport)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Streak Warnings */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              🔥 Streak Break Warnings
                            </p>
                            <p className="text-[10px] text-slate-550 mt-0.5">Alert at 10 PM IST when habits aren't logged</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailStreakWarning}
                              onChange={() => handleEmailPreferenceToggle('emailStreakWarning', emailStreakWarning)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Data Export Confirmation */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              📦 Data Export Confirmation
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Email when a data export is generated</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailDataExport}
                              onChange={() => handleEmailPreferenceToggle('emailDataExport', emailDataExport)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* New Login Alerts */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              🖥️ New Login Alerts
                            </p>
                            <p className="text-[10px] text-slate-505 dark:text-slate-400 mt-0.5">Alert when a new login is detected</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailLoginAlert}
                              onChange={() => handleEmailPreferenceToggle('emailLoginAlert', emailLoginAlert)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-805"></div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Two-Factor Authentication */}
              {activeTab === '2fa' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-red-600" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h2>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Secure dashboard logins via TOTP authentication codes.</p>

                  {user?.twoFactorEnabled ? (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-950/20 dark:bg-emerald-950/10">
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Two-Factor Authentication is Enabled</p>
                      </div>
                      <form onSubmit={handleDisable2fa} className="border-t border-slate-100 pt-6 dark:border-[#1f1f1f] space-y-3">
                        <p className="text-xs text-slate-400">Enter authenticator code to disable.</p>
                        <div className="flex gap-2">
                          <input type="text" required maxLength={6} value={totpVerificationCode} onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, ''))} className="rounded-lg border border-slate-300 bg-white/50 px-3 py-2 text-center text-sm font-semibold tracking-[0.2em] focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="000000" />
                          <button type="submit" disabled={actionLoading || totpVerificationCode.length !== 6} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Disable 2FA</button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="mt-6">
                      {!qrCodeDataUrl ? (
                        <div className="rounded-lg border border-slate-150 bg-slate-50 p-6 text-center dark:border-[#1f1f1f] dark:bg-[#111111]/40">
                          <button type="button" onClick={handleSetup2fa} disabled={setupLoading} className="rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700">{setupLoading ? 'Generating Secret...' : 'Enable 2FA Protection'}</button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4 items-center">
                            <div className="flex justify-center border border-slate-200 bg-white p-4 rounded-xl dark:border-[#1f1f1f] dark:bg-[#111111]"><img src={qrCodeDataUrl} alt="2FA" className="h-40 w-40" /></div>
                            <div>
                              <p className="text-xs text-slate-400">Scan via Authenticator app, or enter key:</p>
                              <code className="mt-2 block rounded bg-slate-100 p-2 text-xs font-mono font-bold select-all text-red-600 dark:bg-slate-800 dark:text-red-400">{twoFactorSecret}</code>
                            </div>
                          </div>
                          <form onSubmit={handleVerify2fa} className="border-t border-slate-100 pt-6 dark:border-[#1f1f1f] space-y-3">
                            <p className="text-xs text-slate-400 font-semibold">Enter authenticator 6-digit code to activate:</p>
                            <div className="flex gap-2">
                              <input type="text" required maxLength={6} value={totpVerificationCode} onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, ''))} className="rounded-lg border border-slate-300 bg-white/50 px-3 py-2 text-center text-sm font-semibold tracking-[0.2em] focus:border-red-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="000000" />
                              <button type="submit" disabled={actionLoading || totpVerificationCode.length !== 6} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Activate 2FA</button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Active Sessions */}
              {activeTab === 'sessions' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-[#1f1f1f]">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Device Sessions</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage connected browsers.</p>
                    </div>
                    {sessions.length > 1 && (
                      <button onClick={handleRevokeOtherSessions} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                  <div className="mt-6 space-y-4">
                    {sessionsLoading ? (
                      <Loader className="mx-auto h-6 w-6 animate-spin text-red-600" />
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex justify-between items-center py-3">
                            <div className="flex gap-2">
                              <Globe className="h-4 w-4 text-slate-400 mt-1" />
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{parseUserAgent(s.userAgent)} {s.isCurrent && <span className="text-[10px] text-emerald-650 bg-emerald-50 px-1 rounded ml-1 dark:bg-emerald-950/20">Active</span>}</p>
                                <p className="text-[10px] text-slate-400">IP: {s.ip} | {new Date(s.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data & Privacy */}
              {activeTab === 'data' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-red-600" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Data & Privacy Backup</h2>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Download copies of your dashboard records to your local machine.</p>

                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tasks CSV */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Tasks</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Download all your todo lists and tasks as a standard CSV spreadsheet.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/todos', 'aye_tasks.csv')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3.5 py-2 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_tasks.csv' ? 'Downloading...' : 'Download CSV'}
                        </button>
                      </div>

                      {/* Habits CSV */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Habits</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Download habit names, logged records, and completion counts as a CSV.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/habits', 'aye_habits.csv')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3.5 py-2 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_habits.csv' ? 'Downloading...' : 'Download CSV'}
                        </button>
                      </div>

                      {/* Notes MD */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Notes</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Download all notes combined into a single flat Markdown document.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/notes', 'aye_notes.md')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3.5 py-2 text-xs font-bold text-red-655 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_notes.md' ? 'Downloading...' : 'Download Markdown'}
                        </button>
                      </div>

                      {/* Profile JSON */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Full Profile Dump</h4>
                        <p className="text-[10px] text-slate-400 mt-1">Export a complete nested JSON backup file including all tables and profiles.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/all', 'aye_full_backup.json')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3.5 py-2 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_full_backup.json' ? 'Downloading...' : 'Download JSON Dump'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Integrations Panel */}
              {activeTab === 'integrations' && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4 dark:border-[#1f1f1f]">
                    <Globe className="h-5 w-5 text-red-650" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Connected Integrations</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Manage connections to third-party services.</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between rounded-xl border border-slate-150 p-4 dark:border-[#1f1f1f] dark:bg-slate-800/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400">
                          ✉
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Gmail API</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {gmailConnected ? `Connected to ${gmailEmail}` : 'Not connected'}
                          </p>
                        </div>
                      </div>

                      {gmailLoading ? (
                        <Loader className="h-5 w-5 animate-spin text-red-600" />
                      ) : gmailConnected ? (
                        <button
                          type="button"
                          onClick={handleDisconnectGmail}
                          className="rounded-lg bg-red-50 px-3.5 py-2 text-xs font-bold text-red-605 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConnectGmail}
                          className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                        >
                          Connect Gmail
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              MOBILE VIEW: Stacked Drill-Down Layout (Hidden on desktop)
              ======================================================== */}
          <div className="block md:hidden animate-in fade-in duration-200 pb-12">
            
            {activeSubView === null ? (
              // Root Settings List Menu
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111]">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1f1f1f]">
                  <h1 className="text-base font-black text-slate-900 dark:text-white">Settings</h1>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Mobile Configuration</p>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  <button
                    onClick={() => setActiveSubView('account')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <UserIcon className="h-4 w-4 text-red-500" /> Account Profile Details
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('security')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Lock className="h-4 w-4 text-red-500" /> Change Security Password
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('widgets')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <SettingsIcon className="h-4 w-4 text-red-500" /> Dashboard Widget Configs
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('notifications')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell className="h-4 w-4 text-red-500" /> Push Notifications
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('integrations')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Globe className="h-4 w-4 text-red-500" /> Integrations
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('2fa')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-red-500" /> Two-Factor Auth (2FA)
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('sessions')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Smartphone className="h-4 w-4 text-red-500" /> Active Session Keys
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('developer')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Key className="h-4 w-4 text-red-500" /> Developer & API Keys
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveSubView('data')}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40"
                  >
                    <span className="flex items-center gap-2.5">
                      <Database className="h-4 w-4 text-red-500" /> Data & Privacy
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            ) : (
              // Nested Subview forms
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-[#1f1f1f] dark:bg-[#111111] overflow-hidden">
                
                {/* Developer / API keys mobile form */}
                {activeSubView === 'developer' && (
                  <div>
                    {renderMobileSubViewHeader('Developer & API Keys')}
                    <form onSubmit={handleSaveDeveloper} className="p-4 space-y-5">
                      {/* SMTP Configuration */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-red-650 dark:text-red-500">1. SMTP Server Setup</h4>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">SMTP Host</label>
                          <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="smtp.gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">SMTP Port</label>
                          <input type="text" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value.replace(/\D/g, ''))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="587" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">SMTP Username</label>
                          <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="your-email@gmail.com" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">SMTP Password</label>
                          <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">From Header</label>
                          <input type="text" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder='"AYE Command" <email>' />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-3"></div>

                      {/* Google Credentials */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-red-655 dark:text-red-500">2. Google API (Gmail Widget)</h4>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">Google Client ID</label>
                          <input type="text" value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="xxxx.apps.googleusercontent.com" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">Client Secret</label>
                          <input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">Redirect URI</label>
                          <input type="text" value={googleRedirectUri} onChange={(e) => setGoogleRedirectUri(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="http://localhost:5000/api/gmail/callback" />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 dark:border-[#1f1f1f] pt-3"></div>

                      {/* Markets and News */}
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-red-655 dark:text-red-500">3. Custom API Keys</h4>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">GoldAPI.io Key</label>
                          <input type="text" value={goldApiKey} onChange={(e) => setGoldApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="goldapi-xxxx-io-key" />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400">NewsAPI.org Key</label>
                          <input type="password" value={newsApiKey} onChange={(e) => setNewsApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                        </div>
                      </div>

                      <button type="submit" disabled={actionLoading} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">{actionLoading ? 'Saving...' : 'Save Developer Credentials'}</button>
                    </form>
                  </div>
                )}

                {/* Account details mobile form */}
                {activeSubView === 'account' && (
                  <div>
                    {renderMobileSubViewHeader('Account Profile Details')}
                    <form onSubmit={handleSaveAccount} className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Number</label>
                        <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <button type="submit" disabled={actionLoading} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">{actionLoading ? 'Saving...' : 'Save Profile'}</button>
                    </form>
                  </div>
                )}

                {/* Security change password mobile form */}
                {activeSubView === 'security' && (
                  <div>
                    {renderMobileSubViewHeader('Change Security Password')}
                    <form onSubmit={handleSaveSecurity} className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</label>
                        <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="••••••••" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                        <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Min 8 characters" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                        <input type="password" required value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Confirm password" />
                      </div>
                      <button type="submit" disabled={actionLoading || !newPassword} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">{actionLoading ? 'Updating...' : 'Change Password'}</button>
                    </form>
                  </div>
                )}

                {/* Widget config mobile form */}
                {activeSubView === 'widgets' && (
                  <div>
                    {renderMobileSubViewHeader('Dashboard Widget Configs')}
                    <form onSubmit={handleSaveWidgets} className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Weather City</label>
                        <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">System Timezone</label>
                        <input type="text" required value={timezone} onChange={(e) => setTimezone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">News API Key (NewsAPI.org)</label>
                        <input type="password" value={newsApiKey} onChange={(e) => setNewsApiKey(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Enter NewsAPI.org API Key" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Finance Tickers</label>
                        <div className="mt-1 flex gap-2">
                          <input type="text" value={newTicker} onChange={(e) => setNewTicker(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="Add ticker (e.g. AAPL)" />
                          <button type="button" onClick={handleAddTicker} className="rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Add</button>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stockTickers.map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                              {t}
                              <button type="button" onClick={() => handleRemoveTicker(t)} className="text-red-500"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Crypto Widget</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Display Bitcoin, Ethereum, Solana, and other prices on your dashboard.
                          </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={showCrypto}
                            onChange={(e) => setShowCrypto(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                        </label>
                      </div>

                      <button type="submit" disabled={actionLoading} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">{actionLoading ? 'Saving...' : 'Save Configs'}</button>
                    </form>
                  </div>
                )}

                {/* Push Notifications mobile view */}
                {activeSubView === 'notifications' && (
                  <div>
                    {renderMobileSubViewHeader('Push Notifications')}
                    <div className="p-4 space-y-5">
                      {/* Status Info */}
                      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/50">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Permission Status</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Browser permissions: <span className="font-bold uppercase">{permissionState}</span>
                          </p>
                        </div>
                        {permissionState === 'denied' && (
                          <span className="rounded bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">
                            Blocked
                          </span>
                        )}
                        {permissionState === 'granted' && (
                          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Enable Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Enable Notifications</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                            Receive alerts for Pomodoro study sessions, habit routines, and events.
                          </p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={pushEnabled}
                            onChange={handlePushToggle}
                            disabled={permissionState === 'denied'}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                        </label>
                      </div>

                      {permissionState === 'denied' && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold bg-red-50/50 p-3 rounded-lg border border-red-100/55 dark:border-red-950/20 dark:bg-red-950/10">
                          ⚠️ Push notifications are currently blocked in your browser settings. Please enable them in your browser site settings.
                        </p>
                      )}

                      {/* Send Test Push Button */}
                      <div className="border-t border-slate-100 pt-4 dark:border-[#1f1f1f]">
                        <button
                          type="button"
                          onClick={handleSendTestPush}
                          disabled={testPushLoading || !pushEnabled}
                          className="w-full rounded-lg bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-850 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                        >
                          {testPushLoading ? 'Sending...' : 'Send Test Notification'}
                        </button>
                      </div>
                    </div>

                    {/* Email Notifications Section */}
                    <div className="border-t border-slate-250 pt-6 mt-6 px-4 pb-4 dark:border-[#1f1f1f]">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-5 w-5 text-red-600" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Email Notifications</h3>
                      </div>
                      <p className="text-xs text-slate-450 dark:text-slate-500 mb-6">
                        Manage emails sent to: <span className="font-bold text-slate-700 dark:text-slate-300">{user?.email}</span>
                      </p>

                      <div className="rounded-xl border border-slate-200 bg-white dark:border-[#1f1f1f] dark:bg-[#111111] overflow-hidden divide-y divide-slate-100 dark:divide-[#1f1f1f]">
                        
                        {/* OTP Verification */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🔐 Login OTP</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Require OTP on login</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailLoginOtp}
                              onChange={() => handleEmailPreferenceToggle('emailLoginOtp', emailLoginOtp)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Password Change Alert (Locked ON) */}
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/10">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🔒 Password Changed</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Alert on password change</p>
                          </div>
                          <label className="relative inline-flex items-center opacity-60 cursor-not-allowed">
                            <input
                              type="checkbox"
                              checked={true}
                              disabled={true}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-red-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:content-[''] translate-x-0 after:translate-x-full after:border-white dark:bg-red-500"></div>
                          </label>
                        </div>

                        {/* Daily Habit Summary */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🎯 Daily Habits</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Summary at 9 PM IST</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailDailyHabits}
                              onChange={() => handleEmailPreferenceToggle('emailDailyHabits', emailDailyHabits)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Event Reminders */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">📅 Event Reminders</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">1 hour before events</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailEventReminder}
                              onChange={() => handleEmailPreferenceToggle('emailEventReminder', emailEventReminder)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Weekly Analytics Report */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">📊 Weekly Report</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Monday 8 AM IST</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailWeeklyReport}
                              onChange={() => handleEmailPreferenceToggle('emailWeeklyReport', emailWeeklyReport)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Streak Warnings */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🔥 Streak Warning</p>
                            <p className="text-[10px] text-slate-550 mt-0.5">10 PM IST warning</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailStreakWarning}
                              onChange={() => handleEmailPreferenceToggle('emailStreakWarning', emailStreakWarning)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* Data Export Confirmation */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">📦 Data Exports</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Email on export trigger</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailDataExport}
                              onChange={() => handleEmailPreferenceToggle('emailDataExport', emailDataExport)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-800"></div>
                          </label>
                        </div>

                        {/* New Login Alerts */}
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">🖥️ New Login Alert</p>
                            <p className="text-[10px] text-slate-505 mt-0.5">Email on new login</p>
                          </div>
                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={emailLoginAlert}
                              onChange={() => handleEmailPreferenceToggle('emailLoginAlert', emailLoginAlert)}
                              className="peer sr-only"
                            />
                            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-805"></div>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

                {/* Integrations mobile subview */}
                {activeSubView === 'integrations' && (
                  <div>
                    {renderMobileSubViewHeader('Connected Integrations')}
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-slate-150 p-4 dark:border-[#1f1f1f] dark:bg-slate-800/10">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-55 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                            ✉
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Gmail API</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {gmailConnected ? `Connected to ${gmailEmail}` : 'Not connected'}
                            </p>
                          </div>
                        </div>

                        {gmailLoading ? (
                          <Loader className="h-5 w-5 animate-spin text-red-600" />
                        ) : gmailConnected ? (
                          <button
                            type="button"
                            onClick={handleDisconnectGmail}
                            className="rounded-lg bg-red-50 px-3.5 py-2 text-xs font-bold text-red-605 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 transition-colors"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleConnectGmail}
                            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors"
                          >
                            Connect Gmail
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2FA mobile setup and verification form */}
                {activeSubView === '2fa' && (
                  <div>
                    {renderMobileSubViewHeader('Two-Factor Auth (2FA)')}
                    <div className="p-4 space-y-4">
                      {user?.twoFactorEnabled ? (
                        <div className="space-y-4">
                          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-950/20 dark:bg-emerald-950/10">
                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">2FA status is active</p>
                          </div>
                          <form onSubmit={handleDisable2fa} className="space-y-3 pt-2">
                            <p className="text-xs text-slate-500">Enter current code to disable:</p>
                            <input type="text" required maxLength={6} value={totpVerificationCode} onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border border-slate-300 bg-white/50 px-3 py-2 text-center text-sm font-semibold tracking-[0.2em] focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="000000" />
                            <button type="submit" disabled={actionLoading || totpVerificationCode.length !== 6} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">Disable 2FA</button>
                          </form>
                        </div>
                      ) : (
                        <div>
                          {!qrCodeDataUrl ? (
                            <div className="text-center py-4">
                              <p className="text-xs text-slate-500 mb-4">Protect logins via verification codes.</p>
                              <button type="button" onClick={handleSetup2fa} disabled={setupLoading} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Configure 2FA</button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="flex justify-center border border-slate-200 bg-white p-3 rounded-lg dark:border-[#1f1f1f] dark:bg-[#111111]"><img src={qrCodeDataUrl} alt="QR Code" className="h-36 w-36" /></div>
                              <p className="text-xs text-slate-500">Scan QR Code or copy key:</p>
                              <code className="block rounded bg-slate-100 p-2 text-xs font-mono select-all text-red-600 dark:bg-slate-800 dark:text-red-400">{twoFactorSecret}</code>
                              <form onSubmit={handleVerify2fa} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-xs text-slate-400">Enter authenticator 6-digit code:</p>
                                <input type="text" required maxLength={6} value={totpVerificationCode} onChange={(e) => setTotpVerificationCode(e.target.value.replace(/\D/g, ''))} className="w-full rounded-lg border border-slate-300 bg-white/50 px-3 py-2 text-center text-sm font-semibold tracking-[0.2em] focus:outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" placeholder="000000" />
                                <button type="submit" disabled={actionLoading || totpVerificationCode.length !== 6} className="w-full rounded-lg bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700">Activate 2FA</button>
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session keys lists mobile subview */}
                {activeSubView === 'sessions' && (
                  <div>
                    {renderMobileSubViewHeader('Active Session Keys')}
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-450">Active logins list</span>
                        {sessions.length > 1 && (
                          <button onClick={handleRevokeOtherSessions} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 dark:bg-red-950/20 dark:text-red-400">Revoke Others</button>
                        )}
                      </div>
                      
                      {sessionsLoading ? (
                        <Loader className="mx-auto h-5 w-5 animate-spin text-red-600" />
                      ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-850 space-y-2.5">
                          {sessions.map((s) => (
                            <div key={s.id} className="pt-2.5 first:pt-0">
                              <div className="flex gap-2">
                                <Globe className="h-4 w-4 text-slate-400 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{parseUserAgent(s.userAgent)} {s.isCurrent && <span className="text-[9px] text-emerald-650 bg-emerald-50 px-1 rounded dark:bg-emerald-950/20">Current</span>}</p>
                                  <p className="text-[10px] text-slate-400">IP: {s.ip} | {new Date(s.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Data & Privacy mobile subview */}
                {activeSubView === 'data' && (
                  <div>
                    {renderMobileSubViewHeader('Data & Privacy')}
                    <div className="p-4 space-y-4">
                      {/* Export Tasks */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Tasks</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Download all your todo lists and tasks as a standard CSV spreadsheet.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/todos', 'aye_tasks.csv')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600/10 py-2.5 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_tasks.csv' ? 'Downloading...' : 'Download CSV'}
                        </button>
                      </div>

                      {/* Export Habits */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Habits</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Download habit names, logged records, and completion counts as a CSV.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/habits', 'aye_habits.csv')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600/10 py-2.5 text-xs font-bold text-red-655 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_habits.csv' ? 'Downloading...' : 'Download CSV'}
                        </button>
                      </div>

                      {/* Export Notes */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Export Notes</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Download all notes combined into a single flat Markdown document.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/notes', 'aye_notes.md')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600/10 py-2.5 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_notes.md' ? 'Downloading...' : 'Download Markdown'}
                        </button>
                      </div>

                      {/* Export Full Backup */}
                      <div className="rounded-xl border border-slate-100 p-4 dark:border-[#1f1f1f] dark:bg-[#151515]/30">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Full Profile Dump</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">Export a complete nested JSON backup file including all tables and profiles.</p>
                        <button
                          type="button"
                          onClick={() => handleDownload('/api/settings/export/all', 'aye_full_backup.json')}
                          disabled={exportLoading !== null}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600/10 py-2.5 text-xs font-bold text-red-650 hover:bg-red-650 hover:text-white transition-all disabled:opacity-50 dark:text-red-400"
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exportLoading === 'aye_full_backup.json' ? 'Downloading...' : 'Download JSON Dump'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Mobile bottom navigation bar */}
      <BottomNav activeTab="more" />

    </div>
  );
}

export default SettingsPage;
