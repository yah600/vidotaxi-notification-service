/**
 * Notifications Routes
 * API endpoints for sending notifications
 */
import { Router, Request, Response } from 'express';
import { queueNotification, queueNotificationBatch } from '../services/sqs.service.js';

const router = Router();

/**
 * POST /api/notifications/send
 * Send a single notification
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { type, to, subject, body, priority, userId, metadata } = req.body;

    if (!type || !to || !body) {
      return res.status(400).json({
        error: 'type, to, and body are required',
      });
    }

    if (!['email', 'sms', 'push'].includes(type)) {
      return res.status(400).json({
        error: 'type must be email, sms, or push',
      });
    }

    const messageId = await queueNotification({
      type,
      to,
      subject,
      body,
      priority,
      userId,
      metadata,
    });

    res.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error('Send notification error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notification' });
  }
});

/**
 * POST /api/notifications/send-bulk
 * Send multiple notifications
 */
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const { notifications } = req.body;

    if (!Array.isArray(notifications) || notifications.length === 0) {
      return res.status(400).json({
        error: 'notifications array is required',
      });
    }

    if (notifications.length > 100) {
      return res.status(400).json({
        error: 'Maximum 100 notifications per batch',
      });
    }

    const messageIds = await queueNotificationBatch(notifications);

    res.json({
      success: true,
      messageIds,
      count: messageIds.length,
    });
  } catch (error: any) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({ error: error.message || 'Failed to send notifications' });
  }
});

/**
 * GET /api/notifications/user/:userId
 * Get notification history for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  // TODO: Implement notification history from database
  res.json({
    notifications: [],
    message: 'Notification history not yet implemented',
  });
});

export default router;
