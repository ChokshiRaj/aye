import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function logFocusSession(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { minutes } = req.body;

    if (!minutes || typeof minutes !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Minutes (number) is required.',
      });
    }

    // 1. Create Focus Session record
    const session = await prisma.focusSession.create({
      data: {
        minutes,
        userId,
      },
    });

    // 2. Create in-app Notification record
    await prisma.notification.create({
      data: {
        title: 'Focus complete',
        body: `You completed a ${minutes}-minute focus session!`,
        type: 'FOCUS',
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('logFocusSession error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to log focus session.',
    });
  }
}
