import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { GuardianRegistrationModel } from '../models/GuardianRegistration';
import { StudentModel } from '../models/Student';
import { ClassroomModel } from '../models/Classroom';
import { UserModel } from '../models/User';
import { SystemLogModel } from '../models/SystemLog';
import { logger } from '../utils/logger';
import { UserRole } from '../types';
import { Op } from 'sequelize';

/**
 * Get all pending registrations for registrar review
 */
export const getPendingRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: registrations, count } = await GuardianRegistrationModel.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: offset
    });

    res.status(200).json({
      success: true,
      data: {
        registrations,
        total: count,
        page: Number(page),
        totalPages: Math.ceil(count / Number(limit))
      }
    });

  } catch (error) {
    logger.error('Get pending registrations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch registrations' }
    });
  }
};

/**
 * Get single registration details
 */
export const getRegistrationDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;

    const registration = await GuardianRegistrationModel.findByPk(registrationId);

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    // Get student details if linked
    let student = null;
    if (registration.studentId) {
      student = await StudentModel.findByPk(registration.studentId);
    }

    res.status(200).json({
      success: true,
      data: {
        registration,
        student
      }
    });

  } catch (error) {
    logger.error('Get registration details error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch registration details' }
    });
  }
};

/**
 * Approve registration and create user account
 */
export const approveRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const registrarId = (req as any).user?.userId;

    const registration = await GuardianRegistrationModel.findByPk(registrationId);

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    if (registration.status !== 'pending' && registration.status !== 'correction_required') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Registration is not pending review' }
      });
      return;
    }

    const { studentId } = req.body;

    if (!studentId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_STUDENT_ID', message: 'You must select a student to link to this guardian' }
      });
      return;
    }

    // Find student
    const student = await StudentModel.findByPk(studentId);

    if (!student) {
      res.status(400).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'The selected student was not found in the database' }
      });
      return;
    }

    // Create user account
    const user = await UserModel.create({
      email: registration.email,
      passwordHash: registration.passwordHash,
      role: UserRole.GUARDIAN,
      fullName: registration.fullName,
      phoneNo: registration.phoneNo,
      address: '', // Can be updated later
      nationalId: registration.nationalId,
      isActive: true,
      createdAt: new Date()
    });

    // Update student with guardianId
    await student.update({ guardianId: user.userId });

    // Update registration status and studentId
    await registration.update({
      status: 'approved',
      studentId: student.studentId,
      reviewedBy: registrarId,
      reviewedAt: new Date()
    });

    // Log the action
    await SystemLogModel.create({
      userId: registrarId,
      action: 'GUARDIAN_REGISTRATION_APPROVED',
      tableName: 'GuardianRegistrations',
      recordId: registration.registrationId,
      newValues: { userId: user.userId, email: registration.email }
    });

    res.status(200).json({
      success: true,
      message: 'Registration approved successfully. Guardian account activated.',
      data: {
        userId: user.userId,
        email: user.email,
        status: 'approved'
      }
    });

  } catch (error) {
    logger.error('Approve registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'APPROVAL_ERROR', message: 'Failed to approve registration' }
    });
  }
};

/**
 * Reject registration or request correction
 */
export const rejectRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId } = req.params;
    const { reason, requestCorrection = false } = req.body;
    const registrarId = (req as any).user?.userId;

    if (!reason) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_REASON', message: 'Rejection reason is required' }
      });
      return;
    }

    const registration = await GuardianRegistrationModel.findByPk(registrationId);

    if (!registration) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    const newStatus = requestCorrection ? 'correction_required' : 'rejected';
    const remainingAttempts = requestCorrection ? registration.correctionAttempts : 0;

    await registration.update({
      status: newStatus,
      rejectionReason: reason,
      reviewedBy: registrarId,
      reviewedAt: new Date()
    });

    // Log the action
    await SystemLogModel.create({
      userId: registrarId,
      action: requestCorrection ? 'GUARDIAN_REGISTRATION_CORRECTION_REQUESTED' : 'GUARDIAN_REGISTRATION_REJECTED',
      tableName: 'GuardianRegistrations',
      recordId: registration.registrationId,
      newValues: { status: newStatus, reason }
    });

    res.status(200).json({
      success: true,
      message: requestCorrection
        ? 'Correction requested. Guardian has been notified.'
        : 'Registration rejected.',
      data: {
        status: newStatus,
        rejectionReason: reason,
        remainingAttempts: requestCorrection ? remainingAttempts : 0
      }
    });

  } catch (error) {
    logger.error('Reject registration error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REJECTION_ERROR', message: 'Failed to reject registration' }
    });
  }
};

/**
 * Get registration statistics for registrar dashboard
 */
