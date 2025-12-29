/**
 * Notification Service Configuration
 * Centralized configuration for async notification processing
 */
import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnv(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  return value ? parseInt(value, 10) : defaultValue;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const config = {
  // Server
  port: getEnvNumber('PORT', 4003),
  nodeEnv: getEnv('NODE_ENV', 'development'),
  isProduction: process.env.NODE_ENV === 'production',

  // Database (for notification logs and preferences)
  database: {
    host: getEnv('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    name: getEnv('DB_NAME', 'vidotaxi_notifications'),
    user: getEnv('DB_USER', 'postgres'),
    password: getEnv('DB_PASSWORD', 'password'),
    poolMin: getEnvNumber('DB_POOL_MIN', 2),
    poolMax: getEnvNumber('DB_POOL_MAX', 10),
    url: process.env.DATABASE_URL,
  },

  // Redis for caching
  redis: {
    host: getEnv('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
    tls: getEnvBoolean('REDIS_TLS', false),
  },

  // AWS SQS Configuration
  sqs: {
    region: getEnv('AWS_REGION', 'us-east-1'),
    queueUrl: process.env.SQS_QUEUE_URL || '',
    batchSize: getEnvNumber('SQS_BATCH_SIZE', 10),
    visibilityTimeout: getEnvNumber('SQS_VISIBILITY_TIMEOUT', 60),
    waitTimeSeconds: getEnvNumber('SQS_WAIT_TIME_SECONDS', 20),
  },

  // Email - Resend
  email: {
    apiKey: process.env.RESEND_API_KEY,
    fromAddress: getEnv('EMAIL_FROM', 'VidoTaxi <noreply@vidotaxi.com>'),
    replyTo: getEnv('EMAIL_REPLY_TO', 'support@vidotaxi.com'),
  },

  // SMS - Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },

  // Push - Firebase
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  // JWT for service-to-service auth
  jwt: {
    secret: process.env.NODE_ENV === 'production'
      ? requireEnv('JWT_SECRET')
      : getEnv('JWT_SECRET', 'dev-only-jwt-secret-not-for-production-32ch'),
  },

  // Rate Limiting
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://app.vidotaxi.com',
    'https://vidotaxi.com',
  ],

  // App URLs
  appUrl: getEnv('APP_URL', 'https://app.vidotaxi.com'),
  apiUrl: getEnv('API_URL', 'https://api.vidotaxi.com'),

  // Service URLs
  services: {
    auth: getEnv('AUTH_SERVICE_URL', 'http://localhost:4001'),
    payment: getEnv('PAYMENT_SERVICE_URL', 'http://localhost:4002'),
    backend: getEnv('BACKEND_SERVICE_URL', 'http://localhost:4000'),
  },
};

// Validate critical config in production
if (config.isProduction) {
  if (!config.sqs.queueUrl) {
    console.warn('WARNING: SQS_QUEUE_URL not set - async processing disabled');
  }
  if (!config.email.apiKey) {
    console.warn('WARNING: RESEND_API_KEY not set - email sending disabled');
  }
  if (!config.twilio.accountSid) {
    console.warn('WARNING: TWILIO_ACCOUNT_SID not set - SMS sending disabled');
  }
}

export default config;
