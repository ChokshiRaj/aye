import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { prisma } from './utils/db';

// Import routes
import authRoutes from './routes/auth.routes';
import todoRoutes from './routes/todo.routes';
import noteRoutes from './routes/note.routes';
import habitRoutes from './routes/habit.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import settingsRoutes from './routes/settings.routes';
import eventRoutes from './routes/event.routes';
import pushRoutes from './routes/push.routes';
import notificationRoutes from './routes/notification.routes';
import focusRoutes from './routes/focus.routes';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';
import marketsRoutes from './routes/markets.routes';
import gmailRoutes from './routes/gmail.routes';

import { initializeVapidKeys } from './utils/vapid';
import { startNotificationScheduler } from './utils/notificationScheduler';

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent
  })
);

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check — available at both /health and /api/health
const healthHandler = async (_req: Request, res: Response) => {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'CONNECTED',
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
    });
  }
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings/export', exportRoutes);
app.use('/api/markets', marketsRoutes);
app.use('/api/gmail', gmailRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled error:', err);
  }
  
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An internal server error occurred',
  });
});

// Start Server
async function start() {
  try {
    // Dynamically align PostgreSQL schema for newsApiKey
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Settings" ADD COLUMN IF NOT EXISTS "newsApiKey" TEXT;
    `);
    console.log('Database schema settings.newsApiKey aligned.');

    // Phase 2 Database Table Alignment
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
              CREATE TYPE "NotificationType" AS ENUM ('HABIT', 'EVENT', 'TODO', 'SYSTEM', 'FOCUS');
          END IF;
      END$$;
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT PRIMARY KEY,
        "endpoint" TEXT UNIQUE NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "type" "NotificationType" NOT NULL,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "link" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FocusSession" (
        "id" TEXT PRIMARY KEY,
        "minutes" INTEGER NOT NULL,
        "completedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);
    console.log('Phase 2 database tables checked and aligned.');

    // Initialize VAPID key configurations
    initializeVapidKeys();

    // Start cron/interval tasks scheduler
    startNotificationScheduler();
  } catch (err) {
    console.error('Database schema migration warning:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

start();
