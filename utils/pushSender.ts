import webpush from 'web-push';
import type { PushSender } from './push';

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
