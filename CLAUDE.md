# VidoTaxi Notification Service - Claude Memory

## Overview
Async notification microservice for email, SMS, and push notifications via AWS SQS.

## Tech Stack
- Node.js 20 + TypeScript + Express
- AWS SQS for async message queue
- Resend for email
- Twilio for SMS
- Firebase Admin SDK for push notifications
- Docker + ECS Fargate deployment

## Key Files
- `src/server.ts` - Express entry point
- `src/routes/notifications.ts` - SQS queue operations
- `src/routes/push.ts` - Firebase push routes
- `src/routes/sms.ts` - Direct SMS endpoint (for auth-service 2FA)
- `src/routes/health.ts` - Health checks
- `src/services/sqs.service.ts` - AWS SQS integration
- `src/services/email.service.ts` - Resend email (with 2FA templates)
- `src/services/sms.service.ts` - Twilio SMS
- `src/services/push.service.ts` - Firebase push
- `src/lib/config.ts` - Environment configuration

## API Endpoints
- `POST /api/notifications/send` - Queue notification via SQS
- `POST /api/notifications/send-bulk` - Batch queue
- `POST /api/notifications/sms` - Direct SMS (external)
- `POST /notifications/sms` - Direct SMS (internal service-to-service)
- `POST /api/push/send` - Firebase push
- `POST /api/push/send-bulk` - Bulk push
- `GET /health`, `/health/live`, `/health/ready`

## Integration with Auth Service
The auth-service calls this service for 2FA code delivery:
- Email: Auth service uses its own Resend integration directly
- SMS: Calls `POST /notifications/sms` on this service

## Environment Variables
```
PORT=4003
NODE_ENV=production
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/...
SQS_REGION=us-east-1
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@vidotaxi.com
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

## Deployment - LIVE
- ECR: `867803150424.dkr.ecr.us-east-1.amazonaws.com/vidotaxi-notification-service:v1.0.1`
- ECS Service: `vidotaxi-notification-service` (RUNNING)
- Port: 4003
- Health check: `/health/live`
- Internal only (service-to-service communication)

## Secrets Manager
- `vidotaxi/production/jwt` - JWT_SECRET
- `vidotaxi/production/twilio` - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
- `vidotaxi/production/email` - RESEND_API_KEY, EMAIL_FROM
- `vidotaxi/production/firebase` - FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY (needs config)

## Related Services
- **Auth Service**: Calls SMS endpoint for 2FA
- **Backend**: Calls for ride notifications
- **Payment Service**: Calls for payment confirmations

## Commands
```bash
npm run dev      # Development
npm run build    # TypeScript compile
npm start        # Production
```
