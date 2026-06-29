export interface User {
  id: string;
  email: string;
  name: string;
  mobile?: string | null;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface Session {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface Note {
  id: string;
  content: string;
  updatedAt: string;
  userId: string;
}

export interface HabitLog {
  id: string;
  date: string; // ISO String or YYYY-MM-DD
  habitId: string;
  userId: string;
}

export interface Habit {
  id: string;
  name: string;
  createdAt: string;
  userId: string;
  logs: HabitLog[];
}

export interface Bookmark {
  id: string;
  name: string;
  url: string;
  icon: string | null;
  createdAt: string;
  userId: string;
}

export interface Settings {
  id: string;
  city: string;
  timezone: string;
  stockTickers: string[];
  newsApiKey?: string | null;
  showCrypto?: boolean;
  emailLoginOtp?: boolean;
  emailPasswordAlert?: boolean;
  emailDailyHabits?: boolean;
  emailEventReminder?: boolean;
  emailWeeklyReport?: boolean;
  emailStreakWarning?: boolean;
  emailDataExport?: boolean;
  emailLoginAlert?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
  smtpFrom?: string | null;
  googleClientId?: string | null;
  googleClientSecret?: string | null;
  googleRedirectUri?: string | null;
  goldApiKey?: string | null;
  userId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
