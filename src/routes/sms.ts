/**
 * SMS Routes
 * Direct SMS sending for internal services
 */
import { Router, Request, Response } from 'express';
import { sendSMS } from '../services/sms.service.js';

const router = Router();

/**
 * POST /api/notifications/sms
 * Send an SMS directly (for internal service-to-service calls)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'to and message are required',
      });
    }

    const success = await sendSMS({ to, body: message });

    if (!success) {
      return res.status(500).json({
        error: 'Failed to send SMS',
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('SMS send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send SMS' });
  }
});

export default router;
