import { Response } from 'express';
import { google } from 'googleapis';
import { prisma as globalPrisma } from '../utils/db';
const prisma = globalPrisma as any;
import { AuthenticatedRequest } from '../middleware/authenticate';

// Helper to create OAuth2 client instance dynamically
async function getOAuth2Client(userId?: string) {
  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (userId) {
    try {
      const settings = await prisma.settings.findUnique({ where: { userId } });
      if (settings) {
        if (settings.googleClientId) clientId = settings.googleClientId;
        if (settings.googleClientSecret) clientSecret = settings.googleClientSecret;
        if (settings.googleRedirectUri) redirectUri = settings.googleRedirectUri;
      }
    } catch (err) {
      console.error('Failed to load user-specific Google credentials:', err);
    }
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Scopes required for email preview and checking user email
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export async function getAuthUrl(req: AuthenticatedRequest, res: Response) {
  try {
    const oauth2Client = await getOAuth2Client(req.userId);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: req.userId, // Pass userId as state to associate back
    });

    return res.status(200).json({
      success: true,
      data: { authUrl },
    });
  } catch (error: any) {
    console.error('getAuthUrl error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL.',
    });
  }
}

export async function oauthCallback(req: AuthenticatedRequest, res: Response) {
  const { code, state } = req.query;
  const userId = state as string;

  if (!code || !userId) {
    return res.status(400).send('Missing authorization code or user session context.');
  }

  try {
    const oauth2Client = await getOAuth2Client(userId);
    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    // Get user's Google email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('Google did not return user email profile.');
    }

    // Prepare expiry date
    const expiresAt = new Date(Date.now() + (tokens.expiry_date || 3600000));

    // Save tokens in database
    await prisma.googleToken.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token!,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
        expiresAt,
        email,
      },
      create: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresAt,
        email,
        userId,
      },
    });

    // Close the popup and notify parent window
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Gmail Connected</title></head>
      <body>
        <p>Gmail successfully connected! Closing window...</p>
        <script>
          if (window.opener) {
            window.opener.postMessage('gmail-connected', '*');
          }
          window.close();
        </script>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error('oauthCallback error:', error);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

export async function getGmailStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const token = await prisma.googleToken.findUnique({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      data: {
        connected: !!token,
        email: token ? token.email : null,
      },
    });
  } catch (error: any) {
    console.error('getGmailStatus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check Gmail connection status.',
    });
  }
}

export async function disconnectGmail(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    await prisma.googleToken.delete({
      where: { userId },
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Gmail integration disconnected.' },
    });
  } catch (error: any) {
    console.error('disconnectGmail error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disconnect Gmail.',
    });
  }
}

// Silent Refresh token helper
async function refreshGmailTokenIfNeeded(googleToken: any) {
  // If token expires in less than 5 minutes, refresh
  if (googleToken.expiresAt.getTime() - Date.now() < 5 * 60 * 1000) {
    console.log(`Refreshing Gmail token for user: ${googleToken.userId}`);
    const oauth2Client = await getOAuth2Client(googleToken.userId);
    oauth2Client.setCredentials({
      refresh_token: googleToken.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    const expiresAt = new Date(Date.now() + (credentials.expiry_date || 3600000));

    const updated = await prisma.googleToken.update({
      where: { userId: googleToken.userId },
      data: {
        accessToken: credentials.access_token!,
        expiresAt,
      },
    });

    return updated;
  }
  return googleToken;
}

export async function getGmailInbox(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    let googleToken = await prisma.googleToken.findUnique({
      where: { userId },
    });

    if (!googleToken) {
      return res.status(200).json({
        success: true,
        data: { connected: false, unreadCount: 0, messages: [] },
      });
    }

    // Perform token refresh check
    googleToken = await refreshGmailTokenIfNeeded(googleToken);

    const oauth2Client = await getOAuth2Client(userId);
    oauth2Client.setCredentials({
      access_token: googleToken.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 1. Fetch unread count for INBOX
    const listUnread = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread label:INBOX',
      maxResults: 100, // Limit to protect rate limits
    });

    const unreadCount = listUnread.data.resultSizeEstimate || (listUnread.data.messages || []).length;

    // 2. Fetch latest 5 messages for preview
    const listLatest = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });

    const messageSummaries = [];
    const messages = listLatest.data.messages || [];

    for (const msg of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      });

      const headers = details.data.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
      const subjectHeader = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
      const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';

      // Format sender name (strip email if present)
      const senderName = fromHeader.replace(/<.*>/, '').trim();

      messageSummaries.push({
        id: msg.id,
        sender: senderName || fromHeader,
        subject: subjectHeader,
        snippet: details.data.snippet || '',
        date: dateHeader,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        connected: true,
        unreadCount,
        messages: messageSummaries,
      },
    });
  } catch (error: any) {
    console.error('getGmailInbox error:', error);
    return res.status(550).json({
      success: false,
      error: 'Failed to load Gmail messages.',
    });
  }
}
