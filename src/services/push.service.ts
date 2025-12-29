/**
 * Push Notification Service
 * Send push notifications via Firebase Cloud Messaging
 */
import admin from 'firebase-admin';
import { config } from '../lib/config.js';

interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
}

let firebaseInitialized = false;

function initFirebase(): void {
  if (firebaseInitialized) return;

  if (!config.firebase.projectId || !config.firebase.privateKey || !config.firebase.clientEmail) {
    console.warn('Firebase not configured - push notifications disabled');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      privateKey: config.firebase.privateKey,
      clientEmail: config.firebase.clientEmail,
    }),
  });

  firebaseInitialized = true;
  console.log('Firebase initialized for push notifications');
}

/**
 * Send a push notification
 */
export async function sendPush(options: PushOptions): Promise<boolean> {
  try {
    initFirebase();

    if (!firebaseInitialized) {
      console.warn('Firebase not initialized, skipping push notification');
      return false;
    }

    const message: admin.messaging.Message = {
      token: options.token,
      notification: {
        title: options.title,
        body: options.body,
      },
      data: options.data as Record<string, string> | undefined,
      apns: {
        payload: {
          aps: {
            badge: options.badge,
            sound: options.sound || 'default',
          },
        },
      },
      android: {
        notification: {
          sound: options.sound || 'default',
          priority: 'high',
        },
      },
    };

    const response = await admin.messaging().send(message);

    console.log(JSON.stringify({
      action: 'push_sent',
      token: options.token.substring(0, 10) + '...',
      messageId: response,
    }));

    return true;
  } catch (error: any) {
    console.error('Push notification failed:', error.message);
    return false;
  }
}

/**
 * Send push to multiple tokens
 */
export async function sendPushBulk(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: number; failure: number }> {
  try {
    initFirebase();

    if (!firebaseInitialized) {
      return { success: 0, failure: tokens.length };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data as Record<string, string> | undefined,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(JSON.stringify({
      action: 'push_bulk_sent',
      total: tokens.length,
      success: response.successCount,
      failure: response.failureCount,
    }));

    return {
      success: response.successCount,
      failure: response.failureCount,
    };
  } catch (error: any) {
    console.error('Bulk push failed:', error.message);
    return { success: 0, failure: tokens.length };
  }
}

export default {
  sendPush,
  sendPushBulk,
};
