import { Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';
import { sendMail } from '../utils/mailer';
import { wrapInTemplate } from '../utils/emailTemplates';

async function sendExportEmailNotification(userId: string, exportType: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const settings = await prisma.settings.findUnique({ where: { userId } });
    const isExportEmailEnabled = !settings || settings.emailDataExport;

    if (isExportEmailEnabled) {
      const subject = `[AYE Dashboard] Security Alert: Data Export Triggered`;
      const html = wrapInTemplate(
        'Data Export Triggered',
        `<p>Hello ${user.name},</p>
         <p>This is a security notification to let you know that a backup export of your <strong>${exportType}</strong> was successfully generated and downloaded.</p>
         <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 120px;">Export Type:</td>
             <td style="padding: 6px 0; color: #1e293b; font-weight: bold;">${exportType}</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Date/Time:</td>
             <td style="padding: 6px 0; color: #1e293b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
           </tr>
         </table>
         <p>If you did not authorize this backup export, please change your password immediately to prevent unauthorized access to your personal files.</p>`
      );
      await sendMail({ to: user.email, subject, html });
    }
  } catch (err) {
    console.error('Failed to send export confirmation email:', err);
  }
}

export async function exportTodos(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    let csvContent = 'ID,Text,Completed,CreatedAt\n';
    todos.forEach((todo: any) => {
      const escapedText = `"${todo.text.replace(/"/g, '""')}"`;
      csvContent += `${todo.id},${escapedText},${todo.done},${todo.createdAt.toISOString()}\n`;
    });

    sendExportEmailNotification(userId, 'Task Records (CSV)').catch(console.error);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=aye_tasks.csv');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to export task records.',
    });
  }
}

export async function exportHabits(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: { logs: true },
      orderBy: { createdAt: 'asc' },
    });

    let csvContent = 'ID,HabitName,CompletionsCount,CreatedAt\n';
    habits.forEach((habit: any) => {
      const escapedName = `"${habit.name.replace(/"/g, '""')}"`;
      csvContent += `${habit.id},${escapedName},${habit.logs.length},${habit.createdAt.toISOString()}\n`;
    });

    sendExportEmailNotification(userId, 'Habit Logs (CSV)').catch(console.error);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=aye_habits.csv');
    return res.status(200).send(csvContent);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to export habit records.',
    });
  }
}

export async function exportNotes(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    let mdContent = `# AYE Notes Backup\nExported on: ${new Date().toLocaleDateString()}\n\n---\n\n`;
    if (notes.length === 0) {
      mdContent += '*No notes found to backup.*\n';
    } else {
      notes.forEach((note: any) => {
        const title = note.content.split('\n')[0].replace(/^#+\s*/, '').substring(0, 40) || 'Untitled Note';
        mdContent += `## ${title}\n`;
        mdContent += `*Last Updated: ${note.updatedAt.toLocaleString()}*\n\n`;
        mdContent += `${note.content}\n\n`;
        mdContent += `---\n\n`;
      });
    }

    sendExportEmailNotification(userId, 'Personal Notes (MD)').catch(console.error);

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', 'attachment; filename=aye_notes.md');
    return res.status(200).send(mdContent);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to export note records.',
    });
  }
}

export async function exportFullDump(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const [user, settings, todos, habits, notes, focusSessions, notifications] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, mobile: true, createdAt: true },
      }),
      prisma.settings.findFirst({ where: { userId } }),
      prisma.todo.findMany({ where: { userId } }),
      prisma.habit.findMany({ where: { userId }, include: { logs: true } }),
      prisma.note.findMany({ where: { userId } }),
      prisma.focusSession.findMany({ where: { userId } }),
      prisma.notification.findMany({ where: { userId } }),
    ]);

    const backupDump = {
      exportedAt: new Date().toISOString(),
      profile: user,
      settings,
      todos,
      habits,
      notes,
      focusSessions,
      notifications,
    };

    sendExportEmailNotification(userId, 'Comprehensive Backup Dump (JSON)').catch(console.error);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=aye_full_backup.json');
    return res.status(200).json(backupDump);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive data backup.',
    });
  }
}
