import api from './axios';
import { ApiResponse, User, Session } from '../types';

export interface LoginResponse {
  user?: User;
  accessToken?: string;
  require2FA?: boolean;
  temp2faToken?: string;
  requireOtp?: boolean;
  userId?: string;
}

export const authApi = {
  login: async (credentials: Record<string, string>): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/logout');
    return response.data;
  },

  me: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get<ApiResponse<{ user: User }>>('/api/auth/me');
    return response.data;
  },

  updateProfile: async (details: {
    name?: string;
    email?: string;
    mobile?: string | null;
  }): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put<ApiResponse<{ user: User }>>('/api/auth/profile', details);
    return response.data;
  },

  changePassword: async (details: Record<string, string>): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.put<ApiResponse<{ message: string }>>('/api/auth/password', details);
    return response.data;
  },

  // Sessions Management
  getSessions: async (): Promise<ApiResponse<{ sessions: Session[] }>> => {
    const response = await api.get<ApiResponse<{ sessions: Session[] }>>('/api/auth/sessions');
    return response.data;
  },

  revokeOtherSessions: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>('/api/auth/sessions/other');
    return response.data;
  },

  // Two-Factor Authentication (2FA)
  setup2fa: async (): Promise<ApiResponse<{ secret: string; qrCodeDataUrl: string }>> => {
    const response = await api.post<ApiResponse<{ secret: string; qrCodeDataUrl: string }>>('/api/auth/2fa/setup');
    return response.data;
  },

  verify2fa: async (details: { secret: string; code: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/2fa/verify', details);
    return response.data;
  },

  disable2fa: async (details: { code: string }): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post<ApiResponse<{ message: string }>>('/api/auth/2fa/disable', details);
    return response.data;
  },

  loginVerify2fa: async (details: { tempToken: string; code: string }): Promise<ApiResponse<{ user: User; accessToken: string }>> => {
    const response = await api.post<ApiResponse<{ user: User; accessToken: string }>>('/api/auth/2fa/login-verify', details);
    return response.data;
  },

  verifyOtp: async (details: { userId: string; code: string }): Promise<ApiResponse<{ user?: User; accessToken?: string; require2FA?: boolean; temp2faToken?: string }>> => {
    const response = await api.post<ApiResponse<{ user?: User; accessToken?: string; require2FA?: boolean; temp2faToken?: string }>>('/api/auth/verify-otp', details);
    return response.data;
  },
};
