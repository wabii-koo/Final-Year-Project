import { Request, Response } from 'express';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import { GuardianRegistrationModel } from '../models/GuardianRegistration';
import { StudentModel } from '../models/Student';
import { UserModel } from '../models/User';
import { OTPService } from '../services/otpService';
import { SystemLogModel } from '../models/SystemLog';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

import { PendingRegistrationModel } from '../models/PendingRegistration';

// Temporary store for registration data before OTP verification is no longer needed in-memory
// const pendingRegistrations = new Map<string, any>();

/**
 * Step 1: Validate registration data and check for duplicates
 */
export const validateRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phoneNo, password, nationalId, studentName, relationshipType } = req.body;

    // Check required fields
    if (!fullName || !email || !phoneNo || !password || !nationalId || !studentName || !relationshipType) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'All fields are required (Full Name, Email, Phone, Password, National ID, Child Name, Relationship)' }
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_EMAIL', message: 'Invalid email format' }
      });
      return;
    }

    // Validate phone number format (must be numeric, optional '+', max 15 chars)
    const phoneRegex = /^\+?[0-9\s\-]{9,15}$/;
    if (!phoneRegex.test(phoneNo)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PHONE', message: 'Invalid phone number. Please enter a valid number (max 15 characters).' }
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' }
      });
      return;
    }

    // Verify that the child's name exists in the Students database table
    const student = await StudentModel.findOne({
      where: {
        fullName: {
          [Op.iLike]: studentName.trim()
        }
      }
    });

    if (!student) {
      res.status(400).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'No such child found in school records. Please check the name spelling.' }
      });
      return;
    }

    // Check for duplicates (only block approved registrations)
    const existingByEmail = await GuardianRegistrationModel.findOne({ where: { email } });
    if (existingByEmail && existingByEmail.status === 'approved') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Guardian already registered with this email' }
      });
      return;
    }

    const existingByPhone = await GuardianRegistrationModel.findOne({ where: { phoneNo } });
    if (existingByPhone && existingByPhone.status === 'approved') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_PHONE', message: 'Guardian already registered with this phone number' }
      });
      return;
    }

    const existingByNationalId = await GuardianRegistrationModel.findOne({ where: { nationalId } });
    if (existingByNationalId && existingByNationalId.status === 'approved') {
      res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_NATIONAL_ID', message: 'Guardian already registered with this National ID' }
      });
      return;
    }

    // Also check in approved Users table
    const existingUser = await UserModel.findOne({
      where: {
        [Op.or]: [{ email }, { phoneNo }, { nationalId }]
      }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_REGISTERED', message: 'Guardian already registered and approved' }
      });
      return;
    }

    // Store data temporarily in the database and send OTP
    const tempId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Clean up any stale or incomplete pending registration for this email or phone to avoid unique index violations
    await PendingRegistrationModel.destroy({
      where: {
        [Op.or]: [{ email }, { phoneNo }]
      }
    });

    // Hash password immediately for security in the pending table
    const passwordHash = await bcrypt.hash(password, 10);

    await PendingRegistrationModel.create({
      tempId,
      fullName,
      email,
      phoneNo,
      passwordHash,
      nationalId,
      studentName,
      relationshipType,
      otpVerified: false,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
    });

    // Generate and send OTP
    const otp = await OTPService.generateOTP(tempId);
    try {
      await OTPService.sendOTP(email, otp);
      res.status(200).json({
        success: true,
        message: 'Validation passed. Verification code sent to email.',
        data: {
          tempId,
          studentName
        }
      });
    } catch (mailError) {
      logger.error('Failed to send OTP email, using demo fallback:', mailError);
      res.status(200).json({
        success: true,
        message: `Validation passed. (Note: Email delivery failed, please use code: ${otp} to verify)`,
        data: {
          tempId,
          studentName,
          devOtp: otp
        }
      });
    }

  } catch (error: any) {
    logger.error('Validate registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error?.message || 'Failed to validate registration' }
    });
  }
};

/**
 * Step 2: Verify OTP
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempId, otp } = req.body;

    if (!tempId || !otp) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_OTP', message: 'Temp ID and OTP are required' }
      });
      return;
    }

    const isValid = await OTPService.verifyOTP(tempId, otp);

    if (!isValid) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' }
      });
      return;
    }

    // Mark as verified in the database
    const pendingReg = await PendingRegistrationModel.findByPk(tempId);
    if (pendingReg) {
      await pendingReg.update({ otpVerified: true });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'EXPIRED_SESSION', message: 'Registration session expired' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'OTP_ERROR', message: 'Failed to verify OTP' }
    });
  }
};

/**
 * Step 3: Upload documents and complete registration
 */
