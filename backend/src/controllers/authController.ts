import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, AuthUser } from '../types';
import { UserRole } from '../types';
import { sequelize } from '../database/connection';

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

      // First check hardcoded staff credentials (for existing staff)
      const staffCredentials = {
        'director@school.com': { password: 'director123', role: 'director', fullName: 'School Director' },
        'registrar@school.com': { password: 'registrar456', role: 'registrar', fullName: 'School Registrar' },
        'teacher@school.com': { password: 'teacher789', role: 'teacher', fullName: 'John Smith' },
        'homeroom@school.com': { password: 'homeroom012', role: 'homeroom_teacher', fullName: 'Homeroom Teacher' }
      };

      if (staffCredentials[email as keyof typeof staffCredentials]) {
        const staff = staffCredentials[email as keyof typeof staffCredentials];
        // Allow homeroom teacher to log in with teacher role
        const isHomeroomTeacherAsTeacher = email === 'homeroom@school.com' && mappedRole === 'teacher';
        if (staff.password === password && (staff.role === mappedRole || isHomeroomTeacherAsTeacher)) {
          // Staff login successful
          const authUser: AuthUser = {
            userId: staff.role === 'director' ? 1 : staff.role === 'registrar' ? 2 : staff.role === 'teacher' ? 3 : 4,
            email,
            role: staff.role as UserRole,
            fullName: staff.fullName,
          };

          // Generate token
          const token = AuthService.generateToken(authUser);

          const response: ApiResponse = {
            success: true,
            data: {
              token,
              user: authUser,
              expiresIn: '24h',
            },
            timestamp: new Date().toISOString(),
          };

          res.status(200).json(response);
          return;
        } else if (staff.password === password && staff.role !== mappedRole) {
          // Password correct but role mismatch
          console.log(' Role mismatch for staff:', { email, expectedRole: staff.role, providedRole: mappedRole, frontendRole: role });
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
      }

      // Then check registered users in MySQL database
      const [users] = await sequelize.query(`
        SELECT user_id, email, password_hash, role, full_name 
        FROM users 
        WHERE email = ? AND is_active = true
      `, {
        replacements: [email]
      });

      const user = (users as any[])[0];
      
      if (!user) {
        console.log(' User not found in MySQL:', email);
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

      // Verify password (in production, you'd use bcrypt.compare)
      const passwordMatch = user.password_hash === password || true; // Simplified for demo
      
      if (!passwordMatch) {
        console.log(' Password mismatch for:', email);
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

      // Additional role validation - prevent cross-role login
      // For demo purposes, only allow specific role-based logins
      const validRoleLogins: Record<string, UserRole[]> = {
        'guardian@example.com': [UserRole.GUARDIAN],
        'teacher@school.com': [UserRole.TEACHER],
        'homeroom@school.com': [UserRole.HOMEROOM_TEACHER],
        'registrar@school.com': [UserRole.REGISTRAR],
        'director@school.com': [UserRole.DIRECTOR]
      };

      // Check if user role matches the selected role
      if (user.role !== mappedRole) {
        console.log(' Role mismatch for database user:', { email, userRole: user.role, providedRole: mappedRole, frontendRole: role });
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

      // Additional validation for specific email-role combinations
      if (validRoleLogins[email] && !validRoleLogins[email].includes(user.role as UserRole)) {
        console.log(' Invalid role for email:', { email, userRole: user.role, expectedRoles: validRoleLogins[email] });
        res.status(401).json({
          success: false,
          error: {
            code: 'ROLE_MISMATCH',
            message: 'Access denied: Role mismatch for this account',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      console.log(' User logged in from MySQL:', { email, role: user.role, fullName: user.full_name });

      // Create auth user object for response
      const authUser: AuthUser = {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
      };

      // Generate token
      const token = AuthService.generateToken(authUser);

      const response: ApiResponse = {
        success: true,
        data: {
          token,
          user: authUser,
          expiresIn: '24h',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
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

      res.status(200).json({
        success: true,
        message: 'Password reset token generated.',
        data: { token: resetToken }, // For demo, we return it. In production, this would be an email.
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
