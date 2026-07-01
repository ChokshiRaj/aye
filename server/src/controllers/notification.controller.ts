import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve notifications.',
    });
  }
}

export async function getUnreadCount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const count = await prisma.notification.count({
      where: { userId, read: false },
    });

    return res.status(200).json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve unread count.',
    });
  }
}

export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Notification marked as read.' },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read.',
    });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'All notifications marked as read.' },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read.',
    });
  }
}

export async function deleteNotification(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.notification.deleteMany({
      where: { id, userId },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Notification deleted successfully.' },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to delete notification.',
    });
  }
}

export async function clearAllNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    await prisma.notification.deleteMany({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'All notifications cleared.' },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to clear notifications.',
    });
  }
}

