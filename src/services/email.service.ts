/**
 * Email Service
 * Send emails via Resend
 */
import { Resend } from 'resend';
import { config } from '../lib/config.js';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  replyTo?: string;
}

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    if (!config.email.apiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }
    resendClient = new Resend(config.email.apiKey);
  }
  return resendClient;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const resend = getClient();

    await resend.emails.send({
      from: config.email.fromAddress,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html || options.body.replace(/\n/g, '<br>'),
      reply_to: options.replyTo || config.email.replyTo,
    });

    console.log(JSON.stringify({
      action: 'email_sent',
      to: options.to.substring(0, 5) + '...',
      subject: options.subject,
    }));

    return true;
  } catch (error: any) {
    console.error('Email send failed:', error.message);
    return false;
  }
}

/**
 * Send 2FA verification code
 */
export async function send2FACode(
  email: string,
  code: string,
  language: string = 'fr'
): Promise<boolean> {
  const subject = language === 'fr'
    ? 'VidoTaxi - Code de vérification'
    : 'VidoTaxi - Verification Code';

  const body = language === 'fr'
    ? `Votre code de vérification VidoTaxi est: ${code}\n\nCe code expire dans 10 minutes.`
    : `Your VidoTaxi verification code is: ${code}\n\nThis code expires in 10 minutes.`;

  const html = language === 'fr'
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">VidoTaxi</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; text-align: center;">Code de vérification</h2>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: #3B82F6; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; display: inline-block; border-radius: 8px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Ce code expire dans 10 minutes.
          </p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">VidoTaxi</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937; text-align: center;">Verification Code</h2>
          <div style="text-align: center; margin: 30px 0;">
            <span style="background: #3B82F6; color: white; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; display: inline-block; border-radius: 8px;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This code expires in 10 minutes.
          </p>
        </div>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    body,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName: string,
  language: string = 'fr'
): Promise<boolean> {
  const resetLink = `${config.appUrl}?page=reset&token=${resetToken}&lang=${language}`;

  const subject = language === 'fr'
    ? 'VidoTaxi - Réinitialisation de votre mot de passe'
    : 'VidoTaxi - Reset your password';

  const body = language === 'fr'
    ? `Bonjour ${firstName},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe:\n${resetLink}\n\nCe lien expire dans 1 heure.`
    : `Hello ${firstName},\n\nClick this link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.`;

  return sendEmail({
    to: email,
    subject,
    body,
  });
}

export default {
  sendEmail,
  send2FACode,
  sendPasswordResetEmail,
};
