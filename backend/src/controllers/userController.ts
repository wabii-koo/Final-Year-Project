import { Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { SystemLogModel } from '../models/SystemLog';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/middleware';

/**
 * View current user's profile details
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
      });
      return;
    }

    const user = await UserModel.findByPk(userId, {
      attributes: { exclude: ['passwordHash', 'resetToken', 'resetTokenExpiry'] }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not found' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message || 'Failed to fetch user profile' }
    });
  }
};

/**
 * Update user's profile details
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User authentication required' }
      });
      return;
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User profile not found' }
      });
      return;
    }

    const { fullName, email, phoneNo, address, password } = req.body;

    const updates: any = {};
    const oldValues: any = {};
    const newValues: any = {};

    // Validate and update email if provided
    if (email !== undefined && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
        });
        return;
      }

      // Check for email collision
      const existingUser = await UserModel.findOne({
        where: {
          email,
          userId: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_EMAIL', message: 'Email address is already in use by another account' }
        });
        return;
      }

      oldValues.email = user.email;
      newValues.email = email;
      updates.email = email;
    }

    // Validate and update phoneNo if provided
    if (phoneNo !== undefined && phoneNo !== user.phoneNo) {
      const phoneRegex = /^(?:\+251|251|0)[97]\d{8}$/;
      if (!phoneRegex.test(phoneNo)) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PHONE', message: 'Invalid phone number. Please enter a valid Ethiopian phone number (e.g. 0912345678, 0712345678, or +251912345678).' }
        });
        return;
      }

      // Check for phoneNo collision
      const existingUser = await UserModel.findOne({
        where: {
          phoneNo,
          userId: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_PHONE', message: 'Phone number is already in use by another account' }
        });
        return;
      }

      oldValues.phoneNo = user.phoneNo;
      newValues.phoneNo = phoneNo;
      updates.phoneNo = phoneNo;
    }

    // Validate and update fullName if provided
    if (fullName !== undefined && fullName.trim() !== '') {
      if (fullName.trim() !== user.fullName) {
        oldValues.fullName = user.fullName;
        newValues.fullName = fullName.trim();
        updates.fullName = fullName.trim();
      }
    }

    // Validate and update address if provided
    if (address !== undefined) {
      if (address.trim() !== user.address) {
        oldValues.address = user.address;
        newValues.address = address.trim();
        updates.address = address.trim();
      }
    }

    // Validate and hash password if provided
    if (password !== undefined && password !== '') {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*!])[A-Za-z\d@#$%^&*!]/;
      if (password.length < 8 || !passwordRegex.test(password)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (@#$%^&*!).'
          }
        });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      updates.passwordHash = passwordHash;
      newValues.passwordUpdated = true;
    }

    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      await user.update(updates);

      // Log update action to SystemLogs
      await SystemLogModel.create({
        userId,
        action: 'USER_PROFILE_UPDATED',
        tableName: 'users',
        recordId: userId,
        oldValues,
        newValues
      });
    }

    // Fetch the updated user profile (excluding passwordHash)
    const updatedUser = await UserModel.findByPk(userId, {
      attributes: { exclude: ['passwordHash', 'resetToken', 'resetTokenExpiry'] }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update user profile' }
    });
  }
};
