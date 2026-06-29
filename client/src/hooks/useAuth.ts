import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const { user, accessToken, setAuth, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: Record<string, string>) => {
    const res = await authApi.login(credentials);
    if (res.success && res.data) {
      if (res.data.require2FA) {
        return res.data; // Return { require2FA: true, temp2faToken }
      }
      setAuth(res.data.user!, res.data.accessToken!);
      navigate('/dashboard');
      return res.data;
    } else {
      throw new Error(res.error || 'Failed to log in.');
    }
  };

  const loginVerify2fa = async (tempToken: string, code: string) => {
    const res = await authApi.loginVerify2fa({ tempToken, code });
    if (res.success && res.data) {
      setAuth(res.data.user, res.data.accessToken);
      navigate('/dashboard');
      return res.data;
    } else {
      throw new Error(res.error || 'Failed to verify 2FA code.');
    }
  };

  const updateProfile = async (details: { name?: string; email?: string; mobile?: string | null }) => {
    const res = await authApi.updateProfile(details);
    if (res.success && res.data) {
      setAuth(res.data.user, accessToken!);
    } else {
      throw new Error(res.error || 'Failed to update profile.');
    }
  };

  const changePassword = async (details: Record<string, string>) => {
    const res = await authApi.changePassword(details);
    if (res.success) {
      clearAuth();
      navigate('/login');
    } else {
      throw new Error(res.error || 'Failed to update password.');
    }
  };

  const verifyOtp = async (userId: string, code: string) => {
    const res = await authApi.verifyOtp({ userId, code });
    if (res.success && res.data) {
      if (res.data.require2FA) {
        return res.data;
      }
      setAuth(res.data.user!, res.data.accessToken!);
      navigate('/dashboard');
      return res.data;
    } else {
      throw new Error(res.error || 'Failed to verify OTP.');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('API logout error:', error);
      }
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    login,
    loginVerify2fa,
    verifyOtp,
    logout,
    updateProfile,
    changePassword,
  };
}

export default useAuth;
