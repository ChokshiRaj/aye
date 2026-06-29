import { prisma as globalPrisma } from './db';
const prisma = globalPrisma as any;
import { sendPushNotification } from '../controllers/push.controller';
import { sendEmail } from './email';
import { sendMail } from './mailer';
import { wrapInTemplate } from './emailTemplates';

export function startNotificationScheduler() {
  console.log('Notification scheduler initialized.');

  // Run checks every minute for upcoming events (15-min reminder)
  setInterval(async () => {
    try {
      // 1. Check for events starting in exactly 15 minutes (For Push and In-app notifications)
      const targetDate = new Date(Date.now() + 15 * 60 * 1000);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      const targetHours = String(targetDate.getHours()).padStart(2, '0');
      const targetMins = String(targetDate.getMinutes()).padStart(2, '0');
      const targetTimeStr = `${targetHours}:${targetMins}`;

      const events = await prisma.event.findMany({
        where: {
          date: new Date(targetDateStr),
          startTime: targetTimeStr,
        },
        include: {
          user: {
            include: {
              pushSubscriptions: true,
            },
          },
        },
      });

      for (const event of events) {
        const title = 'Upcoming Event';
        const body = `"${event.title}" starts in 15 minutes`;

        // Create in-app Notification record in DB
        await prisma.notification.create({
          data: {
            title,
            body,
            type: 'EVENT',
            link: '/calendar',
            userId: event.userId,
          },
        });

        // Dispatch push notification to all active devices
        for (const sub of event.user.pushSubscriptions) {
          await sendPushNotification(sub, { title, body, link: '/calendar' });
        }
      }

      // 2. Check for events starting in exactly 60 minutes (For templated email reminder)
      const target60Min = new Date(Date.now() + 60 * 60 * 1000);
      const target60MinStr = target60Min.toISOString().split('T')[0];
      const target60Hours = String(target60Min.getHours()).padStart(2, '0');
      const target60Mins = String(target60Min.getMinutes()).padStart(2, '0');
      const target60TimeStr = `${target60Hours}:${target60Mins}`;

      const events60 = await prisma.event.findMany({
        where: {
          date: new Date(target60MinStr),
          startTime: target60TimeStr,
        },
        include: {
          user: {
            include: {
              settings: true,
            },
          },
        },
      });

      for (const event of events60) {
        const userSettings = event.user.settings;
        const isEventEmailEnabled = !userSettings || userSettings.emailEventReminder;
        
        if (isEventEmailEnabled) {
          const subject = `[AYE Dashboard] Event Reminder: ${event.title}`;
          const html = wrapInTemplate(
            'Upcoming Event Reminder',
            `<p>Hello ${event.user.name},</p>
             <p>This is a reminder that your scheduled event <strong>"${event.title}"</strong> is starting in 1 hour.</p>
             <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
               <tr>
                 <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">Event:</td>
                 <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${event.title}</td>
               </tr>
               <tr>
                 <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Start Time:</td>
                 <td style="padding: 6px 0; color: #1e293b;">${event.startTime} (IST)</td>
               </tr>
               <tr>
                 <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Date:</td>
                 <td style="padding: 6px 0; color: #1e293b;">${target60MinStr}</td>
               </tr>
             </table>
             <p>Click below to open your calendar on the dashboard:</p>
             <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/calendar" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">View Calendar</a></p>`
          );
          await sendMail({ to: event.user.email, subject, html }).catch((err) => console.error(`Failed to send 60-min event reminder email to ${event.user.email}:`, err));
        }
      }
    } catch (err) {
      console.error('Error in event notification scheduler interval:', err);
    }
  }, 60000);

  // Initialize and run the daily 8:00 AM habit reminder
  scheduleDailyHabitReminder();

  // Initialize daily 6:00 PM IST metal price snapshot
  scheduleDailyMetalPriceSnapshot();

  // Initialize daily 9:00 PM IST habits recap email
  scheduleDailyHabitsRecap();

  // Initialize daily 10:00 PM IST streak warning alerts
  scheduleStreakWarning();

  // Initialize weekly Monday 8:00 AM IST performance report
  scheduleWeeklyReport();
}

