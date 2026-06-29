import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

export async function getAnalytics(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    // 1. Todo Stats
    const [totalTodos, completedTodos] = await Promise.all([
      prisma.todo.count({ where: { userId } }),
      prisma.todo.count({ where: { userId, done: true } }),
    ]);

    // 2. Focus Stats (Past 7 Days History)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        completedAt: { gte: sevenDaysAgo },
      },
      orderBy: { completedAt: 'asc' },
    });

    const totalFocusSessions = await prisma.focusSession.count({ where: { userId } });
    const totalFocusMinutesData = await prisma.focusSession.aggregate({
      where: { userId },
      _sum: { minutes: true },
    });
    const totalFocusMinutes = totalFocusMinutesData._sum.minutes || 0;

    // Group focus minutes by date for the last 7 days
    const focusHistory: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      focusHistory[key] = 0;
    }

    focusSessions.forEach((session: any) => {
      const key = session.completedAt.toISOString().split('T')[0];
      if (focusHistory[key] !== undefined) {
        focusHistory[key] += session.minutes;
      }
    });

    const focusHistoryList = Object.entries(focusHistory).map(([date, minutes]) => ({
      date,
      minutes,
    }));

    // 3. Habits Stats & Streaks
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        logs: {
          orderBy: { date: 'asc' },
        },
      },
    });

    const habitStats = habits.map((habit: any) => {
      const totalLogs = habit.logs.length;
      const logDates = habit.logs.map((log: any) => log.date);
      const streaks = calculateStreaks(logDates);

      // Completion rate in the last 7 days
      const lastWeekLogs = habit.logs.filter((log: any) => log.date >= sevenDaysAgo).length;
      const weeklyRate = Math.round((lastWeekLogs / 7) * 100);

      return {
        id: habit.id,
        name: habit.name,
        totalCompletions: totalLogs,
        weeklyCompletionRate: weeklyRate,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
      };
    });

    // 4. Heatmap Contribution Data (Past 365 Days)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    oneYearAgo.setHours(0, 0, 0, 0);

    const [todoCompletions, habitLogs, focusSessionsYear] = await Promise.all([
      // Assuming createdAt is completion date, or we can use updated/created since they are completed
      prisma.todo.findMany({
        where: {
          userId,
          done: true,
          createdAt: { gte: oneYearAgo },
        },
        select: { createdAt: true },
      }),
      prisma.habitLog.findMany({
        where: {
          userId,
          date: { gte: oneYearAgo },
        },
        select: { date: true },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          completedAt: { gte: oneYearAgo },
        },
        select: { completedAt: true },
      }),
    ]);

    const heatmap: Record<string, number> = {};

    todoCompletions.forEach((t: any) => {
      const key = t.createdAt.toISOString().split('T')[0];
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    habitLogs.forEach((hl: any) => {
      const key = hl.date.toISOString().split('T')[0];
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    focusSessionsYear.forEach((fs: any) => {
      const key = fs.completedAt.toISOString().split('T')[0];
      heatmap[key] = (heatmap[key] || 0) + 1;
    });

    const heatmapList = Object.entries(heatmap).map(([date, count]) => ({
      date,
      count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        todos: {
          total: totalTodos,
          completed: completedTodos,
          rate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
        },
        focus: {
          totalSessions: totalFocusSessions,
          totalMinutes: totalFocusMinutes,
          history: focusHistoryList,
        },
        habits: habitStats,
        heatmap: heatmapList,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('getAnalytics error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to generate analytics metrics.',
    });
  }
}

function calculateStreaks(dates: Date[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Strip timezone/time components to format unique YYYY-MM-DD strings
  const uniqueDates = Array.from(new Set(dates.map((d) => d.toISOString().split('T')[0])))
    .sort()
    .map((d) => new Date(d));

  let longest = 0;
  let current = 0;

  // Calculate longest streak
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const date of uniqueDates) {
    if (!lastDate) {
      tempStreak = 1;
    } else {
      const diffTime = date.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        if (tempStreak > longest) longest = tempStreak;
        tempStreak = 1;
      }
    }
    lastDate = date;
  }
  if (tempStreak > longest) longest = tempStreak;

  // Calculate current streak (scan backwards starting from today or yesterday)
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const dateStrings = uniqueDates.map((d) => d.toISOString().split('T')[0]);
  const hasToday = dateStrings.includes(todayStr);
  const hasYesterday = dateStrings.includes(yesterdayStr);

  if (hasToday || hasYesterday) {
    let checkDate = hasToday ? new Date(todayStr) : new Date(yesterdayStr);
    while (true) {
      const checkStr = checkDate.toISOString().split('T')[0];
      if (dateStrings.includes(checkStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  return { currentStreak: current, longestStreak: longest };
}
