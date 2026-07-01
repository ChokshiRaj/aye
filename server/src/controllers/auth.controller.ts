import { Request, Response } from 'express';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/authenticate';
import * as jwt from 'jsonwebtoken';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { sendEmail } from '../utils/email';
import { sendMail } from '../utils/mailer';
import { wrapInTemplate } from '../utils/emailTemplates';

// Helper to get cookies from request headers
function getCookie(req: Request, name: string): string | undefined {
  const rawCookies = req.headers.cookie;
  if (!rawCookies) return undefined;
  const cookie = rawCookies.split('; ').find((c) => c.startsWith(`${name}=`));
  if (!cookie) return undefined;
  return decodeURIComponent(cookie.substring(name.length + 1));
}

// Helper to set refresh token cookie
function setRefreshTokenCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `refreshToken=${encodeURIComponent(token)}; HttpOnly; ${
      isProduction ? 'Secure; ' : ''
    }Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
  );
}

// Helper to clear refresh token cookie
function clearRefreshTokenCookie(res: Response) {
  res.setHeader(
    'Set-Cookie',
    `refreshToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
  );
}

// Helper to create a new session
async function createSession(userId: string, token: string, req: Request) {
  const userAgent = req.headers['user-agent'] || null;
  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || null;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days in database

  await prisma.session.create({
    data: {
      userId,
      token,
      userAgent,
      ip,
      expiresAt,
    },
  });
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    // Check User Settings for OTP preference
    const userSettings = await prisma.settings.findUnique({
      where: { userId: user.id },
    });

    const isOtpRequired = process.env.ENABLE_LOGIN_OTP === 'true' && (!userSettings || userSettings.emailLoginOtp);

    if (isOtpRequired) {
      const otpCode = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.loginOtp.create({
        data: {
          otp: otpCode,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
          userId: user.id,
        },
      });

      // Send OTP Mail
      const subject = '[AYE Dashboard] Login Verification OTP';
      const html = wrapInTemplate(
        'Verify Your Login',
        `<p>Hello ${user.name},</p>
         <p>Use the following one-time password (OTP) to log in to your AYE Personal Command Centre account. This OTP is valid for 5 minutes.</p>
         <div style="font-size: 24px; font-weight: bold; letter-spacing: 0.15em; text-align: center; margin: 24px 0; color: #dc2626; background-color: #fef2f2; padding: 12px; border-radius: 8px; border: 1px solid #fecaca; display: inline-block; width: 100%; max-width: 200px;">
           ${otpCode}
         </div>
         <p>If you did not initiate this login request, please ignore this email and secure your account.</p>`
      );
      await sendMail({ to: user.email, subject, html })
        .catch((err) => console.error('Failed to send login OTP email:', err));

      return res.status(200).json({
        success: true,
        data: {
          requireOtp: true,
          userId: user.id,
        },
      });
    }

    // If 2FA is enabled, trigger the code challenge
    if (user.twoFactorEnabled) {
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_at_least_32_characters';
      const tempToken = jwt.sign({ userId: user.id, temp2fa: true }, ACCESS_SECRET, { expiresIn: '5m' });
      
      return res.status(200).json({
        success: true,
        data: {
          require2FA: true,
          temp2faToken: tempToken,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Create session in database
    await createSession(user.id, refreshToken, req);

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };

    // Asynchronously send login alert email
    const sendAlert = !userSettings || userSettings.emailLoginAlert;
    if (sendAlert) {
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
      
      const subject = '[AYE Dashboard] New Login Detected';
      const html = wrapInTemplate(
        'New Account Login',
        `<p>Hello ${user.name},</p>
         <p>A new login was detected on your AYE Dashboard account.</p>
         <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">Date/Time:</td>
             <td style="padding: 6px 0; color: #1e293b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">IP Address:</td>
             <td style="padding: 6px 0; color: #1e293b;">${ip}</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Device Info:</td>
             <td style="padding: 6px 0; color: #1e293b;">${userAgent}</td>
           </tr>
         </table>
         <p>If this was not you, please change your password immediately to secure your account.</p>`
      );
      await sendMail({ to: user.email, subject, html }).catch((err) => console.error('Failed to send login alert email:', err));
    }

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Login error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'An error occurred during login. Please try again.',
    });
  }
}