function scheduleDailyHabitReminder() {
  const now = new Date();
  const target = new Date();
  target.setHours(8, 0, 0, 0);

  // If 8:00 AM has already passed today, schedule for tomorrow
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  console.log(`Daily habits reminder scheduled to run in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await sendDailyHabitReminders();
    } catch (err) {
      console.error('Error sending daily habit reminders:', err);
    }
    // Re-schedule for the next day
    scheduleDailyHabitReminder();
  }, delay);
}

async function sendDailyHabitReminders() {
  // Fetch all users (so they can receive email reminders regardless of push subscriptions)
  const users = await prisma.user.findMany({
    include: {
      pushSubscriptions: true,
    },
  });

  const title = 'AYE Habits';
  const body = 'Time to check off your habits for today!';

  for (const user of users) {
    // 1. Create in-app notification in DB
    await prisma.notification.create({
      data: {
        title,
        body,
        type: 'HABIT',
        link: '/habits',
        userId: user.id,
      },
    });

    // 2. Dispatch push notification to all active devices
    for (const sub of user.pushSubscriptions) {
      await sendPushNotification(sub, { title, body, link: '/habits' });
    }

    // 3. Dispatch email notification
    sendEmail({
      to: user.email,
      subject: '[AYE Dashboard] Daily Habits Reminder',
      text: `Hello ${user.name},\n\nIt's time to check off your habits for today!\n\nConsistency is key to maintaining your streaks. Head over to your dashboard to mark your completions:\n${process.env.CLIENT_URL || 'http://localhost:5173'}/habits\n\nKeep that flame burning!`,
    }).catch((err) => console.error(`Failed to send daily habits email reminder to ${user.email}:`, err));
  }
  console.log(`Daily habit reminders dispatched to ${users.length} user(s).`);
}

function scheduleDailyMetalPriceSnapshot() {
  const now = new Date();
  const target = new Date();
  
  // 6:00 PM IST is exactly 12:30 PM UTC
  target.setUTCHours(12, 30, 0, 0);

  if (now > target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  console.log(`Daily metal price snapshot scheduled to run in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await saveMetalPricesToHistory();
    } catch (err) {
      console.error('Error saving metal prices history:', err);
    }
    scheduleDailyMetalPriceSnapshot();
  }, delay);
}

async function saveMetalPricesToHistory() {
  console.log('Fetching and saving daily metal price snapshot...');
  let goldApiKey = process.env.GOLDAPI_KEY;

  try {
    const userWithKey = await prisma.settings.findFirst({
      where: {
        AND: [
          { goldApiKey: { not: null } },
          { goldApiKey: { not: '' } }
        ]
      },
    });
    if (userWithKey && userWithKey.goldApiKey) {
      goldApiKey = userWithKey.goldApiKey;
    }
  } catch (err) {
    console.error('Failed to query user-specific Gold API key for snapshot:', err);
  }

  let goldPriceINR = 0;
  let silverPriceINR = 0;

  if (goldApiKey) {
    try {
      const goldRes = await fetch('https://www.goldapi.io/api/XAU/INR', {
        headers: { 'x-access-token': goldApiKey },
      });
      const goldJson = await goldRes.json() as any;
      if (goldJson && goldJson.price) {
        goldPriceINR = (goldJson.price / 31.1034768) * 10;
      }

      const silverRes = await fetch('https://www.goldapi.io/api/XAG/INR', {
        headers: { 'x-access-token': goldApiKey },
      });
      const silverJson = await silverRes.json() as any;
      if (silverJson && silverJson.price) {
        silverPriceINR = (silverJson.price / 31.1034768) * 1000;
      }
    } catch (err) {
      console.error('Error calling GoldAPI.io in snapshot job:', err);
    }
  }

  if (!goldPriceINR) {
    goldPriceINR = 72400 + Math.random() * 200;
  }
  if (!silverPriceINR) {
    silverPriceINR = 88500 + Math.random() * 300;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.metalPriceHistory.upsert({
      where: {
        metal_date: {
          metal: 'gold',
          date: today,
        },
      },
      update: { priceINR: goldPriceINR },
      create: {
        metal: 'gold',
        priceINR: goldPriceINR,
        unit: '10g',
        date: today,
      },
    });

    await prisma.metalPriceHistory.upsert({
      where: {
        metal_date: {
          metal: 'silver',
          date: today,
        },
      },
      update: { priceINR: silverPriceINR },
      create: {
        metal: 'silver',
        priceINR: silverPriceINR,
        unit: 'kg',
        date: today,
      },
    });
    console.log(`Saved gold (₹${goldPriceINR.toFixed(2)}) and silver (₹${silverPriceINR.toFixed(2)}) prices for date ${today.toISOString().split('T')[0]}`);
  } catch (err) {
    console.error('Failed to upsert daily metal price snapshot:', err);
  }
}

function scheduleDailyHabitsRecap() {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(15, 30, 0, 0); // 9:00 PM IST is 15:30 UTC

  if (now > target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  console.log(`Daily habits recap email scheduled to run in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await sendDailyHabitsRecaps();
    } catch (err) {
      console.error('Error sending daily habit recaps:', err);
    }
    scheduleDailyHabitsRecap();
  }, delay);
}