export const completeRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempId } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!tempId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_TEMP_ID', message: 'Temp ID is required' }
      });
      return;
    }

    const data = await PendingRegistrationModel.findByPk(tempId);
    if (!data) {
      res.status(400).json({
        success: false,
        error: { code: 'EXPIRED_SESSION', message: 'Registration session expired' }
      });
      return;
    }

    if (!data.otpVerified) {
      res.status(403).json({
        success: false,
        error: { code: 'OTP_NOT_VERIFIED', message: 'OTP verification required' }
      });
      return;
    }

    // Check uploaded files
    if (!files || !files.certificate || !files.idFront || !files.idBack) {
      logger.error('Missing documents in request:', {
        hasFiles: !!files,
        cert: files?.certificate?.length,
        idFront: files?.idFront?.length,
        idBack: files?.idBack?.length
      });
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_DOCUMENTS', message: 'All documents are required: certificate, ID front, ID back' }
      });
      return;
    }

    // Password is already hashed in Step 1
    const passwordHash = data.passwordHash;

    try {
      // Delete any previous unapproved registrations with the same unique fields to prevent constraint errors
      await GuardianRegistrationModel.destroy({
        where: {
          [Op.or]: [
            { email: data.email },
            { phoneNo: data.phoneNo },
            { nationalId: data.nationalId }
          ],
          status: { [Op.ne]: 'approved' } // Never delete approved accounts
        }
      });

      // Create registration record
      console.log('Attempting to create GuardianRegistration record...');
      const registration = await GuardianRegistrationModel.create({
        fullName: data.fullName,
        email: data.email,
        phoneNo: data.phoneNo,
        passwordHash,
        nationalId: data.nationalId,
        studentId: null,
        studentName: data.studentName,
        relationshipType: data.relationshipType,
        certificateDocumentPath: files.certificate[0].path,
        idFrontPath: files.idFront[0].path,
        idBackPath: files.idBack[0].path,
        status: 'pending',
        correctionAttempts: 2
      });
      console.log('Registration record created successfully:', registration.registrationId);

      // Log the action
      await SystemLogModel.create({
        userId: null,
        action: 'GUARDIAN_REGISTRATION_SUBMITTED',
        tableName: 'GuardianRegistrations',
        recordId: registration.registrationId,
        newValues: { email: data.email, studentName: data.studentName }
      });
      console.log('System log created successfully.');

      // Clean up
      await PendingRegistrationModel.destroy({ where: { tempId } });
      await OTPService.clearOTP(tempId);

      res.status(201).json({
        success: true,
        message: 'Registration submitted successfully. Pending registrar review.',
        data: {
          registrationId: registration.registrationId,
          status: registration.status,
          correctionAttempts: registration.correctionAttempts
        }
      });
    } catch (dbError: any) {
      logger.error('Database error during completeRegistration:', {
        message: dbError.message,
        name: dbError.name,
        stack: dbError.stack,
        errors: dbError.errors
      });
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error: any) {
    logger.error('Complete registration fatal error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REGISTRATION_ERROR', message: error.message || 'Failed to complete registration' }
    });
  }
};

/**
 * Resend OTP
 */
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tempId } = req.body;
    const data = await PendingRegistrationModel.findByPk(tempId);

    if (!data) {
      res.status(400).json({
        success: false,
        error: { code: 'EXPIRED_SESSION', message: 'Registration session expired' }
      });
      return;
    }

    const otp = await OTPService.generateOTP(tempId);
    try {
      await OTPService.sendOTP(data.email, otp);
      res.status(200).json({
        success: true,
        message: 'OTP resent successfully'
      });
    } catch (mailError) {
      logger.error('Failed to resend OTP email, using demo fallback:', mailError);
      res.status(200).json({
        success: true,
        message: `OTP resent successfully. (Note: Email delivery failed, please use code: ${otp} to verify)`,
        data: {
          devOtp: otp
        }
      });
    }

  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'OTP_ERROR', message: 'Failed to resend OTP' }
    });
  }
};

/**
 * Get registration status (for guardians to check their status)
 */
export const getRegistrationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, nationalId } = req.query;

    const registration = await GuardianRegistrationModel.findOne({
      where: { email: email as string, nationalId: nationalId as string }
    });

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: registration.status,
        rejectionReason: registration.rejectionReason,
        correctionAttempts: registration.correctionAttempts,
        reviewedAt: registration.reviewedAt
      }
    });

  } catch (error) {
    logger.error('Get registration status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATUS_ERROR', message: 'Failed to get registration status' }
    });
  }
};

/**
 * Update registration (correction flow)
 */
export const updateRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const updateData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const registration = await GuardianRegistrationModel.findByPk(registrationId);

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    // Check if correction is allowed
    if (registration.status !== 'correction_required') {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_CORRECTION_MODE', message: 'Registration is not in correction mode' }
      });
      return;
    }

    if (registration.correctionAttempts <= 0) {
      await registration.update({ status: 'locked' });
      res.status(403).json({
        success: false,
        error: { code: 'LOCKED', message: 'Maximum correction attempts exceeded. Account locked.' }
      });
      return;
    }

    // Prepare update
    const updates: any = {
      status: 'pending',
      correctionAttempts: registration.correctionAttempts - 1
    };

    if (updateData.fullName) updates.fullName = updateData.fullName;
    if (updateData.phoneNo) updates.phoneNo = updateData.phoneNo;
    if (updateData.studentName) updates.studentName = updateData.studentName;
    if (updateData.relationshipType) updates.relationshipType = updateData.relationshipType;

    // Update document paths if new files uploaded
    if (files) {
      if (files.certificate) updates.certificateDocumentPath = files.certificate[0].path;
      if (files.idFront) updates.idFrontPath = files.idFront[0].path;
      if (files.idBack) updates.idBackPath = files.idBack[0].path;
    }

    await registration.update(updates);

    // Log correction
    await SystemLogModel.create({
      userId: null,
      action: 'GUARDIAN_REGISTRATION_CORRECTED',
      tableName: 'GuardianRegistrations',
      recordId: registration.registrationId,
      newValues: { correctionAttempts: updates.correctionAttempts }
    });

    res.status(200).json({
      success: true,
      message: 'Registration updated successfully. Pending review.',
      data: {
        status: registration.status,
        remainingAttempts: updates.correctionAttempts
      }
    });

  } catch (error) {
    logger.error('Update registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update registration' }
    });
  }
};
