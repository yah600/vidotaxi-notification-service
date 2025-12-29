/**
 * Push Notification Routes
 */
import { Router, Request, Response } from 'express';
import { sendPush, sendPushBulk } from '../services/push.service.js';

const router = Router();

/**
 * POST /api/push/send
 * Send a push notification
 */
router.post('/send', async (req: Request, res: Response) => {
  try {
    const { token, title, body, data, badge, sound } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({
        error: 'token, title, and body are required',
      });
    }

    const success = await sendPush({ token, title, body, data, badge, sound });

    res.json({ success });
  } catch (error: any) {
    console.error('Push send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send push' });
  }
});

/**
 * POST /api/push/send-bulk
 * Send push to multiple devices
 */
router.post('/send-bulk', async (req: Request, res: Response) => {
  try {
    const { tokens, title, body, data } = req.body;

    if (!Array.isArray(tokens) || tokens.length === 0 || !title || !body) {
      return res.status(400).json({
        error: 'tokens array, title, and body are required',
      });
    }

    const result = await sendPushBulk(tokens, title, body, data);

    res.json(result);
  } catch (error: any) {
    console.error('Bulk push error:', error);
    res.status(500).json({ error: error.message || 'Failed to send push' });
  }
});

/**
 * POST /api/push/register
 * Register device token
 */
router.post('/register', async (req: Request, res: Response) => {
  // TODO: Implement device token storage
  res.json({
    success: true,
    message: 'Device registration not yet implemented',
  });
});

export default router;
