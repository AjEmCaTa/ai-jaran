import webpush from 'web-push';
import { sendPushToBusiness, type PushPayload, type PushSender, type PushStore } from './push';

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

export const sendWebPush: PushSender = async (subscription, payload) => {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  );
  await webpush.sendNotification(subscription, payload, { TTL: 60 * 60 * 24, urgency: 'high', timeout: 8000 });
};

// Šalje push svim pretplatama JEDNE firme (business_id). Greške ne smiju prekinuti glavni tok.
export async function notifyBusinessPush(admin: unknown, businessId: string, payload: PushPayload) {
  if (!isPushConfigured() || !businessId) return null;
  try {
    return await sendPushToBusiness(admin as PushStore, businessId, payload, sendWebPush);
  } catch (error) {
    console.error('push: slanje nije uspjelo:', error);
    return null;
  }
}