export async function loginVerify2fa(req: Request, res: Response) {
  try {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
      return res.status(400).json({
        success: false,
        error: 'Temporary token and verification code are required.',
      });
    }

    // Verify temporary token
    const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_at_least_32_characters';
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: '2FA session expired. Please log in again.',
      });
    }

    if (!decoded.temp2fa || !decoded.userId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid session context.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: 'User has not activated two-factor authentication.',
      });
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Create session in database
    await createSession(user.id, refreshToken, req);

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };

    // Asynchronously send login alert email
    const userSettings = await prisma.settings.findUnique({
      where: { userId: user.id },
    });
    const sendAlert = !userSettings || userSettings.emailLoginAlert;
    if (sendAlert) {
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
      
      const subject = '[AYE Dashboard] New Login Detected (2FA Verified)';
      const html = wrapInTemplate(
        'New Account Login (2FA)',
        `<p>Hello ${user.name},</p>
         <p>A new login was detected and successfully verified via Two-Factor Authentication (2FA) on your AYE Dashboard account.</p>
         <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">Date/Time:</td>
             <td style="padding: 6px 0; color: #1e293b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">IP Address:</td>
             <td style="padding: 6px 0; color: #1e293b;">${ip}</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Device Info:</td>
             <td style="padding: 6px 0; color: #1e293b;">${userAgent}</td>
           </tr>
         </table>
         <p>If this was not you, please change your password immediately to secure your account.</p>`
      );
      await sendMail({ to: user.email, subject, html }).catch((err) => console.error('Failed to send 2FA login alert email:', err));
    }

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('2FA Login verification error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to verify verification code.',
    });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token not found.',
      });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token.',
      });
    }

    // Verify session still exists in DB
    const session = await prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      // SECURITY ANOMALY: A cryptographically valid refresh token was presented
      // but it does not exist in our active sessions database (meaning it was either
      // explicitly revoked/logged out, or already rotated out/reused).
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      console.warn(`[SECURITY ALERT] Revoked or rotated refresh token presented for user ${payload.userId} from IP ${ip}.`);

      try {
        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (user) {
          const subject = '[AYE Dashboard] Security Alert: Revoked Session Token Attempt';
          const html = wrapInTemplate(
            'Security Warning: Token Reuse or Revocation',
            `<p>Hello ${user.name},</p>
             <p style="color: #dc2626; font-weight: bold;">An expired, revoked, or previously rotated session token was presented to AYE Dashboard.</p>
             <p>This occurs when a device tries to authenticate using a token that has been cleared from the database. If you did not recently log out of a browser or device, this may indicate a token theft attempt.</p>
             <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
               <tr>
                 <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">IP Address:</td>
                 <td style="padding: 6px 0; color: #1e293b;">${ip}</td>
               </tr>
               <tr>
                 <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Device Info:</td>
                 <td style="padding: 6px 0; color: #1e293b;">${userAgent}</td>
               </tr>
             </table>
             <p>As a precaution, you can manage active devices in your settings, or change your password to immediately clear all active credentials.</p>`
          );
          await sendMail({ to: user.email, subject, html }).catch((err) =>
            console.error('Failed to send token reuse security email:', err)
          );
        }
      } catch (err) {
        console.error('Error logging token reuse alert:', err);
      }

      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        error: 'Session expired or revoked.',
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId);

    // Rotate the session token in database
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set cookie
    setRefreshTokenCookie(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Refresh token error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'An error occurred during token refresh.',
    });
  }
}

export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    const refreshToken = getCookie(req, 'refreshToken');

    if (refreshToken) {
      await prisma.session.deleteMany({
        where: { token: refreshToken },
      });
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Logout error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'An error occurred during logout.',
    });
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Get profile error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'An error occurred while fetching user profile.',
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { name, email, mobile } = req.body;

    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({
          success: false,
          error: 'A user with this email address already exists.',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(mobile !== undefined && { mobile: mobile || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Update profile error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile details.',
    });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'The current password you entered is incorrect.',
      });
    }

    const newPasswordHash = await hashPassword(newPassword);

    // Invalidate ALL sessions across all devices for this user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    // Create security update in-app notification
    try {
      await prisma.notification.create({
        data: {
          title: 'Security update',
          body: 'Your password was changed successfully.',
          type: 'SYSTEM',
          userId,
        },
      });
    } catch (notiErr) {
      console.error('Failed to auto-create security update notification:', notiErr);
    }

    // Asynchronously send password change email
    const subject = '[AYE Dashboard] Security Alert: Password Changed';
    const html = wrapInTemplate(
      'Password Updated',
      `<p>Hello ${user.name},</p>
       <p>Your dashboard password was successfully updated on ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST).</p>
       <p>For security reasons, all other active sessions on other devices have been invalidated. You will need to log back in on all your devices.</p>
       <p style="color: #dc2626; font-weight: bold;">If you did not authorize this change, please contact support or reset your password immediately to secure your account.</p>`
    );
    sendMail({ to: user.email, subject, html }).catch((err) => console.error('Failed to send password change email:', err));

    clearRefreshTokenCookie(res);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Password updated successfully. Please log in again.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Change password error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to update password.',
    });
  }
}

