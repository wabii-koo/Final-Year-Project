import crypto from 'crypto';
import { logger } from '../utils/logger';
import { OTPModel } from '../models/OTP';
import nodemailer from 'nodemailer';

// Create a reusable Nodemailer transporter using credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: Number(process.env.MAIL_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});


export class OTPService {
  private static readonly OTP_EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * Generate and store OTP
   */
  static async generateOTP(identifier: string): Promise<string> {
    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);
    
    // UPSERT: Update existing OTP for this identifier or create new one
    await OTPModel.upsert({
      identifier,
      code,
      expiresAt,
      attempts: 0
    });

    logger.info(`OTP generated and stored for ${identifier}`);
    return code;
  }

  /**
   * Verify OTP
   */
  static async verifyOTP(identifier: string, code: string): Promise<boolean> {
    const record = await OTPModel.findOne({ where: { identifier } });
    
    if (!record) {
      logger.warn(`No OTP found for ${identifier}`);
      return false;
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      logger.warn(`OTP expired for ${identifier}`);
      await record.destroy();
      return false;
    }

    // Check max attempts
    if (record.attempts >= this.MAX_ATTEMPTS) {
      logger.warn(`Max OTP attempts exceeded for ${identifier}`);
      await record.destroy();
      return false;
    }

    // Increment attempts
    await record.increment('attempts');

    // Verify code
    if (record.code !== code) {
      logger.warn(`Invalid OTP attempt ${record.attempts + 1}/${this.MAX_ATTEMPTS} for ${identifier}`);
      return false;
    }

    // Success - delete OTP
    logger.info(`OTP verified successfully for ${identifier}`);
    await record.destroy();
    return true;
  }

  /**
   * Clear OTP
   */
  static async clearOTP(identifier: string): Promise<void> {
    await OTPModel.destroy({ where: { identifier } });
  }

  /**
   * Send OTP via email using Nodemailer
   */
  static async sendOTP(email: string, code: string): Promise<void> {
    const mailOptions = {
      from: `"School Communication" <${process.env.MAIL_FROM}>`,
      to: email,
      subject: 'Parent Portal Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F46E5; text-align: center;">Verification Code</h2>
          <p>Hello,</p>
          <p>Thank you for initiating your registration as a guardian. Please use the following 6-digit verification code to complete your setup:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 15px; background-color: #F3F4F6; border-radius: 5px; color: #1F2937;">
            ${code}
          </div>
          <p style="font-size: 14px; color: #6B7280;">This code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Hawi Dandi Boru Kindergarten/School</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`OTP successfully emailed to ${email}`);
    } catch (error) {
      logger.error(`Failed to send email to ${email}:`, error);
      throw new Error('Failed to send verification code. Please check your email address.');
    }
  }
}
