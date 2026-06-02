import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, AuthUser } from '../types';
import { UserRole } from '../types';
import { sequelize } from '../database/connection';
import nodemailer from 'nodemailer';

// Create a reusable Nodemailer transporter using credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 465,
  secure: Number(process.env.MAIL_PORT) === 465,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, phoneNo, address, relationshipType } = req.body;

      // Hash password
      const passwordHash = await AuthService.hashPassword(password);

      // Insert user into Supabase database
      const [result] = await sequelize.query(`
        INSERT INTO users (email, password_hash, role, full_name, created_at, is_active, phone_no, address)
        VALUES (?, ?, 'guardian', ?, NOW(), true, ?, ?)
        RETURNING user_id
      `, {
        replacements: [email, passwordHash, fullName, phoneNo || '', address || '']
      });

      // Get the inserted user ID (PostgreSQL returns an array of rows)
      const userId = (result as any)[0].user_id;

      console.log(' User registered in Supabase:', { email, fullName, userId });

      const response: ApiResponse = {
        success: true,
        message: 'Registration submitted successfully! Your account is pending review by the school registrar. You will receive an email once your account is approved.',
        data: {
          registrationId: userId,
          status: 'pending',
          email: email,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: 'Registration failed. Please try again.',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async login(req: any, res: Response): Promise<void> {
    try {
      const { password, role } = req.body;
      const email = String(req.body.email || '').toLowerCase().trim();

      // Validate that role is provided
      if (!role) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_ROLE',
            message: 'Role is required for login',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Map frontend role names to backend role names
      const roleMapping: Record<string, string> = {
        'parent': 'guardian',
        'teacher': 'teacher',
        'homeroom': 'homeroom_teacher',
        'registrar': 'registrar',
        'director': 'director'
      };
      
      const mappedRole = roleMapping[role] || role;

      console.log(' Login attempt:', { email, frontendRole: role, mappedRole });

      // ─────────────────────────────────────────────────────────────────
      // STEP 1: Check the database first — always prefer live DB records.
      //         This ensures profile changes (name, email, password) are
      //         respected immediately after being saved via the profile page.
      // ─────────────────────────────────────────────────────────────────
      const [users] = await sequelize.query(`
        SELECT user_id, email, password_hash, role, full_name 
        FROM users 
        WHERE email = ? AND is_active = true
      `, {
        replacements: [email]
      });

      const dbUser = (users as any[])[0];

      if (dbUser && dbUser.password_hash) {
        // User exists in DB with a password — use DB authentication exclusively
        const passwordMatch = await AuthService.comparePassword(password, dbUser.password_hash);

        if (!passwordMatch) {
          console.log(' Password mismatch (DB) for:', email);
          res.status(401).json({
            success: false,
            error: {
              code: 'LOGIN_FAILED',
              message: 'Invalid email or password',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        // Dual-role check: homeroom teachers may log in via the "Teacher" portal
        const isDualRoleTeacher = dbUser.role === 'homeroom_teacher' && mappedRole === 'teacher';

        if (dbUser.role !== mappedRole && !isDualRoleTeacher) {
          console.log(' Role mismatch (DB):', { email, userRole: dbUser.role, providedRole: mappedRole });
          res.status(401).json({
            success: false,
            error: {
              code: 'ROLE_MISMATCH',
              message: 'Access denied: This account is not authorized for the selected role',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }

        console.log(' User authenticated via DB:', { email, role: dbUser.role, fullName: dbUser.full_name });

        const authUser: AuthUser = {
          userId: dbUser.user_id,
          email: dbUser.email,
          role: dbUser.role,
          fullName: dbUser.full_name,
        };

        const token = AuthService.generateToken(authUser);

        res.status(200).json({
          success: true,
          data: { token, user: authUser, expiresIn: '24h' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ─────────────────────────────────────────────────────────────────
      // STEP 2: Fallback — hardcoded staff credentials.
      //         Only reached when the user has NO database record yet
      //         (e.g. a staff account that was never updated via the
      //          profile page and has no password_hash in the DB).
      //         Once a staff member saves their profile, the DB path
      //         above takes over and these defaults stop working.
      // ─────────────────────────────────────────────────────────────────
      const staffCredentials: Record<string, { password: string; role: string; fullName: string; userId: number }> = {
        'director@school.com':       { password: 'director123',       role: 'director',         fullName: 'School Director',     userId: 1  },
        'registrar@school.com':      { password: 'registrar456',      role: 'registrar',        fullName: 'School Registrar',    userId: 2  },
        'teacher@school.com':        { password: 'teacher789',        role: 'teacher',          fullName: 'Mr. Alex Brown',      userId: 5  },
        // Homeroom Teacher 1 – Grade 1A (email updated from sarah.smith@school.com)
        'tsion.feleke@school.com':   { password: 'Smith1A@2026',      role: 'homeroom_teacher', fullName: 'Ms. Tsion Feleke',    userId: 3  },
        // Homeroom Teacher 2 – Grade 2B
        'james.johnson@school.com':  { password: 'Johnson2B@2026',    role: 'homeroom_teacher', fullName: 'Mr. James Johnson',   userId: 4  },
        // Homeroom Teacher 3 – Grade 3B
        'emily.davis@school.com':    { password: 'Davis3B@2026',      role: 'homeroom_teacher', fullName: 'Mrs. Emily Davis',    userId: 13 },
        // Subject Teachers
        'robert.miller@school.com':  { password: 'MillerMath@2026',   role: 'teacher',          fullName: 'Mr. Robert Miller',   userId: 15 },
        'lisa.green@school.com':     { password: 'GreenScience@2026', role: 'teacher',          fullName: 'Dr. Lisa Green',       userId: 16 },
        'karen.white@school.com':    { password: 'WhiteEnglish@2026', role: 'teacher',          fullName: 'Ms. Karen White',     userId: 17 },
        // Legacy aliases
        'homeroom@school.com':       { password: 'homeroom012',       role: 'homeroom_teacher', fullName: 'Mr. James Johnson',   userId: 4  },
        'homeroom3b@school.com':     { password: 'homeroom3b',        role: 'homeroom_teacher', fullName: 'Mrs. Emily Davis',    userId: 13 },
      };


      const staff = staffCredentials[email];

      if (!staff) {
        // Not in DB and not in hardcoded list
        console.log(' User not found anywhere:', email);
        res.status(401).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // ── Cross-check: has this staff member changed their email in the DB?
      // If user_id 3 now has email 'tsion.feleke@school.com' in the DB,
      // then 'sarah.smith@school.com' is no longer their valid login email.
      const [staffDbRows] = await sequelize.query(`
        SELECT email FROM users WHERE user_id = ? AND is_active = true
      `, { replacements: [staff.userId] });
      const staffDbEmail = (staffDbRows as any[])[0]?.email;

      if (staffDbEmail && staffDbEmail.toLowerCase() !== email.toLowerCase()) {
        console.log(` Hardcoded email rejected: user_id ${staff.userId} now uses '${staffDbEmail}' in DB, not '${email}'`);
        res.status(401).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }


      const isHomeroomAsTeacher = staff.role === 'homeroom_teacher' && mappedRole === 'teacher';

      if (staff.password !== password) {
        console.log(' Password mismatch (hardcoded) for:', email);
        res.status(401).json({
          success: false,
          error: {
            code: 'LOGIN_FAILED',
            message: 'Invalid email or password',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (staff.role !== mappedRole && !isHomeroomAsTeacher) {
        console.log(' Role mismatch (hardcoded):', { email, expectedRole: staff.role, providedRole: mappedRole });
        res.status(401).json({
          success: false,
          error: {
            code: 'ROLE_MISMATCH',
            message: 'Access denied: This account is not authorized for the selected role',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.log(' Staff authenticated via hardcoded credentials (no DB record):', { email, role: staff.role });

      const authUser: AuthUser = {
        userId: staff.userId,
        email,
        role: staff.role as UserRole,
        fullName: staff.fullName,
      };

      const token = AuthService.generateToken(authUser);

      res.status(200).json({
        success: true,
        data: { token, user: authUser, expiresIn: '24h' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Invalid email or password',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async logout(req: any, res: Response): Promise<void> {
    try {
      // In a real implementation, you might blacklist the token
      // For now, we'll just return success
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'Logout failed',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      
      const [users] = await sequelize.query('SELECT user_id FROM Users WHERE email = ?', {
        replacements: [email]
      });

      const user = (users as any[])[0];
      if (!user) {
        // Return success even if user not found to prevent email enumeration
        res.status(200).json({
          success: true,
          message: 'If an account exists with this email, a reset token has been generated.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const resetToken = AuthService.generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await sequelize.query('UPDATE Users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?', {
        replacements: [resetToken, resetTokenExpiry, user.user_id]
      });

      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

      // Send real email using nodemailer
      const mailOptions = {
        from: `"School Communication" <${process.env.MAIL_FROM}>`,
        to: email,
        subject: 'Reset Your Password - GuardianGate',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4F46E5; text-align: center;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset the password for your account on the GuardianGate parent portal. Please use the following 6-digit verification code to reset your password:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 30px 0; padding: 15px; background-color: #F3F4F6; border-radius: 5px; color: #1F2937;">
              ${resetToken}
            </div>
            <p>This code is valid for 1 hour. If you did not make this request, you can safely ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #9CA3AF; text-align: center;">Hawi Dandi Boru Kindergarten/School</p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email successfully sent to ${email}`);
      } catch (mailError) {
        console.error(`Failed to send password reset email to ${email}:`, mailError);
        // Do not throw the error to the client, but return a clear message
      }

      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a reset token has been generated.',
        data: { token: resetToken }, // Return token in response for convenience/testing
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'FORGOT_PASSWORD_FAILED', message: 'Failed to process request' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      const [users] = await sequelize.query(
        'SELECT user_id FROM Users WHERE reset_token = ? AND reset_token_expiry > NOW()',
        { replacements: [token] }
      );

      const user = (users as any[])[0];
      if (!user) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired reset token' },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const passwordHash = await AuthService.hashPassword(newPassword);

      await sequelize.query(
        'UPDATE Users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?',
        { replacements: [passwordHash, user.user_id] }
      );

      res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now log in with your new password.',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'RESET_PASSWORD_FAILED', message: 'Failed to reset password' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
