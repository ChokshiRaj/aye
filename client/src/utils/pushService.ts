import api from '../api/axios';

// Helper to convert base64 VAPID key to Uint8Array for the browser push manager
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (err) {
    console.error('Error checking push subscription status:', err);
    return false;
  }
}

export async function subscribeToPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request browser notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied.');
  }

  const registration = await navigator.serviceWorker.ready;

  // 2. Fetch public VAPID key from backend
  const res = await api.get('/api/push/vapid-public-key');
  if (!res.data || !res.data.success || !res.data.data.publicKey) {
    throw new Error('Failed to retrieve VAPID key from server.');
  }
  const vapidPublicKey = res.data.data.publicKey;

  // 3. Subscribe with the push manager
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // 4. Send subscription details to backend to persist
  const subJSON = subscription.toJSON();
  await api.post('/api/push/subscribe', {
    endpoint: subJSON.endpoint,
    keys: {
      p256dh: subJSON.keys?.p256dh,
      auth: subJSON.keys?.auth,
    },
  });
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    // 1. Send delete request to backend
    await api.delete('/api/push/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    });
    // 2. Unsubscribe locally
    await subscription.unsubscribe();
  }
}
