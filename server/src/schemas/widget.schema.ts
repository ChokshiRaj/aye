import { z } from 'zod';

// Todo Schemas
export const createTodoSchema = z.object({
  text: z.string().min(1, 'Todo text cannot be empty'),
});

export const updateTodoSchema = z.object({
  text: z.string().min(1, 'Todo text cannot be empty').optional(),
  done: z.boolean().optional(),
});

// Note Schemas
export const upsertNoteSchema = z.object({
  content: z.string(),
});

// Habit Schemas
export const createHabitSchema = z.object({
  name: z.string().min(1, 'Habit name cannot be empty'),
});

export const habitLogSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

// Bookmark Schemas
export const createBookmarkSchema = z.object({
  name: z.string().min(1, 'Bookmark name cannot be empty'),
  url: z.string().url('Invalid URL format'),
  icon: z.string().optional(),
});

export const updateBookmarkSchema = z.object({
  name: z.string().min(1, 'Bookmark name cannot be empty').optional(),
  url: z.string().url('Invalid URL format').optional(),
  icon: z.string().optional(),
});

// Settings Schemas
export const updateSettingsSchema = z.object({
  city: z.string().min(1, 'City cannot be empty').optional(),
  timezone: z.string().min(1, 'Timezone cannot be empty').optional(),
  stockTickers: z.array(z.string()).optional(),
  newsApiKey: z.string().optional().nullable(),
  showCrypto: z.boolean().optional(),
});

// Event Schemas
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().min(1, 'Start time cannot be empty'),
  endTime: z.string().min(1, 'End time cannot be empty'),
  category: z.enum(['work', 'personal', 'important', 'other']).default('work'),
  description: z.string().optional().nullable(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  startTime: z.string().min(1, 'Start time cannot be empty').optional(),
  endTime: z.string().min(1, 'End time cannot be empty').optional(),
  category: z.enum(['work', 'personal', 'important', 'other']).optional(),
  description: z.string().optional().nullable(),
});