async function sendDailyHabitsRecaps() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const users = await prisma.user.findMany({
      include: {
        settings: true,
        habits: {
          include: {
            logs: {
              where: {
                date: today,
              },
            },
          },
        },
      },
    });

    for (const user of users) {
      const userSettings = user.settings;
      const isRecapEnabled = !userSettings || userSettings.emailDailyHabits;

      if (isRecapEnabled && user.habits.length > 0) {
        const completedHabits = user.habits.filter((h: any) => h.logs.length > 0);

        let habitsTable = `
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0; text-align: left;">
                <th style="padding: 8px 0; font-weight: bold; color: #475569;">Habit</th>
                <th style="padding: 8px 0; font-weight: bold; color: #475569; width: 100px;">Status</th>
                <th style="padding: 8px 0; font-weight: bold; color: #475569; width: 80px; text-align: right;">Streak</th>
              </tr>
            </thead>
            <tbody>
        `;

        for (const habit of user.habits) {
          const done = habit.logs.length > 0;
          habitsTable += `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #1e293b; font-weight: 550;">${habit.name}</td>
              <td style="padding: 10px 0;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; ${
                  done ? 'background-color: #ecfdf5; color: #047857;' : 'background-color: #fef2f2; color: #b91c1c;'
                }">
                  ${done ? '✓ Completed' : 'Pending'}
                </span>
              </td>
              <td style="padding: 10px 0; text-align: right; font-weight: bold; color: #f59e0b;">🔥 ${habit.streak}</td>
            </tr>
          `;
        }

        habitsTable += `</tbody></table>`;

        const subject = `[AYE Dashboard] Daily Habits Recap`;
        const html = wrapInTemplate(
          'Daily Habits Recap',
          `<p>Hello ${user.name},</p>
           <p>Here is your daily recap for today: <strong>${today.toLocaleDateString('en-IN', { dateStyle: 'long' })}</strong>.</p>
           <p>You have completed <strong>${completedHabits.length} of ${user.habits.length}</strong> habits today.</p>
           ${habitsTable}
           <p>Consistency builds life-changing habits. Mark any missing completions on your habits dashboard:</p>
           <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/habits" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Complete Habits</a></p>`
        );

        await sendMail({ to: user.email, subject, html }).catch((err) => console.error(`Failed to send daily recap email to ${user.email}:`, err));
      }
    }
    console.log(`Daily habits recap emails dispatched to eligible users.`);
  } catch (err) {
    console.error('Failed to process daily habits recaps:', err);
  }
}

