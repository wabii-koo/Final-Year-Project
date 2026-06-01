import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

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

export class EmailService {
  /**
   * Send account approval notification to guardian
   */
  static async sendApprovalEmail(email: string, guardianName: string, studentName: string): Promise<void> {
    const mailOptions = {
      from: `"School Communication" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: email,
      subject: 'Guardian Account Approved & Activated - GuardianGate',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #10B981; margin: 0; font-size: 24px; font-weight: bold;">Account Approved!</h2>
            <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">Welcome to the GuardianGate Portal</p>
          </div>
          <p>Dear ${guardianName},</p>
          <p>We are pleased to inform you that your registration as a guardian for <strong>${studentName}</strong> has been reviewed and <strong>approved</strong> by the school registrar.</p>
          <p>Your account is now active. You can log in to the portal using your email address and the password you created during registration to track homework, communicate with teachers, and manage pickup authorizations.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/login" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 25px; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">
              Log In to Portal
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 30px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Hawi Dandi Boru Kindergarten/School</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Approval email successfully sent to ${email}`);
    } catch (error) {
      logger.error(`Failed to send approval email to ${email}:`, error);
    }
  }

  /**
   * Send registration rejection or correction notification to guardian
   */
  static async sendRejectionEmail(
    email: string,
    guardianName: string,
    reason: string,
    requestCorrection: boolean,
    registrationId?: number
  ): Promise<void> {
    const isCorrection = requestCorrection;
    const subject = isCorrection 
      ? 'Action Required: Registration Correction Needed - GuardianGate'
      : 'Guardian Registration Status Update - GuardianGate';
      
    const title = isCorrection ? 'Correction Required' : 'Registration Rejected';
    const titleColor = isCorrection ? '#F59E0B' : '#EF4444'; // Orange for correction, Red for rejection

    const textContent = isCorrection
      ? `<p>Upon reviewing your registration documents, the school registrar has requested a correction. Please review the details below:</p>
         <div style="padding: 15px; background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 4px; margin: 20px 0; color: #78350F; font-size: 14px; font-weight: 500;">
           <strong>Registrar Comment/Discrepancy:</strong><br/>
           ${reason}
         </div>
         <p>You can correct your files or details by visiting the status page on our portal and re-submitting your documents.</p>`
      : `<p>We regret to inform you that your guardian registration request has been rejected for the following reason:</p>
         <div style="padding: 15px; background-color: #FEF2F2; border-left: 4px solid #EF4444; border-radius: 4px; margin: 20px 0; color: #991B1B; font-size: 14px; font-weight: 500;">
           <strong>Reason:</strong><br/>
           ${reason}
         </div>
         <p>If you believe this was in error, please register again with valid documents or contact the school administration.</p>`;

    const actionButton = isCorrection
      ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/auth/register?correctId=${registrationId}" style="background-color: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 25px; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.15);">
            Submit Corrections
          </a>
        </div>`
      : '';

    const mailOptions = {
      from: `"School Communication" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: ${titleColor}; margin: 0; font-size: 24px; font-weight: bold;">${title}</h2>
            <p style="color: #6B7280; font-size: 14px; margin-top: 5px;">Status update for your GuardianGate application</p>
          </div>
          <p>Dear ${guardianName},</p>
          ${textContent}
          ${actionButton}
          
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin-top: 30px;" />
          <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Hawi Dandi Boru Kindergarten/School</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`Notification email successfully sent to ${email} (Type: ${title})`);
    } catch (error) {
      logger.error(`Failed to send notification email to ${email}:`, error);
    }
  }
}
