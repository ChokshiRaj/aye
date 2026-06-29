import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getHabits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    // Fetch habits with logs from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: habits,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getHabits error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve habits.',
    });
  }
}

export async function createHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    const habit = await prisma.habit.create({
      data: {
        name,
        userId,
      },
      include: {
        logs: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: habit,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('createHabit error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to create habit.',
    });
  }
}

export async function logHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id: habitId } = req.params;
    
    // Parse date from request body, default to today (UTC start of day)
    const dateStr = req.body.date || new Date().toISOString().split('T')[0];
    const logDate = new Date(dateStr + 'T00:00:00.000Z');

    // Verify habit ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found or access denied.',
      });
    }

    // Create or find the log (idempotent operation)
    const log = await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: logDate,
        },
      },
      update: {},
      create: {
        habitId,
        date: logDate,
        userId,
      },
    });

    // Create in-app notification for logged habit
    try {
      await prisma.notification.create({
        data: {
          title: 'Habit logged',
          body: `"${habit.name}" checked for today!`,
          type: 'HABIT',
          userId,
        },
      });
    } catch (notiErr) {
      console.error('Failed to auto-create habit notification:', notiErr);
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('logHabit error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to log habit completion.',
    });
  }
}

export async function unlogHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id: habitId } = req.params;
    
    // Parse date from request query/body, default to today
    const dateStr = (req.body.date || req.query.date || new Date().toISOString().split('T')[0]) as string;
    const logDate = new Date(dateStr + 'T00:00:00.000Z');

    // Verify habit ownership
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found or access denied.',
      });
    }

    try {
      await prisma.habitLog.delete({
        where: {
          habitId_date: {
            habitId,
            date: logDate,
          },
        },
      });
    } catch (dbErr: any) {
      // Prisma error code for Record to delete not found
      if (dbErr.code !== 'P2025') {
        throw dbErr;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        message: 'Habit log removed successfully.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('unlogHabit error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to remove habit log.',
    });
  }
}

export async function deleteHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Verify ownership
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found or access denied.',
      });
    }

    await prisma.habit.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'Habit deleted successfully.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('deleteHabit error:', error);
    }
    return res.status(550).json({
      success: false,
      error: 'Failed to delete habit.',
    });
  }
}

export async function updateHabit(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { name } = req.body;

    // Verify ownership
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Habit not found or access denied.',
      });
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: { name },
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('updateHabit error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update habit.',
    });
  }
}
