import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import DashboardPage from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import HabitsPage from './pages/HabitsPage';
import NotificationsPage from './pages/NotificationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MarketsPage from './pages/MarketsPage';
import ProtectedRoute from './components/layout/ProtectedRoute';

export function App() {
  const [initializing, setInitializing] = useState(true);
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const refreshBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        
        // Silently request fresh access token using HttpOnly cookie
        const refreshRes = await axios.post(
          `${refreshBaseUrl}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = refreshRes.data.data;

        // Fetch authenticated user profile details
        const meRes = await axios.get(
          `${refreshBaseUrl}/api/auth/me`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const { user } = meRes.data.data;

        setAuth(user, accessToken);
      } catch (err) {
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };
    checkSession();
  }, [setAuth, clearAuth]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white font-medium text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-400 font-semibold tracking-wider text-xs uppercase">Initializing AYE Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
