import api from './axios';
import { ApiResponse, Todo, Note, Habit, HabitLog, Bookmark, Settings } from '../types';

export const widgetsApi = {
  // Todos endpoints
  getTodos: async (): Promise<ApiResponse<Todo[]>> => {
    const response = await api.get<ApiResponse<Todo[]>>('/api/todos');
    return response.data;
  },
  createTodo: async (text: string): Promise<ApiResponse<Todo>> => {
    const response = await api.post<ApiResponse<Todo>>('/api/todos', { text });
    return response.data;
  },
  updateTodo: async (id: string, updates: Partial<Todo>): Promise<ApiResponse<Todo>> => {
    const response = await api.patch<ApiResponse<Todo>>(`/api/todos/${id}`, updates);
    return response.data;
  },
  deleteTodo: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/todos/${id}`);
    return response.data;
  },

  // Notes endpoints
  getNote: async (): Promise<ApiResponse<Note>> => {
    const response = await api.get<ApiResponse<Note>>('/api/notes');
    return response.data;
  },
  upsertNote: async (content: string): Promise<ApiResponse<Note>> => {
    const response = await api.put<ApiResponse<Note>>('/api/notes', { content });
    return response.data;
  },

  // Habits endpoints
  getHabits: async (): Promise<ApiResponse<Habit[]>> => {
    const response = await api.get<ApiResponse<Habit[]>>('/api/habits');
    return response.data;
  },
  createHabit: async (name: string): Promise<ApiResponse<Habit>> => {
    const response = await api.post<ApiResponse<Habit>>('/api/habits', { name });
    return response.data;
  },
  logHabit: async (id: string, date?: string): Promise<ApiResponse<HabitLog>> => {
    const response = await api.post<ApiResponse<HabitLog>>(`/api/habits/${id}/log`, { date });
    return response.data;
  },
  unlogHabit: async (id: string, date?: string): Promise<ApiResponse<{ message: string }>> => {
    // Pass date as query parameter
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/habits/${id}/log`, {
      params: { date },
    });
    return response.data;
  },
  deleteHabit: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/habits/${id}`);
    return response.data;
  },

  // Bookmarks endpoints
  getBookmarks: async (): Promise<ApiResponse<Bookmark[]>> => {
    const response = await api.get<ApiResponse<Bookmark[]>>('/api/bookmarks');
    return response.data;
  },
  createBookmark: async (bookmark: { name: string; url: string; icon?: string }): Promise<ApiResponse<Bookmark>> => {
    const response = await api.post<ApiResponse<Bookmark>>('/api/bookmarks', bookmark);
    return response.data;
  },
  deleteBookmark: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/bookmarks/${id}`);
    return response.data;
  },
  updateBookmark: async (
    id: string,
    bookmark: Partial<{ name: string; url: string; icon: string }>
  ): Promise<ApiResponse<Bookmark>> => {
    const response = await api.put<ApiResponse<Bookmark>>(`/api/bookmarks/${id}`, bookmark);
    return response.data;
  },

  // Settings endpoints
  getSettings: async (): Promise<ApiResponse<Settings>> => {
    const response = await api.get<ApiResponse<Settings>>('/api/settings');
    return response.data;
  },
  updateSettings: async (settings: Partial<Settings>): Promise<ApiResponse<Settings>> => {
    const response = await api.put<ApiResponse<Settings>>('/api/settings', settings);
    return response.data;
  },
  getNewsHeadlines: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/api/settings/news');
    return response.data;
  },

  // Habits update endpoint
  updateHabit: async (id: string, name: string): Promise<ApiResponse<Habit>> => {
    const response = await api.put<ApiResponse<Habit>>(`/api/habits/${id}`, { name });
    return response.data;
  },

  // Events endpoints
  getEvents: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>('/api/events');
    return response.data;
  },
  createEvent: async (event: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    category: string;
    description?: string | null;
  }): Promise<ApiResponse<any>> => {
    const response = await api.post<ApiResponse<any>>('/api/events', event);
    return response.data;
  },
  updateEvent: async (
    id: string,
    event: Partial<{
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      category: string;
      description: string | null;
    }>
  ): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>(`/api/events/${id}`, event);
    return response.data;
  },
  deleteEvent: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/api/events/${id}`);
    return response.data;
  },

  // Gmail OAuth endpoints
  getGmailAuthUrl: async (): Promise<ApiResponse<{ authUrl: string }>> => {
    const response = await api.get<ApiResponse<{ authUrl: string }>>('/api/gmail/auth-url');
    return response.data;
  },
  getGmailStatus: async (): Promise<ApiResponse<{ connected: boolean; email?: string }>> => {
    const response = await api.get<ApiResponse<{ connected: boolean; email?: string }>>('/api/gmail/status');
    return response.data;
  },
  disconnectGmail: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete<ApiResponse<{ message: string }>>('/api/gmail/disconnect');
    return response.data;
  },
  getGmailInbox: async (): Promise<ApiResponse<{ connected: boolean; unreadCount: number; messages: any[] }>> => {
    const response = await api.get<ApiResponse<{ connected: boolean; unreadCount: number; messages: any[] }>>('/api/gmail/inbox');
    return response.data;
  },

  // Email Notification Preferences
  updateEmailPreferences: async (preferences: Partial<Settings>): Promise<ApiResponse<Settings>> => {
    const response = await api.put<ApiResponse<Settings>>('/api/settings/email-preferences', preferences);
    return response.data;
  },
};
export default widgetsApi;
