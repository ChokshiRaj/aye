import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'AYE Dashboard <noreply@example.com>';

let transporter: nodemailer.Transporter | null = null;

// Initialize Nodemailer transporter if configuration is present
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports (587, 25, etc.)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  console.log(`Email service initialized with SMTP host: ${SMTP_HOST}`);
} else {
  console.warn(
    'SMTP configuration is missing or incomplete in environment variables. Email service will run in logging fallback mode.'
  );
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email to the specified recipient. If SMTP is not configured,
 * it falls back to printing the email contents to the server console.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailOptions) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
      });
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Email dispatched: ${info.messageId} to <${to}>`);
      }
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      console.error(`Nodemailer error sending to <${to}>:`, error);
      return { success: false, error: error.message || error };
    }
  } else {
    // Console logging fallback
    console.log('==================================================');
    console.log('           [FALLBACK EMAIL LOGGING]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log(text);
    console.log('==================================================');
    return { success: true, fallback: true };
  }
}
