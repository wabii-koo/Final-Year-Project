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
import { sequelize } from '../database/connection';
import { EmailService } from '../services/emailService';

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
  const transaction = await sequelize.transaction();
  try {
    const { registrationId } = req.params;
    const registrarId = (req as any).user?.userId;

    const registration = await GuardianRegistrationModel.findByPk(registrationId, { transaction });

    if (!registration) {
      await transaction.rollback();
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Registration not found' }
      });
      return;
    }

    if (registration.status !== 'pending' && registration.status !== 'correction_required') {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'Registration is not pending review' }
      });
      return;
    }

    const { studentId } = req.body;

    if (!studentId) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_STUDENT_ID', message: 'You must select a student to link to this guardian' }
      });
      return;
    }

    // Lock the student row to prevent race conditions
    const student = await StudentModel.findByPk(studentId, { transaction, lock: transaction.LOCK.UPDATE });

    if (!student) {
      await transaction.rollback();
      res.status(400).json({
        success: false,
        error: { code: 'STUDENT_NOT_FOUND', message: 'The selected student was not found in the database' }
      });
      return;
    }

    if (student.guardianId) {
      const existingGuardian = await UserModel.findByPk(student.guardianId, { transaction });
      await transaction.rollback();
      res.status(409).json({
        success: false,
        error: {
          code: 'STUDENT_ALREADY_LINKED',
          message: existingGuardian
            ? `Selected student is already assigned to guardian ${existingGuardian.fullName}. Choose a different student or reject this request.`
            : 'Selected student is already linked to another guardian. Choose a different student or reject this request.'
        }
      });
      return;
    }

    // Check if user already exists to avoid unique constraint violation on email
    let user = await UserModel.findOne({
      where: { email: registration.email },
      transaction
    });

    if (!user) {
      // Create user account inside transaction
      user = await UserModel.create({
        email: registration.email,
        passwordHash: registration.passwordHash,
        role: UserRole.GUARDIAN,
        fullName: registration.fullName,
        phoneNo: registration.phoneNo,
        address: '', // Can be updated later
        nationalId: registration.nationalId,
        isActive: true,
        createdAt: new Date()
      }, { transaction });
    } else {
      // Ensure the existing user has the correct guardian role and details if needed
      await user.update({
        role: UserRole.GUARDIAN,
        fullName: registration.fullName,
        phoneNo: registration.phoneNo || user.phoneNo,
        nationalId: registration.nationalId || user.nationalId,
        isActive: true
      }, { transaction });
    }

    // Update student with guardianId
    await student.update({ guardianId: user.userId }, { transaction });

    // Update registration status and studentId
    await registration.update({
      status: 'approved',
      studentId: student.studentId,
      reviewedBy: registrarId,
      reviewedAt: new Date()
    }, { transaction });

    // Log the action
    await SystemLogModel.create({
      userId: registrarId,
      action: 'GUARDIAN_REGISTRATION_APPROVED',
      tableName: 'GuardianRegistrations',
      recordId: registration.registrationId,
      newValues: { userId: user.userId, email: registration.email }
    }, { transaction });

    await transaction.commit();

    // Send email notification to guardian asynchronously (outside transaction)
    EmailService.sendApprovalEmail(registration.email, registration.fullName, student.fullName).catch(err => {
      logger.error('Failed to send approval email notification:', err);
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
    try { await transaction.rollback(); } catch (e) {}
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

    // Send email notification to guardian asynchronously
    EmailService.sendRejectionEmail(
      registration.email,
      registration.fullName,
      reason,
      requestCorrection,
      registration.registrationId
    ).catch(err => {
      logger.error('Failed to send rejection/correction email notification:', err);
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
    const query = String(req.query.query || '').trim();

    if (!query) {
      res.status(200).json({
        success: true,
        data: []
      });
      return;
    }

    const students = await StudentModel.findAll({
      where: {
        fullName: {
          [Op.iLike]: `%${query}%`
        }
      },
      include: [
        {
          model: UserModel,
          as: 'guardian',
          attributes: ['fullName', 'email', 'phoneNo', 'nationalId', 'address']
        },
        {
          model: ClassroomModel,
          as: 'classroom',
          attributes: ['classLevel']
        }
      ],
      limit: 20
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

const parseCsvRows = (csvText: string): string[][] => {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      row.push(current)
      rows.push(row)
      row = []
      current = ''
      continue
    }

    current += char
  }

  if (current !== '' || row.length > 0) {
    row.push(current)
    rows.push(row)
  }

  return rows
}

const normalizeHeader = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, '')

const normalizeValue = (value: string): string =>
  value.replace(/\uFEFF/g, '').trim()

const normalizePhone = (value: string): string => {
  let cleaned = normalizeValue(value)
  if (/^[\d\.eE+\-]+$/.test(cleaned)) {
    const num = Number(cleaned)
    if (!Number.isNaN(num)) {
      cleaned = String(Math.trunc(num))
    }
  }
  return cleaned.replace(/[^(\+\d)]/g, '')
}

const normalizeClassLevel = (value: string): string =>
  value.trim().toLowerCase().replace(/[\s_-]+/g, '')

const parseDateValue = (value: string): string | null => {
  const cleaned = normalizeValue(value)
  if (!cleaned) return null

  const excelSerial = Number(cleaned)
  if (!Number.isNaN(excelSerial) && /^\d+(\.0+)?$/.test(cleaned)) {
    if (excelSerial > 31 && excelSerial < 60000) {
      const epoch = Date.UTC(1899, 11, 30)
      const dt = new Date(epoch + excelSerial * 86400000)
      if (!Number.isNaN(dt.getTime())) {
        return dt.toISOString().slice(0, 10)
      }
    }
  }

  const isoDate = new Date(cleaned)
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate.toISOString().slice(0, 10)
  }

  const parts = cleaned.split(/[\/\-.]/).map((p) => Number(p))
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    let [part1, part2, part3] = parts
    let year = part3
    let month = part2
    let day = part1

    if (year < 100) {
      year += year < 50 ? 2000 : 1900
    }

    if (month > 12 && day <= 12) {
      month = part1
      day = part2
    }

    const dt = new Date(Date.UTC(year, month - 1, day))
    if (!Number.isNaN(dt.getTime())) {
      return dt.toISOString().slice(0, 10)
    }
  }

  return null
}

const findClassroomId = async (classLevelStr: string): Promise<number | null> => {
  const exact = await ClassroomModel.findOne({
    where: { classLevel: { [Op.iLike]: classLevelStr } } as any
  })
  if (exact) return (exact as any).classId

  const normalizedInput = normalizeClassLevel(classLevelStr)
  const allClasses = await ClassroomModel.findAll()
  const match = allClasses.find((c: any) => normalizeClassLevel(c.classLevel) === normalizedInput)
  if (match) return (match as any).classId

  // Dynamically create the classroom if not found
  const teacherUser = await UserModel.findOne({
    where: { role: { [Op.in]: ['teacher', 'homeroom_teacher'] } } as any
  })

  if (!teacherUser) {
    logger.warn(`Could not auto-create classroom "${classLevelStr}" because no teacher user was found.`)
    return null
  }

  try {
    const newClass = await ClassroomModel.create({
      classLevel: classLevelStr.trim(),
      teacherId: (teacherUser as any).userId,
      homeroomTeacherId: (teacherUser as any).userId,
      academicYear: new Date().getFullYear().toString()
    } as any)
    logger.info(`Auto-created missing classroom "${classLevelStr}" (ID: ${newClass.classId}) with teacher ID ${(teacherUser as any).userId}`)
    return (newClass as any).classId
  } catch (err: any) {
    logger.error(`Error auto-creating classroom "${classLevelStr}":`, err)
    return null
  }
}

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
    const rows = parseCsvRows(csvText).filter((row) => row.some((cell) => normalizeValue(cell) !== ''))

    if (rows.length < 2) {
      res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CSV', message: 'CSV file must have a header row and at least one data row.' }
      });
      return;
    }

    const headers = rows[0].map(normalizeHeader)

    const getField = (cols: string[], keys: string[]): string => {
      for (const key of keys) {
        const idx = headers.indexOf(key)
        if (idx !== -1 && cols[idx]) return normalizeValue(cols[idx])
      }
      return ''
    }

    const results = {
      successful: 0,
      duplicates: 0,
      failed: 0,
      errors: [] as string[],
      created: [] as Array<{ studentId: number; fullName: string; classId: number }>
    }

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex++) {
      const cols = rows[rowIndex]
      const firstName = getField(cols, ['firstname', 'first'])
      const lastName = getField(cols, ['lastname', 'last'])
      const fullName = getField(cols, ['fullname', 'name']) || `${firstName} ${lastName}`.trim()
      const rawDob = getField(cols, ['dob', 'dateofbirth', 'birthdate'])
      const rawEmergencyContact = getField(cols, ['emergencycontact', 'contact', 'phone', 'emergency'])
      const classLevelStr = getField(cols, ['classlevel', 'classroom', 'class', 'grade', 'level'])
      const rowNumber = rowIndex + 1

      if (!fullName) {
        results.failed++
        results.errors.push(`Row ${rowNumber}: missing student name`)
        continue
      }

      const dob = parseDateValue(rawDob)
      if (!dob) {
        results.failed++
        results.errors.push(`Row ${rowNumber} (${fullName}): invalid or missing date of birth (dob) value "${rawDob}"`)
        continue
      }

      const emergencyContact = rawEmergencyContact ? normalizePhone(rawEmergencyContact) : 'N/A'
      if (!classLevelStr) {
        results.failed++
        results.errors.push(`Row ${rowNumber} (${fullName}): missing classLevel/classroom column`)
        continue
      }

      try {
        const classId = await findClassroomId(classLevelStr)
        if (!classId) {
          results.failed++
          results.errors.push(`Row ${rowNumber} (${fullName}): classroom "${classLevelStr}" not found`)
          continue
        }

        const existing = await StudentModel.findOne({
          where: { fullName, dob } as any
        })

        if (existing) {
          results.duplicates++
          continue
        }

        const student = await StudentModel.create({
          fullName,
          dob,
          emergencyContact,
          classId,
          guardianId: null
        } as any)

        results.successful++
        results.created.push({ studentId: student.studentId, fullName: student.fullName, classId: student.classId })
      } catch (rowError: any) {
        results.failed++
        results.errors.push(`Row ${rowNumber} (${fullName}): ${rowError.message}`)
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: `Import complete: ${results.successful} added, ${results.duplicates} duplicates skipped, ${results.failed} failed.`
    })
  } catch (error) {
    logger.error('Import students CSV error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'IMPORT_ERROR', message: 'Failed to import students from CSV.' }
    })
  }
};

/**
 * Export all students from the database as a CSV file
 */
export const exportStudentsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await StudentModel.findAll({
      include: [
        {
          model: ClassroomModel,
          as: 'classroom',
          attributes: ['classLevel']
        }
      ],
      order: [['fullName', 'ASC']]
    });

    let csvContent = 'fullName,dob,emergencyContact,classLevel\n';
    
    for (const student of students as any[]) {
      const name = student.fullName.replace(/"/g, '""');
      const dob = student.dob;
      const contact = student.emergencyContact || 'N/A';
      const classLevel = student.classroom?.classLevel || 'N/A';
      
      csvContent += `"${name}",${dob},"${contact}","${classLevel}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    res.status(200).send(csvContent);

  } catch (error) {
    logger.error('Export students CSV error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ERROR', message: 'Failed to export students.' }
    });
  }
};