export const getRegistrationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalPending,
      totalApproved,
      totalRejected,
      totalCorrectionRequired,
      totalLocked
    ] = await Promise.all([
      GuardianRegistrationModel.count({ where: { status: 'pending' } }),
      GuardianRegistrationModel.count({ where: { status: 'approved' } }),
      GuardianRegistrationModel.count({ where: { status: 'rejected' } }),
      GuardianRegistrationModel.count({ where: { status: 'correction_required' } }),
      GuardianRegistrationModel.count({ where: { status: 'locked' } })
    ]);

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await GuardianRegistrationModel.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalPending,
        totalApproved,
        totalRejected,
        totalCorrectionRequired,
        totalLocked,
        recentRegistrations
      }
    });

  } catch (error) {
    logger.error('Get registration stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: 'Failed to fetch registration statistics' }
    });
  }
};

/**
 * Search students (for registrar to link during approval)
 */
export const searchStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || (query as string).length < 2) {
      res.status(200).json({
        success: true,
        data: []
      });
      return;
    }

    const students = await StudentModel.findAll({
      where: {
        fullName: {
          [Op.like]: `%${query}%`
        },
        guardianId: null // Only show students who don't have a linked guardian yet
      },
      limit: 10
    });

    res.status(200).json({
      success: true,
      data: students
    });

  } catch (error) {
    logger.error('Search students error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Failed to search students' }
    });
  }
};

/**
 * Bulk import students from a CSV file (multipart/form-data, field name: "file")
 * CSV columns (flexible naming supported):
 *   fullName / full_name / firstName+lastName
 *   dob / dateOfBirth / date_of_birth / birthdate
 *   emergencyContact / emergency_contact / contact (default: 'N/A')
 *   classLevel / class_level / classroom / grade  (must match existing Classroom.classLevel)
 */
export const importStudentsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No CSV file uploaded. Send the file in a field named "file".' }
      });
      return;
    }

    const csvText = req.file.buffer.toString('utf-8');
    const lines = csvText.split(/\r?\n/).filter((l: string) => l.trim() !== '');

    if (lines.length < 2) {
      res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CSV', message: 'CSV file must have a header row and at least one data row.' }
      });
      return;
    }

    // Normalise header names
    const headers = lines[0].split(',').map((h: string) =>
      h.trim().toLowerCase().replace(/[\s_-]+/g, '')
    );

    const getField = (cols: string[], keys: string[]): string => {
      for (const key of keys) {
        const idx = headers.indexOf(key);
        if (idx !== -1 && cols[idx]) return cols[idx].trim();
      }
      return '';
    };

    const results = { successful: 0, duplicates: 0, failed: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim());

      // Name resolution
      const firstName    = getField(cols, ['firstname', 'first']);
      const lastName     = getField(cols, ['lastname', 'last']);
      const fullName     = getField(cols, ['fullname', 'name']) || `${firstName} ${lastName}`.trim();

      // Other fields — map to actual DB column names
      const dob              = getField(cols, ['dob', 'dateofbirth', 'birthdate', 'dateofbirth']);
      const emergencyContact = getField(cols, ['emergencycontact', 'contact', 'phone', 'emergency']) || 'N/A';
      const classLevelStr    = getField(cols, ['classlevel', 'classroom', 'class', 'grade', 'level']);

      if (!fullName) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: missing student name`);
        continue;
      }

      if (!dob) {
        results.failed++;
        results.errors.push(`Row ${i + 1} (${fullName}): missing date of birth (dob)`);
        continue;
      }

      try {
        // Look up an existing classroom — we cannot auto-create because teacherId is required
        let classId: number | null = null;
        if (classLevelStr) {
          const classroom = await ClassroomModel.findOne({
            where: { classLevel: classLevelStr } as any
          });
          if (classroom) {
            classId = (classroom as any).classId;
          } else {
            results.failed++;
            results.errors.push(`Row ${i + 1} (${fullName}): classroom "${classLevelStr}" not found`);
            continue;
          }
        } else {
          results.failed++;
          results.errors.push(`Row ${i + 1} (${fullName}): missing classLevel/classroom column`);
          continue;
        }

        // Duplicate check: same fullName + dob
        const existing = await StudentModel.findOne({
          where: { fullName, dob } as any
        });

        if (existing) {
          results.duplicates++;
          continue;
        }

        await StudentModel.create({
          fullName,
          dob,
          emergencyContact,
          classId,
          guardianId: null
        } as any);

        results.successful++;
      } catch (rowError: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1} (${fullName}): ${rowError.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import complete: ${results.successful} added, ${results.duplicates} duplicates skipped, ${results.failed} failed.`
    });

  } catch (error) {
    logger.error('Import students CSV error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import students from CSV.' }
    });
  }
};