// Get Active Sessions List
export async function getSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const currentToken = getCookie(req, 'refreshToken');

    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const formattedSessions = sessions.map((s: any) => ({
      id: s.id,
      userAgent: s.userAgent || 'Unknown Device/Browser',
      ip: s.ip || 'Unknown IP',
      createdAt: s.createdAt,
      isCurrent: s.token === currentToken,
    }));

    return res.status(200).json({
      success: true,
      data: {
        sessions: formattedSessions,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Get sessions error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions.',
    });
  }
}

// Revoke All Other Sessions
export async function revokeOtherSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const currentToken = getCookie(req, 'refreshToken');

    if (!currentToken) {
      return res.status(400).json({
        success: false,
        error: 'Current session identifier not found.',
      });
    }

    await prisma.session.deleteMany({
      where: {
        userId,
        NOT: {
          token: currentToken,
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        message: 'All other active sessions have been successfully terminated.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Revoke sessions error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to revoke other sessions.',
    });
  }
}

// Enable 2FA Setup
export async function setup2fa(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
      });
    }

    const secret = speakeasy.generateSecret({
      name: `AYE Dashboard (${user.email})`,
      issuer: 'AYE',
    });

    if (!secret.otpauth_url) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate OTP authentication URL.',
      });
    }

    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    return res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCodeDataUrl,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Setup 2FA error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to generate 2FA credentials setup.',
    });
  }
}

// Verify and Activate 2FA
export async function verify2fa(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { secret, code } = req.body;

    if (!secret || !code) {
      return res.status(400).json({
        success: false,
        error: 'Secret and verification code are required.',
      });
    }

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid code verification failed.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    // Asynchronously send 2FA enabled email
    sendEmail({
      to: updatedUser.email,
      subject: '[AYE Dashboard] Two-Factor Authentication Enabled',
      text: `Hello ${updatedUser.name},\n\nTwo-Factor Authentication (2FA) via authenticator app has been successfully enabled for your account.\n\nYou will be required to enter a code from your authenticator app whenever you log in.\n\nIf you did not enable this, please contact support or change your password immediately.`,
    }).catch((err) => console.error('Failed to send 2FA activation email:', err));

    return res.status(200).json({
      success: true,
      data: {
        message: 'Two-factor authentication successfully enabled.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Verify 2FA activation error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to verify verification code.',
    });
  }
}

// Disable 2FA
export async function disable2fa(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        error: 'Two-factor authentication is not active.',
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Asynchronously send 2FA disabled email
    sendEmail({
      to: updatedUser.email,
      subject: '[AYE Dashboard] Security Alert: Two-Factor Authentication Disabled',
      text: `Hello ${updatedUser.name},\n\nWARNING: Two-Factor Authentication (2FA) was disabled for your account on ${new Date().toLocaleString()}.\n\nYour account is now less secure. If you did not authorize this change, please enable 2FA and change your password immediately.`,
    }).catch((err) => console.error('Failed to send 2FA deactivation email:', err));

    return res.status(200).json({
      success: true,
      data: {
        message: 'Two-factor authentication successfully deactivated.',
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Disable 2FA error:', error);
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to deactivate 2FA.',
    });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: 'User ID and OTP code are required.',
      });
    }

    // Find latest unused active OTP
    const otpRecord = await prisma.loginOtp.findFirst({
      where: {
        userId,
        otp: code,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP code.',
      });
    }

    // Mark OTP used
    await prisma.loginOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found.',
      });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'default_access_secret_key_at_least_32_characters';
      const tempToken = jwt.sign({ userId: user.id, temp2fa: true }, ACCESS_SECRET, { expiresIn: '5m' });

      return res.status(200).json({
        success: true,
        data: {
          require2FA: true,
          temp2faToken: tempToken,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Create session in database
    await createSession(user.id, refreshToken, req);

    // Set cookie
    setRefreshTokenCookie(res, refreshToken);

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };

    // Send login alert
    const userSettings = await prisma.settings.findUnique({ where: { userId: user.id } });
    const sendAlert = !userSettings || userSettings.emailLoginAlert;
    if (sendAlert) {
      const userAgent = req.headers['user-agent'] || 'Unknown Browser';
      const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'Unknown IP';
      
      const subject = '[AYE Dashboard] New Login Detected';
      const html = wrapInTemplate(
        'New Account Login',
        `<p>Hello ${user.name},</p>
         <p>A new login was detected on your AYE Dashboard account.</p>
         <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">Date/Time:</td>
             <td style="padding: 6px 0; color: #1e293b;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">IP Address:</td>
             <td style="padding: 6px 0; color: #1e293b;">${ip}</td>
           </tr>
           <tr>
             <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Device Info:</td>
             <td style="padding: 6px 0; color: #1e293b;">${userAgent}</td>
           </tr>
         </table>
         <p>If this was not you, please change your password immediately to secure your account.</p>`
      );
      await sendMail({ to: user.email, subject, html }).catch((err) => console.error('Failed to send login alert email:', err));
    }

    return res.status(200).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during verification.',
    });
  }
}
