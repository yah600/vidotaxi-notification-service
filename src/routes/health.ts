/**
 * Health Check Routes
 */
import { Router, Request, Response } from 'express';
import { config } from '../lib/config.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'notification-service',
    sqsEnabled: !!config.sqs.queueUrl,
    timestamp: new Date().toISOString(),
  });
});

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'notification-service',
    uptime: process.uptime(),
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const checks = {
    email: !!config.email.apiKey,
    sms: !!config.twilio.accountSid,
    push: !!config.firebase.projectId,
    sqs: !!config.sqs.queueUrl,
  };

  res.json({
    status: 'ready',
    service: 'notification-service',
    checks,
  });
});

export default router;
