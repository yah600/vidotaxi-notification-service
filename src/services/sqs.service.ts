/**
 * AWS SQS Service
 * Async notification queue management
 */
import { SQSClient, SendMessageCommand, SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { config } from '../lib/config.js';
import { v4 as uuidv4 } from 'uuid';

interface NotificationMessage {
  type: 'email' | 'sms' | 'push';
  to: string;
  subject?: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'high' | 'normal' | 'low';
  userId?: string;
  metadata?: Record<string, string>;
}

let sqsClient: SQSClient | null = null;

function getClient(): SQSClient {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: config.sqs.region,
    });
  }
  return sqsClient;
}

/**
 * Queue a single notification
 */
export async function queueNotification(message: NotificationMessage): Promise<string> {
  if (!config.sqs.queueUrl) {
    console.log('SQS not configured, processing notification synchronously');
    // In development, process immediately instead of queueing
    return processNotificationSync(message);
  }

  const messageId = uuidv4();

  const command = new SendMessageCommand({
    QueueUrl: config.sqs.queueUrl,
    MessageBody: JSON.stringify({
      id: messageId,
      ...message,
      queuedAt: new Date().toISOString(),
    }),
    MessageAttributes: {
      type: {
        DataType: 'String',
        StringValue: message.type,
      },
      priority: {
        DataType: 'String',
        StringValue: message.priority || 'normal',
      },
    },
    // High priority messages get shorter delay
    DelaySeconds: message.priority === 'high' ? 0 : undefined,
  });

  const result = await getClient().send(command);

  console.log(JSON.stringify({
    action: 'notification_queued',
    messageId,
    sqsMessageId: result.MessageId,
    type: message.type,
    priority: message.priority,
  }));

  return messageId;
}

/**
 * Queue multiple notifications in batch
 */
export async function queueNotificationBatch(messages: NotificationMessage[]): Promise<string[]> {
  if (!config.sqs.queueUrl) {
    console.log('SQS not configured, processing notifications synchronously');
    return Promise.all(messages.map(processNotificationSync));
  }

  const messageIds: string[] = [];
  const batches: NotificationMessage[][] = [];

  // Split into batches of 10 (SQS limit)
  for (let i = 0; i < messages.length; i += 10) {
    batches.push(messages.slice(i, i + 10));
  }

  for (const batch of batches) {
    const entries = batch.map((message, index) => {
      const messageId = uuidv4();
      messageIds.push(messageId);

      return {
        Id: index.toString(),
        MessageBody: JSON.stringify({
          id: messageId,
          ...message,
          queuedAt: new Date().toISOString(),
        }),
        MessageAttributes: {
          type: {
            DataType: 'String',
            StringValue: message.type,
          },
          priority: {
            DataType: 'String',
            StringValue: message.priority || 'normal',
          },
        },
      };
    });

    const command = new SendMessageBatchCommand({
      QueueUrl: config.sqs.queueUrl,
      Entries: entries,
    });

    await getClient().send(command);
  }

  console.log(JSON.stringify({
    action: 'notification_batch_queued',
    count: messages.length,
    messageIds,
  }));

  return messageIds;
}

/**
 * Process notification synchronously (for development or fallback)
 */
async function processNotificationSync(message: NotificationMessage): Promise<string> {
  const messageId = uuidv4();

  console.log(JSON.stringify({
    action: 'notification_processing_sync',
    messageId,
    type: message.type,
    to: message.to.substring(0, 5) + '...',
  }));

  // Import and call the appropriate service
  try {
    switch (message.type) {
      case 'email':
        const { sendEmail } = await import('./email.service.js');
        await sendEmail({
          to: message.to,
          subject: message.subject || 'VidoTaxi Notification',
          body: message.body,
        });
        break;

      case 'sms':
        const { sendSMS } = await import('./sms.service.js');
        await sendSMS({
          to: message.to,
          body: message.body,
        });
        break;

      case 'push':
        const { sendPush } = await import('./push.service.js');
        await sendPush({
          token: message.to,
          title: message.subject || 'VidoTaxi',
          body: message.body,
          data: message.data,
        });
        break;
    }
  } catch (error) {
    console.error(`Failed to send ${message.type} notification:`, error);
    throw error;
  }

  return messageId;
}

export default {
  queueNotification,
  queueNotificationBatch,
};
