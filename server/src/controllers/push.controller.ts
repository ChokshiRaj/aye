import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';
import webPush from 'web-push';

export async function getVapidPublicKey(_req: AuthenticatedRequest, res: Response) {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return res.status(500).json({
        success: false,
        error: 'VAPID public key not configured on server.',
      });
    }
    return res.status(200).json({
      success: true,
      data: { publicKey },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve VAPID public key.',
    });
  }
}

export async function subscribe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription payload.',
      });
    }

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId,
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Push subscribe error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to save push subscription.',
    });
  }
}

export async function unsubscribe(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint is required.',
      });
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Unsubscribed successfully.' },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Push unsubscribe error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe.',
    });
  }
}

export async function testPush(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active push subscriptions found for this user.',
      });
    }

    let successCount = 0;
    for (const sub of subscriptions) {
      const sent = await sendPushNotification(sub, {
        title: 'AYE Dashboard',
        body: 'This is a test browser push notification!',
      });
      if (sent) successCount++;
    }

    return res.status(200).json({
      success: true,
      data: { message: `Test push sent to ${successCount} device(s).` },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to dispatch test push.',
    });
  }
}

export async function sendPushNotification(
  subscription: any,
  payload: { title: string; body: string; link?: string }
): Promise<boolean> {
  try {
    const pushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };
    await webPush.sendNotification(pushSub, JSON.stringify(payload));
    return true;
  } catch (error: any) {
    // If the endpoint is expired or gone, delete it from DB
    if (error.statusCode === 410 || error.statusCode === 404) {
      try {
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
      } catch {}
    }
    console.error('sendPushNotification error:', error.message || error);
    return false;
  }
}
