/**
 * VidoTaxi Notification Service
 * Async notification processing via AWS SQS
 */
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './lib/config.js';
import notificationsRouter from './routes/notifications.js';
import pushRouter from './routes/push.js';
import smsRouter from './routes/sms.js';
import healthRouter from './routes/health.js';

const app = express();

// Trust proxy for rate limiting behind ALB
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

// JSON parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    }));
  });
  next();
});

// Mount routes
app.use('/health', healthRouter);
app.use('/api/notifications', apiLimiter, notificationsRouter);
app.use('/api/notifications/sms', smsRouter);
app.use('/api/push', apiLimiter, pushRouter);

// Internal service routes (without /api prefix for service-to-service calls)
app.use('/notifications/sms', smsRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'VidoTaxi Notification Service',
    version: '1.0.0',
    status: 'running',
    sqsEnabled: !!config.sqs.queueUrl,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Notification service error:', {
    error: err.message,
    stack: config.isProduction ? undefined : err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: config.isProduction ? 'Internal server error' : err.message,
  });
});

// Start server
async function start(): Promise<void> {
  try {
    // Start listening
    app.listen(config.port, () => {
      console.log('========================================');
      console.log('  VidoTaxi Notification Service');
      console.log(`  Port: ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  SQS: ${config.sqs.queueUrl ? 'Enabled' : 'Disabled'}`);
      console.log('  Endpoints:');
      console.log('  - POST /api/notifications/send');
      console.log('  - POST /api/notifications/send-bulk');
      console.log('  - POST /api/notifications/sms');
      console.log('  - POST /notifications/sms (internal)');
      console.log('  - GET  /api/notifications/user/:userId');
      console.log('  - POST /api/push/send');
      console.log('  - POST /api/push/register');
      console.log('  - GET  /health');
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
}

start();

export default app;
