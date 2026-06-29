import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

function maskSensitiveSettings(settings: any) {
  if (!settings) return settings;
  const copy = { ...settings };
  if (copy.smtpPass) copy.smtpPass = '••••••••';
  if (copy.googleClientSecret) copy.googleClientSecret = '••••••••';
  return copy;
}

export async function getSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: {},
      create: {
        city: 'Vadodara',
        timezone: 'Asia/Kolkata',
        stockTickers: ['NIFTY', 'RELIANCE', 'TCS'],
        showCrypto: false,
        emailLoginOtp: false,
        emailPasswordAlert: true,
        emailDailyHabits: true,
        emailEventReminder: true,
        emailWeeklyReport: true,
        emailStreakWarning: true,
        emailDataExport: true,
        emailLoginAlert: true,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: maskSensitiveSettings(settings),
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getSettings error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve settings.',
    });
  }
}

export async function updateSettings(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const {
      city,
      timezone,
      stockTickers,
      newsApiKey,
      showCrypto,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpFrom,
      googleClientId,
      googleClientSecret,
      googleRedirectUri,
      goldApiKey,
    } = req.body;

    const updateObj: any = {
      ...(city !== undefined && { city }),
      ...(timezone !== undefined && { timezone }),
      ...(stockTickers !== undefined && { stockTickers }),
      ...(newsApiKey !== undefined && { newsApiKey }),
      ...(showCrypto !== undefined && { showCrypto }),
      ...(smtpHost !== undefined && { smtpHost }),
      ...(smtpPort !== undefined && { smtpPort: smtpPort ? parseInt(smtpPort, 10) : null }),
      ...(smtpUser !== undefined && { smtpUser }),
      ...(smtpPass !== undefined && smtpPass !== '••••••••' && { smtpPass }),
      ...(smtpFrom !== undefined && { smtpFrom }),
      ...(googleClientId !== undefined && { googleClientId }),
      ...(googleClientSecret !== undefined && googleClientSecret !== '••••••••' && { googleClientSecret }),
      ...(googleRedirectUri !== undefined && { googleRedirectUri }),
      ...(goldApiKey !== undefined && { goldApiKey }),
    };

    const createObj: any = {
      city: city || 'Vadodara',
      timezone: timezone || 'Asia/Kolkata',
      stockTickers: stockTickers || ['NIFTY', 'RELIANCE', 'TCS'],
      newsApiKey: newsApiKey || null,
      showCrypto: showCrypto || false,
      smtpHost: smtpHost || null,
      smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
      smtpUser: smtpUser || null,
      smtpPass: smtpPass && smtpPass !== '••••••••' ? smtpPass : null,
      smtpFrom: smtpFrom || null,
      googleClientId: googleClientId || null,
      googleClientSecret: googleClientSecret && googleClientSecret !== '••••••••' ? googleClientSecret : null,
      googleRedirectUri: googleRedirectUri || null,
      goldApiKey: goldApiKey || null,
      userId,
    };

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: updateObj,
      create: createObj,
    });

    return res.status(200).json({
      success: true,
      data: maskSensitiveSettings(settings),
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('updateSettings error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update settings.',
    });
  }
}

export async function updateEmailPreferences(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const {
      emailLoginOtp,
      emailDailyHabits,
      emailEventReminder,
      emailWeeklyReport,
      emailStreakWarning,
      emailDataExport,
      emailLoginAlert,
    } = req.body;

    // Enforce emailPasswordAlert is always true for security reasons
    const updateData = {
      ...(emailLoginOtp !== undefined && { emailLoginOtp }),
      emailPasswordAlert: true,
      ...(emailDailyHabits !== undefined && { emailDailyHabits }),
      ...(emailEventReminder !== undefined && { emailEventReminder }),
      ...(emailWeeklyReport !== undefined && { emailWeeklyReport }),
      ...(emailStreakWarning !== undefined && { emailStreakWarning }),
      ...(emailDataExport !== undefined && { emailDataExport }),
      ...(emailLoginAlert !== undefined && { emailLoginAlert }),
    };

    const settings = await prisma.settings.upsert({
      where: { userId },
      update: updateData,
      create: {
        ...updateData,
        city: 'Vadodara',
        timezone: 'Asia/Kolkata',
        stockTickers: ['NIFTY', 'RELIANCE', 'TCS'],
        showCrypto: false,
        userId,
      },
    });

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('updateEmailPreferences error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update email preferences.',
    });
  }
}

function formatTimeAgo(isoString: string) {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  } catch {
    return 'just now';
  }
}

export async function getNewsHeadlines(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const settings = await prisma.settings.findUnique({
      where: { userId },
    });

    const newsApiKey = (settings as any)?.newsApiKey;

    if (newsApiKey) {
      // Fetch real news from NewsAPI.org
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us&apiKey=${newsApiKey}`
      );
      if (response.ok) {
        const data = await response.json() as any;
        if (data.status === 'ok' && Array.isArray(data.articles)) {
          const stories = data.articles.slice(0, 5).map((art: any, index: number) => ({
            id: `newsapi-${index}`,
            title: art.title || 'No Title',
            url: art.url || '#',
            source: art.source?.name || 'NewsAPI',
            time: formatTimeAgo(art.publishedAt || new Date().toISOString()),
          }));
          return res.status(200).json({ success: true, data: stories });
        }
      }
    }

    // Fallback to Hacker News if key not present or fetch failed
    const hnResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const topIds = (await hnResponse.json() as any).slice(0, 5);
    const stories = await Promise.all(
      topIds.map(async (id: number) => {
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await itemRes.json() as any;
        return {
          id: item.id,
          title: item.title || 'No Title',
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          source: 'Hacker News',
          time: formatTimeAgo(new Date(item.time * 1000).toISOString()),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getNewsHeadlines error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve news headlines.',
    });
  }
}
