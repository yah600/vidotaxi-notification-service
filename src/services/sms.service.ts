/**
 * SMS Service
 * Send SMS via Twilio
 */
import twilio from 'twilio';
import { config } from '../lib/config.js';

interface SMSOptions {
  to: string;
  body: string;
  from?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let twilioClient: any = null;

function getClient() {
  if (!twilioClient) {
    if (!config.twilio.accountSid || !config.twilio.authToken) {
      throw new Error('Twilio credentials not configured');
    }
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }
  return twilioClient;
}

/**
 * Send an SMS
 */
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  try {
    const client = getClient();

    const message = await client.messages.create({
      to: options.to,
      body: options.body,
      from: options.from || config.twilio.fromNumber,
      messagingServiceSid: config.twilio.messagingServiceSid,
    });

    console.log(JSON.stringify({
      action: 'sms_sent',
      to: options.to.substring(0, 5) + '...',
      sid: message.sid,
    }));

    return true;
  } catch (error: any) {
    console.error('SMS send failed:', error.message);
    return false;
  }
}

/**
 * Send 2FA code via SMS
 */
export async function send2FACodeSMS(
  phone: string,
  code: string,
  language: string = 'fr'
): Promise<boolean> {
  const body = language === 'fr'
    ? `VidoTaxi: Votre code de vérification est ${code}. Expire dans 10 minutes.`
    : `VidoTaxi: Your verification code is ${code}. Expires in 10 minutes.`;

  return sendSMS({
    to: phone,
    body,
  });
}

/**
 * Send ride update via SMS
 */
export async function sendRideUpdateSMS(
  phone: string,
  message: string
): Promise<boolean> {
  return sendSMS({
    to: phone,
    body: `VidoTaxi: ${message}`,
  });
}

export default {
  sendSMS,
  send2FACodeSMS,
  sendRideUpdateSMS,
};