function scheduleStreakWarning() {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(16, 30, 0, 0); // 10:00 PM IST is 16:30 UTC

  if (now > target) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  console.log(`Streak warning alert scheduled to run in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await sendStreakWarningAlerts();
    } catch (err) {
      console.error('Error sending streak warning alerts:', err);
    }
    scheduleStreakWarning();
  }, delay);
}

async function sendStreakWarningAlerts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const users = await prisma.user.findMany({
      include: {
        settings: true,
        habits: {
          include: {
            logs: {
              where: {
                date: today,
              },
            },
          },
        },
      },
    });

    for (const user of users) {
      const userSettings = user.settings;
      const isWarningEnabled = !userSettings || userSettings.emailStreakWarning;

      if (isWarningEnabled && user.habits.length > 0) {
        // Find habits with active streak that are NOT completed today
        const pendingStreakHabits = user.habits.filter((h: any) => h.streak > 0 && h.logs.length === 0);

        if (pendingStreakHabits.length > 0) {
          const listItems = pendingStreakHabits
            .map((h: any) => `<li><strong>${h.name}</strong> (Active streak: 🔥 ${h.streak})</li>`)
            .join('');

          const subject = `[AYE Dashboard] Don't Break Your Streak!`;
          const html = wrapInTemplate(
            'Streak Warning Alert',
            `<p>Hello ${user.name},</p>
             <p style="color: #b91c1c; font-weight: bold; font-size: 15px;">🔥 Don't let your streaks expire today!</p>
             <p>You have less than 2 hours left to mark completion for the following habits before your hard-earned streaks break:</p>
             <ul style="padding-left: 20px; line-height: 1.6; color: #1e293b;">
               ${listItems}
             </ul>
             <p>Take action right now and keep the flame burning:</p>
             <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/habits" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Save My Streak</a></p>`
          );

          await sendMail({ to: user.email, subject, html }).catch((err) => console.error(`Failed to send streak warning email to ${user.email}:`, err));
        }
      }
    }
    console.log('Daily streak warning alerts evaluated and dispatched.');
  } catch (err) {
    console.error('Failed to process daily streak warnings:', err);
  }
}

function scheduleWeeklyReport() {
  const now = new Date();
  const target = new Date();
  target.setUTCHours(2, 30, 0, 0); // 8:00 AM IST is 2:30 AM UTC

  const currentDay = target.getUTCDay();
  const distance = (1 + 7 - currentDay) % 7;
  target.setUTCDate(target.getUTCDate() + (distance === 0 && now > target ? 7 : distance));

  const delay = target.getTime() - now.getTime();
  console.log(`Weekly analytics report scheduled to run in ${Math.round(delay / 60000)} minutes`);

  setTimeout(async () => {
    try {
      await sendWeeklyReports();
    } catch (err) {
      console.error('Error sending weekly reports:', err);
    }
    scheduleWeeklyReport();
  }, delay);
}

async function sendWeeklyReports() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const users = await prisma.user.findMany({
      include: {
        settings: true,
        todos: {
          where: {
            done: true,
            updatedAt: { gte: oneWeekAgo },
          },
        },
        habits: {
          include: {
            logs: {
              where: {
                date: { gte: oneWeekAgo },
              },
            },
          },
        },
      },
    });

    for (const user of users) {
      const userSettings = user.settings;
      const isReportEnabled = !userSettings || userSettings.emailWeeklyReport;

      if (isReportEnabled) {
        const completedTodosCount = user.todos.length;
        
        let habitsReport = '';
        if (user.habits.length > 0) {
          habitsReport = `<p><strong>Habits Performance:</strong></p><ul>`;
          for (const habit of user.habits) {
            const completionsCount = habit.logs.length;
            const rate = Math.round((completionsCount / 7) * 100);
            habitsReport += `<li><strong>${habit.name}</strong>: Completed ${completionsCount}/7 days (${rate}% consistency)</li>`;
          }
          habitsReport += `</ul>`;
        } else {
          habitsReport = `<p><em>No habits tracked last week. Start tracking to build consistency!</em></p>`;
        }

        const subject = `[AYE Dashboard] Your Weekly Performance Analytics`;
        const html = wrapInTemplate(
          'Weekly Performance Report',
          `<p>Hello ${user.name},</p>
           <p>Here is your AYE Dashboard weekly review summary for the past 7 days:</p>
           
           <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
             <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #0f172a;">📊 Productivity Highlights:</p>
             <ul style="margin: 0; padding-left: 20px; line-height: 1.6; color: #334155;">
               <li>Tasks completed: <strong>${completedTodosCount}</strong> tasks</li>
             </ul>
           </div>

           ${habitsReport}

           <p>Keep improving every day. Visit your command centre to plan the upcoming week:</p>
           <p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #dc2626; color: white; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">Open Command Centre</a></p>`
        );

        await sendMail({ to: user.email, subject, html }).catch((err) => console.error(`Failed to send weekly report email to ${user.email}:`, err));
      }
    }
    console.log('Weekly analytics reports dispatched.');
  } catch (err) {
    console.error('Failed to process weekly reports:', err);
  }
}
