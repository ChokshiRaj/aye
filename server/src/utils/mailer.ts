import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'AYE Dashboard <noreply@example.com>';

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`SMTP Mailer initialized successfully. Host: ${SMTP_HOST}`);
} else {
  console.warn(
    'SMTP configuration is missing or incomplete in environment variables. Email service will run in console logging fallback mode.'
  );
}

import { prisma as globalPrisma } from './db';
const prisma = globalPrisma as any;

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  attachments?: any[];
}): Promise<void> {
  let activeTransporter = transporter;
  let fromAddress = SMTP_FROM;

  try {
    const user = await prisma.user.findUnique({
      where: { email: options.to },
      include: { settings: true },
    });

    if (user && user.settings) {
      const s = user.settings;
      if (s.smtpHost && s.smtpUser && s.smtpPass) {
        const port = s.smtpPort || 587;
        activeTransporter = nodemailer.createTransport({
          host: s.smtpHost,
          port: port,
          secure: port === 465,
          auth: {
            user: s.smtpUser,
            pass: s.smtpPass,
          },
        });
        fromAddress = s.smtpFrom || `"${user.name}" <${s.smtpUser}>`;
      }
    }
  } catch (err) {
    console.error('Failed to look up dynamic SMTP settings, falling back to system default:', err);
  }

  if (activeTransporter) {
    try {
      await activeTransporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Email sent successfully to <${options.to}>: "${options.subject}"`);
      }
    } catch (error: any) {
      console.error(`Error sending email via SMTP to <${options.to}>:`, error);
      throw error;
    }
  } else {
    // Fallback logging to console
    console.log('==================================================');
    console.log('           [FALLBACK SMTP EMAIL LOG]');
    console.log(`To:          ${options.to}`);
    console.log(`Subject:     ${options.subject}`);
    console.log(`Attachments: ${options.attachments ? options.attachments.length : 0} file(s)`);
    console.log('--------------------------------------------------');
    // A simplified HTML content view for terminal
    console.log(options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500) + '...');
    console.log('==================================================');
  }
}
