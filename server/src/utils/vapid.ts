import * as fs from 'fs';
import * as path from 'path';
import webPush from 'web-push';

export function initializeVapidKeys() {
  const envPath = path.resolve(process.cwd(), '.env');
  
  // If variables are already in environment, configure web-push directly
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:aye@aye.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return;
  }

  // Otherwise, read .env file, generate new ones, append, and save
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if keys are defined in the file text
    const hasPublic = envContent.includes('VAPID_PUBLIC_KEY');
    const hasPrivate = envContent.includes('VAPID_PRIVATE_KEY');

    if (!hasPublic || !hasPrivate) {
      const keys = webPush.generateVAPIDKeys();
      
      process.env.VAPID_PUBLIC_KEY = keys.publicKey;
      process.env.VAPID_PRIVATE_KEY = keys.privateKey;
      process.env.VAPID_EMAIL = 'mailto:aye@aye.com';

      const additions = `\nVAPID_PUBLIC_KEY="${keys.publicKey}"\nVAPID_PRIVATE_KEY="${keys.privateKey}"\nVAPID_EMAIL="mailto:aye@aye.com"\n`;
      fs.writeFileSync(envPath, envContent + additions, 'utf8');
      console.log('Successfully generated and appended VAPID keys to .env');
    }

    // Configure web-push with the loaded variables
    const pubKey = process.env.VAPID_PUBLIC_KEY || getEnvVar(envPath, 'VAPID_PUBLIC_KEY');
    const privKey = process.env.VAPID_PRIVATE_KEY || getEnvVar(envPath, 'VAPID_PRIVATE_KEY');
    const email = process.env.VAPID_EMAIL || getEnvVar(envPath, 'VAPID_EMAIL') || 'mailto:aye@aye.com';

    if (pubKey && privKey) {
      webPush.setVapidDetails(email, pubKey, privKey);
    }
  } catch (err) {
    console.error('Failed to initialize VAPID keys:', err);
  }
}

function getEnvVar(filePath: string, key: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(new RegExp(`${key}\\s*=\\s*["']?([^"'\r\n]+)["']?`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
