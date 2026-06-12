import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for 587 or others
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  }
} as nodemailer.TransportOptions);

/**
 * Sends a password reset OTP email using Nodemailer.
 * @param to Recipient's email address.
 * @param otp The 6-digit numeric OTP code.
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const fromAddress = `"${config.email.fromName}" <${config.email.fromEmail}>`;
  
  const mailOptions = {
    from: fromAddress,
    to,
    subject: 'Password Reset OTP - DocMaster AI',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 550px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">DocMaster AI</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">Secure PDF & Document Scanner</p>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; color: #334155; line-height: 1.6;">
          <p style="margin-top: 0; font-size: 16px;">Hello,</p>
          <p style="font-size: 15px;">We received a request to reset the password for your DocMaster AI account. Please use the verification code (OTP) below to authorize this request:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1e1b4b; background-color: #eef2ff; padding: 14px 28px; border-radius: 8px; border: 1px solid #c7d2fe;">
              ${otp}
            </div>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">This code is valid for 15 minutes.</p>
          </div>
          
          <p style="font-size: 14px; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #94a3b8;">
            <strong>Security Notice:</strong> If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; margin-top: 25px; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0;">Sent by DocMaster AI Team</p>
          <p style="margin: 5px 0 0 0;">&copy; 2026 DocMaster AI. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`[EmailService] Password reset OTP email successfully sent to ${to}. Message ID: ${info.messageId}`);
  } catch (error: any) {
    logger.error(`[EmailService] Failed to send OTP email to ${to}:`, error);
    throw error;
  }
}
