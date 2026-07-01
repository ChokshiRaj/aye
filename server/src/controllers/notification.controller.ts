import { Request, Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';
import { sendPushNotification } from './push.controller';

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

export async function createDeviceAlert(req: Request, res: Response) {
  try {
    const { userId, deviceName } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required.' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const device = deviceName || 'Local Laptop';
    const alertMessage = `💻 Laptop (${device}) was unlocked/opened at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}.`;

    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title: 'Device Unlock Notification',
        body: alertMessage,
        type: 'SYSTEM',
        read: false,
      },
    });

    // Dispatch Push Notification to all subscribed browsers
    try {
      const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
      for (const sub of subscriptions) {
        await sendPushNotification(sub, {
          title: 'Device Unlock Notification',
          body: alertMessage,
          link: '/notifications',
        });
      }
    } catch (pushErr) {
      console.error('Failed to send device push notification:', pushErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Device alert triggered successfully.',
      data: notification,
    });
  } catch (error: any) {
    console.error('Device alert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create device alert.',
    });
  }
}
